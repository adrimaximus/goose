import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scold,
  Hearts,
  DirectHit,
  Exclamation,
  Smirking,
  StarEye,
  Gratitude,
  Anxious,
  ConfettiBall,
  Wave,
} from 'lottie-emojis';

export type MoodType =
  | 'neutral'
  | 'thinking'
  | 'happy'
  | 'sad'
  | 'error'
  | 'success'
  | 'party'
  | 'cool'
  | 'wink'
  | 'surprise'
  | 'sleeping'
  | 'confused'
  | 'fearful'
  | 'rocket'
  | 'thumbs-up'
  | 'mind-blown'
  | 'fire'
  | 'salute'
  | 'peaking'
  | 'side-eye'
  | 'annoyed'
  | 'love'
  | 'determined'
  | 'alert'
  | 'smirking'
  | 'proud'
  | 'grateful'
  | 'nervous'
  | 'celebrating'
  | 'greeting';

interface AgentMoodProps {
  mood?: MoodType;
  size?: number;
  isCondensed?: boolean;
}

import neutralJson from '../assets/lottie/neutral.json';
import thinkingJson from '../assets/lottie/thinking.json';
import happyJson from '../assets/lottie/happy.json';
import sadJson from '../assets/lottie/sad.json';
import errorJson from '../assets/lottie/error.json';
import successJson from '../assets/lottie/success.json';
import partyJson from '../assets/lottie/party.json';
import coolJson from '../assets/lottie/cool.json';
import winkJson from '../assets/lottie/wink.json';
import surpriseJson from '../assets/lottie/surprise.json';
import sleepingJson from '../assets/lottie/sleeping.json';
import confusedJson from '../assets/lottie/confused.json';
import fearfulJson from '../assets/lottie/fearful.json';
import rocketJson from '../assets/lottie/rocket.json';
import thumbsUpJson from '../assets/lottie/thumbs-up.json';
import mindBlownJson from '../assets/lottie/mind-blown.json';
import fireJson from '../assets/lottie/fire.json';
import saluteJson from '../assets/lottie/salute.json';
import peakingJson from '../assets/lottie/peaking.json';
import sideEyeJson from '../assets/lottie/side-eye.json';

const MOOD_DATA: Record<MoodType, unknown> = {
  neutral: neutralJson,
  thinking: thinkingJson,
  happy: happyJson,
  sad: sadJson,
  error: errorJson,
  success: successJson,
  party: partyJson,
  cool: coolJson,
  wink: winkJson,
  surprise: surpriseJson,
  sleeping: sleepingJson,
  confused: confusedJson,
  fearful: fearfulJson,
  rocket: rocketJson,
  'thumbs-up': thumbsUpJson,
  'mind-blown': mindBlownJson,
  fire: fireJson,
  salute: saluteJson,
  peaking: peakingJson,
  'side-eye': sideEyeJson,
  annoyed: Scold,
  love: Hearts,
  determined: DirectHit,
  alert: Exclamation,
  smirking: Smirking,
  proud: StarEye,
  grateful: Gratitude,
  nervous: Anxious,
  celebrating: ConfettiBall,
  greeting: Wave,
};

export function AgentMood({ mood = 'neutral', size = 48, isCondensed = false }: AgentMoodProps) {
  const displaySize = isCondensed ? 36 : size;

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: displaySize, height: displaySize }}
      animate={{
        opacity: mood === 'neutral' ? [1, 0.85, 1] : 1,
      }}
      transition={{
        duration: 3,
        repeat: mood === 'neutral' ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{
            opacity: { type: 'tween', duration: 0.15 },
            scale: { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 },
          }}
          style={{ width: displaySize, height: displaySize }}
        >
          <Lottie
            animationData={MOOD_DATA[mood]}
            autoplay
            loop
            style={{
              width: displaySize,
              height: displaySize,
            }}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
