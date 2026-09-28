# Portfólio estático

Template de portfólio pessoal feito com HTML, CSS e JavaScript puro. Não exige framework, build ou hospedagem paga e pode ser publicado gratuitamente com GitHub Pages.

## Obter o projeto

Baixe o repositório como ZIP pelo GitHub ou clone pelo Git. Depois, abra a pasta no VS Code.

## Rodar localmente

O projeto carrega os arquivos de idioma com `fetch`, então abra por um servidor local em vez de clicar diretamente no `index.html`.

**VS Code:** instale a extensão **Live Server**, abra a pasta do projeto e use **Open with Live Server**.

Alternativa pelo terminal:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

## Personalizar

A configuração principal fica em `assets/js/data.js`:

- `profile`: nome exibido no portfólio;
- `branding`: logo, favicon, imagem social e foto da seção Sobre;
- `theme.colors`: cores principais do tema;
- `features`: ativa ou desativa seções e recursos com `1` ou `0`;
- `projectLinks`: links opcionais de acesso aos projetos;
- `carousel`: autoplay e intervalo dos carrosséis;
- `experience`: intensidade, presets e parâmetros das experiências interativas;
- `cvByLocale`: PDFs do currículo;
- `contactLinks` e `socialLinks`: links pessoais;
- `projectGalleries`: imagens extras dos projetos.

Os textos, projetos, formação acadêmica, certificados e traduções ficam em:

```text
assets/languages/pt-BR.json
assets/languages/en.json
assets/languages/es.json
```

Os arquivos de imagem e documentos ficam em `assets/img` e `assets/docs`. Depois de adicionar um asset, use o caminho relativo correspondente na configuração ou no arquivo de idioma.

### Telas extras

O portfólio agora possui duas páginas adicionais, sem transformar a home em uma página ainda maior:

- `library.html`: biblioteca gamificada de projetos, detalhes técnicos, galerias, certificações e formação;
- `resume.html`: currículo expandido em HTML, com experiência, contexto por empresa, projetos selecionados e versão amigável para impressão/PDF.

Os projetos, certificados, formação e experiência continuam vindo dos JSONs de idioma existentes. Textos longos específicos das novas telas e detalhes por empresa ficam em `assets/js/extended-data.js`, pensado para ser editado manualmente sem alterar o renderer.



### Links de acesso dos projetos

Os botões de acesso são controlados em `assets/js/data.js`. A flag global `features.projectLinks` ativa ou desativa o recurso inteiro. Cada projeto também possui sua própria flag `enabled`.

A chave usada em `projectLinks` é o nome do arquivo da capa sem a extensão. Por exemplo, `assets/img/portfolio/pocket_links.webp` usa a chave `pocket_links`:

```js
features: {
  projectLinks: 1
},

projectLinks: {
  pocket_links: {
    enabled: 1,
    url: 'https://seu-projeto.com'
  }
}
```

Com `enabled: 0`, URL vazia ou `features.projectLinks: 0`, o botão não é exibido. Por segurança, os botões aceitam somente URLs HTTP/HTTPS. Quando ativo, o link aparece no card e também nos detalhes do projeto.

### Formação acadêmica

A formação acadêmica aparece na mesma área dos certificados. O recurso é controlado por `features.education` em `assets/js/data.js`, e os dados ficam no array `education` de cada arquivo de idioma.

O template já inclui um item-modelo desativado. Edite os dados e troque `enabled` para `1`:

```json
"education": [
  {
    "enabled": 1,
    "institution": "Nome da faculdade",
    "course": "Nome do curso",
    "degree": "Bacharelado",
    "period": "2022 — 2026",
    "status": "Concluído",
    "description": "Breve descrição da formação.",
    "url": "https://site-da-instituicao.com"
  }
]
```

O campo `url` é opcional. Para manter os idiomas sincronizados, cadastre a mesma formação em `pt-BR.json`, `en.json` e `es.json`, traduzindo somente os textos.

### Convenção de imagens dos projetos

As capas de marketing ficam diretamente em `assets/img/portfolio` usando o slug do produto, por exemplo `media_forge.webp` e `pocket_links.webp`.

As imagens internas de galeria ficam em uma pasta com o mesmo slug e seguem numeração com dois dígitos:

```text
assets/img/portfolio/pocket_links/pocket_links_01.webp
assets/img/portfolio/pocket_links/pocket_links_02.webp
assets/img/portfolio/pocket_links/pocket_links_03.webp
```

