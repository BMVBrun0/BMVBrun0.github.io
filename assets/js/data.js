window.portfolioConfig = {
  profile: {
    name: 'Bruno Getten Triches'
  },
  branding: {
    logo: 'assets/img/brand/logo-bm-white.png',
    logoAlt: 'Logo BM',
    favicon: 'favicon.ico',
    socialPreview: 'assets/img/brand/logo-bm.png',
    aboutImage: 'assets/img/about/1.jpg'
  },
  theme: {
    colors: {
      background: '#0e1018',
      backgroundSoft: '#131722',
      backgroundEnd: '#121827',
      text: '#f5f7fb',
      muted: '#b6bfd1',
      accent: '#ff3ac8',
      accentSecondary: '#6b44ff',
      accentTertiary: '#5cd1ff'
    }
  },
  features: {
    languageSwitcher: 1,
    hero: 1,
    about: 1,
    impact: 1,
    recruiter: 1,
    experience: 1,
    services: 1,
    projects: 1,
    projectsCarousel: 1,
    certificates: 1,
    certificatesCarousel: 1,
    contact: 1,
    socialLinks: 1,
    footer: 1
  },
  carousel: {
    autoplay: 1,
    intervalMs: 5000
  },
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  cvByLocale: {
    'pt-BR': 'assets/docs/curriculo-br-2026.pdf',
    'en': 'assets/docs/curriculo-en-2026.pdf',
    'es': 'assets/docs/curriculo-en-2026.pdf'
  },
  localeFiles: {
    'pt-BR': 'assets/languages/pt-BR.json',
    'en': 'assets/languages/en.json',
    'es': 'assets/languages/es.json'
  },
  languageOptions: {
    'pt-BR': { flag: '🇧🇷', label: 'Português (BR)', helper: 'Currículo BR' },
    'en': { flag: '🇺🇸', label: 'English', helper: 'CV in English' },
    'es': { flag: '🇪🇸', label: 'Español', helper: 'CV in English' }
  },
  contactLinks: {
    whatsapp: 'https://wa.me/5549988427624',
    email: 'mailto:trichesbruno@gmail.com',
    linkedin: 'https://www.linkedin.com/in/bruno-getten-triches-152952207/'
  },
  socialLinks: [
    { id: 'github', label: 'GitHub', icon: 'icon-github', url: 'https://github.com/BMVBrun0' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'icon-linkedin', url: 'https://www.linkedin.com/in/bruno-getten-triches-152952207/' },
    { id: 'instagram', label: 'Instagram', icon: 'icon-instagram', url: 'https://www.instagram.com/bruno_getten' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'icon-whatsapp', url: 'https://wa.me/5549988427624' }
  ],
  // A imagem de capa de cada projeto continua definida nos arquivos de idioma.
  // Adicione aqui somente as imagens extras da galeria; a capa entra automaticamente como a primeira imagem.
  // Dessa forma, novos prints são cadastrados uma única vez e aparecem em todos os idiomas.
  projectGalleries: {
    'assets/img/portfolio/whitelabel_booking.png': [
        'assets/img/portfolio/whitelabel_booking/booking_1.png',
        'assets/img/portfolio/whitelabel_booking/booking_2.png',
        'assets/img/portfolio/whitelabel_booking/booking_3.png',
        'assets/img/portfolio/whitelabel_booking/booking_4.png',
        'assets/img/portfolio/whitelabel_booking/booking_5.png',
        'assets/img/portfolio/whitelabel_booking/booking_6.png',
        'assets/img/portfolio/whitelabel_booking/booking_7.png',
        'assets/img/portfolio/whitelabel_booking/booking_8.png',
        'assets/img/portfolio/whitelabel_booking/booking_9.png'
    ],
    'assets/img/portfolio/xtreme_fut.png': [],
    'assets/img/portfolio/accessibility_plugin.png': [
        'assets/img/portfolio/accessibility_plugin/home.png',
        'assets/img/portfolio/accessibility_plugin/home_black_white.png',
        'assets/img/portfolio/accessibility_plugin/home_contrast.png',
        'assets/img/portfolio/accessibility_plugin/home_cursor.png',
        'assets/img/portfolio/accessibility_plugin/home_reading_focus.png',
        'assets/img/portfolio/accessibility_plugin/mobile_1.png',
        'assets/img/portfolio/accessibility_plugin/mobile_2.png',
        'assets/img/portfolio/accessibility_plugin/mobile_3.png'
    ],
    'assets/img/portfolio/truco_game.png': [],
    'assets/img/portfolio/url_shortener.png': [],
    'assets/img/portfolio/media_forge.png': [],
    'assets/img/portfolio/realtime_messaging.png': [
        'assets/img/portfolio/realtime_messaging/Messaging_1.png',
        'assets/img/portfolio/realtime_messaging/Messaging_2.png',
        'assets/img/portfolio/realtime_messaging/Messaging_3.png',
        'assets/img/portfolio/realtime_messaging/Messaging_4.png',
        'assets/img/portfolio/realtime_messaging/Messaging_5.png',
        'assets/img/portfolio/realtime_messaging/Messaging_6.png',
        'assets/img/portfolio/realtime_messaging/Messaging_7.png',
        'assets/img/portfolio/realtime_messaging/Messaging_8.png',
        'assets/img/portfolio/realtime_messaging/Messaging_9.png'
    ],
    'assets/img/portfolio/support_circle.png': [
        'assets/img/portfolio/support_circle/support_1.png',
        'assets/img/portfolio/support_circle/support_2.png',
        'assets/img/portfolio/support_circle/support_3.png',
        'assets/img/portfolio/support_circle/support_4.png',
        'assets/img/portfolio/support_circle/support_5.png',
        'assets/img/portfolio/support_circle/support_6.png',
        'assets/img/portfolio/support_circle/support_7.png',
        'assets/img/portfolio/support_circle/support_8.png',
        'assets/img/portfolio/support_circle/support_9.png',
        'assets/img/portfolio/support_circle/support_10.png'
    ],
    'assets/img/portfolio/radar_publico.png': [
        'assets/img/portfolio/radar_publico/radar_1.png',
        'assets/img/portfolio/radar_publico/radar_2.png',
        'assets/img/portfolio/radar_publico/radar_3.png',
        'assets/img/portfolio/radar_publico/radar_4.png',
        'assets/img/portfolio/radar_publico/radar_5.png',
        'assets/img/portfolio/radar_publico/radar_6.png',
        'assets/img/portfolio/radar_publico/radar_8.png',
        'assets/img/portfolio/radar_publico/radar_9.png',
        'assets/img/portfolio/radar_publico/radar_10.png',
        'assets/img/portfolio/radar_publico/radar_11.png'
    ],
    'assets/img/portfolio/coming_soon.png': []
  }
};
