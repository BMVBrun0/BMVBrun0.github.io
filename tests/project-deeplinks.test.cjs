const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/project-deeplinks.js'), 'utf8');
const locales = ['pt-BR', 'en', 'es'];
const catalogs = locales.map((locale) => require(`../assets/languages/${locale}.json`).projects);
const configScope = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), configScope);
const config = configScope.window.portfolioConfig;

function load(href, baseURI = href) {
  const replacements = [];
  const notices = [];
  const location = { href, replace: (value) => replacements.push(value) };
  const document = {
    baseURI,
    createElement: () => ({ setAttribute() {} }),
    querySelector: () => ({ prepend: (notice) => notices.push(notice.textContent) })
  };
  const scope = { window: {}, location, document, URL };
  vm.runInNewContext(source, scope);
  return { links: scope.window.PortfolioProjectLinks, replacements, notices };
}

test('Project IDs agree across languages and keep the route when the cover changes', () => {
  const { links } = load('https://example.test/');
  const expected = catalogs[0].map(links.slugFor).sort();
  assert.ok(expected.every(Boolean));
  assert.equal(new Set(expected).size, expected.length);
  for (const catalog of catalogs) assert.deepEqual(catalog.map(links.slugFor).sort(), expected);
  assert.equal(links.slugFor({ id: 'setta_synk', image: 'new-cover.webp' }), 'settasynk');
  assert.equal(links.slugFor({ id: 'setta_synk' }), 'settasynk');
  assert.equal(links.slugFor({ image: 'setta_synk.webp' }), 'settasynk');
});

test('Old Home and Library links redirect to the physical project URL', () => {
  const { links: routes } = load('https://example.test/');
  const base = 'https://example.test/portfolio/';
  for (const page of ['index.html', 'library.html', 'biblioteca/']) {
    for (const project of catalogs[0].filter((item) => !item.hidden)) {
      const slug = routes.slugFor(project);
      const { links, replacements } = load(
        `${base}${page}?project=${slug}&lang=es#images`,
        base
      );
      assert.equal(links.redirectLegacy(catalogs[0], ''), true);
      assert.deepEqual(replacements, [`${base}projetos/${slug}/?lang=es#images`]);
    }
  }
});

test('Project access follows the global and per-project settings', () => {
  const { links } = load('https://example.test/');
  const project = { id: 'example', image: 'new-cover.webp' };
  const link = { enabled: 1, url: 'https://example.test/app' };
  const settings = { features: { projectLinks: 1 }, projectLinks: { example: link } };
  assert.equal(links.accessUrl(project, settings), link.url);
  settings.features.projectLinks = 0;
  assert.equal(links.accessUrl(project, settings), '');
  settings.features.projectLinks = 1;
  link.enabled = false;
  assert.equal(links.accessUrl(project, settings), '');
  link.enabled = 1;
  link.url = 'javascript:alert(1)';
  assert.equal(links.accessUrl(project, settings), '');
});

test('An unknown project leaves the visitor on the catalog with feedback', () => {
  const { links, notices, replacements } = load('https://bmvbrun0.github.io/library.html?project=missing');
  assert.equal(links.redirectLegacy(catalogs[0], 'Projeto indisponível'), false);
  assert.deepEqual(notices, ['Projeto indisponível']);
  assert.deepEqual(replacements, []);
});

test('The generated project pages contain indexable content and correct metadata', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts/generate-pages.cjs'), '--check']);
  const { links } = load(config.siteUrl);
  const base = new URL(config.siteUrl.replace(/\/?$/, '/'));
  for (const project of catalogs[0].filter((item) => !item.hidden)) {
    const route = links.projectPath(project);
    const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
    const cover = new URL(project.image || config.branding.socialPreview, base);
    assert.ok(html.includes('<h1>'));
    assert.ok(html.includes(`rel="canonical" href="${new URL(route, base)}"`));
    assert.ok(html.includes(`property="og:image" content="${cover}"`));
  }
});
