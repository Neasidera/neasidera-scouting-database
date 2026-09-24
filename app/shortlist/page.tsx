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

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setMessage(
          "Errore verifica account: " +
            profileError.message
        );
        setLoading(false);
        return;
      }

      const ruoloAccount =
        profile?.ruolo_account;

      if (
        ruoloAccount !== "Scout" &&
        ruoloAccount !== "Agente"
      ) {
        if (ruoloAccount === "Calciatore") {
          router.replace("/dashboard");
          return;
        }

        setMessage(
          "Il tuo account non ha un ruolo valido. Completa prima la configurazione del profilo."
        );
        setLoading(false);
        return;
      }

      const {
        data: subscription,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionError) {
        setMessage(
          "Errore verifica abbonamento: " +
            subscriptionError.message
        );
        setLoading(false);
        return;
      }

      if (subscription?.status !== "active") {
        router.replace("/subscription");
        return;
      }

      const {
        data: shortlist,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        })
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
  }, [router, supabase]);

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
      .order("created_at", {
        ascending: true,
      })
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
      <main className="dashboard-page shortlist-page">
        <div className="dashboard-loading">
          Caricamento shortlist...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page shortlist-page">
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

      <section className="dashboard-content shortlist-content">
        <div className="shortlist-hero">
          <div className="shortlist-hero-top">
            <span className="shortlist-eyebrow">
              SCOUTING / SHORTLIST
            </span>

            <span className="shortlist-counter">
              {String(players.length).padStart(
                2,
                "0"
              )}{" "}
              PLAYERS
            </span>
          </div>

          <h1>
            La mia
            <br />
            <strong>shortlist.</strong>
          </h1>

          <div className="shortlist-hero-bottom">
            <p>
              I giocatori che hai selezionato
              durante il tuo scouting.
              <br />
              Tieni sotto osservazione i profili
              più interessanti.
            </p>

            <a
              href="/players"
              className="shortlist-database-link"
            >
              DATABASE GIOCATORI →
            </a>
          </div>
        </div>

        {message && (
          <div className="shortlist-message">
            <span>ATTENTION</span>
            <p>{message}</p>
          </div>
        )}

        {players.length === 0 ? (
          <div className="shortlist-empty">
            <div className="shortlist-empty-number">
              00
            </div>

            <div>
              <span>SHORTLIST EMPTY</span>

              <h2>
                Nessun giocatore salvato.
              </h2>

              <p>
                Esplora il database e aggiungi i
                profili che vuoi seguire.
              </p>

              <a
                href="/players"
                className="shortlist-primary-button"
              >
                Esplora il database →
              </a>
            </div>
          </div>
        ) : (
          <div className="shortlist-list">
            {players.map((player, index) => {
              const age = calculateAge(
                player.data_nascita
              );

              return (
                <article
                  key={player.id}
                  className="shortlist-player"
                >
                  <div className="shortlist-player-index">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="shortlist-player-main">
                    <div className="shortlist-player-heading">
                      <div>
                        <span className="shortlist-player-role">
                          {player.posizione ??
                            player.ruolo ??
                            "GIOCATORE"}
                        </span>

                        <h2>
                          {player.nome ?? ""}
                          <strong>
                            {player.cognome ?? ""}
                          </strong>
                        </h2>
                      </div>

                      {player.video && (
                        <span className="shortlist-video">
                          VIDEO
                        </span>
                      )}
                    </div>

                    <div className="shortlist-player-meta">
                      <div>
                        <span>CLUB</span>
                        <strong>
                          {player.club ??
                            "Non specificato"}
                        </strong>
                      </div>

                      <div>
                        <span>CATEGORIA</span>
                        <strong>
                          {player.categoria ??
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>ETÀ</span>
                        <strong>
                          {age !== null
                            ? `${age} ANNI`
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <span>ALTEZZA</span>
                        <strong>
                          {player.altezza
                            ? `${player.altezza} CM`
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <span>PIEDE</span>
                        <strong>
                          {player.piede ?? "—"}
                        </strong>
                      </div>

                      <div>
                        <span>PROVINCIA</span>
                        <strong>
                          {player.provincia ??
                            "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="shortlist-player-actions">
                      <a
                        href={`/players/${player.id}`}
                        className="shortlist-view-button"
                      >
                        VEDI PROFILO →
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromShortlist(
                            player.id
                          )
                        }
                        className="shortlist-remove-button"
                      >
                        RIMUOVI
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
