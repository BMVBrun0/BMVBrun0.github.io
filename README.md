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
│   └── js
│       ├── data.js
│       └── main.js
├── favicon.ico
└── index.html