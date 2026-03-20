import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { genCode } from "../lib/utils";
import { BG, WRAP, mc } from "../styles/tokens";
import { Avatar, Card, Label, ErrBox, Spinner, SectionTitle } from "../components/UI";

export default function HomeScreen({ user, onOpenTrip, onLogout }) {
  const [trips, setTrips]             = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);

  // Create trip form
  const [showCreate, setShowCreate]   = useState(false);
  const [newName, setNewName]         = useState("");
  const [newCurrency, setNewCurrency] = useState("€");

  // Join trip form
  const [showJoin, setShowJoin]       = useState(false);
  const [joinCode, setJoinCode]       = useState("");

  // Delete confirm
  const [confirmDel, setConfirmDel]   = useState(null); // trip id

  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTrips(); }, []);

  async function fetchTrips() {
    setTripsLoading(true);
    const { data: memberRows } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", user.id);

    if (!memberRows?.length) { setTrips([]); setTripsLoading(false); return; }

    const tripIds = memberRows.map(r => r.trip_id);
    const { data: tripRows } = await supabase
      .from("trips")
      .select("*, trip_members(user_id, display_name)")
      .in("id", tripIds)
      .order("created_at", { ascending: false });

    setTrips(tripRows || []);
    setTripsLoading(false);
  }

  async function getMyName() {
    const { data } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    return data?.name || user.email.split("@")[0];
  }

  async function handleCreate() {
    if (!newName.trim()) { setError("Enter a trip name."); return; }
    setLoading(true); setError("");
    try {
      const myName = await getMyName();
      const code = genCode();

      const { data: trip, error: tripErr } = await supabase
        .from("trips")
        .insert({ name: newName.trim(), currency: newCurrency, code, expenses: [], created_by: user.id })
        .select()
        .single();
      if (tripErr) throw tripErr;

      await supabase.from("trip_members").insert({
        trip_id: trip.id, user_id: user.id, display_name: myName,
      });

      setNewName(""); setShowCreate(false);
      await fetchTrips();
      onOpenTrip({ ...trip, trip_members: [{ user_id: user.id, display_name: myName }] });
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) { setError("Enter the trip code."); return; }
    setLoading(true); setError("");
    try {
      const myName = await getMyName();
      const code = joinCode.trim().toUpperCase();

      const { data: trip, error: findErr } = await supabase
        .from("trips")
        .select("*, trip_members(user_id, display_name)")
        .eq("code", code)
        .single();
      if (findErr || !trip) { setError("Trip not found. Check the code."); setLoading(false); return; }

      const alreadyIn = trip.trip_members.some(m => m.user_id === user.id);
      if (!alreadyIn) {
        await supabase.from("trip_members").insert({
          trip_id: trip.id, user_id: user.id, display_name: myName,
        });
        trip.trip_members.push({ user_id: user.id, display_name: myName });
      }

      setJoinCode(""); setShowJoin(false);
      await fetchTrips();
      onOpenTrip(trip);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleDeleteTrip(tripId) {
    setLoading(true);
    try {
      // Delete members first (foreign key), then the trip
      await supabase.from("trip_members").delete().eq("trip_id", tripId);
      await supabase.from("trips").delete().eq("id", tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setConfirmDel(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={BG}>
      {/* Header */}
      <div style={{ background: "#1A2236", borderBottom: "1px solid #2E3D5F", padding: "16px 0", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>✈️</span>
            <span style={{ fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 800, letterSpacing: 0.5 }}>tripmate</span>
          </div>
          <button
            onClick={onLogout}
            style={{ background: "none", border: "1px solid #2E3D5F", borderRadius: 8, padding: "6px 12px", color: "#5A7AA8", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}
          >
            Log out
          </button>
        </div>
      </div>

      <div style={{ ...WRAP, paddingTop: "1.5rem" }}>
        <div style={{ animation: "fadeUp 0.3s ease" }}>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem" }}>
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
              style={{ flex: 1, padding: "13px", borderRadius: 12, background: showCreate ? "#4ECDC430" : "#4ECDC418", border: "1px solid #4ECDC455", color: "#4ECDC4", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "background 0.2s" }}
            >
              + New trip
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
              style={{ flex: 1, padding: "13px", borderRadius: 12, background: showJoin ? "#2E3D5F" : "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 13, cursor: "pointer", transition: "background 0.2s" }}
            >
              Join with code
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <Card style={{ marginBottom: "1.5rem", animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#4ECDC4", marginBottom: 12 }}>New trip</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <Label>Trip name</Label>
                  <input placeholder="e.g. Barcelona 2025" value={newName} onChange={e => setNewName(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleCreate()} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)}>
                    <option value="€">€  Euro</option>
                    <option value="$">$  US Dollar</option>
                    <option value="£">£  British Pound</option>
                    <option value="CHF">CHF  Swiss Franc</option>
                    <option value="¥">¥  Japanese Yen</option>
                  </select>
                </div>
                <ErrBox msg={error} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setShowCreate(false); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Cancel</button>
                  <button onClick={handleCreate} disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "#4ECDC4", border: "none", color: "#161C2D", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                    {loading && <Spinner color="#161C2D" size={13} />} Create trip
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Join form */}
          {showJoin && (
            <Card style={{ marginBottom: "1.5rem", animation: "fadeUp 0.2s ease" }}>
              <div style={{ fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: "#4D96FF", marginBottom: 12 }}>Join a trip</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <Label>Trip code</Label>
                  <input
                    placeholder="AB3X9"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    style={{ textTransform: "uppercase", letterSpacing: 6, fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, textAlign: "center" }}
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleJoin()}
                  />
                </div>
                <ErrBox msg={error} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setShowJoin(false); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>Cancel</button>
                  <button onClick={handleJoin} disabled={loading} style={{ flex: 2, padding: "10px", borderRadius: 10, background: "#4D96FF", border: "none", color: "#161C2D", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                    {loading && <Spinner color="#161C2D" size={13} />} Join trip
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Trips list */}
          <SectionTitle>Your trips</SectionTitle>
          {tripsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}><Spinner /></div>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>🏝️</div>
              <div style={{ fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: "#5A7AA8" }}>No trips yet</div>
              <div style={{ fontSize: 12, marginTop: 6, color: "#3D5580" }}>Create one or join with a code above.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trips.map((t, i) => {
                const total     = (t.expenses || []).reduce((s, e) => s + e.amount, 0);
                const isCreator = t.created_by === user.id;
                const isDeleting = confirmDel === t.id;

                return (
                  <Card key={t.id} style={{ animation: `slideIn 0.2s ease ${i * 0.04}s both` }}>

                    {/* Delete confirm banner */}
                    {isDeleting && (
                      <div style={{ background: "#FF6B6B12", border: "1px solid #FF6B6B30", borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 12, color: "#FF6B6B" }}>Delete "{t.name}" for everyone?</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setConfirmDel(null)} style={{ padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid #2E3D5F", color: "#5A7AA8", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                          <button onClick={() => handleDeleteTrip(t.id)} disabled={loading} style={{ padding: "5px 10px", borderRadius: 8, background: "#FF6B6B", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                            {loading && <Spinner color="#fff" size={11} />} Delete
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      {/* Left — click to open */}
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onOpenTrip(t)}>
                        <div style={{ fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 700, marginBottom: 8 }}>{t.name}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {(t.trip_members || []).slice(0, 5).map((m, mi) => (
                            <Avatar key={m.user_id} name={m.display_name} idx={mi} size={24} />
                          ))}
                          {(t.trip_members || []).length > 5 && (
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2E3D5F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#5A7AA8" }}>
                              +{t.trip_members.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right — total + code + delete */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <div style={{ fontSize: 17, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>{t.currency}{total.toFixed(2)}</div>
                        <div style={{ fontSize: 10, color: "#5A7AA8", background: "#2E3D5F", borderRadius: 6, padding: "2px 8px", letterSpacing: 2, fontFamily: "'Outfit',sans-serif" }}>
                          {t.code}
                        </div>
                        {/* Delete button — only for creator */}
                        {isCreator && (
                          <button
                            onClick={() => setConfirmDel(isDeleting ? null : t.id)}
                            title="Delete trip"
                            style={{ padding: "4px 8px", borderRadius: 8, background: isDeleting ? "#FF6B6B20" : "transparent", border: `1px solid ${isDeleting ? "#FF6B6B" : "#FF6B6B40"}`, color: "#FF6B6B", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                          >
                            🗑️ delete
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
