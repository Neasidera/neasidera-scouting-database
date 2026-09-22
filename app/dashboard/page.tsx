"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [ruoloAccount, setRuoloAccount] = useState("");
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

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Errore caricamento profilo:", error);
        setLoading(false);
        return;
      }

      setRuoloAccount(profile?.ruolo_account ?? "");
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

  const isCalciatore = ruoloAccount === "Calciatore";
  const isScout = ruoloAccount === "Scout";
  const isAgente = ruoloAccount === "Agente";

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
          <span>
            {isCalciatore
              ? "AREA CALCIATORE"
              : isScout
              ? "AREA SCOUT"
              : isAgente
              ? "AREA AGENTE"
              : "AREA PERSONALE"}
          </span>

          <h1>
            Benvenuto in
            <br />
            <strong>NeaSidera.</strong>
          </h1>

          <p>
            {isCalciatore
              ? "Gestisci il tuo profilo e presenta le tue caratteristiche agli addetti ai lavori."
              : "La tua piattaforma per scoprire, analizzare e seguire nuovi talenti del calcio."}
          </p>
        </div>

        <div className="dashboard-grid">

          {isCalciatore && (
            <>
              <a
                href="/players"
                className="dashboard-card"
              >
                <span>01</span>
                <h2>Il mio profilo</h2>
                <p>
                  Visualizza e gestisci il tuo profilo
                  da calciatore.
                </p>
                <strong>→</strong>
              </a>

              <a
                href="/profile"
                className="dashboard-card"
              >
                <span>02</span>
                <h2>Account</h2>
                <p>
                  Gestisci le informazioni del tuo
                  account.
                </p>
                <strong>→</strong>
              </a>
            </>
          )}

          {(isScout || isAgente) && (
            <>
              <a
                href="/players"
                className="dashboard-card"
              >
                <span>01</span>
                <h2>Cerca giocatori</h2>
                <p>
                  Trova profili utilizzando filtri
                  avanzati.
                </p>
                <strong>→</strong>
              </a>

              <a
                href="/shortlist"
                className="dashboard-card"
              >
                <span>02</span>
                <h2>Shortlist</h2>
                <p>
                  Salva e organizza i giocatori che
                  ti interessano.
                </p>
                <strong>→</strong>
              </a>

              <a
                href="/profile"
                className="dashboard-card"
              >
                <span>03</span>
                <h2>Il mio profilo</h2>
                <p>
                  Completa e gestisci il tuo profilo.
                </p>
                <strong>→</strong>
              </a>
            </>
          )}

          {!isCalciatore && !isScout && !isAgente && (
            <a
              href="/profile"
              className="dashboard-card"
            >
              <span>01</span>
              <h2>Completa il profilo</h2>
              <p>
                Configura il tuo account per continuare.
              </p>
              <strong>→</strong>
            </a>
          )}

        </div>
      </section>
    </main>
  );
}
