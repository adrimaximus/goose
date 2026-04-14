# Step 01: Expose the `goose serve` URL to the Frontend

## Objective

Add a single new Tauri command that returns the WebSocket URL of the running `goose serve` process. The frontend will use this URL to connect directly via WebSocket.

## Why

Currently the Rust layer connects to `goose serve` over WebSocket internally and proxies everything. The frontend never knows the server URL. We need to expose it so the TypeScript ACP client can connect directly.

## Changes

### 1. Add a public URL getter on `GooseServeProcess`

**File:** `src-tauri/src/services/acp/goose_serve.rs`

The struct already has a `ws_url()` method that returns `ws://127.0.0.1:<port>/acp`. We just need to make sure it (or an equivalent) is accessible from the command layer. Currently `ws_url()` is `pub` on the struct, so it's already usable. No change needed to the struct itself.

If you prefer a separate method name to distinguish from the internal usage:

```rust
impl GooseServeProcess {
    /// Return the WebSocket URL for the frontend to connect to directly.
    pub fn frontend_ws_url(&self) -> String {
        format!("ws://{LOCALHOST}:{}/acp", self.port)
    }

    // ... existing ws_url() method is identical, kept for backward compat ...
}
```

Or simply reuse `ws_url()` — it returns the same thing.

### 2. Add the Tauri command

**File:** `src-tauri/src/commands/acp.rs`

Add this command alongside the existing ones (it will coexist during migration):

```rust
/// Return the WebSocket URL of the running goose serve process.
///
/// This command blocks until the server is confirmed ready. The frontend
/// uses this URL to establish a direct WebSocket ACP connection.
#[tauri::command]
pub async fn get_goose_serve_url() -> Result<String, String> {
    // GooseServeProcess::start() is idempotent — it returns immediately
    // if the process is already running.
    GooseServeProcess::start().await?;
    let process = GooseServeProcess::get()?;
    Ok(process.ws_url())
}
```

Add the necessary import at the top of the file if not already present:

```rust
use crate::services::acp::goose_serve::GooseServeProcess;
```

Note: `GooseServeProcess` is currently re-exported from `services::acp` as `resolve_goose_binary` but the struct itself is used via `goose_serve::GooseServeProcess` internally. You may need to add a `pub use` in `services/acp/mod.rs`:

```rust
pub(crate) use goose_serve::GooseServeProcess;
```

### 3. Register the command

**File:** `src-tauri/src/lib.rs`

Add the new command to the `invoke_handler` macro:

```rust
commands::acp::get_goose_serve_url,
```

Place it near the other `commands::acp::*` entries.

### 4. Verify CSP allows localhost WebSocket

**File:** `src-tauri/tauri.conf.json`

Check the `security.csp` field. Currently it is:

```json
"security": {
  "csp": null,
  ...
}
```

`null` means CSP is disabled — **no changes needed**. The frontend can freely open WebSocket connections to `ws://127.0.0.1:*`.

If CSP were ever re-enabled, you'd need to add:
```
connect-src 'self' ws://127.0.0.1:*
```

## Verification

1. Run `just tauri-check` (or `cargo check` in `src-tauri/`) to confirm the Rust compiles.
2. Run `cargo clippy --all-targets -- -D warnings` in `src-tauri/`.
3. Run `cargo fmt` in `src-tauri/`.
4. Manually test by adding a temporary `console.log(await invoke("get_goose_serve_url"))` in the frontend startup — it should print something like `ws://127.0.0.1:54321/acp`.

## Files Modified

| File | Change |
|------|--------|
| `src-tauri/src/services/acp/goose_serve.rs` | Optionally add `frontend_ws_url()`, or reuse existing `ws_url()` |
| `src-tauri/src/services/acp/mod.rs` | Add `pub(crate) use goose_serve::GooseServeProcess` if needed |
| `src-tauri/src/commands/acp.rs` | Add `get_goose_serve_url` command |
| `src-tauri/src/lib.rs` | Register `get_goose_serve_url` in invoke_handler |

## Notes

- The existing ACP commands remain functional during migration. They will be removed in Step 09.
- `GooseServeProcess::start()` is idempotent — calling it multiple times is safe. The first call spawns the process; subsequent calls return immediately.
- The readiness check (WebSocket probe loop in `wait_for_server_ready`) ensures the URL is only returned after the server is accepting connections.
- The URL includes the `/acp` path because that's the WebSocket endpoint on `goose serve`. The frontend connects to this directly — same endpoint the Rust layer currently uses in `thread.rs`.
