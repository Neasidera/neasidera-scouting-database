
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autenticato." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profilo non trovato." },
        { status: 403 }
      );
    }

    if (
      profile.ruolo_account !== "Scout" &&
      profile.ruolo_account !== "Agente"
    ) {
      return NextResponse.json(
        { error: "Accesso riservato a Scout e Agenti." },
        { status: 403 }
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError || subscription?.status !== "active") {
      return NextResponse.json(
        { error: "Abbonamento non attivo." },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configurazione Supabase incompleta.");
    }

    const admin = createAdminClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: premiumUsers, error: premiumError } =
      await admin
        .from("player_premium_subscriptions")
        .select("user_id")
        .in("status", ["active", "trialing"]);

    if (premiumError) {
      throw premiumError;
    }

    const userIds = (premiumUsers || []).map(
      (item) => item.user_id
    );

    if (userIds.length === 0) {
      return NextResponse.json({ players: [] });
    }

    const { data: players, error: playersError } =
      await admin
        .from("players")
        .select(
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, visibile"
        )
        .in("user_id", userIds)
        .eq("visibile", true)
        .order("created_at", { ascending: false })
        .limit(12);

    if (playersError) {
      throw playersError;
    }

    return NextResponse.json({
      players: players || [],
    });
  } catch (error) {
    console.error("Errore caricamento giocatori Premium:", error);

    return NextResponse.json(
      { error: "Impossibile caricare i giocatori Premium." },
      { status: 500 }
    );
  }
}
