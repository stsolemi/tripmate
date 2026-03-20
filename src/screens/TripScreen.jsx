import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { calcSettlement } from "../lib/utils";
import { WRAP, BG, mc } from "../styles/tokens";
import { Avatar, Card, Label, ErrBox, Spinner, SectionTitle } from "../components/UI";

// ── Expense Form (used for both Add and Edit) ─────────────────────────────
function ExpenseForm({ trip, user, initialData, onSave, onCancel, loading, error }) {
  const memberNames = (trip.trip_members || []).map(m => m.display_name);
  const myName = trip.trip_members?.find(m => m.user_id === user.id)?.display_name || memberNames[0] || "";

  const [desc, setDesc] = useState(initialData?.desc ?? "");
  const [amount, setAmount] = useState(initialData?.amount ?? "");
  const [paidBy, setPaidBy] = useState(initialData?.paidBy ?? myName);
  const [split, setSplit] = useState(initialData?.splitAmong ?? [...memberNames]);

  const isEdit = !!initialData;
  const accentColor = isEdit ? "#FFD93D" : "#4ECDC4";

  function toggleSplit(name) {
    setSplit(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  }

  function handleSave() {
    onSave({ desc, amount: parseFloat(amount), paidBy, splitAmong: split });
  }

  return (
    <Card style={{ marginBottom: "1.5rem", animation: "fadeUp 0.22s ease" }}>
      <div style={{ fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: accentColor, marginBottom: 12 }}>
        {isEdit ? "Edit expense" : "New expense"}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          placeholder="What was it for?"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          style={{ flex: 2 }}
          autoFocus
        />
        <input
          placeholder={`${trip.currency}0`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          type="number"
          min="0"
          step="0.01"
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {/* Paid by */}
        <div style={{ flex: 1 }}>
          <Label>Paid by</Label>
          <select value={paidBy} onChange={e => setPaidBy(e.target.value)}>
            {memberNames.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Split among */}
        <div style={{ flex: 1 }}>
          <Label>Split among</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {memberNames.map((m, i) => {
              const active = split.includes(m);
              const c = mc(i);
              return (
                <button
                  key={m}
                  onClick={() => toggleSplit(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px 4px 4px", borderRadius: 20, cursor: "pointer",
                    border: `1px solid ${active ? c : "#2E3D5F"}`,
                    background: active ? c + "18" : "transparent",
                    transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif",
                    fontSize: 12, color: active ? c : "#4D6080",
                  }}
                >
                  <Avatar name={m} idx={i} size={18} />{m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ErrBox msg={error} />
      <div style={{ display: "flex", gap: 8, marginTop: error ? 8 : 0 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{ flex: 2, padding: "10px", borderRadius: 10, background: accentColor, border: "none", color: "#161C2D", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Spinner color="#161C2D" size={13} />}
          {isEdit ? "Save changes" : "Add expense"}
        </button>
      </div>
    </Card>
  );
}

// ── Main TripScreen ───────────────────────────────────────────────────────
export default function TripScreen({ trip: initialTrip, user, onBack }) {
  const [trip, setTrip] = useState(initialTrip);
  const [tab, setTab] = useState("expenses");
  const [formOpen, setFormOpen] = useState(false);   // add form
  const [editingId, setEditingId] = useState(null);    // id of expense being edited
  const [confirmDel, setConfirmDel] = useState(null);    // id of expense awaiting delete confirm
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef(null);

  const members = trip.trip_members || [];
  const memberNames = members.map(m => m.display_name);
  const expenses = trip.expenses || [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const settlements = calcSettlement(expenses, memberNames);

  // Realtime: subscribe to trip row updates
  useEffect(() => {
    channelRef.current = supabase
      .channel(`trip-${trip.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${trip.id}` },
        payload => setTrip(prev => ({ ...prev, ...payload.new }))
      )
      .subscribe();
    return () => channelRef.current?.unsubscribe();
  }, [trip.id]);

  // Poll for new members
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("trip_members").select("user_id, display_name").eq("trip_id", trip.id);
      if (data) setTrip(prev => ({ ...prev, trip_members: data }));
    }, 5000);
    return () => clearInterval(interval);
  }, [trip.id]);

  // ── Save expenses array to Supabase ──────────────────────────────────────
  async function saveExpenses(updatedExpenses) {
    const { error: err } = await supabase
      .from("trips").update({ expenses: updatedExpenses }).eq("id", trip.id);
    if (err) throw err;
    setTrip(prev => ({ ...prev, expenses: updatedExpenses }));
  }

  // ── Add expense ──────────────────────────────────────────────────────────
  async function handleAdd({ desc, amount, paidBy, splitAmong }) {
    if (!desc.trim() || isNaN(amount) || amount <= 0 || !paidBy || !splitAmong.length) {
      setError("Fill in all fields and select at least one person."); return;
    }
    setLoading(true); setError("");
    try {
      const newExp = {
        id: Date.now(),
        desc: desc.trim(), amount, paidBy, splitAmong,
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        addedBy: user.id,
      };
      await saveExpenses([...expenses, newExp]);
      setFormOpen(false);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  // ── Edit expense ─────────────────────────────────────────────────────────
  async function handleEdit({ desc, amount, paidBy, splitAmong }) {
    if (!desc.trim() || isNaN(amount) || amount <= 0 || !paidBy || !splitAmong.length) {
      setError("Fill in all fields and select at least one person."); return;
    }
    setLoading(true); setError("");
    try {
      const updated = expenses.map(e =>
        e.id === editingId
          ? { ...e, desc: desc.trim(), amount, paidBy, splitAmong }
          : e
      );
      await saveExpenses(updated);
      setEditingId(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  // ── Delete expense ────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setLoading(true);
    try {
      await saveExpenses(expenses.filter(e => e.id !== id));
      setConfirmDel(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(trip.code); } catch { }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={BG}>
      {/* Sticky header */}
      <div style={{ background: "#1A2236", borderBottom: "1px solid #2E3D5F", padding: "14px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={onBack} style={{ background: "none", border: "none", color: "#5A7AA8", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>←</button>
              <div>
                <div style={{ fontSize: 18, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{trip.name}</div>
                <div style={{ fontSize: 11, color: "#5A7AA8", display: "flex", alignItems: "center", gap: 5 }}>
                  {members.length} member{members.length !== 1 ? "s" : ""} · live
                  <span style={{ width: 5, height: 5, background: "#6BCB77", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
                </div>
              </div>
            </div>
            <button onClick={copyCode} style={{ background: copied ? "#4ECDC415" : "#232E47", border: `1px solid ${copied ? "#4ECDC4" : "#2E3D5F"}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 800, letterSpacing: 3, fontSize: 12, color: copied ? "#4ECDC4" : "#5A7AA8", transition: "all 0.2s" }}>
              {copied ? "✓ copied" : `# ${trip.code}`}
            </button>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Total", val: `${trip.currency}${total.toFixed(2)}` },
              { label: "Expenses", val: String(expenses.length) },
              { label: "To settle", val: String(settlements.length) },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: 1, background: "#232E47", borderRadius: 10, padding: "8px 10px", border: "1px solid #2E3D5F" }}>
                <div style={{ fontSize: 10, color: "#5A7AA8", marginBottom: 2, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...WRAP, paddingTop: "1.25rem" }}>
        {/* Members row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {members.map((m, i) => (
            <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#232E47", border: "1px solid #2E3D5F", borderRadius: 20, padding: "4px 10px 4px 4px" }}>
              <Avatar name={m.display_name} idx={i} size={22} />
              <span style={{ fontSize: 12, color: m.user_id === user.id ? mc(i) : "#8BA8C8" }}>
                {m.display_name}{m.user_id === user.id ? " (you)" : ""}
              </span>
            </div>
          ))}
          <button onClick={copyCode} style={{ background: "transparent", border: "1px dashed #2E3D5F", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#5A7AA8", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            + invite
          </button>
        </div>

        {/* Add expense button */}
        {!formOpen && editingId === null && (
          <button
            onClick={() => { setFormOpen(true); setError(""); }}
            style={{ width: "100%", padding: "13px", marginBottom: "1.5rem", borderRadius: 14, background: "#4ECDC408", border: "1px dashed #4ECDC455", color: "#4ECDC4", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            + Add expense
          </button>
        )}

        {/* Add form */}
        {formOpen && (
          <ExpenseForm
            trip={trip} user={user}
            initialData={null}
            onSave={handleAdd}
            onCancel={() => { setFormOpen(false); setError(""); }}
            loading={loading} error={error}
          />
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: "1.25rem", background: "#1E2740", borderRadius: 12, padding: 4, border: "1px solid #2E3D5F" }}>
          {["expenses", "settle"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px", fontSize: 13, fontFamily: t === tab ? "'Outfit',sans-serif" : "'DM Sans',sans-serif", fontWeight: t === tab ? 700 : 400, cursor: "pointer", borderRadius: 9, background: t === tab ? "#232E47" : "transparent", border: t === tab ? "1px solid #2E3D5F" : "1px solid transparent", color: t === tab ? "#E8EEFF" : "#4D6080", transition: "all 0.2s" }}>
              {t === "expenses" ? `Expenses${expenses.length > 0 ? ` (${expenses.length})` : ""}` : "Settle up"}
            </button>
          ))}
        </div>

        {/* ── Expenses tab ── */}
        {tab === "expenses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {expenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
                <div style={{ fontSize: 14, fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: "#4D6080" }}>No expenses yet</div>
                <div style={{ fontSize: 12, color: "#3A4E72", marginTop: 5 }}>Add the first one above!</div>
              </div>
            ) : (
              [...expenses].reverse().map((e, ei) => {
                const pIdx = memberNames.indexOf(e.paidBy);
                const c = mc(pIdx < 0 ? 0 : pIdx);
                const share = (e.amount / (e.splitAmong?.length || 1)).toFixed(2);
                const isEditing = editingId === e.id;
                const isDeleting = confirmDel === e.id;

                if (isEditing) return (
                  <ExpenseForm
                    key={e.id}
                    trip={trip} user={user}
                    initialData={e}
                    onSave={handleEdit}
                    onCancel={() => { setEditingId(null); setError(""); }}
                    loading={loading} error={error}
                  />
                );

                return (
                  <Card key={e.id} style={{ animation: `slideIn 0.2s ease ${Math.min(ei, 5) * 0.04}s both` }}>
                    {/* Confirm delete banner */}
                    {isDeleting && (
                      <div style={{ background: "#FF6B6B12", border: "1px solid #FF6B6B30", borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "#FF6B6B" }}>Delete this expense?</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setConfirmDel(null)} style={{ padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                          <button onClick={() => handleDelete(e.id)} disabled={loading} style={{ padding: "5px 10px", borderRadius: 8, background: "#FF6B6B", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            {loading && <Spinner color="#fff" size={11} />} Delete
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={e.paidBy} idx={pIdx < 0 ? 0 : pIdx} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.desc}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: c, fontWeight: 600 }}>{e.paidBy}</span>
                          <span style={{ fontSize: 11, color: "#3A4E72" }}>·</span>
                          <span style={{ fontSize: 11, color: "#5A7AA8" }}>
                            {e.splitAmong?.length > 1 ? `${trip.currency}${share}/person` : "solo"}
                          </span>
                          <span style={{ fontSize: 11, color: "#3A4E72" }}>·</span>
                          <span style={{ fontSize: 11, color: "#5A7AA8" }}>{e.date}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 17, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                          {trip.currency}{e.amount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: "#3A4E72", marginTop: 2 }}>÷ {e.splitAmong?.length || 1}</div>
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
                        <button
                          onClick={() => { setEditingId(e.id); setFormOpen(false); setConfirmDel(null); setError(""); }}
                          title="Edit"
                          style={{ width: 28, height: 28, borderRadius: 8, background: "#FFD93D18", border: "1px solid #FFD93D40", color: "#FFD93D", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >✏️</button>
                        <button
                          onClick={() => { setConfirmDel(isDeleting ? null : e.id); setEditingId(null); }}
                          title="Delete"
                          style={{ width: 28, height: 28, borderRadius: 8, background: "#FF6B6B18", border: `1px solid ${isDeleting ? "#FF6B6B" : "#FF6B6B40"}`, color: "#FF6B6B", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >🗑️</button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ── Settle tab ── */}
        {tab === "settle" && (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            {settlements.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{expenses.length === 0 ? "🏝️" : "🎉"}</div>
                <div style={{ fontSize: 16, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#4ECDC4" }}>
                  {expenses.length === 0 ? "Nothing yet" : "All square!"}
                </div>
                <div style={{ fontSize: 13, color: "#5A7AA8", marginTop: 6 }}>
                  {expenses.length === 0 ? "Add an expense above." : "Everyone owes the same."}
                </div>
              </div>
            ) : (
              <>
                <SectionTitle>Who owes who</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
                  {settlements.map((s, i) => {
                    const fIdx = memberNames.indexOf(s.from);
                    const tIdx = memberNames.indexOf(s.to);
                    return (
                      <Card key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.from} idx={fIdx < 0 ? 0 : fIdx} size={36} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 700, color: mc(fIdx < 0 ? 0 : fIdx) }}>{s.from}</span>
                            <span style={{ color: "#3A4E72", margin: "0 6px" }}>→</span>
                            <span style={{ fontWeight: 700, color: mc(tIdx < 0 ? 1 : tIdx) }}>{s.to}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#5A7AA8", marginTop: 3 }}>
                            needs to pay
                          </div>
                        </div>
                        <Avatar name={s.to} idx={tIdx < 0 ? 1 : tIdx} size={36} />
                        <div style={{ minWidth: 70, textAlign: "right", fontSize: 17, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#FF6B6B" }}>
                          {trip.currency}{s.amount.toFixed(2)}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Balance breakdown — always shown if there are expenses */}
            {expenses.length > 0 && (
              <>
                <SectionTitle>Balance per person</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {memberNames.map((m, i) => {
                    const paid = expenses
                      .filter(e => e.paidBy === m)
                      .reduce((s, e) => s + e.amount, 0);
                    const owes = expenses
                      .filter(e => e.splitAmong?.includes(m))
                      .reduce((s, e) => s + e.amount / (e.splitAmong?.length || 1), 0);
                    const net = paid - owes;
                    const c = mc(i);
                    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

                    return (
                      <Card key={m} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={m} idx={i} size={40} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{m}</span>
                            <span style={{ fontSize: 10, color: "#5A7AA8" }}>paid {trip.currency}{paid.toFixed(2)}</span>
                          </div>
                          <div style={{ height: 4, background: "#1E2740", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, borderRadius: 2, transition: "width 0.6s ease" }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#5A7AA8" }}>
                            fair share: {trip.currency}{owes.toFixed(2)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 68 }}>
                          <div style={{ fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: net >= -0.005 ? "#6BCB77" : "#FF6B6B" }}>
                            {net >= -0.005 ? "+" : "−"}{trip.currency}{Math.abs(net).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 10, marginTop: 2, color: net >= -0.005 ? "#6BCB7788" : "#FF6B6B88" }}>
                            {net >= -0.005 ? "gets back" : "still owes"}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}