A mesma regra vale para todos os projetos com galeria: `<slug>/<slug>_NN.webp`. Para GitHub Pages, prefira WebP para evitar transferir screenshots PNG de vários megabytes.

### Ativar ou ocultar blocos

Em `assets/js/data.js`, altere as flags de `features`:

```js
features: {
  about: 1,
  services: 1,
  projects: 1,
  projectLinks: 1,
  certificates: 1,
  education: 1,
  contact: 1,
  projectsCarousel: 0,
  certificatesCarousel: 0
}
```

`0` oculta/desativa. `1` exibe/ativa. Por exemplo, `contact: 0` remove a área de contato e seu acesso no menu; `socialLinks: 0` oculta os links sociais.

Com `projectsCarousel: 1` ou `certificatesCarousel: 1`, a grade correspondente vira um carrossel automático: 3 cards por vez no desktop, 2 em telas intermediárias e 1 no mobile.

### Cursos, certificados e badges digitais

As credenciais da home e da Biblioteca usam a mesma lista `certificates` de cada arquivo em `assets/languages/`. Não crie blocos HTML específicos por instituição: adicione um item à lista e o componente se adapta automaticamente.

Uma credencial pode ter certificado e zero ou mais badges digitais:

```json
{
  "provider": "AWS Training & Certification",
  "providerClass": "aws",
  "year": "28 set 2026",
  "title": "AWS Well-Architected Foundations",
  "credentialType": "Treinamento oficial AWS",
  "description": "...",
  "tags": ["Well-Architected", "Reliability"],
  "url": "assets/docs/aws/certificado.pdf",
  "image": "assets/img/certificates/aws/certificado.webp",
  "badges": [
    {
      "title": "AWS Well-Architected Proficient",
      "label": "Badge de proficiência",
      "issuer": "Credly",
      "image": "assets/img/certificates/aws/badge.png",
      "url": "https://www.credly.com/badges/.../public_url"
    }
  ]
}
```

O array `badges` é opcional. Quando existir, cada badge é renderizada apenas dentro da credencial correspondente, com imagem única e link de verificação. O mesmo modelo funciona com novas instituições e múltiplas badges sem alterar o HTML da página.

## Performance no GitHub Pages

Os assets raster usados pela interface foram convertidos para WebP e redimensionados para uma resolução compatível com o uso real em cards e galerias. As imagens de projeto/certificado usam lazy loading e decodificação assíncrona; efeitos 3D decorativos secundários são inicializados em idle time, deixando o conteúdo principal e o showcase do hero como prioridade.

Ao adicionar novas screenshots, prefira WebP e evite exportar imagens de 3000–4000 px quando a galeria não precisa dessa resolução.

## Experience Lab e efeitos interativos

O template inclui uma camada opcional de experiências visuais em HTML, CSS e JavaScript. O showcase principal usa **Three.js** carregado por uma URL configurável; se a biblioteca externa não carregar, o restante do portfólio continua funcionando normalmente. As experiências podem ser ligadas ou desligadas individualmente em `assets/js/data.js`:

```js
features: {
  experienceLab: 1,      // botão LAB e painel de demonstração
  themePlayground: 1,    // troca de paleta, cores, cantos e intensidade
  interactiveCanvas: 0,  // canvas 2D legado; pode ser reativado se desejado
  physicsShowcase: 1,    // logo BM 3D com partículas e física no hero
  microInteractions: 1,  // spotlight em cards e botões magnéticos
  ambientDepth: 1,       // profundidade visual no header, seções e footer
  projectStory: 1        // narrativa dos projetos
}
```

`experienceLab: 0` remove apenas o painel público de personalização. O showcase 3D, as microinterações e a História continuam independentes. O Canvas 2D original fica desligado por padrão para não competir visualmente com a experiência Three.js.

Os principais parâmetros ficam no objeto `experience`:

```js
experience: {
  dockPosition: 'left',
  persistPlayground: 1,
  cardRadius: 24,
  motionStrength: 0.75,
  physicsShowcase: {
    moduleUrl: 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js',
    logoTexture: 'assets/img/brand/logo-bm-white.webp',
    particlesDesktop: 1500,
    particlesMobile: 780,
    dustDesktop: 260,
    dustMobile: 120,
    logoWidth: 5.35,
    logoDepth: 0.48,
    interactionRadius: 2.25,
    attraction: 0.022,
    pointerForce: 0.15,
    pulseForce: 0.46,
    damping: 0.918,
    maxDevicePixelRatio: 1.5
  },
  story: {
    maxFeatureSteps: 3
  }
}
```

