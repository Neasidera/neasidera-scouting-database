"use client";

import { useEffect, useState } from "react";
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

export default function PlayersPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPlayers() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("players")
        .select(
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, bio"
        )
        .eq("visibile", true)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setPlayers(data ?? []);
      }

      setLoading(false);
    }

    loadPlayers();
  }, [supabase]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Caricamento giocatori...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/dashboard" className="dashboard-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
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
        <div className="dashboard-welcome">
          <span>DATABASE</span>

          <h1>
            I <strong>giocatori.</strong>
          </h1>

          <p>
            Esplora i profili dei giocatori presenti nel database
            NeaSidera Scouting.
          </p>
        </div>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        {players.length === 0 ? (
          <div className="dashboard-card">
            <span>DATABASE VUOTO</span>
            <h2>Nessun giocatore disponibile.</h2>
            <p>
              I primi profili appariranno qui quando verranno
              inseriti nel database.
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {players.map((player) => (
              <div className="dashboard-card" key={player.id}>
                <span>{player.ruolo ?? "GIOCATORE"}</span>

                <h2>
                  {player.nome ?? ""} {player.cognome ?? ""}
                </h2>

                <p>
                  {player.club ?? "Club non specificato"}
                </p>

                <p>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "Altezza non specificata"}
                  {" · "}
                  {player.piede ?? "Piede non specificato"}
                </p>

                <strong>→</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
