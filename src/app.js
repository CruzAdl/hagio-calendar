/**
 * src/app.js
 * Frontend application for "The Hagiography & Iconography Calendar of Female Saints"
 * Full 365-Day Liturgical Calendar (2026)
 */

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// Current Date Detection
const now = new Date();
const TODAY_MONTH = now.getMonth() + 1; // 1-12
const TODAY_DAY = now.getDate(); // 1-31

// Application State
const state = {
  saints: [],
  selectedSaintId: null,
  todaySaintId: null,
  activeMonth: TODAY_MONTH, // Default to current month
  activeYear: 2026,
  isGalleryOpen: false,
  filters: {
    martyr: 'all', // 'all' | 'martyr' | 'non-martyr'
    tradition: 'all', // 'all' | 'Eastern Orthodox' | 'Catholic' | 'Shared'
    searchQuery: ''
  }
};

// DOM Elements Cache
const elements = {
  calendarGrid: document.getElementById('calendar-grid'),
  dossierContent: document.getElementById('dossier-content'),
  searchInput: document.getElementById('saint-search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  todayGalleryBtn: document.getElementById('today-gallery-btn'),
  todayGalleryBtnLabel: document.getElementById('today-gallery-btn-label'),
  prevMonthBtn: document.getElementById('prev-month-btn'),
  nextMonthBtn: document.getElementById('next-month-btn'),
  monthSelect: document.getElementById('month-select'),
  currentMonthName: document.getElementById('current-month-name'),
  filterButtons: document.querySelectorAll('.chip-btn'),
  galleryModal: document.getElementById('gallery-modal'),
  galleryBackdrop: document.getElementById('gallery-backdrop'),
  galleryCloseBtn: document.getElementById('gallery-close-btn'),
  galleryPrevBtn: document.getElementById('gallery-prev-btn'),
  galleryNextBtn: document.getElementById('gallery-next-btn'),
  galleryStage: document.getElementById('gallery-stage')
};

/**
 * Generate an ornate SVG Byzantine Icon Frame Fallback
 */
function createByzantineSvgFallback(saintName, isMartyr) {
  const accentColor = isMartyr ? '#B71C1C' : '#D4AF37';
  const haloColor = isMartyr ? 'rgba(183, 28, 28, 0.4)' : 'rgba(212, 175, 55, 0.4)';
  const initials = saintName.split(' ')
    .filter(w => !['Saint', 'Our', 'Holy', 'Mother', 'Righteous', 'Blessed', 'Venerable'].includes(w))
    .map(w => w[0])
    .slice(0, 2)
    .join('') || 'ἉΓ';

  return `
    <div class="byzantine-svg-fallback" title="${saintName}">
      <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <!-- Byzantine Arch Frame -->
        <path d="M 10 115 L 10 45 Q 10 10 50 10 Q 90 10 90 45 L 90 115 Z" 
              fill="#181822" stroke="url(#gold-gradient)" stroke-width="2.5"/>
        <path d="M 14 113 L 14 46 Q 14 14 50 14 Q 86 14 86 46 L 86 113 Z" 
              fill="none" stroke="${accentColor}" stroke-width="0.8" stroke-dasharray="2,2"/>
        
        <!-- Ornate Byzantine Halo -->
        <circle cx="50" cy="50" r="24" fill="${haloColor}" stroke="url(#gold-gradient)" stroke-width="1.5"/>
        <circle cx="50" cy="50" r="21" fill="none" stroke="rgba(245, 215, 127, 0.6)" stroke-width="0.5" stroke-dasharray="1.5,1.5"/>
        
        <!-- Byzantine Cross at Top of Arch -->
        <path d="M 48 5 h 4 v 4 h -4 z M 46 9 h 8 v 3 h -8 z M 48 12 h 4 v 5 h -4 z" fill="url(#gold-gradient)"/>
        
        <!-- Sacred Saint Silhouette -->
        <circle cx="50" cy="46" r="11" fill="url(#gold-gradient)"/>
        <path d="M 33 80 Q 50 64 67 80 L 73 110 L 27 110 Z" fill="#242330" stroke="url(#gold-gradient)" stroke-width="1"/>
        <path d="M 36 82 Q 50 68 64 82 L 68 108 L 32 108 Z" fill="#2E2B3E"/>
        
        <!-- Monogram / Greek Initials -->
        <text x="50" y="98" font-family="'Cinzel Decorative', 'Cinzel', serif" font-size="10" font-weight="bold" 
              fill="url(#gold-gradient)" text-anchor="middle" letter-spacing="1.5">${initials}</text>
      </svg>
    </div>
  `;
}

/**
 * Fetch saints data from candidate endpoints
 */
async function loadSaintsData() {
  const candidateUrls = [
    '/saints-data.json',
    'saints-data.json',
    '/data/saints.json',
    'data/saints.json',
    './data/saints.json'
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`[HagioCalendar] Loaded ${data.length} saints from ${url}`);
          state.saints = data;

          // Identify current calendar day saint
          const todaySaint = data.find(s => s.month === TODAY_MONTH && s.day === TODAY_DAY)
            || data.find(s => s.month === TODAY_MONTH)
            || data[0];

          state.todaySaintId = todaySaint.id;
          state.selectedSaintId = todaySaint.id;
          state.activeMonth = todaySaint.month;

          if (elements.todayGalleryBtnLabel && todaySaint) {
            elements.todayGalleryBtnLabel.textContent = `Today's Gallery (${todaySaint.date})`;
          }
          return;
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  throw new Error('Failed to load saints data from candidate endpoints.');
}

/**
 * Filter Saints based on Active Filters & Search
 */
function getFilteredSaints(forActiveMonthOnly = false) {
  const { martyr, tradition, searchQuery } = state.filters;
  const q = searchQuery.trim().toLowerCase();

  return state.saints.filter(saint => {
    if (forActiveMonthOnly && saint.month !== state.activeMonth) return false;

    // Martyr Filter
    if (martyr === 'martyr' && !saint.isMartyr) return false;
    if (martyr === 'non-martyr' && saint.isMartyr) return false;

    // Tradition Filter
    if (tradition !== 'all' && saint.tradition !== tradition) return false;

    // Search Query (Saint Name, Manner of Death, Title, Bio, Date)
    if (q) {
      const matchName = (saint.name || '').toLowerCase().includes(q);
      const matchManner = (saint.mannerOfDeath || '').toLowerCase().includes(q);
      const matchTitle = (saint.title || '').toLowerCase().includes(q);
      const matchBio = (saint.curatedBio || '').toLowerCase().includes(q);
      const matchDate = (saint.date || '').toLowerCase().includes(q);
      if (!matchName && !matchManner && !matchTitle && !matchBio && !matchDate) return false;
    }

    return true;
  });
}

/**
 * Switch Active Month
 */
function setMonth(monthNum, targetSaintId = null) {
  if (monthNum < 1) monthNum = 12;
  if (monthNum > 12) monthNum = 1;
  state.activeMonth = monthNum;

  // Sync Dropdown / Display
  if (elements.monthSelect) {
    elements.monthSelect.value = String(monthNum);
  }
  if (elements.currentMonthName) {
    elements.currentMonthName.textContent = MONTH_NAMES[monthNum - 1];
  }

  // Choose selection
  if (targetSaintId) {
    state.selectedSaintId = targetSaintId;
  } else {
    const currentSaint = state.saints.find(s => s.id === state.selectedSaintId);
    if (!currentSaint || currentSaint.month !== state.activeMonth) {
      const firstOfMonth = state.saints.find(s => s.month === state.activeMonth);
      if (firstOfMonth) {
        state.selectedSaintId = firstOfMonth.id;
      }
    }
  }

  renderCalendarGrid();
  renderInspectorDossier();
  updateUrlParams();
}

/**
 * Render 7-Column Calendar Grid for the Active Month
 */
function renderCalendarGrid() {
  const year = state.activeYear;
  const monthNum = state.activeMonth;
  const monthIdx = monthNum - 1;

  // Calculate day-of-week offset for the 1st of this month in 2026 (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayWeekdayOffset = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const totalCells = firstDayWeekdayOffset + daysInMonth;
  const neededRows = Math.max(5, Math.ceil(totalCells / 7)); // 5 or 6 rows

  // Apply dynamic CSS grid rows and gap
  elements.calendarGrid.style.setProperty('--grid-rows', neededRows);
  elements.calendarGrid.setAttribute('data-rows', neededRows);
  if (neededRows === 6) {
    elements.calendarGrid.style.setProperty('--grid-gap', '4px');
  } else {
    elements.calendarGrid.style.setProperty('--grid-gap', '6px');
  }

  // Saints for active month
  const monthSaints = state.saints.filter(s => s.month === monthNum);

  // Filtered saints
  const allFiltered = getFilteredSaints(false);
  const filteredIds = new Set(allFiltered.map(s => s.id));

  elements.calendarGrid.innerHTML = '';

  // Render Offset Empty Cells
  for (let i = 0; i < firstDayWeekdayOffset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell offset-empty';
    emptyCell.setAttribute('aria-hidden', 'true');
    elements.calendarGrid.appendChild(emptyCell);
  }

  // Render Day Cells for Active Month
  monthSaints.forEach(saint => {
    const isSelected = saint.id === state.selectedSaintId;
    const isToday = saint.id === state.todaySaintId;
    const isMatch = filteredIds.has(saint.id);

    const cell = document.createElement('div');
    cell.className = `day-cell ${isSelected ? 'active-selected' : ''} ${isToday ? 'today-cell' : ''} ${!isMatch ? 'dimmed' : ''}`;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    if (isToday) {
      cell.setAttribute('aria-current', 'date');
    }
    cell.setAttribute('aria-label', `${saint.date}${isToday ? ' (Today)' : ''}: ${saint.name}, ${saint.isMartyr ? 'Martyr' : 'Venerable'}`);

    const padDay = String(saint.day).padStart(2, '0');
    const todayBadgeHtml = isToday ? `<span class="cell-today-pill" title="Current Day">TODAY</span>` : '';
    const statusBadgeHtml = saint.isMartyr
      ? `<span class="cell-status-badge martyr-badge" title="Holy Martyr">MARTYR</span>`
      : `<span class="cell-status-badge venerable-badge" title="Venerable Confessor">VENERABLE</span>`;

    const mannerClass = saint.isMartyr ? 'manner-martyr' : 'manner-venerable';
    const svgFallbackHtml = createByzantineSvgFallback(saint.name, saint.isMartyr);

    cell.innerHTML = `
      <div class="cell-top-bar">
        <span class="cell-date-group">
          <span class="cell-date-num">${padDay}</span>
          ${todayBadgeHtml}
        </span>
        ${statusBadgeHtml}
      </div>
      <div class="cell-content">
        <div class="cell-thumb-wrapper">
          ${saint.image?.url ? `
            <img class="cell-thumb-img" 
                 src="${saint.image.url}" 
                 alt="${saint.name} icon" 
                 loading="lazy" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div style="display:none; width:100%; height:100%;">
              ${svgFallbackHtml}
            </div>
          ` : svgFallbackHtml}
        </div>
        <div class="cell-text-details">
          <div class="cell-saint-name" title="${saint.name}">${saint.name}</div>
          <div class="cell-manner-tag ${mannerClass}" title="Cause of death: ${saint.mannerOfDeath}">${saint.mannerOfDeath}</div>
        </div>
      </div>
    `;

    // Click & Keyboard Selection Handler
    cell.addEventListener('click', () => selectSaint(saint.id));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectSaint(saint.id);
      }
    });

    elements.calendarGrid.appendChild(cell);
  });
}

