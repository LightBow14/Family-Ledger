"use client";

import { useEffect, useState } from "react";
import { api } from "./lib/api";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  async function handleLogout() {
    await api("/logout", { method: "POST" });
    setUser(null);
  }

  if (!checked) {
    return <div className="center-shell" />;
  }

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
