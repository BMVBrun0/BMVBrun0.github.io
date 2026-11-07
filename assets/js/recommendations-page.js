(async () => {
  'use strict';
  const P = window.PortfolioPages;
  const locale = P.detectLocale();
  try {
    const data = await P.loadLocale(locale);
    P.applyTheme();
    P.setBranding();
    P.bindLocaleSelect(locale);
    P.localizeSharedHeader(data, 'recommendations');
    document.documentElement.lang = locale;
    window.PortfolioRecommendationsUI?.render(locale, data.recommendations);
    document.title = `${data.recommendations.documentTitle} | ${P.config.profile.name}`;
  } catch (error) {
    console.error('Unable to initialize professional recommendations:', error);
  }
})();
