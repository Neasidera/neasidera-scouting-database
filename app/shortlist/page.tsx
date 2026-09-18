"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  height_cm: number | null;
  preferred_foot: string | null;
  primary_position: string | null;
  current_club: string | null;
  current_team_category: string | null;
  city: string | null;
};

export default function ShortlistPage() {
  const router = useRouter();
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadShortlist() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setMessage(
          "Errore autenticazione: " + userError.message
        );
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const {
        data: shortlist,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (shortlistError) {
        setMessage(
          "Errore caricamento shortlist: " +
            shortlistError.message
        );
        setLoading(false);
        return;
      }

      if (!shortlist) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const {
        data: savedPlayers,
        error: savedPlayersError,
      } = await supabase
        .from("shortlist_players")
        .select("player_id, added_at")
        .eq("shortlist_id", shortlist.id)
        .order("added_at", { ascending: false });

      if (savedPlayersError) {
        setMessage(
          "Errore caricamento giocatori salvati: " +
            savedPlayersError.message
        );
        setLoading(false);
        return;
      }

      if (!savedPlayers || savedPlayers.length === 0) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const playerIds = savedPlayers.map(
        (item) => item.player_id
      );

      const {
        data: playerData,
        error: playerDataError,
      } = await supabase
        .from("players")
        .select(
          "id, first_name, last_name, birth_date, height_cm, preferred_foot, primary_position, current_club, current_team_category, city"
        )
        .in("id", playerIds);

      if (playerDataError) {
        setMessage(
          "Errore caricamento profili: " +
            playerDataError.message
        );
        setLoading(false);
        return;
      }

      const orderedPlayers = playerIds
        .map((id) =>
          playerData?.find(
            (player) => player.id === id
          )
        )
        .filter(
          (player): player is Player => Boolean(player)
        );

      setPlayers(orderedPlayers);
      setLoading(false);
    }

    loadShortlist();
  }, [router]);

  async function removeFromShortlist(
    playerId: string
  ) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const {
      data: shortlist,
      error: shortlistError,
    } = await supabase
      .from("shortlists")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (shortlistError || !shortlist) {
      setMessage(
        shortlistError?.message ||
          "Impossibile trovare la shortlist."
      );
      return;
    }

    const { error } = await supabase
      .from("shortlist_players")
      .delete()
      .eq("shortlist_id", shortlist.id)
      .eq("player_id", playerId);

    if (error) {
      setMessage(
        "Errore durante la rimozione: " +
          error.message
      );
      return;
    }

    setPlayers((current) =>
      current.filter(
        (player) => player.id !== playerId
      )
    );
  }

  function calculateAge(date: string | null) {
    if (!date) return null;

    const birthDate = new Date(date);
    const today = new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Caricamento shortlist...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/dashboard"
          className="dashboard-logo"
        >
          NEASIDERA
          <span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <a href="/players">
            ← Database
          </a>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Esci
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-section-header">
          <div>
            <span>SCOUTING</span>

            <h1>La mia shortlist</h1>

            <p>
              I giocatori che hai salvato per il tuo
              scouting.
            </p>
          </div>

          <div className="shortlist-count">
            {players.length}{" "}
            {players.length === 1
              ? "giocatore"
              : "giocatori"}
          </div>
        </div>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        {players.length === 0 ? (
          <div className="dashboard-card">
            <span>SHORTLIST VUOTA</span>

            <h2>
              Non hai ancora salvato giocatori
            </h2>

            <p>
              Vai nel database e aggiungi i profili
              che vuoi tenere sotto osservazione.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/players")
              }
            >
              Vai al database →
            </button>
          </div>
        ) : (
          <div className="players-grid">
            {players.map((player) => {
              const age = calculateAge(
                player.birth_date
              );

              return (
                <div
                  key={player.id}
                  className="player-card"
                >
                  <div
                    className="player-card-main"
                    onClick={() =>
                      router.push(
                        "/players/" + player.id
                      )
                    }
                  >
                    <div className="player-card-top">
                      <span>
                        {player.primary_position ??
                          "GIOCATORE"}
                      </span>

                      <strong>
                        {player.first_name ?? ""}{" "}
                        {player.last_name ?? ""}
                      </strong>
                    </div>

                    <div className="player-card-info">
                      <div>
                        <small>ETÀ</small>

                        <strong>
                          {age !== null
                            ? age
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>ALTEZZA</small>

                        <strong>
                          {player.height_cm
                            ? player.height_cm +
                              " cm"
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>PIEDE</small>

                        <strong>
                          {player.preferred_foot ??
                            "—"}
                        </strong>
                      </div>
                    </div>

                    <p>
                      {player.current_club ??
                        "Club non specificato"}

                      {player.current_team_category
                        ? " · " +
                          player.current_team_category
                        : ""}
                    </p>

                    {player.city && (
                      <small>
                        📍 {player.city}
                      </small>
                    )}
                  </div>

                  <div className="player-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          "/players/" + player.id
                        )
                      }
                    >
                      Vedi profilo
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromShortlist(
                          player.id
                        )
                      }
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
