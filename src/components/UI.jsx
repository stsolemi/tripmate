import { useState } from "react";
import { mc } from "../styles/tokens";

export function Spinner({ color = "#4ECDC4", size = 16 }) {
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid ${color}33`, borderTopColor: color,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
      display: "inline-block", flexShrink: 0,
    }} />
  );
}

export function Avatar({ name = "?", idx, size = 36 }) {
  const c = mc(idx);
  const init = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c + "22", border: `1.5px solid ${c}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 700, color: c,
      flexShrink: 0, fontFamily: "'Syne',sans-serif",
    }}>
      {init}
    </div>
  );
}

export function Card({ children, style, hover, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: "#232E47",
        border: `1px solid ${hov ? "#3A4E72" : "#2E3D5F"}`,
        borderRadius: 14, padding: "14px 16px",
        transition: "all 0.2s",
        transform: hov ? "translateY(-1px)" : "none",
        boxShadow: hov ? "0 8px 24px #00000040" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, disabled, loading, color = "#4ECDC4", small }) {
  const [hov, setHov] = useState(false);
  const active = hov && !disabled && !loading;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: small ? "9px 14px" : "13px",
        fontFamily: "'Syne',sans-serif", fontWeight: 700,
        fontSize: small ? 13 : 14,
        cursor: (disabled || loading) ? "not-allowed" : "pointer",
        borderRadius: 12,
        background: active ? color : color + "22",
        color: active ? "#161C2D" : color,
        border: `1px solid ${color}55`,
        transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {loading && <Spinner color={active ? "#161C2D" : color} />}
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", padding: small ? "9px 14px" : "13px",
        fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
        fontSize: small ? 13 : 14, cursor: "pointer", borderRadius: 12,
        background: hov ? "#2E3D5F" : "transparent",
        color: "#5A7AA8", border: "1px solid #2E3D5F",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

export function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, color: "#5A7AA8", fontWeight: 700,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      fontSize: 12, color: "#FF6B6B",
      background: "#FF6B6B12", border: "1px solid #FF6B6B30",
      borderRadius: 8, padding: "8px 12px",
    }}>
      {msg}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, color: "#5A7AA8", fontWeight: 700,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}