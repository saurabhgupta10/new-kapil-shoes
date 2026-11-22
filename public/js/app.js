import { translations } from './translations.js';

(function () {
  'use strict';

  // Application State
  const state = {
    store: {
      name: 'New Kapil Shoes',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJNbz9Kt95hDkRLJ6YP07O1Wg',
      instagramUrl: 'https://www.instagram.com/new_kapil_shoes/',
    },
    currentLang: 'en',
    rating: 5,
    selectedOptions: new Set(),
    customComment: '',
    sessionId: getOrCreateSessionId(),
    feedbackId: null,
    suggestions: [],
    selectedSuggestionIndex: 0,
    sessionHistory: [], // Holds all suggestions generated in this browser session
  };

  // DOM Elements
  const elements = {
    langBtns: document.querySelectorAll('.lang-btn'),
    starBtns: document.querySelectorAll('.star-btn'),
    starBadge: document.getElementById('star-badge'),
    optionsGrid: document.getElementById('options-grid'),
    commentInput: document.getElementById('custom-comment'),
    btnGenerate: document.getElementById('btn-generate'),
    suggestionsArea: document.getElementById('suggestions-area'),
    suggestionsList: document.getElementById('suggestions-list'),
    btnRegenerate: document.getElementById('btn-regenerate'),
    editReviewText: document.getElementById('edit-review-text'),
    btnCopy: document.getElementById('btn-copy'),
    btnGoogle: document.getElementById('btn-google'),
    statusToast: document.getElementById('status-toast'),
    feedbackFormSection: document.getElementById('feedback-form-section'),
    thankYouScreen: document.getElementById('thankyou-screen'),
    btnInstagram: document.getElementById('btn-instagram'),
    btnRestart: document.getElementById('btn-restart'),
  };

  // Helper: Session ID
  function getOrCreateSessionId() {
    let sid = sessionStorage.getItem('nks_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('nks_session_id', sid);
    }
    return sid;
  }

  // Helper: Get translation for current language
  function t() {
    return translations[state.currentLang] || translations.en;
  }

  // Initialize Application
  async function init() {
    // 1. Language determination
    const savedLang = localStorage.getItem('nks_lang');
    if (savedLang && ['en', 'hi', 'hinglish'].includes(savedLang)) {
      state.currentLang = savedLang;
    }

    // 2. Track QR scan asynchronously
    trackScan();

    // 3. Fetch business info
    try {
      const res = await fetch('/api/business');
      if (res.ok) {
        const data = await res.json();
        state.store = {
          name: data.name,
          googleReviewUrl: data.googleReviewUrl,
          instagramUrl: data.instagram?.url || state.store.instagramUrl,
        };
      }
    } catch (err) {
      console.warn('Using local store config fallback', err);
    }

    // 4. Setup listeners and render
    setupEventListeners();
    updateRatingDisplay(state.rating);
    renderFeedbackOptions();
    applyLanguage(state.currentLang);
  }

  // Track QR Scan
  async function trackScan() {
    try {
      await fetch('/api/track/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: 'new-kapil-shoes' }),
      });
    } catch (e) {
      // Non-blocking
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Language Buttons
    elements.langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (lang && lang !== state.currentLang) {
          state.currentLang = lang;
          localStorage.setItem('nks_lang', lang);
          applyLanguage(lang);
        }
      });
    });

    // Star Buttons
    elements.starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.rating, 10);
        state.rating = val;
        updateRatingDisplay(val);
      });

      btn.addEventListener('mouseenter', () => {
        const val = parseInt(btn.dataset.rating, 10);
        highlightStars(val);
      });
    });

    const starContainer = document.querySelector('.stars-row');
    if (starContainer) {
      starContainer.addEventListener('mouseleave', () => {
        highlightStars(state.rating);
      });
    }

    // Custom Comment
    if (elements.commentInput) {
      elements.commentInput.addEventListener('input', (e) => {
        state.customComment = e.target.value;
      });
    }

    // Generate Button
    if (elements.btnGenerate) {
      elements.btnGenerate.addEventListener('click', handleGenerateReviews);
    }

    // Regenerate Button
    if (elements.btnRegenerate) {
      elements.btnRegenerate.addEventListener('click', handleRegenerateReviews);
    }

    // Copy Button
    if (elements.btnCopy) {
      elements.btnCopy.addEventListener('click', handleCopyReview);
    }

    // Google Review Button
    if (elements.btnGoogle) {
      elements.btnGoogle.addEventListener('click', handleGoogleReviewClick);
    }

    // Instagram Button
    if (elements.btnInstagram) {
      elements.btnInstagram.addEventListener('click', handleInstagramClick);
    }

    // Restart / Submit Another
    if (elements.btnRestart) {
      elements.btnRestart.addEventListener('click', resetForm);
    }
  }

  // Update Star Rating Display
  function updateRatingDisplay(rating) {
    highlightStars(rating);
    const trans = t();
    if (elements.starBadge) {
      elements.starBadge.textContent = `${rating} ★ - ${trans.ratings[rating] || ''}`;
    }
  }

  function highlightStars(rating) {
    elements.starBtns.forEach(btn => {
      const val = parseInt(btn.dataset.rating, 10);
      if (val <= rating) {
        btn.classList.add('filled');
      } else {
        btn.classList.remove('filled');
      }
    });
  }

  // Render 10 Feedback Options
  function renderFeedbackOptions() {
    if (!elements.optionsGrid) return;
    const trans = t();
    const optionsKeys = [
      'good_quality',
      'comfortable_shoes',
      'great_collection',
      'affordable_prices',
      'good_variety',
      'helpful_staff',
      'good_service',
      'satisfied_purchase',
      'value_for_money',
      'good_experience',
    ];

    elements.optionsGrid.innerHTML = '';
    optionsKeys.forEach(key => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'feedback-chip' + (state.selectedOptions.has(key) ? ' selected' : '');
      chip.dataset.key = key;

      const label = trans.feedbackOptions[key] || key;
      chip.innerHTML = `
        <svg class="check-icon" viewBox="0 0 20 20">
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
        </svg>
        <span>${label}</span>
      `;

      chip.addEventListener('click', () => {
        if (state.selectedOptions.has(key)) {
          state.selectedOptions.delete(key);
          chip.classList.remove('selected');
        } else {
          state.selectedOptions.add(key);
          chip.classList.add('selected');
        }
      });

      elements.optionsGrid.appendChild(chip);
    });
  }

  // Apply Language Translations to DOM
  function applyLanguage(lang) {
    const trans = t();

    // Toggle active lang buttons
    elements.langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Header & Brand
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (trans[key]) {
        el.textContent = trans[key];
      }
    });

    // Placeholders
    if (elements.commentInput) {
      elements.commentInput.placeholder = trans.commentPlaceholder;
    }

    // Re-render feedback chips with new language text
    renderFeedbackOptions();

    // Update rating badge
    updateRatingDisplay(state.rating);

    // If suggestions are already displayed, refresh button texts
    if (elements.btnCopy) {
      elements.btnCopy.innerHTML = trans.btnCopy;
    }
  }

  // Handle Review Generation
  async function handleGenerateReviews() {
    const trans = t();
    elements.btnGenerate.disabled = true;
    elements.btnGenerate.innerHTML = `<span class="spinner"></span> ${trans.btnGenerating}`;

    try {
      // 1. Submit feedback to backend
      const selectedLabels = Array.from(state.selectedOptions).map(
        key => trans.feedbackOptions[key] || key
      );

      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: state.rating,
          feedbackOptions: selectedLabels,
          customComment: state.customComment,
          language: state.currentLang,
          sessionId: state.sessionId,
        }),
      });

      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        state.feedbackId = data.feedbackId;
      }

      // 2. Request AI Review Suggestions with session history for deduplication
      await fetchAndDisplaySuggestions();
    } catch (err) {
      console.error('Error generating suggestions:', err);
      alert('Could not generate suggestions. Please check your connection and try again.');
    } finally {
      elements.btnGenerate.disabled = false;
      elements.btnGenerate.innerHTML = trans.btnGenerate;
    }
  }

  // Handle Regenerate Reviews
  async function handleRegenerateReviews() {
    const trans = t();
    elements.btnRegenerate.disabled = true;
    elements.btnRegenerate.innerHTML = `<span class="spinner"></span> ${trans.btnRegenerating}`;

    try {
      await fetchAndDisplaySuggestions();
    } catch (err) {
      console.error('Regeneration error:', err);
    } finally {
      elements.btnRegenerate.disabled = false;
      elements.btnRegenerate.innerHTML = trans.btnRegenerate;
    }
  }

  // Fetch & Render Suggestions
  async function fetchAndDisplaySuggestions() {
    const trans = t();
    const selectedLabels = Array.from(state.selectedOptions).map(
      key => trans.feedbackOptions[key] || key
    );

    const res = await fetch('/api/generate-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: state.rating,
        feedbackOptions: selectedLabels,
        customComment: state.customComment,
        language: state.currentLang,
        sessionHistory: state.sessionHistory,
        feedbackId: state.feedbackId,
        sessionId: state.sessionId,
      }),
    });

    if (!res.ok) {
      throw new Error('Server returned ' + res.status);
    }

    const data = await res.json();
    state.suggestions = data.suggestions || [];

    // Add new suggestions to sessionHistory to prevent repeating them in this session
    state.suggestions.forEach(s => {
      if (s.text && !state.sessionHistory.includes(s.text)) {
        state.sessionHistory.push(s.text);
      }
    });

    // Render suggestion cards
    renderSuggestionCards();

    // Reveal suggestions section
    elements.suggestionsArea.style.display = 'block';
    elements.suggestionsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render 3 Suggestion Cards
  function renderSuggestionCards() {
    elements.suggestionsList.innerHTML = '';
    state.selectedSuggestionIndex = 0;

    state.suggestions.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'suggestion-card' + (index === 0 ? ' selected' : '');
      card.dataset.index = index;

      card.innerHTML = `
        <div class="suggestion-header">
          <span class="style-badge">${escapeHtml(item.style || 'Review ' + (index + 1))}</span>
          <div class="select-indicator"></div>
        </div>
        <p class="suggestion-text">${escapeHtml(item.text)}</p>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.suggestion-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedSuggestionIndex = index;
        if (elements.editReviewText) {
          elements.editReviewText.value = item.text;
        }
      });

      elements.suggestionsList.appendChild(card);
    });

    // Populate editable textarea with first suggestion
    if (elements.editReviewText && state.suggestions[0]) {
      elements.editReviewText.value = state.suggestions[0].text;
    }
  }

  // Handle Copy Review
  async function handleCopyReview() {
    const textToCopy = elements.editReviewText.value.trim();
    if (!textToCopy) return;

    const trans = t();
    let copiedSuccessfully = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copiedSuccessfully = true;
      } catch (e) {
        copiedSuccessfully = fallbackCopy(textToCopy);
      }
    } else {
      copiedSuccessfully = fallbackCopy(textToCopy);
    }

    if (copiedSuccessfully) {
      // Record copy event in analytics
      fetch('/api/track/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId: state.feedbackId,
          suggestionId: state.suggestions[state.selectedSuggestionIndex]?.id || '',
          text: textToCopy,
          sessionId: state.sessionId,
        }),
      }).catch(() => {});

      // Visual feedback
      elements.btnCopy.innerHTML = trans.btnCopied;
      elements.btnCopy.style.backgroundColor = '#10b981';
      elements.statusToast.textContent = trans.btnCopied;
      elements.statusToast.style.display = 'block';

      setTimeout(() => {
        elements.btnCopy.innerHTML = trans.btnCopy;
        elements.btnCopy.style.backgroundColor = '';
      }, 3500);
    }
  }

  function fallbackCopy(text) {
    try {
      elements.editReviewText.select();
      elements.editReviewText.setSelectionRange(0, 99999);
      return document.execCommand('copy');
    } catch (e) {
      return false;
    }
  }

  // Handle Continue to Google Review
  function handleGoogleReviewClick(e) {
    e.preventDefault();

    // Track click asynchronously
    fetch('/api/track/google-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedbackId: state.feedbackId,
        sessionId: state.sessionId,
        rating: state.rating,
      }),
    }).catch(() => {});

    // Open Google Review URL in new tab
    window.open(state.store.googleReviewUrl, '_blank', 'noopener,noreferrer');

    // Show Thank-You screen
    showThankYouScreen();
  }

  // Handle Instagram Follow Click
  function handleInstagramClick(e) {
    // Track click asynchronously
    fetch('/api/track/instagram-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        source: 'thank_you_screen',
      }),
    }).catch(() => {});

    // Open Instagram in new window
    window.open(state.store.instagramUrl, '_blank', 'noopener,noreferrer');
  }

  // Show Thank You Screen
  function showThankYouScreen() {
    if (elements.feedbackFormSection) {
      elements.feedbackFormSection.style.display = 'none';
    }
    if (elements.suggestionsArea) {
      elements.suggestionsArea.style.display = 'none';
    }
    if (elements.thankYouScreen) {
      elements.thankYouScreen.style.display = 'block';
      elements.thankYouScreen.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Reset Form for another submission
  function resetForm() {
    state.selectedOptions.clear();
    state.customComment = '';
    state.suggestions = [];
    if (elements.commentInput) elements.commentInput.value = '';
    renderFeedbackOptions();

    if (elements.feedbackFormSection) elements.feedbackFormSection.style.display = 'block';
    if (elements.suggestionsArea) elements.suggestionsArea.style.display = 'none';
    if (elements.thankYouScreen) elements.thankYouScreen.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
