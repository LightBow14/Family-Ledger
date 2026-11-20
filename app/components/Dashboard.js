"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import Donut from "./Donut";
import TransactionRow from "./TransactionRow";

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function formatMonth(m) {
  const [y, mo] = m.split("-");
  const d = new Date(parseInt(y), parseInt(mo) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function Dashboard({ user, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [months, setMonths] = useState([]);
  const [month, setMonth] = useState(currentMonthStr());
  const [categorySummary, setCategorySummary] = useState([]);
  const [drill, setDrill] = useState(null); // { category_id, category_name }
  const [drillData, setDrillData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addError, setAddError] = useState("");
  const [animKey, setAnimKey] = useState(0);

  const refsToAnimate = useRef([]);

  useEffect(() => {
    loadCategories();
    loadMonths();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [month]);

  useEffect(() => {
    // staggered load-in, respects prefers-reduced-motion via CSS
    const els = refsToAnimate.current.filter(Boolean);
    els.forEach((el, i) => {
      el.classList.remove("in");
      void el.offsetWidth; // reflow to restart animation
      setTimeout(() => el.classList.add("in"), 80 + i * 110);
    });
  }, [animKey]);

  async function loadCategories() {
    const cats = await api("/categories");
    setCategories(cats);
    if (cats.length > 0) setActiveCat(cats[0].id);
  }

  async function loadMonths() {
    const m = await api("/summary/months");
    const cm = currentMonthStr();
    setMonths(m.includes(cm) ? m : [cm, ...m]);
  }

  async function loadDashboard() {
    setDrill(null);
    const [summary, tx] = await Promise.all([
      api(`/summary/by-category?month=${month}`),
      api(`/expenses?month=${month}`),
    ]);
    setCategorySummary(summary);
    setTransactions(tx);
    setAnimKey((k) => k + 1);
  }

  async function handleDrill(seg) {
    const data = await api(
      `/summary/by-category/${seg.category_id}/by-user?month=${month}`
    );
    setDrill({ category_id: seg.category_id, category_name: seg.category_name });
    setDrillData(data);
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    setAddError("");
    const numeric = parseFloat(amount);
    if (Number.isNaN(numeric) || numeric <= 0) {
      setAddError("Enter a valid amount.");
      return;
    }
    try {
      await api("/expenses", {
        method: "POST",
        body: JSON.stringify({
          category_id: activeCat,
          amount: numeric,
          note,
          date: todayStr(),
        }),
      });
      setAmount("");
      setNote("");
      await loadMonths();
      await loadDashboard();
    } catch (err) {
      setAddError(err.message);
    }
  }

  async function handleSaveEdit(id, payload) {
    await api(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    await loadDashboard();
  }

  async function handleDelete(id) {
    await api(`/expenses/${id}`, { method: "DELETE" });
    await loadDashboard();
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api("/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      setNewCatName("");
      await loadCategories();
    } catch (err) {
      alert(err.message);
    }
  }

  const totalSpent = categorySummary.reduce((s, c) => s + c.total, 0);
  const drillTotal = drillData.reduce((s, d) => s + d.total, 0);

  return (
    <div className="app-shell">
      <div className="nametag-row" ref={(el) => (refsToAnimate.current[0] = el)}>
        <span className="nametag">
          <span className="dot" />
          {user.name}
        </span>
        <button className="switch-link" onClick={onLogout} type="button">
          Switch user
        </button>
      </div>

      <div className="card" ref={(el) => (refsToAnimate.current[1] = el)}>
        <h2>New entry</h2>
        <form onSubmit={handleAddExpense}>
          <div className="tab-row">
            {categories.map((c) => (
              <span
                key={c.id}
                className={`tab${c.id === activeCat ? " active" : ""}`}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
              </span>
            ))}
          </div>
          <div className="amount-row">
            <span className="cur">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="note-input"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {addError && <p className="login-error">{addError}</p>}
          <button className="btn-stamp" type="submit">
            Add to ledger
          </button>
        </form>
      </div>

      <div className="card" ref={(el) => (refsToAnimate.current[2] = el)}>
        <h2>
          {drill ? drill.category_name : formatMonth(month)}
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </h2>

        {drill && (
          <button className="drill-back" onClick={() => setDrill(null)} type="button">
            ← back to categories
          </button>
        )}

        {drill ? (
          drillData.length === 0 ? (
            <p className="empty-note">No spending here yet.</p>
          ) : (
            <Donut
              segments={drillData.map((d) => ({
                category_id: d.user_id,
                category_name: d.user_name,
                total: d.total,
              }))}
              total={drillTotal}
              centerLabel="By person"
            />
          )
        ) : categorySummary.length === 0 ? (
          <p className="empty-note">No expenses logged for this month yet.</p>
        ) : (
          <Donut
            segments={categorySummary}
            total={totalSpent}
            centerLabel="Total spent"
            onSlickClick={handleDrill}
          />
        )}
      </div>

      <div className="receipt" ref={(el) => (refsToAnimate.current[3] = el)}>
        <h2>Recent</h2>
        {transactions.length === 0 ? (
          <p className="empty-note">No entries logged for this month yet.</p>
        ) : (
          transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              currentUserId={user.id}
              categories={categories}
              onSaved={handleSaveEdit}
              onDeleted={handleDelete}
            />
          ))
        )}
      </div>

      <div className="settings-toggle">
        <button type="button" onClick={() => setShowSettings((v) => !v)}>
          Manage categories
        </button>
      </div>

      {showSettings && (
        <div className="card" style={{ opacity: 1, transform: "none", marginTop: 12 }}>
          <h2>Categories</h2>
          <div className="manage-list">
            {categories.map((c) => (
              <span key={c.id} className="chip">
                {c.name}
              </span>
            ))}
          </div>
          <form className="add-cat-row" onSubmit={handleAddCategory}>
            <input
              type="text"
              placeholder="Add category"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <button className="btn-stamp" type="submit">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
