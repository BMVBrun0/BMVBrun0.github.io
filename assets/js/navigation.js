(() => {
  'use strict';

  function bind() {
    const header = document.querySelector('.site-header');
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.site-nav');
    const menuIcon = toggle.querySelector('.bi');
    toggle.dataset.openLabel ||= toggle.getAttribute('aria-label');
    toggle.dataset.closeLabel ||= toggle.dataset.openLabel;
    const language = header.querySelector('[data-language]');
    const saved = new URL(location.href).searchParams.get('lang') || localStorage.getItem('portfolio-locale');
    if (window.portfolioConfig.locales.includes(saved)) language.value = saved;
    if (!window.portfolioConfig.features.languageSwitcher) language.hidden = true;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      menuIcon.classList.toggle('bi-list', !open);
      menuIcon.classList.toggle('bi-x-circle-fill', open);
      toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    }

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) setOpen(false);
    });
    header.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    matchMedia('(max-width: 1120px)').addEventListener('change', () => setOpen(false));
    window.addEventListener('pageshow', () => setOpen(false));
    language.addEventListener('change', () => {
      localStorage.setItem('portfolio-locale', language.value);
      window.PortfolioAnalytics?.track('language_change', { language: language.value });
      const url = new URL(location.href);
      url.searchParams.set('lang', language.value);
      location.assign(url.href);
    });
  }

  function localize(data, locale, currentPage) {
    const header = document.querySelector('.site-header');
    const language = header.querySelector('[data-language]');
    language.value = locale;
    language.setAttribute('aria-label', data.language.label);
    const toggle = header.querySelector('.nav-toggle');
    toggle.dataset.openLabel = data.accessibility.openMenu;
    toggle.dataset.closeLabel = data.accessibility.closeMenu;
    toggle.querySelector('[data-menu-label]').textContent = data.accessibility.menu;
    toggle.setAttribute('aria-label', toggle.getAttribute('aria-expanded') === 'true' ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    header.querySelector('.site-nav').setAttribute('aria-label', data.accessibility.mainNavigation);
    header.querySelectorAll('[data-main-nav]').forEach((link) => {
      const key = link.dataset.mainNav;
      link.textContent = data.nav[key] || link.textContent;
      if (key === currentPage) link.setAttribute('aria-current', 'page');
    });
  }

  window.PortfolioNavigation = { bind, localize };
})();
