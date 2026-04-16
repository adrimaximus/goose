import type { ReactNode } from "react";

export function ComponentPreview({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: 12,
        padding: "1.5rem",
        marginTop: "1rem",
        marginBottom: "1.5rem",
        background: "#ffffff",
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#999",
            marginBottom: "1rem",
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}
