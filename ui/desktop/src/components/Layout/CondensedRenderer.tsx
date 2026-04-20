import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { defineMessages, useIntl } from '../../i18n';
import { cn } from '../../utils';
import { DropdownMenu, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AgentMood } from '../AgentMood';
import { useAgentMood } from '../../contexts/AgentMoodContext';
import { ChatSessionsDropdown, SessionsList } from './navigation';
import type { NavigationRendererProps } from './navigation/types';

const i18n = defineMessages({
  newChat: {
    id: 'condensedRenderer.newChat',
    defaultMessage: 'New Chat',
  },
});

export const CondensedRenderer: React.FC<NavigationRendererProps> = ({
  isOverlayMode,
  navigationPosition,
  isCondensedIconOnly,
  className,
  visibleItems,
  isActive,
  recentSessions,
  activeSessionId,
  onNavClick,
  onNewChat,
  onSessionClick,
  onFetchSessions,
  getSessionStatus,
  clearUnread,
  isChatExpanded,
  onToggleChatExpanded,
  drag,
  navFocusRef,
  onSessionsReordered,
}) => {
  const intl = useIntl();
  const [chatPopoverOpen, setChatPopoverOpen] = useState(false);
  const isSessionDragRef = useRef(false);
  const agentMood = useAgentMood();

  const isVertical = navigationPosition === 'left' || navigationPosition === 'right';
  const isTopPosition = navigationPosition === 'top';
  const isBottomPosition = navigationPosition === 'bottom';

  return (
    <motion.div
      ref={navFocusRef}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'bg-app outline-none rounded-xl border border-border-primary',
        isOverlayMode && 'backdrop-blur-md shadow-lg p-2',
        isVertical ? 'flex flex-col gap-[2px] h-full' : 'flex flex-row items-stretch gap-[2px]',
        !isOverlayMode && navigationPosition === 'left' && !isCondensedIconOnly && 'pr-[2px]',
        !isOverlayMode && navigationPosition === 'right' && !isCondensedIconOnly && 'pl-[2px]',
        !isOverlayMode && isTopPosition && 'pb-[2px] pt-0',
        !isOverlayMode && isBottomPosition && 'pt-[2px] pb-0',
        !isCondensedIconOnly && 'overflow-visible',
        className
      )}
    >
      {/* Top spacer (vertical only) */}
      {isVertical && (
        <div
          className={cn(
            'bg-app rounded-lg flex-shrink-0',
            isCondensedIconOnly ? 'h-[80px] w-[40px]' : 'h-[48px] w-full'
          )}
        />
      )}

      {/* Left spacer (horizontal top position only) */}
      {!isVertical && isTopPosition && (
        <div className="bg-app rounded-lg self-stretch w-[160px] flex-shrink-0" />
      )}

      {/* Navigation items */}
      {isVertical ? (
        <div className="flex-1 min-h-0 flex flex-col gap-[2px]">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isDragging = drag.draggedItem === item.id;
            const isDragOver = drag.dragOverItem === item.id;
            const isChatItem = item.id === 'chat';

            return (
              <motion.div
                key={item.id}
                {...(!(isChatItem && isChatExpanded) ? {
                  draggable: true,
                  onDragStart: (e: React.DragEvent<HTMLDivElement>) => {
                    drag.onDragStart(e, item.id);
                  },
                  onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
                    drag.onDragOver(e, item.id);
                  },
                  onDrop: (e: React.DragEvent<HTMLDivElement>) => {
                    drag.onDrop(e, item.id);
                  },
                  onDragEnd: drag.onDragEnd,
                } : {
                  draggable: false,
                })}
                initial={{ opacity: 0 }}
                animate={{ opacity: isDragging ? 0.5 : 1 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                className={cn(
                  'relative group',
                  isCondensedIconOnly ? 'flex-shrink-0' : 'w-full flex-shrink-0',
                  !(isChatItem && isChatExpanded) && 'cursor-move',
                  isDragOver && 'ring-2 ring-blue-500 rounded-lg',
                  isChatItem && !isCondensedIconOnly && 'overflow-visible'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col',
                    isCondensedIconOnly ? 'items-start' : 'w-full',
                    isChatItem && !isCondensedIconOnly && 'overflow-visible'
                  )}
                  style={{ position: 'relative' }}
                >
                  {/* Chat item with dropdown in icon-only mode */}
                  {isChatItem && isCondensedIconOnly ? (
                    <DropdownMenu open={chatPopoverOpen} onOpenChange={setChatPopoverOpen}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'flex items-center justify-center',
                            'rounded-lg transition-colors duration-200 no-drag',
                            'p-2.5',
                            active
                              ? 'bg-background-tertiary text-text-secondary'
                              : 'text-text-primary hover:text-text-secondary'
                          )}
                        >
                          <Icon className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <ChatSessionsDropdown
                        sessions={recentSessions}
                        activeSessionId={activeSessionId}
                        side={navigationPosition === 'left' ? 'right' : 'left'}
                        getSessionStatus={getSessionStatus}
                        clearUnread={clearUnread}
                        onNewChat={onNewChat}
                        onSessionClick={onSessionClick}
                        onShowAll={() => onNavClick('/sessions')}
                      />
                    </DropdownMenu>
                  ) : (
                    <>
                      {isChatItem && !isCondensedIconOnly ? (
                        <div className="relative">
                          <motion.button
                            onClick={onToggleChatExpanded}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'flex flex-row items-center gap-2 outline-none',
                              'relative rounded-lg transition-colors duration-200 no-drag',
                              'w-full p-3',
                              active
                                ? 'bg-background-tertiary text-text-secondary'
                                : 'text-text-primary hover:text-text-secondary'
                            )}
                          >
                            <Icon className="size-4 flex-shrink-0" />
                            <span className="text-[13px] font-light text-left flex-1">
                              {item.label}
                            </span>
                            <div className="flex-shrink-0">
                              {isChatExpanded ? (
                                <ChevronDown className="w-3 h-3 text-text-secondary" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-text-secondary" />
                              )}
                            </div>
                          </motion.button>
                          {!isChatExpanded && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNewChat();
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                'absolute -right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-md z-10',
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                'bg-background-tertiary hover:bg-background-inverse hover:text-text-inverse',
                                'flex items-center justify-center'
                              )}
                              title={intl.formatMessage(i18n.newChat)}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => onNavClick(item.path)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'flex flex-row items-center gap-2',
                            'relative rounded-lg transition-colors duration-200 no-drag',
                            isCondensedIconOnly ? 'justify-center p-2.5' : 'w-full p-3',
                            active
                              ? 'bg-background-tertiary text-text-secondary'
                              : 'font-medium text-text-primary hover:text-text-secondary'
                          )}
                        >
                          <Icon className="size-4 flex-shrink-0" />
                          {!isCondensedIconOnly && (
                            <span className="text-[13px] font-light text-left flex-1">
                              {item.label}
                            </span>
                          )}
                          {!isCondensedIconOnly && item.getTag && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span
                                className={cn(
                                  'text-xs font-mono px-2 py-0.5 rounded-full',
                                  'bg-background-secondary text-text-secondary'
                                )}
                              >
                                {item.getTag()}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      )}
                    </>
                  )}
                  {isChatItem && !isCondensedIconOnly && (
                    <div
                      draggable={false}
                      className="no-drag"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        isSessionDragRef.current = true;
                      }}
                      onPointerUp={(e) => {
                        e.stopPropagation();
                        isSessionDragRef.current = false;
                      }}
                      onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <SessionsList
                        sessions={recentSessions}
                        activeSessionId={activeSessionId}
                        isExpanded={isChatExpanded}
                        getSessionStatus={getSessionStatus}
                        clearUnread={clearUnread}
                        onSessionClick={onSessionClick}
                        onSessionRenamed={onFetchSessions}
                        onSessionsReordered={onSessionsReordered}
                        onShowAll={() => onNavClick('/sessions')}
                        onNewChat={onNewChat}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          <div
            className={cn(
              'bg-app rounded-lg flex-1 min-h-[40px]',
              isCondensedIconOnly ? 'w-[40px]' : 'w-full'
            )}
          />
          <div
            className={cn('flex justify-center py-2 flex-shrink-0 bg-app rounded-lg', !isCondensedIconOnly && 'w-full')}
            onMouseEnter={() => window.dispatchEvent(new CustomEvent('goose:avatar-hover'))}
            onClick={() => window.dispatchEvent(new CustomEvent('goose:avatar-click'))}
            style={{ cursor: 'pointer' }}
          >
            <AgentMood mood={agentMood} isCondensed={isCondensedIconOnly} />
          </div>
        </div>
      ) : (
        /* Horizontal navigation items */
        visibleItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isDragging = drag.draggedItem === item.id;
          const isDragOver = drag.dragOverItem === item.id;
          const isChatItem = item.id === 'chat';

          return (
            <motion.div
              key={item.id}
              draggable
              onDragStart={(e) => drag.onDragStart(e as unknown as React.DragEvent, item.id)}
              onDragOver={(e) => drag.onDragOver(e as unknown as React.DragEvent, item.id)}
              onDrop={(e) => drag.onDrop(e as unknown as React.DragEvent, item.id)}
              onDragEnd={drag.onDragEnd}
              initial={{ opacity: 0 }}
              animate={{ opacity: isDragging ? 0.5 : 1 }}
              transition={{ duration: 0.15, delay: index * 0.02 }}
              className={cn(
                'relative cursor-move group flex-shrink-0',
                isDragOver && 'ring-2 ring-blue-500 rounded-lg',
                isChatItem && !isCondensedIconOnly && 'overflow-visible'
              )}
            >
              <div className="flex flex-col">
                {isChatItem ? (
                  <DropdownMenu open={chatPopoverOpen} onOpenChange={setChatPopoverOpen}>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'flex flex-row items-center justify-center gap-2',
                          'relative rounded-lg transition-colors duration-200 no-drag',
                          'px-3 py-2.5',
                          active
                            ? 'bg-background-tertiary text-text-secondary'
                            : 'font-medium text-text-primary hover:text-text-secondary'
                        )}
                      >
                        <Icon className="size-4 flex-shrink-0" />
                        <span className="text-[13px] font-light text-left hidden min-[1200px]:block">
                          {item.label}
                        </span>
                      </motion.button>
                    </DropdownMenuTrigger>
                    <ChatSessionsDropdown
                      sessions={recentSessions}
                      activeSessionId={activeSessionId}
                      side={isTopPosition ? 'bottom' : 'top'}
                      getSessionStatus={getSessionStatus}
                      clearUnread={clearUnread}
                      onNewChat={onNewChat}
                      onSessionClick={onSessionClick}
                      onShowAll={() => onNavClick('/sessions')}
                    />
                  </DropdownMenu>
                ) : (
                  <motion.button
                    onClick={() => onNavClick(item.path)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex flex-row items-center gap-2 px-3 py-2.5',
                      'relative rounded-lg transition-colors duration-200 no-drag',
                      active
                        ? 'bg-background-tertiary text-text-secondary'
                        : 'font-medium text-text-primary hover:text-text-secondary'
                    )}
                  >
                    <Icon className="size-4 flex-shrink-0" />
                    <span className="text-[13px] font-light text-left hidden min-[1200px]:block">
                      {item.label}
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })
      )}

      {/* Right spacer (horizontal only) */}
      {!isVertical && (
        <div
          className="bg-app rounded-lg self-stretch flex-1 min-w-[40px]"
          style={
            !isOverlayMode && isTopPosition
              ? ({ WebkitAppRegion: 'drag' } as React.CSSProperties)
              : undefined
          }
        />
      )}
    </motion.div>
  );
};
