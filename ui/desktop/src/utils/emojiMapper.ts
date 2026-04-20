/**
 * emojiMapper.ts
 *
 * Maps emojis found in AI text responses to MoodType expressions.
 * Used by AgentMoodContext to auto-change avatar mood based on emoji in AI messages.
 */

import type { MoodType } from '../components/AgentMood';

// ---------------------------------------------------------------------------
// Emoji → Mood lookup table (60+ emojis)
// ---------------------------------------------------------------------------
export const EMOJI_TO_MOOD: Record<string, MoodType> = {
  // Happy / positive
  '😀': 'happy',
  '😃': 'happy',
  '😄': 'happy',
  '😁': 'happy',
  '😊': 'happy',
  '🙂': 'happy',
  '😇': 'happy',
  '🥰': 'happy',
  '😍': 'happy',

  // Success / done
  '✅': 'success',
  '✔️': 'success',
  '☑️': 'success',
  '💯': 'success',

  // Party
  '🎊': 'party',
  '🍾': 'party',
  '🥳': 'party',
  '🪅': 'party',

  // Thumbs up
  '👍': 'thumbs-up',
  '👌': 'thumbs-up',
  '🙌': 'thumbs-up',
  '👏': 'thumbs-up',

  // Cool / swagger
  '😎': 'cool',
  '🕶️': 'cool',
  '💅': 'cool',

  // Wink
  '😉': 'wink',
  '😜': 'wink',
  '😝': 'wink',

  // Thinking
  '🤔': 'thinking',
  '💭': 'thinking',
  '🧐': 'thinking',

  // Sad
  '😢': 'sad',
  '😭': 'sad',
  '😞': 'sad',
  '😔': 'sad',
  '💔': 'sad',
  '😥': 'sad',

  // Error / negative
  '❌': 'error',
  '🚫': 'error',
  '⛔': 'error',
  '‼️': 'error',

  // Surprise
  '😮': 'surprise',
  '😯': 'surprise',
  '😲': 'surprise',
  '🫢': 'surprise',
  '🫣': 'surprise',

  // Mind blown
  '🤯': 'mind-blown',

  // Fire
  '🔥': 'fire',
  '☄️': 'fire',

  // Rocket
  '🚀': 'rocket',

  // Sleeping
  '😴': 'sleeping',
  '💤': 'sleeping',
  '🥱': 'sleeping',

  // Confused
  '😕': 'confused',
  '😵': 'confused',
  '🫠': 'confused',
  '🌀': 'confused',

  // Fearful
  '😱': 'fearful',
  '😨': 'fearful',
  '🥺': 'fearful',

  // Salute
  '🫡': 'salute',
  '🎖️': 'salute',

  // Peaking
  '👀': 'peaking',
  '👁️': 'peaking',

  // Side-eye
  '😤': 'side-eye',
  '🙄': 'side-eye',
  '😒': 'side-eye',
  '😬': 'side-eye',

  // Annoyed
  '😠': 'annoyed',
  '😡': 'annoyed',
  '🤬': 'annoyed',

  // Love
  '❤️': 'love',
  '💕': 'love',
  '💗': 'love',
  '💖': 'love',
  '💘': 'love',

  // Determined
  '💪': 'determined',
  '🏋️': 'determined',
  '🎯': 'determined',

  // Alert
  '🚨': 'alert',
  '📢': 'alert',
  '⚠️': 'alert',

  // Smirking
  '😏': 'smirking',
  '🤭': 'smirking',

  // Proud
  '🏅': 'proud',
  '🏆': 'proud',
  '⭐': 'proud',
  '🌟': 'proud',

  // Grateful
  '🙏': 'grateful',
  '🤝': 'grateful',

  // Nervous
  '😰': 'nervous',
  '😅': 'nervous',
  '😓': 'nervous',

  // Celebrating
  '🎉': 'celebrating',
  '🥂': 'celebrating',

  // Greeting
  '👋': 'greeting',
  '🤗': 'greeting',
};

// ---------------------------------------------------------------------------
// Regex for detecting emoji characters in a string
// ---------------------------------------------------------------------------
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;

// ---------------------------------------------------------------------------
// parseMoodFromText
// ---------------------------------------------------------------------------
/**
 * Extracts all moods from text via emoji detection.
 * Deduplicates and returns at most 3 unique MoodType values.
 */
