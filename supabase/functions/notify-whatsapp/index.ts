import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event, client_name, client_email, client_whatsapp, status } = await req.json();

    // Get the two admin phone numbers from secrets
    const phone1 = Deno.env.get("ADMIN_PHONE_1");
    const phone2 = Deno.env.get("ADMIN_PHONE_2");
    const callmebot_api_key_1 = Deno.env.get("CALLMEBOT_API_KEY_1");
    const callmebot_api_key_2 = Deno.env.get("CALLMEBOT_API_KEY_2");

    if (!phone1 || !phone2 || !callmebot_api_key_1 || !callmebot_api_key_2) {
      console.log("WhatsApp notification secrets not configured, skipping.");
      return new Response(JSON.stringify({ success: false, reason: "secrets_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let message = "";
    if (event === "new_signup") {
      message = `🆕 *New Client Signup*\n\nName: ${client_name}\nEmail: ${client_email}\nWhatsApp: ${client_whatsapp}`;
    } else if (event === "auto_approved") {
      message = `✅ *Client Auto-Approved*\n\nName: ${client_name}\nEmail: ${client_email}\nStatus: ${status}`;
    } else if (event === "status_change") {
      message = `📊 *Status Update*\n\nClient: ${client_name}\nNew Status: ${status}`;
    } else {
      message = `📬 DAFFY XAU Update: ${event} for ${client_name}`;
    }

    const encodedMessage = encodeURIComponent(message);

    // Send to both admin phones using CallMeBot free WhatsApp API
    const results = await Promise.allSettled([
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone1}&text=${encodedMessage}&apikey=${callmebot_api_key_1}`),
      fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone2}&text=${encodedMessage}&apikey=${callmebot_api_key_2}`),
    ]);

    console.log("WhatsApp notifications sent:", results.map((r) => r.status));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
