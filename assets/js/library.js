(async () => {
  'use strict';

  const P = window.PortfolioPages;
  const locale = P.detectLocale();
  const data = await P.loadLocale(locale);
  const extra = P.extended[locale]?.library || P.extended['pt-BR'].library;
  const ui = {
    'pt-BR': { rail: 'PROJETOS NA COLEÇÃO', collectionTitle: 'Coleção de projetos', selected: 'PROJETO EM DESTAQUE', features: 'DESTAQUES', media: 'CAPTURAS', item: 'item', items: 'itens', spotlight: 'Projeto em destaque', spotlightKicker: 'SELEÇÃO DA COLEÇÃO', spotlightHelper: 'Selecione qualquer projeto da coleção para ampliar imagens, contexto e stack.', select: 'Abrir projeto', credentialKicker: 'CERTIFICAÇÕES', credentials: 'Certificações', credentialsCount: 'certificações', credentialVerified: 'Abrir credencial', educationRecords: 'Ver registros' },
    en: { rail: 'PROJECTS IN COLLECTION', collectionTitle: 'Project collection', selected: 'FEATURED PROJECT', features: 'HIGHLIGHTS', media: 'MEDIA', item: 'item', items: 'items', spotlight: 'Featured project', spotlightKicker: 'COLLECTION PICK', spotlightHelper: 'Select any project in the collection to expand its visuals, context and stack.', select: 'Open project', credentialKicker: 'CERTIFICATIONS', credentials: 'Certifications', credentialsCount: 'certifications', credentialVerified: 'Open credential', educationRecords: 'View records' },
    es: { rail: 'PROYECTOS EN LA COLECCIÓN', collectionTitle: 'Colección de proyectos', selected: 'PROYECTO DESTACADO', features: 'DESTACADOS', media: 'CAPTURAS', item: 'elemento', items: 'elementos', spotlight: 'Proyecto destacado', spotlightKicker: 'SELECCIÓN DE LA COLECCIÓN', spotlightHelper: 'Selecciona cualquier proyecto para ampliar imágenes, contexto y stack.', select: 'Abrir proyecto', credentialKicker: 'CERTIFICACIONES', credentials: 'Certificaciones', credentialsCount: 'certificaciones', credentialVerified: 'Abrir credencial', educationRecords: 'Ver registros' }
  }[locale] || { rail: 'PROJECTS IN COLLECTION', collectionTitle: 'Project collection', selected: 'FEATURED PROJECT', features: 'HIGHLIGHTS', media: 'MEDIA', item: 'item', items: 'items', spotlight: 'Featured project', spotlightKicker: 'COLLECTION PICK', spotlightHelper: 'Select any project in the collection.', select: 'Open project', credentialKicker: 'CERTIFICATIONS', credentials: 'Certifications', credentialsCount: 'certifications', credentialVerified: 'Open credential', educationRecords: 'View records' };

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
  copy('spotlight-kicker', ui.spotlightKicker);
  copy('spotlight-title', ui.spotlight);
  copy('spotlight-helper', ui.spotlightHelper);
  const search = P.qs('#library-search');
  search.placeholder = extra.searchPlaceholder;

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
    <button class="library-filter ${id === 'all' ? 'is-active' : ''}" type="button" data-filter="${P.escapeHtml(id)}">
      ${P.escapeHtml(id === 'all' ? extra.all : (categoryMap.get(id) || id))}
    </button>`).join('');

  function splitProjectTitle(title) {
    const raw = String(title || '').trim();
    const parts = raw.split(/\s+[—–]\s+/);
    if (parts.length < 2) return { name: raw, detail: '' };
    return { name: parts.shift().trim(), detail: parts.join(' — ').trim() };
  }

  function projectSearchText(project) {
    const technical = (project.details?.technicalSpecs || []).flatMap((item) => [item.label, item.value]);
    const tech = (project.details?.technologies || []).flatMap((item) => [item.name, item.description]);
    return [project.title, project.description, project.category, ...(project.stack || []), ...technical, ...tech].join(' ').toLowerCase();
  }

  function visibleProjects() {
    const normalized = query.trim().toLowerCase();
    return projects.map((project, index) => ({ project, index })).filter(({ project }) => {
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
    collection.innerHTML = visible.map(({ project, index }, position) => {
      const cover = project.image || P.galleryFor(project)[0];
      const details = project.details || {};
      const description = details.description || project.description || '';
      const stack = (project.stack || []).slice(0, 4);
      return `
        <article class="collection-card" role="listitem">
          <button class="collection-card__select" type="button" data-open-project="${index}" aria-label="${P.escapeHtml(ui.select)}: ${P.escapeHtml(project.title)}">
            <span class="collection-card__visual">
              <img class="collection-card__backdrop" src="${P.escapeHtml(cover)}" alt="" aria-hidden="true" loading="lazy" decoding="async" fetchpriority="low">
              <img class="collection-card__image" src="${P.escapeHtml(cover)}" alt="${P.escapeHtml(project.title)}" loading="lazy" decoding="async" fetchpriority="low">
              <span class="collection-card__index">${String(position + 1).padStart(2, '0')}</span>
              <span class="collection-card__status">${P.escapeHtml(project.status || projectLabel(project))}</span>
            </span>
            <span class="collection-card__body">
              <span class="collection-card__eyebrow">${P.escapeHtml(projectLabel(project))}</span>
              <strong class="collection-card__title">${P.escapeHtml(project.title)}</strong>
              <span class="collection-card__description">${P.escapeHtml(description)}</span>
              ${stack.length ? `<span class="collection-card__stack">${stack.map((item) => `<span>${P.escapeHtml(item)}</span>`).join('')}</span>` : ''}
              <span class="collection-card__select-label">${P.escapeHtml(ui.select)} <b aria-hidden="true">↗</b></span>
            </span>
          </button>
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
    P.qsa('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
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
          <div class="education-card__topline"><span>${P.escapeHtml(item.label || (index === 0 ? extra.currentQuest : (locale === 'en' ? 'Previous education' : locale === 'es' ? 'Formación anterior' : 'Formação anterior')))}</span><b>${P.escapeHtml(item.status || '')}</b></div>
          <h3>${P.escapeHtml(item.course)}</h3>
          <p class="education-card__meta">${P.escapeHtml([item.degree, item.institution].filter(Boolean).join(' · '))}</p>
          ${item.description ? `<p class="education-card__description">${P.escapeHtml(item.description)}</p>` : ''}
          ${progress ? `<div class="education-card__timeline" aria-label="${P.escapeHtml(item.period || '')}"><span>${P.escapeHtml(progress.start)}</span><i><b style="--education-progress:${progress.value}%"></b></i><span>${P.escapeHtml(progress.end)}</span></div>` : `<div class="education-card__period">${P.escapeHtml(item.period || '')}</div>`}
          ${Array.isArray(item.credentialGallery) && item.credentialGallery.length ? `<button class="education-card__records" type="button" data-open-education-credential="${index}">${P.escapeHtml(item.credentialLabel || ui.educationRecords)} <b aria-hidden="true">↗</b></button>` : ''}
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
        <b aria-hidden="true">↗</b>
      </a>`).join('')}</div>` : '';

    const actions = [];
    if (gallery.length) {
      actions.push(`<button type="button" data-open-credential="${index}">${P.escapeHtml(data.certificatesSection?.credentialCta || ui.credentialVerified)} <b aria-hidden="true">↗</b></button>`);
    } else if (item.url) {
      actions.push(`<a href="${P.escapeHtml(item.url)}" target="_blank" rel="noopener">${P.escapeHtml(data.certificatesSection?.credentialCta || ui.credentialVerified)} <b aria-hidden="true">↗</b></a>`);
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

  const projectModal = P.qs('#image-modal');
  const galleryImagePreloadCache = new Map();
  const modalState = {
    project: null,
    projectIndex: -1,
    tabs: [],
    activeTab: null,
    items: [],
    imageIndex: 0,
    zoom: 1,
    rotation: 0,
    imageRequestId: 0,
    pointerStartX: null,
    lastTrigger: null,
    fullscreen: false
  };

  function hasContent(value) {
    if (Array.isArray(value)) return value.some(hasContent);
    if (typeof value === 'string') return value.trim().length > 0;
    if (value && typeof value === 'object') return Object.values(value).some(hasContent);
    return value !== null && value !== undefined && value !== false;
  }

  function galleryItems(project) {
    const sources = [...new Set([project.image, ...P.galleryFor(project)].filter(Boolean))];
    return sources.map((src, index) => ({
      src,
      alt: (data.modal.imageAlt || '{title}').replace('{index}', index + 1).replace('{title}', project.title || ''),
      caption: ''
    }));
  }

  function projectTabs(project) {
    const details = project.details || {};
    const tabs = [];
    if (hasContent(details.description) || hasContent(details.features) || hasContent(details.pricing)) {
      tabs.push({ id: 'overview', label: data.modal.overviewTab });
    }
    if (P.config.features?.projectStory !== 0 && (project.description || details.description || details.features?.length || details.technicalSpecs?.length)) {
      const insertAt = tabs.findIndex((tab) => tab.id === 'overview') + 1;
      tabs.splice(Math.max(0, insertAt), 0, { id: 'story', label: data.modal.storyTab || 'História' });
    }
    if (hasContent(details.technicalSpecs) || hasContent(details.technologies) || hasContent(project.stack)) {
      tabs.push({ id: 'technical', label: data.modal.technicalTab });
    }
    if (galleryItems(project).length) tabs.push({ id: 'images', label: data.modal.imagesTab });
    return tabs;
  }

  function renderAccessLink(project) {
    const url = P.projectLink(project);
    if (!url) return '';
    return `<a class="project-access-link project-access-link--modal" href="${P.escapeHtml(url)}" target="_blank" rel="noopener"><span>${P.escapeHtml(extra.liveProject)}</span><b aria-hidden="true">↗</b></a>`;
  }

  function renderOverview(project) {
    const details = project.details || {};
    const pricing = Array.isArray(details.pricing) ? details.pricing : [];
    return `
      <section class="project-detail-section project-detail-overview">
        ${hasContent(details.description) ? `<div class="project-detail-lead"><span class="project-detail-label">${P.escapeHtml(data.modal.overviewTitle)}</span><p>${P.escapeHtml(details.description)}</p></div>` : ''}
        ${hasContent(details.features) ? `<div class="project-detail-block"><h3>${P.escapeHtml(data.modal.featuresTitle)}</h3><ul class="project-feature-grid">${details.features.map((feature) => {
          const text = typeof feature === 'string' ? feature : feature.label || feature.value || '';
          return `<li><span class="project-feature-mark" aria-hidden="true">✓</span><span>${P.escapeHtml(text)}</span></li>`;
        }).join('')}</ul></div>` : ''}
        ${pricing.length ? `<div class="project-detail-block"><h3>${P.escapeHtml(data.modal.pricingTitle)}</h3><div class="project-pricing-grid">${pricing.map((plan) => {
          if (typeof plan === 'string') return `<article class="project-pricing-card"><strong>${P.escapeHtml(plan)}</strong></article>`;
          const items = Array.isArray(plan.items) ? plan.items : [];
          return `<article class="project-pricing-card"><div class="project-pricing-heading"><strong>${P.escapeHtml(plan.name || plan.title || '')}</strong>${plan.price ? `<span>${P.escapeHtml(plan.price)}</span>` : ''}</div>${plan.description ? `<p>${P.escapeHtml(plan.description)}</p>` : ''}${items.length ? `<ul>${items.map((item) => `<li>${P.escapeHtml(item)}</li>`).join('')}</ul>` : ''}</article>`;
        }).join('')}</div></div>` : ''}
        ${renderAccessLink(project)}
      </section>`;
  }

  function renderTechnical(project) {
    const details = project.details || {};
    const specs = Array.isArray(details.technicalSpecs) ? details.technicalSpecs : [];
    const technologiesList = Array.isArray(details.technologies) ? details.technologies : [];
    const stack = Array.isArray(project.stack) ? project.stack.filter(Boolean) : [];
    const architectureNodes = stack.length ? stack : technologiesList.map((item) => typeof item === 'string' ? item : item.name || item.label || '').filter(Boolean);
    const decisionsLabel = data.modal.technicalDecisionsTitle || data.modal.technicalTitle;
    const technologiesLabel = data.modal.technologiesAndWhyTitle || data.modal.technologiesTitle;
    return `
      <section class="project-detail-section project-technical-story">
        <header class="project-technical-hero">
          <div class="project-technical-hero__copy"><span class="project-detail-label">${P.escapeHtml(data.modal.technicalEyebrow || data.modal.technicalTitle)}</span><h3>${P.escapeHtml(data.modal.technicalTitle)}</h3><p>${P.escapeHtml(data.modal.technicalDescription || '')}</p></div>
          <div class="project-technical-hero__metrics" aria-hidden="true">
            ${specs.length ? `<span><strong>${String(specs.length).padStart(2, '0')}</strong><small>${P.escapeHtml(decisionsLabel)}</small></span>` : ''}
            ${technologiesList.length ? `<span><strong>${String(technologiesList.length).padStart(2, '0')}</strong><small>${P.escapeHtml(technologiesLabel)}</small></span>` : ''}
            ${architectureNodes.length ? `<span><strong>${String(Math.min(architectureNodes.length, 8)).padStart(2, '0')}</strong><small>${P.escapeHtml(data.modal.architectureTitle || 'Stack')}</small></span>` : ''}
          </div>
        </header>
        ${specs.length ? `<div class="project-detail-block project-technical-decisions"><div class="project-technical-section-heading"><span>01</span><h3>${P.escapeHtml(decisionsLabel)}</h3></div><ol class="project-decision-timeline">${specs.map((spec, index) => {
          const label = typeof spec === 'string' ? '' : spec.label || '';
          const body = typeof spec === 'string' ? spec : spec.value || spec.description || '';
          return `<li class="project-decision-item"><span class="project-decision-index">${String(index + 1).padStart(2, '0')}</span><div>${label ? `<strong>${P.escapeHtml(label)}</strong>` : ''}<p>${P.escapeHtml(body)}</p></div></li>`;
        }).join('')}</ol></div>` : ''}
        ${technologiesList.length ? `<div class="project-detail-block project-technical-technologies"><div class="project-technical-section-heading"><span>02</span><h3>${P.escapeHtml(technologiesLabel)}</h3></div><ul class="project-technology-list project-technology-grid--rationale">${technologiesList.map((technology, index) => {
          const label = typeof technology === 'string' ? technology : technology.name || technology.label || '';
          const detail = typeof technology === 'object' ? technology.description || technology.detail || '' : '';
          return `<li><span class="project-technology-order">${String(index + 1).padStart(2, '0')}</span><div><strong>${P.escapeHtml(label)}</strong>${detail ? `<span>${P.escapeHtml(detail)}</span>` : ''}</div><i aria-hidden="true"></i></li>`;
        }).join('')}</ul></div>` : ''}
        ${architectureNodes.length ? `<div class="project-detail-block project-architecture-block"><div class="project-technical-section-heading"><span>03</span><h3>${P.escapeHtml(data.modal.architectureTitle || 'Arquitetura / stack')}</h3></div><div class="project-architecture-canvas"><div class="project-architecture-flow" aria-label="${P.escapeHtml(data.modal.architectureAria || '')}">${architectureNodes.slice(0, 8).map((node, index) => `<span class="project-architecture-node"><i>${String(index + 1).padStart(2, '0')}</i><strong>${P.escapeHtml(node)}</strong></span>${index < Math.min(architectureNodes.length, 8) - 1 ? '<b aria-hidden="true">→</b>' : ''}`).join('')}</div></div></div>` : ''}
      </section>`;
  }

  function buildStorySteps(project) {
    const details = project.details || {};
    const steps = [];
    const push = (title, body) => {
      if (!body || !String(body).trim() || steps.some((item) => item.body === String(body))) return;
      steps.push({ title, body: String(body) });
    };
    push(data.modal.storyChallengeTitle || 'Contexto', project.description);
    push(data.modal.storySolutionTitle || 'Solução', details.description);
    const maxFeatureSteps = Math.max(1, Number(P.config.experience?.story?.maxFeatureSteps) || 3);
    (details.features || []).slice(0, maxFeatureSteps).forEach((feature) => {
      push(data.modal.storyFeatureTitle || 'Decisão de produto', typeof feature === 'string' ? feature : feature?.label || feature?.value || '');
    });
    return steps;
  }

  function renderStory(project) {
    const steps = buildStorySteps(project);
    const image = project.image ? `<img src="${P.escapeHtml(project.image)}" alt="" loading="lazy">` : '';
    const chips = (project.stack || []).slice(0, 5).map((item) => `<span>${P.escapeHtml(item)}</span>`).join('');
    return `<section class="project-story">
      <div class="project-story__visual">
        <div class="project-story__media">${image}<div class="project-story__media-glow"></div></div>
        <div class="project-story__summary">
          <span class="project-story__eyebrow">${P.escapeHtml(data.modal.storyEyebrow || 'CASE DO PROJETO')}</span>
          <h3>${P.escapeHtml(project.title || data.modal.storyTitle || '')}</h3>
          <p>${P.escapeHtml(data.modal.storyTitle || '')}</p>
          ${chips ? `<div class="project-story__chips">${chips}</div>` : ''}
          <div class="project-story__progress" aria-hidden="true"><i id="project-story-progress-bar"></i></div>
          <span class="project-story__progress-text" id="project-story-progress-text"></span>
        </div>
      </div>
      <div class="project-story__steps" id="project-story-steps">
        ${steps.map((step, index) => `<button type="button" class="project-story__step ${index === 0 ? 'is-active' : ''}" data-story-step="${index}" aria-current="${index === 0 ? 'step' : 'false'}"><span class="project-story__step-number">${String(index + 1).padStart(2, '0')}</span><span class="project-story__step-copy"><span class="project-story__step-type">${P.escapeHtml(step.title)}</span><span class="project-story__step-body">${P.escapeHtml(step.body)}</span></span></button>`).join('')}
      </div>
    </section>`;
  }

  function bindStory(root) {
    const steps = P.qsa('[data-story-step]', root);
    const bar = P.qs('#project-story-progress-bar', root);
    const text = P.qs('#project-story-progress-text', root);
    const setActive = (index, scroll = false) => {
      const safe = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((step, idx) => {
        const active = idx === safe;
        step.classList.toggle('is-active', active);
        step.setAttribute('aria-current', active ? 'step' : 'false');
      });
      if (bar) bar.style.width = `${steps.length ? ((safe + 1) / steps.length) * 100 : 0}%`;
      if (text) text.textContent = (data.modal.storyProgress || '{current}/{count}').replace('{current}', safe + 1).replace('{count}', steps.length);
      if (scroll) steps[safe]?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    };
    steps.forEach((step, index) => step.addEventListener('click', () => setActive(index, true)));
    if (steps.length) setActive(0);
  }

  function renderModalTabs() {
    const root = P.qs('#project-modal-tabs');
    if (!root) return;
    root.setAttribute('aria-label', data.modal.tabsLabel || 'Seções do projeto');
    root.innerHTML = modalState.tabs.map((tab) => `
      <button type="button" class="project-modal-tab ${tab.id === modalState.activeTab ? 'is-active' : ''}" role="tab" id="project-tab-${P.escapeHtml(tab.id)}" data-library-project-tab="${P.escapeHtml(tab.id)}" aria-selected="${String(tab.id === modalState.activeTab)}" aria-controls="${tab.id === 'images' ? 'project-modal-gallery' : 'project-modal-content'}">${P.escapeHtml(tab.label)}</button>`).join('');
  }

  function updateTabState() {
    P.qsa('[data-library-project-tab]', P.qs('#project-modal-tabs')).forEach((button) => {
      const active = button.dataset.libraryProjectTab === modalState.activeTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function renderContent(tabId) {
    const root = P.qs('#project-modal-content');
    if (!root || !modalState.project) return;
    if (tabId === 'technical') root.innerHTML = renderTechnical(modalState.project);
    else if (tabId === 'story') { root.innerHTML = renderStory(modalState.project); bindStory(root); }
    else root.innerHTML = renderOverview(modalState.project);
    root.scrollTop = 0;
  }

  function clearGalleryImageSizing() {
    const image = P.qs('#image-modal-image');
    if (!image) return;
    ['width', 'height', 'max-width', 'max-height'].forEach((property) => image.style.removeProperty(property));
  }

  function getGalleryStageAvailableSize() {
    const stage = P.qs('.image-modal-stage');
    if (!stage) return null;
    const style = getComputedStyle(stage);
    const horizontalPadding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    return {
      width: Math.max(1, stage.clientWidth - horizontalPadding - 4),
      height: Math.max(1, stage.clientHeight - verticalPadding - 4)
    };
  }

  function applyGalleryImageSizing(naturalWidth, naturalHeight) {
    const image = P.qs('#image-modal-image');
    const available = getGalleryStageAvailableSize();
    if (!image || !available || !naturalWidth || !naturalHeight) return;
    const containScale = Math.min(available.width / naturalWidth, available.height / naturalHeight, 1);
    image.style.width = `${Math.max(1, Math.floor(naturalWidth * containScale))}px`;
    image.style.height = `${Math.max(1, Math.floor(naturalHeight * containScale))}px`;
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
  }

  function fitGalleryImageToStage() {
    const image = P.qs('#image-modal-image');
    if (!projectModal?.classList.contains('is-open') || modalState.activeTab !== 'images' || !image || image.hidden || !image.complete || !image.naturalWidth || !image.naturalHeight) return;
    applyGalleryImageSizing(image.naturalWidth, image.naturalHeight);
  }

  function updateGalleryImageShape(naturalWidth, naturalHeight) {
    if (!projectModal || !naturalWidth || !naturalHeight) return;
    const ratio = naturalWidth / naturalHeight;
    projectModal.classList.toggle('image-is-portrait', ratio < .82);
    projectModal.classList.toggle('image-is-square', ratio >= .82 && ratio <= 1.18);
    projectModal.classList.toggle('image-is-landscape', ratio > 1.18);
  }

  function preloadGalleryImage(src) {
    if (!src) return Promise.reject(new Error('Missing gallery image source.'));
    if (galleryImagePreloadCache.has(src)) return galleryImagePreloadCache.get(src);
    const request = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.addEventListener('load', async () => {
        try { if (typeof image.decode === 'function') await image.decode(); } catch (_) {}
        resolve({ src, width: image.naturalWidth, height: image.naturalHeight });
      }, { once: true });
      image.addEventListener('error', () => { galleryImagePreloadCache.delete(src); reject(new Error(`Unable to load gallery image: ${src}`)); }, { once: true });
      image.src = src;
    });
    galleryImagePreloadCache.set(src, request);
    return request;
  }

  function preloadAdjacentGalleryImages() {
    if (modalState.items.length <= 1) return;
    const indexes = [(modalState.imageIndex - 1 + modalState.items.length) % modalState.items.length, (modalState.imageIndex + 1) % modalState.items.length];
    [...new Set(indexes)].forEach((index) => preloadGalleryImage(modalState.items[index]?.src).catch(() => {}));
  }

  function applyImageTransform() {
    const image = P.qs('#image-modal-image');
    if (!image) return;
    image.style.transform = `scale(${modalState.zoom}) rotate(${modalState.rotation}deg)`;
    image.dataset.zoomed = modalState.zoom !== 1 || modalState.rotation !== 0 ? 'true' : 'false';
  }

  function resetImageTransform() {
    modalState.zoom = 1;
    modalState.rotation = 0;
    applyImageTransform();
  }

  function syncThumbnails() {
    const root = P.qs('#image-modal-thumbnails');
    if (!root) return;
    const total = modalState.items.length;
    root.hidden = total <= 1;
    root.setAttribute('aria-label', data.modal.thumbnailsLabel || 'Miniaturas da galeria');
    if (total <= 1) { root.innerHTML = ''; return; }
    root.innerHTML = modalState.items.map((item, index) => `<button class="image-modal-thumbnail ${index === modalState.imageIndex ? 'is-active' : ''}" type="button" data-library-project-image="${index}" aria-label="${P.escapeHtml((data.modal.thumbnailLabel || '').replace('{index}', index + 1).replace('{title}', modalState.project?.title || ''))}" aria-current="${index === modalState.imageIndex ? 'true' : 'false'}"><img src="${P.escapeHtml(item.src)}" alt="" loading="lazy" decoding="async" fetchpriority="low"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('');
    P.qs(`[data-library-project-image="${modalState.imageIndex}"]`, root)?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
  }

  function updateGallery() {
    const item = modalState.items[modalState.imageIndex];
    if (!item || !projectModal) return;
    const image = P.qs('#image-modal-image');
    const fallback = P.qs('#image-modal-fallback');
    const counter = P.qs('#image-modal-counter');
    const caption = P.qs('#image-modal-caption');
    const hint = P.qs('#image-modal-hint');
    const prev = P.qs('#image-modal-prev');
    const next = P.qs('#image-modal-next');
    const frame = P.qs('.image-modal-frame');
    const requestId = ++modalState.imageRequestId;

    resetImageTransform();
    projectModal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape');
    fallback.hidden = true;
    frame?.classList.add('is-image-loading');
    frame?.setAttribute('aria-busy', 'true');
    image.hidden = true;
    counter.textContent = (data.modal.counter || '{current} / {count}').replace('{current}', modalState.imageIndex + 1).replace('{count}', modalState.items.length);
    caption.textContent = item.caption || (data.modal.caption || '').replace('{index}', modalState.imageIndex + 1).replace('{count}', modalState.items.length).replace('{title}', modalState.project?.title || '');
    hint.textContent = data.modal.navigationHint || '';
    prev.hidden = modalState.items.length <= 1;
    next.hidden = modalState.items.length <= 1;
    prev.disabled = modalState.items.length <= 1;
    next.disabled = modalState.items.length <= 1;
    syncThumbnails();

    preloadGalleryImage(item.src).then((loaded) => {
      if (requestId !== modalState.imageRequestId || !projectModal.classList.contains('is-open') || modalState.activeTab !== 'images') return;
      updateGalleryImageShape(loaded.width, loaded.height);
      applyGalleryImageSizing(loaded.width, loaded.height);
      image.alt = item.alt;
      image.src = loaded.src;
      image.hidden = false;
      fallback.hidden = true;
      applyImageTransform();
      frame?.classList.remove('is-image-loading');
      frame?.setAttribute('aria-busy', 'false');
      preloadAdjacentGalleryImages();
    }).catch(() => {
      if (requestId !== modalState.imageRequestId) return;
      image.hidden = true;
      fallback.hidden = false;
      frame?.classList.remove('is-image-loading');
      frame?.setAttribute('aria-busy', 'false');
    });
  }

  function updateFullscreenButton() {
    const button = P.qs('#image-modal-fullscreen');
    if (!button) return;
    const label = modalState.fullscreen ? data.modal.fullscreenExitLabel : data.modal.fullscreenEnterLabel;
    button.classList.toggle('is-active', modalState.fullscreen);
    button.setAttribute('aria-pressed', String(modalState.fullscreen));
    button.setAttribute('aria-label', label || '');
    button.title = label || '';
    button.querySelector('use')?.setAttribute('href', modalState.fullscreen ? '#icon-compress' : '#icon-expand');
  }

  function syncFullscreenState() {
    modalState.fullscreen = document.fullscreenElement === projectModal || projectModal?.classList.contains('is-fullscreen-fallback');
    projectModal?.classList.toggle('is-gallery-fullscreen', modalState.fullscreen);
    updateFullscreenButton();
    requestAnimationFrame(fitGalleryImageToStage);
  }

  async function setFullscreen(enabled) {
    if (!projectModal || (enabled && modalState.activeTab !== 'images')) return;
    if (!enabled) {
      projectModal.classList.remove('is-fullscreen-fallback');
      if (document.fullscreenElement === projectModal && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch (_) {}
      }
      syncFullscreenState();
      return;
    }
    if (projectModal.requestFullscreen && document.fullscreenEnabled !== false) {
      try { await projectModal.requestFullscreen({ navigationUI: 'hide' }); }
      catch (_) {
        try { await projectModal.requestFullscreen(); } catch (_) { projectModal.classList.add('is-fullscreen-fallback'); }
      }
    } else projectModal.classList.add('is-fullscreen-fallback');
    syncFullscreenState();
  }

  function setModalTab(tabId) {
    if (!modalState.tabs.some((tab) => tab.id === tabId)) return;
    modalState.activeTab = tabId;
    const isImages = tabId === 'images';
    const content = P.qs('#project-modal-content');
    const gallery = P.qs('#project-modal-gallery');
    const counter = P.qs('#image-modal-counter');
    const transforms = P.qs('#image-modal-transform-controls');
    const fullscreen = P.qs('#image-modal-fullscreen');
    if (!isImages) {
      modalState.imageRequestId += 1;
      P.qs('.image-modal-frame')?.classList.remove('is-image-loading');
      if (modalState.fullscreen) setFullscreen(false);
    }
    content.hidden = isImages;
    gallery.hidden = !isImages;
    counter.hidden = !isImages;
    transforms.hidden = !isImages;
    fullscreen.hidden = !isImages;
    fullscreen.disabled = !isImages;
    fullscreen.tabIndex = isImages ? 0 : -1;
    if (isImages) gallery.setAttribute('aria-labelledby', `project-tab-${tabId}`); else gallery.removeAttribute('aria-labelledby');
    if (!isImages) content.setAttribute('aria-labelledby', `project-tab-${tabId}`); else content.removeAttribute('aria-labelledby');
    updateTabState();
    if (isImages) { updateGallery(); requestAnimationFrame(fitGalleryImageToStage); }
    else renderContent(tabId);
  }

  function openProject(index, trigger) {
    const project = projects[Number(index)];
    if (!project || !projectModal) return;
    modalState.project = project;
    modalState.projectIndex = Number(index);
    modalState.tabs = projectTabs(project);
    modalState.activeTab = modalState.tabs[0]?.id || 'overview';
    modalState.items = galleryItems(project);
    modalState.imageIndex = 0;
    modalState.lastTrigger = trigger || null;
    modalState.fullscreen = false;
    resetImageTransform();
    copy('image-modal-kicker', data.modal.kicker || 'DETALHES DO PROJETO');
    copy('image-modal-title', project.title);
    copy('image-modal-fallback-title', data.modal.unavailableTitle);
    copy('image-modal-fallback-text', data.modal.unavailableText);
    const close = P.qs('.image-modal-close', projectModal);
    const prev = P.qs('#image-modal-prev');
    const next = P.qs('#image-modal-next');
    const fullscreen = P.qs('#image-modal-fullscreen');
    close?.setAttribute('aria-label', data.modal.closeLabel || 'Fechar');
    prev?.setAttribute('aria-label', data.modal.previousLabel || 'Imagem anterior');
    next?.setAttribute('aria-label', data.modal.nextLabel || 'Próxima imagem');
    fullscreen?.setAttribute('aria-label', data.modal.fullscreenEnterLabel || 'Tela inteira');
    fullscreen?.setAttribute('title', data.modal.fullscreenEnterLabel || 'Tela inteira');
    [['image-modal-zoom-out','zoomOut'],['image-modal-zoom-in','zoomIn'],['image-modal-rotate-left','rotateLeft'],['image-modal-rotate-right','rotateRight'],['image-modal-reset','resetView']].forEach(([id,key]) => {
      const button = P.qs(`#${id}`);
      if (button) { button.setAttribute('aria-label', data.modal[key] || ''); button.title = data.modal[key] || ''; }
    });
    projectModal.classList.add('is-open');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    renderModalTabs();
    setModalTab(modalState.activeTab);
    requestAnimationFrame(() => close?.focus());
  }

  function closeProject() {
    if (!projectModal) return;
    const trigger = modalState.lastTrigger;
    modalState.imageRequestId += 1;
    projectModal.classList.remove('is-fullscreen-fallback', 'is-gallery-fullscreen');
    if (document.fullscreenElement === projectModal && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    clearGalleryImageSizing();
    projectModal.classList.remove('image-is-portrait', 'image-is-square', 'image-is-landscape', 'is-open');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    const image = P.qs('#image-modal-image');
    if (image) { image.src = ''; image.alt = ''; image.hidden = true; image.style.transform = ''; }
    P.qs('#image-modal-thumbnails').innerHTML = '';
    P.qs('#project-modal-tabs').innerHTML = '';
    P.qs('#project-modal-content').innerHTML = '';
    modalState.project = null;
    modalState.items = [];
    modalState.tabs = [];
    modalState.lastTrigger = null;
    modalState.fullscreen = false;
    if (trigger && document.contains(trigger)) requestAnimationFrame(() => trigger.focus());
  }

  function moveGallery(direction) {
    if (modalState.items.length <= 1) return;
    modalState.imageIndex = (modalState.imageIndex + direction + modalState.items.length) % modalState.items.length;
    updateGallery();
  }

  function trapModalFocus(event) {
    if (!projectModal?.classList.contains('is-open') || event.key !== 'Tab') return;
    const focusable = P.qsa('button:not([disabled]):not([hidden]), [href], [tabindex]:not([tabindex="-1"])', projectModal).filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  document.addEventListener('click', (event) => {
    const projectTrigger = event.target.closest('[data-open-project]');
    if (projectTrigger) { openProject(projectTrigger.dataset.openProject, projectTrigger); return; }
    const tab = event.target.closest('[data-library-project-tab]');
    if (tab) { setModalTab(tab.dataset.libraryProjectTab); return; }
    const thumb = event.target.closest('[data-library-project-image]');
    if (thumb) { modalState.imageIndex = Number(thumb.dataset.libraryProjectImage); updateGallery(); return; }
    if (event.target.closest('[data-close-modal]')) { closeProject(); return; }
  });

  P.qs('#image-modal-prev')?.addEventListener('click', () => moveGallery(-1));
  P.qs('#image-modal-next')?.addEventListener('click', () => moveGallery(1));
  P.qs('#image-modal-zoom-in')?.addEventListener('click', () => { modalState.zoom = Math.min(3, modalState.zoom + .25); applyImageTransform(); });
  P.qs('#image-modal-zoom-out')?.addEventListener('click', () => { modalState.zoom = Math.max(.5, modalState.zoom - .25); applyImageTransform(); });
  P.qs('#image-modal-rotate-left')?.addEventListener('click', () => { modalState.rotation -= 90; applyImageTransform(); });
  P.qs('#image-modal-rotate-right')?.addEventListener('click', () => { modalState.rotation += 90; applyImageTransform(); });
  P.qs('#image-modal-reset')?.addEventListener('click', resetImageTransform);
  P.qs('#image-modal-fullscreen')?.addEventListener('click', () => setFullscreen(!modalState.fullscreen));

  P.qs('.image-modal-frame')?.addEventListener('wheel', (event) => {
    if (modalState.activeTab !== 'images' || !event.ctrlKey) return;
    event.preventDefault();
    modalState.zoom = Math.max(.5, Math.min(3, modalState.zoom + (event.deltaY < 0 ? .15 : -.15)));
    applyImageTransform();
  }, { passive: false });

  P.qs('.image-modal-stage')?.addEventListener('pointerdown', (event) => { modalState.pointerStartX = event.clientX; });
  P.qs('.image-modal-stage')?.addEventListener('pointerup', (event) => {
    if (modalState.pointerStartX === null || modalState.items.length <= 1) return;
    const distance = event.clientX - modalState.pointerStartX;
    modalState.pointerStartX = null;
    if (Math.abs(distance) >= 50) moveGallery(distance > 0 ? -1 : 1);
  });
  P.qs('.image-modal-stage')?.addEventListener('pointercancel', () => { modalState.pointerStartX = null; });

  P.qs('#project-modal-tabs')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = P.qsa('[data-library-project-tab]', P.qs('#project-modal-tabs'));
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement);
    let next = current < 0 ? 0 : current;
    if (event.key === 'ArrowLeft') next = (next - 1 + buttons.length) % buttons.length;
    if (event.key === 'ArrowRight') next = (next + 1) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    setModalTab(buttons[next].dataset.libraryProjectTab);
    buttons[next].focus();
  });

  document.addEventListener('keydown', (event) => {
    if (!projectModal?.classList.contains('is-open')) return;
    if (event.key === 'Tab') { trapModalFocus(event); return; }
    if (event.key === 'Escape') {
      if (modalState.fullscreen) setFullscreen(false); else closeProject();
      return;
    }
    if (modalState.activeTab !== 'images') return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveGallery(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveGallery(1); }
    else if (event.key === 'Home' && modalState.items.length > 1) { event.preventDefault(); modalState.imageIndex = 0; updateGallery(); }
    else if (event.key === 'End' && modalState.items.length > 1) { event.preventDefault(); modalState.imageIndex = modalState.items.length - 1; updateGallery(); }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!projectModal?.classList.contains('is-open')) return;
    if (document.fullscreenElement !== projectModal) projectModal.classList.remove('is-fullscreen-fallback');
    syncFullscreenState();
  });

  let galleryResizeFrame = null;
  const scheduleGalleryFit = () => {
    if (!projectModal?.classList.contains('is-open') || modalState.activeTab !== 'images') return;
    if (galleryResizeFrame) cancelAnimationFrame(galleryResizeFrame);
    galleryResizeFrame = requestAnimationFrame(() => { galleryResizeFrame = null; fitGalleryImageToStage(); });
  };
  window.addEventListener('resize', scheduleGalleryFit, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleGalleryFit, { passive: true });

})();
