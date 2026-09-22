(() => {
  'use strict';

  const WIDGET_ORIGIN = 'https://accessibility-widget-xi.vercel.app';
  const WIDGET_SRC = `${WIDGET_ORIGIN}/dist/latest/accessibility-widget.js`;
  let initialized = false;

  const uiLocaleFromDocument = () => {
    const locale = String(document.documentElement.lang || 'pt-BR').toLowerCase();
    if (locale.startsWith('en')) return 'en-US';
    if (locale.startsWith('es')) return 'es-ES';
    return 'pt-BR';
  };

  function initWidget() {
    if (initialized) return;
    if (!window.AccessibilityWidget?.createAccessibilityWidget) {
      console.warn('[accessibility] Bundle remoto indisponível:', WIDGET_SRC);
      return;
    }
    initialized = true;

    const widget = window.AccessibilityWidget.createAccessibilityWidget({
      locale: document.documentElement.lang || 'pt-BR',
      uiLocale: uiLocaleFromDocument(),
      storageKey: 'portfolio-accessibility',
      accentColor: '#5cd1ff',
      license: {
        endpoint: `${WIDGET_ORIGIN}/api/license`,
        siteId: 'portfolio-production'
      },
      onLicenseDenied: (license) => {
        console.error('[accessibility] Licença do Portfólio negada.', license);
      }
    });

    window.portfolioAccessibilityWidget = widget;

    widget.init()
      .then(() => {
        const license = widget.getLicense();
        if (license.allowed) console.info('[accessibility] Portfólio inicializado.', license.siteId);
      })
      .catch((error) => console.error('[accessibility] Falha ao inicializar no Portfólio.', error));

    const observer = new MutationObserver(() => widget.setUiLocale(uiLocaleFromDocument()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  function loadWidgetBundle() {
    if (window.AccessibilityWidget?.createAccessibilityWidget) {
      initWidget();
      return;
    }
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = initWidget;
    script.onerror = () => console.warn('[accessibility] Não foi possível carregar o bundle remoto.');
    document.head.appendChild(script);
  }

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadWidgetBundle, { timeout: 2200 });
    } else {
      window.setTimeout(loadWidgetBundle, 900);
    }
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
