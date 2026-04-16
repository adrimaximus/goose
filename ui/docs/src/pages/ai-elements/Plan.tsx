import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanAction,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from "@/shared/ui/ai-elements/plan";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
  TaskItemFile,
} from "@/shared/ui/ai-elements/task";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/shared/ui/ai-elements/chain-of-thought";
import { Button } from "@/shared/ui/button";
import { CheckCircleIcon, CircleIcon, SearchIcon } from "lucide-react";
import { ComponentPreview } from "../../components/ComponentPreview";

export default function PlanPage() {
  return (
    <>
      <h1>Plan, Task & Chain of Thought</h1>

      <h2>Plan — Static</h2>
      <p>
        <code>goose2/src/shared/ui/ai-elements/plan.tsx</code> — Collapsible
        plan card.
      </p>
      <ComponentPreview label="Default plan">
        <Plan defaultOpen>
          <PlanHeader>
            <div>
              <PlanTitle>Refactor authentication module</PlanTitle>
              <PlanDescription>
                Migrate from session-based auth to JWT tokens with refresh
                rotation
              </PlanDescription>
            </div>
            <PlanAction>
              <PlanTrigger />
            </PlanAction>
          </PlanHeader>
          <PlanContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-green-600" />
                <span>Audit existing session middleware</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-green-600" />
                <span>Design JWT token schema</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleIcon className="size-4" />
                <span>Implement token refresh endpoint</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleIcon className="size-4" />
                <span>Update client-side auth hooks</span>
              </div>
            </div>
          </PlanContent>
          <PlanFooter>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Reject</Button>
              <Button size="sm">Approve</Button>
            </div>
          </PlanFooter>
        </Plan>
      </ComponentPreview>

      <h2>Plan — Streaming</h2>
      <ComponentPreview label="Shimmer effect while streaming">
        <Plan isStreaming defaultOpen>
          <PlanHeader>
            <div>
              <PlanTitle>Analyzing project structure</PlanTitle>
              <PlanDescription>
                Scanning files and dependencies to build implementation plan
              </PlanDescription>
            </div>
          </PlanHeader>
        </Plan>
      </ComponentPreview>

      <h2>Task</h2>
      <p>
        <code>goose2/src/shared/ui/ai-elements/task.tsx</code> — Collapsible
        task with file references.
      </p>
      <ComponentPreview label="Task with file items">
        <Task defaultOpen>
          <TaskTrigger title="Reading project files" />
          <TaskContent>
            <TaskItem>
              <TaskItemFile>src/shared/ui/button.tsx</TaskItemFile>
            </TaskItem>
            <TaskItem>
              <TaskItemFile>src/shared/ui/card.tsx</TaskItemFile>
            </TaskItem>
            <TaskItem>
              <TaskItemFile>src/shared/lib/cn.ts</TaskItemFile>
            </TaskItem>
          </TaskContent>
        </Task>
      </ComponentPreview>

      <h2>Chain of Thought</h2>
      <p>
        <code>goose2/src/shared/ui/ai-elements/chain-of-thought.tsx</code> —
        Thinking process visualization.
      </p>
      <ComponentPreview label="Chain of thought steps">
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Thinking about approach</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              icon={SearchIcon}
              label="Searching for authentication patterns"
              status="complete"
            />
            <ChainOfThoughtStep
              label="Analyzing JWT library options"
              status="complete"
            />
            <ChainOfThoughtStep
              label="Evaluating token rotation strategies"
              status="active"
            />
            <ChainOfThoughtStep
              label="Draft implementation plan"
              status="pending"
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      </ComponentPreview>

      <h2>Parts</h2>
      <h3>Plan</h3>
      <ul>
        <li><code>Plan</code> — Root container (Collapsible + Card)</li>
        <li><code>PlanHeader</code> / <code>PlanTitle</code> / <code>PlanDescription</code></li>
        <li><code>PlanAction</code> — Action slot (e.g., toggle trigger)</li>
        <li><code>PlanContent</code> — Collapsible body</li>
        <li><code>PlanFooter</code> — Footer with approve/reject actions</li>
        <li><code>PlanTrigger</code> — Toggle button</li>
      </ul>
      <h3>Task</h3>
      <ul>
        <li><code>Task</code> — Root collapsible</li>
        <li><code>TaskTrigger</code> — Toggle with search icon</li>
        <li><code>TaskContent</code> — Indented content area</li>
        <li><code>TaskItem</code> / <code>TaskItemFile</code></li>
      </ul>
      <h3>Chain of Thought</h3>
      <ul>
        <li><code>ChainOfThought</code> — Root with open state</li>
        <li><code>ChainOfThoughtHeader</code> — Toggle trigger</li>
        <li><code>ChainOfThoughtContent</code> — Collapsible body</li>
        <li><code>ChainOfThoughtStep</code> — Single step with status indicator</li>
      </ul>
    </>
  );
}
