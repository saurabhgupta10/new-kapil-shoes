import test from 'node:test';
import assert from 'node:assert/strict';
import { isNearDuplicate, levenshteinSimilarity, jaccardSimilarity, normalizeText, hashText } from '../src/services/similarity.js';
import { generateReviewSuggestions } from '../src/services/aiReviewEngine.js';

test('Deduplication: Exact text match detection', () => {
  const original = 'Visited New Kapil Shoes today and had a very pleasant experience.';
  const exactCopy = 'Visited New Kapil Shoes today and had a very pleasant experience.';
  const punctuationVariant = 'visited new kapil shoes today, and had a very pleasant experience!';

  const res1 = isNearDuplicate(exactCopy, [original]);
  assert.equal(res1.isDuplicate, true);
  assert.equal(res1.reason, 'exact_match');

  const res2 = isNearDuplicate(punctuationVariant, [original]);
  assert.equal(res2.isDuplicate, true);
  assert.equal(res2.reason, 'exact_match');
});

test('Deduplication: High Jaccard token overlap detection', () => {
  const textA = 'Comfortable shoes, affordable prices, great collection at New Kapil Shoes.';
  const textB = 'Great collection, affordable prices, comfortable shoes at New Kapil Shoes store.';

  const jaccard = jaccardSimilarity(textA, textB);
  assert.ok(jaccard >= 0.60, `Jaccard overlap should be >= 0.60, got ${jaccard}`);

  const check = isNearDuplicate(textB, [textA]);
  assert.equal(check.isDuplicate, true);
});

test('Deduplication: High Levenshtein similarity detection', () => {
  const textA = ' न्यू कपिल शूज से फुटवेयर खरीदा, बहुत ही बढ़िया अनुभव रहा।';
  const textB = 'न्यू कपिल शूज से फुटवेयर खरीदा, बहुत ही अच्छा अनुभव रहा।';

  const lev = levenshteinSimilarity(textA, textB);
  assert.ok(lev >= 0.70, `Levenshtein similarity should be high for minor word change, got ${lev}`);

  const check = isNearDuplicate(textB, [textA]);
  assert.equal(check.isDuplicate, true);
});

test('Deduplication: Distinct suggestions are accepted without false positives', () => {
  const textA = 'Visited New Kapil Shoes today. Great daily sneakers and durable sole.';
  const textB = 'The customer service and polite staff made my visit worthwhile. Fair pricing.';

  const check = isNearDuplicate(textB, [textA]);
  assert.equal(check.isDuplicate, false);
});

test('AI Engine: Multi-generation deduplication loop produces zero duplicates', async () => {
  const seenHashes = new Set();
  const sessionHistory = [];

  // Run 4 successive generations simulating multiple "Regenerate" clicks
  for (let round = 1; round <= 4; round++) {
    const result = await generateReviewSuggestions({
      rating: 5,
      feedbackOptions: ['Good product quality', 'Comfortable shoes', 'Affordable prices'],
      language: 'en',
      sessionHistory: [...sessionHistory],
    });

    assert.equal(result.suggestions.length, 3, `Round ${round} should produce 3 suggestions`);

    for (const item of result.suggestions) {
      assert.ok(item.text.length > 15, 'Suggestion text should be meaningful');

      // Verify not seen in any previous round
      const hash = hashText(item.text);
      assert.equal(seenHashes.has(hash), false, `Hash ${hash} should not have been generated before in session`);
      seenHashes.add(hash);

      // Verify no near duplicate in sessionHistory
      const nearCheck = isNearDuplicate(item.text, sessionHistory);
      assert.equal(nearCheck.isDuplicate, false, `Near duplicate detected for: "${item.text}"`);

      sessionHistory.push(item.text);
    }
  }

  assert.equal(seenHashes.size, 12, 'Should have 12 completely distinct suggestions across 4 rounds');
});
