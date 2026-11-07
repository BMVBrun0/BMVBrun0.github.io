(() => {
  'use strict';

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
  function projectKey(project) {
    if (project.id) return String(project.id).trim();
    const filename = String(project.image || '').split('/').pop() || '';
    return filename.replace(/\.[^.]+$/, '');
  }

  function slugFor(project) {
    const key = projectKey(project).toLowerCase();
    return SLUG_ALIASES[key] || key.replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function accessUrl(project, config) {
    if (!config.features?.projectLinks) return '';
    const link = config.projectLinks?.[projectKey(project)];
    if (!link?.url || link.enabled === 0 || link.enabled === false) return '';
    try {
      const url = new URL(link.url);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function projectPath(project) {
    return 'projetos/' + slugFor(project) + '/';
  }

  function redirectLegacy(projects, message) {
    const url = new URL(location.href);
    const slug = url.searchParams.get('project');
    if (slug === null) return false;
    const project = projects.find((item) => !item.hidden && slugFor(item) === slug);
    if (!project) {
      const notice = document.createElement('p');
      notice.className = 'container route-notice';
      notice.setAttribute('role', 'status');
      notice.textContent = message;
      document.querySelector('main')?.prepend(notice);
      return false;
    }
    const target = new URL(projectPath(project), document.baseURI);
    url.searchParams.delete('project');
    target.search = url.search;
    target.hash = url.hash;
    location.replace(target.href);
    return true;
  }

  window.PortfolioProjectLinks = { slugFor, projectPath, redirectLegacy, accessUrl };
})();
