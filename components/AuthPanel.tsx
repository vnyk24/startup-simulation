"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type Mode = "login" | "signup";

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(formatAuthError(authError.message));
          setLoading(false);
          return;
        }
        window.location.href = "/dashboard";
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(formatAuthError(authError.message));
        setLoading(false);
        return;
      }

      if (!data.session) {
        setMessage("Account created. Check your inbox to confirm your email, then log in.");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  function formatAuthError(raw: string) {
    const msg = raw.toLowerCase();
    if (msg.includes("email not confirmed")) return "Email not confirmed. Check your inbox first.";
    if (msg.includes("rate limit")) return "Too many attempts. Wait a few minutes and try again.";
    if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
    if (msg.includes("password should be at least")) return "Password must be at least 6 characters.";
    return raw;
  }

  return (
    <div className="auth-card">
      <h1 className="auth-brand-name">Startup Sim</h1>
      <p className="auth-tagline">
        Run your startup one quarter at a time and see how your decisions play out
      </p>
      <div className="auth-divider" />
      <div className="auth-header">
        <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
        <p>
          {mode === "login"
            ? "Enter your credentials to continue."
            : "Create an account to start a new run."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
        {error && <p className="error">{error}</p>}
        {message && <p className="hint">{message}</p>}
      </form>

      <p className="auth-switch">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
