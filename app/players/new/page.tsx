"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPlayerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [altezza, setAltezza] = useState("");
  const [piede, setPiede] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [posizione, setPosizione] = useState("");
  const [club, setClub] = useState("");
  const [categoria, setCategoria] = useState("");
  const [provincia, setProvincia] = useState("");
  const [video, setVideo] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
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

      if (profile?.ruolo_account !== "Calciatore") {
        router.replace("/dashboard");
        return;
      }

      const { data: existingPlayer, error: playerError } =
        await supabase
          .from("players")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (playerError) {
        setMessage(
          "Errore verifica profilo: " +
            playerError.message
        );
        setLoading(false);
        return;
      }

      if (existingPlayer?.id) {
        router.replace(
          `/players/${existingPlayer.id}`
        );
        return;
      }

      setLoading(false);
    }

    checkAccess();
  }, [router, supabase]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    // Controllo ruolo anche al momento del salvataggio.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      setMessage(
        "Errore verifica account: " +
          profileError.message
      );
      setSaving(false);
      return;
    }

    if (profile?.ruolo_account !== "Calciatore") {
      setMessage(
        "Solo un account Calciatore può creare un profilo."
      );
      setSaving(false);
      return;
    }

    // Controlliamo nuovamente che non esista già
    // un profilo associato all'account.
    const { data: existingPlayer, error: existingError } =
      await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingError) {
      setMessage(
        "Errore verifica profilo: " +
          existingError.message
      );
      setSaving(false);
      return;
    }

    if (existingPlayer?.id) {
      router.replace(
        `/players/${existingPlayer.id}`
      );
      return;
    }

    const { data: newPlayer, error } = await supabase
      .from("players")
      .insert({
        user_id: user.id,
        nome,
        cognome,
        data_nascita: dataNascita || null,
        altezza: altezza ? Number(altezza) : null,
        piede: piede || null,
        ruolo: ruolo || null,
        posizione: posizione || null,
        club: club || null,
        categoria: categoria || null,
        provincia: provincia || null,
        video: video || null,
        bio: bio || null,
        visibile: true,
      })
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.push(`/players/${newPlayer.id}`);
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Verifica account...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a
          href="/dashboard"
          className="dashboard-logo"
        >
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <a href="/dashboard">
            ← Dashboard
          </a>

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
          <span>NUOVO PROFILO</span>

          <h1>
            Crea il tuo
            <br />
            <strong>profilo.</strong>
          </h1>

          <p>
            Inserisci le informazioni che vuoi
            rendere disponibili agli osservatori.
          </p>
        </div>

        {message && (
          <div className="dashboard-card">
            <span>ATTENZIONE</span>
            <h2>{message}</h2>
          </div>
        )}

        {!message && (
          <form
            className="profile-form"
            onSubmit={handleSubmit}
          >
            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="nome">Nome</label>

                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="cognome">
                  Cognome
                </label>

                <input
                  id="cognome"
                  type="text"
                  value={cognome}
                  onChange={(event) =>
                    setCognome(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="data_nascita">
                  Data di nascita
                </label>

                <input
                  id="data_nascita"
                  type="date"
                  value={dataNascita}
                  onChange={(event) =>
                    setDataNascita(event.target.value)
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="altezza">
                  Altezza (cm)
                </label>

                <input
                  id="altezza"
                  type="number"
                  min="100"
                  max="230"
                  value={altezza}
                  onChange={(event) =>
                    setAltezza(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="piede">
                  Piede
                </label>

                <select
                  id="piede"
                  value={piede}
                  onChange={(event) =>
                    setPiede(event.target.value)
                  }
                >
                  <option value="">
                    Seleziona...
                  </option>
                  <option value="Destro">
                    Destro
                  </option>
                  <option value="Sinistro">
                    Sinistro
                  </option>
                  <option value="Ambidestro">
                    Ambidestro
                  </option>
                </select>
              </div>

              <div className="profile-field">
                <label htmlFor="ruolo">
                  Ruolo
                </label>

                <select
                  id="ruolo"
                  value={ruolo}
                  onChange={(event) =>
                    setRuolo(event.target.value)
                  }
                >
                  <option value="">
                    Seleziona...
                  </option>
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

            <div className="profile-field">
              <label htmlFor="posizione">
                Posizione
              </label>

              <input
                id="posizione"
                type="text"
                value={posizione}
                onChange={(event) =>
                  setPosizione(event.target.value)
                }
                placeholder="Es. Terzino destro, Mezzala..."
              />
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="club">
                  Club
                </label>

                <input
                  id="club"
                  type="text"
                  value={club}
                  onChange={(event) =>
                    setClub(event.target.value)
                  }
                />
              </div>

              <div className="profile-field">
                <label htmlFor="categoria">
                  Categoria
                </label>

                <input
                  id="categoria"
                  type="text"
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value)
                  }
                  placeholder="Es. U17, U19..."
                />
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="provincia">
                Provincia
              </label>

              <input
                id="provincia"
                type="text"
                value={provincia}
                onChange={(event) =>
                  setProvincia(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="video">
                Video
              </label>

              <input
                id="video"
                type="url"
                value={video}
                onChange={(event) =>
                  setVideo(event.target.value)
                }
                placeholder="https://..."
              />
            </div>

            <div className="profile-field">
              <label htmlFor="bio">
                Descrizione
              </label>

              <textarea
                id="bio"
                rows={6}
                value={bio}
                onChange={(event) =>
                  setBio(event.target.value)
                }
                placeholder="Descrivi il giocatore..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Creazione..."
                : "Crea profilo →"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
