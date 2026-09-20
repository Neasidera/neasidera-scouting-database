"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  user_id: string;
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

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [player, setPlayer] = useState<Player | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPlayer() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);

      const playerId = String(params.id);

      const { data, error } = await supabase
        .from("players")
        .select(
          "id, user_id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, bio"
        )
        .eq("id", playerId)
        .single();

      if (error || !data) {
        setMessage(error?.message || "Giocatore non trovato.");
        setLoading(false);
        return;
      }

      setPlayer(data);

      const {
        data: shortlist,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!shortlistError && shortlist?.id) {
        setShortlistId(shortlist.id);

        const {
          data: savedPlayer,
          error: savedPlayerError,
        } = await supabase
          .from("shortlist_players")
          .select("player_id")
          .eq("shortlist_id", shortlist.id)
          .eq("player_id", playerId)
          .maybeSingle();

        if (!savedPlayerError) {
          setIsShortlisted(!!savedPlayer);
        }
      }

      setLoading(false);
    }

    loadPlayer();
  }, [params.id, router]);

  async function toggleShortlist() {
    if (!player || shortlistLoading) {
      return;
    }

    setShortlistLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Sessione non valida. Effettua nuovamente il login.");
      setShortlistLoading(false);
      return;
    }

    let currentShortlistId = shortlistId;

    if (!currentShortlistId) {
      const {
        data: existingShortlist,
        error: shortlistError,
      } = await supabase
        .from("shortlists")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (shortlistError) {
        setMessage(
          "Errore caricamento shortlist: " + shortlistError.message
        );
        setShortlistLoading(false);
        return;
      }

      currentShortlistId = existingShortlist?.id ?? null;
    }

    if (!currentShortlistId) {
      const {
        data: newShortlist,
        error: createError,
      } = await supabase
        .from("shortlists")
        .insert({
          user_id: user.id,
          name: "La mia shortlist",
          description: "Giocatori salvati per lo scouting",
        })
        .select("id")
        .single();

      if (createError || !newShortlist) {
        setMessage(
          "Errore creazione shortlist: " +
            (createError?.message ||
              "impossibile creare la shortlist")
        );
        setShortlistLoading(false);
        return;
      }

      currentShortlistId = newShortlist.id;
      setShortlistId(currentShortlistId);
    }

    if (isShortlisted) {
      const { error } = await supabase
        .from("shortlist_players")
        .delete()
        .eq("shortlist_id", currentShortlistId)
        .eq("player_id", player.id);

      if (error) {
        setMessage("Errore nella rimozione: " + error.message);
      } else {
        setIsShortlisted(false);
      }
    } else {
      const { error } = await supabase
        .from("shortlist_players")
        .insert({
          shortlist_id: currentShortlistId,
          player_id: player.id,
        });

      if (error) {
        setMessage("Errore nell'aggiunta: " + error.message);
      } else {
        setIsShortlisted(true);
      }
    }

    setShortlistLoading(false);
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

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("it-IT");
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Caricamento profilo...
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <a href="/dashboard" className="dashboard-logo">
            NEASIDERA
            <span>SCOUTING</span>
          </a>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-card">
            <span>ERRORE</span>

            <h2>
              {message || "Giocatore non trovato."}
            </h2>

            <button
              type="button"
              onClick={() => router.push("/players")}
            >
              ← Torna ai giocatori
            </button>
          </div>
        </section>
      </main>
    );
  }

  const age = calculateAge(player.data_nascita);
  const isOwner = currentUserId === player.user_id;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/dashboard" className="dashboard-logo">
          NEASIDERA
          <span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <a href="/players">← Giocatori</a>

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
        <a href="/players" className="player-back">
          ← Torna al database
        </a>

        <div className="player-detail-header">
          <div>
            <span>
              {player.posizione ?? player.ruolo ?? "GIOCATORE"}
            </span>

            <h1>
              {player.nome ?? ""}{" "}
              <strong>{player.cognome ?? ""}</strong>
            </h1>

            <p>
              {player.club ?? "Club non specificato"}
              {player.categoria
                ? " · " + player.categoria
                : ""}
            </p>
          </div>

          <div className="player-detail-actions">
            <button
              type="button"
              className="player-shortlist-button"
              onClick={toggleShortlist}
              disabled={shortlistLoading}
            >
              {shortlistLoading
                ? "Salvataggio..."
                : isShortlisted
                ? "★ Nella shortlist"
                : "☆ Aggiungi alla shortlist"}
            </button>

            {isOwner && (
              <a
                href={"/players/" + player.id + "/edit"}
                className="player-edit-button"
              >
                ✏️ Modifica giocatore
              </a>
            )}
          </div>
        </div>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        <div className="player-detail-grid">
          <div className="dashboard-card">
            <span>DATI ANAGRAFICI</span>

            <h2>Informazioni</h2>

            <div className="player-info-list">
              <div>
                <small>Data di nascita</small>
                <strong>
                  {formatDate(player.data_nascita)}
                </strong>
              </div>

              <div>
                <small>Età</small>
                <strong>
                  {age !== null ? age + " anni" : "—"}
                </strong>
              </div>

              <div>
                <small>Altezza</small>
                <strong>
                  {player.altezza
                    ? player.altezza + " cm"
                    : "—"}
                </strong>
              </div>

              <div>
                <small>Piede</small>
                <strong>
                  {player.piede ?? "—"}
                </strong>
              </div>

              <div>
                <small>Provincia</small>
                <strong>
                  {player.provincia ?? "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <span>PROFILO CALCISTICO</span>

            <h2>Caratteristiche</h2>

            <div className="player-info-list">
              <div>
                <small>Ruolo</small>
                <strong>
                  {player.ruolo ?? "—"}
                </strong>
              </div>

              <div>
                <small>Posizione</small>
                <strong>
                  {player.posizione ?? "—"}
                </strong>
              </div>

              <div>
                <small>Club</small>
                <strong>
                  {player.club ?? "—"}
                </strong>
              </div>

              <div>
                <small>Categoria</small>
                <strong>
                  {player.categoria ?? "—"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card player-bio-card">
          <span>REPORT</span>

          <h2>Descrizione</h2>

          <p>
            {player.bio ||
              "Nessuna descrizione disponibile per questo giocatore."}
          </p>
        </div>

        {player.video && (
          <div className="dashboard-card player-bio-card">
            <span>VIDEO</span>

            <h2>Video del giocatore</h2>

            <a
              href={player.video}
              target="_blank"
              rel="noopener noreferrer"
            >
              Guarda il video →
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
