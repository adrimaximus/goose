import {
  CodeBlock,
  CodeBlockContainer,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockFilename,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
} from "@/shared/ui/ai-elements/code-block";
import { ComponentPreview } from "../../components/ComponentPreview";

const rustCode = `fn main() {
    let greeting = "Hello, Goose!";
    println!("{greeting}");

    for i in 0..5 {
        println!("Step {i}");
    }
}`;

const tsCode = `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`;

const jsonCode = `{
  "name": "goose",
  "version": "1.31.0",
  "description": "AI agent framework",
  "dependencies": {
    "react": "^19.1.0",
    "tailwindcss": "^4.2.2"
  }
}`;

const cssCode = `@theme {
  --color-primary: oklch(0.21 0.006 285.88);
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.button {
  border-radius: var(--radius-pill);
  background: var(--color-primary);
}`;

export default function CodeBlockPage() {
  return (
    <>
      <h1>Code Block</h1>
      <p>
        <code>goose2/src/shared/ui/ai-elements/code-block.tsx</code> —
        Syntax-highlighted code display using Shiki.
      </p>

      <h2>Basic</h2>
      <ComponentPreview label="Simple code block">
        <CodeBlock code={rustCode} language="rust" />
      </ComponentPreview>

      <h2>With Line Numbers</h2>
      <ComponentPreview label="Line numbers enabled">
        <CodeBlock code={tsCode} language="typescript" showLineNumbers />
      </ComponentPreview>

      <h2>With Header</h2>
      <ComponentPreview label="Header with filename and copy button">
        <CodeBlockContainer language="json">
          <CodeBlockHeader>
            <CodeBlockTitle>
              <CodeBlockFilename>package.json</CodeBlockFilename>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton />
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockContent code={jsonCode} language="json" />
        </CodeBlockContainer>
      </ComponentPreview>

      <h2>Multiple Languages</h2>
      <ComponentPreview label="CSS">
        <CodeBlock code={cssCode} language="css" />
      </ComponentPreview>

      <h2>Parts</h2>
      <ul>
        <li><code>CodeBlock</code> — All-in-one component (container + content)</li>
        <li><code>CodeBlockContainer</code> — Outer wrapper with border and language data attribute</li>
        <li><code>CodeBlockHeader</code> — Optional top bar</li>
        <li><code>CodeBlockTitle</code> / <code>CodeBlockFilename</code> — Header labels</li>
        <li><code>CodeBlockActions</code> — Action buttons area</li>
        <li><code>CodeBlockContent</code> — Highlighted code renderer</li>
        <li><code>CodeBlockCopyButton</code> — Copy to clipboard button</li>
      </ul>
    </>
  );
}
