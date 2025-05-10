import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { format, subDays } from "npm:date-fns@3.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { appointmentId } = await req.json();
    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        pediatricians (
          name,
          email
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError) throw appointmentError;
    if (!appointment) throw new Error("Appointment not found");

    const userId = appointment.user_id;
    const sevenDaysAgo = subDays(new Date(), 7);

    // Get sleep data
    const { data: sleepData, error: sleepError } = await supabase
      .from("sleep_records")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", sevenDaysAgo.toISOString())
      .order("start_time", { ascending: false });

    if (sleepError) throw sleepError;

    // Get health logs
    const { data: healthLogs, error: healthError } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .in("type", ["temperature", "medication", "milestone"])
      .gte("start_time", sevenDaysAgo.toISOString())
      .order("start_time", { ascending: false });

    if (healthError) throw healthError;

    // Get growth measurements
    const { data: growthData, error: growthError } = await supabase
      .from("growth_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);

    if (growthError) throw growthError;

    // Generate email content
    let emailContent = `Health Summary for Appointment on ${format(new Date(appointment.date), "MMMM d, yyyy")}\n\n`;

    // Add sleep patterns
    if (sleepData?.length) {
      emailContent += "Sleep Patterns (Last 7 Days):\n";
      const totalSleep = sleepData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const avgSleep = totalSleep / sleepData.length;
      emailContent += `- Average sleep duration: ${Math.round(avgSleep / 60)}h ${Math.round(avgSleep % 60)}m\n`;
      emailContent += `- Number of naps: ${sleepData.filter(s => s.type === "nap").length}\n`;
      emailContent += `- Night sleep sessions: ${sleepData.filter(s => s.type === "night").length}\n\n`;
    }

    // Add latest growth measurements
    if (growthData?.length) {
      const latestGrowth = growthData[0];
      emailContent += "Latest Growth Measurements:\n";
      if (latestGrowth.weight) {
        emailContent += `- Weight: ${latestGrowth.weight}${latestGrowth.weight_unit}\n`;
      }
      if (latestGrowth.height) {
        emailContent += `- Height: ${latestGrowth.height}${latestGrowth.height_unit}\n`;
      }
      if (latestGrowth.head_circumference) {
        emailContent += `- Head Circumference: ${latestGrowth.head_circumference}${latestGrowth.head_unit}\n`;
      }
      emailContent += "\n";
    }

    // Add health events
    if (healthLogs?.length) {
      emailContent += "Recent Health Events:\n";
      healthLogs.forEach(log => {
        const date = format(new Date(log.start_time), "MMM d");
        const type = log.type.charAt(0).toUpperCase() + log.type.slice(1);
        emailContent += `- ${date}: ${type}${log.notes ? ` - ${log.notes}` : ""}\n`;
      });
      emailContent += "\n";
    }

    // Add appointment notes
    if (appointment.notes) {
      emailContent += "Appointment Notes:\n";
      emailContent += appointment.notes + "\n\n";
    }

    // In a real application, you would send this email using an email service
    // For now, we'll return the content that would be emailed
    return new Response(
      JSON.stringify({
        success: true,
        recipient: appointment.pediatricians.email,
        subject: `Health Summary for Appointment on ${format(new Date(appointment.date), "MMMM d, yyyy")}`,
        content: emailContent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});