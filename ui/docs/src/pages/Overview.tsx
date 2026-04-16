export default function Overview() {
  return (
    <>
      <h1>Goose UI Design System</h1>
      <p>
        Live documentation for the Goose 2 component library. Every component on
        this site is rendered from the actual source code in{" "}
        <code>ui/goose2/src/shared/ui/</code>.
      </p>

      <h2>Architecture</h2>
      <ul>
        <li>
          <strong>Framework</strong> — React 19 + Tauri 2
        </li>
        <li>
          <strong>Styling</strong> — Tailwind CSS v4 (CSS-first config)
        </li>
        <li>
          <strong>Components</strong> — shadcn/ghost registry pattern (Radix UI +
          CVA)
        </li>
        <li>
          <strong>State</strong> — Zustand + TanStack Query
        </li>
        <li>
          <strong>Markdown</strong> — Streamdown with CJK, code, math, mermaid
          plugins
        </li>
      </ul>

      <h2>Design Principles</h2>
      <ul>
        <li>
          <strong>Pill-first radius</strong> — Buttons and inputs use 999px
          radius; cards use 20px
        </li>
        <li>
          <strong>Two-layer tokens</strong> — Raw palette in <code>@theme</code>,
          semantic variables in <code>:root</code>
        </li>
        <li>
          <strong>Pure React</strong> — All shared UI components have zero Tauri
          dependencies
        </li>
      </ul>

      <h2>Structure</h2>
      <table>
        <thead>
          <tr>
            <th>Path</th>
            <th>Contents</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>shared/ui/</code></td>
            <td>~58 base primitives (button, card, input, dialog, etc.)</td>
          </tr>
          <tr>
            <td><code>shared/ui/ai-elements/</code></td>
            <td>~47 chat/AI components (message, tool, code-block, plan, etc.)</td>
          </tr>
          <tr>
            <td><code>shared/lib/</code></td>
            <td>Utility functions (cn, hooks)</td>
          </tr>
          <tr>
            <td><code>shared/styles/</code></td>
            <td>Design tokens and global CSS</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
