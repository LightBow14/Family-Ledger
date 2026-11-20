"use client";

import { useState } from "react";
import { api } from "../lib/api";

export default function LoginScreen({ onLoggedIn }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await api("/login", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), password }),
      });
      setPassword("");
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-shell">
      <h1 className="brand">Family Ledger</h1>
      <p className="tagline">Every dollar, accounted for</p>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-name">Your name</label>
          <input
            id="login-name"
            type="text"
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn-stamp" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <p className="hint">
          First time using your name? Just pick a password — it'll create
          your account.
        </p>
        <p className="login-error">{error}</p>
      </form>
    </div>
  );
}