O **showcase 3D** reconstrói a própria logo configurada em `branding.logo` como uma nuvem tridimensional de partículas, com profundidade e poeira ambiente. Ele reage ao mouse e ao toque: as partículas são puxadas de volta para a marca por uma força elástica, afastadas pelo ponteiro e recebem um impulso adicional ao clicar/tocar. O efeito pausa quando a seção sai da tela ou a aba fica oculta e reduz movimento quando o sistema usa `prefers-reduced-motion`.

O **Playground visual** altera o tema somente no navegador do visitante e, com `persistPlayground: 1`, salva a preferência em `localStorage`. O botão **Restaurar padrão** volta para as cores e valores definidos em `data.js`. O botão **Copiar configuração** gera um trecho pronto com a personalização atual.

Os detalhes dos projetos foram mantidos intencionalmente enxutos: **Visão geral**, **História**, **Técnico** e **Imagens**. Preços, quando existirem, aparecem dentro da Visão geral. A área Técnica reúne especificações, tecnologias, justificativas e o fluxo de arquitetura no mesmo lugar, evitando abas repetitivas. A História usa navegação por etapas clicáveis e um carrossel horizontal com `scroll-snap`, deixando a primeira e a última etapa determinísticas mesmo em touch.

`ambientDepth` adiciona uma linguagem visual compartilhada ao header, às seções e ao footer, inclusive no mobile. O efeito também pode ser ligado/desligado no LAB sem afetar o conteúdo.

Em dispositivos touch, as interações usam feedback de toque em vez de depender de hover. No mobile, o LAB funciona como um painel vertical rolável e o botão é reduzido para ocupar menos espaço permanente na interface.

## Crédito do template

O crédito “Template por Bruno Getten Triches” foi mantido propositalmente fora de `data.js` e recebeu uma camada adicional de proteção no navegador: o conteúdo é renderizado em **Shadow DOM fechado** e um verificador restaura o bloco caso ele seja removido ou substituído durante a execução da página. A flag `features.footer` controla somente o copyright e o botão de voltar ao topo; ela não remove o crédito do template.

Como este é um projeto HTML/CSS/JavaScript estático e distribuído com o código-fonte, nenhuma proteção no frontend pode impedir de forma absoluta que alguém com acesso aos arquivos edite ou apague o código responsável pelo crédito. A proteção serve para evitar remoções acidentais e tornar alterações casuais mais trabalhosas, sem introduzir backend, build ou dependências extras.

## Publicar no GitHub Pages

Para usar o endereço principal do GitHub Pages, crie um repositório chamado:

```text
SEU-USUARIO.github.io
```

Envie os arquivos para a branch `main` e, no GitHub, abra **Settings > Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, selecione `main` e a pasta `/(root)`, e salve.

O endereço ficará:

```text
https://SEU-USUARIO.github.io/
```

Também é possível publicar a partir de um repositório com outro nome; nesse caso, o GitHub Pages usa uma URL de projeto que inclui o nome do repositório.

## Analytics

O carregamento de analytics é centralizado em `assets/js/analytics.js` e configurado em `assets/js/data.js`. Assim, Home, Biblioteca e Currículo+ usam a mesma configuração sem duplicar scripts nos arquivos HTML.

```js
analytics: {
  googleAnalyticsId: 'G-XXXXXXXXXX',
  goatCounterUrl: 'https://SEU-CODIGO.goatcounter.com/count'
}
```

- `googleAnalyticsId`: informe o Measurement ID do fluxo Web do Google Analytics 4. Deixe vazio para desativar.
- `goatCounterUrl`: informe a URL `.../count` da sua conta GoatCounter. Deixe vazio para desativar.
- Em `localhost`, `127.0.0.1` e `::1`, o script não envia acessos para evitar poluir as métricas durante desenvolvimento.
- Links com `data-track="cv-download"` enviam também o evento `cv_download` ao GA4, permitindo acompanhar downloads do currículo por idioma e página.

O restante dos links externos pode ser acompanhado pelo recurso de medição otimizada do GA4 quando ele estiver habilitado na propriedade.

## Estrutura essencial

```text
assets/
  css/
  docs/
  img/
  js/
    analytics.js
    data.js
    main.js
    pages-common.js
  languages/
index.html
library.html
resume.html
favicon.ico
```

Na personalização normal do template, não é necessário alterar `index.html`, `main.js` ou `main.css`.
