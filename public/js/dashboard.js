(function () {
  'use strict';

  // Fetch and populate dashboard data
  async function loadDashboardData() {
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      renderDashboard(data);
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
    }
  }

  function renderDashboard(data) {
    // 1. KPI Cards
    document.getElementById('kpi-scans').textContent = (data.totalScans || 0).toLocaleString();
    document.getElementById('kpi-feedbacks').textContent = (data.totalFeedbacks || 0).toLocaleString();

    const scanConvRate = data.totalScans > 0
      ? Math.round((data.totalFeedbacks / data.totalScans) * 100)
      : 0;
    document.getElementById('kpi-scan-conv').textContent = `${scanConvRate}% scan-to-feedback rate`;

    document.getElementById('kpi-rating').textContent = (data.averageRating || 0).toFixed(1);
    document.getElementById('kpi-rating-sub').textContent = `From ${data.totalFeedbacks || 0} reviews`;

    document.getElementById('kpi-suggestions').textContent = (data.totalSuggestionsGenerated || 0).toLocaleString();
    document.getElementById('kpi-copies').textContent = (data.totalCopies || 0).toLocaleString();

    const copyRate = data.totalFeedbacks > 0
      ? Math.round((data.totalCopies / data.totalFeedbacks) * 100)
      : 0;
    document.getElementById('kpi-copy-rate').textContent = `${copyRate}% of feedbacks copied`;

    document.getElementById('kpi-google').textContent = (data.totalGoogleClicks || 0).toLocaleString();
    document.getElementById('kpi-instagram').textContent = (data.totalInstagramClicks || 0).toLocaleString();

    // 2. Rating Distribution Bars
    const distContainer = document.getElementById('rating-distribution-container');
    distContainer.innerHTML = '';
    const dist = data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const maxRatingCount = Math.max(1, ...Object.values(dist));
    const totalRatings = data.totalFeedbacks || 1;

    for (let r = 5; r >= 1; r--) {
      const count = dist[r] || 0;
      const pct = Math.round((count / totalRatings) * 100);

      const row = document.createElement('div');
      row.className = 'rating-bar-row';
      row.innerHTML = `
        <span class="rating-label">${r} ★</span>
        <div class="progress-bar-bg">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
        <span class="rating-count">${count} <small>(${pct}%)</small></span>
      `;
      distContainer.appendChild(row);
    }

    // 3. Top Feedback Categories
    const topOptionsContainer = document.getElementById('top-options-container');
    topOptionsContainer.innerHTML = '';
    const optionCounts = data.optionCounts || {};
    const sortedOptions = Object.entries(optionCounts).sort((a, b) => b[1] - a[1]);

    if (sortedOptions.length === 0) {
      topOptionsContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No feedback tags selected yet.</p>';
    } else {
      sortedOptions.slice(0, 7).forEach(([tag, count]) => {
        const item = document.createElement('div');
        item.className = 'tag-stat-item';
        item.innerHTML = `
          <span class="tag-stat-name">${escapeHtml(tag)}</span>
          <span class="tag-stat-badge">${count} times</span>
        `;
        topOptionsContainer.appendChild(item);
      });
    }

    // 4. Recent Feedback Table
    const tableBody = document.getElementById('feedback-table-body');
    const recentFeedbacks = data.recentFeedbacks || [];

    if (recentFeedbacks.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No feedback submissions recorded yet. Scan the QR code to submit!</td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = '';
      recentFeedbacks.forEach(f => {
        const tr = document.createElement('tr');
        const dateStr = new Date(f.timestamp).toLocaleString();
        const rating = Number(f.rating) || 5;

        const tagsHtml = (f.feedbackOptions || [])
          .map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`)
          .join('');

        const commentText = f.customComment
          ? `<em style="color: #1e293b;">"${escapeHtml(f.customComment)}"</em>`
          : '<span style="color: #94a3b8;">None</span>';

        const langBadge = `<span style="text-transform: capitalize; font-weight: 600;">${escapeHtml(f.language || 'en')}</span>`;

        tr.innerHTML = `
          <td style="white-space: nowrap; font-size: 0.82rem; color: #64748b;">${dateStr}</td>
          <td><span class="badge-star badge-star-${rating}">${rating} ★</span></td>
          <td>${langBadge}</td>
          <td>${tagsHtml || '<span style="color: #94a3b8;">-</span>'}</td>
          <td>${commentText}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  document.getElementById('btn-refresh').addEventListener('click', loadDashboardData);

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    window.location.href = '/api/feedback/export?format=csv';
  });

  // Auto-refresh every 30 seconds
  setInterval(loadDashboardData, 30000);

  // Initial load
  loadDashboardData();
})();