/**
 * Render Right Pane Inspector Dossier for Selected Saint
 */
function renderInspectorDossier() {
  const saint = state.saints.find(s => s.id === state.selectedSaintId);

  if (!saint) {
    elements.dossierContent.innerHTML = `
      <div class="dossier-empty-state">
        <div class="empty-halo-ornament"></div>
        <p>Select a holy saint from the calendar to inspect her hagiographical dossier.</p>
      </div>
    `;
    return;
  }

  const traditionClass = (saint.tradition || 'shared').toLowerCase().replace(/\s+/g, '-');
  const svgFallbackHtml = createByzantineSvgFallback(saint.name, saint.isMartyr);

  elements.dossierContent.innerHTML = `
    <!-- High-Resolution Ornate Arch Icon Frame (Click to Open Gallery Mode) -->
    <div class="dossier-icon-section">
      <div class="dossier-arch-frame clickable-gallery-trigger" 
           id="dossier-picture-trigger" 
           role="button" 
           tabindex="0" 
           aria-label="Open magnified gallery view for ${saint.name}"
           title="Click to magnify in Gallery Mode">
        ${saint.image?.url ? `
          <img class="dossier-icon-img" 
               src="${saint.image.url}" 
               alt="${saint.name} sacred iconography" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div style="display:none; width:100%; height:100%;">
            ${svgFallbackHtml}
          </div>
        ` : svgFallbackHtml}
        <div class="dossier-zoom-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2V7z"/>
          </svg>
          <span>Gallery View</span>
        </div>
      </div>
      <div class="dossier-icon-caption">
        <span class="caption-title">${saint.image?.title || saint.name}</span>
        <span class="caption-source">Source: ${saint.image?.source || 'Wikimedia Commons'}</span>
      </div>
      <!-- Prominent Cause of Death Badge (Directly Under Picture, Before Text) -->
      <div class="dossier-under-icon-bar">
        <div class="dossier-tradition-badge ${traditionClass}">
          ${saint.tradition} Tradition
        </div>
        <div class="dossier-cause-death-badge ${saint.isMartyr ? 'martyr-badge' : 'venerable-badge'}" title="Cause of Death: ${saint.mannerOfDeath}">
          <span class="cause-badge-icon" aria-hidden="true">${saint.isMartyr ? '✠' : '✦'}</span>
          <span class="cause-badge-label">CAUSE OF DEATH:</span>
          <span class="cause-badge-value">${saint.mannerOfDeath}</span>
        </div>
      </div>
    </div>

    <!-- Header & Canonical Titles -->
    <div class="dossier-header">
      <div class="dossier-meta-row">
        <span class="dossier-feast-date">FEAST DAY: ${saint.date}</span>
        <span class="dossier-martyrdom-status ${saint.isMartyr ? 'status-martyr' : 'status-venerable'}">
          ${saint.isMartyr ? '✠ HOLY MARTYR' : '✦ VENERABLE CONFESSOR'}
        </span>
      </div>
      <h2 class="dossier-saint-name">${saint.name}</h2>
      <div class="dossier-canonical-title">${saint.title}</div>
    </div>

    <!-- Death & Martyrdom Callout Box -->
    <div class="dossier-death-callout ${saint.isMartyr ? 'martyr-callout' : 'venerable-callout'}">
      <div class="callout-title-row">
        <span class="callout-heading">${saint.isMartyr ? '✠ HOLY MARTYRDOM' : '✦ VENERABLE REPOSE'}</span>
        <span class="callout-manner-pill">${saint.mannerOfDeath}</span>
      </div>
      <p class="callout-summary-text">${saint.deathSummary}</p>
    </div>

    <!-- Curated Mini-Biography Section -->
    <div class="dossier-bio-section">
      <h3 class="bio-section-title">Hagiographical Account</h3>
      <p class="bio-text">${saint.curatedBio}</p>
    </div>

    <!-- Verified Scholarly Sources Section -->
    <div class="dossier-sources-section">
      <h4 class="sources-heading">Verified Scholarly & Ecclesiastical Sources</h4>
      <ul class="sources-link-list">
        ${saint.sources && saint.sources.length > 0 
          ? saint.sources.map(src => `
              <li>
                <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-item-link">
                  <span class="verified-dot-tag"></span>
                  <span>${src.label}</span>
                  <span aria-hidden="true" style="font-size:0.65rem; opacity:0.8;">↗</span>
                </a>
              </li>
            `).join('')
          : '<li style="font-family:var(--font-sans); font-size:0.75rem; color:var(--ivory-muted);">Liturgical Synaxarion Record</li>'
        }
      </ul>
    </div>
  `;

  // Bind click & keyboard handler on the right-pane picture to enter Gallery Mode
  const pictureTrigger = document.getElementById('dossier-picture-trigger');
  if (pictureTrigger) {
    pictureTrigger.addEventListener('click', () => openGallery(saint.id));
    pictureTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGallery(saint.id);
      }
    });
  }
}

