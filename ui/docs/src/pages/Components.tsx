import { NavLink } from "react-router-dom";

const components = [
  { to: "/components/button", name: "Button", desc: "Primary action element with 9 variants and pill radius" },
  { to: "/components/input", name: "Input & Badge", desc: "Text inputs with pill radius and status badges" },
  { to: "/components/card", name: "Card", desc: "Content container with header, body, footer slots" },
  { to: "/components/dialog", name: "Dialog & Sheet", desc: "Modal overlays and slide-in panels" },
  { to: "/components/tabs", name: "Tabs & Accordion", desc: "Tab switching and collapsible content" },
];

export default function ComponentsPage() {
  return (
    <>
      <h1>Components</h1>
      <p>
        Base UI primitives from <code>goose2/src/shared/ui/</code>. Built on
        Radix UI + CVA (class-variance-authority) with Tailwind v4.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: "1rem" }}>
        {components.map((c) => (
          <NavLink
            key={c.to}
            to={c.to}
            style={{
              display: "block",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{c.desc}</div>
          </NavLink>
        ))}
      </div>
    </>
  );
}
