import { useState } from "react";
import { supabase } from "../lib/supabase";
import { BG, WRAP } from "../styles/tokens";
import { PrimaryBtn, ErrBox, Label } from "../components/UI";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Fill in all fields."); return; }
    if (mode === "signup" && !name.trim()) { setError("Enter your name."); return; }
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signupErr } = await supabase.auth.signUp({ email: email.trim(), password });
        if (signupErr) throw signupErr;

        // Save display name to profiles table
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name: name.trim(),
        });
        onAuth(data.user);
      } else {
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginErr) throw loginErr;
        onAuth(data.user);
      }
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("already registered")) setError("Email already registered. Try logging in.");
      else if (msg.includes("Invalid login")) setError("Wrong email or password.");
      else setError(msg || "Something went wrong.");
    }

    setLoading(false);
  }

  return (
    <div style={BG}>
      <div style={{ ...WRAP, paddingTop: "10vh" }}>
        <div style={{ animation: "fadeUp 0.4s cubic-bezier(.22,.68,0,1.1)" }}>

          {/* Logo badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4ECDC415", border: "1px solid #4ECDC435", borderRadius: 30, padding: "6px 14px", marginBottom: "2rem" }}>
            <span style={{ fontSize: 14 }}>✈️</span>
            <span style={{ fontSize: 11, color: "#4ECDC4", fontFamily: "'Syne',sans-serif", fontWeight: 800, letterSpacing: 1.5 }}>TRIPMATE</span>
          </div>

          {/* Headline */}
          <div style={{ fontSize: 36, fontFamily: "'Syne',sans-serif", fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>
            {mode === "login" ? "Welcome back." : "Create account."}
          </div>
          <div style={{ fontSize: 14, color: "#5A7AA8", marginBottom: "2rem" }}>
            {mode === "login" ? "Log in to see your trips." : "Sign up to start tracking expenses with friends."}
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <div>
                <Label>Your name</Label>
                <input
                  placeholder="e.g. Emil"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus={mode === "login"}
              />
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <ErrBox msg={error} />

            <div style={{ marginTop: 4 }}>
              <PrimaryBtn onClick={handleSubmit} loading={loading}>
                {mode === "login" ? "Log in →" : "Create account →"}
              </PrimaryBtn>
            </div>

            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ background: "none", border: "none", color: "#5A7AA8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", paddingTop: 4 }}
            >
              {mode === "login" ? "No account yet? Sign up" : "Already have an account? Log in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}