/**
 * Open Fullscreen Gallery Mode on a Given Saint
 */
function openGallery(saintId = state.selectedSaintId) {
  if (saintId && saintId !== state.selectedSaintId) {
    selectSaint(saintId);
  }
  state.isGalleryOpen = true;
  if (elements.galleryModal) {
    elements.galleryModal.hidden = false;
  }
  renderGalleryModal();
}

/**
 * Close Fullscreen Gallery Mode
 */
function closeGallery() {
  state.isGalleryOpen = false;
  if (elements.galleryModal) {
    elements.galleryModal.hidden = true;
  }
}

/**
 * Navigate Gallery Mode by Step (-1 for previous day, +1 for next day)
 */
function navigateGallery(step) {
  const currentIndex = state.saints.findIndex(s => s.id === state.selectedSaintId);
  if (currentIndex === -1) return;
  const nextIndex = (currentIndex + step + state.saints.length) % state.saints.length;
  selectSaint(state.saints[nextIndex].id);
  if (state.isGalleryOpen) {
    renderGalleryModal();
  }
}

/**
 * Render Magnified Saint Icon & Caption inside Gallery Mode
 */
function renderGalleryModal() {
  if (!elements.galleryStage) return;
  const currentIndex = state.saints.findIndex(s => s.id === state.selectedSaintId);
  const saint = state.saints[currentIndex];
  if (!saint) return;

  const prevSaint = state.saints[(currentIndex - 1 + state.saints.length) % state.saints.length];
  const nextSaint = state.saints[(currentIndex + 1) % state.saints.length];
  const isToday = saint.id === state.todaySaintId;
  const traditionClass = (saint.tradition || 'shared').toLowerCase().replace(/\s+/g, '-');
  const svgFallbackHtml = createByzantineSvgFallback(saint.name, saint.isMartyr);

  if (elements.galleryPrevBtn && prevSaint) {
    elements.galleryPrevBtn.title = `Previous Day: ${prevSaint.date} — ${prevSaint.name}`;
  }
  if (elements.galleryNextBtn && nextSaint) {
    elements.galleryNextBtn.title = `Next Day: ${nextSaint.date} — ${nextSaint.name}`;
  }

  elements.galleryStage.innerHTML = `
    <div class="gallery-image-showcase">
      <div class="gallery-ornate-frame ${saint.isMartyr ? 'frame-martyr' : 'frame-venerable'}">
        ${saint.image?.url ? `
          <img class="gallery-magnified-img" 
               src="${saint.image.url}" 
               alt="${saint.name} magnified sacred icon" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div style="display:none; width:320px; height:400px;">
            ${svgFallbackHtml}
          </div>
        ` : `<div style="width:320px; height:400px;">${svgFallbackHtml}</div>`}
      </div>
    </div>

    <div class="gallery-info-panel">
      <div class="gallery-meta-pills">
        <span class="gallery-feast-pill">
          FEAST DAY: ${saint.date.toUpperCase()}
          ${isToday ? '<strong class="gallery-today-tag">• TODAY</strong>' : ''}
        </span>
        <span class="dossier-tradition-badge ${traditionClass}">${saint.tradition} Tradition</span>
        <span class="dossier-cause-death-badge ${saint.isMartyr ? 'martyr-badge' : 'venerable-badge'}">
          <span class="cause-badge-icon" aria-hidden="true">${saint.isMartyr ? '✠' : '✦'}</span>
          <span class="cause-badge-label">CAUSE OF DEATH:</span>
          <span class="cause-badge-value">${saint.mannerOfDeath}</span>
        </span>
      </div>

      <h2 class="gallery-saint-name">${saint.name}</h2>
      <div class="gallery-saint-title">${saint.title}</div>

      <div class="gallery-step-bar">
        <button type="button" class="gallery-step-pill" id="gallery-inline-prev">
          &larr; ${prevSaint.date}: ${prevSaint.name}
        </button>
        <span class="gallery-day-counter">Day ${currentIndex + 1} of ${state.saints.length}</span>
        <button type="button" class="gallery-step-pill" id="gallery-inline-next">
          ${nextSaint.date}: ${nextSaint.name} &rarr;
        </button>
      </div>
    </div>
  `;

  const inlinePrev = document.getElementById('gallery-inline-prev');
  const inlineNext = document.getElementById('gallery-inline-next');
  if (inlinePrev) inlinePrev.addEventListener('click', () => navigateGallery(-1));
  if (inlineNext) inlineNext.addEventListener('click', () => navigateGallery(1));
}

