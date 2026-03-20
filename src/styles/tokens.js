export const COLORS = [
  "#4ECDC4", "#FF6B6B", "#FFD93D", "#6BCB77",
  "#A78BFA", "#F8A5C2", "#4D96FF", "#FF9F43",
];
export const mc = i => COLORS[i % COLORS.length];

// ── Palette (lighter dark theme) ──────────────────────────────────────────
// bg:        #161C2D  (page background)
// surface:   #1E2740  (sticky headers, tab bars)
// card:      #232E47  (cards)
// border:    #2E3D5F  (borders)
// border2:   #3A4E72  (hover borders)
// muted:     #5A7AA8  (secondary text)
// hint:      #3D5580  (tertiary text / placeholders)
// text:      #E8EEFF  (primary text)

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #161C2D; }
  ::selection { background: #4ECDC430; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2E3D5F; border-radius: 2px; }

  input, select {
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #E8EEFF;
    background: #1E2A42;
    border: 1px solid #2E3D5F;
    border-radius: 10px;
    padding: 11px 14px;
    width: 100%;
    transition: border 0.2s, box-shadow 0.2s;
  }
  input::placeholder { color: #3D5580; }
  input[type=password] { letter-spacing: 1px; }
  input:focus, select:focus {
    border-color: #4ECDC4;
    background: #1A2438;
    box-shadow: 0 0 0 3px #4ECDC418;
  }
  select { appearance: none; cursor: pointer; }
  select option { background: #1E2A42; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export const BG = { background: "#161C2D", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: "#E8EEFF" };
export const WRAP = { maxWidth: 480, margin: "0 auto", padding: "0 16px 80px" };

// Re-exported for convenience so other files don't need to hardcode these
export const C = {
  bg: "#161C2D",
  header: "#1A2236",
  surface: "#1E2740",
  card: "#232E47",
  cardHov: "#273352",
  border: "#2E3D5F",
  borderHov: "#3A4E72",
  muted: "#5A7AA8",
  hint: "#3D5580",
  statBg: "#1A2438",
};