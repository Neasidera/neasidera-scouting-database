"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Registrazione completata. Controlla la tua email per confermare l'account."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <a href="/" className="auth-logo">
          NEASIDERA<span>SCOUTING</span>
        </a>

        <div className="auth-card">
          <div className="auth-header">
            <span>
              {isRegistering ? "CREA ACCOUNT" : "BENTORNATO"}
            </span>

            <h1>
              {isRegistering
                ? "Entra nel network."
                : "Accedi alla piattaforma."}
            </h1>

            <p>
              {isRegistering
                ? "Crea il tuo account per iniziare."
                : "Accedi al tuo account NeaSidera Scouting."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="nome@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />

            <button type="submit" disabled={loading}>
              {loading
                ? "Caricamento..."
                : isRegistering
                  ? "Crea account →"
                  : "Accedi →"}
            </button>
          </form>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <div className="auth-switch">
            {isRegistering
              ? "Hai già un account?"
              : "Non hai ancora un account?"}

            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage("");
              }}
            >
              {isRegistering ? "Accedi" : "Registrati"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
