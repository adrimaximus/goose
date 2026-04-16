import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/shared/ui/ai-elements/prompt-input";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function PromptInputPage() {
  return (
    <>
      <h1>Prompt Input</h1>
      <p>
        <code>goose2/src/shared/ui/ai-elements/prompt-input.tsx</code> — The
        primary chat input surface.
      </p>

      <h2>Default</h2>
      <ComponentPreview label="Idle state">
        <PromptInput onSubmit={(msg) => console.log("submit:", msg)}>
          <PromptInputTextarea placeholder="Ask Goose anything..." />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit status="idle" />
          </PromptInputFooter>
        </PromptInput>
      </ComponentPreview>

      <h2>Streaming State</h2>
      <ComponentPreview label="With stop button">
        <PromptInput onSubmit={(msg) => console.log("submit:", msg)}>
          <PromptInputTextarea placeholder="Ask Goose anything..." />
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              status="streaming"
              onStop={() => console.log("stop")}
            />
          </PromptInputFooter>
        </PromptInput>
      </ComponentPreview>

      <h2>Parts</h2>
      <ul>
        <li><code>PromptInput</code> — Root form wrapper with file drop support</li>
        <li><code>PromptInputProvider</code> — Optional shared state provider</li>
        <li><code>PromptInputTextarea</code> — Auto-growing textarea</li>
        <li><code>PromptInputHeader</code> / <code>PromptInputFooter</code> — Layout sections</li>
        <li><code>PromptInputSubmit</code> — Submit/stop button (responds to <code>status</code>)</li>
        <li><code>PromptInputButton</code> — Generic action button</li>
        <li><code>PromptInputActionMenu</code> — Overflow dropdown</li>
        <li><code>PromptInputActionAddAttachments</code> — File attachment action</li>
      </ul>
    </>
  );
}
