
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
  const [premiumActive, setPremiumActive] = useState(false);
  const [premiumOfferVisible, setPremiumOfferVisible] = useState(true);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [premiumError, setPremiumError] = useState("");
  const [loading, setLoading] = useState(true);
  const [scoutOverview, setScoutOverview] = useState({ shortlistCount: 0, evaluatedCount: 0 });

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

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("ruolo_account")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error("Errore caricamento profilo:", profileError);
        setLoading(false);
        return;
      }

      const ruolo = profile?.ruolo_account ?? "";
      setRuoloAccount(ruolo);

      if (ruolo === "Calciatore") {
        const { data: premium } = await supabase
          .from("player_premium_subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        setPremiumActive(
          premium?.status === "active" ||
          premium?.status === "trialing"
        );
      }

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

        if (ruolo === "Scout" && subscription?.status === "active") {
          const { data: shortlist, error: shortlistError } = await supabase
            .from("shortlists")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (shortlistError) {
            console.error("Errore caricamento riepilogo shortlist:", shortlistError);
          } else if (shortlist?.id) {
            const { data: savedPlayers, error: savedPlayersError } = await supabase
              .from("shortlist_players")
              .select("player_id")
              .eq("shortlist_id", shortlist.id);

            if (savedPlayersError) {
              console.error("Errore caricamento giocatori shortlist:", savedPlayersError);
            } else {
              const playerIds = savedPlayers?.map((item) => item.player_id) ?? [];
              let evaluatedCount = 0;

              if (playerIds.length > 0) {
                const { data: ratings, error: ratingsError } = await supabase
                  .from("scout_ratings")
                  .select("player_id")
                  .eq("user_id", user.id)
                  .in("player_id", playerIds);

                if (ratingsError) {
                  console.error("Errore caricamento valutazioni scout:", ratingsError);
                } else {
                  evaluatedCount = ratings?.length ?? 0;
                }
              }

              setScoutOverview({
                shortlistCount: playerIds.length,
                evaluatedCount,
              });
            }
          }
        }
      }

      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handlePremiumCheckout() {
    setPremiumBusy(true);
    setPremiumError("");

    try {
      const response = await fetch(
        "/api/stripe/player-premium/checkout",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Impossibile avviare il pagamento."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      setPremiumError(
        error instanceof Error
          ? error.message
          : "Errore durante l'attivazione."
      );
      setPremiumBusy(false);
    }
  }

  async function handlePremiumPortal() {
    setPremiumBusy(true);
    setPremiumError("");

    try {
      const response = await fetch(
        "/api/stripe/player-premium/portal",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Impossibile aprire la gestione Premium."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      setPremiumError(
        error instanceof Error
          ? error.message
          : "Errore durante l'apertura."
      );
      setPremiumBusy(false);
    }
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

        {isCalciatore && !premiumActive && premiumOfferVisible && (
          <div className="dashboard-premium">
            <span className="dashboard-premium-eyebrow">
              ✦ NEASIDERA PREMIUM
            </span>

            <h2>
              Il tuo talento merita
              <br />
              <strong>più visibilità.</strong>
            </h2>

            <p>
              Fai emergere il tuo profilo nel database
              NeaSidera e aumenta le possibilità di essere
              notato da scout e agenti.
            </p>

            <div className="dashboard-premium-benefits">
              <div>
                <span>✦</span>
                <p>Badge Premium sul tuo profilo</p>
              </div>

              <div>
                <span>✦</span>
                <p>Maggiore visibilità nei risultati di ricerca</p>
              </div>

              <div>
                <span>✦</span>
                <p>Presenza nella sezione dedicata ai Premium</p>
              </div>
            </div>

            <div className="dashboard-premium-price">
              <strong>€4,99</strong>
              <span>/ mese</span>
            </div>

            <p className="dashboard-premium-note">
              Abbonamento mensile con rinnovo automatico.
              Puoi disdirlo quando vuoi.
            </p>

            {premiumError && (
              <p className="dashboard-premium-error">
                {premiumError}
              </p>
            )}

            <div className="dashboard-premium-actions">
              <button
                type="button"
                onClick={handlePremiumCheckout}
                disabled={premiumBusy}
                className="dashboard-premium-button"
              >
                {premiumBusy
                  ? "ATTENDI..."
                  : "ATTIVA PREMIUM →"}
              </button>

              <button
                type="button"
                onClick={() => setPremiumOfferVisible(false)}
                className="dashboard-premium-free"
              >
                Continua gratuitamente
              </button>
            </div>
          </div>
        )}

        {isCalciatore && premiumActive && (
          <div className="dashboard-premium-active">
            <span>✦ NEASIDERA PREMIUM ATTIVO</span>
            <p>
              Il tuo profilo beneficia dei vantaggi Premium.
            </p>

            <button
              type="button"
              onClick={handlePremiumPortal}
              disabled={premiumBusy}
            >
              {premiumBusy
                ? "ATTENDI..."
                : "GESTISCI ABBONAMENTO"}
            </button>
          </div>
        )}

        {isScout && subscriptionActive && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <span>SCOUTING OVERVIEW</span>
              <h2>{scoutOverview.shortlistCount}</h2>
              <p>Giocatori salvati nella tua shortlist.</p>
              <strong>PROFILI SALVATI</strong>
            </div>

            <div className="dashboard-card">
              <span>VALUTAZIONI</span>
              <h2>{scoutOverview.evaluatedCount}</h2>
              <p>
                Profili della shortlist con una tua valutazione.
              </p>
              <strong>
                {Math.max(0, scoutOverview.shortlistCount - scoutOverview.evaluatedCount)} DA VALUTARE
              </strong>
            </div>
          </div>
        )}

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

                {!premiumActive && (
                  <div className="dashboard-card dashboard-premium-cta">
                    <span>✦ PREMIUM</span>
                    <h2>Più visibilità.</h2>
                    <p>
                      Porta il tuo profilo al livello
                      successivo con NeaSidera Premium.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPremiumOfferVisible(true);
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                    >
                      SCOPRI PREMIUM →
                    </button>
                  </div>
                )}
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
