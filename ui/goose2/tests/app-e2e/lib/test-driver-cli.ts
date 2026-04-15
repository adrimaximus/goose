#!/usr/bin/env tsx
import { createTestDriver } from "./test-driver-client";
import { startSession, stopSession, stopAllSessions, resolvePort, listSessions } from "./test-session";

const args = process.argv.slice(2);
const sessionIdx = args.indexOf("--session");
let sessionId: string | undefined;
if (sessionIdx !== -1) {
  sessionId = args[sessionIdx + 1];
  args.splice(sessionIdx, 2);
}

const [action, selector, value] = args;

if (!action || action === "--help" || action === "help") {
  console.log(`Usage:
  test-driver start --session <id>       Start an app for exploration
  test-driver stop --session <id>        Stop a running session
  test-driver stop                       Stop all sessions
  test-driver list                       List active sessions
  test-driver <command> --session <id>   Run command against a session
  test-driver <command>                  Run against APP_TEST_DRIVER_PORT

Commands:
  snapshot                          Text DOM of visible elements
  getText <selector>                Get inner text of an element
  count <selector>                  Count matching elements
  click <selector>                  Click an element
  fill <selector> <value>           Fill an input/textarea
  keypress <selector> <key>         Dispatch a keyboard event
  waitForText <text>                Wait for text to appear (30s timeout)
  scroll <direction>                Scroll the page (up/down/top/bottom)
  screenshot [path]                 Take a screenshot`);
  process.exit(0);
}

if (action === "start") {
  if (!sessionId) { console.error("--session required"); process.exit(1); }
  await startSession(sessionId);
} else if (action === "stop") {
  sessionId ? stopSession(sessionId) : stopAllSessions();
} else if (action === "list") {
  listSessions();
} else {
  if (sessionId) {
    process.env.APP_TEST_DRIVER_PORT = String(resolvePort(sessionId));
  }

  try {
    const testDriver = await createTestDriver();
    let result: string | number;

    if (action === "screenshot") {
      result = await testDriver.screenshot(
        selector || `tests/app-e2e/screenshots/screenshot-${Date.now()}.png`,
      );
    } else if (action === "fill") {
      result = await testDriver.fill(selector, value);
    } else if (action === "keypress") {
      result = await testDriver.keypress(selector, value);
    } else if (action === "waitForText") {
      result = await testDriver.waitForText(selector);
    } else if (action === "scroll") {
      result = await testDriver.scroll(selector);
    } else if (action === "count") {
      result = await testDriver.count(selector);
    } else if (action === "click") {
      result = await testDriver.click(selector);
    } else if (action === "getText") {
      result = await testDriver.getText(selector);
    } else if (action === "snapshot") {
      result = await testDriver.snapshot();
    } else {
      console.error(`Unknown action: ${action}`);
      process.exit(1);
    }

    console.log(result);
    testDriver.close();
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}
