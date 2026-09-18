"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  nome: string | null;
  cognome: string | null;
  altezza: number | null;
  piede: string | null;
  ruolo: string | null;
  posizione: string | null;
  club: string | null;
  categoria: string | null;
  provincia: string | null;
};

export default function ShortlistPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [ruolo, setRuolo] = useState("");

  useEffect(() => {
    async function loadShortlist() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("shortlists")
        .select(
          `
          player_id,
          players (
            id,
            nome,
            cognome,
            altezza,
            piede,
            ruolo,
            posizione,
            club,
            categoria,
            provincia
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const formattedPlayers =
        data
          ?.map((item: any) => item.players)
          .filter(Boolean) ?? [];

      setPlayers(formattedPlayers);
      setLoading(false);
    }

    loadShortlist();
  }, [supabase]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const searchText = search.toLowerCase();

      const fullName =
        `${player.nome ?? ""} ${player.cognome ?? ""}`.toLowerCase();

      const searchMatch =
        !searchText ||
        fullName.includes(searchText) ||
        (player.club ?? "").toLowerCase().includes(searchText) ||
        (player.posizione ?? "").toLowerCase().includes(searchText);

      const ruoloMatch =
        !ruolo || player.ruolo === ruolo;

      return searchMatch && ruoloMatch;
    });
  }, [players, search, ruolo]);

  function resetFilters() {
    setSearch("");
    setRuolo("");
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
        <a href="/dashboard" className="dashboard-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <a href="/players">Giocatori</a>

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
          <span>SCOUTING</span>

          <h1>
            La mia <strong>shortlist.</strong>
          </h1>

          <p>
            I giocatori che hai salvato per tenerli
            sotto osservazione.
          </p>
        </div>

        <div className="players-filters">
          <div className="profile-field players-search">
            <label htmlFor="search">
              Cerca giocatore
            </label>

            <input
              id="search"
              type="text"
              placeholder="Nome, cognome, club o posizione..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="players-filter-grid">
            <div className="profile-field">
              <label htmlFor="ruolo">Ruolo</label>

              <select
                id="ruolo"
                value={ruolo}
                onChange={(event) =>
                  setRuolo(event.target.value)
                }
              >
                <option value="">Tutti i ruoli</option>
                <option value="Portiere">
                  Portiere
                </option>
                <option value="Difensore">
                  Difensore
                </option>
                <option value="Centrocampista">
                  Centrocampista
                </option>
                <option value="Attaccante">
                  Attaccante
                </option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="filter-reset"
            onClick={resetFilters}
          >
            Azzera filtri
          </button>
        </div>

        <div className="players-results-header">
          <span>
            {filteredPlayers.length}{" "}
            {filteredPlayers.length === 1
              ? "giocatore salvato"
              : "giocatori salvati"}
          </span>
        </div>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        {filteredPlayers.length === 0 ? (
          <div className="dashboard-card">
            <span>SHORTLIST VUOTA</span>

            <h2>
              Nessun giocatore salvato.
            </h2>

            <p>
              Vai nel database e aggiungi i giocatori
              che vuoi tenere sotto osservazione.
            </p>

            <a href="/players">
              Vai al database →
            </a>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredPlayers.map((player) => (
              <div
                className="dashboard-card"
                key={player.id}
                onClick={() => {
                  window.location.href =
                    `/players/${player.id}`;
                }}
                style={{ cursor: "pointer" }}
              >
                <span>
                  {player.ruolo ?? "GIOCATORE"}
                </span>

                <h2>
                  {player.nome ?? ""}{" "}
                  {player.cognome ?? ""}
                </h2>

                <p>
                  {player.club ??
                    "Club non specificato"}
                </p>

                <p>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "Altezza non specificata"}
                  {" · "}
                  {player.piede ??
                    "Piede non specificato"}
                </p>

                {player.posizione && (
                  <p>{player.posizione}</p>
                )}

                <strong>⭐</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
