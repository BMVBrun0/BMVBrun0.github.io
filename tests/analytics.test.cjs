const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const code = readFileSync(path.join(__dirname, '../assets/js/analytics.js'), 'utf8');

function start(url) {
  const location = new URL(url);
  const window = { location, portfolioConfig: { analytics: { googleAnalyticsId: 'G-TEST' } } };
  const listeners = {};
  const document = {
    documentElement: { lang: 'es' },
    querySelector: () => null,
    createElement: () => ({ dataset: {} }),
    head: { appendChild() {} },
    addEventListener: (name, listener) => { listeners[name] = listener; }
  };
  vm.runInNewContext(code, { window, document, location, URL });
  return { window, listeners };
}

test('A project card sends its slug and does not attach the query string', () => {
  const { window, listeners } = start('https://bmvbrun0.github.io/biblioteca/?lang=es');
  listeners.click({
    target: { closest: () => ({ dataset: { track: 'select_content', contentId: 'settasynk' } }) }
  });
  const [command, event, params] = window.dataLayer.at(-1);
  assert.equal(command, 'event');
  assert.equal(event, 'select_content');
  assert.equal(params.content_type, 'project');
  assert.equal(params.content_id, 'settasynk');
  assert.equal(params.language, 'es');
  assert.equal(params.page_location, 'https://bmvbrun0.github.io/biblioteca/');
});

test('Local previews and legacy project redirects do not start analytics', () => {
  for (const url of ['http://127.0.0.1:8873/', 'https://bmvbrun0.github.io/library.html?project=settasynk']) {
    const { window } = start(url);
    assert.equal(window.dataLayer, undefined);
  }
});
