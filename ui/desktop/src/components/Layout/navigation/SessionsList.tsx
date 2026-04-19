import React, { useState, useCallback } from 'react';
import { MessageSquare, ChefHat, Plus, MoreVertical, Trash2, GripVertical, History, Archive, ArchiveRestore } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { SessionIndicators } from '../../SessionIndicators';
import { InlineEditText } from '../../common/InlineEditText';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../ui/dropdown-menu';
import { cn } from '../../../utils';
import { getSessionDisplayName } from '../../../hooks/useNavigationSessions';
import { deleteSession, updateSessionName } from '../../../api';
import { AppEvents } from '../../../constants/events';
import type { Session } from '../../../api';
import type { SessionStatus } from './types';
import { defineMessages, useIntl } from '../../../i18n';
import { archiveSession, unarchiveSession } from '../../../api/sdk.gen';

async function archiveSessionApi(sessionId: string): Promise<void> {
  await archiveSession({ path: { session_id: sessionId } });
}

async function unarchiveSessionApi(sessionId: string): Promise<void> {
  await unarchiveSession({ path: { session_id: sessionId } });
}

const i18n = defineMessages({
  startNewChat: {
    id: 'sessionsList.startNewChat',
    defaultMessage: 'Start New Chat',
  },
  untitledSession: {
    id: 'sessionsList.untitledSession',
    defaultMessage: 'Untitled session',
  },
  deleteSession: {
    id: 'sessionsList.deleteSession',
    defaultMessage: 'Delete session',
  },
  deleteTitle: {
    id: 'sessionsList.deleteTitle',
    defaultMessage: 'Delete Session',
  },
  deleteMessage: {
    id: 'sessionsList.deleteMessage',
    defaultMessage: 'Are you sure you want to delete this session? This action cannot be undone.',
  },
  deleteConfirm: {
    id: 'sessionsList.deleteConfirm',
    defaultMessage: 'Delete',
  },
  deleteCancel: {
    id: 'sessionsList.deleteCancel',
    defaultMessage: 'Cancel',
  },
  showAll: {
    id: 'sessionsList.showAll',
    defaultMessage: 'Show All',
  },
  archiveSession: {
    id: 'sessionsList.archiveSession',
    defaultMessage: 'Archive session',
  },
  unarchiveSession: {
    id: 'sessionsList.unarchiveSession',
    defaultMessage: 'Unarchive session',
  },
});

interface SessionsListProps {
  sessions: Session[];
  activeSessionId?: string;
  isExpanded: boolean;
  getSessionStatus: (sessionId: string) => SessionStatus | undefined;
  clearUnread: (sessionId: string) => void;
  onSessionClick: (sessionId: string) => void;
  onSessionRenamed?: () => void;
  onNewChat?: () => void;
  onShowAll?: () => void;
  onSessionsReordered?: (reorderedSessions: Session[]) => void;
}

interface SessionItemProps {
  session: Session;
  isActiveSession: boolean;
  isEditing: boolean;
  status: SessionStatus | undefined;
  onSessionClick: (sessionId: string) => void;
  onClearUnread: (sessionId: string) => void;
  onSaveName: (newName: string) => Promise<void>;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDeleteClick: (session: Session) => void;
  onArchiveClick: (session: Session) => void;
  onUnarchiveClick: (session: Session) => void;
  untitledLabel: string;
  deleteLabel: string;
  archiveLabel: string;
  unarchiveLabel: string;
  isStreaming: boolean;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActiveSession,
  isEditing,
  status,
  onSessionClick,
  onClearUnread,
  onSaveName,
  onEditStart,
  onEditEnd,
  onDeleteClick,
  onArchiveClick,
  onUnarchiveClick,
  untitledLabel,
  deleteLabel,
  archiveLabel,
  unarchiveLabel,
  isStreaming,
}) => {
  const dragControls = useDragControls();

  const hasError = status?.streamState === 'error';
  const hasUnread = status?.hasUnreadActivity ?? false;

  return (
    <Reorder.Item
      value={session}
      id={session.id}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        'group/session w-full text-left py-1.5 px-2 text-xs rounded-md',
        'hover:bg-background-tertiary transition-colors',
        'flex items-center gap-2 list-none',
        isActiveSession && 'bg-background-tertiary',
      )}
      onClick={() => {
        if (!isEditing) {
          onClearUnread(session.id);
          onSessionClick(session.id);
        }
      }}
    >
      <GripVertical
        className="w-3 h-3 flex-shrink-0 text-text-tertiary opacity-0 group-hover/session:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      />
      {session.recipe ? (
        <ChefHat className="w-4 h-4 flex-shrink-0 text-text-secondary" />
      ) : (
        <MessageSquare className="w-4 h-4 flex-shrink-0 text-text-secondary" />
      )}
      <InlineEditText
        value={getSessionDisplayName(session)}
        onSave={onSaveName}
        placeholder={untitledLabel}
        disabled={isStreaming}
        singleClickEdit={false}
        className="truncate text-text-primary flex-1 !px-0 !py-0 hover:bg-transparent"
        editClassName="!text-xs"
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
      />
      <SessionIndicators
        isStreaming={isStreaming}
        hasUnread={hasUnread}
        hasError={hasError}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-0.5 rounded hover:bg-background-secondary transition-colors flex-shrink-0 opacity-0 group-hover/session:opacity-100 data-[state=open]:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={4}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if ((session as { archived_at?: string | null }).archived_at) {
                onUnarchiveClick(session);
              } else {
                onArchiveClick(session);
              }
            }}
          >
            {(session as { archived_at?: string | null }).archived_at ? (
              <>
                <ArchiveRestore className="w-4 h-4" />
                {unarchiveLabel}
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                {archiveLabel}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(session);
            }}
          >
            <Trash2 className="w-4 h-4" />
            {deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Reorder.Item>
  );
};

