import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  scout_weekly: process.env.NEXT_PUBLIC_STRIPE_SCOUT_WEEKLY_PRICE_ID!,
  scout_monthly: process.env.NEXT_PUBLIC_STRIPE_SCOUT_MONTHLY_PRICE_ID!,
  agent_weekly: process.env.NEXT_PUBLIC_STRIPE_AGENT_WEEKLY_PRICE_ID!,
  agent_monthly: process.env.NEXT_PUBLIC_STRIPE_AGENT_MONTHLY_PRICE_ID!,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utente non autenticato." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const plan = body?.plan;

    if (!plan || !(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: "Piano non valido." },
        { status: 400 }
      );
    }

    const priceId =
      PRICE_IDS[plan as keyof typeof PRICE_IDS];

    const accountRole: "Scout" | "Agente" =
      plan.startsWith("scout_") ? "Scout" : "Agente";

    const origin = request.headers.get("origin");

    if (!origin) {
      return NextResponse.json(
        { error: "Origin non disponibile." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      client_reference_id: user.id,

      metadata: {
        user_id: user.id,
        account_role: accountRole,
        plan: plan.includes("weekly") ? "weekly" : "monthly",
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          account_role: accountRole,
          plan: plan.includes("weekly") ? "weekly" : "monthly",
        },
      },

      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,

      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout error:", error);

    return NextResponse.json(
      { error: "Errore nella creazione del Checkout." },
      { status: 500 }
    );
  }
}
