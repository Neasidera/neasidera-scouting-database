"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ruoloAccount, setRuoloAccount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (isRegistering) {
      if (!ruoloAccount) {
        setMessage(
          "Seleziona il tipo di account."
        );
        setLoading(false);
        return;
      }

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ruolo_account: ruoloAccount,
            },
          },
        });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Registrazione completata. Controlla la tua email per confermare l'account."
        );
      }
    } else {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  }

  function switchMode() {
    setIsRegistering(!isRegistering);
    setMessage("");
    setRuoloAccount("");
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <a href="/" className="auth-logo">
            NEASIDERA
            <span>SCOUTING</span>
          </a>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
              FOOTBALL / SCOUTING / NETWORK
            </span>

            <h1>
              Il talento
              <br />
              <strong>non aspetta.</strong>
            </h1>

            <p>
              Una piattaforma dedicata a giocatori,
              scout e agenti per scoprire, valutare
              e seguire nuovi profili.
            </p>
          </div>

          <div className="auth-brand-footer">
            <span>NEASIDERA SCOUTING</span>
            <span>01 / 01</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-mobile-logo">
            <a href="/" className="auth-logo">
              NEASIDERA
              <span>SCOUTING</span>
            </a>
          </div>

          <div className="auth-card">
            <div className="auth-header">
              <span className="auth-header-eyebrow">
                {isRegistering
                  ? "CREATE ACCOUNT"
                  : "MEMBER ACCESS"}
              </span>

              <h2>
                {isRegistering ? (
                  <>
                    Entra nel
                    <strong> network.</strong>
                  </>
                ) : (
                  <>
                    Accedi alla
                    <strong> piattaforma.</strong>
                  </>
                )}
              </h2>

              <p>
                {isRegistering
                  ? "Crea il tuo account e scegli come utilizzare NeaSidera."
                  : "Accedi al tuo account NeaSidera Scouting."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="email">
                  EMAIL
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="nome@email.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="password">
                  PASSWORD
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  minLength={6}
                  required
                />
              </div>

              {isRegistering && (
                <div className="auth-field">
                  <label htmlFor="ruolo_account">
                    TIPO DI ACCOUNT
                  </label>

                  <select
                    id="ruolo_account"
                    value={ruoloAccount}
                    onChange={(event) =>
                      setRuoloAccount(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Seleziona il tipo di account...
                    </option>

                    <option value="Calciatore">
                      Calciatore
                    </option>

                    <option value="Scout">
                      Scout
                    </option>

                    <option value="Agente">
                      Agente
                    </option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "CARICAMENTO..."
                  : isRegistering
                  ? "CREA ACCOUNT →"
                  : "ACCEDI →"}
              </button>
            </form>

            {message && (
              <div className="auth-message">
                {message}
              </div>
            )}

            <div className="auth-switch">
              <span>
                {isRegistering
                  ? "Hai già un account?"
                  : "Non hai ancora un account?"}
              </span>

              <button
                type="button"
                onClick={switchMode}
              >
                {isRegistering
                  ? "Accedi"
                  : "Registrati"}
              </button>
            </div>
          </div>

          <div className="auth-form-footer">
            <span>
              ACCESSO SICURO
            </span>

            <span>
              NEASIDERA © 2026
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
