(async () => {
  'use strict';

  const P = window.PortfolioPages;
  const root = document.querySelector('[data-project]');
  const locale = P.detectLocale();
  P.applyTheme();
  P.setBranding();
  P.bindLocaleSelect();
  let data;
  try {
    data = await P.loadLocale(locale);
  } catch (error) {
    console.warn(error);
  }
  if (data) {
    const project = data.projects.find((item) => window.PortfolioProjectLinks.slugFor(item) === root.dataset.project);
    if (project) {
      document.documentElement.lang = locale;
      document.title = `${project.title} | ${P.config.profile.name}`;
      window.PortfolioNavigation.localize(data, locale, 'library');
      if (locale !== 'pt-BR') {
        root.innerHTML = window.PortfolioProjectContent.render(project, data, P.config, location.pathname + location.search);
      }
      const skip = document.querySelector('.skip-link');
      skip.textContent = data.accessibility.skipToContent;
      skip.href = P.fragment('main-content');
      root.querySelectorAll('.project-sections a').forEach((link) => {
        link.href = P.fragment(link.hash.slice(1));
      });
    }
  }

  const viewer = root.querySelector('dialog');
  const stage = viewer.querySelector('.photo-stage');
  const image = stage.querySelector('img');
  const original = viewer.querySelector('[data-photo-original]');
  const status = viewer.querySelector('[data-photo-count]');
  const previous = viewer.querySelector('[data-photo-prev]');
  const next = viewer.querySelector('[data-photo-next]');
  const close = viewer.querySelector('[data-photo-close]');
  const zoom = viewer.querySelector('[data-photo-zoom]');
  const screenshots = [...root.querySelectorAll('.project-shot')];
  let index = 0;
  let trigger;
  let touchStart;

  function setZoom(active) {
    stage.classList.toggle('is-zoomed', active);
    stage.tabIndex = active ? 0 : -1;
    zoom.setAttribute('aria-pressed', String(active));
    zoom.querySelector('i').classList.toggle('bi-plus-circle-fill', !active);
    zoom.querySelector('i').classList.toggle('bi-dash-circle-fill', active);
    stage.scrollTo(0, 0);
  }

  function show(number) {
    setZoom(false);
    index = (number + screenshots.length) % screenshots.length;
    const link = screenshots[index];
    image.hidden = true;
    stage.querySelector('p').hidden = true;
    image.src = link.href;
    image.alt = `${root.querySelector('h1').textContent} · ${index + 1}`;
    original.href = link.href;
    status.textContent = `${index + 1} / ${screenshots.length}`;
  }

  root.addEventListener('click', (event) => {
    const link = event.target.closest('[data-gallery-index]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !viewer.showModal) return;
    event.preventDefault();
    trigger = link;
    show(Number(link.dataset.galleryIndex));
    viewer.showModal();
    document.body.classList.add('photo-open');
    window.PortfolioAnalytics?.track('project_gallery_open', { content_id: root.dataset.project });
  });

  previous.hidden = next.hidden = screenshots.length < 2;
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', () => viewer.close());
  zoom.addEventListener('click', () => setZoom(!stage.classList.contains('is-zoomed')));
  viewer.addEventListener('close', () => {
    document.body.classList.remove('photo-open');
    trigger?.focus({ preventScroll: true });
  });
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('keydown', (event) => {
    if (!stage.classList.contains('is-zoomed') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  stage.addEventListener('touchstart', (event) => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    if (!touchStart || stage.classList.contains('is-zoomed') || event.touches.length || (window.visualViewport?.scale || 1) > 1) return;
    const dx = event.changedTouches[0].clientX - touchStart.clientX;
    const dy = event.changedTouches[0].clientY - touchStart.clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; });
  image.addEventListener('load', () => { image.hidden = false; });
  image.addEventListener('error', () => { stage.querySelector('p').hidden = false; });
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})();