export const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  activeSessionId,
  isExpanded,
  getSessionStatus,
  clearUnread,
  onSessionClick,
  onSessionRenamed,
  onNewChat,
  onShowAll,
  onSessionsReordered,
}) => {
  const intl = useIntl();
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveSessionName = useCallback(
    async (sessionId: string, newName: string) => {
      await updateSessionName({
        path: { session_id: sessionId },
        body: { name: newName },
      });
      onSessionRenamed?.();
    },
    [onSessionRenamed],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSession({
        path: { session_id: sessionToDelete.id },
        throwOnError: true,
      });
      window.dispatchEvent(
        new CustomEvent(AppEvents.SESSION_DELETED, {
          detail: { sessionId: sessionToDelete.id },
        }),
      );
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  }, [sessionToDelete]);

  const handleReorder = useCallback(
    (reordered: Session[]) => {
      onSessionsReordered?.(reordered);
    },
    [onSessionsReordered],
  );

  const handleArchiveSession = useCallback(async (session: Session) => {
    try {
      await archiveSessionApi(session.id);
      window.dispatchEvent(new CustomEvent(AppEvents.SESSION_UPDATED));
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  }, []);

  const handleUnarchiveSession = useCallback(async (session: Session) => {
    try {
      await unarchiveSessionApi(session.id);
      window.dispatchEvent(new CustomEvent(AppEvents.SESSION_UPDATED));
    } catch (error) {
      console.error('Error unarchiving session:', error);
    }
  }, []);

  const untitledLabel = intl.formatMessage(i18n.untitledSession);
  const deleteLabel = intl.formatMessage(i18n.deleteSession);
  const archiveLabel = intl.formatMessage(i18n.archiveSession);
  const unarchiveLabel = intl.formatMessage(i18n.unarchiveSession);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="mt-[2px]"
          >
            <motion.div
              layoutScroll
              className="bg-background-primary rounded-lg py-1 sessions-scroll-container no-drag"
              style={{
                maxHeight: '240px',
                overflowY: 'auto',
                position: 'relative',
              }}
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              {onNewChat && (
                <div
                  onClick={onNewChat}
                  className={cn(
                    'w-full text-left py-1.5 px-2 text-xs rounded-md',
                    'hover:bg-background-tertiary transition-colors',
                    'flex items-center gap-2 cursor-pointer',
                  )}
                >
                  <div className="w-3 flex-shrink-0" />
                  <div className="w-4 flex-shrink-0" />
                  <Plus className="w-4 h-4 flex-shrink-0 text-text-secondary" />
                  <span className="text-text-primary">
                    {intl.formatMessage(i18n.startNewChat)}
                  </span>
                </div>
              )}

              <Reorder.Group
                as="div"
                axis="y"
                onReorder={handleReorder}
                values={sessions}
                className="list-none p-0 m-0 flex flex-col gap-[2px]"
              >
                {sessions.map((session) => {
                  const status = getSessionStatus(session.id);
                  const isStreaming = status?.streamState === 'streaming';
                  const isEditing = editingSessionId === session.id;
                  const isActiveSession = session.id === activeSessionId;

                  return (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActiveSession={isActiveSession}
                      isEditing={isEditing}
                      status={status}
                      onSessionClick={onSessionClick}
                      onClearUnread={clearUnread}
                      onSaveName={(newName) =>
                        handleSaveSessionName(session.id, newName)
                      }
                      onEditStart={() => setEditingSessionId(session.id)}
                      onEditEnd={() => setEditingSessionId(null)}
                      onDeleteClick={setSessionToDelete}
                      onArchiveClick={handleArchiveSession}
                      onUnarchiveClick={handleUnarchiveSession}
                      untitledLabel={untitledLabel}
                      deleteLabel={deleteLabel}
                      archiveLabel={archiveLabel}
                      unarchiveLabel={unarchiveLabel}
                      isStreaming={isStreaming}
                    />
                  );
                })}
              </Reorder.Group>
              {onShowAll && (
                <div
                  onClick={onShowAll}
                  className={cn(
                    'w-full text-left py-1.5 px-2 text-xs rounded-md',
                    'hover:bg-background-tertiary transition-colors',
                    'flex items-center gap-2 cursor-pointer text-text-secondary',
                  )}
                >
                  <div className="w-3 flex-shrink-0" />
                  <History className="w-4 h-4 flex-shrink-0" />
                  <span>{intl.formatMessage(i18n.showAll)}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!sessionToDelete}
        title={intl.formatMessage(i18n.deleteTitle)}
        message={intl.formatMessage(i18n.deleteMessage)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSessionToDelete(null)}
        confirmLabel={intl.formatMessage(i18n.deleteConfirm)}
        cancelLabel={intl.formatMessage(i18n.deleteCancel)}
        confirmVariant="destructive"
        isSubmitting={isDeleting}
      />
    </>
  );
};
