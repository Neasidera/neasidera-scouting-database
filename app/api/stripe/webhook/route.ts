import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getPlanFromPriceId(priceId: string | undefined) {
  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_SCOUT_WEEKLY_PRICE_ID
  ) {
    return { accountRole: "Scout", plan: "weekly" };
  }

  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_SCOUT_MONTHLY_PRICE_ID
  ) {
    return { accountRole: "Scout", plan: "monthly" };
  }

  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_AGENT_WEEKLY_PRICE_ID
  ) {
    return { accountRole: "Agente", plan: "weekly" };
  }

  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_AGENT_MONTHLY_PRICE_ID
  ) {
    return { accountRole: "Agente", plan: "monthly" };
  }

  return null;
}

async function saveSubscription(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {};

  const userId = metadata.user_id;

  if (!userId) {
    console.error("Webhook Stripe: user_id mancante nei metadata.");
    return;
  }

  const firstItem = subscription.items.data[0];

  const priceId =
    typeof firstItem?.price === "string"
      ? firstItem.price
      : firstItem?.price?.id;

  const priceInfo = getPlanFromPriceId(priceId);

  const accountRole =
    metadata.account_role ||
    priceInfo?.accountRole;

  const plan =
    metadata.plan ||
    priceInfo?.plan;

  if (
    accountRole !== "Scout" &&
    accountRole !== "Agente"
  ) {
    console.error("Webhook Stripe: account_role non valido.");
    return;
  }

  if (
    plan !== "weekly" &&
    plan !== "monthly"
  ) {
    console.error("Webhook Stripe: plan non valido.");
    return;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        account_role: accountRole,
        plan,
        status: subscription.status,
        stripe_customer_id:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        current_period_start: new Date(
          subscription.items.data[0].current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.items.data[0].current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end:
          subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error(
      "Errore Supabase salvataggio subscription:",
      error
    );
    throw error;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get(
    "stripe-signature"
  );

  if (!signature) {
    return NextResponse.json(
      { error: "Firma Stripe mancante." },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error(
      "Firma webhook Stripe non valida:",
      error
    );

    return NextResponse.json(
      { error: "Firma webhook non valida." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        if (
          session.mode === "subscription" &&
          session.subscription
        ) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const subscription =
            await stripe.subscriptions.retrieve(
              subscriptionId
            );

          await saveSubscription(subscription);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        await saveSubscription(subscription);

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Errore gestione webhook Stripe:",
      error
    );

    return NextResponse.json(
      { error: "Errore gestione webhook." },
      { status: 500 }
    );
  }
}
