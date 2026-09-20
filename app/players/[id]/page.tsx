"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./player-detail.module.css";

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

  function formatFoot(foot: string | null) {
    if (!foot) return "—";
    if (foot === "right") return "Destro";
    if (foot === "left") return "Sinistro";
    if (foot === "both") return "Ambidestro";

    return foot;
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          <span>NEASIDERA SCOUTING</span>
          <p>Caricamento profilo...</p>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <a href="/dashboard" className={styles.logo}>
            NEASIDERA<span>SCOUTING</span>
          </a>
        </header>

        <section className={styles.content}>
          <div className={styles.errorCard}>
            <span className={styles.sectionLabel}>ERRORE</span>

            <h2>
              {message || "Giocatore non trovato."}
            </h2>

            <button
              type="button"
              className={styles.secondaryButton}
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

  const fullName =
    `${player.nome ?? ""} ${player.cognome ?? ""}`.trim() ||
    "Giocatore";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/dashboard" className={styles.logo}>
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className={styles.headerActions}>
          <a href="/players">← Database</a>

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

      <section className={styles.content}>
        <a href="/players" className={styles.backLink}>
          ← Torna al database
        </a>

        <section className={styles.profileHero}>
          <div className={styles.heroMain}>
            <span className={styles.positionBadge}>
              {player.posizione ??
                player.ruolo ??
                "GIOCATORE"}
            </span>

            <h1>
              {player.nome ?? ""}
              <strong>
                {player.cognome ?? ""}
              </strong>
            </h1>

            <p className={styles.heroMeta}>
              {player.club ?? "Club non specificato"}
              {player.categoria
                ? ` · ${player.categoria}`
                : ""}
            </p>

            {player.provincia && (
              <p className={styles.heroProvince}>
                {player.provincia}
              </p>
            )}
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={`${styles.shortlistButton} ${
                isShortlisted
                  ? styles.shortlisted
                  : ""
              }`}
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
                href={`/players/${player.id}/edit`}
                className={styles.editButton}
              >
                ✏️ Modifica giocatore
              </a>
            )}
          </div>
        </section>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        <div className={styles.sectionGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>
                DATI FISICI
              </span>
              <h2>Informazioni</h2>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <small>Data di nascita</small>
                <strong>
                  {formatDate(player.data_nascita)}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Età</small>
                <strong>
                  {age !== null
                    ? `${age} anni`
                    : "—"}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Altezza</small>
                <strong>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "—"}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Piede</small>
                <strong>
                  {formatFoot(player.piede)}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Provincia</small>
                <strong>
                  {player.provincia ?? "—"}
                </strong>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>
                PROFILO CALCISTICO
              </span>
              <h2>Caratteristiche</h2>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <small>Ruolo</small>
                <strong>
                  {player.ruolo ?? "—"}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Posizione</small>
                <strong>
                  {player.posizione ?? "—"}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Club</small>
                <strong>
                  {player.club ?? "—"}
                </strong>
              </div>

              <div className={styles.infoItem}>
                <small>Categoria</small>
                <strong>
                  {player.categoria ?? "—"}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>
              REPORT
            </span>
            <h2>Descrizione</h2>
          </div>

          <div className={styles.bio}>
            {player.bio ? (
              <p>{player.bio}</p>
            ) : (
              <p className={styles.empty}>
                Nessuna descrizione disponibile
                per questo giocatore.
              </p>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>
              VIDEO
            </span>
            <h2>Video del giocatore</h2>
          </div>

          {player.video ? (
            <a
              href={player.video}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoButton}
            >
              <span className={styles.playIcon}>
                ▶
              </span>

              <span>
                <strong>Guarda il video</strong>
                <small>
                  Apri il video del giocatore
                </small>
              </span>

              <span className={styles.videoArrow}>
                →
              </span>
            </a>
          ) : (
            <div className={styles.emptyVideo}>
              <span>VIDEO NON DISPONIBILE</span>
              <p>
                Questo giocatore non ha ancora
                inserito un video.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
