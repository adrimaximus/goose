import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { AppEvents } from '../constants/events';
import type { MoodType } from '../components/AgentMood';
import { getMoodFromResponse, getMoodForToolCall } from '../utils/emojiMapper';

type PriorityTier = 'error' | 'thinking' | 'peaking' | 'idle' | 'neutral';

const IDLE_FUN_MOODS: MoodType[] = [
  'wink', 'cool', 'side-eye', 'sleeping', 'surprise',
  'happy', 'smirking', 'thumbs-up', 'mind-blown', 'salute',
  'greeting', 'celebrating', 'proud', 'grateful', 'love',
  'fire', 'rocket', 'determined',
];
const IDLE_THRESHOLD_MS = 10_000;
const IDLE_ROTATE_MIN_MS = 8_000;
const IDLE_ROTATE_MAX_MS = 20_000;
const FUN_MOOD_DURATION_MS = 3_000;
const SLEEPING_DURATION_MS = 8_000;
const PEAKING_DURATION_MS = 2_000;

function getTier(m: MoodType): PriorityTier {
  if (m === 'error') return 'error';
  if (m === 'thinking') return 'thinking';
  if (m === 'peaking') return 'peaking';
  if (m === 'neutral') return 'neutral';
  return 'idle';
}

function tierPreventsOverride(tier: PriorityTier): boolean {
  return tier === 'error' || tier === 'thinking';
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomFunMood(): MoodType {
  return IDLE_FUN_MOODS[Math.floor(Math.random() * IDLE_FUN_MOODS.length)];
}

interface AgentMoodContextType {
  mood: MoodType;
}

const AgentMoodContext = createContext<AgentMoodContextType>({ mood: 'neutral' });

export function AgentMoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMood] = useState<MoodType>('neutral');

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleThresholdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRotateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const funMoodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moodRef = useRef<MoodType>(mood);
  moodRef.current = mood;

  const scheduleIdleRotationRef = useRef<() => void>(() => {});

  const clearTimer = useCallback(
    (ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    },
    [],
  );

  const clearIdleTimers = useCallback(() => {
    clearTimer(idleThresholdRef);
    clearTimer(idleRotateRef);
    clearTimer(funMoodTimerRef);
  }, [clearTimer]);

  const scheduleIdleThreshold = useCallback(() => {
    clearIdleTimers();
    idleThresholdRef.current = setTimeout(() => {
      scheduleIdleRotationRef.current();
    }, IDLE_THRESHOLD_MS);
  }, [clearIdleTimers]);

  const scheduleIdleRotation = useCallback(() => {
    const nextDelay = randomBetween(IDLE_ROTATE_MIN_MS, IDLE_ROTATE_MAX_MS);
    idleRotateRef.current = setTimeout(() => {
      const funMood = pickRandomFunMood();
      setMood(funMood);
      const duration = funMood === 'sleeping' ? SLEEPING_DURATION_MS : FUN_MOOD_DURATION_MS;
      funMoodTimerRef.current = setTimeout(() => {
        setMood('neutral');
        scheduleIdleRotationRef.current();
      }, duration);
    }, nextDelay);
  }, []);

  scheduleIdleRotationRef.current = scheduleIdleRotation;

  const resetIdleTimer = useCallback(() => {
    scheduleIdleThreshold();
  }, [scheduleIdleThreshold]);

  useEffect(() => {
    const handleStatusUpdate = (event: Event) => {
      const { streamState } = (event as CustomEvent).detail;

      clearTimer(successTimerRef);
      clearTimer(peakingTimerRef);

      switch (streamState) {
        case 'streaming':
        case 'loading':
          clearIdleTimers();
          setMood('thinking');
          break;
        case 'error':
          clearIdleTimers();
          setMood('error');
          break;
        case 'idle':
          setMood('neutral');
          resetIdleTimer();
          break;
      }
    };

    window.addEventListener(AppEvents.SESSION_STATUS_UPDATE, handleStatusUpdate);
    return () => window.removeEventListener(AppEvents.SESSION_STATUS_UPDATE, handleStatusUpdate);
  }, [clearTimer, clearIdleTimers, resetIdleTimer]);

  useEffect(() => {
    const handleStreamFinish = () => {
      clearIdleTimers();
      clearTimer(peakingTimerRef);
      setMood('happy');
      successTimerRef.current = setTimeout(() => {
        setMood('neutral');
        successTimerRef.current = null;
        resetIdleTimer();
      }, 3000);
    };

    window.addEventListener(AppEvents.MESSAGE_STREAM_FINISHED, handleStreamFinish);
    return () => window.removeEventListener(AppEvents.MESSAGE_STREAM_FINISHED, handleStreamFinish);
  }, [clearIdleTimers, clearTimer, resetIdleTimer]);

  useEffect(() => {
    const handleMessageContent = (event: Event) => {
      const { text } = (event as CustomEvent).detail;
      if (!text) return;

      const detectedMood = getMoodFromResponse(text);
      if (!detectedMood || detectedMood === 'neutral') return;

      const currentTier = getTier(moodRef.current);
      if (currentTier === 'error') return;

      clearIdleTimers();
      clearTimer(peakingTimerRef);
      clearTimer(successTimerRef);

      setMood(detectedMood);

      successTimerRef.current = setTimeout(() => {
        setMood('neutral');
        successTimerRef.current = null;
        resetIdleTimer();
      }, 3000);
    };

    window.addEventListener(AppEvents.MESSAGE_CONTENT, handleMessageContent);
    return () => window.removeEventListener(AppEvents.MESSAGE_CONTENT, handleMessageContent);
  }, [clearIdleTimers, clearTimer, resetIdleTimer]);

  // Tool call started → context-based mood
  useEffect(() => {
    const handler = (event: Event) => {
      const { toolName } = (event as CustomEvent).detail;
      const mood = getMoodForToolCall(toolName);
      const currentTier = getTier(moodRef.current);
      if (!tierPreventsOverride(currentTier) || currentTier === 'thinking') {
        setMood(mood);
        clearIdleTimers();
      }
    };
    window.addEventListener(AppEvents.TOOL_CALL_STARTED, handler);
    return () => window.removeEventListener(AppEvents.TOOL_CALL_STARTED, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tool call completed → success/error mood
  useEffect(() => {
    const handler = (event: Event) => {
      const { status } = (event as CustomEvent).detail;
      clearIdleTimers();
      if (status === 'error') {
        setMood('confused');
        successTimerRef.current = setTimeout(() => {
          setMood('neutral');
          successTimerRef.current = null;
          resetIdleTimer();
        }, 3000);
      } else {
        setMood('success');
        successTimerRef.current = setTimeout(() => {
          setMood('neutral');
          successTimerRef.current = null;
          resetIdleTimer();
        }, 2000);
      }
    };
    window.addEventListener(AppEvents.TOOL_CALL_COMPLETED, handler);
    return () => window.removeEventListener(AppEvents.TOOL_CALL_COMPLETED, handler);
  }, [clearIdleTimers, resetIdleTimer]);

  // Avatar hover → wink
  useEffect(() => {
    const handler = () => {
      const currentTier = getTier(moodRef.current);
      if (!tierPreventsOverride(currentTier)) {
        setMood('wink');
        successTimerRef.current = setTimeout(() => {
          setMood('neutral');
          successTimerRef.current = null;
          resetIdleTimer();
        }, 1500);
      }
    };
    window.addEventListener(AppEvents.AVATAR_HOVER, handler);
    return () => window.removeEventListener(AppEvents.AVATAR_HOVER, handler);
  }, [resetIdleTimer]);

  // Avatar click → greeting
  useEffect(() => {
    const handler = () => {
      const currentTier = getTier(moodRef.current);
      if (!tierPreventsOverride(currentTier)) {
        setMood('greeting');
        successTimerRef.current = setTimeout(() => {
          setMood('neutral');
          successTimerRef.current = null;
          resetIdleTimer();
        }, 2500);
      }
    };
    window.addEventListener(AppEvents.AVATAR_CLICK, handler);
    return () => window.removeEventListener(AppEvents.AVATAR_CLICK, handler);
  }, [resetIdleTimer]);

  // Chat scroll → side-eye (curious)
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const currentTier = getTier(moodRef.current);
        if (!tierPreventsOverride(currentTier)) {
          setMood('side-eye');
          successTimerRef.current = setTimeout(() => {
            setMood('neutral');
            successTimerRef.current = null;
            resetIdleTimer();
          }, 2000);
        }
      }, 500);
    };
    window.addEventListener(AppEvents.CHAT_SCROLLED, handler);
    return () => {
      window.removeEventListener(AppEvents.CHAT_SCROLLED, handler);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isChatInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[data-chat-input]') !== null;

      if (!isChatInput) return;

      const currentTier = getTier(moodRef.current);
      if (tierPreventsOverride(currentTier)) return;

      clearTimer(peakingTimerRef);
      clearIdleTimers();
      setMood('peaking');

      peakingTimerRef.current = setTimeout(() => {
        setMood('neutral');
        peakingTimerRef.current = null;
        resetIdleTimer();
      }, PEAKING_DURATION_MS);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearIdleTimers, clearTimer, resetIdleTimer]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      clearTimer(successTimerRef);
      clearTimer(idleThresholdRef);
      clearTimer(idleRotateRef);
      clearTimer(funMoodTimerRef);
      clearTimer(peakingTimerRef);
    };
  }, [clearTimer, resetIdleTimer]);

  return <AgentMoodContext.Provider value={{ mood }}>{children}</AgentMoodContext.Provider>;
}

export function useAgentMood(): MoodType {
  return useContext(AgentMoodContext).mood;
}
