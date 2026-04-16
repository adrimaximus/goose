import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/shared/ui/ai-elements/tool";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function ToolPage() {
  return (
    <>
      <h1>Tool Call</h1>
      <p>
        <code>goose2/src/shared/ui/ai-elements/tool.tsx</code> — Collapsible
        display for tool/function calls with status indicators.
      </p>

      <h2>Completed Tool</h2>
      <ComponentPreview label="Output available">
        <Tool defaultOpen>
          <ToolHeader
            type="tool-read-file"
            state="output-available"
            elapsedSeconds={0.3}
          />
          <ToolContent>
            <ToolInput input={{ path: "/src/main.rs", encoding: "utf-8" }} />
            <ToolOutput
              output={{ content: "fn main() {\n    println!(\"Hello\");\n}" }}
              errorText={undefined}
            />
          </ToolContent>
        </Tool>
      </ComponentPreview>

      <h2>Running Tool</h2>
      <ComponentPreview label="Input available (running)">
        <Tool>
          <ToolHeader type="tool-web-search" state="input-available" />
          <ToolContent>
            <ToolInput input={{ query: "rust async patterns" }} />
          </ToolContent>
        </Tool>
      </ComponentPreview>

      <h2>Error State</h2>
      <ComponentPreview label="Output error">
        <Tool defaultOpen>
          <ToolHeader
            type="tool-execute-command"
            state="output-error"
            elapsedSeconds={1.2}
          />
          <ToolContent>
            <ToolInput input={{ command: "cargo build" }} />
            <ToolOutput
              output={undefined}
              errorText="error[E0425]: cannot find value `x` in this scope"
            />
          </ToolContent>
        </Tool>
      </ComponentPreview>

      <h2>Awaiting Approval</h2>
      <ComponentPreview label="Approval requested">
        <Tool>
          <ToolHeader type="tool-delete-file" state="approval-requested" />
        </Tool>
      </ComponentPreview>

      <h2>Dynamic Tool</h2>
      <ComponentPreview label="Dynamic tool type">
        <Tool defaultOpen>
          <ToolHeader
            type="dynamic-tool"
            state="output-available"
            toolName="custom_search"
            elapsedSeconds={2.1}
          />
          <ToolContent>
            <ToolInput input={{ query: "design system components", limit: 10 }} />
            <ToolOutput
              output={{ results: ["Button", "Card", "Dialog"], total: 3 }}
              errorText={undefined}
            />
          </ToolContent>
        </Tool>
      </ComponentPreview>

      <h2>Parts</h2>
      <ul>
        <li><code>Tool</code> — Root collapsible container</li>
        <li><code>ToolHeader</code> — Trigger with status icon, name, and elapsed time</li>
        <li><code>ToolContent</code> — Collapsible content area</li>
        <li><code>ToolInput</code> — Renders input parameters as JSON</li>
        <li><code>ToolOutput</code> — Renders result or error</li>
      </ul>
    </>
  );
}
