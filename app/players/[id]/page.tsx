"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPlayer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("players")
        .select(
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, bio"
        )
        .eq("id", params.id)
        .eq("visibile", true)
        .single();

      if (error) {
        setMessage("Giocatore non trovato.");
      } else {
        setPlayer(data);
      }

      setLoading(false);
    }

    loadPlayer();
  }, [params.id, router, supabase]);

  function calculateAge(date: string | null) {
    if (!date) return null;

    const birthDate = new Date(date);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

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

    const formatted = new Date(date).toLocaleDateString("it-IT");

    return formatted;
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
            NEASIDERA<span>SCOUTING</span>
          </a>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-card">
            <span>ERRORE</span>
            <h2>{message}</h2>

            <button onClick={() => router.push("/players")}>
              ← Torna ai giocatori
            </button>
          </div>
        </section>
      </main>
    );
  }

  const age = calculateAge(player.data_nascita);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/dashboard" className="dashboard-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <a href="/players">← Giocatori</a>

          <button
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
    <span>{player.ruolo ?? "GIOCATORE"}</span>

    <h1>
      {player.nome ?? ""}{" "}
      <strong>{player.cognome ?? ""}</strong>
    </h1>

    <p>
      {player.club ?? "Club non specificato"}
      {player.categoria
        ? ` · ${player.categoria}`
        : ""}
    </p>
  </div>

  <div className="player-detail-actions">
    <a
      href={`/players/${player.id}/edit`}
      className="player-edit-button"
    >
      ✏️ Modifica giocatore
    </a>
  </div>
</div>
       
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
                  {age !== null ? `${age} anni` : "—"}
                </strong>
              </div>

              <div>
                <small>Altezza</small>
                <strong>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "—"}
                </strong>
              </div>

              <div>
                <small>Piede</small>
                <strong>{player.piede ?? "—"}</strong>
              </div>

              <div>
                <small>Provincia</small>
                <strong>{player.provincia ?? "—"}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <span>PROFILO CALCISTICO</span>

            <h2>Caratteristiche</h2>

            <div className="player-info-list">
              <div>
                <small>Ruolo</small>
                <strong>{player.ruolo ?? "—"}</strong>
              </div>

              <div>
                <small>Posizione</small>
                <strong>{player.posizione ?? "—"}</strong>
              </div>

              <div>
                <small>Club</small>
                <strong>{player.club ?? "—"}</strong>
              </div>

              <div>
                <small>Categoria</small>
                <strong>{player.categoria ?? "—"}</strong>
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
          <div className="dashboard-card player-video-card">
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
