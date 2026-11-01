# The Hagiography & Iconography Calendar of Female Saints

**The Hagiography & Iconography Calendar of Female Saints** is a standalone, full-year (365-day) liturgical calendar and hagiographical inspector celebrating historically attested holy women across Catholic, Eastern Orthodox, and Shared Christian traditions.

---

## 1. Project Overview

### Strict 16:9 Landscape Interface & Byzantine Aesthetic
- **Widescreen Split-Pane Architecture (`100vw x 100vh`)**: Designed for a strict 16:9 desktop viewport with zero window scrollbars (`overflow: hidden`).
  - **Left Pane (60% Width)**: Interactive 7-column liturgical month grid that dynamically adapts between 5-row and 6-row layouts (e.g., May and August 2026) with zero cell clipping, paired with month navigation, martyrdom status chips, tradition filters, and a global 365-day search bar.
  - **Right Pane (40% Width)**: Detailed hagiographical dossier displaying an ornate Byzantine arch icon frame, prominent **Cause of Death** and **Tradition** badges directly beneath the icon, canonical titles, a dedicated **Holy Martyrdom / Venerable Repose** callout box, a curated biography, and verified external ecclesiastical sources.
- **Current Day Auto-Highlight on Launch**: Automatically detects today's calendar month and day upon opening, highlights today's tile with a gold glow and `TODAY` badge, and loads today's saint in the dossier.
- **Fullscreen Magnified Iconography Gallery Mode**: Clicking the saint's icon in the right-hand dossier—or clicking the **`Today's Gallery`** button in the top-right header—opens a fullscreen gallery modal displaying the uncropped artwork in the center with left/right arrows (`‹` / `›`) and keyboard navigation (`ArrowLeft` / `ArrowRight`) to step day-by-day through the entire year.

### Two-Stage Verified Data Pipeline (Fetch First, Curate Second)
The calendar dataset ([`saints-data.json`](./saints-data.json) and [`data/saints.json`](./data/saints.json)) is constructed via [`scripts/build-saints-data.js`](./scripts/build-saints-data.js) using a strict two-stage ETL architecture:
1. **Stage A — Raw Grounded Extraction**:
   - Queries liturgical calendars (Orthodox Church in America / Orthocal API, CatholicSaints.info, New Advent Catholic Encyclopedia, and Wikidata SPARQL) to identify a historically attested female saint for each calendar day.
   - Fetches grounded biographical summaries and metadata via the **Wikipedia REST API** (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`) and verifies external source URLs.
   - Queries the **Wikimedia Commons API** to retrieve public-domain iconography and liturgical artwork.
2. **Stage B — Programmatic Editorial Curation**:
   - Passes the raw extracted source text into `@google/genai` (`gemini-3.5-flash-lite`) with an enforced JSON `responseSchema` to synthesize:
     - `curatedBio`: A concise 60–90 word historically grounded narrative stripped of raw wiki markup.
     - `isMartyr`: Boolean derived from canonical titles (*Martyr*, *Great Martyr*, *Hieromartyr* vs. *Venerable*, *Confessor*, *Righteous*).
     - `mannerOfDeath`: Standardized 1–4 word cause-of-death classification (e.g., `"Decapitation"`, `"Burned at the stake"`, `"Natural causes"`).
     - `deathSummary`: Factual 1–2 sentence account of her martyrdom or repose (explicitly noting when historical details are unrecorded or disputed).
     - `sources`: Verified `{ label, url }` scholarly and liturgical reference links.

---

## 2. Iconography & Historical Accuracy Disclaimer

> [!IMPORTANT]
> **Note on Visual Accuracy**
>
> While all biographical narratives, feast dates, canonical titles, and martyrdom classifications in this calendar are cross-referenced against historical synaxaria, martyrologies, and liturgical records, **the saint icons and images are programmatically sourced via the Wikimedia Commons API**.
>
> Consequently, **not all displayed pictures are guaranteed to be accurate depictions of that specific saint**. In cases where a dedicated public-domain Eastern Orthodox or Catholic icon of an obscure early Christian or medieval female saint does not exist in Wikimedia Commons, the automated image pipeline may retrieve artwork depicting a similarly named saint, a manuscript illumination, a reliquary or church dedicated to her, a general liturgical scene, or adjacent period iconography.

---

## 3. Local Setup & Installation Guide

### Option 1: Quick View (Run the Pre-Built `dist/` Folder Directly)
Because the compiled production bundle (`dist/`) is tracked directly in this repository with relative asset paths, you can run or deploy the app immediately **without installing dependencies or rebuilding**:

- **Serve Locally with Python (macOS / Linux / Windows):**
  ```bash
  python3 -m http.server --directory dist 8080
  ```
  Then open `http://localhost:8080` in your browser.
- **Serve Locally with Node `npx serve`:**
  ```bash
  npx serve dist
  ```
