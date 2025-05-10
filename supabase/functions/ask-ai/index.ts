import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "npm:gpt-3-encoder@1.1.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBMD_API_KEY = Deno.env.get("WEBMD_API_KEY");
const BABYCENTER_API_KEY = Deno.env.get("BABYCENTER_API_KEY");

async function searchWebMD(query: string) {
  try {
    const response = await fetch(`https://api.webmd.com/search?query=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${WEBMD_API_KEY}`,
      },
    });
    const data = await response.json();
    return data.results?.[0]?.content || null;
  } catch (error) {
    console.error("WebMD API error:", error);
    return null;
  }
}

async function searchBabyCenter(query: string) {
  try {
    const response = await fetch(`https://api.babycenter.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${BABYCENTER_API_KEY}`,
      },
    });
    const data = await response.json();
    return data.results?.[0]?.content || null;
  } catch (error) {
    console.error("BabyCenter API error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      throw new Error("Query is required");
    }

    // Search both WebMD and BabyCenter
    const [webmdResult, babycenterResult] = await Promise.all([
      searchWebMD(query),
      searchBabyCenter(query),
    ]);

    // Combine and format results
    let response = "";
    let sources = [];

    if (webmdResult) {
      response += `According to WebMD:\n${webmdResult}\n\n`;
      sources.push("WebMD");
    }

    if (babycenterResult) {
      response += `According to BabyCenter:\n${babycenterResult}\n\n`;
      sources.push("BabyCenter");
    }

    if (!response) {
      response = "I apologize, but I couldn't find specific information about that from our trusted sources. Please consult with your pediatrician for personalized medical advice.";
    } else {
      response += "\nPlease note: This information is for educational purposes only. Always consult with your pediatrician for medical advice specific to your baby.";
    }

    return new Response(
      JSON.stringify({
        response,
        sources,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});