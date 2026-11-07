/* Project permalinks shared by Home and Library. No router or build step required. */
(() => {
  'use strict';

  const PARAM = 'project';
  const ENTRY_FLAG = '__portfolioProjectDetailEntry';
  const PUBLIC_LIBRARY_URL = 'https://bmvbrun0.github.io/library.html';
  // Public slugs for every project currently present in all three locales.
  // Changing a cover file? Preserve the old slug here to avoid breaking shared URLs.
  // New projects fall back to a normalized cover filename until added to this map.
  const SLUG_ALIASES = Object.freeze({
    setta_synk: 'settasynk',
    accessibility_plugin: 'accessibility-plugin',
    xtreme_fut: 'xtremefut',
    aletheia: 'aletheia',
    whitelabel_booking: 'whitelabel-booking',
    truco_game: 'truco-game',
    radar_publico: 'radar-publico',
    support_circle: 'support-circle',
    media_forge: 'media-forge',
    pocket_links: 'pocket-links',
    imobly: 'imobly',
    garimpei: 'garimpei',
    realtime_messaging: 'realtime-messaging'
  });
  const LABELS = {
    'pt-BR': { copy: 'Copiar link', copied: 'Link copiado!', unavailable: 'Não foi possível copiar. Copie o link exibido.', missing: 'Projeto não encontrado. Confira o link ou escolha um projeto abaixo.' },
    en: { copy: 'Copy link', copied: 'Link copied!', unavailable: 'Could not copy. Please copy the displayed link.', missing: 'Project not found. Check the link or select a project below.' },
    es: { copy: 'Copiar enlace', copied: '¡Enlace copiado!', unavailable: 'No se pudo copiar. Copia el enlace mostrado.', missing: 'Proyecto no encontrado. Comprueba el enlace o elige un proyecto abajo.' }
  };
  const META_SELECTORS = [
    'meta[name="description"]', 'meta[property="og:title"]',
    'meta[property="og:description"]', 'meta[property="og:url"]',
    'meta[name="twitter:title"]', 'meta[name="twitter:description"]',
    'link[rel="canonical"]'
  ];

  function slugFor(project) {
    const filename = String(project?.image || '').split('/').pop() || '';
    const key = filename.replace(/\.[^.]+$/, '').toLowerCase();
    if (!key) return '';
    return SLUG_ALIASES[key] || key.replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function shareUrl(project) {
    const slug = slugFor(project);
    if (!slug) return '';
    const url = new URL(PUBLIC_LIBRARY_URL);
    url.searchParams.set(PARAM, slug);
    return url.href;
  }

  function currentSlug() {
    return new URL(window.location.href).searchParams.get(PARAM);
  }

  function urlWithSlug(slug) {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set(PARAM, slug);
    else url.searchParams.delete(PARAM);
    return url.href;
  }

  function captureMetadata() {
    return {
      title: document.title,
      tags: META_SELECTORS.map((selector) => {
        const el = document.querySelector(selector);
        return { selector, value: el?.getAttribute(el.tagName === 'LINK' ? 'href' : 'content') ?? null };
      })
    };
  }

  function setMeta(selector, value) {
    const element = document.querySelector(selector);
    if (!element || value === null) return;
    element.setAttribute(element.tagName === 'LINK' ? 'href' : 'content', value);
  }

  function createController({ projects, locale, openView, closeView, getOpenProject }) {
    let activeLocale = locale;
    let bySlug = new Map();
    let originalMetadata = captureMetadata();
    const headerActions = document.querySelector('#image-modal .image-modal-header-actions');
    const shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'project-deeplink-copy';
    shareButton.innerHTML = '<span class="project-deeplink-copy__icon" aria-hidden="true">🔗</span><span class="project-deeplink-copy__label"></span>';
    shareButton.hidden = true;
    headerActions?.insertBefore(shareButton, headerActions.firstChild);
    const shareLabel = shareButton.querySelector('.project-deeplink-copy__label');

    const notice = document.createElement('p');
    notice.className = 'project-deeplink-notice';
    notice.setAttribute('role', 'status');
    notice.hidden = true;
    document.querySelector('main')?.prepend(notice);

    function labels() { return LABELS[activeLocale] || LABELS['pt-BR']; }
    function resetCopyLabel() {
      shareLabel.textContent = labels().copy;
      shareButton.setAttribute('aria-label', labels().copy);
      shareButton.title = labels().copy;
    }
    resetCopyLabel();

    function setCatalog(items, nextLocale) {
      activeLocale = nextLocale;
      bySlug = new Map();
      (items || []).filter((project) => !project.hidden).forEach((project) => {
        const slug = slugFor(project);
        if (!slug) return;
        if (bySlug.has(slug)) console.warn('Duplicate project permalink:', slug);
        else bySlug.set(slug, project);
      });
      originalMetadata = captureMetadata();
      resetCopyLabel();
    }
    setCatalog(projects, locale);

    function restoreMetadata() {
      document.title = originalMetadata.title;
      originalMetadata.tags.forEach(({ selector, value }) => setMeta(selector, value));
    }

    function updateMetadata(project) {
      const title = `${project.title} | Bruno Getten Triches`;
      const description = String(project.description || project.details?.description || '').trim();
      const url = shareUrl(project);
      document.title = title;
      setMeta('meta[property="og:title"]', title);
      setMeta('meta[name="twitter:title"]', title);
      if (description) {
        setMeta('meta[name="description"]', description);
        setMeta('meta[property="og:description"]', description);
        setMeta('meta[name="twitter:description"]', description);
      }
      setMeta('meta[property="og:url"]', url);
      setMeta('link[rel="canonical"]', url);
    }

    function sync() {
      const slug = currentSlug();
      const project = slug && bySlug.get(slug);
      if (!project) {
        if (getOpenProject()) closeView();
        shareButton.hidden = true;
        restoreMetadata();
        notice.hidden = slug === null;
        if (slug !== null) notice.textContent = labels().missing;
        return;
      }
      notice.hidden = true;
      if (getOpenProject() !== project) openView(project, null);
      shareButton.hidden = false;
      resetCopyLabel();
      updateMetadata(project);
    }

    function open(project, trigger) {
      const slug = slugFor(project);
      if (!slug) return;
      notice.hidden = true;
      if (currentSlug() !== slug) {
        // Tag only entries created by a card click. A directly shared link should
        // close in place, rather than unexpectedly navigating to the referrer.
        const previousState = history.state && typeof history.state === 'object' ? history.state : {};
        history.pushState({ ...previousState, [ENTRY_FLAG]: true }, '', urlWithSlug(slug));
      }
      openView(project, trigger);
      shareButton.hidden = false;
      resetCopyLabel();
      updateMetadata(project);
    }

    function close() {
      if (!getOpenProject()) return;
      if (currentSlug() !== null && history.state?.[ENTRY_FLAG]) {
        history.back();
        return;
      }
      if (currentSlug() !== null) history.replaceState(history.state, '', urlWithSlug(null));
      sync();
    }

    shareButton.addEventListener('click', async () => {
      const project = getOpenProject();
      const value = project ? shareUrl(project) : '';
      if (!value) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(value);
        shareLabel.textContent = labels().copied;
        shareButton.setAttribute('aria-label', labels().copied);
        shareButton.title = labels().copied;
      } catch (_) {
        // Non-secure origins and restricted browsers may block clipboard access.
        window.prompt(labels().unavailable, value);
      }
    });
    window.addEventListener('popstate', sync);

    return { open, close, sync, setCatalog, restoreMetadata };
  }

  window.PortfolioProjectLinks = Object.freeze({ slugFor, shareUrl, createController });
})();