- **Deploy Instantly to the Web (Netlify Drop):**
  Drag and drop the [`dist/`](./dist) folder directly onto [app.netlify.com/drop](https://app.netlify.com/drop) for instant static hosting.

---

### Option 2: Development Setup (Local Dev Server)

1. **Prerequisites:**
   - Install **Node.js** (version 18.0 or newer, LTS recommended) from [nodejs.org](https://nodejs.org/).
2. **Clone the Repository:**
   ```bash
   git clone <your-github-repo-url>
   cd HagioCalendar
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```
   Open the local URL displayed in your terminal (typically `http://localhost:5173/`) in your web browser. Press `Ctrl + C` in the terminal to stop the server.

---

### Option 3: Rebuilding & Data Generation (ETL Pipeline)

If you want to re-run the two-stage data curation pipeline or recompile the production `dist/` bundle after modifying source files:

1. **Configure Your Environment Variables:**
   Copy `.env.example` to `.env` in the project root and add your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
2. **Run the Two-Stage Data Pipeline (`scripts/build-saints-data.js`):**
   Pass any month (`1` through `12`) via the `--month` flag to extract and curate data for that month:
   ```bash
   # Curate a specific month (e.g., January = 1 .. December = 12)
   node scripts/build-saints-data.js --month=1
   ```
3. **Rebuild the Production Bundle (`dist/`):**
   Whenever you update the UI (`index.html`, `src/app.js`, `src/style.css`) or dataset (`saints-data.json`), run:
   ```bash
   npm run build
   ```
   This compiles the latest HTML, CSS, JS, data, and icons into `dist/`.

---

## 4. Repository Manifest (What is Tracked vs. Ignored)

This repository is intentionally configured so that anyone cloning it—or deploying it from GitHub Desktop—has both the full source code **and** the ready-to-deploy production build (`dist/`), while keeping secrets and heavy package trees out of version control.

| Path / Pattern | Git Status | Purpose & Rationale |
| :--- | :--- | :--- |
| `src/`, `index.html`, `vite.config.js` | **Tracked** | Core frontend application source code, Byzantine liturgical styles, and Vite build config. |
| `dist/` | **Tracked** | Pre-compiled production bundle (HTML, CSS, JS, JSON, and all 365 local icons) ready for zero-build local viewing or Netlify Drop. |
| `saints-data.json`, `data/` | **Tracked** | Curated 365-day hagiographical dataset and monthly JSON records (`saints-month-01.json` .. `12`). |
| `public/icons/` | **Tracked** | All 365 locally archived sacred icon images (`saint-01-01.jpg` through `saint-12-31.jpg`). |
| `scripts/` | **Tracked** | Two-stage ETL curation pipeline (`scripts/build-saints-data.js`) and icon verification utilities. |
| `package.json`, `package-lock.json` | **Tracked** | Deterministic dependency manifest for `npm install`. |
| `.env.example` | **Tracked** | Safe template showing the required `GEMINI_API_KEY=your_api_key_here` variable without exposing secrets. |
| `.env`, `.env.*` | **Ignored** | Contains your private `GEMINI_API_KEY`. Excluded via `.gitignore` so API credentials are never leaked. |
| `node_modules/` | **Ignored** | Heavy third-party package binaries; recreated locally via `npm install`. |
| `cache/`, `tmp/`, `data/raw-*.json` | **Ignored** | Temporary raw API responses and intermediate scrape caches. |
| `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/` | **Ignored** | OS-specific filesystem metadata and personal IDE settings. |

---

## 5. Full Year Liturgical Calendar Summary (2026)

```text
========================================================================
MONTH       DAYS   OFFSET (2026)   ROWS NEEDED   ICONS & DATA STATUS
========================================================================
January     31     Thursday (4)    5 Rows (35)   ✓ Complete (31/31)
February    28     Sunday (0)      5 Rows (28)   ✓ Complete (28/28)
March       31     Sunday (0)      5 Rows (31)   ✓ Complete (31/31)
April       30     Wednesday (3)   5 Rows (33)   ✓ Complete (30/30)
May         31     Friday (5)      6 Rows (36)   ✓ Complete (31/31)
June        30     Monday (1)      5 Rows (31)   ✓ Complete (30/30)
July        31     Wednesday (3)   5 Rows (34)   ✓ Complete (31/31)
August      31     Saturday (6)    6 Rows (37)   ✓ Complete (31/31)
September   30     Tuesday (2)     5 Rows (32)   ✓ Complete (30/30)
October     31     Thursday (4)    5 Rows (35)   ✓ Complete (31/31)
November    30     Sunday (0)      5 Rows (30)   ✓ Complete (30/30)
December    31     Tuesday (2)     5 Rows (33)   ✓ Complete (31/31)
========================================================================
TOTAL: 365 Days (125 Martyrs, 240 Venerable/Confessors) • 365 Local Icons
```
