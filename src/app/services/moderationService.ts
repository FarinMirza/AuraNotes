// Comprehensive bad word list (simplified for production)
const BAD_WORDS = [
  'spam', 'scam', 'porn', 'xxx', 'drugs', 'kill', 'die', 'hate',
  'stupid', 'idiot', 'dumb', 'ass', 'hell', 'damn', 'crap',
  'fuck', 'shit', 'bitch', 'bastard', 'piss', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'fag', 'nigger', 'retard'
];

// Create regex pattern for bad words (case-insensitive, word boundaries)
const badWordPattern = new RegExp(
  BAD_WORDS.map(word => `\\b${word}\\b`).join('|'),
  'gi'
);

export function filterBadWords(text: string): string {
  return text.replace(badWordPattern, (match) => {
    return '*'.repeat(match.length);
  });
}

export function containsBadWords(text: string): boolean {
  return badWordPattern.test(text);
}

export function detectSpam(content: string, recentNotes: string[]): boolean {
  const normalized = content.toLowerCase().trim();
  
  // Check for duplicate content
  const duplicateCount = recentNotes.filter(
    note => note.toLowerCase().trim() === normalized
  ).length;
  
  if (duplicateCount >= 2) {
    return true;
  }

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 10 && capsRatio > 0.7) {
    return true;
  }

  // Check for excessive repeated characters
  if (/(.)\1{4,}/.test(content)) {
    return true;
  }

  // Check for excessive emojis
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > content.length / 2 && content.length > 5) {
    return true;
  }

  return false;
}

export function validateContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Note cannot be empty' };
  }

  if (content.length < 3) {
    return { valid: false, error: 'Note must be at least 3 characters' };
  }

  if (content.length > 500) {
    return { valid: false, error: 'Note must be less than 500 characters' };
  }

  return { valid: true };
}
