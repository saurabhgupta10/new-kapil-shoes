import express from 'express';
import QRCode from 'qrcode';
import { stores, defaultStoreId, getStore } from '../config/business.js';
import storage from '../db/storage.js';
import { generateReviewSuggestions } from '../services/aiReviewEngine.js';

const router = express.Router();

/**
 * 1. Business Info
 */
router.get('/business', (req, res) => {
  const storeId = req.query.storeId || defaultStoreId;
  const store = getStore(storeId);
  res.json({
    id: store.id,
    name: store.name,
    tagline: store.tagline,
    categories: store.categories,
    categorySummary: store.categorySummary,
    googleReviewUrl: store.googleReviewUrl,
    instagram: store.instagram,
    supportedLanguages: store.supportedLanguages,
    defaultLanguage: store.defaultLanguage,
    feedbackCategories: store.feedbackCategories,
  });
});

/**
 * 2. Track QR Scan
 */
router.post('/track/scan', (req, res) => {
  const { storeId = defaultStoreId } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';
  const referrer = req.headers['referer'] || '';

  const scan = storage.recordScan({ storeId, userAgent, ip, referrer });
  res.json({ success: true, scanId: scan.id });
});

/**
 * 3. Submit Customer Feedback
 */
router.post('/feedback', (req, res) => {
  const {
    storeId = defaultStoreId,
    rating = 5,
    feedbackOptions = [],
    customComment = '',
    language = 'en',
    sessionId = '',
  } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const feedback = storage.recordFeedback({
    storeId,
    rating: Number(rating),
    feedbackOptions,
    customComment,
    language,
    sessionId,
  });

  res.json({
    success: true,
    feedbackId: feedback.id,
    timestamp: feedback.timestamp,
  });
});

/**
 * 4. Generate AI Review Suggestions
 */
router.post('/generate-reviews', async (req, res) => {
  try {
    const {
      rating = 5,
      feedbackOptions = [],
      customComment = '',
      language = 'en',
      sessionHistory = [],
      feedbackId = '',
      sessionId = '',
      storeId = defaultStoreId,
    } = req.body;

    const result = await generateReviewSuggestions({
      rating: Number(rating) || 5,
      feedbackOptions,
      customComment,
      language,
      sessionHistory,
      storeId,
    });

    // Record generation history for analytics and deduplication
    storage.recordGenerations({
      feedbackId,
      storeId,
      rating: Number(rating) || 5,
      language: result.language,
      suggestions: result.suggestions,
      sessionId,
      engine: result.engine,
    });

    res.json({
      success: true,
      suggestions: result.suggestions,
      engine: result.engine,
      language: result.language,
      rating: result.rating,
      duplicateRejectionsCount: result.duplicateRejectionsCount,
    });
  } catch (err) {
    console.error('[API /generate-reviews] Error:', err);
    res.status(500).json({ error: 'Failed to generate review suggestions' });
  }
});

/**
 * 5. Track Review Copy
 */
router.post('/track/copy', (req, res) => {
  const { feedbackId = '', suggestionId = '', text = '', sessionId = '' } = req.body;
  const record = storage.recordCopy({ feedbackId, suggestionId, text, sessionId });
  res.json({ success: true, copyId: record.id });
});

/**
 * 6. Track Google Review Click
 */
router.post('/track/google-click', (req, res) => {
  const { feedbackId = '', sessionId = '', rating = null } = req.body;
  const record = storage.recordGoogleClick({ feedbackId, sessionId, rating });
  res.json({ success: true, clickId: record.id });
});

/**
 * 7. Track Instagram Follow Click
 */
router.post('/track/instagram-click', (req, res) => {
  const { sessionId = '', source = 'thank_you_screen' } = req.body;
  const record = storage.recordInstagramClick({ sessionId, source });
  res.json({ success: true, clickId: record.id });
});

/**
 * 8. Business Dashboard Analytics
 */
router.get('/analytics', (req, res) => {
  const storeId = req.query.storeId || defaultStoreId;
  const analytics = storage.getAnalytics(storeId);
  const store = getStore(storeId);

  res.json({
    store: {
      name: store.name,
      categorySummary: store.categorySummary,
      googleReviewUrl: store.googleReviewUrl,
      instagram: store.instagram,
    },
    ...analytics,
  });
});

/**
 * 9. Export Feedback Data (CSV or JSON)
 */
router.get('/feedback/export', (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const data = storage.exportData(format);

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="new-kapil-shoes-feedback.csv"');
    return res.send(data);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="new-kapil-shoes-feedback.json"');
  return res.send(data);
});

/**
 * 10. Dynamic QR Code Generator (PNG or SVG)
 */
router.get('/qr', async (req, res) => {
  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const defaultUrl = `${protocol}://${host}/`;
    const targetUrl = req.query.url || defaultUrl;
    const format = req.query.format || 'png';

    if (format === 'svg') {
      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        color: {
          dark: '#1A1D20',
          light: '#FFFFFF',
        },
        margin: 2,
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    const buffer = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: 600,
      margin: 2,
      color: {
        dark: '#1A1D20',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error('[API /qr] Error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
