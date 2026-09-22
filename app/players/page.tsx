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
  visibile: boolean | null;
};

const PAGE_SIZE = 50;

function footLabel(foot: string | null) {
  if (foot === "right") return "Destro";
  if (foot === "left") return "Sinistro";
  if (foot === "both") return "Ambidestro";
  return foot || "—";
}

function getPositionOptions(ruolo: string) {
  if (ruolo === "Portiere") {
    return ["Portiere"];
  }

  if (ruolo === "Difensore") {
    return [
      "Difensore centrale",
      "Terzino destro",
      "Terzino sinistro",
      "Quinto destro",
      "Quinto sinistro",
    ];
  }

  if (ruolo === "Centrocampista") {
    return [
      "Mediano",
      "Centrocampista centrale",
      "Mezzala destra",
      "Mezzala sinistra",
      "Trequartista",
    ];
  }

  if (ruolo === "Attaccante") {
    return [
      "Ala destra",
      "Ala sinistra",
      "Seconda punta",
      "Punta centrale",
    ];
  }

  return [];
}

export default function PlayersPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [posizione, setPosizione] = useState("");
  const [piede, setPiede] = useState("");
  const [categoria, setCategoria] = useState("");
  const [provincia, setProvincia] = useState("");
  const [club, setClub] = useState("");
  const [annoDa, setAnnoDa] = useState("");
  const [annoA, setAnnoA] = useState("");
  const [altezzaMin, setAltezzaMin] = useState("");
  const [altezzaMax, setAltezzaMax] = useState("");

  const positionOptions = getPositionOptions(ruolo);

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
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, visibile"
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

      if (posizione) {
        query = query.eq("posizione", posizione);
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

      if (/^\d{4}$/.test(annoDa)) {
        query = query.gte(
          "data_nascita",
          `${annoDa}-01-01`
        );
      }

      if (/^\d{4}$/.test(annoA)) {
        query = query.lte(
          "data_nascita",
          `${annoA}-12-31`
        );
      }

      if (/^\d+$/.test(altezzaMin)) {
        query = query.gte(
          "altezza",
          Number(altezzaMin)
        );
      }

      if (/^\d+$/.test(altezzaMax)) {
        query = query.lte(
          "altezza",
          Number(altezzaMax)
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
    posizione,
    piede,
    categoria,
    provincia,
    club,
    annoDa,
    annoA,
    altezzaMin,
    altezzaMax,
    supabase,
  ]);

  function handleRuoloChange(value: string) {
    setRuolo(value);
    setPosizione("");
  }

  function resetFilters() {
    setSearch("");
    setRuolo("");
    setPosizione("");
    setPiede("");
    setCategoria("");
    setProvincia("");
    setClub("");
    setAnnoDa("");
    setAnnoA("");
    setAltezzaMin("");
    setAltezzaMax("");
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
            <label htmlFor="search">
              Cerca giocatore
            </label>

            <input
              id="search"
              type="text"
              placeholder="Nome, cognome, club, ruolo o provincia..."
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
                  handleRuoloChange(event.target.value)
                }
              >
                <option value="">Tutti i ruoli</option>
                <option value="Portiere">Portiere</option>
                <option value="Difensore">Difensore</option>
                <option value="Centrocampista">
                  Centrocampista
                </option>
                <option value="Attaccante">
                  Attaccante
                </option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="posizione">
                Posizione
              </label>

              <select
                id="posizione"
                value={posizione}
                onChange={(event) =>
                  setPosizione(event.target.value)
                }
                disabled={!ruolo}
              >
                <option value="">
                  {ruolo
                    ? "Tutte le posizioni"
                    : "Seleziona prima il ruolo"}
                </option>

                {positionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="piede">Piede</label>

              <select
                id="piede"
                value={piede}
                onChange={(event) =>
                  setPiede(event.target.value)
                }
              >
                <option value="">Tutti</option>
                <option value="right">Destro</option>
                <option value="left">Sinistro</option>
                <option value="both">Ambidestro</option>
              </select>
            </div>

            <div className="profile-field">
              <label htmlFor="categoria">
                Categoria
              </label>

              <input
                id="categoria"
                type="text"
                placeholder="Es. U17, U19..."
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="provincia">
                Provincia
              </label>

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
                onChange={(event) =>
                  setClub(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="annoDa">
                Anno di nascita da
              </label>

              <input
                id="annoDa"
                type="number"
                placeholder="Es. 2008"
                min="1990"
                max="2030"
                value={annoDa}
                onChange={(event) =>
                  setAnnoDa(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="annoA">
                Anno di nascita a
              </label>

              <input
                id="annoA"
                type="number"
                placeholder="Es. 2010"
                min="1990"
                max="2030"
                value={annoA}
                onChange={(event) =>
                  setAnnoA(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="altezzaMin">
                Altezza minima
              </label>

              <input
                id="altezzaMin"
                type="number"
                placeholder="Es. 180 cm"
                min="100"
                max="230"
                value={altezzaMin}
                onChange={(event) =>
                  setAltezzaMin(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="altezzaMax">
                Altezza massima
              </label>

              <input
                id="altezzaMax"
                type="number"
                placeholder="Es. 195 cm"
                min="100"
                max="230"
                value={altezzaMax}
                onChange={(event) =>
                  setAltezzaMax(event.target.value)
                }
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
          <p className="auth-message">
            {message}
          </p>
        )}

        {players.length === 0 ? (
          <div className="dashboard-card">
            <span>NESSUN RISULTATO</span>

            <h2>
              Nessun giocatore trovato.
            </h2>

            <p>
              Prova a modificare o rimuovere i filtri
              di ricerca.
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
                  {player.club ||
                    "Club non specificato"}
                </p>

                <p>
                  {player.altezza
                    ? `${player.altezza} cm`
                    : "Altezza non specificata"}
                  {" · "}
                  {footLabel(player.piede)}
                </p>

                <p>
                  {player.posizione
                    ? player.posizione
                    : player.categoria ||
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
