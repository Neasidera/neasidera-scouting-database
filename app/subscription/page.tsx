"use client";

import { useState } from "react";

type Plan =
  | "scout_weekly"
  | "scout_monthly"
  | "agent_weekly"
  | "agent_monthly";

export default function SubscriptionPage() {
  const [loadingPlan, setLoadingPlan] =
    useState<Plan | null>(null);

  async function handleCheckout(plan: Plan) {
    try {
      setLoadingPlan(plan);

      const response = await fetch(
        "/api/stripe/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Si è verificato un errore."
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert(
        "Non è stato possibile avviare il pagamento."
      );
    } catch (error) {
      console.error(
        "Errore Checkout:",
        error
      );

      alert(
        "Si è verificato un errore. Riprova."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="dashboard-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <a
          href="/dashboard"
          className="login-button"
        >
          ← Dashboard
        </a>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <span>ACCESSO DATABASE</span>

          <h1>
            Scegli il tuo
            <br />
            <strong>abbonamento.</strong>
          </h1>

          <p>
            Scegli il piano più adatto al tuo
            lavoro di scouting e accedi al database
            NeaSidera.
          </p>
        </div>

        <div className="dashboard-grid">

          <div className="dashboard-card">
            <span>01</span>

            <h2>Scout · Settimanale</h2>

            <p>
              Accesso al database per 7 giorni.
            </p>

            <h3>€4,99 / settimana</h3>

            <button
              className="primary-button"
              onClick={() =>
                handleCheckout("scout_weekly")
              }
              disabled={
                loadingPlan === "scout_weekly"
              }
            >
              {loadingPlan === "scout_weekly"
                ? "Caricamento..."
                : "Continua →"}
            </button>
          </div>

          <div className="dashboard-card">
            <span>02</span>

            <h2>Scout · Mensile</h2>

            <p>
              Accesso al database per un mese.
            </p>

            <h3>€14,99 / mese</h3>

            <button
              className="primary-button"
              onClick={() =>
                handleCheckout("scout_monthly")
              }
              disabled={
                loadingPlan === "scout_monthly"
              }
            >
              {loadingPlan === "scout_monthly"
                ? "Caricamento..."
                : "Continua →"}
            </button>
          </div>

          <div className="dashboard-card">
            <span>03</span>

            <h2>Agente · Settimanale</h2>

            <p>
              Accesso al database per 7 giorni.
            </p>

            <h3>€4,99 / settimana</h3>

            <button
              className="primary-button"
              onClick={() =>
                handleCheckout("agent_weekly")
              }
              disabled={
                loadingPlan === "agent_weekly"
              }
            >
              {loadingPlan === "agent_weekly"
                ? "Caricamento..."
                : "Continua →"}
            </button>
          </div>

          <div className="dashboard-card">
            <span>04</span>

            <h2>Agente · Mensile</h2>

            <p>
              Accesso al database per un mese.
            </p>

            <h3>€14,99 / mese</h3>

            <button
              className="primary-button"
              onClick={() =>
                handleCheckout("agent_monthly")
              }
              disabled={
                loadingPlan === "agent_monthly"
              }
            >
              {loadingPlan === "agent_monthly"
                ? "Caricamento..."
                : "Continua →"}
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}
