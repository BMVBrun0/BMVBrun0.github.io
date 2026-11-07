const config = window.portfolioConfig;
const qs = (selector, context = document) => context.querySelector(selector);
const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const state = {
  locale: config.defaultLocale,
  data: null,
  activeCategory: 'all',
  profileTab: window.localStorage.getItem('portfolio-profile-tab') || config.profileExplorer?.defaultTab || 'overview',
  loadedLocales: new Map(),
  carousels: {
    projects: null,
    certificates: null
  }
};

const featureTargets = {
  hero: ['.hero-section'],
  about: ['#about', '#nav-about'],
  profileExplorer: ['#profile-explorer'],
  impact: ['#impact'],
  recruiter: ['#recruiter'],
  workProfile: ['#work-profile'],
  experience: ['#experience', '#nav-experience'],
  services: ['#services', '#nav-services'],
  projects: ['#projects', '#nav-projects'],
  certificates: ['#certificates', '#nav-certificates'],
  contact: ['#contact', '#nav-contact'],
  footer: ['#footer-copy', '#footer-back-top']
};

function isFeatureEnabled(name) {
  const value = config.features?.[name];
  return value !== 0 && value !== false;
}

function hexToRgbChannels(value) {
  const hex = String(value || '').trim().replace(/^#/, '');
  const normalized = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16)).join(', ');
}

function applyTheme() {
  const colors = config.theme?.colors || {};
  const root = document.documentElement;
  const variables = {
    background: '--bg',
    backgroundSoft: '--bg-soft',
    backgroundEnd: '--bg-end',
    text: '--text',
    muted: '--muted',
    accent: '--accent',
    accentSecondary: '--accent-2',
    accentTertiary: '--accent-3'
  };

  Object.entries(variables).forEach(([key, variable]) => {
    if (colors[key]) root.style.setProperty(variable, colors[key]);
  });

  const rgbVariables = {
    background: '--bg-rgb',
    accent: '--accent-rgb',
    accentSecondary: '--accent-2-rgb',
    accentTertiary: '--accent-3-rgb'
  };

  Object.entries(rgbVariables).forEach(([key, variable]) => {
    const channels = hexToRgbChannels(colors[key]);
    if (channels) root.style.setProperty(variable, channels);
  });

  const themeColor = qs('meta[name="theme-color"]');
  if (themeColor && colors.background) themeColor.setAttribute('content', colors.background);
}

function renderBranding() {
  const branding = config.branding || {};
  const profileName = config.profile?.name || '';

  qsa('.brand-logo, .hero-panel-logo').forEach((image) => {
    if (branding.logo) image.src = branding.logo;
    image.alt = branding.logoAlt || profileName;
  });

  const aboutImage = qs('#about-image');
  if (aboutImage && branding.aboutImage) aboutImage.src = branding.aboutImage;
  if (aboutImage && branding.aboutImagePosition) aboutImage.style.objectPosition = branding.aboutImagePosition;

  const favicon = qs('link[rel="icon"]');
  if (favicon && branding.favicon) favicon.href = branding.favicon;

  const socialPreview = branding.socialPreview ? new URL(branding.socialPreview, document.baseURI).href : '';
  const ogImage = qs('meta[property="og:image"]');
  const twitterImage = qs('meta[name="twitter:image"]');
  if (ogImage && socialPreview) ogImage.setAttribute('content', socialPreview);
  if (twitterImage && socialPreview) twitterImage.setAttribute('content', socialPreview);

  const heroName = qs('#hero-name');
  if (heroName && profileName) heroName.textContent = profileName;
}

function renderSocialLinks() {
  const root = qs('#hero-links');
  if (!root) return;

  const links = Array.isArray(config.socialLinks) ? config.socialLinks.filter((item) => item?.url) : [];
  root.innerHTML = links.map((item) => `
    <li>
      <a href="${item.url}" target="_blank" rel="noopener" data-social="${item.id || ''}">
        <i class="bi ${item.icon || 'bi-arrow-up-right-circle-fill'} social-brand-icon" aria-hidden="true"></i>
        <span>${item.label || item.id || ''}</span>
      </a>
    </li>
  `).join('');

  root.classList.toggle('is-feature-disabled', !isFeatureEnabled('socialLinks') || !links.length);
}

function applyFeatureVisibility() {
  Object.entries(featureTargets).forEach(([feature, selectors]) => {
    const enabled = isFeatureEnabled(feature);
    selectors.forEach((selector) => {
      qsa(selector).forEach((element) => element.classList.toggle('is-feature-disabled', !enabled));
    });
  });

  qsa('[data-lang-switcher]').forEach((switcher) => {
    switcher.classList.toggle('is-feature-disabled', !isFeatureEnabled('languageSwitcher'));
  });

}

