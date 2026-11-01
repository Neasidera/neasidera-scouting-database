import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("ruolo_account")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.ruolo_account !== "Calciatore") {
      return NextResponse.json(
        { error: "Servizio riservato ai calciatori." },
        { status: 403 }
      );
    }

    const { data: subscription, error } = await supabase
      .from("player_premium_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nessun abbonamento Premium da gestire." },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url:
        "https://neasidera-scouting-database-b15m.vercel.app/dashboard",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Premium Portal error:", error);

    return NextResponse.json(
      { error: "Impossibile aprire la gestione dell'abbonamento." },
      { status: 500 }
    );
  }
}
