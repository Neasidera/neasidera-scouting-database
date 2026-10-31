
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret =
    process.env.STRIPE_PLAYER_PREMIUM_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Configurazione webhook incompleta." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey);

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Firma Stripe mancante." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Firma webhook non valida:", error);

    return NextResponse.json(
      { error: "Firma webhook non valida." },
      { status: 400 }
    );
  }

  const supportedEvents = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  if (!supportedEvents.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    const subscription =
      event.data.object as Stripe.Subscription;

    const userId = subscription.metadata?.user_id;

    if (
      !userId ||
      subscription.metadata?.product !== "player_premium"
    ) {
      return NextResponse.json({ received: true });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configurazione Supabase incompleta.");
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const subscriptionItem = subscription.items.data[0];

    const priceId = subscriptionItem?.price.id ?? null;

    const allowedStatuses = [
      "active",
      "trialing",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
    ];

    const status = allowedStatuses.includes(subscription.status)
      ? subscription.status
      : "inactive";

    const { error } = await supabase
      .from("player_premium_subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,

          status,

          current_period_start:
            subscriptionItem?.current_period_start
              ? new Date(
                  subscriptionItem.current_period_start * 1000
                ).toISOString()
              : null,

          current_period_end:
            subscriptionItem?.current_period_end
              ? new Date(
                  subscriptionItem.current_period_end * 1000
                ).toISOString()
              : null,

          cancel_at_period_end:
            subscription.cancel_at_period_end,

          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Errore webhook Premium:", error);

    return NextResponse.json(
      { error: "Errore aggiornamento abbonamento." },
      { status: 500 }
    );
  }
}
