"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Subscription = {
  account_role: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [ruoloAccount, setRuoloAccount] = useState("");
  const [email, setEmail] = useState("");

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
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

      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select(
          "account_role, plan, status, current_period_end, cancel_at_period_end"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriptionData) {
        setSubscription(subscriptionData);
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

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

  async function handleManageSubscription() {
    setOpeningPortal(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/stripe/portal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        setMessage(
          data.error ||
            "Errore nell'apertura del portale Stripe."
        );
        setOpeningPortal(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setMessage(
        "Errore di connessione al portale Stripe."
      );
      setOpeningPortal(false);
    }
  }

  function formatPlan(plan: string) {
    if (plan === "weekly") {
      return "Settimanale";
    }

    if (plan === "monthly") {
      return "Mensile";
    }

    return plan;
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "it-IT",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return (
      <main className="dashboard-page profile-page">
        <div className="dashboard-loading">
          Caricamento profilo...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page profile-page">
      <header className="dashboard-header">
        <a
          href="/dashboard"
          className="dashboard-logo"
        >
          NEASIDERA
          <span>SCOUTING</span>
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

      <section className="dashboard-content profile-content">
        <div className="profile-hero">
          <div className="profile-hero-top">
            <span className="profile-eyebrow">
              ACCOUNT / PROFILE
            </span>

            <span className="profile-account-status">
              {ruoloAccount || "NON CONFIGURATO"}
            </span>
          </div>

          <h1>
            Il mio
            <br />
            <strong>profilo.</strong>
          </h1>

          <div className="profile-hero-bottom">
            <p>
              Gestisci le tue informazioni personali,
              il ruolo del tuo account e il tuo
              abbonamento NeaSidera.
            </p>
          </div>
        </div>

        <div className="profile-layout">
          <form
            className="profile-panel profile-details-panel"
            onSubmit={handleSubmit}
          >
            <div className="profile-panel-heading">
              <div>
                <span className="profile-panel-number">
                  01
                </span>

                <div>
                  <span className="profile-panel-eyebrow">
                    PERSONAL DATA
                  </span>

                  <h2>
                    Informazioni
                    <strong> personali.</strong>
                  </h2>
                </div>
              </div>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label htmlFor="email">
                  EMAIL
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
              </div>

              <div className="profile-row">
                <div className="profile-field">
                  <label htmlFor="nome">
                    NOME
                  </label>

                  <input
                    id="nome"
                    type="text"
                    placeholder="Nome"
                    value={nome}
                    onChange={(event) =>
                      setNome(event.target.value)
                    }
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="cognome">
                    COGNOME
                  </label>

                  <input
                    id="cognome"
                    type="text"
                    placeholder="Cognome"
                    value={cognome}
                    onChange={(event) =>
                      setCognome(
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="ruolo_account">
                  ACCOUNT ROLE
                </label>

                <input
                  id="ruolo_account"
                  type="text"
                  value={
                    ruoloAccount ||
                    "Non configurato"
                  }
                  disabled
                />
              </div>
            </div>

            <div className="profile-panel-footer">
              <span>
                Le modifiche vengono salvate
                direttamente sul tuo profilo.
              </span>

              <button
                type="submit"
                disabled={saving}
                className="profile-save-button"
              >
                {saving
                  ? "SALVATAGGIO..."
                  : "SALVA PROFILO →"}
              </button>
            </div>

            {message && (
              <p className="profile-message">
                {message}
              </p>
            )}
          </form>

          {subscription && (
            <section className="profile-panel profile-subscription-panel">
              <div className="profile-panel-heading">
                <div>
                  <span className="profile-panel-number">
                    02
                  </span>

                  <div>
                    <span className="profile-panel-eyebrow">
                      SUBSCRIPTION
                    </span>

                    <h2>
                      Il tuo
                      <strong> accesso.</strong>
                    </h2>
                  </div>
                </div>

                <span
                  className={`profile-subscription-status ${
                    subscription.status ===
                    "active"
                      ? "is-active"
                      : ""
                  }`}
                >
                  {subscription.status ===
                  "active"
                    ? "ATTIVO"
                    : subscription.status.toUpperCase()}
                </span>
              </div>

              <div className="profile-subscription-grid">
                <div>
                  <span>TIPO ACCOUNT</span>

                  <strong>
                    {subscription.account_role}
                  </strong>
                </div>

                <div>
                  <span>PIANO</span>

                  <strong>
                    {formatPlan(
                      subscription.plan
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    {subscription.cancel_at_period_end
                      ? "ACCESSO FINO AL"
                      : "PROSSIMO RINNOVO"}
                  </span>

                  <strong>
                    {formatDate(
                      subscription.current_period_end
                    )}
                  </strong>
                </div>
              </div>

              {subscription.status ===
                "active" && (
                <button
                  type="button"
                  onClick={
                    handleManageSubscription
                  }
                  disabled={openingPortal}
                  className="profile-manage-button"
                >
                  {openingPortal
                    ? "APERTURA..."
                    : "GESTISCI ABBONAMENTO →"}
                </button>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
