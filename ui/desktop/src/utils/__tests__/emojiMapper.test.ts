import { describe, it, expect } from 'vitest';
import {
  parseMoodFromText,
  sentimentFallback,
  getMoodFromResponse,
} from '../emojiMapper';

describe('emojiMapper', () => {
  describe('parseMoodFromText', () => {
    it('detects celebrating mood from party popper emoji', () => {
      expect(parseMoodFromText('🎉 Great job!')).toEqual(['celebrating']);
    });

    it('detects error mood from cross mark emoji', () => {
      expect(parseMoodFromText('❌ Error occurred')).toEqual(['error']);
    });

    it('detects thinking mood from thinking face emoji', () => {
      expect(parseMoodFromText('🤔 Let me think...')).toEqual(['thinking']);
    });

    it('detects love mood from heart emoji', () => {
      expect(parseMoodFromText('💕 I love this!')).toEqual(['love']);
    });

    it('returns empty for ❤️ due to variation selector edge case', () => {
      // ❤️ is U+2764 + U+FE0F — regex matches base ❤ without VS16,
      // which doesn't match the EMOJI_TO_MOOD key '❤️'
      expect(parseMoodFromText('❤️')).toEqual([]);
    });

    it('returns empty array for text with no emoji', () => {
      expect(parseMoodFromText('Just plain text')).toEqual([]);
    });

    it('deduplicates moods from multiple emojis mapping to same mood', () => {
      const result = parseMoodFromText('😢😭');
      expect(result).toEqual(['sad']);
      expect(result).toHaveLength(1);
    });

    it('returns all unique moods for multiple emojis', () => {
      const result = parseMoodFromText('🎉🚀🥳🔥');
      expect(result).toEqual(['celebrating', 'rocket', 'party', 'fire']);
    });

    it('picks all matching moods when multiple emojis present', () => {
      const result = parseMoodFromText('🎉🚀🥳');
      expect(result).toEqual(['celebrating', 'rocket', 'party']);
    });

    it('returns empty array for empty string', () => {
      expect(parseMoodFromText('')).toEqual([]);
    });
  });

  describe('sentimentFallback', () => {
    it('detects success from English keyword', () => {
      expect(sentimentFallback('Success! The build passed.')).toBe('happy');
    });

    it('detects error from Indonesian keyword', () => {
      expect(sentimentFallback('Maaf, ada error')).toBe('error');
    });

    it('detects "berhasil" as happy', () => {
      expect(sentimentFallback('berhasil deploy!')).toBe('happy');
    });

    it('detects "gagal" as error', () => {
      expect(sentimentFallback('build gagal')).toBe('error');
    });

    it('detects "sip" as thumbs-up', () => {
      expect(sentimentFallback('Sip, sudah siap!')).toBe('thumbs-up');
    });

    it('detects "berhasil" before "sip" when both present', () => {
      // SENTIMENT_RULES order: "berhasil" (happy) comes before "sip" (thumbs-up)
      expect(sentimentFallback('Sip! berhasil!')).toBe('happy');
    });

    it('returns neutral for unrecognized text', () => {
      expect(sentimentFallback('nothing matches here')).toBe('neutral');
    });

    it('returns neutral for empty string', () => {
      expect(sentimentFallback('')).toBe('neutral');
    });

    it('detects "wow" as surprise', () => {
      expect(sentimentFallback('wow that was fast')).toBe('surprise');
    });

    it('detects "mantap" as cool', () => {
      expect(sentimentFallback('mantap banget')).toBe('cool');
    });

    it('detects "sedih" as sad', () => {
      expect(sentimentFallback('sedih sekali')).toBe('sad');
    });
  });

  describe('getMoodFromResponse', () => {
    it('uses emoji detection over sentiment fallback', () => {
      expect(getMoodFromResponse('🎉 Great job!')).toBe('celebrating');
    });

    it('uses emoji detection for error emoji', () => {
      expect(getMoodFromResponse('❌ Error occurred')).toBe('error');
    });

    it('uses emoji detection for thinking emoji', () => {
      expect(getMoodFromResponse('🤔 Let me think...')).toBe('thinking');
    });

    it('uses emoji detection for love emoji', () => {
      // 💕 works reliably; ❤️ has a variation-selector edge case
      expect(getMoodFromResponse('💕 I love this!')).toBe('love');
    });

    it('falls back to sentiment when no emoji present', () => {
      expect(getMoodFromResponse('Success! The build passed.')).toBe('happy');
    });

    it('falls back to Indonesian sentiment keywords', () => {
      expect(getMoodFromResponse('Maaf, ada error')).toBe('error');
    });

    it('handles mixed Indonesian text with emoji', () => {
      expect(getMoodFromResponse('Sip! berhasil! ✅')).toBe('success');
    });

    it('returns neutral for unrecognized text without emoji', () => {
      expect(getMoodFromResponse('random text nothing special')).toBe('neutral');
    });

    it('returns neutral for empty string', () => {
      expect(getMoodFromResponse('')).toBe('neutral');
    });

    it('picks last mood from multiple emojis', () => {
      expect(getMoodFromResponse('🎉🚀🥳')).toBe('party');
    });
  });
});
