"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPlayerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");

  const positionOptions =
    ruolo === "Portiere"
      ? ["Portiere"]
      : ruolo === "Difensore"
        ? [
            "Difensore centrale",
            "Terzino destro",
            "Terzino sinistro",
            "Quinto destro",
            "Quinto sinistro",
          ]
        : ruolo === "Centrocampista"
          ? [
              "Mediano",
              "Centrocampista centrale",
              "Mezzala destra",
              "Mezzala sinistra",
              "Trequartista",
            ]
          : ruolo === "Attaccante"
            ? [
                "Ala destra",
                "Ala sinistra",
                "Seconda punta",
                "Punta centrale",
              ]
            : [];

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.ruolo_account !== "Calciatore") {
        router.replace("/dashboard");
        return;
      }

      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPlayer) {
        router.replace(`/players/${existingPlayer.id}`);
        return;
      }

      setLoading(false);
    };

    checkAccess();
  }, [router, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.ruolo_account !== "Calciatore") {
        router.replace("/dashboard");
        return;
      }

      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPlayer) {
        router.replace(`/players/${existingPlayer.id}`);
        return;
      }

      if (videoFile) {
        const allowedTypes = [
          "video/mp4",
          "video/quicktime",
          "video/webm",
        ];

        if (!allowedTypes.includes(videoFile.type)) {
          throw new Error(
            "Formato video non supportato. Usa MP4, MOV o WEBM."
          );
        }

        if (videoFile.size > 50 * 1024 * 1024) {
          throw new Error(
            "Il video non può superare i 50 MB."
          );
        }
      }

      const { data: newPlayer, error: insertError } = await supabase
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
          video: null,
          bio: bio || null,
          visibile: true,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!newPlayer) {
        throw new Error("Profilo non creato.");
      }

      if (videoFile) {
        const videoPath = `${newPlayer.id}/video`;

        const { error: uploadError } = await supabase.storage
          .from("player-videos")
          .upload(videoPath, videoFile, {
            contentType: videoFile.type,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(
            "Errore caricamento video: " + uploadError.message
          );
        }

        const { error: videoUpdateError } = await supabase
          .from("players")
          .update({
            video: videoPath,
          })
          .eq("id", newPlayer.id)
          .eq("user_id", user.id);

        if (videoUpdateError) {
          throw new Error(
            "Errore salvataggio video: " +
              videoUpdateError.message
          );
        }
      }

      router.replace(`/players/${newPlayer.id}`);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Si è verificato un errore durante la creazione del profilo."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-container">
          <p>Caricamento...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Crea il tuo profilo calciatore</h1>
            <p>
              Inserisci i tuoi dati per creare il profilo visibile agli scout.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-card">
          <div>
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="cognome">Cognome</label>
            <input
              id="cognome"
              type="text"
              value={cognome}
              onChange={(event) => setCognome(event.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="dataNascita">Data di nascita</label>
            <input
              id="dataNascita"
              type="date"
              value={dataNascita}
              onChange={(event) =>
                setDataNascita(event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="altezza">Altezza (cm)</label>
            <input
              id="altezza"
              type="number"
              min="100"
              max="250"
              value={altezza}
              onChange={(event) => setAltezza(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="piede">Piede</label>
            <select
              id="piede"
              value={piede}
              onChange={(event) => setPiede(event.target.value)}
            >
              <option value="">Seleziona...</option>
              <option value="right">Destro</option>
              <option value="left">Sinistro</option>
              <option value="both">Ambidestro</option>
            </select>
          </div>

          <div>
            <label htmlFor="ruolo">Ruolo</label>
            <select
              id="ruolo"
              value={ruolo}
              onChange={(event) => {
                setRuolo(event.target.value);
                setPosizione("");
              }}
            >
              <option value="">Seleziona...</option>
              <option value="Portiere">Portiere</option>
              <option value="Difensore">Difensore</option>
              <option value="Centrocampista">
                Centrocampista
              </option>
              <option value="Attaccante">Attaccante</option>
            </select>
          </div>

          <div>
            <label htmlFor="posizione">Posizione</label>
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
                  ? "Seleziona..."
                  : "Seleziona prima il ruolo..."}
              </option>

              {positionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="club">Club</label>
            <input
              id="club"
              type="text"
              value={club}
              onChange={(event) => setClub(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="categoria">Categoria</label>
            <input
              id="categoria"
              type="text"
              value={categoria}
              onChange={(event) =>
                setCategoria(event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="provincia">Provincia</label>
            <input
              id="provincia"
              type="text"
              value={provincia}
              onChange={(event) =>
                setProvincia(event.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="videoFile">
              Video partita / highlights
            </label>

            <input
              id="videoFile"
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(event) =>
                setVideoFile(
                  event.target.files?.[0] ?? null
                )
              }
            />

            <small>
              MP4, MOV o WEBM · massimo 50 MB
            </small>

            {videoFile && (
              <p>
                File selezionato:{" "}
                <strong>{videoFile.name}</strong>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={6}
            />
          </div>

          {error && <p>{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Creazione..." : "Crea profilo"}
          </button>
        </form>
      </div>
    </main>
  );
}
