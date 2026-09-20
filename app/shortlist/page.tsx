"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  nome: string | null;
  cognome: string | null;
  data_nascita: string | null;
  altezza: number | null;
  piede: string | null;
  ruolo: string | null;
  posizione: string | null;
  club: string | null;
  categoria: string | null;
  provincia: string | null;
  video: string | null;
  bio: string | null;
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
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: shortlist, error: shortlistError } =
        await supabase
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
        data: shortlistPlayers,
        error: shortlistPlayersError,
      } = await supabase
        .from("shortlist_players")
        .select("player_id")
        .eq("shortlist_id", shortlist.id);

      if (shortlistPlayersError) {
        setMessage(
          "Errore caricamento giocatori: " +
            shortlistPlayersError.message
        );
        setLoading(false);
        return;
      }

      const playerIds =
        shortlistPlayers?.map(
          (item) => item.player_id
        ) ?? [];

      if (playerIds.length === 0) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      const {
        data: playerData,
        error: playersError,
      } = await supabase
        .from("players")
        .select(
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, bio"
        )
        .in("id", playerIds);

      if (playersError) {
        setMessage(
          "Errore caricamento profili: " +
            playersError.message
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
          (player): player is Player =>
            Boolean(player)
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
        "Errore nella rimozione: " +
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

  function calculateAge(
    date: string | null
  ) {
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
        today.getDate() <
          birthDate.getDate())
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
            ← Giocatori
          </a>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href =
                "/login";
            }}
          >
            Esci
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <a
          href="/dashboard"
          className="player-back"
        >
          ← Dashboard
        </a>

        <div className="dashboard-card">
          <span>SHORTLIST</span>

          <h1>La mia shortlist</h1>

          <p>
            I giocatori che hai salvato per il
            tuo scouting.
          </p>

          <strong>
            {players.length}{" "}
            {players.length === 1
              ? "giocatore"
              : "giocatori"}
          </strong>
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
              Vai nel database e aggiungi i
              profili che vuoi tenere sotto
              osservazione.
            </p>

            <a
              href="/players"
              className="player-edit-button"
            >
              Vai al database →
            </a>
          </div>
        ) : (
          <div className="player-list">
            {players.map((player) => {
              const age = calculateAge(
                player.data_nascita
              );

              return (
                <div
                  key={player.id}
                  className="dashboard-card"
                >
                  <div className="player-card-header">
                    <div>
                      <span>
                        {player.posizione ??
                          player.ruolo ??
                          "GIOCATORE"}
                      </span>

                      <h2>
                        {player.nome ?? ""}{" "}
                        <strong>
                          {player.cognome ?? ""}
                        </strong>
                      </h2>

                      <p>
                        {player.club ??
                          "Club non specificato"}
                        {player.categoria
                          ? " · " +
                            player.categoria
                          : ""}
                      </p>

                      <p>
                        {age !== null
                          ? age + " anni"
                          : "Età non disponibile"}
                        {player.altezza
                          ? " · " +
                            player.altezza +
                            " cm"
                          : ""}
                        {player.piede
                          ? " · " +
                            player.piede
                          : ""}
                      </p>

                      {player.provincia && (
                        <small>
                          📍{" "}
                          {player.provincia}
                        </small>
                      )}
                    </div>

                    <div>
                      <a
                        href={
                          "/players/" +
                          player.id
                        }
                        className="player-edit-button"
                      >
                        Vedi profilo →
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromShortlist(
                            player.id
                          )
                        }
                        className="player-shortlist-button"
                      >
                        Rimuovi
                      </button>
                    </div>
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
