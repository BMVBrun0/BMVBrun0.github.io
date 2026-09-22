(() => {
  'use strict';

  const analytics = window.portfolioConfig?.analytics || {};
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (isLocal) return;
  const measurementId = String(analytics.googleAnalyticsId || '').trim();
  const goatCounterUrl = String(analytics.goatCounterUrl || '').trim();

  function loadGoogleAnalytics() {
    if (!measurementId || document.querySelector(`script[data-portfolio-ga="${measurementId}"]`)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

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

  function trackCvDownload(link) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'cv_download', {
      file_name: link.getAttribute('href')?.split('/').pop() || '',
      language: document.documentElement.lang || '',
      page_location: window.location.href
    });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-track="cv-download"]');
    if (link) trackCvDownload(link);
  });

  loadGoogleAnalytics();
  loadGoatCounter();
})();