/**
 * Select a Saint by ID and sync Active Month if necessary
 */
function selectSaint(saintId) {
  state.selectedSaintId = saintId;
  const saint = state.saints.find(s => s.id === saintId);

  if (saint && saint.month !== state.activeMonth) {
    state.activeMonth = saint.month;
    if (elements.monthSelect) elements.monthSelect.value = String(saint.month);
    if (elements.currentMonthName) elements.currentMonthName.textContent = MONTH_NAMES[saint.month - 1];
  }

  renderCalendarGrid();
  renderInspectorDossier();
  updateUrlParams();
}

/**
 * Update URL parameters for deep-linking
 */
function updateUrlParams() {
  const url = new URL(window.location);
  if (state.selectedSaintId) {
    url.searchParams.set('saint', state.selectedSaintId);
  }
  if (state.activeMonth !== TODAY_MONTH) {
    url.searchParams.set('month', state.activeMonth);
  } else {
    url.searchParams.delete('month');
  }
  window.history.replaceState({}, '', url);
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Top-right button: Open Gallery Mode on the Current Day's Saint
  if (elements.todayGalleryBtn) {
    elements.todayGalleryBtn.addEventListener('click', () => {
      if (state.todaySaintId) {
        openGallery(state.todaySaintId);
      } else if (state.selectedSaintId) {
        openGallery(state.selectedSaintId);
      }
    });
  }

  // Gallery Modal Controls
  if (elements.galleryCloseBtn) {
    elements.galleryCloseBtn.addEventListener('click', closeGallery);
  }
  if (elements.galleryBackdrop) {
    elements.galleryBackdrop.addEventListener('click', closeGallery);
  }
  if (elements.galleryPrevBtn) {
    elements.galleryPrevBtn.addEventListener('click', () => navigateGallery(-1));
  }
  if (elements.galleryNextBtn) {
    elements.galleryNextBtn.addEventListener('click', () => navigateGallery(1));
  }

  // Month Dropdown Select
  if (elements.monthSelect) {
    elements.monthSelect.addEventListener('change', (e) => {
      setMonth(parseInt(e.target.value, 10));
    });
  }

  // Month Navigation Buttons
  elements.prevMonthBtn.addEventListener('click', () => {
    setMonth(state.activeMonth - 1);
  });
  elements.nextMonthBtn.addEventListener('click', () => {
    setMonth(state.activeMonth + 1);
  });

  // Filter Chips Click
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterType = btn.dataset.filter;
      const filterVal = btn.dataset.val;

      const parentGroup = btn.closest('.filter-group');
      parentGroup.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.filters[filterType] = filterVal;
      renderCalendarGrid();
    });
  });

  // Search Input Handler (Debounced)
  let searchTimer;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value;
    elements.searchClearBtn.style.display = val ? 'block' : 'none';

    searchTimer = setTimeout(() => {
      state.filters.searchQuery = val;
      const filtered = getFilteredSaints(false);

      if (filtered.length > 0) {
        const currentSaintMatches = filtered.some(s => s.id === state.selectedSaintId);
        if (!currentSaintMatches) {
          selectSaint(filtered[0].id);
          return;
        }
      }
      renderCalendarGrid();
    }, 150);
  });

  // Clear Search Button
  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.style.display = 'none';
    state.filters.searchQuery = '';
    renderCalendarGrid();
    elements.searchInput.focus();
  });

  // Keyboard Navigation: Step between days with Left/Right arrows (both Calendar & Gallery Mode)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    const currentIndex = state.saints.findIndex(s => s.id === state.selectedSaintId);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      navigateGallery(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateGallery(-1);
    } else if (e.key === 'Escape') {
      if (state.isGalleryOpen) {
        closeGallery();
        return;
      }
      elements.searchInput.value = '';
      elements.searchClearBtn.style.display = 'none';
      state.filters.searchQuery = '';
      renderCalendarGrid();
    }
  });
}

