# Bruno Getten Triches — Portfólio Público

Projeto de portfólio pessoal desenvolvido com uma proposta simples e direta: servir como uma breve apresentação profissional sobre mim, reunir projetos de estudo e destacar um currículo resumido em um formato leve, visualmente agradável e fácil de manter.

A ideia deste repositório não é ser um sistema complexo, mas sim uma vitrine pública organizada para o GitHub, funcionando como um ponto central para apresentar minha atuação, minha base técnica e os tipos de projetos que desenvolvo ou pretendo publicar.

## Objetivo do projeto

Este portfólio foi criado para:

- apresentar de forma rápida quem eu sou e com o que trabalho;
- reunir informações profissionais em uma estrutura mais visual do que um currículo tradicional;
- reservar espaço para projetos de estudo, projetos públicos e experimentos técnicos;
- servir como base simples para publicação no GitHub Pages ou hospedagem estática;
- manter uma estrutura limpa o suficiente para futuras evoluções sem depender de frameworks pesados.

## Proposta da aplicação

O site foi pensado como um portfólio estático e enxuto, com foco em clareza, organização e boa apresentação visual. Ele concentra:

- uma introdução profissional;
- um resumo sobre minha experiência;
- uma seção de habilidades;
- uma vitrine de projetos;
- formas de contato;
- acesso ao currículo resumido.

Mesmo sendo um projeto simples, a intenção foi estruturar tudo de forma mais profissional para que o repositório também fique apresentável como peça pública no GitHub.

## Tecnologias utilizadas

### HTML
O HTML foi usado para montar toda a estrutura da página de forma semântica e organizada. A escolha por HTML puro foi proposital, porque este projeto não precisava de renderização complexa, roteamento, estado avançado ou qualquer estrutura que justificasse um framework frontend.

### CSS
O CSS centraliza toda a estilização da aplicação em um único arquivo principal. Isso facilita manutenção, leitura do projeto e futuras alterações visuais sem espalhar regras por vários lugares.

### JavaScript
O JavaScript foi mantido em uma abordagem simples, separado entre dados e comportamento. A ideia foi evitar dependências desnecessárias e deixar a lógica pequena, legível e direta para um projeto estático.

## Por que esse projeto foi feito sem framework

Como este é um portfólio simples, utilizar frameworks como React, Vue ou Angular aumentaria a complexidade sem trazer ganho real para a proposta atual do projeto.

A escolha por uma estrutura estática com HTML, CSS e JavaScript puro aconteceu por alguns motivos:

- menor complexidade de setup;
- manutenção mais simples;
- carregamento leve;
- facilidade para publicar em qualquer hospedagem estática;
- melhor leitura do código para quem visitar o repositório;
- liberdade para evoluir o projeto no futuro sem carregar dependências desnecessárias.

## Estrutura do projeto

A estrutura foi organizada para separar responsabilidades e deixar o repositório mais limpo:

```text
.
├── assets
│   ├── css
│   │   └── main.css
│   ├── docs
│   │   ├── curriculo-br-2026.pdf
│   │   └── curriculo-en-2026.pdf
│   ├── img
│   │   ├── about
│   │   ├── brand
│   │   ├── portfolio
│   │   └── service
│   ├── languages
│   │   ├── en.json
│   │   ├── es.json
│   │   └── pt-BR.json
│   └── js
│       ├── data.js
│       └── main.js
├── favicon.ico
└── index.html
## Galeria de imagens dos projetos

Cada card de projeto possui um visualizador próprio. A imagem configurada em `image` continua sendo a capa de marketing do card e entra automaticamente como a primeira imagem da galeria.

As imagens extras ficam centralizadas em `assets/js/data.js`, dentro de `projectGalleries`. Isso evita cadastrar os mesmos caminhos três vezes nos arquivos de idioma.

Exemplo:

```js
projectGalleries: {
  'assets/img/portfolio/truco_game.png': [
    'assets/img/portfolio/truco/menu.png',
    'assets/img/portfolio/truco/gameplay.png',
    'assets/img/portfolio/truco/multiplayer.png'
  ]
}
```

Depois de copiar os novos arquivos para a pasta desejada e adicionar seus caminhos nesse array, o site atualiza automaticamente:

- o card passa a indicar que existe uma galeria e a quantidade de imagens;
- a capa continua sendo a primeira imagem;
- o modal ganha navegação anterior/próxima;
- as miniaturas aparecem automaticamente;
- as setas do teclado (`←` e `→`) funcionam;
- no celular também é possível deslizar horizontalmente na imagem principal.

Não é necessário alterar `index.html`, `main.js` ou `main.css` para cada nova foto.

### Legenda personalizada e traduzida

Na maioria dos casos basta usar `projectGalleries`, deixando o modal gerar uma legenda padrão. Se uma imagem específica precisar de texto traduzido, o projeto correspondente no JSON do idioma também pode declarar um `gallery` opcional:

```json
{
  "title": "Exemplo de projeto",
  "image": "assets/img/portfolio/exemplo.png",
  "gallery": [
    {
      "src": "assets/img/portfolio/exemplo/detalhe.png",
      "alt": "Tela de detalhes do projeto",
      "caption": "Tela de detalhes com os principais indicadores."
    }
  ]
}
```

O visualizador remove caminhos duplicados automaticamente, então uma imagem já cadastrada no bloco compartilhado não será mostrada duas vezes.

### Projeto sem nenhuma imagem

A galeria também tolera projetos sem `image` e sem `gallery`. Nesse caso, o card mostra um estado visual neutro de **galeria em preparação**, sem exibir uma imagem quebrada ou um botão sem função.

Se um caminho cadastrado existir na configuração mas o arquivo estiver ausente, o modal mostra um estado de **imagem indisponível** e permite continuar navegando pelas outras imagens.
