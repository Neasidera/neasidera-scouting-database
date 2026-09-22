"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [ruoloAccount, setRuoloAccount] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("nome, cognome, ruolo_account")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setNome(data.nome ?? "");
        setCognome(data.cognome ?? "");
        setRuoloAccount(data.ruolo_account ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        nome,
        cognome,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profilo salvato correttamente.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Caricamento...
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
          <span>{email}</span>

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
          <span>IL MIO PROFILO</span>

          <h1>
            Completa il tuo
            <br />
            <strong>profilo.</strong>
          </h1>

          <p>
            Inserisci le tue informazioni per utilizzare al meglio
            NeaSidera Scouting.
          </p>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="cognome">Cognome</label>
              <input
                id="cognome"
                type="text"
                placeholder="Cognome"
                value={cognome}
                onChange={(event) => setCognome(event.target.value)}
              />
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="ruolo_account">
              Tipo di account
            </label>

            <input
              id="ruolo_account"
              type="text"
              value={ruoloAccount || "Non configurato"}
              disabled
            />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva profilo →"}
          </button>

          {message && (
            <p className="auth-message">{message}</p>
          )}
        </form>
      </section>
    </main>
  );
}
