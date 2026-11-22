import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReviewSuggestions, REVIEW_STYLES, buildAlgorithmicReview } from '../src/services/aiReviewEngine.js';
import { isNearDuplicate, levenshteinSimilarity, jaccardSimilarity, normalizeText } from '../src/services/similarity.js';

test('Text Normalization and Similarity', () => {
  const norm1 = normalizeText('New Kapil Shoes!! Best quality!!');
  const norm2 = normalizeText('new kapil shoes best quality');
  assert.equal(norm1, norm2);

  const jaccard = jaccardSimilarity('Comfortable shoes affordable prices', 'Affordable prices comfortable shoes');
  assert.equal(jaccard, 1.0);

  const lev = levenshteinSimilarity('New Kapil Shoes', 'New Kapil Shoes');
  assert.equal(lev, 1.0);

  const nearDup = isNearDuplicate(
    'Great experience at New Kapil Shoes. Very happy with purchase.',
    ['Great experience at New Kapil Shoes. Very happy with purchase.']
  );
  assert.equal(nearDup.isDuplicate, true);
  assert.equal(nearDup.reason, 'exact_match');
});

test('AI Review Generator produces 3 unique suggestions across styles and languages', async () => {
  const languages = ['en', 'hi', 'hinglish'];

  for (const lang of languages) {
    const result = await generateReviewSuggestions({
      rating: 5,
      feedbackOptions: ['Good product quality', 'Comfortable shoes', 'Affordable prices'],
      customComment: 'Staff was polite',
      language: lang,
      sessionHistory: [],
    });

    assert.equal(result.suggestions.length, 3, `Should generate 3 suggestions for ${lang}`);
    assert.equal(result.language, lang);

    // Ensure all 3 suggestions in the batch are non-empty and distinct
    const texts = result.suggestions.map(s => s.text);
    assert.notEqual(texts[0], texts[1], 'Suggestion 1 and 2 should not be identical');
    assert.notEqual(texts[1], texts[2], 'Suggestion 2 and 3 should not be identical');
    assert.notEqual(texts[0], texts[2], 'Suggestion 1 and 3 should not be identical');

    // Check similarity between suggestions in same batch
    const check1 = isNearDuplicate(texts[0], [texts[1], texts[2]]);
    assert.equal(check1.isDuplicate, false, `Batch suggestions for ${lang} should not be near-duplicates`);
  }
});

test('Rating sentiment preservation: 1-star vs 5-star', async () => {
  const highResult = await generateReviewSuggestions({
    rating: 5,
    feedbackOptions: ['Good product quality', 'Great collection'],
    language: 'en',
    sessionHistory: [],
  });

  const lowResult = await generateReviewSuggestions({
    rating: 1,
    feedbackOptions: [],
    language: 'en',
    sessionHistory: [],
  });

  const highText = highResult.suggestions[0].text.toLowerCase();
  const lowText = lowResult.suggestions[0].text.toLowerCase();

  assert.ok(
    highText.includes('great') || highText.includes('satisfied') || highText.includes('quality') || highText.includes('pleasant') || highText.includes('recommend') || highText.includes('good'),
    'High rating should be positive'
  );

  const criticalKeywords = ['improve', 'better', 'expectation', 'short', 'honest', 'fell', 'attention', 'below', 'room for', 'hope'];
  const hasCritical = criticalKeywords.some(kw => lowText.includes(kw));

  assert.ok(
    hasCritical,
    `Low rating should convey constructive/critical feedback, got: "${lowText}"`
  );

  // Never convert negative feedback into positive feedback
  assert.ok(!lowText.includes('5 stars'), 'Low rating should never include 5 stars');
  assert.ok(!lowText.includes('super happy'), 'Low rating should never claim super happy');
  assert.ok(!lowText.includes('loved both'), 'Low rating should never claim loved both');
});

test('Session deduplication rejects previously shown suggestions', async () => {
  const initial = await generateReviewSuggestions({
    rating: 5,
    feedbackOptions: ['Comfortable shoes'],
    language: 'hinglish',
    sessionHistory: [],
  });

  const initialTexts = initial.suggestions.map(s => s.text);

  // Now request a regeneration passing the initial texts as sessionHistory
  const regenerated = await generateReviewSuggestions({
    rating: 5,
    feedbackOptions: ['Comfortable shoes'],
    language: 'hinglish',
    sessionHistory: initialTexts,
  });

  for (const s of regenerated.suggestions) {
    const isDup = isNearDuplicate(s.text, initialTexts);
    assert.equal(isDup.isDuplicate, false, `Regenerated suggestion "${s.text}" should not duplicate session history`);
  }
});