/**
 * Initialize Application
 */
async function init() {
  try {
    await loadSaintsData();
    setupEventListeners();

    // Check URL Search Params for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const paramSaint = urlParams.get('saint');
    const paramMonth = parseInt(urlParams.get('month'), 10);
    const paramMartyr = urlParams.get('martyr');
    const paramTradition = urlParams.get('tradition');
    const paramSearch = urlParams.get('search');

    if (paramMartyr) {
      state.filters.martyr = paramMartyr;
      document.querySelectorAll('[data-filter="martyr"]').forEach(b => {
        b.classList.toggle('active', b.dataset.val === paramMartyr);
      });
    }

    if (paramTradition) {
      state.filters.tradition = paramTradition;
      document.querySelectorAll('[data-filter="tradition"]').forEach(b => {
        b.classList.toggle('active', b.dataset.val === paramTradition);
      });
    }

    if (paramSearch) {
      state.filters.searchQuery = paramSearch;
      elements.searchInput.value = paramSearch;
      elements.searchClearBtn.style.display = 'block';
    }

    if (paramSaint && state.saints.some(s => s.id === paramSaint)) {
      const saint = state.saints.find(s => s.id === paramSaint);
      state.selectedSaintId = paramSaint;
      state.activeMonth = saint.month;
    } else if (paramMonth >= 1 && paramMonth <= 12) {
      state.activeMonth = paramMonth;
      const firstOfMonth = state.saints.find(s => s.month === paramMonth);
      if (firstOfMonth) state.selectedSaintId = firstOfMonth.id;
    }

    if (elements.monthSelect) {
      elements.monthSelect.value = String(state.activeMonth);
    }
    if (elements.currentMonthName) {
      elements.currentMonthName.textContent = MONTH_NAMES[state.activeMonth - 1];
    }

    renderCalendarGrid();
    renderInspectorDossier();
  } catch (err) {
    console.error('[HagioCalendar] Initialization failed:', err);
    elements.calendarGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; color: #FF8A80; text-align: center;">
        <h3>Ecclesiastical Calendar Load Error</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

init();
