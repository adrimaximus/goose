# Step 02: Add ACP NPM Dependencies to goose2

## Objective

Add `@aaif/goose-acp` and `@agentclientprotocol/sdk` as dependencies of the goose2 frontend so we can use the TypeScript ACP client.

## Why

The `@aaif/goose-acp` package (located at `ui/acp/` in the monorepo) already provides:

- **`GooseClient`** — a full TypeScript ACP client wrapping `ClientSideConnection`
- **`GooseExtClient`** — generated typed client for Goose extension methods (`goose/providers/list`, `goose/session/export`, etc.)
- **`createHttpStream`** — an HTTP+SSE transport (we won't use this — we'll use WebSocket instead, see Step 03)
- **Generated types + Zod validators** for all Goose ACP extension method request/response shapes

This package is already used by `ui/desktop` (Electron) and `ui/text` (Ink TUI). goose2 currently does NOT depend on it.

## Changes

### 1. Add dependencies

**File:** `ui/goose2/package.json`

Run from the `ui/goose2/` directory:

```bash
source ./bin/activate-hermit
pnpm add @aaif/goose-acp @agentclientprotocol/sdk
```

If the packages are not published to npm yet or you want to use the local workspace version, use the workspace protocol instead. Check `ui/pnpm-workspace.yaml` to see if `ui/acp` is included in the workspace. If it is:

```bash
pnpm add @aaif/goose-acp@workspace:* @agentclientprotocol/sdk
```

If `ui/acp` is NOT in the pnpm workspace (goose2 has its own `pnpm-lock.yaml`), you have two options:

**Option A — Link locally during development:**
```bash
cd ui/acp
npm run build
npm link

cd ui/goose2
pnpm link @aaif/goose-acp
pnpm add @agentclientprotocol/sdk
```

**Option B — Use the published npm package:**
```bash
cd ui/goose2
pnpm add @aaif/goose-acp @agentclientprotocol/sdk
```

### 2. Verify the dependency resolves

After installation, verify the imports work:

```bash
cd ui/goose2
# Quick typecheck
pnpm typecheck
```

Create a temporary test file to confirm imports resolve:

```typescript
// src/shared/api/_test_acp_import.ts (DELETE AFTER VERIFICATION)
import { GooseClient } from "@aaif/goose-acp";
import type { Client, SessionNotification } from "@agentclientprotocol/sdk";

console.log("GooseClient:", GooseClient);
```

Run `pnpm typecheck` to confirm no type errors. Then delete the test file.

### 3. Verify key exports are available

The following imports must resolve — these are what Steps 03–06 will use:

From `@aaif/goose-acp`:
```typescript
import { GooseClient } from "@aaif/goose-acp";
```

From `@agentclientprotocol/sdk`:
```typescript
import type {
  Client,
  SessionNotification,
  SessionUpdate,
  ContentBlock,
  ToolCallContent,
  RequestPermissionRequest,
  RequestPermissionResponse,
  NewSessionRequest,
  NewSessionResponse,
  LoadSessionRequest,
  LoadSessionResponse,
  PromptRequest,
  PromptResponse,
  CancelNotification,
  SetSessionConfigOptionRequest,
  SetSessionConfigOptionResponse,
  ForkSessionRequest,
  ForkSessionResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  InitializeRequest,
  ProtocolVersion,
  Implementation,
  SessionModelState,
  SessionInfoUpdate,
  SessionConfigOption,
  SessionConfigKind,
  SessionConfigSelectOptions,
  SessionConfigOptionCategory,
} from "@agentclientprotocol/sdk";
```

### 4. Check `@agentclientprotocol/sdk` version compatibility

The `@aaif/goose-acp` package declares `@agentclientprotocol/sdk` as a **peer dependency** (`"*"`). The Rust backend currently uses `agent-client-protocol = "0.10.4"`. The TypeScript SDK should be at a compatible version.

Check `ui/acp/package.json` for the devDependency version — it currently shows `"@agentclientprotocol/sdk": "^0.14.1"`. Install the same or newer version:

```bash
pnpm add @agentclientprotocol/sdk@^0.14.1
```

## Verification

1. `pnpm typecheck` passes with no errors related to the new dependencies.
2. `pnpm check` (Biome lint + file sizes) passes.
3. `pnpm test` still passes (no existing tests should break).

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Add `@aaif/goose-acp` and `@agentclientprotocol/sdk` to dependencies |
| `pnpm-lock.yaml` | Auto-updated by pnpm |

## Notes

- The `@aaif/goose-acp` package exports `GooseClient` which wraps `ClientSideConnection` from `@agentclientprotocol/sdk`. It adds Goose-specific extension methods via `GooseExtClient`.
- The package currently ships `createHttpStream` (HTTP+SSE transport). We will use **WebSocket** transport instead. The `GooseClient` constructor accepts any `Stream` (a `{ readable, writable }` pair of `ReadableStream<AnyMessage>` and `WritableStream<AnyMessage>`). In Step 03 we'll create a `createWebSocketStream` helper — either locally in goose2 or contributed to `@aaif/goose-acp`.
- The `goose serve` WebSocket endpoint at `/acp` uses simple framing: each WS text frame is a single JSON-RPC message (no newline delimiters needed). This is the same transport the Rust Tauri backend already uses in `thread.rs`.
- If we decide to add `createWebSocketStream` to `@aaif/goose-acp` itself (we control the package), it would be exported alongside `createHttpStream` and available to all consumers.
