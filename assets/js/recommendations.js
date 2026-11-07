(() => {
  'use strict';

  const references = window.portfolioRecommendations || [];

  const clean = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const state = { locale: 'pt-BR', index: 0 };
  const linkedinUrl = (value) => (typeof value === 'string' && /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-z0-9%_-]+\/?(?:[?#].*)?$/i.test(value)) ? value : '';
  const rowLink = (item) => `recomendacoes/?lang=${encodeURIComponent(state.locale)}#${encodeURIComponent(item.id)}`;

  function renderHome() {
    const section = document.getElementById('recommendations');
    if (!section || !references.length) return;
    const t = state.copy;
    section.querySelector('[data-recs-eyebrow]').textContent = t.eyebrow;
    section.querySelector('[data-recs-title]').textContent = t.title;
    section.querySelector('[data-recs-subtitle]').textContent = t.subtitle;
    section.querySelector('[data-recs-all]').textContent = t.all;
    section.querySelector('[data-recs-prev]').setAttribute('aria-label', t.previous);
    section.querySelector('[data-recs-next]').setAttribute('aria-label', t.next);
    const track = section.querySelector('[data-recs-track]');
    track.setAttribute('aria-label', t.carousel);
    track.innerHTML = references.map((item) => {
      const entry = t.entries[item.id];
      return `
      <article class="recommendation-slide" aria-label="${clean(item.name)}">
        <div class="recommendation-slide__top"><span class="recommendation-slide__quote" aria-hidden="true">“</span><span class="recommendation-slide__tag">${clean(item.company)}</span></div>
        <p class="recommendation-slide__body">${clean(entry.summary)}</p>
        <div class="recommendation-slide__bottom">
          <div class="recommendation-person"><span class="recommendation-person__avatar" aria-hidden="true">${clean(item.name.split(' ').map((x) => x[0]).filter(Boolean).slice(0,2).join(''))}</span><div><strong>${clean(item.name)}</strong><small>${clean(entry.role)} · ${clean(item.company)}</small></div></div>
          <a class="recommendation-slide__link" href="${rowLink(item)}" aria-label="${clean(t.read)} — ${clean(item.name)}">${clean(t.read)} <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></a>
        </div>
      </article>`;
    }).join('');
    section.querySelector('[data-recs-counter]').setAttribute('aria-label', `${state.index + 1} ${t.outOf} ${references.length}`);
    state.index = Math.min(state.index, references.length - 1);
    track.scrollTo({left:state.index * track.clientWidth,behavior:'instant'});
    updateHomeIndex();
  }

  function updateHomeIndex() {
    const section = document.getElementById('recommendations');
    if (!section) return;
    const t = state.copy;
    const node = section.querySelector('[data-recs-counter]');
    node.textContent = `${String(state.index + 1).padStart(2,'0')} / ${String(references.length).padStart(2,'0')}`;
    node.setAttribute('aria-label', `${state.index + 1} ${t.outOf} ${references.length}`);
  }

  function attachHome() {
    const section = document.getElementById('recommendations');
    if (!section || section.dataset.recsBound) return;
    section.dataset.recsBound = 'true';
    const track = section.querySelector('[data-recs-track]');
    section.querySelector('[data-recs-prev]').addEventListener('click', () => step(-1));
    section.querySelector('[data-recs-next]').addEventListener('click', () => step(1));
    let observerTimeout;
    track.addEventListener('scroll', () => {
      window.clearTimeout(observerTimeout);
      observerTimeout = window.setTimeout(() => {
        const width = track.clientWidth || 1;
        state.index = Math.max(0, Math.min(references.length - 1, Math.round(track.scrollLeft / width)));
        updateHomeIndex();
      },80);
    },{passive:true});
    track.addEventListener('keydown',(event)=>{
      if (event.target !== track) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();step(event.key === 'ArrowRight' ? 1 : -1);}
    });
  }

  function step(by) {
    const track = document.querySelector('[data-recs-track]');
    if (!track) return;
    state.index = (state.index + by + references.length) % references.length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({left:state.index * track.clientWidth,behavior:reduced ? 'instant' : 'smooth'});
    updateHomeIndex();
  }

  const downloadIcon = `<i class="recommendation-action__icon bi bi-cloud-arrow-down-fill" aria-hidden="true"></i>`;
  const linkedinIcon = `<i class="recommendation-action__icon recommendation-action__icon--linkedin bi bi-linkedin" aria-hidden="true"></i>`;

  function recommendationHash() {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return '';
    }
  }

  function renderPage() {
    const root = document.querySelector('[data-recommendations-page]');
    if (!root) return;
    const t = state.copy;
    const write = (selector, value) => {
      const node = root.querySelector(selector);
      if (node) node.textContent = value;
    };
    write('[data-rec-page-kicker]', t.pageKicker);
    write('[data-rec-page-title]', t.pageTitle);
    write('[data-rec-page-total]', String(references.length).padStart(2, '0'));
    write('[data-rec-page-companies]', [...new Set(references.map((item) => item.company))].join(' · '));
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t.meta;
    root.querySelector('.recommendations-collection')?.setAttribute('aria-label', t.lettersLabel);
    const list = root.querySelector('[data-rec-list]');
    list.innerHTML = references.map((item, i) => {
      const entry = t.entries[item.id];
      const { letter } = entry;
      const downloadLanguage = state.locale === 'en' ? 'en' : 'pt-BR';
      const primaryDocument = item.documents[downloadLanguage];
      const secondaryDocument = state.locale === 'en' ? item.documents['pt-BR'] : state.locale === 'es' ? item.documents.en : '';
      const secondaryLabel = state.locale === 'en' ? t.portuguese : t.english;
      const secondaryButton = secondaryDocument
        ? `<a class="recommendation-action recommendation-action--secondary" href="${clean(secondaryDocument)}" download>${downloadIcon}<span>${clean(secondaryLabel)}</span></a>`
        : '';
      const profile = linkedinUrl(item.link);
      const profileButton = profile
        ? `<a class="recommendation-action recommendation-action--linkedin" href="${clean(profile)}" target="_blank" rel="noopener noreferrer" aria-label="${clean(t.visit)} — ${clean(item.name)}">${linkedinIcon}<span>${clean(t.visit)}</span></a>`
        : '';
      return `<article class="recommendation-letter" id="${clean(item.id)}">
        <div class="recommendation-letter__overline"><span>${String(i + 1).padStart(2, '0')} / ${String(references.length).padStart(2, '0')}</span><span>${clean(item.company)}</span></div>
        <div class="recommendation-letter__heading"><div><p class="recommendation-letter__eyebrow">${clean(t.full)}</p><h2>${clean(item.name)}</h2><p class="recommendation-letter__role">${clean(entry.role)} · ${clean(item.company)}</p></div></div>
        <div class="recommendation-letter__metadata"><span>${clean(t.date)}</span><span>${clean(t.period)}: ${clean(entry.period)}</span></div>
        <div class="recommendation-letter__text"><p class="recommendation-letter__greeting">${clean(letter.greeting)}</p>${letter.paragraphs.map((paragraph) => `<p>${clean(paragraph)}</p>`).join('')}<p class="recommendation-letter__signoff">${clean(letter.closing)}<br><strong>${clean(item.name)}</strong></p></div>
        <div class="recommendation-letter__links">
          <a class="recommendation-action recommendation-action--download" href="${clean(primaryDocument)}" download>${downloadIcon}<span>${clean(t.download)}</span></a>
          ${secondaryButton}${profileButton}
        </div>
      </article>`;
    }).join('');
    const match = recommendationHash();
    if (match && references.some((item) => item.id === match)) {
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(match)?.scrollIntoView({block: 'start', behavior: 'instant'})));
    }
  }

  function initPageHashNavigation() {
    const root = document.querySelector('[data-recommendations-page]');
    if (!root || root.dataset.hashBound) return;
    root.dataset.hashBound = 'true';
    window.addEventListener('hashchange', () => {
      const id = recommendationHash();
      if (id && references.some((item) => item.id === id)) document.getElementById(id)?.scrollIntoView({block: 'start'});
    });
  }

  function render(locale, copy) {
    state.locale = locale;
    state.copy = copy;
    attachHome();
    renderHome();
    initPageHashNavigation();
    renderPage();
  }

  window.PortfolioRecommendationsUI={render};
})();
