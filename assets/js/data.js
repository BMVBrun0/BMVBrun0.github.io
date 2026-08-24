window.portfolioConfig = {
  profile: {
    name: 'Bruno Getten Triches'
  },
  branding: {
    logo: 'assets/img/brand/logo-bm-white.png',
    logoAlt: 'Bruno Getten Triches — Software Architect & Software Engineer',
    favicon: 'favicon.ico',
    socialPreview: 'assets/img/brand/social-preview.jpg',
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
    projectLinks: 1,
    certificates: 1,
    education: 0,
    certificatesCarousel: 1,
    contact: 1,
    socialLinks: 1,
    footer: 1,

    // Experiências interativas. Todas podem ser desligadas individualmente.
    experienceLab: 1,
    themePlayground: 1,
    interactiveCanvas: 0,
    physicsShowcase: 1,
    microInteractions: 1,
    ambientDepth: 1,
    spaceNetwork: 1,
    particleField: 1,
    projectStory: 1
  },
  carousel: {
    autoplay: 1,
    intervalMs: 5000
  },

  // Configurações das experiências visuais/interativas do template.
  // O showcase 3D usa Three.js via CDN configurável e todos os efeitos respeitam prefers-reduced-motion.
  experience: {
    dockPosition: 'left',
    persistPlayground: 1,
    cardRadius: 24,
    motionStrength: 0.75,
    canvas: {
      particlesDesktop: 46,
      particlesMobile: 26,
      connectionDistance: 145,
      pointerRadius: 180,
      speed: 0.22,
      maxDevicePixelRatio: 1.5
    },
    microInteractions: {
      spotlightOpacity: 0.18,
      magneticDistance: 7
    },
    ambientDepth: {
      sectionGlow: 0.78,
      gridOpacity: 0.14,
      mobileGlow: 0.88,
      particlesDesktop: 22,
      particlesMobile: 12,
      linkDistance: 170,
      drift: 0.12,
      glowOpacity: 0.42,
      lineOpacity: 0.18
    },
    particleField: {
      moduleUrl: 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js',
      particlesDesktop: 260,
      particlesMobile: 120,
      spreadX: 13.5,
      spreadY: 8.5,
      spreadZ: 8.0,
      pointSizeDesktop: 0.052,
      pointSizeMobile: 0.064,
      opacity: 0.72,
      drift: 0.22,
      pointerRadius: 2.2,
      pointerForce: 0.12,
      maxDevicePixelRatio: 1.35
    },
    spaceNetwork: {
      moduleUrl: 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js',
      nodesDesktop: 78,
      nodesMobile: 42,
      connectionDistance: 2.55,
      spreadX: 12.5,
      spreadY: 7.2,
      spreadZ: 7.5,
      pointSize: 0.055,
      lineOpacity: 0.16,
      pointOpacity: 0.62,
      drift: 0.16,
      pointerParallax: 0.32,
      maxDevicePixelRatio: 1.35
    },
    story: {
      maxFeatureSteps: 3
    },
    physicsShowcase: {
      moduleUrl: 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js',
      // 'replace' usa a logo 3D no lugar do asset; 'blend' mantém o asset atrás; 'static' desliga a substituição visual.
      displayMode: 'replace',
      placement: 'panel-logo',
      colorMode: 'source',
      logoTexture: '',
      // The renderer crops transparent padding automatically before sampling.
      cropTransparentPadding: 1,
      alphaThreshold: 40,
      sampleResolution: 760,
      // Mais pontos + pontos menores = silhueta definida, sem o efeito de "bolas de algodão".
      particlesDesktop: 10800,
      particlesMobile: 6800,
      dustDesktop: 140,
      dustMobile: 60,
      logoWidth: 5.65,
      // Profundidade curta mantém a leitura da marca; a interação revela o volume 3D.
      logoDepth: 0.44,
      depthLayers: 7,
      particleShape: 'pixel', // 'pixel' (padrão) ou 'atom'
      pointSizeDesktop: 0.019,
      pointSizeMobile: 0.022,
      particleOpacity: 0.96,
      colorBoost: 1.48,
      blendMode: 'normal',
      initialScatter: 0.065,
      // Mantém a marca alinhada quase de frente; o 3D aparece no depth/parallax/interação.
      baseTiltX: -0.004,
      baseTiltY: 0.006,
      baseTiltZ: 0,
      tiltAmountX: 0.008,
      tiltAmountY: 0.015,
      tiltAmountZ: 0.004,
      // A imagem sólida continua desligada. O ghost é apenas um guia quase imperceptível.
      coreOpacityDesktop: 0,
      coreOpacityMobile: 0,
      depthGlowOpacity: 0.018,
      ghostOpacityDesktop: 0.018,
      ghostOpacityMobile: 0.016,
      interactionRadius: 1.65,
      attraction: 0.036,
      pointerForce: 0.11,
      pulseForce: 0.32,
      damping: 0.905,
      maxDevicePixelRatio: 1.5
    },
    themePresets: [
      {
        id: 'original',
        colors: {
          background: '#0e1018',
          backgroundSoft: '#131722',
          backgroundEnd: '#121827',
          accent: '#ff3ac8',
          accentSecondary: '#6b44ff',
          accentTertiary: '#5cd1ff'
        }
      },
      {
        id: 'ocean',
        colors: {
          background: '#07131b',
          backgroundSoft: '#0b1d28',
          backgroundEnd: '#0a2230',
          accent: '#21d4fd',
          accentSecondary: '#2f80ff',
          accentTertiary: '#74f2ce'
        }
      },
      {
        id: 'ember',
        colors: {
          background: '#160d10',
          backgroundSoft: '#211217',
          backgroundEnd: '#271319',
          accent: '#ff5d73',
          accentSecondary: '#ff8a3d',
          accentTertiary: '#ffd166'
        }
      },
      {
        id: 'forest',
        colors: {
          background: '#08140f',
          backgroundSoft: '#0d1d16',
          backgroundEnd: '#10261c',
          accent: '#5ee28b',
          accentSecondary: '#20b486',
          accentTertiary: '#8de8d0'
        }
      }
    ]
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
    { id: 'github', label: 'GitHub', icon: 'bi-github', url: 'https://github.com/BMVBrun0' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'bi-linkedin', url: 'https://www.linkedin.com/in/bruno-getten-triches-152952207/' },
    { id: 'instagram', label: 'Instagram', icon: 'bi-instagram', url: 'https://www.instagram.com/bruno_getten' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'bi-whatsapp', url: 'https://wa.me/5549988427624' }
  ],
  // Links opcionais de acesso aos projetos.
  // A chave é o nome do arquivo de capa sem extensão (ex.: pocket_links.png -> pocket_links).
  // Mantenha enabled: 0 ou url vazio para não exibir o botão.
  projectLinks: {
    whitelabel_booking: { enabled: 0, url: '' },
    xtreme_fut: { enabled: 0, url: '' },
    accessibility_plugin: { enabled: 1, url: 'https://accessibility-widget-xi.vercel.app/' },
    truco_game: { enabled: 0, url: '' },
    radar_publico: { enabled: 0, url: '' },
    support_circle: { enabled: 0, url: '' },
    media_forge: { enabled: 1, url: 'https://media-forge-pi.vercel.app/studio/image-optimize' },
    pocket_links: { enabled: 1, url: 'https://pocket-links-web.vercel.app/' },
    imobly: { enabled: 1, url: 'https://imobly-black.vercel.app/' },
    garimpei: { enabled: 1, url: 'https://garimpei-peach.vercel.app/' },
    realtime_messaging: { enabled: 0, url: '' }
  },
  // A imagem de capa de cada projeto continua definida nos arquivos de idioma.
  // Adicione aqui somente as imagens extras da galeria; a capa entra automaticamente como a primeira imagem.
  // Dessa forma, novos prints são cadastrados uma única vez e aparecem em todos os idiomas.
  projectGalleries: {
    'assets/img/portfolio/whitelabel_booking.png': [
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_01.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_02.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_03.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_04.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_05.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_06.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_07.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_08.png',
      'assets/img/portfolio/whitelabel_booking/whitelabel_booking_09.png'
    ],
    'assets/img/portfolio/xtreme_fut.png': [
      'assets/img/portfolio/xtreme_fut/xtreme_fut_01.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_02.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_03.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_04.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_05.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_06.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_07.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_08.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_09.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_10.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_11.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_12.jpeg',
      'assets/img/portfolio/xtreme_fut/xtreme_fut_13.jpeg'
    ],
    'assets/img/portfolio/accessibility_plugin.png': [
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_01.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_02.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_03.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_04.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_05.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_06.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_07.png',
      'assets/img/portfolio/accessibility_plugin/accessibility_plugin_08.png'
    ],
    'assets/img/portfolio/truco_game.png': [],
    'assets/img/portfolio/pocket_links.png': [
      'assets/img/portfolio/pocket_links/pocket_links_01.png',
      'assets/img/portfolio/pocket_links/pocket_links_02.png',
      'assets/img/portfolio/pocket_links/pocket_links_03.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_04.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_05.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_06.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_07.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_08.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_09.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_10.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_11.jpeg',
      'assets/img/portfolio/pocket_links/pocket_links_12.jpeg'
    ],
    'assets/img/portfolio/media_forge.png': [
      'assets/img/portfolio/media_forge/media_forge_01.png',
      'assets/img/portfolio/media_forge/media_forge_02.png',
      'assets/img/portfolio/media_forge/media_forge_03.png',
      'assets/img/portfolio/media_forge/media_forge_04.png',
      'assets/img/portfolio/media_forge/media_forge_05.png',
      'assets/img/portfolio/media_forge/media_forge_06.png',
      'assets/img/portfolio/media_forge/media_forge_07.png',
      'assets/img/portfolio/media_forge/media_forge_08.png',
      'assets/img/portfolio/media_forge/media_forge_09.png',
      'assets/img/portfolio/media_forge/media_forge_10.png',
      'assets/img/portfolio/media_forge/media_forge_11.png',
      'assets/img/portfolio/media_forge/media_forge_12.png',
      'assets/img/portfolio/media_forge/media_forge_13.png',
      'assets/img/portfolio/media_forge/media_forge_14.png',
      'assets/img/portfolio/media_forge/media_forge_15.png'
    ],
    'assets/img/portfolio/imobly.png': [
      'assets/img/portfolio/imobly/imobly_01.png',
      'assets/img/portfolio/imobly/imobly_02.png',
      'assets/img/portfolio/imobly/imobly_03.png',
      'assets/img/portfolio/imobly/imobly_04.png',
      'assets/img/portfolio/imobly/imobly_05.png',
      'assets/img/portfolio/imobly/imobly_06.png',
      'assets/img/portfolio/imobly/imobly_07.png',
      'assets/img/portfolio/imobly/imobly_08.png',
      'assets/img/portfolio/imobly/imobly_09.png',
      'assets/img/portfolio/imobly/imobly_10.png',
      'assets/img/portfolio/imobly/imobly_11.png'
    ],
    'assets/img/portfolio/garimpei.png': [
      'assets/img/portfolio/garimpei/garimpei_01.png',
      'assets/img/portfolio/garimpei/garimpei_02.png',
      'assets/img/portfolio/garimpei/garimpei_03.png',
      'assets/img/portfolio/garimpei/garimpei_04.png',
      'assets/img/portfolio/garimpei/garimpei_05.png',
      'assets/img/portfolio/garimpei/garimpei_06.png',
      'assets/img/portfolio/garimpei/garimpei_07.png',
      'assets/img/portfolio/garimpei/garimpei_08.png',
      'assets/img/portfolio/garimpei/garimpei_09.png'
    ],
    'assets/img/portfolio/realtime_messaging.png': [
      'assets/img/portfolio/realtime_messaging/realtime_messaging_01.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_02.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_03.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_04.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_05.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_06.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_07.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_08.png',
      'assets/img/portfolio/realtime_messaging/realtime_messaging_09.png'
    ],
    'assets/img/portfolio/support_circle.png': [
      'assets/img/portfolio/support_circle/support_circle_01.png',
      'assets/img/portfolio/support_circle/support_circle_02.png',
      'assets/img/portfolio/support_circle/support_circle_03.png',
      'assets/img/portfolio/support_circle/support_circle_04.png',
      'assets/img/portfolio/support_circle/support_circle_05.png',
      'assets/img/portfolio/support_circle/support_circle_06.png',
      'assets/img/portfolio/support_circle/support_circle_07.png',
      'assets/img/portfolio/support_circle/support_circle_08.png',
      'assets/img/portfolio/support_circle/support_circle_09.png',
      'assets/img/portfolio/support_circle/support_circle_10.png'
    ],
    'assets/img/portfolio/radar_publico.png': [
      'assets/img/portfolio/radar_publico/radar_publico_01.png',
      'assets/img/portfolio/radar_publico/radar_publico_02.png',
      'assets/img/portfolio/radar_publico/radar_publico_03.png',
      'assets/img/portfolio/radar_publico/radar_publico_04.png',
      'assets/img/portfolio/radar_publico/radar_publico_05.png',
      'assets/img/portfolio/radar_publico/radar_publico_06.png',
      'assets/img/portfolio/radar_publico/radar_publico_07.png',
      'assets/img/portfolio/radar_publico/radar_publico_08.png',
      'assets/img/portfolio/radar_publico/radar_publico_09.png',
      'assets/img/portfolio/radar_publico/radar_publico_10.png'
    ],
    'assets/img/portfolio/coming_soon.png': []
  }
};
