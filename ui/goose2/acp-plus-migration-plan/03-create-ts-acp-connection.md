# Step 03: Create the TypeScript ACP Connection Manager

## Objective

Create a singleton module that manages the lifecycle of the `GooseClient` connection to `goose serve` over WebSocket. This is the TypeScript equivalent of the Rust `GooseAcpManager::start()` singleton.

## Why

All ACP operations (send prompt, list sessions, export, etc.) need a shared, initialized `GooseClient` instance. This module:

1. Fetches the `goose serve` WebSocket URL from the Rust backend (Step 01's command)
2. Creates a WebSocket `Stream` for the ACP SDK
3. Creates a `GooseClient` with that stream
4. Calls `client.initialize()` to complete the ACP handshake
5. Provides the initialized client to all other modules

## New Files

### 1. `src/shared/api/createWebSocketStream.ts` — WebSocket transport for ACP

The `@agentclientprotocol/sdk` defines a `Stream` as `{ readable: ReadableStream<AnyMessage>, writable: WritableStream<AnyMessage> }`. The SDK ships `ndJsonStream` for stdio. The `@aaif/goose-acp` package ships `createHttpStream` for HTTP+SSE. Neither provides a WebSocket transport.

We need a `createWebSocketStream` that bridges a browser `WebSocket` to the ACP `Stream` interface. The `goose serve` WebSocket protocol is simple: each WS text frame is a single JSON-RPC message (no newline delimiters).

> **Alternative**: This helper could be contributed to `@aaif/goose-acp` so all consumers benefit. Since we control that package, we can do this at any time. For now, creating it locally in goose2 is the fastest path.

```typescript
/**
 * WebSocket transport for ACP connections.
 *
 * Creates a Stream (readable + writable pair of AnyMessage) backed by a
 * browser WebSocket connection. Each WS text frame is a single JSON-RPC
 * message — no newline delimiters needed.
 *
 * This matches the framing used by goose serve's /acp WebSocket endpoint
 * (see crates/goose-acp/src/transport/websocket.rs).
 */
import type { AnyMessage, Stream } from "@agentclientprotocol/sdk";

export function createWebSocketStream(wsUrl: string): Stream {
  const ws = new WebSocket(wsUrl);

  // Queue of messages received from the server, consumed by the readable stream.
  const incoming: AnyMessage[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;

  function pushMessage(msg: AnyMessage): void {
    incoming.push(msg);
    const waiter = waiters.shift();
    if (waiter) waiter();
  }

  function waitForMessage(): Promise<void> {
    if (incoming.length > 0 || closed) return Promise.resolve();
    return new Promise<void>((resolve) => waiters.push(resolve));
  }

  // Wait for the WebSocket to open before allowing writes.
  const openPromise = new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true });
    ws.addEventListener("error", (event) => {
      reject(new Error(`WebSocket connection failed: ${event}`));
    }, { once: true });
  });

  ws.addEventListener("message", (event) => {
    if (typeof event.data !== "string") return;
    try {
      const msg = JSON.parse(event.data) as AnyMessage;
      pushMessage(msg);
    } catch {
      // Ignore malformed JSON
    }
  });

  ws.addEventListener("close", () => {
    closed = true;
    // Wake any pending reader so it can see the stream is done.
    for (const waiter of waiters) waiter();
    waiters.length = 0;
  });

  ws.addEventListener("error", () => {
    closed = true;
    for (const waiter of waiters) waiter();
    waiters.length = 0;
  });

  const readable = new ReadableStream<AnyMessage>({
    async pull(controller) {
      await waitForMessage();
      while (incoming.length > 0) {
        controller.enqueue(incoming.shift()!);
      }
      if (closed && incoming.length === 0) {
        controller.close();
      }
    },
  });

  const writable = new WritableStream<AnyMessage>({
    async write(msg) {
      await openPromise;
      ws.send(JSON.stringify(msg));
    },
    close() {
      ws.close();
    },
    abort() {
      ws.close();
    },
  });

  return { readable, writable };
}
```

### 2. `src/shared/api/acpConnection.ts` — Singleton connection manager

```typescript
/**
 * Singleton ACP connection manager.
 *
 * Manages the lifecycle of the GooseClient connection to goose serve
 * over WebSocket. All ACP operations go through the client returned
 * by getClient().
 */
import { invoke } from "@tauri-apps/api/core";
import { GooseClient } from "@aaif/goose-acp";
import type {
  Client,
  SessionNotification,
  RequestPermissionRequest,
  RequestPermissionResponse,
} from "@agentclientprotocol/sdk";
import { createWebSocketStream } from "./createWebSocketStream";

// Will be set by Step 04 — the notification handler
let notificationHandler: AcpNotificationHandler | null = null;

/**
 * Interface for the notification handler that processes ACP session events.
 * Implemented in Step 04 (acpNotificationHandler.ts).
 */
export interface AcpNotificationHandler {
  handleSessionNotification(notification: SessionNotification): Promise<void>;
}

/**
 * Register the notification handler. Called once during app initialization
 * after the handler is created in Step 04.
 */
export function setNotificationHandler(handler: AcpNotificationHandler): void {
  notificationHandler = handler;
}

// Singleton state
let clientPromise: Promise<GooseClient> | null = null;
let resolvedClient: GooseClient | null = null;

/**
 * Build the Client implementation that the ACP SDK calls back into.
 *
 * This handles two callback types:
 * - requestPermission: auto-approve with the first option (same as Rust impl)
 * - sessionUpdate: delegate to the registered notification handler
 */
function createClientCallbacks(): () => Client {
  return () => ({
    requestPermission: async (
      args: RequestPermissionRequest,
    ): Promise<RequestPermissionResponse> => {
      // Auto-approve with the first available option, matching the Rust behavior
      // in dispatcher.rs: RequestPermissionResponse::new(
      //   RequestPermissionOutcome::Selected(SelectedPermissionOutcome::new(option_id))
      // )
      const optionId = args.options?.[0]?.optionId ?? "approve";
      return {
        outcome: {
          type: "selected",
          optionId,
        },
      };
    },

    sessionUpdate: async (
      notification: SessionNotification,
    ): Promise<void> => {
      if (notificationHandler) {
        await notificationHandler.handleSessionNotification(notification);
      }
    },
  });
}

/**
 * Initialize the ACP connection.
 *
 * 1. Calls the Rust backend to get the goose serve WebSocket URL
 * 2. Creates a GooseClient with WebSocket transport
 * 3. Sends the ACP initialize handshake
 *
 * This is idempotent — calling it multiple times returns the same client.
 */
async function initializeConnection(): Promise<GooseClient> {
  // Get the goose serve WebSocket URL from the Rust backend.
  // This blocks until the server is confirmed ready.
  // Returns something like "ws://127.0.0.1:54321/acp"
  const wsUrl: string = await invoke("get_goose_serve_url");

  const stream = createWebSocketStream(wsUrl);

  const client = new GooseClient(createClientCallbacks(), stream);

  // Perform the ACP initialize handshake.
  // The protocol version should match what goose serve expects.
  // The Rust code uses ProtocolVersion::LATEST from agent-client-protocol.
  // Check @agentclientprotocol/sdk for the equivalent constant.
  await client.initialize({
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "goose2",
      version: "0.1.0",
    },
  });

  return client;
}

/**
 * Get the initialized GooseClient singleton.
 *
 * The first call triggers initialization (fetching the URL, creating the
 * WebSocket connection, running the ACP handshake). Subsequent calls return
 * the same client immediately.
 *
 * Throws if initialization fails (e.g., goose serve is not running).
 */
export async function getClient(): Promise<GooseClient> {
  if (resolvedClient) {
    return resolvedClient;
  }

  if (!clientPromise) {
    clientPromise = initializeConnection()
      .then((client) => {
        resolvedClient = client;
        return client;
      })
      .catch((error) => {
        // Reset so the next call retries
        clientPromise = null;
        throw error;
      });
  }

  return clientPromise;
}

/**
 * Check if the client has been initialized.
 * Useful for guards that need to know if ACP is ready without triggering init.
 */
export function isClientReady(): boolean {
  return resolvedClient !== null;
}

/**
 * Get the client synchronously, or null if not yet initialized.
 * Use getClient() for the async version that triggers initialization.
 */
export function getClientSync(): GooseClient | null {
  return resolvedClient;
}
```

## Architecture Notes

### WebSocket Transport

The `goose serve` WebSocket endpoint at `/acp` uses simple framing:
- **Client → Server**: Send a WS text frame containing a single JSON-RPC message (no trailing newline needed)
- **Server → Client**: Each WS text frame contains a single JSON-RPC message

This is exactly what the Rust Tauri backend does in `thread.rs` — it bridges between the `ClientSideConnection`'s newline-delimited JSON and the WebSocket's frame-per-message protocol. Our `createWebSocketStream` does the same bridging but directly in the browser.

### Why WebSocket over HTTP+SSE

- **Same transport the Rust layer already uses** — proven to work with `goose serve`
- **True bidirectional** — no need for separate POST requests for each message
- **Lower overhead** — no HTTP headers per message, no SSE framing
- **Simpler connection model** — single persistent connection vs. SSE reconnection
- The `@aaif/goose-acp` package ships `createHttpStream` for HTTP+SSE, but that transport has quirks (fire-and-forget POSTs for non-initialize requests, session header management). WebSocket is cleaner.

### Singleton Pattern

The module uses a promise-based singleton pattern:
- `clientPromise` ensures only one initialization runs at a time
- `resolvedClient` caches the result for synchronous access
- If initialization fails, `clientPromise` is reset so the next call retries

This mirrors the Rust `OnceCell<Arc<GooseAcpManager>>` pattern in `manager.rs`.

### Notification Handler Registration

The notification handler is registered separately (in Step 04) rather than being passed to `createClientCallbacks` at construction time. This avoids a circular dependency:
- `acpConnection.ts` creates the client
- `acpNotificationHandler.ts` needs the client (to know about sessions)
- `acpNotificationHandler.ts` needs to be registered with the connection

The `setNotificationHandler()` function breaks this cycle.

### Client Callback Shape

The `Client` interface from `@agentclientprotocol/sdk` defines `sessionUpdate` (not `sessionNotification`) as the callback method name. The Rust code's `Client` trait has `session_notification` — this is the same callback, just different naming conventions. Verify the exact method name in the SDK's `Client` interface:

```typescript
export interface Client {
  requestPermission(params: RequestPermissionRequest): Promise<RequestPermissionResponse>;
  sessionUpdate(params: SessionNotification): Promise<void>;
  // ... optional methods: writeTextFile, readTextFile, createTerminal, etc.
}
```

### Protocol Version

The `protocolVersion` in the initialize request should match what `goose serve` expects. The Rust code uses `ProtocolVersion::LATEST` from the `agent-client-protocol` crate (currently `"2025-03-26"`). Check the `@agentclientprotocol/sdk` package for an exported constant — it may be available as `LATEST_PROTOCOL_VERSION` or similar. If not, hardcode the string.

### Error Handling

If `invoke("get_goose_serve_url")` fails (e.g., goose binary not found), the error propagates to the caller. The app startup code (Step 08) should handle this gracefully — showing an error state rather than crashing.

### Reconnection

The initial implementation does not handle WebSocket reconnection. If the connection drops (e.g., `goose serve` crashes), `getClient()` will return the stale client. Future enhancement: monitor `client.closed` / `client.signal` and reset the singleton so the next `getClient()` call reconnects.

## Verification

1. `pnpm typecheck` passes.
2. `pnpm check` passes (Biome lint).
3. The modules can be imported without side effects — initialization only happens when `getClient()` is called.
4. Unit test for `createWebSocketStream`: mock `WebSocket`, verify messages flow bidirectionally.

## Files Created

| File | Purpose |
|------|---------|
| `src/shared/api/createWebSocketStream.ts` | WebSocket → ACP Stream adapter |
| `src/shared/api/acpConnection.ts` | Singleton ACP connection manager |

## Dependencies

- Step 01 (the `get_goose_serve_url` Tauri command must exist)
- Step 02 (`@aaif/goose-acp` and `@agentclientprotocol/sdk` must be installed)

## Future: Contribute `createWebSocketStream` to `@aaif/goose-acp`

Since we control the `@aaif/goose-acp` package, we should eventually move `createWebSocketStream` there so it's available to all consumers (Electron app, TUI, etc.). The function would be exported alongside `createHttpStream`:

```typescript
// In @aaif/goose-acp
export { createHttpStream } from "./http-stream.js";
export { createWebSocketStream } from "./ws-stream.js";
```

For now, keeping it local in goose2 is the fastest path.
