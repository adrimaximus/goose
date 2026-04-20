/**
 * Custom event names used throughout the application.
 */
export enum AppEvents {
  SESSION_CREATED = 'session-created',
  SESSION_EXTENSIONS_LOADED = 'session-extensions-loaded',
  SESSION_DELETED = 'session-deleted',
  SESSION_RENAMED = 'session-renamed',
  SESSION_FORKED = 'session-forked',
  SESSION_UPDATED = 'session-updated',
  SESSION_NEEDS_NAME_UPDATE = 'session-needs-name-update',
  SESSION_STATUS_UPDATE = 'session-status-update',
  ADD_ACTIVE_SESSION = 'add-active-session',
  CLEAR_INITIAL_MESSAGE = 'clear-initial-message',
  TRIGGER_NEW_CHAT = 'trigger-new-chat',
  MESSAGE_STREAM_FINISHED = 'message-stream-finished',
  MESSAGE_CONTENT = 'goose:message-content',
  SCROLL_CHAT_TO_BOTTOM = 'scroll-chat-to-bottom',
  HIDE_ALERT_POPOVER = 'hide-alert-popover',
  RESPONSE_STYLE_CHANGED = 'responseStyleChanged',
  TOOL_CALL_STARTED = 'goose:tool-call-started',
  TOOL_CALL_COMPLETED = 'goose:tool-call-completed',
  AVATAR_HOVER = 'goose:avatar-hover',
  AVATAR_CLICK = 'goose:avatar-click',
  CHAT_SCROLLED = 'goose:chat-scrolled',
}