function replacePlaceholders(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderProjectAccessLink(project, className = 'project-access-link') {
  const access = window.PortfolioProjectLinks.accessUrl(project, config);
  if (!access) return '';

  const label = state.data.projectsSection.accessCta;
  const ariaLabel = replacePlaceholders(state.data.projectsSection.accessAriaLabel, { title: project.title });
  return `
    <a
      class="${className}"
      href="${escapeAttribute(access)}"
      target="_blank"
      rel="noopener noreferrer"
      data-track="project_external_click" data-content-id="${window.PortfolioProjectLinks.slugFor(project)}"
      aria-label="${escapeAttribute(ariaLabel)}">
      <span>${label}</span>
      <i class="icon bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i>
    </a>
  `;
}

function detectLocale() {
  const queryLocale = new URLSearchParams(window.location.search).get('lang');
  if (queryLocale && config.locales.includes(queryLocale)) return queryLocale;
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

function updateMeta() {
  const meta = state.data.meta;
  const values = { name: config.profile?.name || '', nickname: config.profile?.nickname || '' };
  document.documentElement.lang = state.locale;
  document.title = replacePlaceholders(meta.title, values);

  const description = qs('meta[name="description"]');
  const ogTitle = qs('meta[property="og:title"]');
  const ogDescription = qs('meta[property="og:description"]');
  const ogLocale = qs('meta[property="og:locale"]');
  const twitterTitle = qs('meta[name="twitter:title"]');
  const twitterDescription = qs('meta[name="twitter:description"]');
  const socialTitle = replacePlaceholders(meta.ogTitle, values);
  const socialDescription = replacePlaceholders(meta.ogDescription, values);
  const ogLocales = { 'pt-BR': 'pt_BR', en: 'en_US', es: 'es_ES' };

  if (description) description.setAttribute('content', replacePlaceholders(meta.description, values));
  if (ogTitle) ogTitle.setAttribute('content', socialTitle);
  if (ogDescription) ogDescription.setAttribute('content', socialDescription);
  if (ogLocale) ogLocale.setAttribute('content', ogLocales[state.locale] || 'pt_BR');
  if (twitterTitle) twitterTitle.setAttribute('content', socialTitle);
  if (twitterDescription) twitterDescription.setAttribute('content', socialDescription);
}

let heroRoleTimer;

function rotateHeroRoles(hero) {
  window.clearInterval(heroRoleTimer);
  const rotating = qs('.hero-role__rotating');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero.roles?.length) return;
  rotating.replaceChildren(...hero.roles.map((role) => {
    const item = document.createElement('span');
    item.textContent = role;
    return item;
  }));
  const roles = [...rotating.children];
  let active = 0;
  roles[active].classList.add('is-current');

  heroRoleTimer = window.setInterval(() => {
    if (document.hidden || motion.matches) return;
    roles[active].classList.remove('is-current');
    active = (active + 1) % roles.length;
    roles[active].classList.add('is-current');
  }, 3400);
}

function renderStaticText() {
  const { hero, about, experienceSection, servicesSection, projectsSection, certificatesSection, contactSection, footer } = state.data;

  qs('.skip-link').textContent = state.data.accessibility.skipToContent;
  window.PortfolioNavigation.localize(state.data, state.locale, 'portfolio');
  qs('#hero-links').setAttribute('aria-label', state.data.accessibility.socialLinks);
  qs('#hero-stats').setAttribute('aria-label', state.data.accessibility.professionalSummary);
  const homeCtas = state.data.homeCtas || {};
  const ctaMap = {
    '#home-about-link': homeCtas.about,
    '#home-experience-link': homeCtas.experience,
    '#home-projects-link': homeCtas.projects
  };
  Object.entries(ctaMap).forEach(([selector, value]) => {
    const node = qs(selector);
    if (node && value) node.textContent = value;
  });
  qs('.hero-role__static').textContent = hero.eyebrow;
  rotateHeroRoles(hero);
  qs('.hero-secondary span').textContent = hero.projectsCta;
  qs('.hero-secondary').hidden = !isFeatureEnabled('projects');
  qs('#hero-text').textContent = hero.text;
  const heroCvDownload = qs('#hero-cv-download');
  const heroCvDownloadLabel = qs('#hero-cv-download-label');
  if (heroCvDownload) {
    heroCvDownload.href = config.cvByLocale?.[state.locale] || config.cvByLocale?.[config.defaultLocale] || '#';
    heroCvDownload.setAttribute('download', state.locale === 'pt-BR' ? 'Bruno_Getten_Triches_Curriculo.pdf' : 'Bruno_Getten_Triches_Resume.pdf');
  }
  if (heroCvDownloadLabel) heroCvDownloadLabel.textContent = hero.primaryCta;

  qs('#about-eyebrow').textContent = about.eyebrow;
  qs('#about-title').textContent = about.title;
  qs('#about-text-1').textContent = about.paragraphs[0];
  qs('#about-text-2').textContent = about.paragraphs[1] || '';
  qs('#skills-label').textContent = about.skillsLabel;
  qs('#about-image').alt = about.imageAlt;

  const profileExplorer = state.data.profileExplorer;
  if (profileExplorer) {
    const explorerEyebrow = qs('#profile-explorer-eyebrow');
    const explorerTitle = qs('#profile-explorer-title');
    const explorerText = qs('#profile-explorer-text');
    const tabsRoot = qs('#profile-tabs');
    if (explorerEyebrow) explorerEyebrow.textContent = profileExplorer.eyebrow;
    if (explorerTitle) explorerTitle.textContent = profileExplorer.title;
    if (explorerText) explorerText.textContent = profileExplorer.text;
    if (tabsRoot) tabsRoot.setAttribute('aria-label', profileExplorer.tabsLabel);
  }

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
  qs('#education-eyebrow').textContent = certificatesSection.educationEyebrow;
  qs('#education-title').textContent = certificatesSection.educationTitle;
  qs('#education-text').textContent = certificatesSection.educationText;
  qs('#certificates-list-kicker').textContent = certificatesSection.certificatesListKicker || certificatesSection.eyebrow;
  qs('#certificates-list-title').textContent = certificatesSection.certificatesListTitle;
  qs('#certificates-list-text').textContent = certificatesSection.certificatesListText || certificatesSection.text;
  qs('#credential-count-label').textContent = certificatesSection.credentialsCountLabel || '';
  qs('#credential-badge-count-label').textContent = certificatesSection.badgesCountLabel || '';
  qs('#credential-summary').setAttribute('aria-label', certificatesSection.summaryAriaLabel || certificatesSection.certificatesListTitle);
  qs('#certificates-library-link').textContent = certificatesSection.libraryCta || certificatesSection.credentialCta;

  qs('#contact-eyebrow').textContent = contactSection.eyebrow;
  qs('#contact-title').textContent = contactSection.title;
  qs('#contact-text').textContent = contactSection.text;

  qs('#footer-copy').innerHTML = `© <span id="current-year"></span> ${config.profile?.name || ''}. ${footer.rights}`;
  qs('#footer-back-top').textContent = footer.backToTop;

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
    <details class="skill-item reveal" ${config.profileExplorer?.compactSkillsOnMobile === 0 ? 'open' : ''}>
      <summary>
        <h3>${item.name}</h3>
        <i class="bi bi-caret-down-fill skill-toggle-icon" aria-hidden="true"></i>
      </summary>
      <div class="skill-item-body">
        <p>${item.description || ''}</p>
        <div class="skill-tags" aria-label="${item.name}">
          ${(item.tags || []).map((tag) => `<span>${tag}</span>`).join('')}
        </div>
      </div>
    </details>
  `).join('');
}

function renderProfileImpactList(explorer) {
  if (!isFeatureEnabled('impact') || config.profileExplorer?.showImpactDetails === 0) return '';
  const impacts = Array.isArray(state.data.impacts) ? state.data.impacts : [];
  if (!impacts.length) return '';

  return `
    <section class="profile-impact-block" id="profile-impact-block">
      <div class="profile-subheading">
        <div>
          <span class="profile-subheading-kicker">${explorer.resultsTitle}</span>
          <p>${explorer.resultsText}</p>
        </div>
      </div>
      <div class="profile-impact-list">
        ${impacts.map((item, index) => `
          <details class="profile-impact-item" ${config.profileExplorer?.openFirstImpact && index === 0 ? 'open' : ''}>
            <summary>
              <span class="profile-impact-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <span class="profile-impact-summary">
                <strong>${item.title}</strong>
                <small>${item.company} · ${item.period}</small>
              </span>
              <i class="bi bi-caret-down-fill" aria-hidden="true"></i>
            </summary>
            <div class="profile-impact-content">
              <p>${item.result}</p>
              <ul>${(item.bullets || []).map((bullet) => `<li>${bullet}</li>`).join('')}</ul>
            </div>
          </details>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProfileActions(explorer) {
  if (!isFeatureEnabled('recruiter')) return '';
  const actions = [
    { href: config.cvByLocale['pt-BR'], label: explorer.actions?.cvPt, icon: 'bi-file-earmark-text-fill' },
    { href: config.cvByLocale.en, label: explorer.actions?.cvEn, icon: 'bi-file-earmark-text-fill' },
    { href: config.contactLinks?.linkedin, label: explorer.actions?.linkedin, icon: 'bi-linkedin' },
    { href: config.contactLinks?.whatsapp, label: explorer.actions?.whatsapp, icon: 'bi-whatsapp' }
  ].filter((item) => item.href && item.label);

  if (!actions.length) return '';

  return `
    <div class="profile-actions" id="profile-actions">
      <span class="profile-actions-title">${explorer.actionsTitle}</span>
      <div class="profile-actions-links">
        ${actions.map((item) => `<a href="${escapeAttribute(item.href)}" target="_blank" rel="noopener"><i class="bi ${item.icon}" aria-hidden="true"></i><span>${item.label}</span></a>`).join('')}
      </div>
    </div>
  `;
}

function renderProfilePanel(tab, explorer) {
  const cards = Array.isArray(tab.cards) ? tab.cards : [];
  const showImpacts = tab.showImpacts === true;

  return `
    <section
      class="profile-panel"
      id="profile-panel-${tab.id}"
      role="tabpanel"
      data-profile-panel="${tab.id}"
      aria-labelledby="profile-tab-${tab.id}"
      hidden>
      <div class="profile-panel-intro">
        <span class="profile-panel-icon" aria-hidden="true"><i class="bi ${tab.icon || 'bi-check-circle-fill'}"></i></span>
        <div>
          <h4>${tab.title}</h4>
          <p>${tab.text}</p>
        </div>
      </div>
      <div class="profile-card-grid">
        ${cards.map((card) => `
          <article class="profile-card">
            <span class="profile-card-icon" aria-hidden="true"><i class="bi ${card.icon || 'bi-check-circle-fill'}"></i></span>
            <div>
              <h5>${card.title}</h5>
              <p>${card.text}</p>
            </div>
          </article>
        `).join('')}
      </div>
      ${showImpacts ? renderProfileImpactList(explorer) : ''}
      ${showImpacts ? renderProfileActions(explorer) : ''}
    </section>
  `;
}

function setProfileExplorerTab(tabId, options = {}) {
  const tabs = Array.isArray(state.data?.profileExplorer?.tabs) ? state.data.profileExplorer.tabs : [];
  const fallback = tabs.find((tab) => tab.id === config.profileExplorer?.defaultTab)?.id || tabs[0]?.id;
  const nextId = tabs.some((tab) => tab.id === tabId) ? tabId : fallback;
  if (!nextId) return;

  state.profileTab = nextId;
  qsa('[data-profile-tab]').forEach((button) => {
    const active = button.dataset.profileTab === nextId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });

  qsa('[data-profile-panel]').forEach((panel) => {
    const active = panel.dataset.profilePanel === nextId;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });

  if (config.profileExplorer?.rememberSelection !== 0) {
    window.localStorage.setItem('portfolio-profile-tab', nextId);
  }

  if (options.focus) qs(`[data-profile-tab="${nextId}"]`)?.focus();

  const phoneTabLayout = ['grid', 'scroll'].includes(config.profileExplorer?.phoneTabLayout)
    ? config.profileExplorer.phoneTabLayout
    : 'grid';
  const phoneGridLayout = phoneTabLayout === 'grid' && window.innerWidth <= 520;
  if (config.profileExplorer?.mobileScrollActiveTab !== 0 && window.innerWidth <= 760 && !phoneGridLayout) {
    const activeButton = qs(`[data-profile-tab="${nextId}"]`);
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function renderProfileExplorer() {
  const explorer = state.data?.profileExplorer;
  const tabsRoot = qs('#profile-tabs');
  const panelsRoot = qs('#profile-panels');
  if (!explorer || !tabsRoot || !panelsRoot) return;

  const phoneTabLayout = ['grid', 'scroll'].includes(config.profileExplorer?.phoneTabLayout)
    ? config.profileExplorer.phoneTabLayout
    : 'grid';
  tabsRoot.dataset.phoneLayout = phoneTabLayout;

  const tabs = Array.isArray(explorer.tabs) ? explorer.tabs : [];
  if (!tabs.length) {
    tabsRoot.innerHTML = '';
    panelsRoot.innerHTML = '';
    return;
  }

  tabsRoot.innerHTML = tabs.map((tab) => `
    <button
      class="profile-tab"
      type="button"
      role="tab"
      id="profile-tab-${tab.id}"
      data-profile-tab="${tab.id}"
      aria-controls="profile-panel-${tab.id}"
      aria-selected="false"
      tabindex="-1">
      <i class="bi ${tab.icon || 'bi-circle'}" aria-hidden="true"></i>
      <span>${tab.label}</span>
    </button>
  `).join('');

  panelsRoot.innerHTML = tabs.map((tab) => renderProfilePanel(tab, explorer)).join('');

  qsa('[data-profile-tab]', tabsRoot).forEach((button) => {
    button.addEventListener('click', () => setProfileExplorerTab(button.dataset.profileTab));
    button.addEventListener('keydown', (event) => {
      const buttons = qsa('[data-profile-tab]', tabsRoot);
      const currentIndex = buttons.indexOf(event.currentTarget);
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = buttons.length - 1;
      else return;

      event.preventDefault();
      setProfileExplorerTab(buttons[nextIndex].dataset.profileTab, { focus: true });
    });
  });

  const remembered = config.profileExplorer?.rememberSelection !== 0
    ? window.localStorage.getItem('portfolio-profile-tab')
    : null;
  const initial = tabs.some((tab) => tab.id === state.profileTab)
    ? state.profileTab
    : (tabs.some((tab) => tab.id === remembered) ? remembered : config.profileExplorer?.defaultTab);
  setProfileExplorerTab(initial || tabs[0].id);
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

function renderWorkProfile() {
  const root = qs('#work-profile-grid');
  if (!root || !Array.isArray(state.data.workProfileHighlights)) return;
  root.innerHTML = state.data.workProfileHighlights.map((item) => `
    <article class="work-profile-card reveal">
      <span class="work-profile-icon" aria-hidden="true"><i class="bi ${item.icon || 'bi-check-circle-fill'}"></i></span>
      <div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>
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
  const actionItems = [
    { className: 'btn btn-primary', href: config.cvByLocale['pt-BR'], label: state.data.recruiterSection.actions.cvPt },
    { className: 'btn btn-secondary', href: config.cvByLocale.en, label: state.data.recruiterSection.actions.cvEn }
  ];

  if (isFeatureEnabled('contact')) {
    actionItems.push(
      { className: 'btn btn-secondary', href: config.contactLinks.whatsapp, label: state.data.recruiterSection.actions.whatsapp },
      { className: 'btn btn-secondary', href: config.contactLinks.linkedin, label: state.data.recruiterSection.actions.linkedin }
    );
  }

  actions.innerHTML = actionItems
    .filter((item) => item.href)
    .map((item) => `<a class="${item.className}" href="${item.href}" target="_blank" rel="noopener">${item.label}</a>`)
    .join('');
}

function renderExperience() {
  const root = qs('#experience-list');
  root.innerHTML = state.data.experience.slice(0, 4).map((item) => `
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
  root.innerHTML = state.data.services.map((item, index) => `
    <article class="service-card service-card--enhanced reveal">
      <div class="service-card__glow" aria-hidden="true"></div>
      <div class="service-card__header">
        <span class="service-card__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="service-card__icon-shell" aria-hidden="true"><i class="bi ${item.icon} service-icon"></i></span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <div class="service-card__footer" aria-hidden="true">
        <span class="service-card__footer-line"></span>
        <span class="service-card__footer-chip">◆</span>
      </div>
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

function destroyContentCarousel(kind) {
  const cleanup = state.carousels[kind];
  if (typeof cleanup === 'function') cleanup();
  state.carousels[kind] = null;
}

function getCarouselItemsPerView() {
  if (window.innerWidth <= 920) return 1;
  if (window.innerWidth <= 1120) return 2;
  return 3;
}

function initContentCarousel(root, kind) {
  const viewport = qs('[data-carousel-viewport]', root);
  const track = qs('[data-carousel-track]', root);
  const previousButton = qs('[data-carousel-previous]', root);
  const nextButton = qs('[data-carousel-next]', root);
  const status = qs('[data-carousel-status]', root);
  const controls = qs('[data-carousel-controls]', root);
  const cards = track ? [...track.children] : [];
  if (!viewport || !track || !previousButton || !nextButton || !status || !controls || !cards.length) return null;

  let page = 0;
  let timerId = null;
  let scrollTimerId = null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoplayEnabled = config.carousel?.autoplay !== 0 && config.carousel?.autoplay !== false && !prefersReducedMotion;
  const intervalMs = Math.max(2500, Number(config.carousel?.intervalMs) || 5000);

  const pageCount = () => Math.max(1, Math.ceil(cards.length / getCarouselItemsPerView()));
  const clampPage = (value) => {
    const count = pageCount();
    return ((value % count) + count) % count;
  };
  const maxScrollLeft = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const getCardScrollLeft = (card) => {
    if (!card) return 0;

    const viewportRect = viewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const absoluteCardLeft = viewport.scrollLeft + cardRect.left - viewportRect.left;

    return Math.min(maxScrollLeft(), Math.max(0, absoluteCardLeft));
  };
  const getPageScrollLeft = (targetPage) => {
    const perView = getCarouselItemsPerView();
    const cardIndex = Math.min(targetPage * perView, cards.length - 1);
    return getCardScrollLeft(cards[cardIndex]);
  };

  const updateUi = () => {
    const count = pageCount();
    page = Math.min(page, count - 1);
    controls.hidden = count <= 1;
    status.textContent = replacePlaceholders(state.data.carousel.status, { current: page + 1, count });
  };

  const scrollToPage = (targetPage, behavior = prefersReducedMotion ? 'auto' : 'smooth') => {
    page = clampPage(targetPage);
    viewport.scrollTo({ left: getPageScrollLeft(page), behavior });
    updateUi();
  };

  const stopAutoplay = () => {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (!autoplayEnabled || pageCount() <= 1 || document.hidden) return;
    timerId = window.setInterval(() => scrollToPage(page + 1), intervalMs);
  };

  const restartAutoplay = () => {
    startAutoplay();
  };

  const syncPageFromScroll = () => {
    if (scrollTimerId) window.clearTimeout(scrollTimerId);
    scrollTimerId = window.setTimeout(() => {
      const starts = Array.from({ length: pageCount() }, (_, index) => getPageScrollLeft(index));
      page = starts.reduce((best, offset, index) => (
        Math.abs(offset - viewport.scrollLeft) < Math.abs(starts[best] - viewport.scrollLeft) ? index : best
      ), 0);
      updateUi();
    }, 90);
  };

  const handleResize = () => {
    scrollToPage(Math.min(page, pageCount() - 1), 'auto');
    startAutoplay();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  };

  const handleFocusOut = (event) => {
    if (!root.contains(event.relatedTarget)) startAutoplay();
  };

  previousButton.addEventListener('click', () => {
    scrollToPage(page - 1);
    restartAutoplay();
  });
  nextButton.addEventListener('click', () => {
    scrollToPage(page + 1);
    restartAutoplay();
  });
  viewport.addEventListener('scroll', syncPageFromScroll, { passive: true });
  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);
  root.addEventListener('focusin', stopAutoplay);
  root.addEventListener('focusout', handleFocusOut);
  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  updateUi();
  startAutoplay();

  return () => {
    stopAutoplay();
    if (scrollTimerId) window.clearTimeout(scrollTimerId);
    viewport.removeEventListener('scroll', syncPageFromScroll);
    root.removeEventListener('mouseenter', stopAutoplay);
    root.removeEventListener('mouseleave', startAutoplay);
    root.removeEventListener('focusin', stopAutoplay);
    root.removeEventListener('focusout', handleFocusOut);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

function renderContentCarousel(root, kind, cardsMarkup) {
  destroyContentCarousel(kind);
  const sectionLabel = kind === 'projects'
    ? state.data.carousel.projectsLabel
    : state.data.carousel.certificatesLabel;

  root.className = `content-carousel content-carousel-${kind}`;
  root.setAttribute('aria-label', sectionLabel);
  root.innerHTML = `
    <div class="content-carousel-controls" data-carousel-controls>
      <span class="content-carousel-status" data-carousel-status aria-live="polite"></span>
      <button class="content-carousel-button" type="button" data-carousel-previous aria-label="${replacePlaceholders(state.data.carousel.previousLabel, { section: sectionLabel })}">
        <i class="bi bi-caret-left-fill" aria-hidden="true"></i>
      </button>
      <button class="content-carousel-button" type="button" data-carousel-next aria-label="${replacePlaceholders(state.data.carousel.nextLabel, { section: sectionLabel })}">
        <i class="bi bi-caret-right-fill" aria-hidden="true"></i>
      </button>
    </div>
    <div class="content-carousel-viewport" data-carousel-viewport tabindex="0">
      <div class="content-carousel-track" data-carousel-track>${cardsMarkup}</div>
    </div>
  `;

  state.carousels[kind] = initContentCarousel(root, kind);
}

function renderProjectCard(project) {
  const cover = project.image;
  const path = window.PortfolioProjectLinks.projectPath(project);
  const media = cover
    ? `
      <a class="project-media project-gallery-trigger" href="${path}" data-track="select_content"
        data-content-id="${window.PortfolioProjectLinks.slugFor(project)}"
        aria-label="${escapeHtml(project.title)}">
        ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
        <img src="${escapeHtml(cover)}" alt="${replacePlaceholders(state.data.projectsSection.imageAlt, { title: project.title })}" loading="lazy" decoding="async" fetchpriority="low">
        <span class="project-cover-fallback" aria-hidden="true">
          <span class="project-media-empty-icon"><i class="icon bi bi-file-earmark-text-fill" aria-hidden="true"></i></span>
          <strong>${state.data.modal.unavailableTitle}</strong>
        </span>
        <span class="project-media-overlay" aria-hidden="true"></span>
        <span class="project-gallery-affordance" aria-hidden="true">${state.data.projectsSection.detailsCta} <i class="bi bi-arrow-right-circle-fill"></i></span>
      </a>
    `
    : `
      <div class="project-media project-media-empty" aria-label="${replacePlaceholders(state.data.projectsSection.noImagesAriaLabel, { title: project.title })}">
        ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
        <div class="project-media-empty-content">
          <span class="project-media-empty-icon"><i class="icon bi bi-file-earmark-text-fill" aria-hidden="true"></i></span>
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
        ${renderProjectAccessLink(project)}
      </div>
    </article>
  `;
}

function renderProjects() {
  const root = qs('#projects-list');
  const projects = state.activeCategory === 'all'
    ? state.data.projects
    : state.data.projects.filter((project) => project.category === state.activeCategory);
  const cardsMarkup = projects.map(renderProjectCard).join('');

  if (isFeatureEnabled('projectsCarousel')) {
    renderContentCarousel(root, 'projects', cardsMarkup);
  } else {
    destroyContentCarousel('projects');
    root.className = 'project-grid';
    root.removeAttribute('aria-label');
    root.innerHTML = cardsMarkup;
  }

  initProjectMediaFallbacks();
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



function renderEducationCard(item) {
  const status = item.status ? `<span class="education-status">${item.status}</span>` : '';

  const initials = String(item.institution || 'EDU').split(/\s+/).map((word) => word[0]).join('').slice(0, 3).toUpperCase();
  const brand = item.logo
    ? `<img src="${escapeAttribute(item.logo)}" alt="${escapeAttribute(item.logoAlt || item.institution || '')}" loading="lazy" decoding="async">`
    : `<span>${escapeHtml(initials)}</span>`;

  return `
    <article class="education-card reveal">
      <div class="education-card-brand">${brand}</div>
      <div class="education-card-copy">
        <div class="education-card-top">
          <span class="education-degree">${item.degree || state.data.certificatesSection.educationDefaultDegree}</span>
          <span class="education-period">${item.period || ''}</span>
        </div>
        <h4>${item.course || ''}</h4>
        <p class="education-institution">${item.institution || ''}</p>
        ${status}
        ${item.description ? `<p class="education-description">${item.description}</p>` : ''}
      </div>
    </article>
  `;
}

function renderEducation() {
  const block = qs('#education-block');
  const root = qs('#education-list');
  if (!block || !root) return;

  const items = Array.isArray(state.data.education)
    ? state.data.education.filter((item) => item && item.enabled !== 0 && item.enabled !== false)
    : [];
  const enabled = isFeatureEnabled('education') && items.length > 0;

  block.classList.toggle('is-feature-disabled', !enabled);
  root.innerHTML = enabled ? items.map(renderEducationCard).join('') : '';

  const languageStrip = qs('#language-training-strip');
  const languageCredential = Array.isArray(state.data.certificates)
    ? state.data.certificates.find((item) => item?.kind === 'language')
    : null;
  if (languageStrip) {
    if (!languageCredential) {
      languageStrip.hidden = true;
      languageStrip.innerHTML = '';
    } else {
      languageStrip.hidden = false;
      const languageLogo = languageCredential.logo || '';
      const languageLogoAlt = languageCredential.logoAlt || languageCredential.provider || 'CCAA';
      languageStrip.innerHTML = `
        <div class="language-training-strip__brand">
          ${languageLogo ? `<img src="${escapeAttribute(languageLogo)}" alt="${escapeAttribute(languageLogoAlt)}" loading="lazy" decoding="async">` : '<span>EN</span>'}
        </div>
        <div class="language-training-strip__copy">
          <div class="language-training-strip__topline">
            <span>${escapeHtml(state.data.certificatesSection.languageTrainingBadge || 'Formação complementar')}</span>
            <b>${escapeHtml(languageCredential.year || '')}</b>
          </div>
          <strong>${escapeHtml(state.data.certificatesSection.languageTrainingTitle || languageCredential.title || '')}</strong>
          <span>${escapeHtml(state.data.certificatesSection.languageTrainingText || '')}</span>
          <em>${escapeHtml(state.data.certificatesSection.languageTrainingHours || '450 horas')}</em>
        </div>
        <a href="biblioteca/#formation-library">${escapeHtml(state.data.certificatesSection.languageTrainingCta || state.data.certificatesSection.credentialCta)} <i class="icon bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i></a>`;
    }
  }
}

function renderCompactCredlyBadgeImage(badge, imageClass) {
  const badgeId = String(badge?.credlyBadgeId || '').trim();
  if (!badgeId) return '';

  const width = Number.isFinite(Number(badge.embedWidth)) ? Number(badge.embedWidth) : 150;
  const height = Number.isFinite(Number(badge.embedHeight)) ? Number(badge.embedHeight) : 270;
  const host = String(badge.embedHost || 'https://www.credly.com');
  const scale = Number.isFinite(Number(badge.compactScale)) ? Number(badge.compactScale) : 0.32;
  const offsetX = Number.isFinite(Number(badge.compactOffsetX)) ? Number(badge.compactOffsetX) : 0;
  const offsetY = Number.isFinite(Number(badge.compactOffsetY)) ? Number(badge.compactOffsetY) : 0;

  return `<span class="${imageClass} ${imageClass}--credly" data-credly-badge-id="${escapeAttribute(badgeId)}" style="--credly-scale:${escapeAttribute(String(scale))};--credly-x:${escapeAttribute(String(offsetX))}px;--credly-y:${escapeAttribute(String(offsetY))}px" aria-hidden="true">
    <span class="credly-compact-embed">
      <div data-iframe-width="${escapeAttribute(String(width))}" data-iframe-height="${escapeAttribute(String(height))}" data-share-badge-id="${escapeAttribute(badgeId)}" data-share-badge-host="${escapeAttribute(host)}"></div>
    </span>
  </span>`;
}

function refreshCredlyEmbeds(root = document) {
  if (!root?.querySelector?.('[data-share-badge-id]')) return;

  const previousScript = document.querySelector('script[data-credly-embed-script]');
  if (previousScript) previousScript.remove();

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://cdn.credly.com/assets/utilities/embed.js';
  script.dataset.credlyEmbedScript = 'true';
  document.body.appendChild(script);
}

function renderCertificateCard(item, index) {
  const section = state.data.certificatesSection || {};
  const badges = Array.isArray(item.badges) ? item.badges.filter((badge) => badge && (badge.image || badge.title)) : [];
  const providerClass = String(item.providerClass || '').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  const cardClasses = ['certificate-card', 'reveal'];
  if (item.featured) cardClasses.push('is-featured');
  if (badges.length) cardClasses.push('has-digital-badge');

  const imageMarkup = `
    <div class="certificate-media-wrap">
      <img class="certificate-media" src="${escapeAttribute(item.image || '')}" alt="${escapeAttribute(replacePlaceholders(section.imageAlt, { title: item.title }))}" loading="lazy" decoding="async" fetchpriority="low">
      ${item.featured ? `<span class="certificate-featured-mark" aria-hidden="true">${escapeHtml(item.providerClass === 'aws' ? 'AWS' : 'PRO')}</span>` : ''}
    </div>`;

  const mediaMarkup = item.url
    ? `<a class="certificate-media-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener" aria-label="${escapeAttribute(replacePlaceholders(section.credentialAriaLabel, { title: item.title }))}">${imageMarkup}</a>`
    : imageMarkup;

  const badgesMarkup = badges.length ? `
    <div class="certificate-digital-badges" aria-label="${escapeAttribute(section.verifiedBadgeLabel || 'Digital badge')}">
      ${badges.map((badge) => {
        const badgeInner = `
          ${badge.image ? `<span class="certificate-digital-badge__image"><img src="${escapeAttribute(badge.image)}" alt="" loading="lazy" decoding="async"></span>` : renderCompactCredlyBadgeImage(badge, 'certificate-digital-badge__image')}
          <span class="certificate-digital-badge__copy">
            <small>${escapeHtml(badge.label || section.verifiedBadgeLabel || 'Digital badge')}</small>
            <strong>${escapeHtml(badge.title || '')}</strong>
            <em>${escapeHtml(badge.issuer || '')}</em>
          </span>
          <i class="icon bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i>`;
        return badge.url
          ? `<a class="certificate-digital-badge" href="${escapeAttribute(badge.url)}" target="_blank" rel="noopener" aria-label="${escapeAttribute(`${section.verifyBadgeCta || 'Verify badge'}: ${badge.title || ''}`)}">${badgeInner}</a>`
          : `<div class="certificate-digital-badge">${badgeInner}</div>`;
      }).join('')}
    </div>` : '';

  return `
    <article class="${cardClasses.join(' ')}" data-certificate-index="${index}" data-provider="${escapeAttribute(providerClass || 'other')}">
      ${mediaMarkup}
      <div class="certificate-content">
        <div class="certificate-top">
          <span class="certificate-provider ${providerClass ? `is-${providerClass}` : ''}" aria-label="${escapeAttribute(section.providerBadgeLabel || '')}">${escapeHtml(item.provider || '')}</span>
          <span class="certificate-year">${escapeHtml(item.year || '')}</span>
        </div>
        <div class="certificate-kind-row">
          <span class="certificate-kind">${escapeHtml(item.credentialType || section.courseType || '')}</span>
          ${badges.length ? `<span class="certificate-badge-count"><span aria-hidden="true">◆</span>${badges.length}</span>` : ''}
        </div>
        <h3>${escapeHtml(item.title || '')}</h3>
        <div class="certificate-description-wrap">
          <p class="certificate-description is-collapsed">${escapeHtml(item.description || '')}</p>
          <button
            class="certificate-description-toggle"
            type="button"
            aria-expanded="false"
            aria-label="${escapeAttribute(replacePlaceholders(section.descriptionToggleAria, { title: item.title }))}"
            hidden>${escapeHtml(section.showMore || '')}</button>
        </div>
        ${Array.isArray(item.tags) && item.tags.length ? `
          <ul class="certificate-tags" aria-label="${escapeAttribute(section.tagsAriaLabel || '')}">
            ${item.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}
          </ul>
        ` : ''}
        ${badgesMarkup}
        ${item.url ? `
          <a class="certificate-link-label" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener" aria-label="${escapeAttribute(replacePlaceholders(section.credentialAriaLabel, { title: item.title }))}">
            <span>${escapeHtml(section.credentialCta || '')}</span>
            <i class="icon bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i>
          </a>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCertificates() {
  const root = qs('#certificates-list');
  if (!root || !Array.isArray(state.data.certificates)) return;

  const items = state.data.certificates.filter((item) => item && item.enabled !== 0 && item.enabled !== false);
  const badgeCount = items.reduce((total, item) => total + (Array.isArray(item.badges) ? item.badges.filter(Boolean).length : 0), 0);
  const credentialCount = qs('#credential-count');
  const digitalBadgeCount = qs('#credential-badge-count');
  if (credentialCount) credentialCount.textContent = String(items.length);
  if (digitalBadgeCount) digitalBadgeCount.textContent = String(badgeCount);
  const credentialCountLabel = qs('#credential-count-label');
  const digitalBadgeCountLabel = qs('#credential-badge-count-label');
  if (credentialCountLabel) credentialCountLabel.textContent = items.length === 1
    ? (state.data.certificatesSection.credentialCountSingular || state.data.certificatesSection.credentialsCountLabel || '')
    : (state.data.certificatesSection.credentialCountPlural || state.data.certificatesSection.credentialsCountLabel || '');
  if (digitalBadgeCountLabel) digitalBadgeCountLabel.textContent = badgeCount === 1
    ? (state.data.certificatesSection.badgeCountSingular || state.data.certificatesSection.badgesCountLabel || '')
    : (state.data.certificatesSection.badgeCountPlural || state.data.certificatesSection.badgesCountLabel || '');

  const cardsMarkup = items.map(renderCertificateCard).join('');
  if (isFeatureEnabled('certificatesCarousel')) {
    renderContentCarousel(root, 'certificates', cardsMarkup);
  } else {
    destroyContentCarousel('certificates');
    root.className = 'certificate-grid';
    root.removeAttribute('aria-label');
    root.innerHTML = cardsMarkup;
  }

  initCertificateDescriptionToggles();
  refreshCredlyEmbeds(root);
}

function syncCertificateDescriptionToggles() {
  qsa('.certificate-description-wrap').forEach((wrap) => {
    const description = qs('.certificate-description', wrap);
    const toggle = qs('.certificate-description-toggle', wrap);
    if (!description || !toggle) return;

    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      toggle.hidden = false;
      return;
    }

    description.classList.add('is-collapsed');
    const isOverflowing = description.scrollHeight > description.clientHeight + 1;
    toggle.hidden = !isOverflowing;
  });
}

function initCertificateDescriptionToggles() {
  qsa('.certificate-description-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const wrap = toggle.closest('.certificate-description-wrap');
      const description = wrap ? qs('.certificate-description', wrap) : null;
      if (!description) return;

      const willExpand = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(willExpand));
      description.classList.toggle('is-collapsed', !willExpand);
      description.classList.toggle('is-expanded', willExpand);
      toggle.textContent = willExpand
        ? state.data.certificatesSection.showLess
        : state.data.certificatesSection.showMore;
    });
  });

  window.requestAnimationFrame(syncCertificateDescriptionToggles);
}

function renderContacts() {
  const root = qs('#contact-grid');
  root.innerHTML = state.data.contacts.map((item) => `
    <a class="contact-card contact-link reveal" href="${config.contactLinks[item.id]}" ${item.external ? 'target="_blank" rel="noopener"' : ''} aria-label="${item.ariaLabel}" data-contact="${item.id}" data-track="contact_click">
      <div class="contact-icon-wrap">
        <i class="bi ${item.icon} contact-icon" aria-hidden="true"></i>
      </div>
      <div class="contact-content">
        <h3>${item.title}</h3>
        <strong>${item.value}</strong>
        <p>${item.text}</p>
      </div>
      <i class="contact-arrow bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i>
    </a>
  `).join('');
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


const galleryImagePreloadCache = new Map();

function initBackToTop() {
  qsa('a[href="#topo"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior });
    });
  });
}

async function applyLocale(locale) {
  const normalized = config.locales.includes(locale) ? locale : config.defaultLocale;
  state.locale = normalized;
  window.localStorage.setItem('portfolio-locale', normalized);
  state.data = await loadLocaleData(normalized);
  if (window.PortfolioProjectLinks.redirectLegacy(state.data.projects, state.data.modal.unavailableTitle)) return;
  state.activeCategory = 'all';

  updateMeta();
  applyFeatureVisibility();
  renderSocialLinks();
  renderStaticText();
  renderHeroStats();
  renderProfileExplorer();
  renderSkills();
  renderExperience();
  renderServices();
  renderFilters();
  renderProjects();
  renderEducation();
  renderCertificates();
  renderContacts();
  window.PortfolioRecommendationsUI?.render(normalized, state.data.recommendations);
  initReveal();
  setCurrentYear();
  window.PortfolioExperience?.setLocale?.(normalized, state.data);

}

async function init() {
  applyTheme();
  renderBranding();
  applyFeatureVisibility();
  window.PortfolioNavigation.bind();
  initBackToTop();

  const locale = detectLocale();
  await applyLocale(locale);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error);
  });
});
