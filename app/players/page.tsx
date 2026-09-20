"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  nome: string | null;
  cognome: string | null;
  altezza: number | null;
  piede: string | null;
  ruolo: string | null;
  club: string | null;
  categoria: string | null;
  provincia: string | null;
  visibile: boolean | null;
};

const PAGE_SIZE = 50;

function footLabel(foot: string | null) {
  if (foot === "right") return "Destro";
  if (foot === "left") return "Sinistro";
  if (foot === "both") return "Ambidestro";
  return foot || "—";
}

export default function PlayersPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [piede, setPiede] = useState("");
  const [categoria, setCategoria] = useState("");
  const [provincia, setProvincia] = useState("");
  const [club, setClub] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      let query = supabase
        .from("players")
        .select(
          "id, nome, cognome, altezza, piede, ruolo, club, categoria, provincia, visibile"
        )
        .eq("visibile", true)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (search.trim()) {
        const term = search.trim().replace(/,/g, " ");

        query = query.or(
          `nome.ilike.%${term}%,cognome.ilike.%${term}%,club.ilike.%${term}%,ruolo.ilike.%${term}%,provincia.ilike.%${term}%`
        );
      }

      if (ruolo) {
        query = query.eq("ruolo", ruolo);
      }

      if (piede) {
        query = query.eq("piede", piede);
      }

      if (categoria.trim()) {
        query = query.ilike(
          "categoria",
          `%${categoria.trim()}%`
        );
      }

      if (provincia.trim()) {
        query = query.ilike(
          "provincia",
          `%${provincia.trim()}%`
        );
      }

      if (club.trim()) {
        query = query.ilike(
          "club",
          `%${club.trim()}%`
        );
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setMessage(
          "Errore caricamento giocatori: " + error.message
        );
        setPlayers([]);
      } else {
        setPlayers(data || []);
      }

      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    search,
    ruolo,
    piede,
    categoria,
    provincia,
    club,
    supabase,
  ]);

  function resetFilters() {
    setSearch("");
    setRuolo("");
    setPiede("");
    setCategoria("");
    setProvincia("");
    setClub("");
  }

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
          <a href="/players/new">+ Nuovo giocatore</a>

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
        <div className="dashboard-welcome">
          <span>DATABASE</span>

          <h1>
            I <strong>giocatori.</strong>
          </h1>

          <p>
            Cerca e filtra i profili presenti nel database
            NeaSidera Scouting.
          </p>
        </div>

        <div className="players-filters">
          <div className="profile-field players-search">
            <label htmlFor="search">Cerca giocatore</label>

            <input
              id="search"
              type="text"
              placeholder="Nome, cognome, club, ruolo o provincia..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="players-filter-grid">
            <div className="profile-field">
              <label htmlFor="ruolo">Ruolo</label>

              <select
                id="ruolo"
                value={ruolo}
                onChange={(event) => setRuolo(event.target.value)}
              >
                <option value="">Tutti i ruoli</option>
                <option value="Portiere">Portiere</option>
                <option value="Difensore">Difensore</option>
                <option value="Centrocampista">
                  Centrocampista
                </option>
                <option value="Attaccante">Attaccante</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="piede">Piede</label>

              <select
                id="piede"
                value={piede}
                onChange={(event) => setPiede(event.target.value)}
              >
                <option value="">Tutti</option>
                <option value="right">Destro</option>
                <option value="left">Sinistro</option>
                <option value="both">Ambidestro</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="categoria">Categoria</label>

              <input
                id="categoria"
                type="text"
                placeholder="Es. U17, U19..."
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="provincia">Provincia</label>

              <input
                id="provincia"
                type="text"
                placeholder="Es. Milano..."
                value={provincia}
                onChange={(event) =>
                  setProvincia(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="club">Club</label>

              <input
                id="club"
                type="text"
                placeholder="Nome club..."
                value={club}
                onChange={(event) => setClub(event.target.value)}
              />
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
            {players.length === PAGE_SIZE
              ? "50+ giocatori"
              : `${players.length} ${
                  players.length === 1
                    ? "giocatore trovato"
                    : "giocatori trovati"
                }`}
          </span>
        </div>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        {players.length === 0 ? (
          <div className="dashboard-card">
            <span>NESSUN RISULTATO</span>

            <h2>Nessun giocatore trovato.</h2>

            <p>
              Prova a modificare o rimuovere i filtri di ricerca.
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {players.map((player) => (
              <a
                className="dashboard-card"
                key={player.id}
                href={`/players/${player.id}`}
              >
                <span>
                  {player.ruolo || "GIOCATORE"}
                </span>

                <h2>
                  {player.nome || ""}{" "}
                  {player.cognome || ""}
                </h2>

                <p>
                  {player.club || "Club non specificato"}
                </p>

                <p>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "Altezza non specificata"}
                  {" · "}
                  {footLabel(player.piede)}
                </p>

                <p>
                  {player.categoria ||
                    "Categoria non specificata"}
                  {player.provincia
                    ? ` · ${player.provincia}`
                    : ""}
                </p>

                <strong>→</strong>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
