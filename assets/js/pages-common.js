(() => {
  'use strict';

  const config = window.portfolioConfig || {};
  const extended = window.portfolioExtendedData || {};
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

  function detectLocale() {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('lang');
    if (fromQuery && config.locales?.includes(fromQuery)) return fromQuery;
    const saved = localStorage.getItem('portfolio-locale');
    if (saved && config.locales?.includes(saved)) return saved;
    const lang = String(navigator.language || '').toLowerCase();
    if (lang.startsWith('pt')) return 'pt-BR';
    if (lang.startsWith('es')) return 'es';
    return 'en';
  }

  async function loadLocale(locale) {
    const file = config.localeFiles?.[locale] || config.localeFiles?.[config.defaultLocale];
    const response = await fetch(file, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Failed to load locale: ${file}`);
    return response.json();
  }

  function applyTheme() {
    const map = {
      background: '--bg', backgroundSoft: '--bg-soft', backgroundEnd: '--bg-end', text: '--text', muted: '--muted', accent: '--accent', accentSecondary: '--accent-2', accentTertiary: '--accent-3'
    };
    Object.entries(config.theme?.colors || {}).forEach(([key, value]) => {
      if (map[key] && value) document.documentElement.style.setProperty(map[key], value);
    });
  }

  function imagePath(path) {
    return path || '';
  }

  function projectKey(project) {
    const image = String(project?.image || '').split('/').pop() || '';
    return project?.id || image.replace(/\.[^.]+$/, '');
  }

  function projectLink(project) {
    const item = config.projectLinks?.[projectKey(project)];
    if (!item || item.enabled === 0 || !item.url) return '';
    try {
      const url = new URL(item.url, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function galleryFor(project) {
    const configured = config.projectGalleries?.[project.image];
    const candidates = [project.image, ...(Array.isArray(configured) ? configured : [])].filter(Boolean);
    return [...new Set(candidates)].map(imagePath);
  }

  function companyName(title) {
    const raw = String(title || '');
    const parts = raw.split('·');
    return (parts[parts.length - 1] || raw).trim();
  }

  function getCompanyDetails(locale, experienceTitle) {
    const key = companyName(experienceTitle);
    const local = extended[locale]?.companyDetails || {};
    const fallback = extended['pt-BR']?.companyDetails || {};
    if (local[key]) return local[key];
    return locale === 'pt-BR' ? (fallback[key] || null) : null;
  }

  function languageOptions(locale) {
    return (config.locales || []).map((code) => {
      const option = config.languageOptions?.[code] || { label: code, flag: '' };
      return `<option value="${escapeHtml(code)}" ${code === locale ? 'selected' : ''}>${escapeHtml(option.flag)} ${escapeHtml(option.label)}</option>`;
    }).join('');
  }

  function closeLanguageMenus(except = null) {
    qsa('[data-lang-switcher]').forEach((switcher) => {
      if (except && switcher === except) return;
      switcher.classList.remove('is-open');
      const trigger = qs('[data-lang-trigger]', switcher);
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function applyHeaderLocale(locale) {
    const option = config.languageOptions?.[locale] || config.languageOptions?.[config.defaultLocale] || { flag: '', label: locale };
    qsa('[data-lang-switcher]').forEach((switcher) => {
      const flag = qs('[data-lang-current-flag]', switcher);
      const label = qs('[data-lang-current-text]', switcher);
      if (flag) flag.textContent = option.flag || '';
      if (label) label.textContent = option.label || locale;
      qsa('.lang-option', switcher).forEach((item) => {
        const active = item.dataset.locale === locale;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
    });
  }

  function navigateLocale(next) {
    if (!config.locales?.includes(next)) return;
    localStorage.setItem('portfolio-locale', next);
    const params = new URLSearchParams(location.search);
    params.set('lang', next);
    location.search = params.toString();
  }

  function closeSectionMenu() {
    const cluster = qs('[data-section-menu]');
    const trigger = qs('[data-section-menu-trigger]');
    if (!cluster || !trigger) return;
    cluster.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function bindSectionMenu() {
    const cluster = qs('[data-section-menu]');
    const trigger = qs('[data-section-menu-trigger]');
    if (!cluster || !trigger || trigger.dataset.bound === 'true') return;
    trigger.dataset.bound = 'true';
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !cluster.classList.contains('is-open');
      cluster.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    });
    qsa('[data-home-section]').forEach((link) => link.addEventListener('click', closeSectionMenu));
  }

  function bindLocaleSelect(locale) {
    bindSectionMenu();
    qsa('[data-page-language]').forEach((select) => {
      select.innerHTML = languageOptions(locale);
      select.addEventListener('change', () => navigateLocale(select.value));
    });

    applyHeaderLocale(locale);
    qsa('[data-lang-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        const switcher = event.currentTarget.closest('[data-lang-switcher]');
        const open = !switcher.classList.contains('is-open');
        closeLanguageMenus(open ? switcher : null);
        switcher.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', String(open));
      });
    });
    qsa('.lang-option').forEach((option) => option.addEventListener('click', () => navigateLocale(option.dataset.locale)));

    const toggle = qs('.nav-toggle');
    const nav = qs('.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      });
      qsa('a', nav).forEach((link) => link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-lang-switcher]')) closeLanguageMenus();
      if (!event.target.closest('[data-section-menu]')) closeSectionMenu();
      if (nav && toggle && nav.classList.contains('is-open') && !event.target.closest('.site-header')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeLanguageMenus();
      closeSectionMenu();
      if (nav && toggle) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function localizeSharedHeader(data, currentPage = '') {
    const navCopy = data?.nav || {};
    qsa('[data-main-nav]').forEach((node) => {
      const key = node.dataset.mainNav;
      if (navCopy[key]) node.textContent = navCopy[key];
    });
    const parentLabel = qs('#nav-portfolio-label');
    if (parentLabel) parentLabel.textContent = navCopy.portfolio || 'Portfólio';
    const labels = {
      topo: navCopy.overview || 'Visão geral',
      about: navCopy.about,
      experience: navCopy.experience,
      projects: navCopy.projects,
      certificates: navCopy.certificates,
      contact: navCopy.contact
    };
    qsa('[data-home-section]').forEach((link) => {
      const label = labels[link.dataset.homeSection];
      const text = qs('span', link);
      if (label && text) text.textContent = label;
      link.classList.remove('is-current');
      link.removeAttribute('aria-current');
    });
    const currentLabel = qs('[data-nav-current-label]');
    if (currentLabel) currentLabel.textContent = labels.topo || 'Visão geral';

    const languageLabel = data?.language?.label || 'Idioma';
    const desktop = qs('#language-label-desktop');
    const mobile = qs('#language-label-mobile');
    if (desktop) desktop.textContent = languageLabel;
    if (mobile) mobile.textContent = languageLabel;
    qsa('.lang-option').forEach((option) => {
      const helper = qs('small', option);
      const localizedHelper = data?.language?.options?.[option.dataset.locale];
      if (helper && localizedHelper) helper.textContent = localizedHelper;
    });
    qsa('.site-nav > a').forEach((node) => {
      node.classList.remove('is-current');
      node.removeAttribute('aria-current');
    });
    const current = currentPage === 'library' ? qs('#nav-library') : currentPage === 'resume' ? qs('#nav-resume') : null;
    if (current) {
      current.classList.add('is-current');
      current.setAttribute('aria-current', 'page');
    }
    renderSharedFooter(data);
    initPageNetworkBackground();
  }


  function renderSharedFooter(data) {
    const footer = qs('[data-shared-footer]');
    if (!footer) return;
    const year = new Date().getFullYear();
    const rights = data?.footer?.rights || 'Todos os direitos reservados.';
    const backToTop = data?.footer?.backToTop || 'Voltar ao topo';
    const locale = detectLocale();
    const creditLabel = locale === 'en' ? 'Template by' : locale === 'es' ? 'Plantilla por' : 'Template por';
    footer.innerHTML = `
      <div class="container footer-shell">
        <p id="footer-copy">© <span id="current-year">${year}</span> ${escapeHtml(config.profile?.name || 'Bruno Getten Triches')}. ${escapeHtml(rights)}</p>
        <a href="#topo" class="back-top" id="footer-back-top">${escapeHtml(backToTop)}</a>
        <div class="bm-template-credit" id="bm-template-credit" aria-label="${escapeHtml(creditLabel)}">
          <img class="bm-template-credit__logo" src="${escapeHtml(config.branding?.logo || 'assets/img/brand/logo-bm-white.webp')}" alt="${escapeHtml(config.branding?.logoAlt || 'Logo BM')}" loading="lazy" decoding="async">
          <span class="bm-template-credit__text">
            <span>${escapeHtml(creditLabel)}</span>
            <strong class="bm-template-credit__name">${escapeHtml(config.profile?.name || 'Bruno Getten Triches')}</strong>
            <span aria-hidden="true">·</span>
            <a class="bm-template-credit__email" href="mailto:trichesbruno@gmail.com">trichesbruno@gmail.com</a>
          </span>
        </div>
      </div>`;
  }

  function initPageNetworkBackground() {
    if (!document.body.classList.contains('page-shell') || qs('.page-network-background')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'page-network-background';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let points = [];
    let last = 0;

    const seeded = (index) => {
      const x = Math.sin(index * 9283.173 + 17.31) * 43758.5453;
      return x - Math.floor(x);
    };

    const readPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      return [
        styles.getPropertyValue('--accent').trim() || '#ff3ac8',
        styles.getPropertyValue('--accent-2').trim() || '#6b44ff',
        styles.getPropertyValue('--accent-3').trim() || '#5cd1ff'
      ];
    };

    const rebuild = () => {
      width = Math.max(1, innerWidth);
      height = Math.max(1, innerHeight);
      dpr = Math.min(devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 700 ? 34 : 62;
      points = Array.from({ length: count }, (_, i) => ({
        x: seeded(i * 5 + 1) * width,
        y: seeded(i * 5 + 2) * height,
        baseX: seeded(i * 5 + 1) * width,
        baseY: seeded(i * 5 + 2) * height,
        phase: seeded(i * 5 + 3) * Math.PI * 2,
        speed: .00008 + seeded(i * 5 + 4) * .00011,
        size: 1 + seeded(i * 5 + 5) * 2.2,
        color: i % 3
      }));
    };

    const draw = (time = 0) => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      const palette = readPalette();
      const moving = !reduceMotion.matches;
      for (const point of points) {
        const drift = moving ? 12 : 0;
        point.x = point.baseX + Math.sin(time * point.speed + point.phase) * drift;
        point.y = point.baseY + Math.cos(time * point.speed * .82 + point.phase) * drift;
      }
      const linkDistance = width < 700 ? 128 : 172;
      ctx.lineWidth = .8;
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j += 1) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > linkDistance) continue;
          ctx.globalAlpha = (1 - distance / linkDistance) * .18;
          ctx.strokeStyle = palette[(a.color + b.color) % palette.length];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const point of points) {
        ctx.globalAlpha = .46;
        ctx.fillStyle = palette[point.color];
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (moving && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (frame || document.hidden) return;
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const resize = () => { stop(); rebuild(); draw(performance.now()); start(); };
    rebuild();
    draw(performance.now());
    start();
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    reduceMotion.addEventListener?.('change', resize);
  }

  function setBranding() {
    qsa('[data-page-logo]').forEach((img) => {
      img.src = config.branding?.logo || 'assets/img/brand/logo-bm-white.webp';
      img.alt = config.branding?.logoAlt || config.profile?.name || 'Bruno Getten Triches';
    });
  }

  function uniqueTechnologies(projects) {
    const values = new Set();
    projects.forEach((project) => {
      (project.stack || []).forEach((item) => values.add(String(item).trim()));
      (project.details?.technologies || []).forEach((item) => values.add(String(item?.name || '').trim()));
    });
    values.delete('');
    return [...values];
  }

  window.PortfolioPages = {
    config,
    extended,
    qs,
    qsa,
    escapeHtml,
    detectLocale,
    loadLocale,
    applyTheme,
    imagePath,
    projectKey,
    projectLink,
    galleryFor,
    getCompanyDetails,
    bindLocaleSelect,
    localizeSharedHeader,
    setBranding,
    renderSharedFooter,
    initPageNetworkBackground,
    uniqueTechnologies
  };
})();
