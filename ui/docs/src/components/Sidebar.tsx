import { NavLink } from "react-router-dom";

const sections = [
  {
    title: "Getting Started",
    links: [
      { to: "/", label: "Overview" },
      { to: "/tokens", label: "Design Tokens" },
    ],
  },
  {
    title: "Components",
    links: [
      { to: "/components", label: "Overview" },
      { to: "/components/button", label: "Button" },
      { to: "/components/input", label: "Input & Input Group" },
      { to: "/components/card", label: "Card" },
      { to: "/components/dialog", label: "Dialog & Sheet" },
      { to: "/components/tabs", label: "Tabs & Accordion" },
    ],
  },
  {
    title: "AI Elements",
    links: [
      { to: "/ai-elements", label: "Overview" },
      { to: "/ai-elements/message", label: "Message" },
      { to: "/ai-elements/tool", label: "Tool Call" },
      { to: "/ai-elements/code-block", label: "Code Block" },
      { to: "/ai-elements/prompt-input", label: "Prompt Input" },
      { to: "/ai-elements/plan", label: "Plan & Task" },
    ],
  },
];

export function Sidebar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 220,
        height: "100vh",
        overflowY: "auto",
        padding: "1.5rem 1rem",
        borderRight: "1px solid var(--border-default)",
        background: "var(--background-default)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>Goose UI</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        Design System Docs
      </div>

      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: "0.4rem",
            }}
          >
            {section.title}
          </div>
          {section.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/" || link.to === "/components" || link.to === "/ai-elements"}
              style={({ isActive }) => ({
                display: "block",
                padding: "4px 8px",
                borderRadius: 8,
                fontSize: 14,
                color: isActive ? "var(--text-default)" : "var(--text-subtle)",
                background: isActive ? "var(--background-muted)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                textDecoration: "none",
                marginBottom: 1,
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
