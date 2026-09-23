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
        <a
          href="/dashboard"
          className="dashboard-logo"
        >
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
            Inserisci le tue informazioni per
            utilizzare al meglio NeaSidera Scouting.
          </p>
        </div>

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >
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
                onChange={(event) =>
                  setNome(event.target.value)
                }
              />
            </div>

            <div className="profile-field">
              <label htmlFor="cognome">
                Cognome
              </label>

              <input
                id="cognome"
                type="text"
                placeholder="Cognome"
                value={cognome}
                onChange={(event) =>
                  setCognome(event.target.value)
                }
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
              value={
                ruoloAccount || "Non configurato"
              }
              disabled
            />
          </div>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Salvataggio..."
              : "Salva profilo →"}
          </button>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}
        </form>

        {subscription && (
          <div className="profile-form">
            <div className="profile-field">
              <label>ABBONAMENTO</label>

              <input
                type="text"
                value={
                  subscription.status === "active"
                    ? "Attivo"
                    : subscription.status
                }
                disabled
              />
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>Tipo</label>

                <input
                  type="text"
                  value={subscription.account_role}
                  disabled
                />
              </div>

              <div className="profile-field">
                <label>Piano</label>

                <input
                  type="text"
                  value={formatPlan(
                    subscription.plan
                  )}
                  disabled
                />
              </div>
            </div>

            <div className="profile-field">
              <label>
                {subscription.cancel_at_period_end
                  ? "Abbonamento attivo fino al"
                  : "Prossimo rinnovo"}
              </label>

              <input
                type="text"
                value={formatDate(
                  subscription.current_period_end
                )}
                disabled
              />
            </div>

            {subscription.status === "active" && (
              <button
                type="button"
                onClick={
                  handleManageSubscription
                }
                disabled={openingPortal}
              >
                {openingPortal
                  ? "Apertura..."
                  : "Gestisci abbonamento →"}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
