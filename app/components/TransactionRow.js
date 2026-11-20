"use client";

import { useEffect, useRef, useState } from "react";

export default function TransactionRow({
  tx,
  currentUserId,
  categories,
  onSaved,
  onDeleted,
}) {
  const isOwner = tx.user_id === currentUserId;
  const txAmount = Number(tx.amount);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(tx.category_id);
  const [amount, setAmount] = useState(txAmount.toFixed(2));
  const [note, setNote] = useState(tx.note || "");
  const [error, setError] = useState("");
  const confirmTimer = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  function startConfirm() {
    setEditing(false);
    setConfirming(true);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirming(false), 4000);
  }
  function cancelConfirm() {
    setConfirming(false);
    clearTimeout(confirmTimer.current);
  }
  function handleDelete() {
    cancelConfirm();
    onDeleted(tx.id);
  }

  function toggleEdit() {
    cancelConfirm();
    setError("");
    setEditing((v) => !v);
  }

  async function handleSave() {
    const numeric = parseFloat(amount);
    if (Number.isNaN(numeric) || numeric <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError("");
    await onSaved(tx.id, {
      category_id: Number(category),
      amount: numeric,
      note,
      date: tx.expense_date,
    });
    setEditing(false);
  }

  const dateFmt = new Date(tx.expense_date).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", timeZone: "UTC" }
  );

  return (
    <div className="r-line-wrap">
      <div className="r-row">
        <span className="cat">{tx.category_name}</span>
        <span className="dots" />
        <span className="amt">${txAmount.toFixed(2)}</span>
      </div>
      <div className="r-meta-row">
        <span className="r-meta">
          {tx.user_name} · {dateFmt}
          {tx.note ? ` · ${tx.note}` : ""}
        </span>
        {isOwner ? (
          <div className="r-actions">
            <button type="button" onClick={toggleEdit}>
              edit
            </button>
            <button type="button" className="del" onClick={startConfirm}>
              delete
            </button>
          </div>
        ) : (
          <span className="r-locked">not yours to edit</span>
        )}
      </div>

      {isOwner && (
        <div className={`confirm-bar${confirming ? " show" : ""}`}>
          <span>Delete this entry?</span>
          <div className="cbtns">
            <button type="button" className="no" onClick={cancelConfirm}>
              Cancel
            </button>
            <button type="button" className="yes" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className={`edit-form${editing ? " show" : ""}`}>
          <div className="row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="note-input"
            style={{ marginBottom: 0 }}
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="login-error" style={{ margin: 0 }}>{error}</p>}
          <div className="ebtns">
            <button type="button" className="cancel" onClick={toggleEdit}>
              Cancel
            </button>
            <button type="button" className="save" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
