import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageResponse,
  MessageToolbar,
} from "@/shared/ui/ai-elements/message";
import {
  Copy,
  Check,
  RotateCcw,
  Pencil,
  User,
} from "lucide-react";
import { IconRobot } from "@tabler/icons-react";
import { useState } from "react";
import { ComponentPreview } from "../../components/ComponentPreview";

const markdownSample = `I'd be happy to help you refactor the authentication module. Let me start by examining the current implementation.

Here's what I'd suggest:

1. **Extract the token logic** into a dedicated \`useAuth\` hook
2. **Move validation** to a shared utility
3. **Simplify the middleware** chain

\`\`\`typescript
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  const login = async (credentials: Credentials) => {
    const response = await api.authenticate(credentials);
    setToken(response.token);
  };

  return { token, login, isAuthenticated: !!token };
}
\`\`\`

This keeps the auth concerns isolated and testable.`;

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <MessageAction tooltip={copied ? "Copied!" : "Copy"} onClick={handleCopy}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </MessageAction>
  );
}

function AssistantAvatar() {
  return (
    <span className="flex h-5 w-5 items-center justify-center">
      <IconRobot size={14} className="text-muted-foreground" />
    </span>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent">
      <User size={14} className="text-muted-foreground" />
    </div>
  );
}

