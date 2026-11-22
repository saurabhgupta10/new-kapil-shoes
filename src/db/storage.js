import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { hashText, normalizeText } from '../services/similarity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_DATA = {
  scans: [],
  feedbacks: [],
  generations: [],
  copies: [],
  googleClicks: [],
  instagramClicks: [],
  recentReviewHashes: {}, // hash -> { text, timestamp, rating, language }
};

class Storage {
  constructor() {
    this.data = { ...INITIAL_DATA };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...INITIAL_DATA, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[Storage] Error initializing database file:', err);
      this.data = { ...INITIAL_DATA };
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[Storage] Error saving database file:', err);
    }
  }

  // 1. QR Scans
  recordScan({ storeId = 'new-kapil-shoes', userAgent = '', ip = '', referrer = '' } = {}) {
    const record = {
      id: uuidv4(),
      storeId,
      timestamp: new Date().toISOString(),
      userAgent,
      ip,
      referrer,
    };
    this.data.scans.push(record);
    this.save();
    return record;
  }

  // 2. Feedback Submissions
  recordFeedback({
    storeId = 'new-kapil-shoes',
    rating = 5,
    feedbackOptions = [],
    customComment = '',
    language = 'en',
    sessionId = '',
  } = {}) {
    const record = {
      id: uuidv4(),
      storeId,
      timestamp: new Date().toISOString(),
      rating: Number(rating) || 5,
      feedbackOptions: Array.isArray(feedbackOptions) ? feedbackOptions : [],
      customComment: String(customComment || '').trim(),
      language: ['en', 'hi', 'hinglish'].includes(language) ? language : 'en',
      sessionId: sessionId || uuidv4(),
    };
    this.data.feedbacks.push(record);
    this.save();
    return record;
  }

  // 3. AI Suggestions Generated
  recordGenerations({
    feedbackId = '',
    storeId = 'new-kapil-shoes',
    rating = 5,
    language = 'en',
    suggestions = [],
    sessionId = '',
    engine = 'algorithmic',
  } = {}) {
    const timestamp = new Date().toISOString();
    const processedSuggestions = suggestions.map((s, idx) => {
      const text = typeof s === 'string' ? s : s.text;
      const style = s.style || `Style ${idx + 1}`;
      const hash = hashText(text);

      // Store in global recentReviewHashes index (keep last 2000)
      this.data.recentReviewHashes[hash] = {
        text,
        normalized: normalizeText(text),
        timestamp,
        rating,
        language,
        style,
      };

      return {
        id: s.id || `sug-${uuidv4().slice(0, 8)}`,
        text,
        style,
        hash,
      };
    });

    const record = {
      id: uuidv4(),
      feedbackId,
      storeId,
      sessionId,
      timestamp,
      rating,
      language,
      engine,
      suggestions: processedSuggestions,
    };

    this.data.generations.push(record);

    // Prune recentReviewHashes if too large
    const hashKeys = Object.keys(this.data.recentReviewHashes);
    if (hashKeys.length > 2000) {
      const excess = hashKeys.length - 2000;
      for (let i = 0; i < excess; i++) {
        delete this.data.recentReviewHashes[hashKeys[i]];
      }
    }

    this.save();
    return record;
  }

  // 4. Copied Review
  recordCopy({ feedbackId = '', suggestionId = '', text = '', sessionId = '' } = {}) {
    const record = {
      id: uuidv4(),
      feedbackId,
      suggestionId,
      text: String(text || '').trim(),
      sessionId,
      timestamp: new Date().toISOString(),
    };
    this.data.copies.push(record);
    this.save();
    return record;
  }

  // 5. Google Review Link Click
  recordGoogleClick({ feedbackId = '', sessionId = '', rating = null } = {}) {
    const record = {
      id: uuidv4(),
      feedbackId,
      sessionId,
      rating,
      timestamp: new Date().toISOString(),
    };
    this.data.googleClicks.push(record);
    this.save();
    return record;
  }

  // 6. Instagram Follow Click
  recordInstagramClick({ sessionId = '', source = 'thank_you_page' } = {}) {
    const record = {
      id: uuidv4(),
      sessionId,
      source,
      timestamp: new Date().toISOString(),
    };
    this.data.instagramClicks.push(record);
    this.save();
    return record;
  }

  // 7. Get Recent Review Texts for Duplicate Prevention
  getRecentReviews(limit = 100) {
    const recent = [];
    const values = Object.values(this.data.recentReviewHashes || {});
    // sort descending by timestamp
    values.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    for (let i = 0; i < Math.min(limit, values.length); i++) {
      recent.push(values[i].text);
    }
    return recent;
  }

  // 8. Aggregated Dashboard Analytics
  getAnalytics(storeId = 'new-kapil-shoes') {
    const feedbacks = this.data.feedbacks.filter(f => !storeId || f.storeId === storeId);
    const scans = this.data.scans.filter(s => !storeId || s.storeId === storeId);
    const totalScans = scans.length;
    const totalFeedbacks = feedbacks.length;

    // Rating stats
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    feedbacks.forEach(f => {
      const r = Math.min(5, Math.max(1, Math.round(f.rating || 5)));
      ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
      ratingSum += r;
    });

    const averageRating = totalFeedbacks > 0 ? (ratingSum / totalFeedbacks).toFixed(1) : '0.0';

    // Option frequency breakdown
    const optionCounts = {};
    feedbacks.forEach(f => {
      (f.feedbackOptions || []).forEach(opt => {
        optionCounts[opt] = (optionCounts[opt] || 0) + 1;
      });
    });

    // Total AI Suggestions
    let totalSuggestionsGenerated = 0;
    this.data.generations
      .filter(g => !storeId || g.storeId === storeId)
      .forEach(g => {
        totalSuggestionsGenerated += (g.suggestions || []).length;
      });

    const totalCopies = this.data.copies.length;
    const totalGoogleClicks = this.data.googleClicks.length;
    const totalInstagramClicks = this.data.instagramClicks.length;

    // Language breakdown
    const languageCounts = { en: 0, hi: 0, hinglish: 0 };
    feedbacks.forEach(f => {
      if (languageCounts[f.language] !== undefined) {
        languageCounts[f.language]++;
      }
    });

    // Recent feedback list (latest 20)
    const recentFeedbacks = [...feedbacks]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    return {
      totalScans,
      totalFeedbacks,
      averageRating: Number(averageRating),
      ratingDistribution,
      optionCounts,
      totalSuggestionsGenerated,
      totalCopies,
      totalGoogleClicks,
      totalInstagramClicks,
      languageCounts,
      recentFeedbacks,
      disclaimer: 'Google link clicks indicate customers who clicked to open the review page. Per Google policy, reviews are not published automatically.',
    };
  }

  // 9. Export Data
  exportData(format = 'json') {
    if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Rating', 'Language', 'Selected Options', 'Custom Comment', 'Session ID'];
      const rows = this.data.feedbacks.map(f => [
        f.id,
        f.timestamp,
        f.rating,
        f.language,
        `"${(f.feedbackOptions || []).join('; ')}"`,
        `"${(f.customComment || '').replace(/"/g, '""')}"`,
        f.sessionId,
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    return JSON.stringify(this.data, null, 2);
  }
}

export const storage = new Storage();
export default storage;
