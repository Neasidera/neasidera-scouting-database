import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("ruolo_account")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profilo non trovato." },
        { status: 403 }
      );
    }

    const isPlayer = profile.ruolo_account === "Calciatore";
    const isScoutOrAgent =
      profile.ruolo_account === "Scout" ||
      profile.ruolo_account === "Agente";

    if (!isPlayer && !isScoutOrAgent) {
      return NextResponse.json(
        { error: "Accesso non autorizzato." },
        { status: 403 }
      );
    }

    if (isScoutOrAgent) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscription?.status !== "active") {
        return NextResponse.json(
          { error: "Abbonamento non attivo." },
          { status: 403 }
        );
      }
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

    const { data: player } = await admin
      .from("players")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!player) {
      return NextResponse.json(
        { error: "Giocatore non trovato." },
        { status: 404 }
      );
    }

    if (isPlayer && player.user_id !== user.id) {
      return NextResponse.json(
        { error: "Accesso non autorizzato." },
        { status: 403 }
      );
    }

    const { data: premium } = await admin
      .from("player_premium_subscriptions")
      .select("status")
      .eq("user_id", player.user_id)
      .maybeSingle();

    const isPremium =
      premium?.status === "active" ||
      premium?.status === "trialing";

    return NextResponse.json({ premium: isPremium });
  } catch (error) {
    console.error("Errore verifica Premium:", error);

    return NextResponse.json(
      { error: "Errore nella verifica Premium." },
      { status: 500 }
    );
  }
}
