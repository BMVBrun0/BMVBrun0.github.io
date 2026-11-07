(() => {
  'use strict';

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function galleryFor(project, config) {
    const configured = config.projectGalleries?.[project.image] || [];
    const items = [project.image, ...configured, ...(project.gallery || [])]
      .map((item) => typeof item === 'string' ? item : item?.src).filter(Boolean);
    return [...new Set(items)];
  }

  function render(project, data, config, pagePath = '') {
    const labels = data.projectPage;
    const { modal } = data;
    const details = project.details || {};
    const stack = project.stack || [];
    const gallery = galleryFor(project, config);
    const slug = window.PortfolioProjectLinks.slugFor(project);
    const visit = window.PortfolioProjectLinks.accessUrl(project, config);
    const heading = (id, label) => `<h2 id="${id}">${escape(label)}</h2>`;
    const sections = [
      ['overview', modal.overviewTab, 'bi-file-earmark-text-fill'],
      ...(gallery.length ? [['images', modal.imagesTab, 'bi-image-fill']] : []),
      ...(details.technicalSpecs?.length || details.technologies?.length ? [['technical', modal.technicalTab, 'bi-gear-fill']] : [])
    ];

    function renderList(items) {
      return items.map((item) => `<li>${escape(typeof item === 'string' ? item : item.label || item.value)}</li>`).join('');
    }

    const prices = (details.pricing || []).map((item) => {
      if (typeof item === 'string') return `<li>${escape(item)}</li>`;
      return `<li><strong>${escape(item.name || item.title)} ${escape(item.price)}</strong>
        ${item.description ? `<p>${escape(item.description)}</p>` : ''}
        ${item.items?.length ? `<ul>${renderList(item.items)}</ul>` : ''}</li>`;
    }).join('');

    function imageLink(src, index, className) {
      const title = `${labels.open} ${index + 1}`;
      return `<a class="${className}" href="${escape(src)}" data-gallery-index="${index}" aria-label="${escape(title)}">
        <img src="${escape(src)}" alt="" decoding="async"${index ? ' loading="lazy"' : ''}>
      </a>`;
    }

    return `
      <a class="project-back" href="biblioteca/"><i class="bi bi-arrow-left-circle-fill" aria-hidden="true"></i> ${escape(labels.back)}</a>
      <div class="project-heading">
        <div>
          <h1>${escape(project.title)}</h1>
          <p>${escape(project.description)}</p>
          ${stack.length ? `<ul class="project-stack">${renderList(stack)}</ul>` : ''}
          ${visit ? `<a class="project-visit" href="${escape(visit)}" data-track="project_external_click" data-content-id="${slug}">${escape(data.projectsSection.accessCta)} <i class="bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i></a>` : ''}
        </div>
        ${gallery.length ? imageLink(gallery[0], 0, 'project-cover') : ''}
      </div>
      <nav class="project-sections" aria-label="${escape(modal.tabsLabel)}">
        ${sections.map(([id, label, icon]) => `<a href="${escape(pagePath)}#${id}"><i class="bi ${icon}" aria-hidden="true"></i> ${escape(label)}</a>`).join('')}
      </nav>
      <section class="project-section" aria-labelledby="overview">
        ${heading('overview', modal.overviewTab)}
        <p>${escape(details.description || project.description)}</p>
        ${details.features?.length ? `<h3>${escape(modal.featuresTitle)}</h3><ul>${renderList(details.features)}</ul>` : ''}
        ${prices ? `<h3>${escape(modal.pricingTitle)}</h3><ul>${prices}</ul>` : ''}
      </section>
      ${gallery.length ? `<section class="project-section" aria-labelledby="images">
        ${heading('images', modal.imagesTab)}
        <div class="project-screenshots">${gallery.map((src, index) => imageLink(src, index, 'project-shot')).join('')}</div>
      </section>` : ''}
      ${sections.some(([id]) => id === 'technical') ? `<section class="project-section" aria-labelledby="technical">
        ${heading('technical', modal.technicalTab)}
        ${details.technicalSpecs?.length ? `<h3>${escape(modal.technicalDecisionsTitle)}</h3><dl>${details.technicalSpecs.map((item) =>
          typeof item === 'string' ? `<dt>${escape(modal.technicalTitle)}</dt><dd>${escape(item)}</dd>` :
            `<dt>${escape(item.label)}</dt><dd>${escape(item.value || item.description)}</dd>`).join('')}</dl>` : ''}
        ${details.technologies?.length ? `<h3>${escape(modal.technologiesTitle)}</h3><dl>${details.technologies.map((item) =>
          typeof item === 'string' ? `<dt>${escape(item)}</dt><dd></dd>` :
            `<dt>${escape(item.name || item.label)}</dt><dd>${escape(item.description || item.detail)}</dd>`).join('')}</dl>` : ''}
      </section>` : ''}
      <dialog class="photo-viewer" aria-label="${escape(modal.imagesTab)}">
        <div class="photo-toolbar">
          <div class="photo-pagination">
            <button type="button" data-photo-prev aria-label="${escape(modal.previousLabel)}"><i class="bi bi-caret-left-fill" aria-hidden="true"></i></button>
            <span data-photo-count aria-live="polite"></span>
            <button type="button" data-photo-next aria-label="${escape(modal.nextLabel)}"><i class="bi bi-caret-right-fill" aria-hidden="true"></i></button>
          </div>
          <div class="photo-actions">
            <button type="button" data-photo-zoom aria-pressed="false" aria-label="${escape(labels.zoom)}"><i class="bi bi-plus-circle-fill" aria-hidden="true"></i></button>
            <a data-photo-original target="_blank" rel="noopener" aria-label="${escape(labels.original)}"><i class="bi bi-arrow-up-right-circle-fill" aria-hidden="true"></i></a>
            <button type="button" data-photo-close autofocus aria-label="${escape(modal.closeLabel)}"><i class="bi bi-x-circle-fill" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="photo-stage"><img alt=""><p hidden role="status">${escape(modal.unavailableTitle)}</p></div>
      </dialog>`;
  }

  window.PortfolioProjectContent = { render, galleryFor, escape };
})();
