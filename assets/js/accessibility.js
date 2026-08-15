(() => {
  const WIDGET_ORIGIN = 'https://accessibility-widget-xi.vercel.app';

  const uiLocaleFromDocument = () => {
    const locale = String(document.documentElement.lang || 'pt-BR').toLowerCase();
    if (locale.startsWith('en')) return 'en-US';
    if (locale.startsWith('es')) return 'es-ES';
    return 'pt-BR';
  };

  if (!window.AccessibilityWidget?.createAccessibilityWidget) {
    console.error('[accessibility] Bundle remoto não carregou:', `${WIDGET_ORIGIN}/dist/latest/accessibility-widget.js`);
    return;
  }

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

  // Expose immediately so the license result can be inspected even when denied.
  window.portfolioAccessibilityWidget = widget;

  widget.init()
    .then(() => {
      const license = widget.getLicense();
      if (license.allowed) console.info('[accessibility] Portfólio inicializado.', license.siteId);
    })
    .catch((error) => console.error('[accessibility] Falha ao inicializar no Portfólio.', error));

  const observer = new MutationObserver(() => widget.setUiLocale(uiLocaleFromDocument()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
