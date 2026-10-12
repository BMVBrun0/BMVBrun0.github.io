(() => {
  'use strict';

  const references = window.portfolioRecommendations || [];
  const dictionary = {
    'pt-BR': {
      nav: 'Recomendações', eyebrow: 'QUEM TRABALHOU COMIGO', title: 'Gente que esteve do outro lado do código.',
      subtitle: 'Mais do que cargos e tecnologias, são as pessoas com quem construí produtos que podem contar como foi trabalhar comigo.',
      read: 'Ler carta completa', all: 'Ver todas as recomendações',
      previous: 'Recomendação anterior', next: 'Próxima recomendação', outOf: 'de', carousel: 'Carrossel de recomendações profissionais', lettersLabel: 'Cartas de recomendação',
      pageKicker: 'REFERÊNCIAS PROFISSIONAIS', pageTitle: 'O que dizem as pessoas com quem trabalhei.',
      full: 'Carta completa', date: '9 de outubro de 2026', period: 'Período de colaboração', visit: 'Perfil no LinkedIn',
      closing: 'Atenciosamente,', more: 'Voltar ao topo', download: 'Baixar carta original', english: 'Versão em inglês', portuguese: 'Original em português', view: 'Ver carta', meta: 'Cartas de recomendação de profissionais que trabalharam comigo na Infogen Sistemas e na Sensorama Play.'
    },
    en: {
      nav: 'Recommendations', eyebrow: 'PEOPLE I WORKED WITH', title: 'The people behind the projects.',
      subtitle: 'Beyond job titles and technology stacks, the people I built products with can tell you what working together was actually like.',
      read: 'Read the full letter', all: 'See all recommendations',
      previous: 'Previous recommendation', next: 'Next recommendation', outOf: 'of', carousel: 'Professional recommendation carousel', lettersLabel: 'Recommendation letters',
      pageKicker: 'PROFESSIONAL REFERENCES', pageTitle: 'In the words of people I worked with.',
      full: 'Full letter', date: 'October 9, 2026', period: 'Worked together', visit: 'LinkedIn profile',
      closing: 'Sincerely,', more: 'Back to top', download: 'Download English letter', english: 'English version', portuguese: 'Original in Portuguese', view: 'View letter', meta: 'Professional recommendation letters from colleagues who worked with me at Infogen Sistemas and Sensorama Play.'
    },
    es: {
      nav: 'Recomendaciones', eyebrow: 'PERSONAS CON LAS QUE TRABAJÉ', title: 'Las personas detrás de los proyectos.',
      subtitle: 'Más allá de los cargos y las tecnologías, quienes construyeron productos conmigo pueden contar cómo fue trabajar juntos.',
      read: 'Leer la carta completa', all: 'Ver todas las recomendaciones',
      previous: 'Recomendación anterior', next: 'Siguiente recomendación', outOf: 'de', carousel: 'Carrusel de recomendaciones profesionales', lettersLabel: 'Cartas de recomendación',
      pageKicker: 'REFERENCIAS PROFESIONALES', pageTitle: 'Lo cuentan quienes trabajaron conmigo.',
      full: 'Carta completa', date: '9 de octubre de 2026', period: 'Período de colaboración', visit: 'Perfil en LinkedIn',
      closing: 'Atentamente,', more: 'Volver arriba', download: 'Descargar carta original', english: 'Versión en inglés', portuguese: 'Original en portugués', view: 'Ver carta', meta: 'Cartas de recomendación de profesionales que trabajaron conmigo en Infogen Sistemas y Sensorama Play.'
    }
  };

  const clean = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const supported = ['pt-BR', 'en', 'es'];
  const state = { locale: 'pt-BR', index: 0 };
  const linkedinUrl = (value) => (typeof value === 'string' && /^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-z0-9%_-]+\/?(?:[?#].*)?$/i.test(value)) ? value : '';
  const rowLink = (item) => `recommendations.html?lang=${encodeURIComponent(state.locale)}#${encodeURIComponent(item.id)}`;

  function translateHeadings() {
    const t = dictionary[state.locale];
    document.querySelectorAll('[data-main-nav="recommendations"]').forEach((node) => { node.textContent = t.nav; });
  }

  function renderHome() {
    const section = document.getElementById('recommendations');
    if (!section || !references.length) return;
    const t = dictionary[state.locale];
    section.querySelector('[data-recs-eyebrow]').textContent = t.eyebrow;
    section.querySelector('[data-recs-title]').textContent = t.title;
    section.querySelector('[data-recs-subtitle]').textContent = t.subtitle;
    section.querySelector('[data-recs-all]').textContent = t.all;
    section.querySelector('[data-recs-prev]').setAttribute('aria-label', t.previous);
    section.querySelector('[data-recs-next]').setAttribute('aria-label', t.next);
    const track = section.querySelector('[data-recs-track]');
    track.setAttribute('aria-label', t.carousel);
    track.innerHTML = references.map((item) => `
      <article class="recommendation-slide" aria-label="${clean(item.name)}">
        <div class="recommendation-slide__top"><span class="recommendation-slide__quote" aria-hidden="true">“</span><span class="recommendation-slide__tag">${clean(item.company)}</span></div>
        <p class="recommendation-slide__body">${clean(item.summaries[state.locale])}</p>
        <div class="recommendation-slide__bottom">
          <div class="recommendation-person"><span class="recommendation-person__avatar" aria-hidden="true">${clean(item.name.split(' ').map((x) => x[0]).filter(Boolean).slice(0,2).join(''))}</span><div><strong>${clean(item.name)}</strong><small>${clean(item.role[state.locale])} · ${clean(item.company)}</small></div></div>
          <a class="recommendation-slide__link" href="${rowLink(item)}" aria-label="${clean(t.read)} — ${clean(item.name)}">${clean(t.read)} <span aria-hidden="true">↗</span></a>
        </div>
      </article>`).join('');
    section.querySelector('[data-recs-counter]').setAttribute('aria-label', `${state.index + 1} ${t.outOf} ${references.length}`);
    state.index = Math.min(state.index, references.length - 1);
    track.scrollTo({left:state.index * track.clientWidth,behavior:'instant'});
    updateHomeIndex();
  }

  function updateHomeIndex() {
    const section = document.getElementById('recommendations');
    if (!section) return;
    const t = dictionary[state.locale];
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

  const downloadIcon = `<svg class="recommendation-action__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"></path></svg>`;
  const linkedinIcon = `<svg class="recommendation-action__icon recommendation-action__icon--linkedin" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.6 0 4.265 2.37 4.265 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.977 0 1.778-.773 1.778-1.729V1.729C24 .774 23.202 0 22.225 0Z"></path></svg>`;

  function renderPage() {
    const root = document.querySelector('[data-recommendations-page]');
    if (!root) return;
    const t = dictionary[state.locale];
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
      const letter = item.letters[state.locale];
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
        <div class="recommendation-letter__heading"><div><p class="recommendation-letter__eyebrow">${clean(t.full)}</p><h2>${clean(item.name)}</h2><p class="recommendation-letter__role">${clean(item.role[state.locale])} · ${clean(item.company)}</p></div></div>
        <div class="recommendation-letter__metadata"><span>${clean(t.date)}</span><span>${clean(t.period)}: ${clean(item.period[state.locale])}</span></div>
        <div class="recommendation-letter__text"><p class="recommendation-letter__greeting">${clean(letter.greeting)}</p>${letter.paragraphs.map((paragraph) => `<p>${clean(paragraph)}</p>`).join('')}<p class="recommendation-letter__signoff">${clean(letter.closing)}<br><strong>${clean(item.name)}</strong></p></div>
        <div class="recommendation-letter__links">
          <a class="recommendation-action recommendation-action--download" href="${clean(primaryDocument)}" download>${downloadIcon}<span>${clean(t.download)}</span></a>
          ${secondaryButton}${profileButton}
        </div>
      </article>`;
    }).join('');
    const match = decodeURIComponent(location.hash.slice(1));
    if (match && references.some((item) => item.id === match)) {
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(match)?.scrollIntoView({block: 'start', behavior: 'instant'})));
    }
  }

  function initPageHashNavigation() {
    const root = document.querySelector('[data-recommendations-page]');
    if (!root || root.dataset.hashBound) return;
    root.dataset.hashBound = 'true';
    window.addEventListener('hashchange', () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && references.some((item) => item.id === id)) document.getElementById(id)?.scrollIntoView({block: 'start'});
    });
  }

  function render(locale) {
    state.locale=supported.includes(locale) ? locale : 'pt-BR';
    translateHeadings();
    attachHome();
    renderHome();
    initPageHashNavigation();
    renderPage();
  }

  window.PortfolioRecommendationsUI={render};
})();
