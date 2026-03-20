import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { GLOBAL_CSS } from "./styles/tokens";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import TripScreen from "./screens/TripScreen";

export default function App() {
  // Supabase persists the session in localStorage automatically.
  // We just restore it on mount with getSession().
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // avoid flash of auth screen
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    // Restore existing session on load
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    // Keep user in sync on login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTrip(null);
  }

  // Show nothing until we know the session state (prevents auth flash)
  if (!ready) return (
    <div style={{ background: "#161C2D", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width: 28, height: 28, border: "2px solid #4ECDC433", borderTopColor: "#4ECDC4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!user) return <><style>{GLOBAL_CSS}</style><AuthScreen onAuth={setUser} /></>;

  if (activeTrip) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <TripScreen
        trip={activeTrip}
        user={user}
        onBack={() => setActiveTrip(null)}
      />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <HomeScreen
        user={user}
        onOpenTrip={setActiveTrip}
        onLogout={handleLogout}
      />
    </>
  );
}