export default function MessagePage() {
  return (
    <>
      <h1>Message</h1>
      <p>
        <code>goose2/src/shared/ui/ai-elements/message.tsx</code> — Chat
        message primitives.{" "}
        In the real app, <code>features/chat/ui/MessageBubble.tsx</code> composes
        these primitives with avatars, width constraints, Streamdown markdown,
        and hover actions.
      </p>

      <h2>User Message (as rendered in-app)</h2>
      <p className="text-sm text-muted-foreground">
        Right-aligned, max-width 80%, user avatar, plain text (no markdown).
      </p>
      <ComponentPreview label="User bubble">
        <div className="w-full">
          <div className="group flex px-4 py-1 ml-auto flex-row-reverse gap-3">
            <UserAvatar />
            <div className="min-w-0 flex flex-col gap-1 max-w-[80%] items-end">
              <Message from="user">
                <MessageContent>
                  <p className="whitespace-pre-wrap break-words">
                    Can you help me refactor the authentication module?
                  </p>
                </MessageContent>
              </Message>
              <MessageActions className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <MessageAction
                  tooltip="Edit"
                  onClick={() => console.log("edit")}
                >
                  <Pencil className="size-3.5" />
                </MessageAction>
                <span className="px-1 text-[10px] text-muted-foreground">
                  2:34 PM
                </span>
              </MessageActions>
            </div>
          </div>
        </div>
      </ComponentPreview>

      <h2>Assistant Message (as rendered in-app)</h2>
      <p className="text-sm text-muted-foreground">
        Left-aligned, max-width 85%, robot avatar + persona name, Streamdown
        markdown rendering, hover actions (copy, retry).
      </p>
      <ComponentPreview label="Assistant bubble with markdown">
        <div className="w-full">
          <div className="group flex px-4 py-1 flex-row">
            <div className="min-w-0 flex flex-col gap-1 max-w-[85%] items-start">
              <div className="mb-0.5 flex items-center gap-1 text-xs">
                <AssistantAvatar />
                <span className="font-normal text-foreground">Goose</span>
              </div>
              <Message from="assistant">
                <MessageContent>
                  <div className="w-full min-w-0 text-[13px] leading-relaxed">
                    <MessageResponse>{markdownSample}</MessageResponse>
                  </div>
                </MessageContent>
              </Message>
              <MessageActions className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <CopyAction text={markdownSample} />
                <MessageAction
                  tooltip="Retry"
                  onClick={() => console.log("retry")}
                >
                  <RotateCcw className="size-3.5" />
                </MessageAction>
                <span className="px-1 text-[10px] text-muted-foreground">
                  2:35 PM
                </span>
              </MessageActions>
            </div>
          </div>
        </div>
      </ComponentPreview>

      <h2>Conversation Flow</h2>
      <p className="text-sm text-muted-foreground">
        Multiple messages showing the full chat layout with alignment,
        avatars, and hover actions.
      </p>
      <ComponentPreview label="Multi-turn conversation">
        <div className="flex w-full flex-col gap-2">
          {/* User message */}
          <div className="group flex px-4 py-1 ml-auto flex-row-reverse gap-3">
            <UserAvatar />
            <div className="min-w-0 flex flex-col gap-1 max-w-[80%] items-end">
              <Message from="user">
                <MessageContent>
                  <p className="whitespace-pre-wrap break-words">
                    What files handle routing in this project?
                  </p>
                </MessageContent>
              </Message>
              <MessageActions className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <MessageAction tooltip="Edit">
                  <Pencil className="size-3.5" />
                </MessageAction>
                <span className="px-1 text-[10px] text-muted-foreground">
                  2:30 PM
                </span>
              </MessageActions>
            </div>
          </div>

          {/* Assistant message */}
          <div className="group flex px-4 py-1 flex-row">
            <div className="min-w-0 flex flex-col gap-1 max-w-[85%] items-start">
              <div className="mb-0.5 flex items-center gap-1 text-xs">
                <AssistantAvatar />
                <span className="font-normal text-foreground">Goose</span>
              </div>
              <Message from="assistant">
                <MessageContent>
                  <div className="w-full min-w-0 text-[13px] leading-relaxed">
                    <MessageResponse>
                      {`The routing is handled in several key files:

- **\`src/app/router.tsx\`** — Main router configuration
- **\`src/pages/\`** — Individual route components
- **\`src/app/layout.tsx\`** — Root layout wrapper`}
                    </MessageResponse>
                  </div>
                </MessageContent>
              </Message>
              <MessageActions className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <CopyAction text="The routing is handled..." />
                <MessageAction tooltip="Retry">
                  <RotateCcw className="size-3.5" />
                </MessageAction>
                <span className="px-1 text-[10px] text-muted-foreground">
                  2:31 PM
                </span>
              </MessageActions>
            </div>
          </div>

          {/* Follow-up user message */}
          <div className="group flex px-4 py-1 ml-auto flex-row-reverse gap-3">
            <UserAvatar />
            <div className="min-w-0 flex flex-col gap-1 max-w-[80%] items-end">
              <Message from="user">
                <MessageContent>
                  <p className="whitespace-pre-wrap break-words">
                    Can you show me the router config?
                  </p>
                </MessageContent>
              </Message>
              <MessageActions className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <MessageAction tooltip="Edit">
                  <Pencil className="size-3.5" />
                </MessageAction>
                <span className="px-1 text-[10px] text-muted-foreground">
                  2:32 PM
                </span>
              </MessageActions>
            </div>
          </div>
        </div>
      </ComponentPreview>

      <h2>System Message</h2>
      <p className="text-sm text-muted-foreground">
        Centered, muted, narrow width — used for status notifications.
      </p>
      <ComponentPreview label="System notification">
        <div className="w-full">
          <div className="flex justify-center px-4 py-2">
            <div className="w-full max-w-md text-center text-xs text-muted-foreground">
              Session started with Claude 4.5 Sonnet
            </div>
          </div>
        </div>
      </ComponentPreview>

      <h2>Raw Primitives</h2>
      <p className="text-sm text-muted-foreground">
        The building blocks before MessageBubble adds layout and business logic.
      </p>
      <ComponentPreview label="Bare Message + MessageContent">
        <Message from="assistant">
          <MessageContent>
            <p>Raw assistant message without bubble styling.</p>
          </MessageContent>
          <MessageToolbar>
            <MessageActions>
              <MessageAction tooltip="Copy">
                <Copy size={14} />
              </MessageAction>
              <MessageAction tooltip="Retry">
                <RotateCcw size={14} />
              </MessageAction>
            </MessageActions>
          </MessageToolbar>
        </Message>
      </ComponentPreview>

      <h2>Architecture</h2>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>File</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primitives</td>
            <td><code>shared/ui/ai-elements/message.tsx</code></td>
            <td>Message, MessageContent, MessageActions, MessageResponse, MessageBranch</td>
          </tr>
          <tr>
            <td>Feature</td>
            <td><code>features/chat/ui/MessageBubble.tsx</code></td>
            <td>Composes primitives + avatars, width constraints, Streamdown markdown, hover actions, tool chains, reasoning blocks</td>
          </tr>
        </tbody>
      </table>

      <h2>Parts</h2>
      <ul>
        <li>
          <code>Message</code> — Root container with <code>from</code> prop
          (&quot;user&quot; | &quot;assistant&quot;)
        </li>
        <li>
          <code>MessageContent</code> — Content wrapper with role-based styling
        </li>
        <li>
          <code>MessageResponse</code> — Streamdown markdown renderer (code, math, mermaid, CJK)
        </li>
        <li>
          <code>MessageActions</code> — Action button row (copy, retry, edit)
        </li>
        <li>
          <code>MessageAction</code> — Single action with optional tooltip
        </li>
        <li>
          <code>MessageToolbar</code> — Bottom bar for actions
        </li>
        <li>
          <code>MessageBranch</code> — Branch navigation context (for
          multi-turn editing)
        </li>
      </ul>

      <h2>MessageBubble Additions</h2>
      <ul>
        <li><strong>Avatars</strong> — User circle icon (right), assistant robot/persona icon (left)</li>
        <li><strong>Width constraints</strong> — User 80%, assistant 85%</li>
        <li><strong>Alignment</strong> — User right-aligned (flex-row-reverse), assistant left-aligned</li>
        <li><strong>Typography</strong> — <code>text-[13px] leading-relaxed</code></li>
        <li><strong>Persona identity</strong> — Name + avatar above assistant messages</li>
        <li><strong>Hover actions</strong> — Copy, retry (assistant), edit (user), timestamp</li>
        <li><strong>Content types</strong> — Text, images (lightbox), tool chains, thinking/reasoning, system notifications, attachments</li>
        <li><strong>Markdown</strong> — MessageResponse (Streamdown) for assistant, plain text for user</li>
      </ul>
    </>
  );
}