export function parseMoodFromText(text: string): MoodType[] {
  const matches = text.match(EMOJI_REGEX) ?? [];
  const seen = new Set<MoodType>();
  const result: MoodType[] = [];

  for (const emoji of matches) {
    const mood = EMOJI_TO_MOOD[emoji];
    if (mood && !seen.has(mood)) {
      seen.add(mood);
      result.push(mood);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// sentimentFallback — Indonesian + English keyword detection
// ---------------------------------------------------------------------------
const SENTIMENT_RULES: Array<{ pattern: RegExp; mood: MoodType }> = [
  // Error / failure
  { pattern: /\b(error|gagal|failed|failure|gabisa|ga bisa|tidak bisa|errornya|fail|broken|crash)\b/i, mood: 'error' },

  // Sad
  { pattern: /\b(sedih|susah|depresi|sad|unfortunate|sayang)\b/i, mood: 'sad' },

  // Success / happy
  { pattern: /\b(berhasil|sukses|success|done|selesai|completed|beres|fix|fixed|resolved|aman|solved)\b/i, mood: 'happy' },

  // Party / celebration
  { pattern: /\b(selamat|congrats|congratulations|yeay|hore)\b/i, mood: 'party' },

  // Cool / awesome
  { pattern: /\b(mantap|keren|mantab|awesome|great|excellent|hebat|luar biasa|amazing)\b/i, mood: 'cool' },

  // Fire
  { pattern: /\b(lit|panas|on fire)\b/i, mood: 'fire' },

  // Rocket / speed
  { pattern: /\b(cepat|launch|deployed|deployed|released|go live)\b/i, mood: 'rocket' },

  // Thinking / investigating
  { pattern: /\b(coba|check|cek|investigate|mari kita|let's see|hm|hmm|hmmm|kayaknya|mungkin|sepertinya|sepertinya|probably|seems like|looks like)\b/i, mood: 'thinking' },

  // Surprise
  { pattern: /\b(wah|wow|gila|serius|seriously|astaga|omg|oh my)\b/i, mood: 'surprise' },

  // Mind blown
  { pattern: /\b(mind.?blown|luar biasa|nggak nyangka|tidak terduga|unbelievable|incredible)\b/i, mood: 'mind-blown' },

  // Thumbs up / approval
  { pattern: /\b(setuju|oke|okeh|ok|approved|approved|sip|siap|betul|benar|yup|yes|yep)\b/i, mood: 'thumbs-up' },

  // Salute
  { pattern: /\b(salam|hormat|respect| salute)\b/i, mood: 'salute' },

  // Sleeping / boring
  { pattern: /\b(tidur|ngantuk|sleepy|boring|bosan|lelah|capek)\b/i, mood: 'sleeping' },

  // Confused
  { pattern: /\b(bingung|confused|aneh|weird|tidak ngerti|gak ngerti|what\?|apa\?)\b/i, mood: 'confused' },

  // Fearful / worried
  { pattern: /\b(takut|khawatir|worry|worried|scared|bahaya|danger|risk)\b/i, mood: 'fearful' },

  // Side-eye / annoyed
  { pattern: /\b(annoyed|sebel|kesel|gerah|btw|Seriously\?|wtf)\b/i, mood: 'side-eye' },

  // Peaking / curious
  { pattern: /\b(penasaran|curious|lihat|cekidot)\b/i, mood: 'peaking' },

  // Wink
  { pattern: /\b(btw|just kidding|jk|just so you know)\b/i, mood: 'wink' },
];

/**
 * Detects mood from Indonesian AND English keywords in the text.
 * Returns the first matching mood, or 'neutral' if nothing matches.
 */
export function sentimentFallback(text: string): MoodType {
  for (const { pattern, mood } of SENTIMENT_RULES) {
    if (pattern.test(text)) return mood;
  }
  return 'neutral';
}

// ---------------------------------------------------------------------------
// getMoodFromResponse
// ---------------------------------------------------------------------------
/**
 * Determines the mood for a given AI response text.
 * Tries emoji detection first, then falls back to sentiment keywords.
 * Returns 'neutral' if nothing matches.
 */
export function getMoodFromResponse(text: string): MoodType {
  // 1. Try emoji-based detection — use LAST emoji (most recent context)
  const moods = parseMoodFromText(text);
  if (moods.length > 0) return moods[moods.length - 1];

  // 2. Fallback to keyword / sentiment analysis
  return sentimentFallback(text);
}

// ---------------------------------------------------------------------------
// getMoodForToolCall — mood detection based on tool name
// ---------------------------------------------------------------------------
const TOOL_MOOD_MAP: Record<string, MoodType> = {
  shell: 'determined',
  text_editor: 'thinking',
  str_replace: 'determined',
  search: 'peaking',
  web_scrape: 'peaking',
  browser: 'peaking',
  delegate: 'thinking',
  computer_control: 'determined',
  execute_typescript: 'determined',
};

export function getMoodForToolCall(toolName: string): MoodType {
  const shortName = toolName.split('__').pop() ?? toolName;
  for (const [key, mood] of Object.entries(TOOL_MOOD_MAP)) {
    if (shortName.toLowerCase().includes(key)) {
      return mood;
    }
  }
  return 'thinking';
}
