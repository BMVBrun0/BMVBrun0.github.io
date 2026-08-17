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
- `features`: ativa ou desativa seções com `1` ou `0`;
- `carousel`: autoplay e intervalo dos carrosséis;
- `cvByLocale`: PDFs do currículo;
- `contactLinks` e `socialLinks`: links pessoais;
- `projectGalleries`: imagens extras dos projetos.

Os textos, projetos, certificados e traduções ficam em:

```text
assets/languages/pt-BR.json
assets/languages/en.json
assets/languages/es.json
```

Os arquivos de imagem e documentos ficam em `assets/img` e `assets/docs`. Depois de adicionar um asset, use o caminho relativo correspondente na configuração ou no arquivo de idioma.


### Convenção de imagens dos projetos

As capas de marketing ficam diretamente em `assets/img/portfolio` usando o slug do produto, por exemplo `media_forge.png` e `pocket_links.png`.

As imagens internas de galeria ficam em uma pasta com o mesmo slug e seguem numeração com dois dígitos:

```text
assets/img/portfolio/pocket_links/pocket_links_01.png
assets/img/portfolio/pocket_links/pocket_links_02.png
assets/img/portfolio/pocket_links/pocket_links_03.jpeg
```

A mesma regra vale para todos os projetos com galeria: `<slug>/<slug>_NN.ext`.

### Ativar ou ocultar blocos

Em `assets/js/data.js`, altere as flags de `features`:

```js
features: {
  about: 1,
  services: 1,
  projects: 1,
  certificates: 1,
  contact: 1,
  projectsCarousel: 0,
  certificatesCarousel: 0
}
```

`0` oculta/desativa. `1` exibe/ativa. Por exemplo, `contact: 0` remove a área de contato e seu acesso no menu; `socialLinks: 0` oculta os links sociais.

Com `projectsCarousel: 1` ou `certificatesCarousel: 1`, a grade correspondente vira um carrossel automático: 3 cards por vez no desktop, 2 em telas intermediárias e 1 no mobile.

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

## Analytics com GoatCounter

Para acompanhar o número de acessos ao portfólio, é possível usar o [GoatCounter](https://www.goatcounter.com/). Crie uma conta e informe o domínio usado pelo GitHub Pages, sem `https://` e sem a barra final:

```text
SEU-USUARIO.github.io
```

Depois de criar a conta, adicione o código de rastreamento antes do fechamento de `</body>` no arquivo `index.html`:

```html
<script
  data-goatcounter="https://SEU-CODIGO.goatcounter.com/count"
  async
  src="//gc.zgo.at/count.js">
</script>
```

Substitua `SEU-CODIGO` pelo nome escolhido ao criar a conta no GoatCounter. Por exemplo, para uma conta disponível em `meuportfolio.goatcounter.com`, use:

```html
<script
  data-goatcounter="https://meuportfolio.goatcounter.com/count"
  async
  src="//gc.zgo.at/count.js">
</script>
```

Depois de enviar a alteração para o GitHub, os novos acessos ao site começarão a aparecer no painel do GoatCounter.

O uso de analytics é opcional e não interfere no funcionamento do portfólio.


## Estrutura essencial

```text
assets/
  css/main.css
  docs/
  img/
  js/data.js
  js/main.js
  languages/
index.html
favicon.ico
```

Na personalização normal do template, não é necessário alterar `index.html`, `main.js` ou `main.css`.
