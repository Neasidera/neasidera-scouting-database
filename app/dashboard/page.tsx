"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [ruoloAccount, setRuoloAccount] = useState("");
  const [subscriptionActive, setSubscriptionActive] = useState(false);
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("ruolo_account")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Errore caricamento profilo:",
          profileError
        );
        setLoading(false);
        return;
      }

      const ruolo = profile?.ruolo_account ?? "";

      setRuoloAccount(ruolo);

      if (ruolo === "Scout" || ruolo === "Agente") {
        const { data: subscription, error: subscriptionError } =
          await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();

        if (subscriptionError) {
          console.error(
            "Errore caricamento abbonamento:",
            subscriptionError
          );
        }

        setSubscriptionActive(
          subscription?.status === "active"
        );
      }

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

  const needsSubscription =
    (isScout || isAgente) && !subscriptionActive;

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
              : needsSubscription
              ? "Attiva il tuo abbonamento per accedere al database di scouting."
              : "La tua piattaforma per scoprire, analizzare e seguire nuovi talenti del calcio."}
          </p>
        </div>

        {needsSubscription ? (
          <div className="dashboard-grid">
            <a
              href="/subscription"
              className="dashboard-card"
            >
              <span>01</span>
              <h2>Attiva il tuo accesso</h2>
              <p>
                Scegli il piano Scout o Agente e accedi
                al database NeaSidera.
              </p>
              <strong>→</strong>
            </a>

            <a
              href="/profile"
              className="dashboard-card"
            >
              <span>02</span>
              <h2>Il mio profilo</h2>
              <p>
                Completa e gestisci le informazioni del
                tuo account.
              </p>
              <strong>→</strong>
            </a>
          </div>
        ) : (
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

            {!isCalciatore &&
              !isScout &&
              !isAgente && (
                <a
                  href="/profile"
                  className="dashboard-card"
                >
                  <span>01</span>
                  <h2>Completa il profilo</h2>
                  <p>
                    Configura il tuo account per
                    continuare.
                  </p>
                  <strong>→</strong>
                </a>
              )}

          </div>
        )}
      </section>
    </main>
  );
}
