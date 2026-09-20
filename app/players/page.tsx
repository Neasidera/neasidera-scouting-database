"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  height_cm: number | null;
  preferred_foot: string | null;
  primary_position: string | null;
  current_club: string | null;
  current_team_category: string | null;
  city: string | null;
  visibility: string | null;
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
  const [citta, setCitta] = useState("");
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
          "id, first_name, last_name, height_cm, preferred_foot, primary_position, current_club, current_team_category, city, visibility"
        )
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (search.trim()) {
        const term = search.trim().replace(/,/g, " ");

        query = query.or(
          "first_name.ilike.%" +
            term +
            "%,last_name.ilike.%" +
            term +
            "%,current_club.ilike.%" +
            term +
            "%,primary_position.ilike.%" +
            term +
            "%,city.ilike.%" +
            term +
            "%"
        );
      }

      if (ruolo) {
        query = query.eq("primary_position", ruolo);
      }

      if (piede) {
        query = query.eq("preferred_foot", piede);
      }

      if (categoria.trim()) {
        query = query.ilike(
          "current_team_category",
          "%" + categoria.trim() + "%"
        );
      }

      if (citta.trim()) {
        query = query.ilike("city", "%" + citta.trim() + "%");
      }

      if (club.trim()) {
        query = query.ilike("current_club", "%" + club.trim() + "%");
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setMessage("Errore caricamento giocatori: " + error.message);
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
  }, [search, ruolo, piede, categoria, citta, club, supabase]);

  function resetFilters() {
    setSearch("");
    setRuolo("");
    setPiede("");
    setCategoria("");
    setCitta("");
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
              placeholder="Nome, cognome, club, posizione o città..."
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
                <option value="Centrocampista">Centrocampista</option>
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
              <label htmlFor="citta">Città</label>

              <input
                id="citta"
                type="text"
                placeholder="Es. Milano..."
                value={citta}
                onChange={(event) => setCitta(event.target.value)}
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
              : players.length +
                " " +
                (players.length === 1
                  ? "giocatore trovato"
                  : "giocatori trovati")}
          </span>
        </div>

        {message && <p className="auth-message">{message}</p>}

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
                href={"/players/" + player.id}
              >
                <span>
                  {player.primary_position || "GIOCATORE"}
                </span>

                <h2>
                  {player.first_name || ""}{" "}
                  {player.last_name || ""}
                </h2>

                <p>
                  {player.current_club ||
                    "Club non specificato"}
                </p>

                <p>
                  {player.height_cm
                    ? player.height_cm + " cm"
                    : "Altezza non specificata"}
                  {" · "}
                  {footLabel(player.preferred_foot)}
                </p>

                <p>
                  {player.current_team_category ||
                    "Categoria non specificata"}
                  {player.city ? " · " + player.city : ""}
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
