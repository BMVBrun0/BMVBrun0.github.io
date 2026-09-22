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
  activeHomeSection: 'topo',
  profileTab: window.localStorage.getItem('portfolio-profile-tab') || config.profileExplorer?.defaultTab || 'overview',
  roleIntervalId: null,
  loadedLocales: new Map(),
  carousels: {
    projects: null,
    certificates: null
  },
  gallery: {
    items: [],
    index: 0,
    title: '',
    project: null,
    tabs: [],
    activeTab: null,
    lastTrigger: null,
    pointerStartX: null,
    isFullscreen: false,
    imageRequestId: 0,
    zoom: 1,
    rotation: 0
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
        <i class="bi ${item.icon || 'bi-arrow-up-right'} social-brand-icon" aria-hidden="true"></i>
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

function getProjectConfigKey(project) {
  if (project?.id) return String(project.id).trim();
  const image = String(project?.image || '').split('/').pop() || '';
  return image.replace(/\.[^.]+$/, '');
}

function normalizeHttpUrl(value) {
  const rawUrl = String(value || '').trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function getProjectAccessLink(project) {
  if (!isFeatureEnabled('projectLinks')) return null;

  const key = getProjectConfigKey(project);
  const linkConfig = key ? config.projectLinks?.[key] : null;
  if (!linkConfig || linkConfig.enabled === 0 || linkConfig.enabled === false) return null;

  const url = normalizeHttpUrl(linkConfig.url);
  return url ? { key, url } : null;
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderProjectAccessLink(project, className = 'project-access-link') {
  const access = getProjectAccessLink(project);
  if (!access) return '';

  const label = state.data.projectsSection.accessCta;
  const ariaLabel = replacePlaceholders(state.data.projectsSection.accessAriaLabel, { title: project.title });
  return `
    <a
      class="${className}"
      href="${escapeAttribute(access.url)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${escapeAttribute(ariaLabel)}">
      <span>${label}</span>
      <svg class="icon"><use href="#icon-arrow-up-right"></use></svg>
    </a>
  `;
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
      const optionLocale = option.dataset.locale;
      const isActive = optionLocale === activeLocale;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-selected', String(isActive));
      const helper = option.querySelector('small');
      const localizedHelper = state.data?.language?.options?.[optionLocale];
      if (helper && localizedHelper) helper.textContent = localizedHelper;
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

function renderStaticText() {
  const { nav, hero, about, experienceSection, servicesSection, projectsSection, certificatesSection, contactSection, footer, language } = state.data;

  qs('.skip-link').textContent = state.data.accessibility.skipToContent;
  qs('.brand').setAttribute('aria-label', state.data.accessibility.backToTop);
  qs('.nav-toggle').setAttribute('aria-label', state.data.accessibility.openMenu);
  qs('#site-nav').setAttribute('aria-label', state.data.accessibility.mainNavigation);
  qs('#hero-links').setAttribute('aria-label', state.data.accessibility.socialLinks);
  qs('.hero-panel').setAttribute('aria-label', state.data.accessibility.professionalSummary);
  const portfolioLabel = qs('#nav-portfolio-label');
  if (portfolioLabel) portfolioLabel.textContent = nav.portfolio || 'Portfólio';
  const homeSectionLabels = {
    topo: nav.overview || 'Visão geral',
    about: nav.about,
    experience: nav.experience,
    projects: nav.projects,
    certificates: nav.certificates,
    contact: nav.contact
  };
  qsa('[data-home-section]').forEach((link) => {
    const label = homeSectionLabels[link.dataset.homeSection];
    const text = qs('span', link);
    if (label && text) text.textContent = label;
  });
  const libraryNav = qs('#nav-library');
  const resumeNav = qs('#nav-resume');
  if (libraryNav) libraryNav.textContent = nav.library || 'Biblioteca';
  if (resumeNav) resumeNav.textContent = nav.resume || 'Currículo+';
  const homeCtas = state.data.homeCtas || {};
  const ctaMap = {
    '#home-about-link': homeCtas.about,
    '#home-experience-link': homeCtas.experience,
    '#home-projects-link': homeCtas.projects,
    '#home-education-link': homeCtas.education
  };
  Object.entries(ctaMap).forEach(([selector, value]) => {
    const node = qs(selector);
    if (node && value) node.textContent = value;
  });
  setHomeSectionActive(state.activeHomeSection);

  qs('#language-label-desktop').textContent = language.label;
  qs('#language-label-mobile').textContent = language.label;
  const transformLabels = [
    ['#image-modal-zoom-in', state.data.modal.zoomIn],
    ['#image-modal-zoom-out', state.data.modal.zoomOut],
    ['#image-modal-rotate-left', state.data.modal.rotateLeft],
    ['#image-modal-rotate-right', state.data.modal.rotateRight],
    ['#image-modal-reset', state.data.modal.resetView]
  ];
  transformLabels.forEach(([selector, label]) => {
    const button = qs(selector);
    if (!button || !label) return;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  });

  qs('#hero-eyebrow').textContent = hero.eyebrow;
  qs('#hero-role-prefix').textContent = hero.rolePrefix;
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
  qs('#certificates-text').textContent = certificatesSection.text;
  qs('#education-eyebrow').textContent = certificatesSection.educationEyebrow;
  qs('#education-title').textContent = certificatesSection.educationTitle;
  qs('#education-text').textContent = certificatesSection.educationText;
  qs('#certificates-list-title').textContent = certificatesSection.certificatesListTitle;

  qs('#contact-eyebrow').textContent = contactSection.eyebrow;
  qs('#contact-title').textContent = contactSection.title;
  qs('#contact-text').textContent = contactSection.text;

  qs('#footer-copy').innerHTML = `© <span id="current-year"></span> ${config.profile?.name || ''}. ${footer.rights}`;
  qs('#footer-back-top').textContent = footer.backToTop;

  const closeButton = qs('.image-modal-close');
  closeButton.setAttribute('aria-label', state.data.modal.closeLabel);
  qs('#image-modal-prev').setAttribute('aria-label', state.data.modal.previousLabel);
  qs('#image-modal-next').setAttribute('aria-label', state.data.modal.nextLabel);
  const fullscreenButton = qs('#image-modal-fullscreen');
  if (fullscreenButton) {
    updateGalleryFullscreenButton();
  }
  qs('#image-modal-kicker').textContent = state.data.modal.kicker;
  qs('#image-modal-title').textContent = state.data.modal.title;
  qs('#image-modal-caption').textContent = state.data.modal.initialCaption;
  qs('#project-modal-tabs').setAttribute('aria-label', state.data.modal.tabsLabel);
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
    <details class="skill-item reveal" ${config.profileExplorer?.compactSkillsOnMobile === 0 ? 'open' : ''}>
      <summary>
        <h3>${item.name}</h3>
        <i class="bi bi-chevron-down skill-toggle-icon" aria-hidden="true"></i>
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
              <i class="bi bi-chevron-down" aria-hidden="true"></i>
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
    { href: config.cvByLocale['pt-BR'], label: explorer.actions?.cvPt, icon: 'bi-file-earmark-text' },
    { href: config.cvByLocale.en, label: explorer.actions?.cvEn, icon: 'bi-file-earmark-text' },
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
        <span class="profile-panel-icon" aria-hidden="true"><i class="bi ${tab.icon || 'bi-check2-circle'}"></i></span>
        <div>
          <h4>${tab.title}</h4>
          <p>${tab.text}</p>
        </div>
      </div>
      <div class="profile-card-grid">
        ${cards.map((card) => `
          <article class="profile-card">
            <span class="profile-card-icon" aria-hidden="true"><i class="bi ${card.icon || 'bi-check2-circle'}"></i></span>
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
      <span class="work-profile-icon" aria-hidden="true"><i class="bi ${item.icon || 'bi-check2-circle'}"></i></span>
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

function hasProjectContent(value) {
  if (Array.isArray(value)) return value.some((item) => hasProjectContent(item));
  if (typeof value === 'string') return value.trim().length > 0;
  if (value && typeof value === 'object') return Object.values(value).some((item) => hasProjectContent(item));
  return value !== null && value !== undefined && value !== false;
}

function getProjectTabs(project) {
  const details = project.details || {};
  const gallery = getProjectGallery(project);
  const tabs = [];

  if (hasProjectContent(details.description) || hasProjectContent(details.features) || hasProjectContent(details.pricing)) {
    tabs.push({ id: 'overview', label: state.data.modal.overviewTab });
  }
  if (hasProjectContent(details.technicalSpecs) || hasProjectContent(details.technologies) || hasProjectContent(project.stack)) {
    tabs.push({ id: 'technical', label: state.data.modal.technicalTab });
  }
  if (gallery.length) {
    tabs.push({ id: 'images', label: state.data.modal.imagesTab });
  }

  if (window.PortfolioExperience?.extendProjectTabs) {
    return window.PortfolioExperience.extendProjectTabs(tabs, project, state.data);
  }

  return tabs;
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
  const dots = qs('[data-carousel-dots]', root);
  const status = qs('[data-carousel-status]', root);
  const controls = qs('[data-carousel-controls]', root);
  const cards = track ? [...track.children] : [];
  if (!viewport || !track || !previousButton || !nextButton || !dots || !status || !controls || !cards.length) return null;

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

  const renderDots = () => {
    const count = pageCount();
    dots.innerHTML = Array.from({ length: count }, (_, index) => `
      <button
        type="button"
        class="content-carousel-dot ${index === page ? 'is-active' : ''}"
        data-carousel-page="${index}"
        aria-current="${index === page ? 'true' : 'false'}"
        aria-label="${replacePlaceholders(state.data.carousel.pageLabel, { current: index + 1, count })}"></button>
    `).join('');

    qsa('[data-carousel-page]', dots).forEach((button) => {
      button.addEventListener('click', () => {
        scrollToPage(Number(button.dataset.carouselPage));
        restartAutoplay();
      });
    });
  };

  const updateUi = () => {
    const count = pageCount();
    page = Math.min(page, count - 1);
    controls.hidden = count <= 1;
    status.textContent = replacePlaceholders(state.data.carousel.status, { current: page + 1, count });
    renderDots();
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
    <div class="content-carousel-viewport" data-carousel-viewport tabindex="0">
      <div class="content-carousel-track" data-carousel-track>${cardsMarkup}</div>
    </div>
    <div class="content-carousel-controls" data-carousel-controls>
      <div class="content-carousel-dots" data-carousel-dots></div>
      <button class="content-carousel-button" type="button" data-carousel-previous aria-label="${replacePlaceholders(state.data.carousel.previousLabel, { section: sectionLabel })}">
        <svg class="icon"><use href="#icon-chevron-left"></use></svg>
      </button>
      <button class="content-carousel-button" type="button" data-carousel-next aria-label="${replacePlaceholders(state.data.carousel.nextLabel, { section: sectionLabel })}">
        <svg class="icon"><use href="#icon-chevron-right"></use></svg>
      </button>
      <span class="sr-only" data-carousel-status aria-live="polite"></span>
    </div>
  `;

  state.carousels[kind] = initContentCarousel(root, kind);
}

function renderProjectCard(project) {
  const gallery = getProjectGallery(project);
  const cover = project.image ? normalizeGalleryItem(project.image, project, 0) : gallery[0];
  const tabs = getProjectTabs(project);
  const sectionCount = tabs.length;
  const sectionCountLabel = sectionCount === 1
    ? state.data.projectsSection.sectionCountSingle
    : replacePlaceholders(state.data.projectsSection.sectionCountMultiple, { count: sectionCount });

  const media = cover
    ? `
      <button
        type="button"
        class="project-media project-gallery-trigger"
        data-project-index="${state.data.projects.indexOf(project)}"
        aria-label="${replacePlaceholders(state.data.projectsSection.detailsAriaLabel, {
          title: project.title,
          countLabel: sectionCountLabel
        })}">
        ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
        <img src="${cover.src}" alt="${replacePlaceholders(state.data.projectsSection.imageAlt, { title: project.title })}" loading="lazy" decoding="async" fetchpriority="low">
        <span class="project-cover-fallback" aria-hidden="true">
          <span class="project-media-empty-icon"><svg class="icon"><use href="#icon-details"></use></svg></span>
          <strong>${state.data.modal.unavailableTitle}</strong>
        </span>
        <span class="project-media-overlay" aria-hidden="true"></span>
        <span class="project-gallery-affordance" aria-hidden="true">
          <span class="project-gallery-affordance-icon"><svg class="icon"><use href="#icon-details"></use></svg></span>
          <span class="project-gallery-affordance-copy"><strong>${state.data.projectsSection.detailsCta}</strong></span>
          <span class="project-gallery-affordance-arrow"><svg class="icon"><use href="#icon-arrow-up-right"></use></svg></span>
        </span>
      </button>
    `
    : `
      <div class="project-media project-media-empty" aria-label="${replacePlaceholders(state.data.projectsSection.noImagesAriaLabel, { title: project.title })}">
        ${project.comingSoon ? `<span class="project-media-badge">${state.data.projectsSection.comingSoonLabel}</span>` : ''}
        <div class="project-media-empty-content">
          <span class="project-media-empty-icon"><svg class="icon"><use href="#icon-details"></use></svg></span>
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



function renderEducationCard(item) {
  const status = item.status ? `<span class="education-status">${item.status}</span>` : '';
  const educationUrl = normalizeHttpUrl(item.url);
  const credentialLink = educationUrl ? `
    <a class="education-link" href="${escapeAttribute(educationUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttribute(replacePlaceholders(state.data.certificatesSection.educationLinkAriaLabel, { title: item.course }))}">
      <span>${state.data.certificatesSection.educationLinkCta}</span>
      <svg class="icon"><use href="#icon-arrow-up-right"></use></svg>
    </a>
  ` : '';
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
        ${credentialLink}
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
        <a href="library.html#formation-library">${escapeHtml(state.data.certificatesSection.languageTrainingCta || state.data.certificatesSection.credentialCta)} <svg class="icon"><use href="#icon-arrow-up-right"></use></svg></a>`;
    }
  }
}

function renderCertificateCard(item, index) {
  return `
    <article class="certificate-card reveal" data-certificate-index="${index}">
      <div class="certificate-media-wrap">
        <img class="certificate-media" src="${item.image || ''}" alt="${replacePlaceholders(state.data.certificatesSection.imageAlt, { title: item.title })}" loading="lazy" decoding="async" fetchpriority="low">
      </div>
      <div class="certificate-content">
        <div class="certificate-top">
          <span class="certificate-provider ${item.providerClass ? `is-${item.providerClass}` : ''}" aria-label="${state.data.certificatesSection.providerBadgeLabel}">${item.provider}</span>
          <span class="certificate-year">${item.year}</span>
        </div>
        <h3>${item.title}</h3>
        <div class="certificate-description-wrap">
          <p class="certificate-description is-collapsed">${item.description}</p>
          <button
            class="certificate-description-toggle"
            type="button"
            aria-expanded="false"
            aria-label="${replacePlaceholders(state.data.certificatesSection.descriptionToggleAria, { title: item.title })}"
            hidden>${state.data.certificatesSection.showMore}</button>
        </div>
        ${Array.isArray(item.tags) && item.tags.length ? `
          <ul class="certificate-tags" aria-label="${state.data.certificatesSection.tagsAriaLabel}">
            ${item.tags.map((tag) => `<li>${tag}</li>`).join('')}
          </ul>
        ` : ''}
        ${item.url ? `
          <a class="certificate-link-label" href="${item.url}" target="_blank" rel="noopener" aria-label="${replacePlaceholders(state.data.certificatesSection.credentialAriaLabel, { title: item.title })}">
            <span>${state.data.certificatesSection.credentialCta}</span>
            <svg class="icon"><use href="#icon-arrow-up-right"></use></svg>
          </a>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCertificates() {
  const root = qs('#certificates-list');
  if (!root || !Array.isArray(state.data.certificates)) return;

  const cardsMarkup = state.data.certificates.slice(0, 4).map(renderCertificateCard).join('');
  if (isFeatureEnabled('certificatesCarousel')) {
    renderContentCarousel(root, 'certificates', cardsMarkup);
  } else {
    destroyContentCarousel('certificates');
    root.className = 'certificate-grid';
    root.removeAttribute('aria-label');
    root.innerHTML = cardsMarkup;
  }

  initCertificateDescriptionToggles();
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
    <a class="contact-card contact-link reveal" href="${config.contactLinks[item.id]}" ${item.external ? 'target="_blank" rel="noopener"' : ''} aria-label="${item.ariaLabel}" data-contact="${item.id}">
      <div class="contact-icon-wrap">
        <i class="bi ${item.icon} contact-icon" aria-hidden="true"></i>
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
  if (state.roleIntervalId) {
    window.clearInterval(state.roleIntervalId);
    state.roleIntervalId = null;
  }
  if (!target || !isFeatureEnabled('hero')) return;

  const roles = state.data.hero.roles;
  let index = 0;

  const paint = () => {
    target.textContent = roles[index];
    index = (index + 1) % roles.length;
  };

  paint();
  state.roleIntervalId = window.setInterval(paint, 2200);
}

function closeSectionMenu() {
  const cluster = qs('[data-section-menu]');
  const trigger = qs('[data-section-menu-trigger]');
  if (!cluster || !trigger) return;
  cluster.classList.remove('is-open');
  trigger.setAttribute('aria-expanded', 'false');
}

function setHomeSectionActive(sectionId) {
  const links = qsa('[data-home-section]');
  if (!links.length) return;
  const active = links.find((link) => link.dataset.homeSection === sectionId) || links[0];
  state.activeHomeSection = active.dataset.homeSection || 'topo';
  links.forEach((link) => {
    const current = link === active;
    link.classList.toggle('is-current', current);
    if (current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const currentLabel = qs('[data-nav-current-label]');
  const activeText = qs('span', active)?.textContent?.trim();
  if (currentLabel && activeText) currentLabel.textContent = activeText;
  qs('[data-section-menu-trigger]')?.classList.toggle('has-current-section', true);
}

function initSectionMenu() {
  const cluster = qs('[data-section-menu]');
  const trigger = qs('[data-section-menu-trigger]');
  if (!cluster || !trigger) return;

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = !cluster.classList.contains('is-open');
    cluster.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  });

  qsa('[data-home-section]').forEach((link) => {
    link.addEventListener('click', () => closeSectionMenu());
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-section-menu]')) closeSectionMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSectionMenu();
  });

  const sectionEntries = [
    ['topo', qs('.hero-section')],
    ['about', qs('#about')],
    ['experience', qs('#experience')],
    ['projects', qs('#projects')],
    ['certificates', qs('#certificates')],
    ['contact', qs('#contact')]
  ].filter(([, element]) => element && !element.classList.contains('is-feature-disabled'));
  if (!sectionEntries.length) return;

  let frame = null;
  const update = () => {
    frame = null;
    const headerHeight = qs('.site-header')?.offsetHeight || 70;
    const position = window.scrollY + headerHeight + Math.min(180, window.innerHeight * 0.24);
    let active = sectionEntries[0][0];
    sectionEntries.forEach(([id, element]) => {
      if (position >= element.offsetTop) active = id;
    });
    setHomeSectionActive(active);
  };
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
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


const galleryImagePreloadCache = new Map();

function clearGalleryImageSizing() {
  const modalImage = qs('#image-modal-image');
  if (!modalImage) return;

  modalImage.style.removeProperty('width');
  modalImage.style.removeProperty('height');
  modalImage.style.removeProperty('max-width');
  modalImage.style.removeProperty('max-height');
}

function getGalleryStageAvailableSize() {
  const stage = qs('.image-modal-stage');
  if (!stage) return null;

  const style = window.getComputedStyle(stage);
  const horizontalPadding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
  const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);

  return {
    width: Math.max(1, stage.clientWidth - horizontalPadding - 4),
    height: Math.max(1, stage.clientHeight - verticalPadding - 4)
  };
}

function applyGalleryImageSizing(naturalWidth, naturalHeight) {
  const modalImage = qs('#image-modal-image');
  const available = getGalleryStageAvailableSize();
  if (!modalImage || !available || !naturalWidth || !naturalHeight) return;

  const containScale = Math.min(
    available.width / naturalWidth,
    available.height / naturalHeight,
    1
  );
  const fittedWidth = Math.max(1, Math.floor(naturalWidth * containScale));
  const fittedHeight = Math.max(1, Math.floor(naturalHeight * containScale));

  modalImage.style.width = `${fittedWidth}px`;
  modalImage.style.height = `${fittedHeight}px`;
  modalImage.style.maxWidth = 'none';
  modalImage.style.maxHeight = 'none';
}

function fitGalleryImageToStage() {
  const modal = qs('#image-modal');
  const modalImage = qs('#image-modal-image');

  if (!modal?.classList.contains('is-open') || !modalImage) return;
  if (modalImage.hidden || !modalImage.complete || !modalImage.naturalWidth || !modalImage.naturalHeight) return;

  applyGalleryImageSizing(modalImage.naturalWidth, modalImage.naturalHeight);
}

function preloadGalleryImage(src) {
  if (!src) return Promise.reject(new Error('Missing gallery image source.'));
  if (galleryImagePreloadCache.has(src)) return galleryImagePreloadCache.get(src);

  const request = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';

    image.addEventListener('load', async () => {
      try {
        if (typeof image.decode === 'function') await image.decode();
      } catch (_) {
      }

      resolve({
        src,
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    }, { once: true });

    image.addEventListener('error', () => {
      galleryImagePreloadCache.delete(src);
      reject(new Error(`Unable to load gallery image: ${src}`));
    }, { once: true });

    image.src = src;
  });

  galleryImagePreloadCache.set(src, request);
  return request;
}

function preloadAdjacentGalleryImages() {
  const total = state.gallery.items.length;
  if (total <= 1) return;

  const indexes = [
    (state.gallery.index - 1 + total) % total,
    (state.gallery.index + 1) % total
  ];

  [...new Set(indexes)].forEach((index) => {
    const src = state.gallery.items[index]?.src;
    if (src) preloadGalleryImage(src).catch(() => {});
  });
}

function updateGalleryImageShapeFromDimensions(naturalWidth, naturalHeight) {
  const modal = qs('#image-modal');
  if (!modal || !naturalWidth || !naturalHeight) return;

  const ratio = naturalWidth / naturalHeight;
  modal.classList.toggle('image-is-portrait', ratio < 0.82);
  modal.classList.toggle('image-is-square', ratio >= 0.82 && ratio <= 1.18);
  modal.classList.toggle('image-is-landscape', ratio > 1.18);
}

function updateGalleryFullscreenButton() {
  const button = qs('#image-modal-fullscreen');
  if (!button || !state.data) return;

  const label = state.gallery.isFullscreen
    ? state.data.modal.fullscreenExitLabel
    : state.data.modal.fullscreenEnterLabel;
  button.classList.toggle('is-active', state.gallery.isFullscreen);
  button.setAttribute('aria-pressed', String(state.gallery.isFullscreen));
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  const use = qs('use', button);
  if (use) use.setAttribute('href', state.gallery.isFullscreen ? '#icon-compress' : '#icon-expand');
}

function syncGalleryFullscreenState() {
  const modal = qs('#image-modal');
  if (!modal) return;

  const nativeFullscreen = document.fullscreenElement === modal;
  const fallbackFullscreen = modal.classList.contains('is-fullscreen-fallback');
  state.gallery.isFullscreen = nativeFullscreen || fallbackFullscreen;
  modal.classList.toggle('is-gallery-fullscreen', state.gallery.isFullscreen);
  updateGalleryFullscreenButton();
  window.requestAnimationFrame(fitGalleryImageToStage);
}

async function setGalleryFullscreen(enabled) {
  const modal = qs('#image-modal');
  if (!modal) return;
  if (enabled && state.gallery.activeTab !== 'images') return;

  if (!enabled) {
    modal.classList.remove('is-fullscreen-fallback');
    if (document.fullscreenElement === modal && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('Unable to exit fullscreen mode.', error);
      }
    }
    syncGalleryFullscreenState();
    return;
  }

  if (document.fullscreenElement === modal || modal.classList.contains('is-fullscreen-fallback')) {
    syncGalleryFullscreenState();
    return;
  }

  if (modal.requestFullscreen && document.fullscreenEnabled !== false) {
    try {
      await modal.requestFullscreen({ navigationUI: 'hide' });
    } catch (error) {
      try {
        await modal.requestFullscreen();
      } catch (fallbackError) {
        modal.classList.add('is-fullscreen-fallback');
      }
    }
  } else {
    modal.classList.add('is-fullscreen-fallback');
  }

  syncGalleryFullscreenState();
}

function exitGalleryFullscreenImmediately() {
  const modal = qs('#image-modal');
  if (!modal) return;

  modal.classList.remove('is-fullscreen-fallback', 'is-gallery-fullscreen');
  if (document.fullscreenElement === modal && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  state.gallery.isFullscreen = false;
  updateGalleryFullscreenButton();
}

function updateGalleryImageShape() {
  const modalImage = qs('#image-modal-image');
  if (!modalImage || !modalImage.naturalWidth || !modalImage.naturalHeight) return;

  updateGalleryImageShapeFromDimensions(modalImage.naturalWidth, modalImage.naturalHeight);
}

function renderProjectModalTabs() {
  const root = qs('#project-modal-tabs');
  if (!root) return;

  root.innerHTML = state.gallery.tabs.map((tab) => `
    <button
      type="button"
      class="project-modal-tab ${tab.id === state.gallery.activeTab ? 'is-active' : ''}"
      role="tab"
      id="project-tab-${tab.id}"
      data-project-tab="${tab.id}"
      aria-selected="${String(tab.id === state.gallery.activeTab)}"
      aria-controls="${tab.id === 'images' ? 'project-modal-gallery' : 'project-modal-content'}">${tab.label}</button>
  `).join('');

  qsa('[data-project-tab]', root).forEach((button) => {
    button.addEventListener('click', () => setProjectModalTab(button.dataset.projectTab));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = qsa('[data-project-tab]', root);
      const currentIndex = buttons.indexOf(button);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = buttons.length - 1;
      const next = buttons[nextIndex];
      if (next) {
        setProjectModalTab(next.dataset.projectTab);
        next.focus();
      }
    });
  });
}

function updateProjectModalTabState() {
  qsa('[data-project-tab]', qs('#project-modal-tabs')).forEach((button) => {
    const isActive = button.dataset.projectTab === state.gallery.activeTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
}

function renderProjectOverview(project) {
  const details = project.details || {};
  const pricing = Array.isArray(details.pricing) ? details.pricing : [];
  return `
    <section class="project-detail-section project-detail-overview">
      ${hasProjectContent(details.description) ? `
        <div class="project-detail-lead">
          <span class="project-detail-label">${state.data.modal.overviewTitle}</span>
          <p>${details.description}</p>
        </div>
      ` : ''}
      ${hasProjectContent(details.features) ? `
        <div class="project-detail-block">
          <h3>${state.data.modal.featuresTitle}</h3>
          <ul class="project-feature-grid">
            ${details.features.map((feature) => `
              <li><span class="project-feature-mark" aria-hidden="true">✓</span><span>${typeof feature === 'string' ? feature : feature.label || feature.value || ''}</span></li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
      ${pricing.length ? `
        <div class="project-detail-block">
          <h3>${state.data.modal.pricingTitle}</h3>
          <div class="project-pricing-grid">
            ${pricing.map((plan) => {
              if (typeof plan === 'string') return `<article class="project-pricing-card"><strong>${plan}</strong></article>`;
              const items = Array.isArray(plan.items) ? plan.items : [];
              return `<article class="project-pricing-card"><div class="project-pricing-heading"><strong>${plan.name || plan.title || ''}</strong>${plan.price ? `<span>${plan.price}</span>` : ''}</div>${plan.description ? `<p>${plan.description}</p>` : ''}${items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}</article>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
      ${renderProjectAccessLink(project, 'project-access-link project-access-link--modal')}
    </section>
  `;
}

function renderProjectTechnical(project) {
  const details = project.details || {};
  const specs = Array.isArray(details.technicalSpecs) ? details.technicalSpecs : [];
  const technologies = Array.isArray(details.technologies) ? details.technologies : [];
  const stack = Array.isArray(project.stack) ? project.stack.filter(Boolean) : [];
  const architectureNodes = stack.length ? stack : technologies.map((item) => typeof item === 'string' ? item : item.name || item.label || '').filter(Boolean);
  const decisionsLabel = state.data.modal.technicalDecisionsTitle || state.data.modal.technicalTitle;
  const technologiesLabel = state.data.modal.technologiesAndWhyTitle || state.data.modal.technologiesTitle;
  return `
    <section class="project-detail-section project-technical-story">
      <header class="project-technical-hero">
        <div class="project-technical-hero__copy">
          <span class="project-detail-label">${state.data.modal.technicalEyebrow || state.data.modal.technicalTitle}</span>
          <h3>${state.data.modal.technicalTitle}</h3>
          <p>${state.data.modal.technicalDescription || ''}</p>
        </div>
        <div class="project-technical-hero__metrics" aria-hidden="true">
          ${specs.length ? `<span><strong>${String(specs.length).padStart(2, '0')}</strong><small>${decisionsLabel}</small></span>` : ''}
          ${technologies.length ? `<span><strong>${String(technologies.length).padStart(2, '0')}</strong><small>${technologiesLabel}</small></span>` : ''}
          ${architectureNodes.length ? `<span><strong>${String(Math.min(architectureNodes.length, 8)).padStart(2, '0')}</strong><small>${state.data.modal.architectureTitle || 'Stack'}</small></span>` : ''}
        </div>
      </header>
      ${specs.length ? `<div class="project-detail-block project-technical-decisions"><div class="project-technical-section-heading"><span>01</span><h3>${decisionsLabel}</h3></div><ol class="project-decision-timeline">${specs.map((spec,index)=>{const label=typeof spec==='string'?'':spec.label||'';const body=typeof spec==='string'?spec:spec.value||spec.description||'';return `<li class="project-decision-item"><span class="project-decision-index">${String(index+1).padStart(2,'0')}</span><div>${label?`<strong>${label}</strong>`:''}<p>${body}</p></div></li>`;}).join('')}</ol></div>` : ''}
      ${technologies.length ? `<div class="project-detail-block project-technical-technologies"><div class="project-technical-section-heading"><span>02</span><h3>${technologiesLabel}</h3></div><ul class="project-technology-list project-technology-grid--rationale">${technologies.map((technology,index)=>{const label=typeof technology==='string'?technology:technology.name||technology.label||'';const detail=typeof technology==='object'?technology.description||technology.detail||'':'';return `<li><span class="project-technology-order">${String(index+1).padStart(2,'0')}</span><div><strong>${label}</strong>${detail?`<span>${detail}</span>`:''}</div><i aria-hidden="true"></i></li>`;}).join('')}</ul></div>` : ''}
      ${architectureNodes.length ? `<div class="project-detail-block project-architecture-block"><div class="project-technical-section-heading"><span>03</span><h3>${state.data.modal.architectureTitle || 'Arquitetura / stack'}</h3></div><div class="project-architecture-canvas"><div class="project-architecture-flow" aria-label="${state.data.modal.architectureAria || ''}">${architectureNodes.slice(0,8).map((node,index)=>`<span class="project-architecture-node"><i>${String(index+1).padStart(2,'0')}</i><strong>${node}</strong></span>${index<Math.min(architectureNodes.length,8)-1?'<b aria-hidden="true">→</b>':''}`).join('')}</div></div></div>` : ''}
    </section>`;
}

function renderProjectModalContent(tabId) {
  const root = qs('#project-modal-content');
  const project = state.gallery.project;
  if (!root || !project) return;

  if (tabId === 'overview') root.innerHTML = renderProjectOverview(project);
  else if (tabId === 'technical') root.innerHTML = renderProjectTechnical(project);
  else if (window.PortfolioExperience?.renderProjectTab) {
    const handled = window.PortfolioExperience.renderProjectTab({
      tabId,
      project,
      data: state.data,
      root
    });
    if (!handled) root.innerHTML = '';
  } else root.innerHTML = '';

  root.scrollTop = 0;
}

function applyGalleryTransform() {
  const image = qs('#image-modal-image');
  if (!image) return;
  image.style.transform = `scale(${state.gallery.zoom}) rotate(${state.gallery.rotation}deg)`;
  image.dataset.zoomed = state.gallery.zoom !== 1 || state.gallery.rotation !== 0 ? 'true' : 'false';
}

function resetGalleryTransform() {
  state.gallery.zoom = 1;
  state.gallery.rotation = 0;
  applyGalleryTransform();
}

function setProjectModalTab(tabId) {
  if (!state.gallery.tabs.some((tab) => tab.id === tabId)) return;

  state.gallery.activeTab = tabId;
  const galleryPane = qs('#project-modal-gallery');
  const contentPane = qs('#project-modal-content');
  const counter = qs('#image-modal-counter');
  const fullscreenButton = qs('#image-modal-fullscreen');
  const transformControls = qs('#image-modal-transform-controls');
  const isImages = tabId === 'images';

  if (!isImages) {
    state.gallery.imageRequestId += 1;
    qs('.image-modal-frame')?.classList.remove('is-image-loading');
    qs('.image-modal-frame')?.setAttribute('aria-busy', 'false');
    if (state.gallery.isFullscreen) setGalleryFullscreen(false);
  }
  if (galleryPane) {
    galleryPane.hidden = !isImages;
    if (isImages) galleryPane.setAttribute('aria-labelledby', `project-tab-${tabId}`);
    else galleryPane.removeAttribute('aria-labelledby');
  }
  if (contentPane) {
    contentPane.hidden = isImages;
    if (!isImages) contentPane.setAttribute('aria-labelledby', `project-tab-${tabId}`);
    else contentPane.removeAttribute('aria-labelledby');
  }
  if (counter) counter.hidden = !isImages;
  if (transformControls) transformControls.hidden = !isImages;
  if (fullscreenButton) {
    fullscreenButton.hidden = !isImages;
    fullscreenButton.disabled = !isImages;
    fullscreenButton.setAttribute('aria-hidden', String(!isImages));
    fullscreenButton.tabIndex = isImages ? 0 : -1;
  }

  updateProjectModalTabState();

  if (isImages) {
    updateProjectGallery();
    window.requestAnimationFrame(fitGalleryImageToStage);
  } else {
    renderProjectModalContent(tabId);
  }
}

function syncProjectGalleryThumbnails(thumbnails) {
  if (!thumbnails) return;

  const total = state.gallery.items.length;
  const hasMultipleImages = total > 1;
  thumbnails.hidden = !hasMultipleImages;

  if (!hasMultipleImages) {
    thumbnails.innerHTML = '';
    return;
  }

  let buttons = qsa('[data-gallery-index]', thumbnails);
  const needsRebuild = buttons.length !== total || buttons.some((button, index) => Number(button.dataset.galleryIndex) !== index);

  if (needsRebuild) {
    thumbnails.innerHTML = state.gallery.items.map((galleryItem, index) => `
      <button
        type="button"
        class="image-modal-thumbnail"
        data-gallery-index="${index}"
        aria-label="${replacePlaceholders(state.data.modal.thumbnailLabel, {
          index: index + 1,
          title: state.gallery.title
        })}"
        aria-current="false">
        <img src="${galleryItem.src}" alt="" loading="lazy" decoding="async" fetchpriority="low">
        <span>${String(index + 1).padStart(2, '0')}</span>
      </button>
    `).join('');

    buttons = qsa('[data-gallery-index]', thumbnails);
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextIndex = Number(button.dataset.galleryIndex);
        if (!Number.isInteger(nextIndex) || nextIndex === state.gallery.index) return;
        state.gallery.index = nextIndex;
        updateProjectGallery();
      });
    });
  }

  buttons.forEach((button, index) => {
    const isActive = index === state.gallery.index;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  const activeThumbnail = buttons[state.gallery.index];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  activeThumbnail?.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'center'
  });
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
  const frame = qs('.image-modal-frame');
  if (!modalImage || !modalFallback || !modalCaption || !modalCounter || !previousButton || !nextButton) return;

  const requestId = ++state.gallery.imageRequestId;
  resetGalleryTransform();
  const hasVisibleImage = Boolean(modalImage.getAttribute('src')) && !modalImage.hidden;

  modal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape');
  modalFallback.hidden = true;
  frame?.classList.add('is-image-loading');
  frame?.setAttribute('aria-busy', 'true');
  if (!hasVisibleImage) modalImage.hidden = true;

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
  previousButton.disabled = !hasMultipleImages;
  nextButton.disabled = !hasMultipleImages;
  syncProjectGalleryThumbnails(thumbnails);

  preloadGalleryImage(item.src)
    .then((loadedImage) => {
      if (requestId !== state.gallery.imageRequestId) return;
      if (!modal.classList.contains('is-open') || state.gallery.activeTab !== 'images') return;
      applyGalleryImageSizing(loadedImage.width, loadedImage.height);
      updateGalleryImageShapeFromDimensions(loadedImage.width, loadedImage.height);

      modalImage.alt = item.alt || replacePlaceholders(state.data.modal.imageAlt, {
        title: state.gallery.title,
        index: state.gallery.index + 1
      });
      modalImage.src = loadedImage.src;
      modalImage.hidden = false;
      modalFallback.hidden = true;
      applyGalleryTransform();

      frame?.classList.remove('is-image-loading');
      frame?.setAttribute('aria-busy', 'false');
      preloadAdjacentGalleryImages();
    })
    .catch(() => {
      if (requestId !== state.gallery.imageRequestId) return;
      modalImage.hidden = true;
      modalFallback.hidden = false;
      frame?.classList.remove('is-image-loading');
      frame?.setAttribute('aria-busy', 'false');
    });
}

function openProjectGallery(project, trigger) {
  const modal = qs('#image-modal');
  const modalTitle = qs('#image-modal-title');
  const closeButton = qs('.image-modal-close');
  const tabs = getProjectTabs(project);
  const gallery = getProjectGallery(project);
  if (!modal || !modalTitle || !closeButton || !tabs.length) return;

  state.gallery.items = gallery;
  state.gallery.index = 0;
  state.gallery.title = project.title;
  state.gallery.project = project;
  state.gallery.tabs = tabs;
  state.gallery.activeTab = tabs[0].id;
  state.gallery.lastTrigger = trigger;
  state.gallery.pointerStartX = null;
  state.gallery.isFullscreen = false;
  state.gallery.zoom = 1;
  state.gallery.rotation = 0;

  modalTitle.textContent = project.title;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  renderProjectModalTabs();
  setProjectModalTab(state.gallery.activeTab);
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
  const tabs = qs('#project-modal-tabs');
  const content = qs('#project-modal-content');
  if (!modal || !modalImage) return;

  const lastTrigger = state.gallery.lastTrigger;
  state.gallery.imageRequestId += 1;

  exitGalleryFullscreenImmediately();
  clearGalleryImageSizing();
  modal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modalImage.src = '';
  modalImage.alt = '';
  modalImage.hidden = true;
  qs('.image-modal-frame')?.classList.remove('is-image-loading');
  qs('.image-modal-frame')?.setAttribute('aria-busy', 'false');
  if (thumbnails) thumbnails.innerHTML = '';
  if (tabs) tabs.innerHTML = '';
  if (content) content.innerHTML = '';
  document.body.classList.remove('modal-open');

  state.gallery.items = [];
  state.gallery.index = 0;
  state.gallery.title = '';
  state.gallery.project = null;
  state.gallery.tabs = [];
  state.gallery.activeTab = null;
  state.gallery.lastTrigger = null;
  state.gallery.pointerStartX = null;
  state.gallery.isFullscreen = false;
  state.gallery.zoom = 1;
  state.gallery.rotation = 0;
  modalImage.style.transform = '';
  window.PortfolioExperience?.onProjectModalClose?.();

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
  qs('.image-modal-frame')?.classList.remove('is-image-loading');
  qs('.image-modal-frame')?.setAttribute('aria-busy', 'false');
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
    fitGalleryImageToStage();
  });

  qs('#image-modal-fullscreen')?.addEventListener('click', () => {
    setGalleryFullscreen(!state.gallery.isFullscreen);
  });

  qs('#image-modal-zoom-in')?.addEventListener('click', () => { state.gallery.zoom = Math.min(3, state.gallery.zoom + .25); applyGalleryTransform(); });
  qs('#image-modal-zoom-out')?.addEventListener('click', () => { state.gallery.zoom = Math.max(.5, state.gallery.zoom - .25); applyGalleryTransform(); });
  qs('#image-modal-rotate-left')?.addEventListener('click', () => { state.gallery.rotation -= 90; applyGalleryTransform(); });
  qs('#image-modal-rotate-right')?.addEventListener('click', () => { state.gallery.rotation += 90; applyGalleryTransform(); });
  qs('#image-modal-reset')?.addEventListener('click', resetGalleryTransform);

  const modalFrame = qs('.image-modal-frame');
  modalFrame?.addEventListener('wheel', (event) => {
    if (state.gallery.activeTab !== 'images' || !event.ctrlKey) return;
    event.preventDefault();
    state.gallery.zoom = Math.max(.5, Math.min(3, state.gallery.zoom + (event.deltaY < 0 ? .15 : -.15)));
    applyGalleryTransform();
  }, { passive: false });

  const stage = qs('.image-modal-stage');
  stage?.addEventListener('pointerdown', (event) => {
    state.gallery.pointerStartX = event.clientX;
  });
  stage?.addEventListener('pointerup', (event) => {
    if (state.gallery.pointerStartX === null || state.gallery.items.length <= 1) return;

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
      if (state.gallery.isFullscreen) {
        setGalleryFullscreen(false);
      } else {
        closeProjectGallery();
      }
      return;
    }

    if (state.gallery.activeTab !== 'images') return;

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

  document.addEventListener('fullscreenchange', () => {
    const modal = qs('#image-modal');
    if (!modal?.classList.contains('is-open')) return;
    if (document.fullscreenElement !== modal) modal.classList.remove('is-fullscreen-fallback');
    syncGalleryFullscreenState();
  });

  let galleryResizeFrame = null;
  const scheduleGalleryFit = () => {
    const modal = qs('#image-modal');
    if (!modal?.classList.contains('is-open') || state.gallery.activeTab !== 'images') return;

    if (galleryResizeFrame) window.cancelAnimationFrame(galleryResizeFrame);
    galleryResizeFrame = window.requestAnimationFrame(() => {
      galleryResizeFrame = null;
      fitGalleryImageToStage();
    });
  };

  window.addEventListener('resize', () => {
    syncCertificateDescriptionToggles();
    scheduleGalleryFit();
  });
  window.visualViewport?.addEventListener('resize', scheduleGalleryFit);
}


function initBackToTop() {
  qsa('a[href="#topo"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior });
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
      if (window.innerWidth <= 1120 && nav && toggle) {
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
  if (qs('#image-modal')?.classList.contains('is-open')) closeProjectGallery();
  const normalized = config.locales.includes(locale) ? locale : config.defaultLocale;
  state.locale = normalized;
  window.localStorage.setItem('portfolio-locale', normalized);
  state.data = await loadLocaleData(normalized);
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
  initRoleRotation();
  initReveal();
  setCurrentYear();
  window.PortfolioExperience?.setLocale?.(normalized, state.data);
}

async function init() {
  applyTheme();
  renderBranding();
  applyFeatureVisibility();
  initMenu();
  initSectionMenu();
  initModalEvents();
  initLanguageSwitcher();
  initBackToTop();

  const locale = detectLocale();
  syncLanguageSelects(locale);
  await applyLocale(locale);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error(error);
  });
});
