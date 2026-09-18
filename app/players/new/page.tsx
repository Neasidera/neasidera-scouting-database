"use client";

import { useEffect, useMemo, useState } from "react";
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

  const [search, setSearch] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [piede, setPiede] = useState("");
  const [categoria, setCategoria] = useState("");
  const [provincia, setProvincia] = useState("");
  const [club, setClub] = useState("");

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

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const fullName =
        `${player.nome ?? ""} ${player.cognome ?? ""}`.toLowerCase();

      const searchMatch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        (player.club ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (player.posizione ?? "").toLowerCase().includes(search.toLowerCase());

      const ruoloMatch = !ruolo || player.ruolo === ruolo;

      const piedeMatch = !piede || player.piede === piede;

      const categoriaMatch =
        !categoria ||
        (player.categoria ?? "")
          .toLowerCase()
          .includes(categoria.toLowerCase());

      const provinciaMatch =
        !provincia ||
        (player.provincia ?? "")
          .toLowerCase()
          .includes(provincia.toLowerCase());

      const clubMatch =
        !club ||
        (player.club ?? "").toLowerCase().includes(club.toLowerCase());

      return (
        searchMatch &&
        ruoloMatch &&
        piedeMatch &&
        categoriaMatch &&
        provinciaMatch &&
        clubMatch
      );
    });
  }, [
    players,
    search,
    ruolo,
    piede,
    categoria,
    provincia,
    club,
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
              placeholder="Nome, cognome, club o posizione..."
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
                <option value="Destro">Destro</option>
                <option value="Sinistro">Sinistro</option>
                <option value="Ambidestro">Ambidestro</option>
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
                placeholder="Es. Milano"
                value={provincia}
                onChange={(event) => setProvincia(event.target.value)}
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
            {filteredPlayers.length}{" "}
            {filteredPlayers.length === 1
              ? "giocatore trovato"
              : "giocatori trovati"}
          </span>
        </div>

        {message && <p className="auth-message">{message}</p>}

        {filteredPlayers.length === 0 ? (
          <div className="dashboard-card">
            <span>NESSUN RISULTATO</span>

            <h2>Nessun giocatore trovato.</h2>

            <p>
              Prova a modificare o rimuovere i filtri di ricerca.
            </p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredPlayers.map((player) => (
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

                {player.posizione && (
                  <p>{player.posizione}</p>
                )}

                <strong>→</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
