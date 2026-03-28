import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are LoopVerse's customer support assistant. You help buyers with: order tracking, return policies, shipping info, product questions. Be concise, friendly, and helpful. If you can't help, suggest contacting the seller directly via chat.

LoopVerse policies:
- Free shipping on orders over $50
- 30-day returns on all items
- All sellers are verified before they can list products
- Buyer protection on every purchase
- Standard shipping is $5.99
- Orders typically ship within 2-3 business days

Keep responses short (2-4 sentences). Do not use emojis.`;

/**
 * Rule-based fallback responses when OpenAI key is not configured.
 */
const FALLBACK_RESPONSES: { patterns: RegExp[]; response: string }[] = [
  {
    patterns: [/where.*(my|is).*(order|package|delivery)/i, /track/i, /order.*status/i, /shipping.*status/i],
    response:
      "You can track your order status from the My Orders page in your dashboard. Click on any order to see real-time tracking updates, including when it was shipped and the estimated delivery date.",
  },
  {
    patterns: [/return/i, /refund/i, /send.*back/i, /exchange/i],
    response:
      "LoopVerse offers a 30-day return policy on all items. To initiate a return, go to your order detail page and click \"Request Return\". Once the seller approves your request, you will receive shipping instructions and a refund will be processed within 5-7 business days.",
  },
  {
    patterns: [/delivery.*charge/i, /shipping.*(cost|fee|price|charge)/i, /free.*ship/i, /how much.*ship/i],
    response:
      "Shipping is free on all orders over $50, with no code needed. For orders under $50, standard shipping is $5.99. Orders typically ship within 2-3 business days.",
  },
  {
    patterns: [/payment/i, /pay.*method/i, /credit.*card/i, /debit/i],
    response:
      "We accept all major credit and debit cards through our secure Stripe payment system. Your payment information is encrypted and never stored on our servers.",
  },
  {
    patterns: [/cancel/i, /cancel.*order/i],
    response:
      "You can cancel an order before it ships by going to your order detail page and clicking \"Cancel Order\". If the order has already shipped, you can request a return instead under our 30-day return policy.",
  },
  {
    patterns: [/seller/i, /contact.*seller/i, /chat.*seller/i, /message.*seller/i],
    response:
      "You can contact any seller directly through the chat feature on their product page or from your order details. Our verified sellers typically respond within 24 hours.",
  },
  {
    patterns: [/account/i, /profile/i, /password/i, /email/i, /sign.*up/i, /register/i],
    response:
      "You can manage your account settings from the Profile page in your dashboard. This includes updating your name, email, password, and shipping addresses.",
  },
  {
    patterns: [/hello/i, /hi\b/i, /hey/i, /good.*(morning|afternoon|evening)/i, /help/i],
    response:
      "Hello! I am LoopVerse's customer support assistant. I can help you with order tracking, returns, shipping information, and general questions about our marketplace. What can I help you with?",
  },
];

function getFallbackResponse(message: string): string {
  for (const entry of FALLBACK_RESPONSES) {
    for (const pattern of entry.patterns) {
      if (pattern.test(message)) {
        return entry.response;
      }
    }
  }
  return "I'm not sure about that. You can contact the seller directly from the product page chat, or browse our Help Center for more information. Is there anything else I can help with?";
}

async function saveMessage(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  try {
    await supabase.from("chatbot_messages").insert({
      session_id: sessionId,
      role,
      content,
    });
  } catch {
    // Non-critical
  }
}

export async function POST(request: NextRequest) {
  let body: { message: string; sessionId: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, sessionId } = body;

  if (!message?.trim() || !sessionId?.trim()) {
    return NextResponse.json(
      { error: "message and sessionId are required" },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  // Save user message
  await saveMessage(supabase, sessionId, "user", message.trim());

  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  if (hasApiKey) {
    // Use Vercel AI SDK with streaming
    try {
      const { streamText } = await import("ai");
      const { openai } = await import("@ai-sdk/openai");

      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_PROMPT,
        messages: [{ role: "user" as const, content: message.trim() }],
        maxOutputTokens: 300,
        async onFinish({ text }: { text: string }) {
          await saveMessage(supabase, sessionId, "assistant", text);
        },
      });

      return result.toTextStreamResponse();
    } catch {
      // Fall through to rule-based response if AI fails
    }
  }

  // Rule-based fallback
  const response = getFallbackResponse(message.trim());

  // Save assistant response
  await saveMessage(supabase, sessionId, "assistant", response);

  return NextResponse.json({ response });
}
