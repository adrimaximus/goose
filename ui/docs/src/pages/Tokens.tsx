export default function Tokens() {
  const colors = [
    { label: "Background", var: "--background-default", desc: "Page background" },
    { label: "Background Alt", var: "--background-alt", desc: "Subtle surface" },
    { label: "Background Muted", var: "--background-muted", desc: "Muted surface" },
    { label: "Primary", var: "--background-accent", desc: "Accent / CTA" },
    { label: "Destructive", var: "--background-danger", desc: "Error / danger" },
    { label: "Success", var: "--background-success", desc: "Success states" },
    { label: "Info", var: "--background-info", desc: "Informational" },
    { label: "Warning", var: "--background-warning", desc: "Warning states" },
  ];

  const radii = [
    { label: "Pill", var: "--radius-pill", value: "999px" },
    { label: "Button", var: "--radius-button", value: "999px" },
    { label: "Input", var: "--radius-input", value: "999px" },
    { label: "Card", var: "--radius-card", value: "20px" },
    { label: "Card LG", var: "--radius-card-lg", value: "24px" },
    { label: "Card SM", var: "--radius-card-sm", value: "14px" },
    { label: "Dropdown", var: "--radius-dropdown", value: "20px" },
    { label: "Modal", var: "--radius-modal", value: "16px" },
  ];

  const shadows = [
    { label: "Mini", var: "--shadow-mini" },
    { label: "Button", var: "--shadow-btn" },
    { label: "Card", var: "--shadow-card" },
    { label: "Elevated", var: "--shadow-elevated" },
    { label: "Popover", var: "--shadow-popover" },
    { label: "Modal", var: "--shadow-modal" },
  ];

  return (
    <>
      <h1>Design Tokens</h1>
      <p>
        <code>goose2/src/shared/styles/globals.css</code> — Two-layer token
        system: raw palette in <code>@theme</code>, semantic variables in{" "}
        <code>:root</code>.
      </p>

      <h2>Semantic Colors</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {colors.map((c) => (
          <div key={c.var} style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 48, background: `var(${c.var})` }} />
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>{c.var}</div>
            </div>
          </div>
        ))}
      </div>

      <h2>Border Radius</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {radii.map((r) => (
          <div key={r.var} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "var(--background-muted)",
                border: "2px solid var(--border-default)",
                borderRadius: `var(${r.var})`,
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{r.value}</div>
          </div>
        ))}
      </div>

      <h2>Shadows</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {shadows.map((s) => (
          <div key={s.var} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "white",
                borderRadius: 12,
                boxShadow: `var(${s.var})`,
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>{s.var}</div>
          </div>
        ))}
      </div>
    </>
  );
}
