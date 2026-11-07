(() => {
  'use strict';

  const analytics = window.portfolioConfig?.analytics || {};
  const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname);
  if (isLocal || new URL(location.href).searchParams.has('project')) return;
  const measurementId = String(analytics.googleAnalyticsId || '').trim();
  const goatCounterUrl = String(analytics.goatCounterUrl || '').trim();

  function loadGoogleAnalytics() {
    if (!measurementId || document.querySelector(`script[data-portfolio-ga="${measurementId}"]`)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { page_location: location.origin + location.pathname });

    const script = document.createElement('script');
    script.async = true;
    script.dataset.portfolioGa = measurementId;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  function loadGoatCounter() {
    if (!goatCounterUrl || document.querySelector('script[data-goatcounter]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.dataset.goatcounter = goatCounterUrl;
    script.src = 'https://gc.zgo.at/count.js';
    document.head.appendChild(script);
  }

  function track(name, params = {}) {
    if (!measurementId || typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      language: document.documentElement.lang,
      page_location: location.origin + location.pathname,
      ...params
    });
  }

  window.PortfolioAnalytics = { track };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-track]');
    if (!link) return;
    switch (link.dataset.track) {
      case 'cv-download':
        track('cv_download', { file_name: new URL(link.href).pathname.split('/').pop() });
        break;
      case 'select_content':
        track('select_content', { content_type: 'project', content_id: link.dataset.contentId });
        break;
      case 'project_external_click':
        track('project_external_click', { content_id: link.dataset.contentId });
        break;
      case 'contact_click':
        track('contact_click', { method: link.dataset.contact });
        break;
    }
  });

  loadGoogleAnalytics();
  loadGoatCounter();
})();
