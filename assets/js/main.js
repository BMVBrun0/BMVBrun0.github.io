const config = window.portfolioConfig;
const qs = (selector, context = document) => context.querySelector(selector);
const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];

const state = {
  locale: config.defaultLocale,
  data: null,
  activeCategory: 'all',
  roleIntervalId: null,
  loadedLocales: new Map(),
  gallery: {
    items: [],
    index: 0,
    title: '',
    lastTrigger: null,
    pointerStartX: null,
    isZoomed: false
  }
};

function replacePlaceholders(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function detectLocale() {
  const saved = window.localStorage.getItem('portfolio-locale');
  if (saved && config.locales.includes(saved)) return saved;

  const browserLocale = (navigator.language || '').toLowerCase();
  if (browserLocale.startsWith('pt')) return 'pt-BR';
  if (browserLocale.startsWith('es')) return 'es';
  if (browserLocale.startsWith('en')) return 'en';
  return config.defaultLocale;
}

async function loadLocaleData(locale) {
  if (state.loadedLocales.has(locale)) return state.loadedLocales.get(locale);

  const file = config.localeFiles[locale] || config.localeFiles[config.defaultLocale];
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Failed to load locale file: ${file}`);
  }

  const json = await response.json();
  state.loadedLocales.set(locale, json);
  return json;
}

function syncLanguageSelects(locale) {
  const activeLocale = config.locales.includes(locale) ? locale : config.defaultLocale;
  const currentLanguage = config.languageOptions[activeLocale] || config.languageOptions[config.defaultLocale];

  qsa('[data-lang-switcher]').forEach((switcher) => {
    const currentFlag = qs('[data-lang-current-flag]', switcher);
    const currentText = qs('[data-lang-current-text]', switcher);

    if (currentFlag) currentFlag.textContent = currentLanguage.flag;
    if (currentText) currentText.textContent = currentLanguage.label;

    qsa('.lang-option', switcher).forEach((option) => {
      const isActive = option.dataset.locale === activeLocale;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-selected', String(isActive));
    });
  });
}

function closeLanguageMenus(exceptSwitcher = null) {
  qsa('[data-lang-switcher]').forEach((switcher) => {
    if (exceptSwitcher && switcher === exceptSwitcher) return;
    switcher.classList.remove('is-open');
    const trigger = qs('[data-lang-trigger]', switcher);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function updateMeta() {
  const meta = state.data.meta;
  document.documentElement.lang = state.locale;
  document.title = meta.title;

  const description = qs('meta[name="description"]');
  const ogTitle = qs('meta[property="og:title"]');
  const ogDescription = qs('meta[property="og:description"]');

  if (description) description.setAttribute('content', meta.description);
  if (ogTitle) ogTitle.setAttribute('content', meta.ogTitle);
  if (ogDescription) ogDescription.setAttribute('content', meta.ogDescription);
}

function renderStaticText() {
  const { nav, hero, about, experienceSection, servicesSection, projectsSection, certificatesSection, contactSection, footer, language } = state.data;

  qs('.skip-link').textContent = state.data.accessibility.skipToContent;
  qs('.brand').setAttribute('aria-label', state.data.accessibility.backToTop);
  qs('.nav-toggle').setAttribute('aria-label', state.data.accessibility.openMenu);
  qs('#site-nav').setAttribute('aria-label', state.data.accessibility.mainNavigation);
  qs('#nav-about').textContent = nav.about;
  qs('#nav-experience').textContent = nav.experience;
  qs('#nav-services').textContent = nav.services;
  qs('#nav-projects').textContent = nav.projects;
  qs('#nav-certificates').textContent = nav.certificates;
  qs('#nav-contact').textContent = nav.contact;

  qs('#language-label-desktop').textContent = language.label;
  qs('#language-label-mobile').textContent = language.label;

  qs('#hero-eyebrow').textContent = hero.eyebrow;
  qs('#hero-role-prefix').textContent = hero.rolePrefix;
  qs('#hero-text').textContent = hero.text;
  qs('#hero-projects-cta').textContent = hero.primaryCta;
  qs('#hero-cv-cta').textContent = hero.secondaryCta;
  qs('#hero-cv-cta').href = config.cvByLocale[state.locale] || config.cvByLocale[config.defaultLocale];

  qs('#about-eyebrow').textContent = about.eyebrow;
  qs('#about-title').textContent = about.title;
  qs('#about-text-1').textContent = about.paragraphs[0];
  qs('#about-text-2').textContent = about.paragraphs[1];
  qs('#skills-label').textContent = about.skillsLabel;
  qs('#about-image').alt = about.imageAlt;

  qs('#impact-eyebrow').textContent = state.data.impactSection.eyebrow;
  qs('#impact-title').textContent = state.data.impactSection.title;
  qs('#impact-text').textContent = state.data.impactSection.text;

  qs('#recruiter-eyebrow').textContent = state.data.recruiterSection.eyebrow;
  qs('#recruiter-title').textContent = state.data.recruiterSection.title;
  qs('#recruiter-text').textContent = state.data.recruiterSection.text;

  qs('#experience-eyebrow').textContent = experienceSection.eyebrow;
  qs('#experience-title').textContent = experienceSection.title;
  qs('#experience-text').textContent = experienceSection.text;

  qs('#services-eyebrow').textContent = servicesSection.eyebrow;
  qs('#services-title').textContent = servicesSection.title;
  qs('#services-text').textContent = servicesSection.text;

  qs('#projects-eyebrow').textContent = projectsSection.eyebrow;
  qs('#projects-title').textContent = projectsSection.title;
  qs('#projects-text').textContent = projectsSection.text;
  qs('#project-filters').setAttribute('aria-label', projectsSection.filtersLabel);

  qs('#certificates-eyebrow').textContent = certificatesSection.eyebrow;
  qs('#certificates-title').textContent = certificatesSection.title;
  qs('#certificates-text').textContent = certificatesSection.text;

  qs('#contact-eyebrow').textContent = contactSection.eyebrow;
  qs('#contact-title').textContent = contactSection.title;
  qs('#contact-text').textContent = contactSection.text;

  qs('#footer-copy').innerHTML = `© <span id="current-year"></span> Bruno Getten Triches. ${footer.rights}`;
  qs('#footer-back-top').textContent = footer.backToTop;

  const closeButton = qs('.image-modal-close');
  closeButton.setAttribute('aria-label', state.data.modal.closeLabel);
  qs('#image-modal-prev').setAttribute('aria-label', state.data.modal.previousLabel);
  qs('#image-modal-next').setAttribute('aria-label', state.data.modal.nextLabel);
  const zoomButton = qs('#image-modal-zoom');
  if (zoomButton) {
    const zoomLabel = state.gallery.isZoomed ? state.data.modal.zoomOutLabel : state.data.modal.zoomInLabel;
    zoomButton.setAttribute('aria-label', zoomLabel);
    zoomButton.setAttribute('title', zoomLabel);
  }
  qs('#image-modal-kicker').textContent = state.data.modal.kicker;
  qs('#image-modal-title').textContent = state.data.modal.title;
  qs('#image-modal-caption').textContent = state.data.modal.initialCaption;
  qs('#image-modal-thumbnails').setAttribute('aria-label', state.data.modal.thumbnailsLabel);
  qs('#image-modal-fallback-title').textContent = state.data.modal.unavailableTitle;
  qs('#image-modal-fallback-text').textContent = state.data.modal.unavailableText;
  qs('#image-modal-hint').textContent = state.data.modal.navigationHint;
}

function renderHeroStats() {
  const root = qs('#hero-stats');
  root.innerHTML = state.data.hero.stats.map((item) => `
    <article>
      <strong>${item.title}</strong>
      <span>${item.text}</span>
    </article>
  `).join('');
}

function renderSkills() {
  const root = qs('#skills-list');
  root.innerHTML = state.data.skills.map((item) => `
    <article class="skill-item reveal">
      <header>
        <span>${item.name}</span>
        <strong>${item.level}%</strong>
      </header>
      <div class="skill-bar" aria-hidden="true">
        <span style="width:${item.level}%"></span>
      </div>
    </article>
  `).join('');
}


function renderImpact() {
  const root = qs('#impact-grid');
  root.innerHTML = state.data.impacts.map((item) => `
    <article class="impact-card reveal">
      <div class="impact-top">
        <span class="impact-company">${item.company}</span>
        <span class="impact-period">${item.period}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="impact-result">${item.result}</p>
      <ul class="impact-bullets">
        ${item.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
      </ul>
    </article>
  `).join('');
}

function renderRecruiterHighlights() {
  const root = qs('#recruiter-grid');
  root.innerHTML = state.data.recruiterHighlights.map((item) => `
    <article class="recruiter-card reveal">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </article>
  `).join('');

  const actions = qs('#recruiter-actions');
  actions.innerHTML = `
    <a class="btn btn-primary" href="assets/docs/curriculo-br-2026.pdf" target="_blank" rel="noopener">${state.data.recruiterSection.actions.cvPt}</a>
    <a class="btn btn-secondary" href="assets/docs/curriculo-en-2026.pdf" target="_blank" rel="noopener">${state.data.recruiterSection.actions.cvEn}</a>
    <a class="btn btn-secondary" href="${config.contactLinks.whatsapp}" target="_blank" rel="noopener">${state.data.recruiterSection.actions.whatsapp}</a>
    <a class="btn btn-secondary" href="${config.contactLinks.linkedin}" target="_blank" rel="noopener">${state.data.recruiterSection.actions.linkedin}</a>
  `;
}

function renderExperience() {
  const root = qs('#experience-list');
  root.innerHTML = state.data.experience.map((item) => `
    <article class="timeline-item reveal">
      <span class="timeline-dot" aria-hidden="true"></span>
      <div class="timeline-card">
        <p class="timeline-period">${item.period}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    </article>
  `).join('');
}

function renderServices() {
  const root = qs('#services-list');
  root.innerHTML = state.data.services.map((item) => `
    <article class="service-card reveal">
      <img src="${item.icon}" alt="" class="service-icon">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `).join('');
}

function renderFilters() {
  const root = qs('#project-filters');
  root.innerHTML = state.data.categories.map((category) => `
    <button
      type="button"
      class="filter-chip ${category.id === state.activeCategory ? 'is-active' : ''}"
      data-category="${category.id}"
      aria-pressed="${String(category.id === state.activeCategory)}">
      ${category.label}
    </button>
  `).join('');

  qsa('.filter-chip', root).forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderFilters();
      renderProjects();
      initReveal();
    });
  });
}

function normalizeGalleryItem(item, project, index) {
  if (typeof item === 'string') {
    return {
      src: item,
      alt: replacePlaceholders(state.data.projectsSection.galleryImageAlt, {
        title: project.title,
        index: index + 1
      }),
      caption: ''
    };
  }

  if (!item || typeof item !== 'object' || !item.src) return null;

  return {
    src: item.src,
    alt: item.alt || replacePlaceholders(state.data.projectsSection.galleryImageAlt, {
      title: project.title,
      index: index + 1
    }),
    caption: item.caption || ''
  };
}

function getProjectGallery(project) {
  const candidates = [];

  if (project.image) candidates.push({ src: project.image, alt: '', caption: '' });

  const sharedGallery = project.image ? config.projectGalleries?.[project.image] : null;
  if (Array.isArray(sharedGallery)) candidates.push(...sharedGallery);

  // Opcional: permite complementar a galeria diretamente no JSON do idioma,
  // por exemplo quando uma legenda precisa ser traduzida.
  if (Array.isArray(project.gallery)) candidates.push(...project.gallery);

  const seen = new Set();
  const gallery = [];

  candidates.forEach((item) => {
    const normalized = normalizeGalleryItem(item, project, gallery.length);
    if (!normalized?.src || seen.has(normalized.src)) return;

    seen.add(normalized.src);
    gallery.push(normalized);
  });

  return gallery;
}

function renderProjects() {
  const root = qs('#projects-list');
  const projects = state.activeCategory === 'all'
    ? state.data.projects
    : state.data.projects.filter((project) => project.category === state.activeCategory);

  root.innerHTML = projects.map((project) => {
    const gallery = getProjectGallery(project);
    const cover = gallery[0];
    const galleryCount = gallery.length;
    const galleryLabel = galleryCount > 1
      ? state.data.projectsSection.galleryCta
      : state.data.projectsSection.singleImageCta;
    const galleryCountLabel = galleryCount === 1
      ? state.data.projectsSection.imageCountSingle
      : replacePlaceholders(state.data.projectsSection.imageCountMultiple, { count: galleryCount });

    const media = cover
      ? `
        <button
          type="button"
          class="project-media project-gallery-trigger"
          data-project-index="${state.data.projects.indexOf(project)}"
          aria-label="${replacePlaceholders(state.data.projectsSection.galleryAriaLabel, {
            title: project.title,
            countLabel: galleryCountLabel
          })}">
          ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
          <img src="${cover.src}" alt="${replacePlaceholders(state.data.projectsSection.imageAlt, { title: project.title })}" loading="lazy">
          <span class="project-cover-fallback" aria-hidden="true">
            <span class="project-media-empty-icon"><svg class="icon"><use href="#icon-images"></use></svg></span>
            <strong>${state.data.modal.unavailableTitle}</strong>
          </span>
          <span class="project-media-overlay" aria-hidden="true"></span>
          <span class="project-gallery-affordance" aria-hidden="true">
            <span class="project-gallery-affordance-icon">
              <svg class="icon"><use href="#icon-images"></use></svg>
            </span>
            <span class="project-gallery-affordance-copy">
              <strong>${galleryLabel}</strong>
              <small>${galleryCountLabel}</small>
            </span>
            <span class="project-gallery-affordance-arrow">
              <svg class="icon"><use href="#icon-arrow-up-right"></use></svg>
            </span>
          </span>
        </button>
      `
      : `
        <div class="project-media project-media-empty" aria-label="${replacePlaceholders(state.data.projectsSection.noImagesAriaLabel, { title: project.title })}">
          ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
          <div class="project-media-empty-content">
            <span class="project-media-empty-icon"><svg class="icon"><use href="#icon-images"></use></svg></span>
            <strong>${state.data.projectsSection.noImagesTitle}</strong>
            <span>${state.data.projectsSection.noImagesText}</span>
          </div>
        </div>
      `;

    return `
      <article class="project-card reveal ${project.comingSoon ? 'is-coming-soon' : ''}">
        ${media}
        <div class="project-body">
          <div class="project-meta">
            <span class="project-tag">${state.data.categories.find((item) => item.id === project.category)?.label ?? state.data.projectsSection.defaultCategory}</span>
            ${project.status ? `<span class="project-status">${project.status}</span>` : ''}
          </div>
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          ${Array.isArray(project.stack) && project.stack.length ? `
            <ul class="project-stack" aria-label="${state.data.projectsSection.stackAriaLabel}">
              ${project.stack.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  initProjectMediaFallbacks();
  initProjectGallery();
}

function initProjectMediaFallbacks() {
  qsa('.project-gallery-trigger > img').forEach((image) => {
    const handleError = () => {
      image.hidden = true;
      image.closest('.project-gallery-trigger')?.classList.add('has-media-error');
    };

    image.addEventListener('error', handleError, { once: true });
    if (image.complete && image.naturalWidth === 0) handleError();
  });
}


function renderCertificates() {
  const root = qs('#certificates-list');
  if (!root || !Array.isArray(state.data.certificates)) return;

  root.innerHTML = state.data.certificates.map((item) => {
    const cardInner = `
      <div class="certificate-media-wrap">
        <img class="certificate-media" src="${item.image || ''}" alt="${replacePlaceholders(state.data.certificatesSection.imageAlt, { title: item.title })}" loading="lazy">
      </div>
      <div class="certificate-content">
        <div class="certificate-top">
          <span class="certificate-provider ${item.providerClass ? `is-${item.providerClass}` : ''}" aria-label="${state.data.certificatesSection.providerBadgeLabel}">${item.provider}</span>
          <span class="certificate-year">${item.year}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        ${Array.isArray(item.tags) && item.tags.length ? `
          <ul class="certificate-tags" aria-label="${state.data.certificatesSection.tagsAriaLabel}">
            ${item.tags.map((tag) => `<li>${tag}</li>`).join('')}
          </ul>
        ` : ''}
        ${item.url ? `
          <span class="certificate-link-label">
            <span>${state.data.certificatesSection.credentialCta}</span>
            <svg class="icon"><use href="#icon-arrow-up-right"></use></svg>
          </span>
        ` : ''}
      </div>
    `;

    return item.url
      ? `
        <a class="certificate-card reveal certificate-link-card" href="${item.url}" target="_blank" rel="noopener" aria-label="${replacePlaceholders(state.data.certificatesSection.credentialAriaLabel, { title: item.title })}">
          ${cardInner}
        </a>
      `
      : `
        <article class="certificate-card reveal">
          ${cardInner}
        </article>
      `;
  }).join('');
}

function renderContacts() {
  const root = qs('#contact-grid');
  root.innerHTML = state.data.contacts.map((item) => `
    <a class="contact-card contact-link reveal" href="${config.contactLinks[item.id]}" ${item.external ? 'target="_blank" rel="noopener"' : ''} aria-label="${item.ariaLabel}">
      <div class="contact-icon-wrap">
        <svg class="icon"><use href="#${item.icon}"></use></svg>
      </div>
      <div class="contact-content">
        <h3>${item.title}</h3>
        <strong>${item.value}</strong>
        <p>${item.text}</p>
      </div>
      <svg class="contact-arrow"><use href="#icon-arrow-up-right"></use></svg>
    </a>
  `).join('');
}

function initRoleRotation() {
  const target = qs('#typed-role');
  if (!target) return;

  if (state.roleIntervalId) {
    window.clearInterval(state.roleIntervalId);
  }

  const roles = state.data.hero.roles;
  let index = 0;

  const paint = () => {
    target.textContent = roles[index];
    index = (index + 1) % roles.length;
  };

  paint();
  state.roleIntervalId = window.setInterval(paint, 2200);
}

function initMenu() {
  const toggle = qs('.nav-toggle');
  const nav = qs('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    nav.classList.toggle('is-open');
  });

  qsa('.site-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initReveal() {
  const elements = qsa('.reveal');
  if (!('IntersectionObserver' in window) || !elements.length) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => {
    if (!element.classList.contains('is-visible')) observer.observe(element);
  });
}

function setCurrentYear() {
  const year = qs('#current-year');
  if (year) year.textContent = new Date().getFullYear();
}


function clearGalleryImageSizing() {
  const modalImage = qs('#image-modal-image');
  if (!modalImage) return;

  modalImage.style.removeProperty('width');
  modalImage.style.removeProperty('height');
  modalImage.style.removeProperty('max-width');
  modalImage.style.removeProperty('max-height');
}

function fitGalleryImageToStage() {
  const modal = qs('#image-modal');
  const stage = qs('.image-modal-stage');
  const modalImage = qs('#image-modal-image');

  if (!modal?.classList.contains('is-open') || !stage || !modalImage) return;
  if (state.gallery.isZoomed || modalImage.hidden || !modalImage.complete || !modalImage.naturalWidth || !modalImage.naturalHeight) return;

  // The mobile lightbox already has the desired CSS-driven behaviour. Keep it untouched.
  if (window.innerWidth <= 920) {
    clearGalleryImageSizing();
    return;
  }

  const style = window.getComputedStyle(stage);
  const horizontalPadding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  const availableWidth = Math.max(1, stage.clientWidth - horizontalPadding - 4);
  const availableHeight = Math.max(1, stage.clientHeight - verticalPadding - 4);

  const naturalWidth = modalImage.naturalWidth;
  const naturalHeight = modalImage.naturalHeight;
  const containScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
  const fittedWidth = Math.max(1, Math.floor(naturalWidth * containScale));
  const fittedHeight = Math.max(1, Math.floor(naturalHeight * containScale));

  modalImage.style.width = `${fittedWidth}px`;
  modalImage.style.height = `${fittedHeight}px`;
  modalImage.style.maxWidth = 'none';
  modalImage.style.maxHeight = 'none';
}

function setGalleryZoom(enabled, { center = true } = {}) {
  const stage = qs('.image-modal-stage');
  const modalImage = qs('#image-modal-image');
  const zoomButton = qs('#image-modal-zoom');
  if (!stage || !modalImage || !zoomButton) return;

  const canZoom = !modalImage.hidden && modalImage.complete && modalImage.naturalWidth > 0;
  state.gallery.isZoomed = Boolean(enabled && canZoom);

  stage.classList.toggle('is-zoomed', state.gallery.isZoomed);
  zoomButton.classList.toggle('is-active', state.gallery.isZoomed);
  zoomButton.setAttribute('aria-pressed', String(state.gallery.isZoomed));

  const zoomLabel = state.data
    ? (state.gallery.isZoomed ? state.data.modal.zoomOutLabel : state.data.modal.zoomInLabel)
    : '';
  if (zoomLabel) {
    zoomButton.setAttribute('aria-label', zoomLabel);
    zoomButton.setAttribute('title', zoomLabel);
  }

  if (!state.gallery.isZoomed) {
    clearGalleryImageSizing();
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    fitGalleryImageToStage();
    return;
  }

  const fittedRect = modalImage.getBoundingClientRect();
  const naturalWidth = modalImage.naturalWidth || fittedRect.width;
  const zoomWidth = Math.min(naturalWidth, Math.max(fittedRect.width * 1.65, fittedRect.width + 180));

  modalImage.style.width = `${Math.round(zoomWidth)}px`;
  modalImage.style.height = 'auto';
  modalImage.style.maxWidth = 'none';
  modalImage.style.maxHeight = 'none';

  if (center) {
    window.requestAnimationFrame(() => {
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
    });
  }
}

function resetGalleryZoom() {
  setGalleryZoom(false, { center: false });
}

function updateGalleryImageShape() {
  const modal = qs('#image-modal');
  const modalImage = qs('#image-modal-image');
  if (!modal || !modalImage || !modalImage.naturalWidth || !modalImage.naturalHeight) return;

  const ratio = modalImage.naturalWidth / modalImage.naturalHeight;
  modal.classList.toggle('image-is-portrait', ratio < 0.82);
  modal.classList.toggle('image-is-square', ratio >= 0.82 && ratio <= 1.18);
  modal.classList.toggle('image-is-landscape', ratio > 1.18);
}

function updateProjectGallery() {
  const modal = qs('#image-modal');
  if (!modal || !state.gallery.items.length) return;

  const item = state.gallery.items[state.gallery.index];
  const total = state.gallery.items.length;
  const modalImage = qs('#image-modal-image');
  const modalFallback = qs('#image-modal-fallback');
  const modalCaption = qs('#image-modal-caption');
  const modalCounter = qs('#image-modal-counter');
  const previousButton = qs('#image-modal-prev');
  const nextButton = qs('#image-modal-next');
  const thumbnails = qs('#image-modal-thumbnails');

  resetGalleryZoom();
  modal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape');
  modalImage.hidden = false;
  modalFallback.hidden = true;
  modalImage.src = item.src;
  modalImage.alt = item.alt || replacePlaceholders(state.data.modal.imageAlt, {
    title: state.gallery.title,
    index: state.gallery.index + 1
  });

  modalCaption.textContent = item.caption || replacePlaceholders(state.data.modal.caption, {
    title: state.gallery.title,
    index: state.gallery.index + 1,
    count: total
  });

  modalCounter.textContent = replacePlaceholders(state.data.modal.counter, {
    current: state.gallery.index + 1,
    count: total
  });

  const hasMultipleImages = total > 1;
  previousButton.hidden = !hasMultipleImages;
  nextButton.hidden = !hasMultipleImages;
  thumbnails.hidden = !hasMultipleImages;

  previousButton.disabled = !hasMultipleImages;
  nextButton.disabled = !hasMultipleImages;

  if (hasMultipleImages) {
    thumbnails.innerHTML = state.gallery.items.map((galleryItem, index) => `
      <button
        type="button"
        class="image-modal-thumbnail ${index === state.gallery.index ? 'is-active' : ''}"
        data-gallery-index="${index}"
        aria-label="${replacePlaceholders(state.data.modal.thumbnailLabel, {
          index: index + 1,
          title: state.gallery.title
        })}"
        aria-current="${index === state.gallery.index ? 'true' : 'false'}">
        <img src="${galleryItem.src}" alt="" loading="lazy">
        <span>${String(index + 1).padStart(2, '0')}</span>
      </button>
    `).join('');

    qsa('[data-gallery-index]', thumbnails).forEach((button) => {
      button.addEventListener('click', () => {
        state.gallery.index = Number(button.dataset.galleryIndex);
        updateProjectGallery();
      });
    });

    const activeThumbnail = qs('.image-modal-thumbnail.is-active', thumbnails);
    activeThumbnail?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  } else {
    thumbnails.innerHTML = '';
  }
}

function openProjectGallery(project, trigger) {
  const modal = qs('#image-modal');
  const modalTitle = qs('#image-modal-title');
  const closeButton = qs('.image-modal-close');
  const gallery = getProjectGallery(project);
  if (!modal || !modalTitle || !closeButton || !gallery.length) return;

  state.gallery.items = gallery;
  state.gallery.index = 0;
  state.gallery.title = project.title;
  state.gallery.lastTrigger = trigger;
  state.gallery.pointerStartX = null;
  state.gallery.isZoomed = false;

  modalTitle.textContent = project.title;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  updateProjectGallery();
  window.requestAnimationFrame(() => closeButton.focus());
}

function initProjectGallery() {
  qsa('.project-gallery-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const projectIndex = Number(trigger.dataset.projectIndex);
      const project = state.data.projects[projectIndex];
      if (project) openProjectGallery(project, trigger);
    });
  });
}

function moveProjectGallery(direction) {
  const total = state.gallery.items.length;
  if (total <= 1) return;

  state.gallery.index = (state.gallery.index + direction + total) % total;
  updateProjectGallery();
}

function closeProjectGallery() {
  const modal = qs('#image-modal');
  const modalImage = qs('#image-modal-image');
  const thumbnails = qs('#image-modal-thumbnails');
  if (!modal || !modalImage) return;

  const lastTrigger = state.gallery.lastTrigger;

  resetGalleryZoom();
  modal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  modalImage.alt = '';
  if (thumbnails) thumbnails.innerHTML = '';
  document.body.classList.remove('modal-open');

  state.gallery.items = [];
  state.gallery.index = 0;
  state.gallery.title = '';
  state.gallery.lastTrigger = null;
  state.gallery.pointerStartX = null;
  state.gallery.isZoomed = false;

  if (lastTrigger && document.contains(lastTrigger)) {
    window.requestAnimationFrame(() => lastTrigger.focus());
  }
}

function handleGalleryImageError() {
  const modalImage = qs('#image-modal-image');
  const fallback = qs('#image-modal-fallback');
  if (!modalImage || !fallback) return;

  modalImage.hidden = true;
  fallback.hidden = false;
}

function trapModalFocus(event) {
  const modal = qs('#image-modal');
  if (!modal?.classList.contains('is-open') || event.key !== 'Tab') return;

  const focusable = qsa('button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])', modal)
    .filter((element) => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initModalEvents() {
  qsa('[data-close-modal]').forEach((item) => {
    item.addEventListener('click', closeProjectGallery);
  });

  qs('#image-modal-prev')?.addEventListener('click', () => moveProjectGallery(-1));
  qs('#image-modal-next')?.addEventListener('click', () => moveProjectGallery(1));

  const modalImage = qs('#image-modal-image');
  modalImage?.addEventListener('error', handleGalleryImageError);
  modalImage?.addEventListener('load', () => {
    updateGalleryImageShape();
    resetGalleryZoom();
    window.requestAnimationFrame(fitGalleryImageToStage);
  });

  qs('#image-modal-zoom')?.addEventListener('click', () => {
    setGalleryZoom(!state.gallery.isZoomed);
  });

  const stage = qs('.image-modal-stage');
  stage?.addEventListener('pointerdown', (event) => {
    if (state.gallery.isZoomed) return;
    state.gallery.pointerStartX = event.clientX;
  });
  stage?.addEventListener('pointerup', (event) => {
    if (state.gallery.isZoomed || state.gallery.pointerStartX === null || state.gallery.items.length <= 1) return;

    const distance = event.clientX - state.gallery.pointerStartX;
    state.gallery.pointerStartX = null;

    if (Math.abs(distance) < 50) return;
    moveProjectGallery(distance > 0 ? -1 : 1);
  });
  stage?.addEventListener('pointercancel', () => {
    state.gallery.pointerStartX = null;
  });

  document.addEventListener('keydown', (event) => {
    const modal = qs('#image-modal');
    if (!modal?.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeProjectGallery();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveProjectGallery(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveProjectGallery(1);
    } else if (event.key === 'Home' && state.gallery.items.length > 1) {
      event.preventDefault();
      state.gallery.index = 0;
      updateProjectGallery();
    } else if (event.key === 'End' && state.gallery.items.length > 1) {
      event.preventDefault();
      state.gallery.index = state.gallery.items.length - 1;
      updateProjectGallery();
    }
  });

  document.addEventListener('keydown', trapModalFocus);

  let galleryResizeFrame = null;
  window.addEventListener('resize', () => {
    const modal = qs('#image-modal');
    if (!modal?.classList.contains('is-open') || state.gallery.isZoomed) return;

    if (galleryResizeFrame) window.cancelAnimationFrame(galleryResizeFrame);
    galleryResizeFrame = window.requestAnimationFrame(() => {
      galleryResizeFrame = null;
      fitGalleryImageToStage();
    });
  });
}


function initLanguageSwitcher() {
  qsa('[data-lang-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const switcher = event.currentTarget.closest('[data-lang-switcher]');
      const willOpen = !switcher.classList.contains('is-open');

      closeLanguageMenus(willOpen ? switcher : null);
      switcher.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));
    });
  });

  qsa('.lang-option').forEach((option) => {
    option.addEventListener('click', async (event) => {
      const locale = event.currentTarget.dataset.locale;
      syncLanguageSelects(locale);
      closeLanguageMenus();
      await applyLocale(locale);

      const nav = qs('.site-nav');
      const toggle = qs('.nav-toggle');
      if (window.innerWidth <= 920 && nav && toggle) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-lang-switcher]')) return;
    closeLanguageMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLanguageMenus();
  });
}

async function applyLocale(locale) {
  const normalized = config.locales.includes(locale) ? locale : config.defaultLocale;
  state.locale = normalized;
  window.localStorage.setItem('portfolio-locale', normalized);
  state.data = await loadLocaleData(normalized);
  state.activeCategory = 'all';

  updateMeta();
  renderStaticText();
  renderHeroStats();
  renderSkills();
  renderImpact();
  renderRecruiterHighlights();
  renderExperience();
  renderServices();
  renderFilters();
  renderProjects();
  renderCertificates();
  renderContacts();
  initRoleRotation();
  initReveal();
  setCurrentYear();
}

async function init() {
  initMenu();
  initModalEvents();
  initLanguageSwitcher();

  const locale = detectLocale();
  syncLanguageSelects(locale);
  await applyLocale(locale);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error);
  });
});
