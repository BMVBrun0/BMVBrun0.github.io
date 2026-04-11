const config = window.portfolioConfig;
const qs = (selector, context = document) => context.querySelector(selector);
const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];

const state = {
  locale: config.defaultLocale,
  data: null,
  activeCategory: 'all',
  roleIntervalId: null,
  loadedLocales: new Map()
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
  qs('#image-modal-title').textContent = state.data.modal.title;
  qs('#image-modal-caption').textContent = state.data.modal.initialCaption;
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

function renderProjects() {
  const root = qs('#projects-list');
  const projects = state.activeCategory === 'all'
    ? state.data.projects
    : state.data.projects.filter((project) => project.category === state.activeCategory);

  root.innerHTML = projects.map((project) => `
    <article class="project-card reveal ${project.comingSoon ? 'is-coming-soon' : ''}">
      <button
        type="button"
        class="project-media project-zoom-trigger"
        data-image="${project.image}"
        data-title="${project.title}"
        aria-label="${replacePlaceholders(state.data.projectsSection.zoomAriaLabel, { title: project.title })}">
        ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
        <img src="${project.image}" alt="${replacePlaceholders(state.data.projectsSection.imageAlt, { title: project.title })}" loading="lazy">
        <span class="project-media-overlay">
          <span class="project-media-pill">
            <svg class="icon"><use href="#icon-expand"></use></svg>
            <span>${state.data.projectsSection.zoomCta}</span>
          </span>
        </span>
      </button>
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
  `).join('');

  initProjectZoom();
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

function initProjectZoom() {
  const modal = qs('#image-modal');
  const modalImage = qs('#image-modal-image');
  const modalCaption = qs('#image-modal-caption');
  const modalTitle = qs('#image-modal-title');
  const closeButton = qs('.image-modal-close');
  if (!modal || !modalImage || !modalCaption || !modalTitle || !closeButton) return;

  qsa('.project-zoom-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const imageSrc = trigger.dataset.image;
      const title = trigger.dataset.title || state.data.projectsSection.defaultCategory;

      modalImage.src = imageSrc;
      modalImage.alt = replacePlaceholders(state.data.modal.imageAlt, { title });
      modalTitle.textContent = title;
      modalCaption.textContent = replacePlaceholders(state.data.modal.caption, { title });
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      closeButton.focus();
    });
  });
}

function closeProjectZoom() {
  const modal = qs('#image-modal');
  const modalImage = qs('#image-modal-image');
  if (!modal || !modalImage) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  modalImage.alt = '';
  document.body.classList.remove('modal-open');
}

function initModalEvents() {
  qsa('[data-close-modal]').forEach((item) => {
    item.addEventListener('click', closeProjectZoom);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProjectZoom();
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
