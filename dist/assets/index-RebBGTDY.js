(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[`JANUARY`,`FEBRUARY`,`MARCH`,`APRIL`,`MAY`,`JUNE`,`JULY`,`AUGUST`,`SEPTEMBER`,`OCTOBER`,`NOVEMBER`,`DECEMBER`],t=new Date,n=t.getMonth()+1,r=t.getDate(),i={saints:[],selectedSaintId:null,todaySaintId:null,activeMonth:n,activeYear:2026,isGalleryOpen:!1,isAboutOpen:!1,filters:{martyr:`all`,tradition:`all`,searchQuery:``}},a={calendarGrid:document.getElementById(`calendar-grid`),dossierContent:document.getElementById(`dossier-content`),searchInput:document.getElementById(`saint-search-input`),searchClearBtn:document.getElementById(`search-clear-btn`),todayGalleryBtn:document.getElementById(`today-gallery-btn`),todayGalleryBtnLabel:document.getElementById(`today-gallery-btn-label`),aboutBtn:document.getElementById(`about-btn`),aboutModal:document.getElementById(`about-modal`),aboutBackdrop:document.getElementById(`about-backdrop`),aboutCloseBtn:document.getElementById(`about-close-btn`),prevMonthBtn:document.getElementById(`prev-month-btn`),nextMonthBtn:document.getElementById(`next-month-btn`),monthSelect:document.getElementById(`month-select`),currentMonthName:document.getElementById(`current-month-name`),filterButtons:document.querySelectorAll(`.chip-btn`),galleryModal:document.getElementById(`gallery-modal`),galleryBackdrop:document.getElementById(`gallery-backdrop`),galleryCloseBtn:document.getElementById(`gallery-close-btn`),galleryPrevBtn:document.getElementById(`gallery-prev-btn`),galleryNextBtn:document.getElementById(`gallery-next-btn`),galleryStage:document.getElementById(`gallery-stage`)};function o(e,t){return`
    <div class="byzantine-svg-fallback" title="${e}">
      <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <!-- Byzantine Arch Frame -->
        <path d="M 10 115 L 10 45 Q 10 10 50 10 Q 90 10 90 45 L 90 115 Z" 
              fill="#181822" stroke="url(#gold-gradient)" stroke-width="2.5"/>
        <path d="M 14 113 L 14 46 Q 14 14 50 14 Q 86 14 86 46 L 86 113 Z" 
              fill="none" stroke="${t?`#B71C1C`:`#D4AF37`}" stroke-width="0.8" stroke-dasharray="2,2"/>
        
        <!-- Ornate Byzantine Halo -->
        <circle cx="50" cy="50" r="24" fill="${t?`rgba(183, 28, 28, 0.4)`:`rgba(212, 175, 55, 0.4)`}" stroke="url(#gold-gradient)" stroke-width="1.5"/>
        <circle cx="50" cy="50" r="21" fill="none" stroke="rgba(245, 215, 127, 0.6)" stroke-width="0.5" stroke-dasharray="1.5,1.5"/>
        
        <!-- Byzantine Cross at Top of Arch -->
        <path d="M 48 5 h 4 v 4 h -4 z M 46 9 h 8 v 3 h -8 z M 48 12 h 4 v 5 h -4 z" fill="url(#gold-gradient)"/>
        
        <!-- Sacred Saint Silhouette -->
        <circle cx="50" cy="46" r="11" fill="url(#gold-gradient)"/>
        <path d="M 33 80 Q 50 64 67 80 L 73 110 L 27 110 Z" fill="#242330" stroke="url(#gold-gradient)" stroke-width="1"/>
        <path d="M 36 82 Q 50 68 64 82 L 68 108 L 32 108 Z" fill="#2E2B3E"/>
        
        <!-- Monogram / Greek Initials -->
        <text x="50" y="98" font-family="'Cinzel Decorative', 'Cinzel', serif" font-size="10" font-weight="bold" 
              fill="url(#gold-gradient)" text-anchor="middle" letter-spacing="1.5">${e.split(` `).filter(e=>![`Saint`,`Our`,`Holy`,`Mother`,`Righteous`,`Blessed`,`Venerable`].includes(e)).map(e=>e[0]).slice(0,2).join(``)||`ἉΓ`}</text>
      </svg>
    </div>
  `}async function s(){for(let e of[`/saints-data.json`,`saints-data.json`,`/data/saints.json`,`data/saints.json`,`./data/saints.json`])try{let t=await fetch(e);if(t.ok){let o=await t.json();if(Array.isArray(o)&&o.length>0){console.log(`[HagioCalendar] Loaded ${o.length} saints from ${e}`),i.saints=o;let t=o.find(e=>e.month===n&&e.day===r)||o.find(e=>e.month===n)||o[0];i.todaySaintId=t.id,i.selectedSaintId=t.id,i.activeMonth=t.month,a.todayGalleryBtnLabel&&t&&(a.todayGalleryBtnLabel.textContent=`Today's Gallery (${t.date})`);return}}}catch{}throw Error(`Failed to load saints data from candidate endpoints.`)}function c(e=!1){let{martyr:t,tradition:n,searchQuery:r}=i.filters,a=r.trim().toLowerCase();return i.saints.filter(r=>{if(e&&r.month!==i.activeMonth||t===`martyr`&&!r.isMartyr||t===`non-martyr`&&r.isMartyr||n!==`all`&&r.tradition!==n)return!1;if(a){let e=(r.name||``).toLowerCase().includes(a),t=(r.mannerOfDeath||``).toLowerCase().includes(a),n=(r.title||``).toLowerCase().includes(a),i=(r.curatedBio||``).toLowerCase().includes(a),o=(r.date||``).toLowerCase().includes(a);if(!e&&!t&&!n&&!i&&!o)return!1}return!0})}function l(t,n=null){if(t<1&&(t=12),t>12&&(t=1),i.activeMonth=t,a.monthSelect&&(a.monthSelect.value=String(t)),a.currentMonthName&&(a.currentMonthName.textContent=e[t-1]),n)i.selectedSaintId=n;else{let e=i.saints.find(e=>e.id===i.selectedSaintId);if(!e||e.month!==i.activeMonth){let e=i.saints.find(e=>e.month===i.activeMonth);e&&(i.selectedSaintId=e.id)}}u(),d(),y()}function u(){let e=i.activeYear,t=i.activeMonth,n=t-1,r=new Date(e,n,1).getDay(),s=r+new Date(e,t,0).getDate(),l=Math.max(5,Math.ceil(s/7));a.calendarGrid.style.setProperty(`--grid-rows`,l),a.calendarGrid.setAttribute(`data-rows`,l),l===6?a.calendarGrid.style.setProperty(`--grid-gap`,`4px`):a.calendarGrid.style.setProperty(`--grid-gap`,`6px`);let u=i.saints.filter(e=>e.month===t),d=c(!1),f=new Set(d.map(e=>e.id));a.calendarGrid.innerHTML=``;for(let e=0;e<r;e++){let e=document.createElement(`div`);e.className=`day-cell offset-empty`,e.setAttribute(`aria-hidden`,`true`),a.calendarGrid.appendChild(e)}u.forEach(e=>{let t=e.id===i.selectedSaintId,n=e.id===i.todaySaintId,r=f.has(e.id),s=document.createElement(`div`);s.className=`day-cell ${t?`active-selected`:``} ${n?`today-cell`:``} ${r?``:`dimmed`}`,s.setAttribute(`role`,`gridcell`),s.setAttribute(`tabindex`,`0`),s.setAttribute(`aria-selected`,t?`true`:`false`),n&&s.setAttribute(`aria-current`,`date`),s.setAttribute(`aria-label`,`${e.date}${n?` (Today)`:``}: ${e.name}, ${e.isMartyr?`Martyr`:`Venerable`}`);let c=String(e.day).padStart(2,`0`),l=n?`<span class="cell-today-pill" title="Current Day">TODAY</span>`:``,u=e.isMartyr?`<span class="cell-status-badge martyr-badge" title="Holy Martyr">MARTYR</span>`:`<span class="cell-status-badge venerable-badge" title="Venerable Confessor">VENERABLE</span>`,d=e.isMartyr?`manner-martyr`:`manner-venerable`,p=o(e.name,e.isMartyr);s.innerHTML=`
      <div class="cell-top-bar">
        <span class="cell-date-group">
          <span class="cell-date-num">${c}</span>
          ${l}
        </span>
        ${u}
      </div>
      <div class="cell-content">
        <div class="cell-thumb-wrapper">
          ${e.image?.url?`
            <img class="cell-thumb-img" 
                 src="${e.image.url}" 
                 alt="${e.name} icon" 
                 loading="lazy" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div style="display:none; width:100%; height:100%;">
              ${p}
            </div>
          `:p}
        </div>
        <div class="cell-text-details">
          <div class="cell-saint-name" title="${e.name}">${e.name}</div>
          <div class="cell-manner-tag ${d}" title="Cause of death: ${e.mannerOfDeath}">${e.mannerOfDeath}</div>
        </div>
      </div>
    `,s.addEventListener(`click`,()=>v(e.id)),s.addEventListener(`keydown`,t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),v(e.id))}),a.calendarGrid.appendChild(s)})}function d(){let e=i.saints.find(e=>e.id===i.selectedSaintId);if(!e){a.dossierContent.innerHTML=`
      <div class="dossier-empty-state">
        <div class="empty-halo-ornament"></div>
        <p>Select a holy saint from the calendar to inspect her hagiographical dossier.</p>
      </div>
    `;return}let t=(e.tradition||`shared`).toLowerCase().replace(/\s+/g,`-`),n=o(e.name,e.isMartyr);a.dossierContent.innerHTML=`
    <!-- High-Resolution Ornate Arch Icon Frame (Click to Open Gallery Mode) -->
    <div class="dossier-icon-section">
      <div class="dossier-arch-frame clickable-gallery-trigger" 
           id="dossier-picture-trigger" 
           role="button" 
           tabindex="0" 
           aria-label="Open magnified gallery view for ${e.name}"
           title="Click to magnify in Gallery Mode">
        ${e.image?.url?`
          <img class="dossier-icon-img" 
               src="${e.image.url}" 
               alt="${e.name} sacred iconography" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div style="display:none; width:100%; height:100%;">
            ${n}
          </div>
        `:n}
        <div class="dossier-zoom-hint" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2V7z"/>
          </svg>
          <span>Gallery View</span>
        </div>
      </div>
      <div class="dossier-icon-caption">
        <span class="caption-title">${e.image?.title||e.name}</span>
        <span class="caption-source">Source: ${e.image?.source||`Wikimedia Commons`}</span>
      </div>
      <!-- Prominent Cause of Death Badge (Directly Under Picture, Before Text) -->
      <div class="dossier-under-icon-bar">
        <div class="dossier-tradition-badge ${t}">
          ${e.tradition} Tradition
        </div>
        <div class="dossier-cause-death-badge ${e.isMartyr?`martyr-badge`:`venerable-badge`}" title="Cause of Death: ${e.mannerOfDeath}">
          <span class="cause-badge-icon" aria-hidden="true">${e.isMartyr?`✠`:`✦`}</span>
          <span class="cause-badge-label">CAUSE OF DEATH:</span>
          <span class="cause-badge-value">${e.mannerOfDeath}</span>
        </div>
      </div>
    </div>

    <!-- Header & Canonical Titles -->
    <div class="dossier-header">
      <div class="dossier-meta-row">
        <span class="dossier-feast-date">FEAST DAY: ${e.date}</span>
        <span class="dossier-martyrdom-status ${e.isMartyr?`status-martyr`:`status-venerable`}">
          ${e.isMartyr?`✠ HOLY MARTYR`:`✦ VENERABLE CONFESSOR`}
        </span>
      </div>
      <h2 class="dossier-saint-name">${e.name}</h2>
      <div class="dossier-canonical-title">${e.title}</div>
    </div>

    <!-- Death & Martyrdom Callout Box -->
    <div class="dossier-death-callout ${e.isMartyr?`martyr-callout`:`venerable-callout`}">
      <div class="callout-title-row">
        <span class="callout-heading">${e.isMartyr?`✠ HOLY MARTYRDOM`:`✦ VENERABLE REPOSE`}</span>
        <span class="callout-manner-pill">${e.mannerOfDeath}</span>
      </div>
      <p class="callout-summary-text">${e.deathSummary}</p>
    </div>

    <!-- Curated Mini-Biography Section -->
    <div class="dossier-bio-section">
      <h3 class="bio-section-title">Hagiographical Account</h3>
      <p class="bio-text">${e.curatedBio}</p>
    </div>

    <!-- Verified Scholarly Sources Section -->
    <div class="dossier-sources-section">
      <h4 class="sources-heading">Verified Scholarly & Ecclesiastical Sources</h4>
      <ul class="sources-link-list">
        ${e.sources&&e.sources.length>0?e.sources.map(e=>`
              <li>
                <a href="${e.url}" target="_blank" rel="noopener noreferrer" class="source-item-link">
                  <span class="verified-dot-tag"></span>
                  <span>${e.label}</span>
                  <span aria-hidden="true" style="font-size:0.65rem; opacity:0.8;">↗</span>
                </a>
              </li>
            `).join(``):`<li style="font-family:var(--font-sans); font-size:0.75rem; color:var(--ivory-muted);">Liturgical Synaxarion Record</li>`}
      </ul>
    </div>
  `;let r=document.getElementById(`dossier-picture-trigger`);r&&(r.addEventListener(`click`,()=>f(e.id)),r.addEventListener(`keydown`,t=>{(t.key===`Enter`||t.key===` `)&&(t.preventDefault(),f(e.id))}))}function f(e=i.selectedSaintId){e&&e!==i.selectedSaintId&&v(e),i.isGalleryOpen=!0,a.galleryModal&&(a.galleryModal.hidden=!1),_()}function p(){i.isGalleryOpen=!1,a.galleryModal&&(a.galleryModal.hidden=!0)}function m(){i.isAboutOpen=!0,a.aboutModal&&(a.aboutModal.hidden=!1)}function h(){i.isAboutOpen=!1,a.aboutModal&&(a.aboutModal.hidden=!0)}function g(e){let t=i.saints.findIndex(e=>e.id===i.selectedSaintId);if(t===-1)return;let n=(t+e+i.saints.length)%i.saints.length;v(i.saints[n].id),i.isGalleryOpen&&_()}function _(){if(!a.galleryStage)return;let e=i.saints.findIndex(e=>e.id===i.selectedSaintId),t=i.saints[e];if(!t)return;let n=i.saints[(e-1+i.saints.length)%i.saints.length],r=i.saints[(e+1)%i.saints.length],s=t.id===i.todaySaintId,c=(t.tradition||`shared`).toLowerCase().replace(/\s+/g,`-`),l=o(t.name,t.isMartyr);a.galleryPrevBtn&&n&&(a.galleryPrevBtn.title=`Previous Day: ${n.date} — ${n.name}`),a.galleryNextBtn&&r&&(a.galleryNextBtn.title=`Next Day: ${r.date} — ${r.name}`),a.galleryStage.innerHTML=`
    <div class="gallery-image-showcase">
      <div class="gallery-ornate-frame ${t.isMartyr?`frame-martyr`:`frame-venerable`}">
        ${t.image?.url?`
          <img class="gallery-magnified-img" 
               src="${t.image.url}" 
               alt="${t.name} magnified sacred icon" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div style="display:none; width:320px; height:400px;">
            ${l}
          </div>
        `:`<div style="width:320px; height:400px;">${l}</div>`}
      </div>
    </div>

    <div class="gallery-info-panel">
      <div class="gallery-meta-pills">
        <span class="gallery-feast-pill">
          FEAST DAY: ${t.date.toUpperCase()}
          ${s?`<strong class="gallery-today-tag">• TODAY</strong>`:``}
        </span>
        <span class="dossier-tradition-badge ${c}">${t.tradition} Tradition</span>
        <span class="dossier-cause-death-badge ${t.isMartyr?`martyr-badge`:`venerable-badge`}">
          <span class="cause-badge-icon" aria-hidden="true">${t.isMartyr?`✠`:`✦`}</span>
          <span class="cause-badge-label">CAUSE OF DEATH:</span>
          <span class="cause-badge-value">${t.mannerOfDeath}</span>
        </span>
      </div>

      <h2 class="gallery-saint-name">${t.name}</h2>
      <div class="gallery-saint-title">${t.title}</div>

      <div class="gallery-step-bar">
        <button type="button" class="gallery-step-pill" id="gallery-inline-prev">
          &larr; ${n.date}: ${n.name}
        </button>
        <span class="gallery-day-counter">Day ${e+1} of ${i.saints.length}</span>
        <button type="button" class="gallery-step-pill" id="gallery-inline-next">
          ${r.date}: ${r.name} &rarr;
        </button>
      </div>
    </div>
  `;let u=document.getElementById(`gallery-inline-prev`),d=document.getElementById(`gallery-inline-next`);u&&u.addEventListener(`click`,()=>g(-1)),d&&d.addEventListener(`click`,()=>g(1))}function v(t){i.selectedSaintId=t;let n=i.saints.find(e=>e.id===t);n&&n.month!==i.activeMonth&&(i.activeMonth=n.month,a.monthSelect&&(a.monthSelect.value=String(n.month)),a.currentMonthName&&(a.currentMonthName.textContent=e[n.month-1])),u(),d(),y()}function y(){let e=new URL(window.location);i.selectedSaintId&&e.searchParams.set(`saint`,i.selectedSaintId),i.activeMonth===n?e.searchParams.delete(`month`):e.searchParams.set(`month`,i.activeMonth),window.history.replaceState({},``,e)}function b(){a.todayGalleryBtn&&a.todayGalleryBtn.addEventListener(`click`,()=>{i.todaySaintId?f(i.todaySaintId):i.selectedSaintId&&f(i.selectedSaintId)}),a.aboutBtn&&a.aboutBtn.addEventListener(`click`,m),a.aboutCloseBtn&&a.aboutCloseBtn.addEventListener(`click`,h),a.aboutBackdrop&&a.aboutBackdrop.addEventListener(`click`,h),a.galleryCloseBtn&&a.galleryCloseBtn.addEventListener(`click`,p),a.galleryBackdrop&&a.galleryBackdrop.addEventListener(`click`,p),a.galleryPrevBtn&&a.galleryPrevBtn.addEventListener(`click`,()=>g(-1)),a.galleryNextBtn&&a.galleryNextBtn.addEventListener(`click`,()=>g(1)),a.monthSelect&&a.monthSelect.addEventListener(`change`,e=>{l(parseInt(e.target.value,10))}),a.prevMonthBtn.addEventListener(`click`,()=>{l(i.activeMonth-1)}),a.nextMonthBtn.addEventListener(`click`,()=>{l(i.activeMonth+1)}),a.filterButtons.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.filter,n=e.dataset.val;e.closest(`.filter-group`).querySelectorAll(`.chip-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),i.filters[t]=n,u()})});let e;a.searchInput.addEventListener(`input`,t=>{clearTimeout(e);let n=t.target.value;a.searchClearBtn.style.display=n?`block`:`none`,e=setTimeout(()=>{i.filters.searchQuery=n;let e=c(!1);e.length>0&&!e.some(e=>e.id===i.selectedSaintId)?v(e[0].id):u()},150)}),a.searchClearBtn.addEventListener(`click`,()=>{a.searchInput.value=``,a.searchClearBtn.style.display=`none`,i.filters.searchQuery=``,u(),a.searchInput.focus()}),window.addEventListener(`keydown`,e=>{if(e.key===`Escape`){if(i.isAboutOpen){h();return}if(i.isGalleryOpen){p();return}}[`INPUT`,`TEXTAREA`,`SELECT`].includes(document.activeElement?.tagName)||i.isAboutOpen||i.saints.findIndex(e=>e.id===i.selectedSaintId)!==-1&&(e.key===`ArrowRight`||e.key===`ArrowDown`?(e.preventDefault(),g(1)):e.key===`ArrowLeft`||e.key===`ArrowUp`?(e.preventDefault(),g(-1)):e.key===`Escape`&&(a.searchInput.value=``,a.searchClearBtn.style.display=`none`,i.filters.searchQuery=``,u()))})}async function x(){try{await s(),b();let t=new URLSearchParams(window.location.search),n=t.get(`saint`),r=parseInt(t.get(`month`),10),o=t.get(`martyr`),c=t.get(`tradition`),l=t.get(`search`);if(o&&(i.filters.martyr=o,document.querySelectorAll(`[data-filter="martyr"]`).forEach(e=>{e.classList.toggle(`active`,e.dataset.val===o)})),c&&(i.filters.tradition=c,document.querySelectorAll(`[data-filter="tradition"]`).forEach(e=>{e.classList.toggle(`active`,e.dataset.val===c)})),l&&(i.filters.searchQuery=l,a.searchInput.value=l,a.searchClearBtn.style.display=`block`),n&&i.saints.some(e=>e.id===n)){let e=i.saints.find(e=>e.id===n);i.selectedSaintId=n,i.activeMonth=e.month}else if(r>=1&&r<=12){i.activeMonth=r;let e=i.saints.find(e=>e.month===r);e&&(i.selectedSaintId=e.id)}a.monthSelect&&(a.monthSelect.value=String(i.activeMonth)),a.currentMonthName&&(a.currentMonthName.textContent=e[i.activeMonth-1]),u(),d()}catch(e){console.error(`[HagioCalendar] Initialization failed:`,e),a.calendarGrid.innerHTML=`
      <div style="grid-column: 1 / -1; padding: 2rem; color: #FF8A80; text-align: center;">
        <h3>Ecclesiastical Calendar Load Error</h3>
        <p>${e.message}</p>
      </div>
    `}}x();