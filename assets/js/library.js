(async () => {
  'use strict';

  const P = window.PortfolioPages;
  const locale = P.detectLocale();
  const data = await P.loadLocale(locale);
  if (window.PortfolioProjectLinks.redirectLegacy(data.projects, data.modal.unavailableTitle)) return;
  const extra = data.library;
  const ui = data.libraryUi;

  const renderCompactCredlyBadgeImage = (badge) => {
    const badgeId = String(badge?.credlyBadgeId || '').trim();
    if (!badgeId) return '';
    const width = Number.isFinite(Number(badge.embedWidth)) ? Number(badge.embedWidth) : 150;
    const height = Number.isFinite(Number(badge.embedHeight)) ? Number(badge.embedHeight) : 270;
    const host = String(badge.embedHost || 'https://www.credly.com');
    const scale = Number.isFinite(Number(badge.libraryScale)) ? Number(badge.libraryScale) : 0.253333;
    const offsetX = Number.isFinite(Number(badge.libraryOffsetX)) ? Number(badge.libraryOffsetX) : 0;
    const offsetY = Number.isFinite(Number(badge.libraryOffsetY)) ? Number(badge.libraryOffsetY) : 0;
    return `<span class="achievement-card__badge-image achievement-card__badge-image--credly" data-credly-badge-id="${P.escapeHtml(badgeId)}" style="--credly-scale:${P.escapeHtml(String(scale))};--credly-x:${P.escapeHtml(String(offsetX))}px;--credly-y:${P.escapeHtml(String(offsetY))}px" aria-hidden="true">
      <span class="credly-compact-embed">
        <div data-iframe-width="${P.escapeHtml(String(width))}" data-iframe-height="${P.escapeHtml(String(height))}" data-share-badge-id="${P.escapeHtml(badgeId)}" data-share-badge-host="${P.escapeHtml(host)}"></div>
      </span>
    </span>`;
  };

  const refreshCredlyEmbeds = (root = document) => {
    if (!root?.querySelector?.('[data-share-badge-id]')) return;
    const previousScript = document.querySelector('script[data-credly-embed-script]');
    if (previousScript) previousScript.remove();
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://cdn.credly.com/assets/utilities/embed.js';
    script.dataset.credlyEmbedScript = 'true';
    document.body.appendChild(script);
  };

  let activeCategory = 'all';
  let query = '';

  P.applyTheme();
  P.setBranding();
  P.bindLocaleSelect(locale);
  P.localizeSharedHeader(data, 'library');
  document.documentElement.lang = locale;
  const profileTitle = `${P.config.profile?.name || 'Bruno Getten Triches'}${P.config.profile?.nickname ? ` (${P.config.profile.nickname})` : ''}`;
  document.title = `${extra.seoTitle || extra.title} | ${profileTitle}`;
  const pageDescription = document.querySelector('meta[name="description"]');
  if (pageDescription && extra.seoDescription) pageDescription.setAttribute('content', extra.seoDescription);

  const copy = (id, value) => {
    const node = P.qs(`#${id}`);
    if (node) node.textContent = value || '';
  };
  P.qsa('[data-copy]').forEach((node) => {
    const value = extra[node.dataset.copy];
    if (value) node.textContent = value;
  });

  P.qs('#library-stats').setAttribute('aria-label', ui.librarySummary);
  P.qs('#library-filters').setAttribute('aria-label', ui.projectFilters);
  P.qs('#credential-dialog-close').setAttribute('aria-label', data.modal.closeLabel);
  copy('library-eyebrow', extra.eyebrow);
  copy('library-title', extra.title);
  copy('library-intro', extra.intro);
  copy('collection-kicker', extra.collection);
  copy('collection-title', ui.collectionTitle || data.projectsSection?.title || extra.collection);
  copy('achievements-title', extra.achievements);
  copy('achievements-text', extra.achievementsText);
  copy('achievements-kicker', extra.labels?.educationKicker || extra.achievements);
  copy('library-empty', extra.noResults);
  copy('project-rail-label', ui.rail);
  const search = P.qs('#library-search');
  search.placeholder = extra.searchPlaceholder;
  search.setAttribute('aria-label', extra.searchPlaceholder);

  const projects = Array.isArray(data.projects) ? data.projects.filter((item) => !item.hidden) : [];
  const certificates = Array.isArray(data.certificates) ? data.certificates : [];
  const education = Array.isArray(data.education) ? data.education.filter((item) => item.enabled !== 0 && item.enabled !== false) : [];
  const technologies = P.uniqueTechnologies(projects);
  const categoryMap = new Map((data.categories || []).map((item) => [item.id, item.label]));

  P.qs('#library-stats').innerHTML = [
    [projects.length, extra.projectsLabel],
    [certificates.length, extra.certificatesLabel],
    [technologies.length, extra.technologiesLabel],
    ['8+', extra.experienceLabel]
  ].map(([value, label]) => `<article class="library-stat"><strong>${P.escapeHtml(value)}</strong><span>${P.escapeHtml(label)}</span></article>`).join('');


  const availableCategories = ['all', ...new Set(projects.map((item) => item.category).filter(Boolean))];
  P.qs('#library-filters').innerHTML = availableCategories.map((id) => `
    <button class="library-filter ${id === 'all' ? 'is-active' : ''}" type="button" data-filter="${P.escapeHtml(id)}" aria-pressed="${id === activeCategory}">
      ${P.escapeHtml(id === 'all' ? extra.all : (categoryMap.get(id) || id))}
    </button>`).join('');

  function normalizeSearch(value) {
    return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  }

  function projectSearchText(project) {
    const technical = (project.details?.technicalSpecs || []).flatMap((item) => [item.label, item.value]);
    const tech = (project.details?.technologies || []).flatMap((item) => [item.name, item.description]);
    return normalizeSearch([project.title, project.description, projectLabel(project), project.category, ...(project.stack || []), ...technical, ...tech].join(' '));
  }

  function visibleProjects() {
    const normalized = normalizeSearch(query.trim());
    return projects.filter((project) => {
      const categoryMatch = activeCategory === 'all' || project.category === activeCategory;
      const searchMatch = !normalized || projectSearchText(project).includes(normalized);
      return categoryMatch && searchMatch;
    });
  }

  function projectLabel(project) {
    return categoryMap.get(project.category) || project.category || '';
  }

  function renderCollectionCards(visible) {
    const collection = P.qs('#project-collection');
    copy('project-rail-count', `${visible.length}/${projects.length}`);
    collection.innerHTML = visible.map((project) => {
      const cover = P.galleryFor(project)[0] || P.config.branding.socialPreview;
      const details = project.details || {};
      const description = project.description || details.description || '';
      const stack = (project.stack || []).slice(0, 4);
      return `
        <article class="collection-card" role="listitem">
          <a class="collection-card__select" href="${window.PortfolioProjectLinks.projectPath(project)}" data-track="select_content" data-content-id="${window.PortfolioProjectLinks.slugFor(project)}">
            <span class="collection-card__visual">
              <img class="collection-card__image" src="${P.escapeHtml(cover)}" alt="" loading="lazy" decoding="async" fetchpriority="low">
              <span class="collection-card__status">${P.escapeHtml(project.status || projectLabel(project))}</span>
            </span>
            <span class="collection-card__body">
                <strong class="collection-card__title">${P.escapeHtml(project.title)}</strong>
              <span class="collection-card__description">${P.escapeHtml(description)}</span>
              ${stack.length ? `<span class="collection-card__stack">${stack.map((item) => `<span>${P.escapeHtml(item)}</span>`).join('')}</span>` : ''}
              <span class="collection-card__select-label">${P.escapeHtml(ui.select)} <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></span>
            </span>
          </a>
        </article>`;
    }).join('');
  }

  function renderCollection() {
    const visible = visibleProjects();
    const empty = P.qs('#library-empty');
    empty.hidden = visible.length > 0;
    if (!visible.length) {
      P.qs('#project-collection').innerHTML = '';
      copy('project-rail-count', `0/${projects.length}`);
      return;
    }
    renderCollectionCards(visible);
  }

  P.qs('#library-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    activeCategory = button.dataset.filter || 'all';
    P.qsa('[data-filter]').forEach((item) => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    window.PortfolioAnalytics?.track('library_filter', { category: activeCategory });
    renderCollection();
  });

  search.addEventListener('input', (event) => {
    query = event.target.value || '';
    renderCollection();
  });



  renderCollection();

  copy('credential-kicker', extra.labels?.credentialKicker || ui.credentialKicker);
  copy('credential-title', ui.credentials);
  const libraryBadgeCount = certificates.reduce((total, item) => total + (Array.isArray(item.badges) ? item.badges.filter(Boolean).length : 0), 0);
  const credentialsCountLabel = certificates.length === 1
    ? (data.certificatesSection?.credentialCountSingular || ui.credentialsCount)
    : (data.certificatesSection?.credentialCountPlural || ui.credentialsCount);
  const badgesCountLabel = libraryBadgeCount === 1
    ? (data.certificatesSection?.badgeCountSingular || data.certificatesSection?.badgesCountLabel || 'badge')
    : (data.certificatesSection?.badgeCountPlural || data.certificatesSection?.badgesCountLabel || 'badges');
  copy('credential-count', `${certificates.length} ${credentialsCountLabel}${libraryBadgeCount ? ` · ${libraryBadgeCount} ${badgesCountLabel}` : ''}`);

  function educationProgress(period) {
    const years = String(period || '').match(/\b(20\d{2})\b/g) || [];
    if (years.length < 2) return null;
    const start = Number(years[0]);
    const end = Number(years[years.length - 1]);
    const now = new Date().getFullYear();
    const value = end > start ? Math.max(8, Math.min(100, ((now - start) / (end - start)) * 100)) : 100;
    return { start, end, value };
  }

  if (education.length) {
    P.qs('#education-quest').innerHTML = `<div class="education-path">${education.map((item, index) => {
      const progress = educationProgress(item.period);
      const fallback = (item.institution || 'EDU').split(/\s+/).map((word) => word[0]).join('').slice(0,3).toUpperCase();
      return `<article class="education-card ${index === 0 ? 'is-current' : ''}">
        <div class="education-card__brand">
          ${item.logo ? `<img src="${P.escapeHtml(item.logo)}" alt="${P.escapeHtml(item.logoAlt || item.institution || '')}" loading="lazy" decoding="async" onerror="this.hidden=true">` : ''}
          <span>${P.escapeHtml(fallback)}</span>
        </div>
        <div class="education-card__content">
          <div class="education-card__topline"><span>${P.escapeHtml(item.label || (index === 0 ? extra.currentQuest : ui.previousEducation))}</span><b>${P.escapeHtml(item.status || '')}</b></div>
          <h3>${P.escapeHtml(item.course)}</h3>
          <p class="education-card__meta">${P.escapeHtml([item.degree, item.institution].filter(Boolean).join(' · '))}</p>
          ${item.description ? `<p class="education-card__description">${P.escapeHtml(item.description)}</p>` : ''}
          ${progress ? `<div class="education-card__timeline" aria-label="${P.escapeHtml(item.period || '')}"><span>${P.escapeHtml(progress.start)}</span><i><b style="--education-progress:${progress.value}%"></b></i><span>${P.escapeHtml(progress.end)}</span></div>` : `<div class="education-card__period">${P.escapeHtml(item.period || '')}</div>`}
          ${Array.isArray(item.credentialGallery) && item.credentialGallery.length ? `<button class="education-card__records" type="button" data-open-education-credential="${index}">${P.escapeHtml(item.credentialLabel || ui.educationRecords)} <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></button>` : ''}
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  const achievementGrid = P.qs('#achievement-grid');
  achievementGrid.dataset.count = String(certificates.length);
  achievementGrid.innerHTML = certificates.map((item, index) => {
    const tags = (item.tags || []).slice(0, 3).map((tag) => `<span>${P.escapeHtml(tag)}</span>`).join('');
    const gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
    const badges = Array.isArray(item.badges) ? item.badges.filter((badge) => badge && (badge.image || badge.title)) : [];
    const hasCredential = gallery.length || item.url;
    const mediaInner = `
      <img src="${P.escapeHtml(item.image || '')}" alt="${P.escapeHtml(item.title)}" loading="lazy" decoding="async" fetchpriority="low">
      <span class="achievement-card__index">${String(index + 1).padStart(2, '0')}</span>
      ${hasCredential ? `<span class="achievement-card__open" aria-hidden="true">↗</span>` : ''}
      ${badges.length ? `<span class="achievement-card__badge-count" aria-label="${badges.length} ${P.escapeHtml(data.certificatesSection?.badgesCountLabel || 'badges')}">◆ ${badges.length}</span>` : ''}`;

    const media = gallery.length
      ? `<button class="achievement-card__media achievement-card__media-button" type="button" data-open-credential="${index}">${mediaInner}</button>`
      : item.url
        ? `<a class="achievement-card__media" href="${P.escapeHtml(item.url)}" target="_blank" rel="noopener">${mediaInner}</a>`
        : `<div class="achievement-card__media">${mediaInner}</div>`;

    const badgeMarkup = badges.length ? `<div class="achievement-card__badges">${badges.map((badge) => `
      <a href="${P.escapeHtml(badge.url || '#')}" ${badge.url ? 'target="_blank" rel="noopener"' : ''} class="achievement-card__badge">
        ${badge.image ? `<span class="achievement-card__badge-image"><img src="${P.escapeHtml(badge.image)}" alt="" loading="lazy" decoding="async"></span>` : renderCompactCredlyBadgeImage(badge)}
        <span><small>${P.escapeHtml(badge.label || data.certificatesSection?.verifiedBadgeLabel || '')}</small><strong>${P.escapeHtml(badge.title || '')}</strong></span>
        <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i>
      </a>`).join('')}</div>` : '';

    const actions = [];
    if (gallery.length) {
      actions.push(`<button type="button" data-open-credential="${index}">${P.escapeHtml(data.certificatesSection?.credentialCta || ui.credentialVerified)} <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></button>`);
    } else if (item.url) {
      actions.push(`<a href="${P.escapeHtml(item.url)}" target="_blank" rel="noopener">${P.escapeHtml(data.certificatesSection?.credentialCta || ui.credentialVerified)} <i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i></a>`);
    }

    return `<article class="achievement-card ${badges.length ? 'has-badge' : ''}">
      <div class="achievement-card__inner">
        ${media}
        <div class="achievement-card__copy">
          <div class="achievement-card__meta"><small>${P.escapeHtml(item.provider || '')}</small><span>${P.escapeHtml(item.year || '')}</span></div>
          ${item.credentialType ? `<span class="achievement-card__type">${P.escapeHtml(item.credentialType)}</span>` : ''}
          <h3>${P.escapeHtml(item.title)}</h3>
          ${item.description ? `<p>${P.escapeHtml(item.description)}</p>` : ''}
          ${tags ? `<div class="achievement-card__tags">${tags}</div>` : ''}
          ${badgeMarkup}
          ${actions.length ? `<div class="achievement-card__actions">${actions.join('')}</div>` : ''}
        </div>
      </div>
    </article>`;
  }).join('');

  refreshCredlyEmbeds(achievementGrid);

  const credentialDialog = P.qs('#credential-dialog');
  const credentialDialogImage = P.qs('#credential-dialog-image');
  const credentialDialogThumbs = P.qs('#credential-dialog-thumbs');

  function openCredentialItem(item) {
    if (!item) return;
    const gallery = Array.isArray(item.credentialGallery) && item.credentialGallery.length
      ? item.credentialGallery.filter(Boolean)
      : (Array.isArray(item.gallery) && item.gallery.length ? item.gallery.filter(Boolean) : [item.image].filter(Boolean));
    if (!gallery.length) return;
    copy('credential-dialog-provider', item.credentialProvider || [item.provider || item.institution, item.year || item.period].filter(Boolean).join(' · '));
    copy('credential-dialog-title', item.credentialTitle || item.title || item.course || '');
    copy('credential-dialog-description', item.credentialDescription || item.description || '');
    const showImage = (src, activeIndex = 0) => {
      if (!credentialDialogImage || !src) return;
      credentialDialogImage.src = src;
      credentialDialogImage.alt = item.credentialTitle || item.title || item.course || '';
      P.qsa('[data-credential-image]', credentialDialogThumbs).forEach((button, buttonIndex) => button.classList.toggle('is-active', buttonIndex === activeIndex));
    };
    credentialDialogThumbs.innerHTML = gallery.map((src, galleryIndex) => `<button type="button" data-credential-image="${P.escapeHtml(src)}" aria-label="${P.escapeHtml(item.credentialTitle || item.title || item.course || '')} ${galleryIndex + 1}"><img src="${P.escapeHtml(src)}" alt="" loading="lazy" decoding="async"></button>`).join('');
    credentialDialogThumbs.onclick = (event) => {
      const button = event.target.closest('[data-credential-image]');
      if (!button) return;
      const buttons = P.qsa('[data-credential-image]', credentialDialogThumbs);
      showImage(button.dataset.credentialImage, buttons.indexOf(button));
    };
    showImage(gallery[0], 0);
    if (typeof credentialDialog.showModal === 'function') credentialDialog.showModal();
  }

  document.addEventListener('click', (event) => {
    const educationTrigger = event.target.closest('[data-open-education-credential]');
    if (educationTrigger) {
      openCredentialItem(education[Number(educationTrigger.dataset.openEducationCredential)]);
      return;
    }
    const credentialTrigger = event.target.closest('[data-open-credential]');
    if (credentialTrigger) openCredentialItem(certificates[Number(credentialTrigger.dataset.openCredential)]);
  });
  P.qs('#credential-dialog-close')?.addEventListener('click', () => credentialDialog.close());
  credentialDialog?.addEventListener('click', (event) => { if (event.target === credentialDialog) credentialDialog.close(); });

})();
