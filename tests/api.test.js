import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/server.js';

// Use top-level await to start ephemeral test server
const server = app.listen(0);
await new Promise(resolve => server.once('listening', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

test('GET /api/business returns New Kapil Shoes config and 3 languages', async () => {
  const res = await fetch(`${baseUrl}/api/business`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.name, 'New Kapil Shoes');
  assert.equal(data.googleReviewUrl, 'https://search.google.com/local/writereview?placeid=ChIJNbz9Kt95hDkRLJ6YP07O1Wg');
  assert.equal(data.instagram.url, 'https://www.instagram.com/new_kapil_shoes/');
  assert.deepEqual(data.supportedLanguages, ['en', 'hi', 'hinglish']);
  assert.equal(data.feedbackCategories.length, 10);
});

test('POST /api/track/scan logs QR code scan', async () => {
  const res = await fetch(`${baseUrl}/api/track/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId: 'new-kapil-shoes' }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.scanId);
});

test('POST /api/feedback logs customer feedback with rating and options', async () => {
  const res = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 5,
      feedbackOptions: ['Comfortable shoes', 'Good product quality'],
      customComment: 'Bought sneakers, fits great!',
      language: 'en',
      sessionId: 'sess_test_123',
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.feedbackId);
});

test('POST /api/generate-reviews returns 3 distinct suggestions in requested language', async () => {
  const languages = ['en', 'hi', 'hinglish'];

  for (const lang of languages) {
    const res = await fetch(`${baseUrl}/api/generate-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        feedbackOptions: ['Comfortable shoes', 'Great collection'],
        customComment: 'Excellent store',
        language: lang,
        sessionId: 'sess_test_123',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.suggestions.length, 3);
    assert.equal(data.language, lang);

    const texts = data.suggestions.map(s => s.text);
    assert.notEqual(texts[0], texts[1]);
    assert.notEqual(texts[1], texts[2]);
  }
});

test('POST /api/track/copy, /api/track/google-click, /api/track/instagram-click', async () => {
  // 1. Copy Review
  const copyRes = await fetch(`${baseUrl}/api/track/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feedbackId: 'fb_1',
      suggestionId: 'sug-1',
      text: 'Great shoes at New Kapil Shoes!',
      sessionId: 'sess_test_123',
    }),
  });
  assert.equal(copyRes.status, 200);
  const copyData = await copyRes.json();
  assert.equal(copyData.success, true);

  // 2. Google Click
  const googleRes = await fetch(`${baseUrl}/api/track/google-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feedbackId: 'fb_1',
      sessionId: 'sess_test_123',
      rating: 5,
    }),
  });
  assert.equal(googleRes.status, 200);
  const googleData = await googleRes.json();
  assert.equal(googleData.success, true);

  // 3. Instagram Click
  const instaRes = await fetch(`${baseUrl}/api/track/instagram-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sess_test_123',
      source: 'thank_you_screen',
    }),
  });
  assert.equal(instaRes.status, 200);
  const instaData = await instaRes.json();
  assert.equal(instaData.success, true);
});

test('GET /api/analytics returns accurate aggregated metrics and compliance disclaimer', async () => {
  const res = await fetch(`${baseUrl}/api/analytics`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.totalScans >= 1);
  assert.ok(data.totalFeedbacks >= 1);
  assert.ok(data.totalSuggestionsGenerated >= 3);
  assert.ok(data.totalCopies >= 1);
  assert.ok(data.totalGoogleClicks >= 1);
  assert.ok(data.totalInstagramClicks >= 1);
  assert.ok(data.disclaimer.includes('Per Google policy'));
});

test('GET /api/feedback/export exports CSV and JSON', async () => {
  // CSV
  const csvRes = await fetch(`${baseUrl}/api/feedback/export?format=csv`);
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.ok(csvText.includes('ID,Timestamp,Rating,Language'));

  // JSON
  const jsonRes = await fetch(`${baseUrl}/api/feedback/export?format=json`);
  assert.equal(jsonRes.status, 200);
  const jsonData = await jsonRes.json();
  assert.ok(Array.isArray(jsonData.feedbacks));
});

test('GET /api/qr returns valid PNG image', async () => {
  const res = await fetch(`${baseUrl}/api/qr`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/png');
  const buffer = await res.arrayBuffer();
  assert.ok(buffer.byteLength > 100);
});

test('Shutdown test server', async () => {
  await new Promise(resolve => server.close(resolve));
});
