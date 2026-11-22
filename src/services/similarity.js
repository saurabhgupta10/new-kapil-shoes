import crypto from 'crypto';

/**
 * Normalizes text for comparison:
 * - lowercase
 * - remove punctuation, symbols, and extra spaces
 * - trims whitespace
 */
export function normalizeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Support Latin & Devanagari Unicode letters/numbers
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes SHA-256 hash of normalized text
 */
export function hashText(text = '') {
  const normalized = normalizeText(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshteinDistance(s1 = '', s2 = '') {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows instead of full matrix for memory efficiency
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const char1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = char1 === s2.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // insertion
        prevRow[j] + 1,          // deletion
        prevRow[j - 1] + cost    // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

/**
 * Calculates normalized Levenshtein similarity score between 0.0 and 1.0
 */
export function levenshteinSimilarity(s1 = '', s2 = '') {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(norm1, norm2);
  return 1 - distance / maxLen;
}

/**
 * Extract word tokens from normalized text
 */
export function getTokens(text = '') {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

/**
 * Calculates Jaccard similarity of word tokens between two strings (0.0 to 1.0)
 */
export function jaccardSimilarity(s1 = '', s2 = '') {
  const tokens1 = new Set(getTokens(s1));
  const tokens2 = new Set(getTokens(s2));

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokens1.size + tokens2.size - intersectionCount;
  return unionCount === 0 ? 0.0 : intersectionCount / unionCount;
}

/**
 * Checks if a candidate text is an exact or near duplicate of any text in existingTexts.
 *
 * @param {string} candidate - The newly proposed suggestion
 * @param {Array<string>} existingTexts - Array of recent or session suggestions
 * @param {Object} options - Threshold options
 * @returns {Object} { isDuplicate: boolean, reason: string|null, score: number, matchedWith: string|null }
 */
export function isNearDuplicate(candidate, existingTexts = [], options = {}) {
  const {
    levenshteinThreshold = 0.70,
    jaccardThreshold = 0.60,
  } = options;

  if (!candidate || typeof candidate !== 'string') {
    return { isDuplicate: true, reason: 'empty_text', score: 1.0, matchedWith: null };
  }

  const normCandidate = normalizeText(candidate);
  if (!normCandidate) {
    return { isDuplicate: true, reason: 'empty_text', score: 1.0, matchedWith: null };
  }

  for (const existing of existingTexts) {
    if (!existing || typeof existing !== 'string') continue;

    const normExisting = normalizeText(existing);

    // 1. Exact match
    if (normCandidate === normExisting) {
      return {
        isDuplicate: true,
        reason: 'exact_match',
        score: 1.0,
        matchedWith: existing,
      };
    }

    // 2. Jaccard word token similarity (fast filter)
    const jaccard = jaccardSimilarity(candidate, existing);
    if (jaccard >= jaccardThreshold) {
      return {
        isDuplicate: true,
        reason: 'high_token_overlap',
        score: jaccard,
        matchedWith: existing,
      };
    }

    // 3. Levenshtein edit distance similarity
    const lev = levenshteinSimilarity(candidate, existing);
    if (lev >= levenshteinThreshold) {
      return {
        isDuplicate: true,
        reason: 'high_edit_similarity',
        score: lev,
        matchedWith: existing,
      };
    }
  }

  return {
    isDuplicate: false,
    reason: null,
    score: 0.0,
    matchedWith: null,
  };
}
