(async () => {
  'use strict';

  const P = window.PortfolioPages;
  const locale = P.detectLocale();
  const data = await P.loadLocale(locale);
  const extra = P.extended[locale]?.resume || P.extended['pt-BR'].resume;
  const ui = {
    'pt-BR': {
      available: 'Aberto a oportunidades remotas e internacionais',
      jump: [['Resumo', 'resume-summary-section'], ['Origem', 'resume-origin-section'], ['Experiência', 'resume-experience-section'], ['Stack', 'resume-skills-section'], ['Como trabalho', 'resume-principles-section'], ['Projetos', 'resume-projects-section'], ['Formação', 'resume-learning-section'], ['Informações', 'resume-facts-section']],
      openDetails: 'Abrir história, entregas e contexto',
      facts: [['Experiência', '8+ anos'], ['Atuação', 'Full Stack · Mobile · Tech Lead'], ['Base', 'Brasil'], ['Perfil', 'Hands-on + arquitetura + liderança']]
    },
    en: {
      available: 'Open to remote and international opportunities',
      jump: [['Summary', 'resume-summary-section'], ['Origins', 'resume-origin-section'], ['Experience', 'resume-experience-section'], ['Stack', 'resume-skills-section'], ['How I work', 'resume-principles-section'], ['Projects', 'resume-projects-section'], ['Education', 'resume-learning-section'], ['Details', 'resume-facts-section']],
      openDetails: 'Open story, delivery and context',
      facts: [['Experience', '8+ years'], ['Focus', 'Full Stack · Mobile · Tech Lead'], ['Based in', 'Brazil'], ['Profile', 'Hands-on + architecture + leadership']]
    },
    es: {
      available: 'Abierto a oportunidades remotas e internacionales',
      jump: [['Resumen', 'resume-summary-section'], ['Origen', 'resume-origin-section'], ['Experiencia', 'resume-experience-section'], ['Stack', 'resume-skills-section'], ['Cómo trabajo', 'resume-principles-section'], ['Proyectos', 'resume-projects-section'], ['Formación', 'resume-learning-section'], ['Información', 'resume-facts-section']],
      openDetails: 'Abrir historia, entregas y contexto',
      facts: [['Experiencia', '8+ años'], ['Enfoque', 'Full Stack · Mobile · Tech Lead'], ['Base', 'Brasil'], ['Perfil', 'Hands-on + arquitectura + liderazgo']]
    }
  }[locale] || null;

  P.applyTheme();
  P.setBranding();
  P.bindLocaleSelect(locale);
  P.localizeSharedHeader(data, 'resume');
  document.documentElement.lang = locale;
  const profileTitle = `${P.config.profile?.name || 'Bruno Getten Triches'}${P.config.profile?.nickname ? ` (${P.config.profile.nickname})` : ''}`;
  document.title = `${extra.seoTitle || extra.title} | ${profileTitle}`;
  const pageDescription = document.querySelector('meta[name="description"]');
  if (pageDescription && extra.seoDescription) pageDescription.setAttribute('content', extra.seoDescription);

  const set = (id, value) => {
    const node = P.qs(`#${id}`);
    if (node) node.textContent = value || '';
  };

  P.qsa('[data-copy]').forEach((node) => {
    if (extra[node.dataset.copy]) node.textContent = extra[node.dataset.copy];
  });

  set('resume-eyebrow', extra.eyebrow);
  set('resume-title', extra.title);
  set('resume-intro', extra.intro);
  set('summary-title', extra.summaryTitle);
  set('summary-text', extra.summary);
  set('focus-title', extra.focusTitle);
  set('education-title', extra.educationTitle);
  set('languages-title', extra.languagesTitle);
  set('experience-title', extra.experienceTitle);
  set('experience-intro', extra.experienceIntro);
  set('selected-projects-title', extra.selectedProjectsTitle);
  set('selected-projects-text', extra.selectedProjectsText);
  set('resume-learning-title', extra.learningTitle || extra.educationTitle);
  set('resume-learning-text', extra.learningText || '');
  set('resume-learning-link', extra.learningLink || extra.library);
  set('resume-presence-text', ui.available);
  set('resume-origin-title', extra.originTitle);
  set('resume-origin-intro', extra.originIntro);
  set('resume-principles-title', extra.principlesTitle);
  set('resume-principles-intro', extra.principlesIntro);
  set('resume-availability-title', extra.availabilityTitle);
  set('resume-availability-text', extra.availability);
  const labels = extra.labels || {};
  set('resume-profile-kicker', labels.profile);
  set('resume-origin-kicker', labels.origin);
  set('resume-experience-kicker', labels.experience);
  set('resume-skills-kicker', labels.skills);
  set('resume-principles-kicker', labels.principles);
  set('resume-projects-kicker', labels.projects);
  set('resume-learning-kicker', labels.learning);
  set('resume-facts-kicker', labels.facts);
  set('resume-links-title', labels.links);

  P.qs('#resume-jumpbar').innerHTML = ui.jump.map(([label, id]) => `<a href="#${P.escapeHtml(id)}">${P.escapeHtml(label)}</a>`).join('');
  P.qs('#resume-facts-list').innerHTML = ui.facts.map(([label, value]) => `<div class="resume-fact"><dt>${P.escapeHtml(label)}</dt><dd>${P.escapeHtml(value)}</dd></div>`).join('');
  P.qs('#resume-hero-metrics').innerHTML = (extra.metrics || []).map((item) => `<article><strong>${P.escapeHtml(item.value)}</strong><span>${P.escapeHtml(item.label)}</span></article>`).join('');

  const download = P.qs('#resume-download');
  if (download) {
    const cvUrl = P.config.cvByLocale?.[locale] || P.config.cvByLocale?.[P.config.defaultLocale] || '#';
    download.href = cvUrl;
    download.setAttribute('download', locale === 'pt-BR' ? 'Bruno_Getten_Triches_Curriculo.pdf' : 'Bruno_Getten_Triches_Resume.pdf');
    download.innerHTML = `<svg class="page-button__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg><span>${P.escapeHtml(extra.download)}</span>`;
  }

  P.qs('#resume-origin-grid').innerHTML = (extra.origin || []).map((item, index) => `
    <article class="resume-origin-card">
      <div class="resume-origin-card__top"><span>${String(index + 1).padStart(2, '0')}</span><strong>${P.escapeHtml(item.period || '')}</strong></div>
      <h3>${P.escapeHtml(item.title || '')}</h3>
      <p>${P.escapeHtml(item.text || '')}</p>
    </article>`).join('');

  const technologyMatrix = window.portfolioTechnologyMatrix || {};
  const matrixCopy = technologyMatrix.copy?.[locale] || technologyMatrix.copy?.['pt-BR'];
  const levelLabel = new Map(matrixCopy?.legend || []);
  set('focus-title', matrixCopy?.title || extra.focusTitle);
  const skillsSection = P.qs('#resume-skills-section .resume-section-heading');
  if (skillsSection && matrixCopy?.intro) {
    const intro = document.createElement('p');
    intro.className = 'resume-section-intro';
    intro.textContent = matrixCopy.intro;
    skillsSection.appendChild(intro);
  }
  const technologyGroups = technologyMatrix.groups || [];
  const renderTechnologyGroup = (group) => {
    const preview = (group.items || []).slice(0, 3).map(([name]) => name).join(' · ');
    return `<details class="technology-group ${group.id === 'deepening' ? 'technology-group--deepening' : ''}">
      <summary>
        <span class="technology-group__summary-copy"><strong>${P.escapeHtml(group.labels?.[locale] || group.labels?.['pt-BR'] || group.id)}</strong><small>${P.escapeHtml(preview)}</small></span>
        <span class="technology-group__count">${group.items.length}</span>
      </summary>
      <div class="technology-group__rows">${group.items.map(([name,level,context]) => `<div class="technology-row"><div><strong>${P.escapeHtml(name)}</strong>${context ? `<small>${P.escapeHtml(context)}</small>` : ''}</div><span class="technology-level technology-level--${P.escapeHtml(level)}"><i></i>${P.escapeHtml(levelLabel.get(level) || level)}</span></div>`).join('')}</div>
    </details>`;
  };
  const technologyColumns = [[], []];
  technologyGroups.forEach((group, index) => technologyColumns[index % 2].push(group));
  P.qs('#resume-skills').innerHTML = `
    <div class="technology-legend">${(matrixCopy?.legend || []).map(([level,label]) => `<span><i class="tech-level tech-level--${P.escapeHtml(level)}"></i>${P.escapeHtml(label)}</span>`).join('')}</div>
    <div class="technology-matrix">
      ${technologyColumns.map((column) => `<div class="technology-column">${column.map(renderTechnologyGroup).join('')}</div>`).join('')}
    </div>`;

  const education = (data.education || []).filter((item) => item.enabled !== 0 && item.enabled !== false);
  P.qs('#resume-education').innerHTML = education.map((item) => `
    <article class="resume-education-card"><strong>${P.escapeHtml(item.course)}</strong><span>${P.escapeHtml(item.institution)} · ${P.escapeHtml(item.period || '')}</span><p>${P.escapeHtml(item.description || '')}</p></article>`).join('');
  P.qs('#resume-languages').innerHTML = (extra.languages || []).map((item) => `<li>${P.escapeHtml(item)}</li>`).join('');

  function detailBox(title, items) {
    if (!Array.isArray(items) || !items.length) return '';
    const impact = /resultado|result|impacto|impact/i.test(String(title || ''));
    return `<section class="resume-detail-box ${impact ? 'resume-detail-box--impact' : ''}"><h4>${P.escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${P.escapeHtml(item)}</li>`).join('')}</ul></section>`;
  }

  function splitJobTitle(title) {
    const raw = String(title || '').trim();
    const parts = raw.split(/\s+·\s+/);
    if (parts.length < 2) return { role: raw, company: '' };
    return { role: parts.shift().trim(), company: parts.join(' · ').trim() };
  }

  const experience = Array.isArray(data.experience) ? data.experience : [];
  const desktop = matchMedia('(min-width: 980px)').matches;
  P.qs('#resume-timeline').innerHTML = experience.map((job, index) => {
    const details = P.getCompanyDetails(locale, job.title);
    const title = splitJobTitle(job.title);
    const stack = details?.stack || [];
    const boxes = details?.sections?.length
      ? details.sections.map((section) => detailBox(section.title, section.items)).join('')
      : `${detailBox(extra.responsibilities, details?.responsibilities)}${detailBox(extra.projectsBuilt, details?.projects)}`;
    const expandedContent = details ? `<div class="resume-job__longform">${details.overview ? `<p class="resume-job__overview">${P.escapeHtml(details.overview)}</p>` : ''}<div class="resume-detail-grid">${boxes}</div></div>` : '';
    return `
      <article class="resume-job">
        <div class="resume-job__head">
          <div class="resume-job__topline"><span class="resume-job__index">${P.escapeHtml(labels.timelinePrefix || 'LOG')} ${String(index + 1).padStart(2, '0')}</span><span class="resume-job__period">${P.escapeHtml(job.period || '')}</span></div>
          <h3><span class="resume-job__role">${P.escapeHtml(title.role)}</span>${title.company ? `<span class="resume-job__company">${P.escapeHtml(title.company)}</span>` : ''}</h3>
        </div>
        <p class="resume-job__summary">${P.escapeHtml(job.description || '')}</p>
        ${stack.length ? `<div class="resume-job__stack"><div class="stack-row">${stack.map((item) => `<span class="stack-chip">${P.escapeHtml(item)}</span>`).join('')}</div></div>` : ''}
        ${expandedContent ? `<details class="resume-job__details" ${(desktop && index === 0) ? 'open' : ''}><summary>${P.escapeHtml(ui.openDetails)}</summary>${expandedContent}</details>` : ''}
      </article>`;
  }).join('');

  P.qs('#resume-principles-grid').innerHTML = (extra.principles || []).map((item, index) => `
    <article class="resume-principle-card"><span>${String(index + 1).padStart(2, '0')}</span><h3>${P.escapeHtml(item.title || '')}</h3><p>${P.escapeHtml(item.text || '')}</p></article>`).join('');

  const projects = Array.isArray(data.projects) ? data.projects.filter((item) => !item.hidden) : [];
  const selected = projects.filter((project) => P.projectLink(project)).slice(0, 6);
  const fallback = selected.length >= 4 ? selected : projects.slice(0, 6);
  P.qs('#resume-project-grid').innerHTML = fallback.map((project) => {
    const cover = P.galleryFor(project)[0] || project.image;
    return `<article class="resume-project-card"><img src="${P.escapeHtml(cover)}" alt="${P.escapeHtml(project.title)}" loading="lazy" decoding="async" fetchpriority="low"><div><h3>${P.escapeHtml(project.title)}</h3><p>${P.escapeHtml(project.description || '')}</p></div></article>`;
  }).join('');

  P.qs('#resume-learning-current').innerHTML = education.map((item) => `
    <article class="resume-learning-degree">
      <a class="resume-learning-degree__logo" href="${P.escapeHtml(item.url || '#')}" ${item.url ? 'target="_blank" rel="noopener"' : ''} aria-label="${P.escapeHtml(item.institution || item.course)}">
        ${item.logo ? `<img src="${P.escapeHtml(item.logo)}" alt="${P.escapeHtml(item.logoAlt || item.institution || '')}" loading="lazy" decoding="async" onerror="this.hidden=true">` : ''}
        <span>${P.escapeHtml((item.institution || 'EDU').split(/\s+/).map((word) => word[0]).join('').slice(0,3).toUpperCase())}</span>
      </a>
      <div class="resume-learning-degree__copy"><small>${P.escapeHtml(item.degree || extra.educationTitle || '')}</small><h3>${P.escapeHtml(item.course)}</h3><p>${P.escapeHtml(item.institution)} · ${P.escapeHtml(item.period || '')}</p></div>
      <span class="resume-learning-degree__status">${P.escapeHtml(item.status || '')}</span>
    </article>`).join('');

  const certificates = Array.isArray(data.certificates) ? data.certificates : [];
  const languageCredential = certificates.find((item) => item.kind === 'language');
  const technicalCredentials = certificates.filter((item) => item.kind !== 'language').slice(0, 3);
  const credentialPreview = [...technicalCredentials, ...(languageCredential ? [languageCredential] : [])];
  P.qs('#resume-credential-grid').innerHTML = credentialPreview.map((item) => `
    <article class="resume-credential-card">
      ${item.url ? `<a href="${P.escapeHtml(item.url)}" target="_blank" rel="noopener">` : '<div>'}
        <div class="resume-credential-card__media"><img src="${P.escapeHtml(item.image || '')}" alt="${P.escapeHtml(item.title)}" loading="lazy" decoding="async" fetchpriority="low"></div>
        <div class="resume-credential-card__copy"><small>${P.escapeHtml([item.provider, item.year].filter(Boolean).join(' · '))}</small><h3>${P.escapeHtml(item.title)}</h3></div>
      ${item.url ? '</a>' : '</div>'}
    </article>`).join('');

  let printState = [];
  window.addEventListener('beforeprint', () => {
    const details = P.qsa('.resume-job__details');
    printState = details.map((item) => item.open);
    details.forEach((item) => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    P.qsa('.resume-job__details').forEach((item, index) => { item.open = Boolean(printState[index]); });
  });
  const jumpLinks = P.qsa('#resume-jumpbar a');
  const jumpSections = jumpLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && jumpSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      jumpLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, .1, .35] });
    jumpSections.forEach((section) => sectionObserver.observe(section));
  }

})();
