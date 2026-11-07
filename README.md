# Portfólio de Bruno Getten Triches

Portfólio pessoal em HTML, CSS e JavaScript, publicado no [GitHub Pages](https://bmvbrun0.github.io/). A Home apresenta o perfil e os projetos. A Biblioteca reúne projetos e credenciais, a Carreira detalha a trajetória e Recomendações reúne as cartas.

## Rodar localmente

Clone o repositório ou baixe o ZIP. Abra a pasta no VS Code e sirva o `index.html` com a extensão **Live Server**. Pelo terminal, na raiz do repositório, use:

```sh
python3 -m http.server 5500
```

Com Python, abra [localhost:5500](http://localhost:5500/). Use um servidor local para que o navegador consiga carregar os arquivos de idioma.

## Personalizar

| O que editar | Onde |
| --- | --- |
| Nome, marca, cores, contatos, PDFs e recursos opcionais | `assets/js/data.js` |
| Textos, projetos, formação, certificados e cartas | `assets/languages/{pt-BR,en,es}.json` |
| Nomes, perfis e arquivos das cartas | `assets/js/recommendations-data.js` |
| Imagens e documentos | `assets/img/` e `assets/docs/` |
| Cabeçalho e apresentação da Home | `index.html` |
| Estrutura das outras páginas | `library.html`, `resume.html` e `recommendations.html` |

Use o mesmo `id` para cada projeto nos três idiomas. Ele identifica a rota e a configuração em `projectLinks`. Para mudar a capa, altere `image` e atualize a chave em `projectGalleries` se houver uma galeria configurada para aquela imagem. Mantenha o `id` para conservar os links já compartilhados. Links externos aceitam URLs HTTP ou HTTPS e podem ser desativados em `features.projectLinks` ou com `enabled: 0` por projeto.

Antes de publicar uma cópia, configure `siteUrl` em `assets/js/data.js` com o endereço completo do seu site, incluindo o nome do repositório se houver. Revise os metadados pessoais no HTML e troque os identificadores de analytics pelos seus ou deixe os campos vazios. O analytics fica desativado em prévias no localhost.

### Opções em `data.js`

Em `features`, mantenha as chaves e use `1` para ativar ou `0` para desativar.

| Flag | O que controla |
| --- | --- |
| `languageSwitcher` | Seletor de idioma no cabeçalho. |
| `hero`, `about`, `experience`, `services`, `projects`, `certificates`, `contact` | Visibilidade dos blocos correspondentes na Home. As rotas da Biblioteca e da Carreira continuam acessíveis. |
| `education`, `socialLinks`, `footer` | Formação na Home, redes na abertura e os itens de copyright e volta ao topo do rodapé da Home. |
| `projectsCarousel`, `certificatesCarousel` | Usam carrossel na Home. Com `0`, os itens aparecem em grade. Em `carousel`, ajuste `autoplay` e `intervalMs` para os dois carrosséis. |
| `projectLinks` | Links externos dos projetos na Home e nos detalhes. Na Carreira, também afeta a seleção de projetos em destaque. |
| `profileExplorer` | Painel com abas dentro de Sobre. Com o painel ativo, `impact` controla a lista de resultados e `recruiter` controla os atalhos para currículo e contato. |
| `experienceLab`, `themePlayground` | Botão LAB e controles de personalização visual dentro dele. Os efeitos abaixo têm configuração própria. |
| `interactiveCanvas`, `physicsShowcase` | Canvas 2D da abertura e animação 3D da marca. |
| `microInteractions`, `ambientDepth`, `spaceNetwork`, `particleField` | Efeitos de interação em cards e botões, profundidade nas seções, rede 3D e partículas da Home. |
| `workProfile` | Opção antiga. A seção que ela controlava saiu da Home. |

## Gerar e publicar

Após editar as páginas de origem, a configuração ou o catálogo de projetos, rode com Node.js:

```sh
node scripts/generate-pages.cjs
node --test
```

O script sincroniza o cabeçalho, os endereços de publicação, o sitemap e as páginas em `biblioteca/`, `carreira/`, `recomendacoes/` e `projetos/`. Edite os arquivos de origem e inclua as páginas geradas ao publicar. Se remover um projeto, remova também a pasta gerada da rota correspondente.

No GitHub Pages, selecione a branch e a pasta raiz como origem da publicação. O site publicado é estático e dispensa um servidor de aplicação.

O repositório contém conteúdo pessoal, incluindo currículos, imagens e cartas. Uma versão própria deve usar os seus arquivos e dados.
