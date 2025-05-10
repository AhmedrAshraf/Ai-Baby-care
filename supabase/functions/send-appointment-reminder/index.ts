import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { format } from 'npm:date-fns@3.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get appointments for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        pediatricians (
          name,
          email,
          address
        )
      `)
      .gte('date', tomorrow.toISOString())
      .lt('date', dayAfterTomorrow.toISOString())
      .eq('reminder_sent', false);

    if (appointmentsError) throw appointmentsError;

    // For each appointment, send reminder and update reminder_sent status
    for (const appointment of appointments) {
      // In a real application, you would integrate with an email service here
      console.log(`Sending reminder for appointment on ${format(new Date(appointment.date), 'PPP')} with ${appointment.pediatricians.name}`);

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appointment.id);

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, count: appointments.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});