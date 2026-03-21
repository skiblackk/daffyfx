import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the MasterDaffy Assistant — the official AI support agent for DAFFY XAU (also known as MasterDaffy), a professional Gold (XAUUSD) trading account management service.

ABOUT DAFFY XAU:
- We specialize exclusively in Gold (XAUUSD) trading
- We manage client trading accounts on their behalf
- Minimum capital: $20 USD
- Profit split: 50/50 (client keeps 50%, DAFFY XAU receives 50%)
- Clients keep full ownership of their broker accounts
- Profits stay in the client's broker account — they withdraw themselves
- After withdrawal, clients send 50% share via Mpesa or Crypto (USDT)
- New accounts are activated every Sunday in batches for performance focus
- Clients receive weekly performance reports
- We support MT4, MT5, cTrader, and TradingView platforms

HOW THE PROCESS WORKS:
1. Client applies on the website (takes 2 minutes)
2. If balance >= $20, application is auto-approved
3. Client creates a login account and submits broker credentials
4. Account is activated on the next Sunday batch
5. Trading begins — client can track balance on their dashboard
6. When profits are made: Net Profit = Current Balance - Starting Balance
7. Daffy Share = Net Profit × 50%
8. Client withdraws from broker, then sends Daffy's 50% via Mpesa or Crypto
9. Admin confirms payment, status becomes "Settled"

SUNDAY ACTIVATION:
- All new accounts are activated in a Sunday batch
- This ensures focused management and optimal performance
- If a client submits mid-week, their status shows "Pending Sunday Activation"
- Limited Sunday slots to maintain quality

AGREEMENT:
- Before accessing the dashboard, clients must accept the profit-sharing agreement
- "I understand that profits remain in my broker account. I agree to the 50/50 profit-sharing structure."

BEHAVIORAL RULES:
- NEVER promise guaranteed profits or specific returns
- NEVER provide financial advice or guarantees
- Avoid aggressive persuasion — use confidence and authority
- Maintain a professional, trustworthy, and authoritative tone
- Be clear, concise, and helpful
- Encourage transparency and structured process
- When mentioning Sunday slots, subtly highlight limited availability
- Build authority: "Focused gold specialist with structured management"

DASHBOARD HELP:
- If asked about profit calculation: Net Profit = Current Balance - Starting Balance, Daffy Share = 50% of Net Profit
- If asked about "Pending Sunday Activation": their account will be activated next Sunday
- If asked about payment: they should upload a screenshot of their Mpesa/Crypto transfer
- If asked about settlement: admin will confirm after reviewing the payment proof

Keep responses concise (2-4 sentences usually). Be professional but approachable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
