"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
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
        <a href="/" className="dashboard-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="dashboard-user">
          <span>{email}</span>

          <button onClick={handleLogout}>
            Esci
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <span>AREA PERSONALE</span>

          <h1>
            Benvenuto in<br />
            <strong>NeaSidera.</strong>
          </h1>

          <p>
            La tua piattaforma per scoprire, analizzare e
            seguire nuovi talenti del calcio.
          </p>
        </div>

        <div className="dashboard-grid">
          <button className="dashboard-card">
            <span>01</span>
            <h2>Giocatori</h2>
            <p>
              Esplora il database dei giocatori.
            </p>
            <strong>→</strong>
          </button>

          <button className="dashboard-card">
            <span>02</span>
            <h2>Cerca giocatori</h2>
            <p>
              Trova profili utilizzando filtri avanzati.
            </p>
            <strong>→</strong>
          </button>

          <button className="dashboard-card">
            <span>03</span>
            <h2>Il mio profilo</h2>
            <p>
              Completa e gestisci il tuo profilo.
            </p>
            <strong>→</strong>
          </button>

          <button className="dashboard-card">
            <span>04</span>
            <h2>Shortlist</h2>
            <p>
              Salva e organizza i giocatori che ti interessano.
            </p>
            <strong>→</strong>
          </button>
        </div>
      </section>
    </main>
  );
}
