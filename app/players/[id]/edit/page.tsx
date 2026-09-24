"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditPlayerPage() {
  const params = useParams();
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDelete, setVideoDelete] = useState(false);
  const [bio, setBio] = useState("");

  const [emailContatto, setEmailContatto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [contattoGenitore, setContattoGenitore] = useState("");

  const [schedaTecnica, setSchedaTecnica] =
    useState<File | null>(null);
  const [schedaTecnicaEsistente, setSchedaTecnicaEsistente] =
    useState(false);
  const [uploadingScheda, setUploadingScheda] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
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
          "id, nome, cognome, data_nascita, altezza, piede, ruolo, posizione, club, categoria, provincia, video, bio, user_id"
        )
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setMessage("Giocatore non trovato.");
        setLoading(false);
        return;
      }

      if (data.user_id !== user.id) {
        setMessage(
          "Non hai i permessi per modificare questo giocatore."
        );
        setLoading(false);
        return;
      }

      setNome(data.nome ?? "");
      setCognome(data.cognome ?? "");
      setDataNascita(data.data_nascita ?? "");
      setAltezza(data.altezza ? String(data.altezza) : "");
      setPiede(data.piede ?? "");
      setRuolo(data.ruolo ?? "");
      setPosizione(data.posizione ?? "");
      setClub(data.club ?? "");
      setCategoria(data.categoria ?? "");
      setProvincia(data.provincia ?? "");
      setVideo(data.video ?? "");
      setBio(data.bio ?? "");

      const {
        data: contacts,
        error: contactsError,
      } = await supabase
        .from("player_contacts")
        .select(
          "email, telefono, whatsapp, instagram, tiktok, contatto_genitore"
        )
        .eq("player_id", params.id)
        .maybeSingle();

      if (contactsError) {
        setMessage(
          "Errore caricamento contatti: " +
            contactsError.message
        );
        setLoading(false);
        return;
      }

      if (contacts) {
        setEmailContatto(contacts.email ?? "");
        setTelefono(contacts.telefono ?? "");
        setWhatsapp(contacts.whatsapp ?? "");
        setInstagram(contacts.instagram ?? "");
        setTiktok(contacts.tiktok ?? "");
        setContattoGenitore(
          contacts.contatto_genitore ?? ""
        );
      }

      const {
        data: documents,
        error: documentsError,
      } = await supabase.storage
        .from("player-documents")
        .list(String(params.id), {
          limit: 100,
        });

      if (documentsError) {
        setMessage(
          "Errore verifica scheda tecnica: " +
            documentsError.message
        );
        setLoading(false);
        return;
      }

      const hasSchedaTecnica = documents?.some(
        (file) => file.name === "scheda-tecnica.pdf"
      );

      setSchedaTecnicaEsistente(
        Boolean(hasSchedaTecnica)
      );

      setLoading(false);
    }

    loadPlayer();
  }, [params.id, router, supabase]);

  async function handleSchedaTecnicaUpload() {
    if (!schedaTecnica) {
      setMessage("Seleziona prima un file PDF.");
      return;
    }

    if (schedaTecnica.type !== "application/pdf") {
      setMessage(
        "La scheda tecnica deve essere un file PDF."
      );
      return;
    }

    if (schedaTecnica.size > 10 * 1024 * 1024) {
      setMessage(
        "Il file non può superare i 10 MB."
      );
      return;
    }

    setUploadingScheda(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: player, error: playerError } =
      await supabase
        .from("players")
        .select("id, user_id")
        .eq("id", params.id)
        .single();

    if (playerError || !player) {
      setMessage("Giocatore non trovato.");
      setUploadingScheda(false);
      return;
    }

    if (player.user_id !== user.id) {
      setMessage(
        "Non hai i permessi per caricare la scheda tecnica."
      );
      setUploadingScheda(false);
      return;
    }

    const filePath = `${params.id}/scheda-tecnica.pdf`;

    const { error: uploadError } =
      await supabase.storage
        .from("player-documents")
        .upload(filePath, schedaTecnica, {
          contentType: "application/pdf",
          upsert: true,
        });

    if (uploadError) {
      setMessage(
        "Errore caricamento scheda tecnica: " +
          uploadError.message
      );
      setUploadingScheda(false);
      return;
    }

    setSchedaTecnica(null);
    setSchedaTecnicaEsistente(true);
    setMessage(
      "Scheda tecnica caricata correttamente."
    );
    setUploadingScheda(false);
  }

  async function handleSchedaTecnicaDelete() {
    setUploadingScheda(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: player, error: playerError } =
      await supabase
        .from("players")
        .select("id, user_id")
        .eq("id", params.id)
        .single();

    if (playerError || !player) {
      setMessage("Giocatore non trovato.");
      setUploadingScheda(false);
      return;
    }

    if (player.user_id !== user.id) {
      setMessage(
        "Non hai i permessi per eliminare la scheda tecnica."
      );
      setUploadingScheda(false);
      return;
    }

    const filePath = `${params.id}/scheda-tecnica.pdf`;

    const { error: deleteError } =
      await supabase.storage
        .from("player-documents")
        .remove([filePath]);

    if (deleteError) {
      setMessage(
        "Errore eliminazione scheda tecnica: " +
          deleteError.message
      );
      setUploadingScheda(false);
      return;
    }

    setSchedaTecnicaEsistente(false);
    setMessage("Scheda tecnica eliminata.");
    setUploadingScheda(false);
  }

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

    const allowedVideoTypes = [
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ];

    if (videoFile) {
      if (!allowedVideoTypes.includes(videoFile.type)) {
        setMessage(
          "Il video deve essere in formato MP4, MOV o WEBM."
        );
        setSaving(false);
        return;
      }

      if (videoFile.size > 50 * 1024 * 1024) {
        setMessage(
          "Il video non può superare i 50 MB."
        );
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("players")
      .update({
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
        video: videoDelete ? null : video || null,
        bio: bio || null,
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    if (videoDelete && video) {
      if (!video.startsWith("http")) {
        const {
          error: deleteVideoError,
        } = await supabase.storage
          .from("player-videos")
          .remove([video]);

        if (deleteVideoError) {
          setMessage(
            "Errore eliminazione video: " +
              deleteVideoError.message
          );
          setSaving(false);
          return;
        }
      }

      setVideo("");
      setVideoDelete(false);
    }

    if (videoFile) {
      setVideoUploading(true);

      const videoPath = `${params.id}/video`;

      const {
        error: uploadVideoError,
      } = await supabase.storage
        .from("player-videos")
        .upload(videoPath, videoFile, {
          contentType: videoFile.type,
          upsert: true,
        });

      if (uploadVideoError) {
        setMessage(
          "Errore caricamento video: " +
            uploadVideoError.message
        );
        setVideoUploading(false);
        setSaving(false);
        return;
      }

      const {
        error: videoPathError,
      } = await supabase
        .from("players")
        .update({
          video: videoPath,
        })
        .eq("id", params.id)
        .eq("user_id", user.id);

      if (videoPathError) {
        setMessage(
          "Video caricato, ma non è stato possibile collegarlo al profilo: " +
            videoPathError.message
        );
        setVideoUploading(false);
        setSaving(false);
        return;
      }

      setVideo(videoPath);
      setVideoFile(null);
      setVideoDelete(false);
      setVideoUploading(false);
    }

    const {
      data: existingContacts,
      error: contactsCheckError,
    } = await supabase
      .from("player_contacts")
      .select("id")
      .eq("player_id", params.id)
      .maybeSingle();

    if (contactsCheckError) {
      setMessage(
        "Errore verifica contatti: " +
          contactsCheckError.message
      );
      setSaving(false);
      return;
    }

    const contactsData = {
      player_id: String(params.id),
      email: emailContatto || null,
      telefono: telefono || null,
      whatsapp: whatsapp || null,
      instagram: instagram || null,
      tiktok: tiktok || null,
      contatto_genitore:
        contattoGenitore || null,
    };

    if (existingContacts?.id) {
      const {
        error: contactsUpdateError,
      } = await supabase
        .from("player_contacts")
        .update(contactsData)
        .eq("id", existingContacts.id);

      if (contactsUpdateError) {
        setMessage(
          "Errore salvataggio contatti: " +
            contactsUpdateError.message
        );
        setSaving(false);
        return;
      }
    } else {
      const {
        error: contactsInsertError,
      } = await supabase
        .from("player_contacts")
        .insert(contactsData);

      if (contactsInsertError) {
        setMessage(
          "Errore creazione contatti: " +
            contactsInsertError.message
        );
        setSaving(false);
        return;
      }
    }

    router.push(`/players/${params.id}`);
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Caricamento giocatore...
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
          <a href={`/players/${params.id}`}>
            ← Torna al profilo
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

      <section className="dashboard-content edit-player-page">
        <div className="edit-player-hero">
          <div className="edit-player-hero-top">
            <span className="edit-player-eyebrow">
              PLAYER MANAGEMENT
            </span>

            <span className="edit-player-status">
              EDIT MODE
            </span>
          </div>

          <h1>
            Modifica il
            <br />
            <strong>profilo.</strong>
          </h1>

          <div className="edit-player-hero-bottom">
            <p>
              Aggiorna e completa il profilo del giocatore.
              <br />
              Mantieni le informazioni sempre pronte per lo scouting.
            </p>

            <span className="edit-player-id">
              ID / {String(params.id).slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {message && (
          <div className="dashboard-card">
            <span>ATTENZIONE</span>
            <h2>{message}</h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/players/${params.id}`
                )
              }
            >
              ← Torna al profilo
            </button>
          </div>
        )}

        {!message && (
          <form
            className="profile-form neasidera-edit-form"
            onSubmit={handleSubmit}
          >
            <div className="edit-section-header">
              <div className="edit-section-number">
                01
              </div>

              <div>
                <span>PLAYER PROFILE</span>
                <h2>Dati del giocatore</h2>
                <p>
                  Informazioni principali utilizzate per
                  identificare e valutare il profilo.
                </p>
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="nome">
                  Nome
                </label>

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
                    setDataNascita(
                      event.target.value
                    )
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
                    setAltezza(
                      event.target.value
                    )
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
                    setPiede(
                      event.target.value
                    )
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
                    setRuolo(
                      event.target.value
                    )
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
                  setPosizione(
                    event.target.value
                  )
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
                    setClub(
                      event.target.value
                    )
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
                    setCategoria(
                      event.target.value
                    )
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
                  setProvincia(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="videoFile">
                Video partita / highlights
              </label>

              {video && !videoDelete && (
                <p
                  style={{
                    marginBottom: "10px",
                    opacity: 0.7,
                  }}
                >
                  {video.startsWith("http")
                    ? "Video esterno già collegato."
                    : "Video già caricato sul profilo."}
                </p>
              )}

              <input
                id="videoFile"
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(event) => {
                  setVideoFile(
                    event.target.files?.[0] ?? null
                  );
                  setVideoDelete(false);
                }}
              />

              <small
                style={{
                  opacity: 0.6,
                }}
              >
                MP4, MOV o WEBM · massimo 50 MB.
              </small>

              {videoFile && (
                <p
                  style={{
                    marginTop: "8px",
                  }}
                >
                  Nuovo video:{" "}
                  <strong>{videoFile.name}</strong>
                </p>
              )}

              {video &&
                !video.startsWith("http") &&
                !videoDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoDelete(true);
                      setVideoFile(null);
                    }}
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    Elimina video
                  </button>
                )}

              {videoDelete && (
                <p
                  style={{
                    marginTop: "10px",
                    opacity: 0.7,
                  }}
                >
                  Il video verrà eliminato quando
                  salverai le modifiche.
                </p>
              )}
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
                  setBio(
                    event.target.value
                  )
                }
                placeholder="Descrivi il giocatore..."
              />
            </div>

            <div className="edit-section-header edit-section-spaced">
              <div className="edit-section-number">
                02
              </div>

              <div>
                <span>CONTACTS</span>
                <h2>Contatti</h2>
                <p>
                  Informazioni disponibili agli Scout e
                  agli Agenti sui profili autorizzati.
                </p>
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="emailContatto">
                  Email
                </label>

                <input
                  id="emailContatto"
                  type="email"
                  value={emailContatto}
                  onChange={(event) =>
                    setEmailContatto(
                      event.target.value
                    )
                  }
                  placeholder="nome@email.com"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="telefono">
                  Telefono
                </label>

                <input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(event) =>
                    setTelefono(
                      event.target.value
                    )
                  }
                  placeholder="+39 ..."
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="whatsapp">
                  WhatsApp
                </label>

                <input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(event) =>
                    setWhatsapp(
                      event.target.value
                    )
                  }
                  placeholder="+39 ..."
                />
              </div>

              <div className="profile-field">
                <label htmlFor="instagram">
                  Instagram
                </label>

                <input
                  id="instagram"
                  type="text"
                  value={instagram}
                  onChange={(event) =>
                    setInstagram(
                      event.target.value
                    )
                  }
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label htmlFor="tiktok">
                  TikTok
                </label>

                <input
                  id="tiktok"
                  type="text"
                  value={tiktok}
                  onChange={(event) =>
                    setTiktok(
                      event.target.value
                    )
                  }
                  placeholder="@username"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="contattoGenitore">
                  Contatto genitore/tutore
                </label>

                <input
                  id="contattoGenitore"
                  type="text"
                  value={contattoGenitore}
                  onChange={(event) =>
                    setContattoGenitore(
                      event.target.value
                    )
                  }
                  placeholder="Telefono o email"
                />
              </div>
            </div>

            <div className="edit-section-header edit-section-spaced">
              <div className="edit-section-number">
                03
              </div>

              <div>
                <span>DOCUMENTS</span>
                <h2>Scheda tecnica</h2>
                <p>
                  Carica e gestisci la documentazione
                  tecnica associata al profilo.
                </p>
              </div>
            </div>

            <div className="profile-field">
              <label htmlFor="schedaTecnica">
                {schedaTecnicaEsistente
                  ? "Sostituisci scheda tecnica"
                  : "Carica scheda tecnica"}
              </label>

              <input
                id="schedaTecnica"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setSchedaTecnica(
                    event.target.files?.[0] ??
                      null
                  )
                }
              />

              <small
                style={{
                  opacity: 0.6,
                }}
              >
                Solo PDF, massimo 10 MB.
              </small>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                onClick={
                  handleSchedaTecnicaUpload
                }
                disabled={
                  uploadingScheda ||
                  !schedaTecnica
                }
              >
                {uploadingScheda
                  ? "Caricamento..."
                  : schedaTecnicaEsistente
                  ? "Sostituisci scheda →"
                  : "Carica scheda →"}
              </button>

              {schedaTecnicaEsistente && (
                <button
                  type="button"
                  onClick={
                    handleSchedaTecnicaDelete
                  }
                  disabled={uploadingScheda}
                >
                  Elimina scheda
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                videoUploading ||
                uploadingScheda
              }
            >
              {saving || videoUploading
                ? "Salvataggio..."
                : "Salva modifiche →"}
            </button>

            {message && (
              <p className="auth-message">
                {message}
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
