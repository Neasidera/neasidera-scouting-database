import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PLAYER_PREMIUM_PRICE_ID;

    if (!secretKey || !priceId) {
      return NextResponse.json(
        { error: "Configurazione Stripe incompleta." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
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

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || profile?.ruolo_account !== "Calciatore") {
      return NextResponse.json(
        { error: "Servizio riservato ai calciatori." },
        { status: 403 }
      );
    }

    const { data: existingSubscription, error: subscriptionError } =
      await supabase
        .from("player_premium_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        { error: "Errore nel controllo dell'abbonamento." },
        { status: 500 }
      );
    }

    if (
      existingSubscription &&
      ["active", "trialing", "past_due"].includes(
        existingSubscription.status
      )
    ) {
      return NextResponse.json(
        { error: "Hai già un abbonamento Premium." },
        { status: 409 }
      );
    }

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

      customer_email: user.email,

      client_reference_id: user.id,

      metadata: {
        user_id: user.id,
        account_role: "Calciatore",
        product: "player_premium",
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          account_role: "Calciatore",
          product: "player_premium",
        },
      },

      success_url: `${origin}/dashboard?premium=success`,
      cancel_url: `${origin}/dashboard?premium=cancelled`,

      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error("Premium Checkout error:", error);

    return NextResponse.json(
      { error: "Impossibile avviare il pagamento Premium." },
      { status: 500 }
    );
  }
}
