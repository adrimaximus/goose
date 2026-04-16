import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function DocsLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 220,
          flex: 1,
          padding: "2rem 3rem",
          maxWidth: 900,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
