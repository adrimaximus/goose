import { NavLink } from "react-router-dom";

const elements = [
  { to: "/ai-elements/message", name: "Message", desc: "Chat message container with role-based styling" },
  { to: "/ai-elements/tool", name: "Tool Call", desc: "Collapsible tool/function call display with status" },
  { to: "/ai-elements/code-block", name: "Code Block", desc: "Shiki syntax-highlighted code with copy button" },
  { to: "/ai-elements/prompt-input", name: "Prompt Input", desc: "Chat input surface with file drop and attachments" },
  { to: "/ai-elements/plan", name: "Plan & Task", desc: "Plan cards, task lists, and chain-of-thought steps" },
];

export default function AiElementsPage() {
  return (
    <>
      <h1>AI Elements</h1>
      <p>
        Chat and AI-specific components from{" "}
        <code>goose2/src/shared/ui/ai-elements/</code>. These are the building
        blocks of the conversation UI.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: "1rem" }}>
        {elements.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            style={{
              display: "block",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{e.desc}</div>
          </NavLink>
        ))}
      </div>
    </>
  );
}
