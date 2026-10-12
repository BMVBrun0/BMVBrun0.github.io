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
    window.PortfolioRecommendationsUI?.render(locale);
    const titles = {
      'pt-BR': 'Recomendações profissionais',
      en: 'Professional recommendations',
      es: 'Recomendaciones profesionales'
    };
    document.title = `${titles[locale] || titles.en} | Bruno Getten Triches`;
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = locale === 'en' ? 'Skip to content' : locale === 'es' ? 'Saltar al contenido' : 'Pular para o conteúdo';
  } catch (error) {
    console.error('Unable to initialize professional recommendations:', error);
  }
})();
