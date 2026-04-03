window.portfolioData = {
  roles: [
    'Desenvolvedor Web',
    'Desenvolvedor Mobile',
    'Desenvolvedor de Jogos',
    'Tech Lead'
  ],
  skills: [
    { name: 'Laravel', level: 95 },
    { name: 'React Native', level: 100 },
    { name: 'TypeScript', level: 90 },
    { name: 'PHP', level: 85 },
    { name: 'JavaScript', level: 90 },
    { name: 'C#', level: 80 },
    { name: 'Unity', level: 60 },
    { name: 'Bancos de Dados (SQL/MongoDB)', level: 70 }
  ],
  experience: [
    {
      title: 'Tech Lead · Sensorama Play',
      period: '2025 · Atual',
      description: 'Liderança técnica de múltiplos projetos voltados ao setor público, com foco em arquitetura de sistemas, padronização de código, pipelines de deploy e documentação técnica. Atuação prática em projetos web, mobile, APIs, jogos 2D/3D e infraestrutura.'
    },
    {
      title: 'Desenvolvedor Pleno · Amplimed',
      period: '2024 · 2025',
      description: 'Responsável pelos principais produtos do marketplace, incluindo agendamento online, telemedicina, aplicativos e filas de atendimento. Atuei em refatoração, microsserviços e soluções white-label.'
    },
    {
      title: 'Tech Lead · Astronfy',
      period: '2023 · 2024',
      description: 'Responsável técnico pelo marketplace, dashboard de afiliados, sistema de suporte e produtos 2D/3D, com integrações de pagamento nacionais, internacionais e em cripto, além de contato direto com clientes internacionais.'
    },
    {
      title: 'Desenvolvedor Pleno · Infogen Sistemas',
      period: '2022 · 2023',
      description: 'Atuação em ERP com GeneXus, portal .NET e aplicações mobile, incluindo refatoração de apps para React Native, mentoria, integrações, publicação de apps e apoio na padronização da stack.'
    },
    {
      title: 'Desenvolvedor Freelancer',
      period: '2018 · Atual',
      description: 'Projetos sob demanda em landing pages, intranets, mini ERPs, dashboards em tempo real, apps mobile, integrações diversas e jogos 3D multiplayer.'
    }
  ],
  services: [
    {
      icon: 'assets/img/service/4.png',
      title: 'Arquitetura de Software',
      description: 'Estruturação de sistemas escaláveis, definição de padrões, separação de responsabilidades e melhoria de manutenção.'
    },
    {
      icon: 'assets/img/service/5.png',
      title: 'Desenvolvimento Web',
      description: 'Criação de plataformas, dashboards, sistemas administrativos, landing pages e aplicações web com foco em performance e usabilidade.'
    },
    {
      icon: 'assets/img/service/6.png',
      title: 'Desenvolvimento Mobile',
      description: 'Desenvolvimento e evolução de aplicativos Android e iOS com foco em estabilidade, publicação e manutenção contínua.'
    },
    {
      icon: 'assets/img/service/1.png',
      title: 'APIs e Integrações',
      description: 'Integrações com gateways de pagamento, sistemas externos, autenticação, serviços em nuvem, OAuth, SSO e automações.'
    },
    {
      icon: 'assets/img/service/2.png',
      title: 'Soluções White-Label',
      description: 'Construção de produtos reutilizáveis e personalizados para diferentes clientes, acelerando entregas e expansão comercial.'
    },
    {
      icon: 'assets/img/service/3.png',
      title: 'Refatoração e Escalabilidade',
      description: 'Melhoria de sistemas legados, reorganização de código, redução de retrabalho e preparação para crescimento.'
    }
  ],
  categories: [
    { id: 'all', label: 'Todos' },
    { id: 'product', label: 'Produtos' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'tool', label: 'SDK / Ferramentas' },
    { id: 'game', label: 'Jogos' }
  ],
  projects: [
    {
      title: 'Aplicativo de Agendamento Online',
      category: 'mobile',
      image: 'assets/img/portfolio/1.jpg',
      status: 'Planejado',
      description: 'Aplicativo mobile para agendamento online com autenticação tradicional, login via Firebase, SSO com Google e integração direta com Google Calendar.',
      stack: ['React Native', 'Firebase Auth', 'Google SSO', 'Google Calendar API']
    },
    {
      title: 'Painel Web de Agenda e Administração',
      category: 'product',
      image: 'assets/img/portfolio/2.jpg',
      status: 'Planejado',
      description: 'Painel web integrado ao app para agendamento, gestão de produtos, administração de datas, controle operacional e fluxo centralizado por API.',
      stack: ['Laravel', 'Painel Admin', 'API REST', 'Integração App + Web']
    },
    {
      title: 'SDK e Plugin de Acessibilidade Universal',
      category: 'tool',
      image: 'assets/img/portfolio/3.jpg',
      status: 'Planejado',
      description: 'SDK/plugin reutilizável para adicionar menu de acessibilidade em sites e sistemas, com foco em perfis como TDAH, autismo, deficiência visual e recursos inspirados em soluções como VLibras.',
      stack: ['JavaScript SDK', 'Plugin Web', 'Acessibilidade', 'Configuração White-Label']
    },
    {
      title: 'Encurtador de URL Mobile Offline',
      category: 'mobile',
      image: 'assets/img/portfolio/4.jpg',
      status: 'Público em breve',
      description: 'Aplicativo mobile com autenticação, funcionamento offline, persistência local em SQLite e histórico recente mantido por cache para uso contínuo mesmo sem rede.',
      stack: ['React Native', 'SQLite', 'Cache Local', 'Offline First']
    },
    {
      title: 'Website de Compressão e Conversão de Assets',
      category: 'tool',
      image: 'assets/img/portfolio/5.jpg',
      status: 'Público em breve',
      description: 'Ferramenta web para compressão e conversão de assets, pensada para acelerar fluxos de trabalho com imagens, arquivos estáticos e materiais prontos para uso em apps, sites e jogos.',
      stack: ['Web App', 'Conversão de Arquivos', 'Compressão', 'Produtividade']
    },
    {
      title: 'Truco 2D Multiplayer em Unity',
      category: 'game',
      image: 'assets/img/portfolio/6.jpg',
      status: 'Público em breve',
      description: 'Jogo 2D de truco feito em Unity com suporte a multiplayer local e online, estrutura preparada para partidas rápidas, gerenciamento de estado e expansão futura.',
      stack: ['Unity', 'C#', 'Multiplayer Local', 'Multiplayer Online']
    }
  ]
};
