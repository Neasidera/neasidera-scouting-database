import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Errore lettura subscription:", error);

      return NextResponse.json(
        { error: "Errore nel recupero dell'abbonamento." },
        { status: 500 }
      );
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nessun abbonamento Stripe trovato." },
        { status: 400 }
      );
    }

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "L'abbonamento non è attivo." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin");

    if (!origin) {
      return NextResponse.json(
        { error: "Origin non disponibile." },
        { status: 400 }
      );
    }

    const session =
      await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/profile`,
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Customer Portal error:", error);

    return NextResponse.json(
      { error: "Errore nell'apertura del portale Stripe." },
      { status: 500 }
    );
  }
}
