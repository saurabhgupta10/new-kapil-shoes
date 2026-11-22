# 👟 New Kapil Shoes – AI QR Feedback & Google Review Assistant

A professional, mobile-first QR Customer Feedback and Google Review Assistant tailored for **New Kapil Shoes** (Shoes, Slippers, Sandals, Footwear).

---

## 📍 Business Details

- **Business Name:** New Kapil Shoes
- **Categories:** Shoes, Slippers, Sandals, Footwear
- **Google Review URL:** [Leave a Google Review](https://search.google.com/local/writereview?placeid=ChIJNbz9Kt95hDkRLJ6YP07O1Wg)
- **Place ID:** `ChIJNbz9Kt95hDkRLJ6YP07O1Wg`
- **Instagram Profile:** [@new_kapil_shoes](https://www.instagram.com/new_kapil_shoes/)

---

## 🌟 Key Capabilities & Features

### 1. Exactly Three Languages
- **English**
- **Hindi (Devanagari – हिंदी)**
- **Hinglish (Hindi in Roman script)**
- Switch instantly at any time without page reload.
- Full UI, feedback categories, placeholders, review suggestions, and instructions adapt dynamically.

### 2. Customer Feedback Collection
- **1–5 Star Rating:** Touch-optimized stars with live sentiment badges (*5: Excellent / बेहतरीन / Bohot Badhiya*, *1: Poor / बहुत खराब*).
- **10 Footwear-Specific Categories (Multi-Select):**
  1. Good product quality
  2. Comfortable shoes
  3. Great collection
  4. Affordable prices
  5. Good variety of footwear
  6. Helpful staff
  7. Good customer service
  8. Satisfied with my purchase
  9. Value for money
  10. Good shopping experience
- **Custom Comment Box:** Write or dictate additional notes in English, Hindi, or Hinglish.

### 3. AI Review Generation Engine & Variation Architecture
Produces 3 unique, conversational review suggestions per submission using dual-engine architecture:
- **Server-side Gemini AI support:** via `GEMINI_API_KEY` environment variable.
- **Built-in Algorithmic Linguistic Engine:** over 150+ syntactical patterns, footwear vocabulary matrices, and connector permutations across all 3 languages.
- **6 Writing Patterns:**
  - *Simple and natural* (Clean, everyday recommendation)
  - *Friendly and conversational* (Warm and relatable)
  - *Detailed and descriptive* (Highlights fit, quality, comfort & variety)
  - *Short and direct* (Punchy 1–2 sentence review)
  - *Personal and expressive* (First-person narrative)
  - *Professional and balanced* (Objective, structured critique)
- **Sentiment & Policy Integrity:**
  - Ratings of 4–5 generate appreciative, superlative reviews.
  - Rating of 3 generates balanced, honest feedback.
  - Ratings of 1–2 generate polite, constructive feedback reflecting customer concerns. **Never turns negative feedback into fake positive praise.**
  - **Editable:** Customers can edit the review text directly in the app before copying.

### 4. Multi-Level Duplicate Prevention System
- **Level A (Current Session):** In-memory session tracking prevents previously displayed suggestions from appearing again.
- **Level B (Cross-Generation History):** Recent generations are hashed (SHA-256) and stored in database.
- **Level C (Similarity Rejection):**
  - Jaccard token overlap check (rejects $\ge 0.60$ overlap).
  - Normalized Levenshtein edit distance check (rejects $\ge 0.70$ similarity).
  - Automatically regenerates alternative stylistic candidates until 3 distinct suggestions are guaranteed.
- **Level D (Regeneration):** "Get Fresh Suggestions" button provides fresh suggestions without repeating past session history.

### 5. Google Review Workflow & Anti-Gating Compliance
- Single-tap **"Copy Review"** button copies the text with visual clipboard confirmation.
- **"Continue to Google Review"** opens Google review page directly.
- **Strict Anti-Gating Compliance:** Accessible to all customers regardless of rating (1–5 stars). Reviews are never auto-published; customer pastes and submits manually.

### 6. Instagram Follow & Thank-You Screen
- Shown after Google review handoff.
- Heading: *"Thank You for Your Feedback! ❤️"*
- Official Instagram gradient button opening `https://www.instagram.com/new_kapil_shoes/`.
- Clicks are tracked in analytics. Follow remains 100% optional.

### 7. Real-Time Business Dashboard (`/dashboard`)
- **Total QR Scans** & scan-to-feedback conversion rate.
- **Total Feedback Submissions** & **Average Customer Rating**.
- **Rating Distribution Bar Chart** (1–5 stars).
- **Most Selected Feedback Categories** breakdown.
- **AI Suggestions Generated**, **Reviews Copied**, **Google Link Clicks**, and **Instagram Link Clicks**.
- **Recent Customer Feedback Table** with date, stars, language, tags, and comments.
- **Export to CSV / JSON** with one click.
- Clear compliance disclaimer noting Google link clicks are not represented as published reviews.

### 8. Printable QR Posters & Standees
- **In-Browser One-Click Print:** Accessible at `/poster` with `@media print` A4 formatting.
- **Pre-generated 300 DPI High-Resolution Files:**
  - `poster_A4_NewKapilShoes.png` (2480 x 3508 px, A4 size at 300 DPI)
  - `poster_A5_NewKapilShoes.png` (1748 x 2480 px, A5 counter standee at 300 DPI)
  - `qr_NewKapilShoes.png` (High-res standalone QR Code)
- Python generator script: `python generate_posters.py [URL]`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 26)
- Python 3+ (with `qrcode` and `pillow` for poster generation)

### Installation
```bash
# Clone or navigate to the directory
cd "E:\NewKapilShoes]"

# Install Node dependencies
pnpm install # or npm install
```

### Running the Application
```bash
# Start server (default: port 3000)
npm start
```

Access the application in your browser:
- 📱 **Customer Mobile Experience:** [http://localhost:3000/](http://localhost:3000/)
- 📊 **Business Analytics Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- 🖨️ **Printable A4 QR Poster:** [http://localhost:3000/poster](http://localhost:3000/poster)

### Running Automated Tests
```bash
npm test
```
*Runs all 18 unit and integration tests covering the review generator, 3 languages, rating sentiment, similarity algorithms, session deduplication, and REST APIs.*

### Regenerating Custom QR Posters
```bash
# For local testing
python generate_posters.py

# For live production domain
python generate_posters.py https://newkapilshoes.com/
```

---

## 📁 Project Architecture

```
NewKapilShoes/
├── src/
│   ├── config/
│   │   └── business.js         # Business details & multi-shop configuration
│   ├── db/
│   │   └── storage.js          # Persistent storage (scans, feedbacks, copies, clicks)
│   ├── services/
│   │   ├── aiReviewEngine.js   # Dual AI review engine (Gemini + Linguistic Synthesis)
│   │   └── similarity.js       # Levenshtein, Jaccard & duplicate detection algorithms
│   ├── routes/
│   │   └── api.js              # REST API endpoints
│   └── server.js               # Express application entry
├── public/
│   ├── css/
│   │   └── style.css           # Mobile-first footwear boutique styles
│   ├── js/
│   │   ├── app.js              # Customer frontend application logic
│   │   ├── dashboard.js        # Real-time analytics dashboard logic
│   │   └── translations.js     # English, Hindi & Hinglish dictionary
│   ├── assets/
│   │   └── qr_NewKapilShoes.png# Static QR code image
│   ├── index.html              # Mobile QR landing page
│   ├── dashboard.html          # Business owner dashboard
│   └── poster.html             # Printable A4/A5 poster page
├── tests/
│   ├── api.test.js             # API integration tests
│   ├── deduplication.test.js   # Multi-level duplicate prevention tests
│   └── reviewEngine.test.js    # Language, style & sentiment tests
├── data/
│   └── store.json              # Persistent database file
├── generate_posters.py         # Python 300 DPI A4/A5 poster generator
├── make_qr.py                  # Convenience poster generator wrapper
├── poster_A4_NewKapilShoes.png # Generated A4 300 DPI Poster
├── poster_A5_NewKapilShoes.png # Generated A5 300 DPI Standee
├── qr_NewKapilShoes.png        # Generated QR Code PNG
└── package.json
```

---

## 🔒 Google Anti-Gating & Review Policy Compliance
1. **Unrestricted Access:** Google Review link is accessible to every customer without filtering or gating by star rating.
2. **No Automated Review Posting:** The system never publishes reviews on Google on behalf of the customer.
3. **No Incentives:** No discounts, gifts, or financial incentives are offered in exchange for reviews.
4. **Editable Suggestions:** AI suggestions serve as an authentic starting point; customers are explicitly encouraged to customize their review.
