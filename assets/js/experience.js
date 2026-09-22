(() => {
  'use strict';

  const config = window.portfolioConfig || {};
  const experienceConfig = config.experience || {};
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const STORAGE_KEY = 'portfolio-experience-v1';

  const runtime = {
    locale: config.defaultLocale || 'pt-BR',
    data: null,
    labOpen: false,
    canvas: null,
    canvasContext: null,
    particles: [],
    canvasFrame: 0,
    canvasSize: { width: 0, height: 0, dpr: 1 },
    pointer: { x: 0, y: 0, active: false },
    canvasEnabled: isFeatureEnabled('interactiveCanvas'),
    physicsEnabled: isFeatureEnabled('physicsShowcase'),
    microEnabled: isFeatureEnabled('microInteractions'),
    ambientEnabled: isFeatureEnabled('ambientDepth'),
    networkEnabled: isFeatureEnabled('spaceNetwork'),
    particleFieldEnabled: isFeatureEnabled('particleField'),
    motionStrength: clamp(Number(experienceConfig.motionStrength) || 0.75, 0, 1),
    cardRadius: clamp(Number(experienceConfig.cardRadius) || 24, 10, 42),
    physics: null
  };

  function isFeatureEnabled(name) {
    const value = config.features?.[name];
    return value !== 0 && value !== false;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function q(selector, context = document) {
    return context.querySelector(selector);
  }

  function qa(selector, context = document) {
    return [...context.querySelectorAll(selector)];
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function replacePlaceholders(template, values = {}) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function hexToRgbChannels(value) {
    const hex = String(value || '').trim().replace(/^#/, '');
    const normalized = hex.length === 3 ? hex.split('').map((char) => `${char}${char}`).join('') : hex;
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
    return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16)).join(', ');
  }

  function readCssVariable(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function setThemeColor(key, value) {
    const map = {
      background: ['--bg', '--bg-rgb'],
      backgroundSoft: ['--bg-soft'],
      backgroundEnd: ['--bg-end'],
      text: ['--text'],
      muted: ['--muted'],
      accent: ['--accent', '--accent-rgb'],
      accentSecondary: ['--accent-2', '--accent-2-rgb'],
      accentTertiary: ['--accent-3', '--accent-3-rgb']
    };
    const variables = map[key];
    if (!variables || !value) return;
    root.style.setProperty(variables[0], value);
    if (variables[1]) {
      const channels = hexToRgbChannels(value);
      if (channels) root.style.setProperty(variables[1], channels);
    }
    if (key === 'background') q('meta[name="theme-color"]')?.setAttribute('content', value);
  }

  function applyThemeColors(colors = {}) {
    Object.entries(colors).forEach(([key, value]) => setThemeColor(key, value));
    window.dispatchEvent(new CustomEvent('portfolio:experience-theme-change'));
  }

  function baseThemeColors() {
    return { ...(config.theme?.colors || {}) };
  }

  function getPresetById(id) {
    const presets = Array.isArray(experienceConfig.themePresets) ? experienceConfig.themePresets : [];
    return presets.find((preset) => preset?.id === id) || null;
  }

  function currentExperienceState() {
    return {
      colors: {
        background: readCssVariable('--bg'),
        backgroundSoft: readCssVariable('--bg-soft'),
        backgroundEnd: readCssVariable('--bg-end'),
        accent: readCssVariable('--accent'),
        accentSecondary: readCssVariable('--accent-2'),
        accentTertiary: readCssVariable('--accent-3')
      },
      radius: runtime.cardRadius,
      motion: runtime.motionStrength,
      canvasEnabled: runtime.canvasEnabled,
      physicsEnabled: runtime.physicsEnabled,
      microEnabled: runtime.microEnabled,
      ambientEnabled: runtime.ambientEnabled,
      networkEnabled: runtime.networkEnabled,
      particleFieldEnabled: runtime.particleFieldEnabled
    };
  }

  function persistState() {
    if (experienceConfig.persistPlayground === 0 || experienceConfig.persistPlayground === false) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentExperienceState()));
    } catch (_) {}
  }

  function restoreSavedState() {
    if (experienceConfig.persistPlayground === 0 || experienceConfig.persistPlayground === false) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const playgroundEnabled = isFeatureEnabled('themePlayground');
      const labEnabled = isFeatureEnabled('experienceLab');

      // User customizations must never keep changing the base template after
      // the corresponding public feature has been disabled in data.js.
      if (playgroundEnabled && saved?.colors && typeof saved.colors === 'object') applyThemeColors(saved.colors);
      if (playgroundEnabled && Number.isFinite(Number(saved?.radius))) runtime.cardRadius = clamp(saved.radius, 10, 42);
      if (playgroundEnabled && Number.isFinite(Number(saved?.motion))) runtime.motionStrength = clamp(saved.motion, 0, 1);
      if (labEnabled && isFeatureEnabled('interactiveCanvas') && typeof saved?.canvasEnabled === 'boolean') runtime.canvasEnabled = saved.canvasEnabled;
      if (labEnabled && isFeatureEnabled('physicsShowcase') && typeof saved?.physicsEnabled === 'boolean') runtime.physicsEnabled = saved.physicsEnabled;
      if (labEnabled && isFeatureEnabled('microInteractions') && typeof saved?.microEnabled === 'boolean') runtime.microEnabled = saved.microEnabled;
      if (labEnabled && isFeatureEnabled('ambientDepth') && typeof saved?.ambientEnabled === 'boolean') runtime.ambientEnabled = saved.ambientEnabled;
      if (labEnabled && isFeatureEnabled('spaceNetwork') && typeof saved?.networkEnabled === 'boolean') runtime.networkEnabled = saved.networkEnabled;
      if (labEnabled && isFeatureEnabled('particleField') && typeof saved?.particleFieldEnabled === 'boolean') runtime.particleFieldEnabled = saved.particleFieldEnabled;
    } catch (_) {}
  }

  function syncRuntimeCss() {
    root.style.setProperty('--experience-card-radius', `${runtime.cardRadius}px`);
    root.style.setProperty('--experience-motion', String(runtime.motionStrength));
    root.classList.toggle('experience-theme-playground', isFeatureEnabled('themePlayground'));
    root.classList.toggle('experience-canvas-disabled', !runtime.canvasEnabled);
    root.classList.toggle('experience-physics-disabled', !runtime.physicsEnabled);
    root.classList.toggle('experience-micro-disabled', !runtime.microEnabled);
    root.classList.toggle('experience-ambient-disabled', !runtime.ambientEnabled);
    root.classList.toggle('experience-network-disabled', !runtime.networkEnabled);
    root.classList.toggle('experience-particle-field-disabled', !runtime.particleFieldEnabled);
    syncCanvasAnimation();
    syncPhysicsAnimation();
    syncSpaceNetworkAnimation();
    syncParticleFieldAnimation();
  }

  function resetPlayground() {
    applyThemeColors(baseThemeColors());
    runtime.cardRadius = clamp(Number(experienceConfig.cardRadius) || 24, 10, 42);
    runtime.motionStrength = clamp(Number(experienceConfig.motionStrength) || 0.75, 0, 1);
    runtime.canvasEnabled = isFeatureEnabled('interactiveCanvas');
    runtime.physicsEnabled = isFeatureEnabled('physicsShowcase');
    runtime.microEnabled = isFeatureEnabled('microInteractions');
    runtime.ambientEnabled = isFeatureEnabled('ambientDepth');
    runtime.networkEnabled = isFeatureEnabled('spaceNetwork');
    runtime.particleFieldEnabled = isFeatureEnabled('particleField');
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    syncRuntimeCss();
    syncLabControls();
  }

  function presetLabel(id) {
    const lab = runtime.data?.experienceLab || {};
    const key = `preset${id.charAt(0).toUpperCase()}${id.slice(1)}`;
    return lab[key] || id;
  }

  function renderLab() {
    if (!isFeatureEnabled('experienceLab')) return;

    const position = experienceConfig.dockPosition === 'right' ? 'right' : 'left';
    const shell = document.createElement('div');
    shell.className = `experience-shell experience-shell--${position}`;
    shell.id = 'experience-shell';
    shell.innerHTML = `
      <button class="experience-launcher" id="experience-launcher" type="button" aria-expanded="false" aria-controls="experience-panel">
        <span class="experience-launcher__spark" aria-hidden="true">✦</span>
        <span class="experience-launcher__label" id="experience-launcher-label">LAB</span>
      </button>
      <div class="experience-backdrop" id="experience-backdrop" hidden></div>
      <aside class="experience-panel" id="experience-panel" aria-hidden="true" aria-labelledby="experience-title">
        <header class="experience-panel__header">
          <div>
            <span class="experience-panel__eyebrow" id="experience-panel-eyebrow">INTERATIVO</span>
            <h2 id="experience-title">Laboratório de experiência</h2>
            <p id="experience-subtitle"></p>
          </div>
          <button class="experience-icon-button" id="experience-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="experience-panel__body" id="experience-body"></div>
      </aside>`;
    document.body.appendChild(shell);

    q('#experience-launcher', shell)?.addEventListener('click', () => setLabOpen(!runtime.labOpen));
    q('#experience-close', shell)?.addEventListener('click', () => setLabOpen(false));
    q('#experience-backdrop', shell)?.addEventListener('click', () => setLabOpen(false));
    renderLabBody();
  }

  function renderLabBody() {
    const body = q('#experience-body');
    if (!body || !runtime.data) return;
    const text = runtime.data.experienceLab || {};
    const sections = [];

    if (isFeatureEnabled('themePlayground')) {
      const presets = (Array.isArray(experienceConfig.themePresets) ? experienceConfig.themePresets : [])
        .map((preset) => `
          <button class="experience-preset" type="button" data-experience-preset="${escapeHtml(preset.id)}">
            <span class="experience-preset__swatches" aria-hidden="true">
              <i style="--preset-color:${escapeHtml(preset.colors?.accent || '#fff')}"></i>
              <i style="--preset-color:${escapeHtml(preset.colors?.accentSecondary || '#999')}"></i>
              <i style="--preset-color:${escapeHtml(preset.colors?.accentTertiary || '#ccc')}"></i>
            </span>
            <span>${escapeHtml(presetLabel(preset.id))}</span>
          </button>`).join('');

      sections.push(`
        <section class="experience-card">
          <div class="experience-card__heading">
            <span class="experience-card__icon" aria-hidden="true">◈</span>
            <div><h3>${escapeHtml(text.appearanceTitle)}</h3><p>${escapeHtml(text.appearanceText)}</p></div>
          </div>
          ${presets ? `<div class="experience-control"><span class="experience-control__label">${escapeHtml(text.presetsLabel)}</span><div class="experience-presets">${presets}</div></div>` : ''}
          <div class="experience-control-grid">
            <label class="experience-control experience-control--color">
              <span class="experience-control__label">${escapeHtml(text.accentLabel)}</span>
              <span class="experience-color-input"><input id="experience-accent" type="color"><span data-color-value="accent"></span></span>
            </label>
            <label class="experience-control experience-control--color">
              <span class="experience-control__label">${escapeHtml(text.accentSecondaryLabel)}</span>
              <span class="experience-color-input"><input id="experience-accent-2" type="color"><span data-color-value="accentSecondary"></span></span>
            </label>
          </div>
          <label class="experience-control">
            <span class="experience-control__row"><span class="experience-control__label">${escapeHtml(text.radiusLabel)}</span><output id="experience-radius-output"></output></span>
            <input id="experience-radius" class="experience-range" type="range" min="12" max="36" step="1">
          </label>
          <label class="experience-control">
            <span class="experience-control__row"><span class="experience-control__label">${escapeHtml(text.motionLabel)}</span><output id="experience-motion-output"></output></span>
            <input id="experience-motion" class="experience-range" type="range" min="0" max="100" step="5">
          </label>
          <div class="experience-actions">
            <button class="experience-action" id="experience-reset" type="button">${escapeHtml(text.resetButton)}</button>
            <button class="experience-action experience-action--primary" id="experience-copy" type="button">${escapeHtml(text.copyButton)}</button>
          </div>
        </section>`);
    }

    if (isFeatureEnabled('interactiveCanvas') || isFeatureEnabled('physicsShowcase') || isFeatureEnabled('microInteractions') || isFeatureEnabled('ambientDepth') || isFeatureEnabled('spaceNetwork') || isFeatureEnabled('particleField')) {
      sections.push(`
        <section class="experience-card">
          <div class="experience-card__heading">
            <span class="experience-card__icon" aria-hidden="true">⌁</span>
            <div><h3>${escapeHtml(text.effectsTitle)}</h3><p>${escapeHtml(text.effectsText)}</p></div>
          </div>
          <div class="experience-switch-list">
            ${isFeatureEnabled('physicsShowcase') ? renderSwitch('experience-physics-toggle', text.physicsToggle, runtime.physicsEnabled) : ''}
            ${isFeatureEnabled('interactiveCanvas') ? renderSwitch('experience-canvas-toggle', text.canvasToggle, runtime.canvasEnabled) : ''}
            ${isFeatureEnabled('microInteractions') ? renderSwitch('experience-micro-toggle', text.microToggle, runtime.microEnabled) : ''}
            ${isFeatureEnabled('ambientDepth') ? renderSwitch('experience-ambient-toggle', text.ambientToggle, runtime.ambientEnabled) : ''}
            ${isFeatureEnabled('spaceNetwork') ? renderSwitch('experience-network-toggle', text.networkToggle || '3D network', runtime.networkEnabled) : ''}
            ${isFeatureEnabled('particleField') ? renderSwitch('experience-particle-field-toggle', text.particleFieldToggle || 'Interactive particles', runtime.particleFieldEnabled) : ''}
          </div>
          ${reducedMotionQuery.matches ? `<p class="experience-note">${escapeHtml(text.reducedMotionNote)}</p>` : ''}
        </section>`);
    }


    body.innerHTML = sections.join('');
    bindLabControls();
    syncLabControls();
  }

  function renderSwitch(id, label, checked) {
    return `
      <label class="experience-switch">
        <span>${escapeHtml(label)}</span>
        <input id="${id}" type="checkbox" ${checked ? 'checked' : ''}>
        <span class="experience-switch__track" aria-hidden="true"><i></i></span>
      </label>`;
  }

  function bindLabControls() {
    qa('[data-experience-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        const preset = getPresetById(button.dataset.experiencePreset);
        if (!preset?.colors) return;
        applyThemeColors(preset.colors);
        persistState();
        syncLabControls();
      });
    });

    q('#experience-accent')?.addEventListener('input', (event) => {
      setThemeColor('accent', event.target.value);
      persistState();
      syncLabControls(false);
    });
    q('#experience-accent-2')?.addEventListener('input', (event) => {
      setThemeColor('accentSecondary', event.target.value);
      persistState();
      syncLabControls(false);
    });
    q('#experience-radius')?.addEventListener('input', (event) => {
      runtime.cardRadius = clamp(event.target.value, 12, 36);
      syncRuntimeCss();
      persistState();
      syncLabControls(false);
    });
    q('#experience-motion')?.addEventListener('input', (event) => {
      runtime.motionStrength = clamp(Number(event.target.value) / 100, 0, 1);
      syncRuntimeCss();
      persistState();
      syncLabControls(false);
    });
    q('#experience-physics-toggle')?.addEventListener('change', (event) => {
      runtime.physicsEnabled = Boolean(event.target.checked) && isFeatureEnabled('physicsShowcase');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-canvas-toggle')?.addEventListener('change', (event) => {
      runtime.canvasEnabled = Boolean(event.target.checked) && isFeatureEnabled('interactiveCanvas');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-micro-toggle')?.addEventListener('change', (event) => {
      runtime.microEnabled = Boolean(event.target.checked) && isFeatureEnabled('microInteractions');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-ambient-toggle')?.addEventListener('change', (event) => {
      runtime.ambientEnabled = Boolean(event.target.checked) && isFeatureEnabled('ambientDepth');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-network-toggle')?.addEventListener('change', (event) => {
      runtime.networkEnabled = Boolean(event.target.checked) && isFeatureEnabled('spaceNetwork');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-particle-field-toggle')?.addEventListener('change', (event) => {
      runtime.particleFieldEnabled = Boolean(event.target.checked) && isFeatureEnabled('particleField');
      syncRuntimeCss();
      persistState();
    });
    q('#experience-reset')?.addEventListener('click', resetPlayground);
    q('#experience-copy')?.addEventListener('click', copyCurrentConfiguration);
  }

  function syncLabControls(updateInputs = true) {
    const accent = readCssVariable('--accent');
    const accent2 = readCssVariable('--accent-2');
    const radius = Math.round(runtime.cardRadius);
    const motion = Math.round(runtime.motionStrength * 100);

    if (updateInputs) {
      const accentInput = q('#experience-accent');
      const accent2Input = q('#experience-accent-2');
      if (accentInput && /^#[0-9a-f]{6}$/i.test(accent)) accentInput.value = accent;
      if (accent2Input && /^#[0-9a-f]{6}$/i.test(accent2)) accent2Input.value = accent2;
      const radiusInput = q('#experience-radius');
      const motionInput = q('#experience-motion');
      if (radiusInput) radiusInput.value = String(radius);
      if (motionInput) motionInput.value = String(motion);
      const physicsToggle = q('#experience-physics-toggle');
      const canvasToggle = q('#experience-canvas-toggle');
      const microToggle = q('#experience-micro-toggle');
      const ambientToggle = q('#experience-ambient-toggle');
      const networkToggle = q('#experience-network-toggle');
      const particleFieldToggle = q('#experience-particle-field-toggle');
      if (physicsToggle) physicsToggle.checked = runtime.physicsEnabled;
      if (canvasToggle) canvasToggle.checked = runtime.canvasEnabled;
      if (microToggle) microToggle.checked = runtime.microEnabled;
      if (ambientToggle) ambientToggle.checked = runtime.ambientEnabled;
      if (networkToggle) networkToggle.checked = runtime.networkEnabled;
      if (particleFieldToggle) particleFieldToggle.checked = runtime.particleFieldEnabled;
    }

    const accentValue = q('[data-color-value="accent"]');
    const accent2Value = q('[data-color-value="accentSecondary"]');
    if (accentValue) accentValue.textContent = accent.toUpperCase();
    if (accent2Value) accent2Value.textContent = accent2.toUpperCase();
    const radiusOutput = q('#experience-radius-output');
    const motionOutput = q('#experience-motion-output');
    if (radiusOutput) radiusOutput.textContent = `${radius}px`;
    if (motionOutput) motionOutput.textContent = `${motion}%`;
  }

  async function copyCurrentConfiguration() {
    const button = q('#experience-copy');
    if (!button || !runtime.data) return;
    const text = runtime.data.experienceLab || {};
    const state = currentExperienceState();
    const colors = state.colors || {};
    const snippet = `theme: {\n  colors: {\n    background: '${colors.background}',\n    backgroundSoft: '${colors.backgroundSoft}',\n    backgroundEnd: '${colors.backgroundEnd}',\n    accent: '${colors.accent}',\n    accentSecondary: '${colors.accentSecondary}',\n    accentTertiary: '${colors.accentTertiary}'\n  }\n},\nexperience: {\n  cardRadius: ${Math.round(state.radius)},\n  motionStrength: ${state.motion.toFixed(2)}\n}`;
    try {
      await navigator.clipboard.writeText(snippet);
      button.textContent = text.copiedButton || 'Copied';
      window.setTimeout(() => { button.textContent = text.copyButton || 'Copy configuration'; }, 1500);
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = snippet;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (_) {}
      textarea.remove();
      button.textContent = text.copiedButton || 'Copied';
      window.setTimeout(() => { button.textContent = text.copyButton || 'Copy configuration'; }, 1500);
    }
  }

  function setLabOpen(open) {
    const panel = q('#experience-panel');
    const launcher = q('#experience-launcher');
    const backdrop = q('#experience-backdrop');
    if (!panel || !launcher || !backdrop) return;
    runtime.labOpen = Boolean(open);
    panel.classList.toggle('is-open', runtime.labOpen);
    panel.setAttribute('aria-hidden', String(!runtime.labOpen));
    launcher.setAttribute('aria-expanded', String(runtime.labOpen));
    backdrop.hidden = !runtime.labOpen;
    document.body.classList.toggle('experience-lab-open', runtime.labOpen);
    if (runtime.labOpen) q('#experience-close')?.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  }

  function updateLabLanguage() {
    const text = runtime.data?.experienceLab;
    if (!text) return;
    const launcher = q('#experience-launcher');
    const launcherLabel = q('#experience-launcher-label');
    const eyebrow = q('#experience-panel-eyebrow');
    const title = q('#experience-title');
    const subtitle = q('#experience-subtitle');
    const close = q('#experience-close');
    const fallback = locale === 'en'
      ? { open: 'Open experience lab', eyebrow: 'INTERACTIVE', title: 'Experience Lab' }
      : locale === 'es'
        ? { open: 'Abrir laboratorio de experiencia', eyebrow: 'INTERACTIVO', title: 'Laboratorio de experiencia' }
        : { open: 'Abrir laboratório de experiência', eyebrow: 'INTERATIVO', title: 'Laboratório de experiência' };
    if (launcher) launcher.setAttribute('aria-label', text.openLabel || fallback.open);
    if (eyebrow) eyebrow.textContent = text.eyebrow || fallback.eyebrow;
    if (launcherLabel) launcherLabel.textContent = text.buttonLabel || 'LAB';
    if (title) title.textContent = text.title || fallback.title;
    if (subtitle) subtitle.textContent = text.subtitle || '';
    if (close) close.setAttribute('aria-label', text.closeLabel || 'Close');
    renderLabBody();
  }

  // ---------------------------------------------------------------------------
  // Interactive hero canvas
  // ---------------------------------------------------------------------------

  function initCanvas() {
    if (!isFeatureEnabled('interactiveCanvas')) return;
    const hero = q('.hero-section');
    if (!hero) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'experience-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    runtime.canvas = canvas;
    runtime.canvasContext = canvas.getContext('2d', { alpha: true });

    const resize = () => resizeCanvas(hero);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize, { passive: true });

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      runtime.pointer.x = event.clientX - rect.left;
      runtime.pointer.y = event.clientY - rect.top;
      runtime.pointer.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { runtime.pointer.active = false; }, { passive: true });
    hero.addEventListener('pointercancel', () => { runtime.pointer.active = false; }, { passive: true });

    resize();
    syncCanvasAnimation();
  }

  function resizeCanvas(hero) {
    if (!runtime.canvas || !runtime.canvasContext) return;
    const rect = hero.getBoundingClientRect();
    const maxDpr = Math.max(1, Number(experienceConfig.canvas?.maxDevicePixelRatio) || 1.5);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    runtime.canvas.width = Math.round(width * dpr);
    runtime.canvas.height = Math.round(height * dpr);
    runtime.canvas.style.width = `${width}px`;
    runtime.canvas.style.height = `${height}px`;
    runtime.canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    runtime.canvasSize = { width, height, dpr };
    createParticles();
    if (reducedMotionQuery.matches || !runtime.canvasEnabled) drawCanvasFrame(true);
  }

  function createParticles() {
    const { width, height } = runtime.canvasSize;
    const isMobile = width <= 760;
    const desired = isMobile
      ? Number(experienceConfig.canvas?.particlesMobile) || 26
      : Number(experienceConfig.canvas?.particlesDesktop) || 46;
    const densityCap = Math.max(14, Math.round((width * height) / 22000));
    const count = Math.min(desired, densityCap);
    runtime.particles = Array.from({ length: count }, (_, index) => {
      const angle = ((index * 137.508) % 360) * Math.PI / 180;
      const spread = 0.14 + ((index * 17) % 71) / 100;
      return {
        x: ((index * 73) % 101) / 101 * width,
        y: ((index * 47) % 97) / 97 * height,
        vx: Math.cos(angle) * spread,
        vy: Math.sin(angle) * spread,
        radius: 0.8 + ((index * 11) % 17) / 10
      };
    });
  }

  function syncCanvasAnimation() {
    if (!runtime.canvas) return;
    const shouldAnimate = runtime.canvasEnabled && !reducedMotionQuery.matches && !document.hidden;
    runtime.canvas.classList.toggle('is-paused', !runtime.canvasEnabled);
    if (shouldAnimate && !runtime.canvasFrame) runtime.canvasFrame = requestAnimationFrame(drawCanvasFrame);
    if (!shouldAnimate && runtime.canvasFrame) {
      cancelAnimationFrame(runtime.canvasFrame);
      runtime.canvasFrame = 0;
      drawCanvasFrame(true);
    }
  }

  function parseRgbVariable(name, fallback) {
    const raw = readCssVariable(name);
    const parts = raw.split(',').map((item) => Number(item.trim())).filter(Number.isFinite);
    return parts.length === 3 ? parts : fallback;
  }

  function drawCanvasFrame(staticOnly = false) {
    const ctx = runtime.canvasContext;
    const { width, height } = runtime.canvasSize;
    if (!ctx || !width || !height) {
      runtime.canvasFrame = 0;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    if (!runtime.canvasEnabled) {
      runtime.canvasFrame = 0;
      return;
    }

    const accent = parseRgbVariable('--accent-rgb', [255, 58, 200]);
    const accent2 = parseRgbVariable('--accent-2-rgb', [107, 68, 255]);
    const accent3 = parseRgbVariable('--accent-3-rgb', [92, 209, 255]);
    const connectionDistance = Math.max(80, Number(experienceConfig.canvas?.connectionDistance) || 145);
    const pointerRadius = Math.max(80, Number(experienceConfig.canvas?.pointerRadius) || 180);
    const speed = (Number(experienceConfig.canvas?.speed) || 0.22) * runtime.motionStrength;
    const particles = runtime.particles;

    if (!staticOnly) {
      particles.forEach((particle) => {
        particle.x += particle.vx * speed;
        particle.y += particle.vy * speed;
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        if (runtime.pointer.active) {
          const dx = particle.x - runtime.pointer.x;
          const dy = particle.y - runtime.pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < pointerRadius) {
            const force = (1 - distance / pointerRadius) * 0.45 * runtime.motionStrength;
            particle.x += (dx / distance) * force;
            particle.y += (dy / distance) * force;
          }
        }
      });
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > connectionDistance) continue;
        const alpha = (1 - distance / connectionDistance) * 0.12;
        ctx.strokeStyle = `rgba(${accent2.join(',')},${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    particles.forEach((particle, index) => {
      const color = index % 3 === 0 ? accent : index % 3 === 1 ? accent2 : accent3;
      ctx.fillStyle = `rgba(${color.join(',')},${0.32 + (index % 4) * 0.08})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (runtime.pointer.active && !staticOnly) {
      const gradient = ctx.createRadialGradient(runtime.pointer.x, runtime.pointer.y, 0, runtime.pointer.x, runtime.pointer.y, pointerRadius * 0.75);
      gradient.addColorStop(0, `rgba(${accent3.join(',')},0.10)`);
      gradient.addColorStop(1, `rgba(${accent3.join(',')},0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(runtime.pointer.x, runtime.pointer.y, pointerRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!staticOnly && runtime.canvasEnabled && !reducedMotionQuery.matches && !document.hidden) {
      runtime.canvasFrame = requestAnimationFrame(drawCanvasFrame);
    } else {
      runtime.canvasFrame = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Three.js physics showcase: logo-driven particle brand in the hero panel
  // ---------------------------------------------------------------------------

  async function initPhysicsShowcase() {
    if (!isFeatureEnabled('physicsShowcase')) return;
    const hero = q('.hero-section');
    const panel = q('.hero-panel');
    const logo = q('.hero-panel-logo');
    if (!hero || !panel || !logo) return;

    const cfg = experienceConfig.physicsShowcase || {};
    const displayMode = cfg.displayMode || 'replace';

    let brand = logo.closest('.hero-panel-brand');
    if (!brand) {
      brand = document.createElement('div');
      brand.className = 'hero-panel-brand';
      logo.parentNode?.insertBefore(brand, logo);
      brand.appendChild(logo);
    }
    brand.classList.toggle('hero-panel-brand--replace', displayMode === 'replace');
    brand.classList.toggle('hero-panel-brand--blend', displayMode === 'blend');
    brand.classList.toggle('hero-panel-brand--static', displayMode === 'static');

    const stage = document.createElement('div');
    stage.className = 'experience-physics-stage experience-physics-stage--panel';
    stage.setAttribute('aria-hidden', 'true');
    brand.appendChild(stage);
    panel.classList.add('has-particle-brand');

    const moduleUrl = cfg.moduleUrl || 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';
    try {
      const THREE = await import(moduleUrl);
      await setupPhysicsScene(THREE, hero, panel, brand, stage, logo);
    } catch (error) {
      stage.classList.add('is-unavailable');
      console.warn('[portfolio] Three.js showcase unavailable; portfolio content remains fully functional.', error);
    }
  }

  async function setupPhysicsScene(THREE, hero, panel, brand, stage, logo) {
    if (!stage.isConnected) return;
    const cfg = experienceConfig.physicsShowcase || {};
    const displayMode = cfg.displayMode || 'replace';
    const isMobile = window.matchMedia('(max-width: 760px)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.6);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.max(1, Number(cfg.maxDevicePixelRatio) || 1.5)));
    stage.appendChild(renderer.domElement);

    const logoUrl = (cfg.logoTexture && String(cfg.logoTexture).trim()) || config.branding?.logo || logo?.getAttribute('src') || 'assets/img/brand/logo-bm-white.webp';
    const source = await new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = logoUrl;
    });
    const alphaThreshold = clamp(Number(cfg.alphaThreshold) || 40, 1, 250);
    let cropX = 0, cropY = 0, cropW = source.naturalWidth, cropH = source.naturalHeight;

    // Most white-label logos include transparent export padding. Sampling the
    // entire PNG wastes particle density and makes the visible mark look tiny.
    // Detect the actual alpha bounds first, then sample only the visible artwork.
    if (cfg.cropTransparentPadding !== 0) {
      const probeWidth = Math.max(96, Math.min(640, source.naturalWidth));
      const probeHeight = Math.max(64, Math.round(probeWidth * source.naturalHeight / Math.max(1, source.naturalWidth)));
      const probeCanvas = document.createElement('canvas');
      probeCanvas.width = probeWidth; probeCanvas.height = probeHeight;
      const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true });
      probeCtx.clearRect(0, 0, probeWidth, probeHeight);
      probeCtx.drawImage(source, 0, 0, probeWidth, probeHeight);
      const probePixels = probeCtx.getImageData(0, 0, probeWidth, probeHeight).data;
      let minX = probeWidth, minY = probeHeight, maxX = -1, maxY = -1;
      for (let y = 0; y < probeHeight; y += 1) {
        for (let x = 0; x < probeWidth; x += 1) {
          if (probePixels[(y * probeWidth + x) * 4 + 3] <= alphaThreshold) continue;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX >= minX && maxY >= minY) {
        const visibleW = maxX - minX + 1, visibleH = maxY - minY + 1;
        const padX = Math.max(2, Math.round(visibleW * 0.055));
        const padY = Math.max(2, Math.round(visibleH * 0.08));
        minX = Math.max(0, minX - padX); maxX = Math.min(probeWidth - 1, maxX + padX);
        minY = Math.max(0, minY - padY); maxY = Math.min(probeHeight - 1, maxY + padY);
        const scaleX = source.naturalWidth / probeWidth, scaleY = source.naturalHeight / probeHeight;
        cropX = Math.floor(minX * scaleX); cropY = Math.floor(minY * scaleY);
        cropW = Math.max(1, Math.ceil((maxX - minX + 1) * scaleX));
        cropH = Math.max(1, Math.ceil((maxY - minY + 1) * scaleY));
      }
    }

    const sourceAspect = Math.max(0.2, cropW / Math.max(1, cropH));
    const sampleWidth = Math.round(clamp(Number(cfg.sampleResolution) || 760, 240, 1100));
    const sampleHeight = Math.max(96, Math.round(sampleWidth / sourceAspect));
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleWidth; sampleCanvas.height = sampleHeight;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, sampleWidth, sampleHeight);
    ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, sampleWidth, sampleHeight);
    const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const candidates = [];
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const offset = (y * sampleWidth + x) * 4;
        const alpha = pixels[offset + 3];
        if (alpha > alphaThreshold) candidates.push([x, y, alpha, pixels[offset], pixels[offset + 1], pixels[offset + 2]]);
      }
    }
    if (!candidates.length) throw new Error('Logo texture has no visible pixels.');

    const group = new THREE.Group();
    scene.add(group);
    const requestedCount = isMobile ? Number(cfg.particlesMobile) || 6800 : Number(cfg.particlesDesktop) || 10800;
    const count = Math.max(420, Math.min(12000, Math.round(requestedCount)));
    const dustCount = Math.max(60, isMobile ? Number(cfg.dustMobile) || 150 : Number(cfg.dustDesktop) || 320);
    const logoWidth = Math.max(3.4, Number(cfg.logoWidth) || 5.65);
    const logoHeight = logoWidth * (sampleHeight / sampleWidth);
    const logoDepth = Math.max(0.12, Number(cfg.logoDepth) || 0.44);
    const depthLayers = Math.max(3, Math.min(18, Number(cfg.depthLayers) || 7));
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sourceColors = new Float32Array(count * 3);
    const pointScales = new Float32Array(count);

    const candidateStep = candidates.length / count;
    for (let i = 0; i < count; i += 1) {
      const pickIndex = Math.min(candidates.length - 1, Math.floor(i * candidateStep + (((i * 37) % 17) / 17) * Math.max(1, candidateStep - 1)));
      const [px, py, alpha, sourceR, sourceG, sourceB] = candidates[pickIndex];
      const layerIndex = i % depthLayers;
      const tx = (px / (sampleWidth - 1) - 0.5) * logoWidth;
      const ty = -((py / (sampleHeight - 1)) - 0.5) * logoHeight;
      const tz = ((layerIndex / Math.max(1, depthLayers - 1)) - 0.5) * logoDepth + ((alpha / 255) - 0.5) * 0.05;
      const j = i * 3;
      targets[j] = tx;
      targets[j + 1] = ty;
      targets[j + 2] = tz;
      const depthShade = 0.78 + (layerIndex / Math.max(1, depthLayers - 1)) * 0.22;
      const colorBoost = Math.max(0.5, Number(cfg.colorBoost) || 1.48);
      sourceColors[j] = Math.min(1, (sourceR / 255) * depthShade * colorBoost);
      sourceColors[j + 1] = Math.min(1, (sourceG / 255) * depthShade * colorBoost);
      sourceColors[j + 2] = Math.min(1, (sourceB / 255) * depthShade * colorBoost);
      // Pixels parcialmente transparentes (bordas antialias) ficam um pouco menores,
      // preservando o contorno da marca em vez de engrossá-lo.
      pointScales[i] = 0.68 + (alpha / 255) * 0.32;
      const configuredScatter = Math.max(0, Number(cfg.initialScatter) || 0.065);
      const scatter = reducedMotionQuery.matches ? 0 : configuredScatter * (0.45 + ((i * 19) % 23) / 23 * 0.55);
      positions[j] = tx + Math.sin(i * 2.17) * scatter;
      positions[j + 1] = ty + Math.cos(i * 1.31) * scatter * 0.72;
      positions[j + 2] = tz + Math.sin(i * 0.83) * scatter * 1.15;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('particleScale', new THREE.BufferAttribute(pointScales, 1));
    // A marca é formada pelos próprios pontos. O padrão agora é um micro-pixel
    // nítido; 'atom' mantém um disco circular pequeno, ambos sem halo de algodão.
    const pointSize = isMobile ? (Number(cfg.pointSizeMobile) || 0.022) : (Number(cfg.pointSizeDesktop) || 0.019);
    const particleShape = String(cfg.particleShape || 'pixel').toLowerCase();
    const fragmentShader = particleShape === 'atom' ? `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          vec2 p = gl_PointCoord - vec2(0.5);
          float d = length(p);
          if (d > 0.46) discard;
          float edge = 1.0 - smoothstep(0.41, 0.46, d);
          float nucleus = 1.0 - smoothstep(0.0, 0.16, d);
          gl_FragColor = vec4(vColor * (1.02 + nucleus * 0.16), edge * uOpacity);
        }
      ` : `
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          // Quadrado/pixel com borda mínima de antialiasing: propositalmente
          // sem glow largo, para cada ponto continuar parecendo uma partícula.
          vec2 uv = gl_PointCoord;
          float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          float edge = smoothstep(0.015, 0.10, edgeDistance);
          float center = 1.0 - length(uv - vec2(0.5)) * 0.20;
          gl_FragColor = vec4(vColor * clamp(center, 0.96, 1.06), edge * uOpacity);
        }
      `;
    const pointsMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      vertexColors: true,
      blending: String(cfg.blendMode || 'normal').toLowerCase() === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uSize: { value: pointSize * Math.min(window.devicePixelRatio || 1, 1.8) * 105 },
        uOpacity: { value: clamp(Number(cfg.particleOpacity) || 0.96, 0.2, 1) }
      },
      vertexShader: `
        uniform float uSize;
        attribute float particleScale;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float perspective = clamp(5.8 / max(1.0, -mvPosition.z), 0.82, 1.22);
          gl_PointSize = max(1.15, uSize * perspective * particleScale);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader
    });
    group.add(new THREE.Points(geometry, pointsMaterial));

    const logoTexture = new THREE.CanvasTexture(sampleCanvas);
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    // A crisp source layer keeps the brand readable while the surrounding
    // particles provide the motion/depth. This is configurable and can be set
    // to zero by template users who want a pure particle-only mark.
    const coreOpacity = clamp(isMobile ? Number(cfg.coreOpacityMobile) || 0 : Number(cfg.coreOpacityDesktop) || 0, 0, 1);
    if (coreOpacity > 0) {
      const core = new THREE.Mesh(new THREE.PlaneGeometry(logoWidth, logoHeight), new THREE.MeshBasicMaterial({
        map: logoTexture, transparent: true, opacity: coreOpacity, depthWrite: false,
        blending: THREE.NormalBlending, side: THREE.DoubleSide
      }));
      core.position.z = -logoDepth * 0.18;
      group.add(core);
    }

    const ghostOpacityValue = isMobile ? Number(cfg.ghostOpacityMobile) : Number(cfg.ghostOpacityDesktop);
    const ghostOpacity = clamp(Number.isFinite(ghostOpacityValue) ? ghostOpacityValue : (isMobile ? 0.016 : 0.018), 0, 0.5);
    if (ghostOpacity > 0) {
      const ghost = new THREE.Mesh(new THREE.PlaneGeometry(logoWidth, logoHeight), new THREE.MeshBasicMaterial({
        map: logoTexture, transparent: true, opacity: displayMode === 'blend' ? ghostOpacity + 0.03 : ghostOpacity,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      }));
      ghost.position.z = -logoDepth * 0.68;
      ghost.scale.setScalar(1.012);
      group.add(ghost);
    }

    const depthGlowValue = Number(cfg.depthGlowOpacity);
    const depthGlowOpacity = clamp(Number.isFinite(depthGlowValue) ? depthGlowValue : 0.018, 0, 0.5);
    if (depthGlowOpacity > 0) {
      const depthGlow = new THREE.Mesh(new THREE.PlaneGeometry(logoWidth, logoHeight), new THREE.MeshBasicMaterial({
        map: logoTexture, transparent: true, opacity: depthGlowOpacity, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      }));
      depthGlow.position.z = -logoDepth * 1.02;
      depthGlow.scale.setScalar(1.035);
      group.add(depthGlow);
    }

    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      const j = i * 3;
      const angle = i * 2.3999632297;
      const radius = 2.4 + ((i * 29) % 100) / 100 * 3.1;
      dustPositions[j] = Math.cos(angle) * radius;
      dustPositions[j + 1] = Math.sin(angle * 1.17) * (1.25 + ((i * 17) % 80) / 80 * 1.7);
      dustPositions[j + 2] = -1.8 + ((i * 43) % 100) / 100 * 3.4;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: isMobile ? 0.025 : 0.02, vertexColors: true, transparent: true, opacity: 0.52, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); scene.add(ambientLight);
    const keyLight = new THREE.PointLight(0xffffff, 1.9, 16); keyLight.position.set(2.6, 2.4, 5); scene.add(keyLight);

    const pointerWorld = new THREE.Vector3(99, 99, 99), pointerLocal = new THREE.Vector3(99, 99, 99), pointerNdc = new THREE.Vector2(), rayVector = new THREE.Vector3();
    let pointerActive = false, pulse = 0, frame = 0, visible = true, lastTime = performance.now();

    function syncColors() {
      const palette = [readCssVariable('--accent'), readCssVariable('--accent-2'), readCssVariable('--accent-3')].map((hex) => new THREE.Color(hex || '#fff'));
      const useSourceColors = String(cfg.colorMode || 'source').toLowerCase() === 'source';
      for (let i = 0; i < count; i += 1) {
        const j = i * 3;
        if (useSourceColors) {
          colors[j] = sourceColors[j]; colors[j + 1] = sourceColors[j + 1]; colors[j + 2] = sourceColors[j + 2];
        } else {
          const xBias = targets[j] / logoWidth + 0.5;
          const color = xBias < 0.38 ? palette[0] : xBias < 0.7 ? palette[1] : palette[2];
          colors[j] = color.r; colors[j + 1] = color.g; colors[j + 2] = color.b;
        }
      }
      for (let i = 0; i < dustCount; i += 1) {
        const color = palette[i % palette.length]; const j = i * 3; dustColors[j] = color.r; dustColors[j + 1] = color.g; dustColors[j + 2] = color.b;
      }
      geometry.attributes.color.needsUpdate = true; dustGeometry.attributes.color.needsUpdate = true; keyLight.color.copy(palette[2]);
    }

    function resize() {
      const rect = brand.getBoundingClientRect(), width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = width < 420 ? 38 : 34; camera.position.z = width < 420 ? 8.2 : 7.85; camera.updateProjectionMatrix();
      group.position.set(0, 0, 0); group.scale.setScalar(isMobile ? 0.98 : 1.04);
    }

    function updatePointer(event) {
      const rect = brand.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      rayVector.set(pointerNdc.x, pointerNdc.y, 0.3).unproject(camera).sub(camera.position).normalize();
      const distance = -camera.position.z / rayVector.z; pointerWorld.copy(camera.position).add(rayVector.multiplyScalar(distance));
      group.updateMatrixWorld(true); pointerLocal.copy(pointerWorld); group.worldToLocal(pointerLocal); pointerActive = true;
    }

    function renderStatic() { group.rotation.set(Number(cfg.baseTiltX) || -0.004, Number(cfg.baseTiltY) || 0.006, Number(cfg.baseTiltZ) || 0); renderer.render(scene, camera); }
    function tick(now) {
      frame = 0; if (!runtime.physicsEnabled || document.hidden || !visible) return;
      const dt = Math.min(2, Math.max(0.45, (now - lastTime) / 16.667)); lastTime = now;
      const attraction = (Number(cfg.attraction) || 0.036) * runtime.motionStrength, pointerForce = (Number(cfg.pointerForce) || 0.11) * runtime.motionStrength, pulseForce = (Number(cfg.pulseForce) || 0.32) * runtime.motionStrength, damping = clamp(Number(cfg.damping) || 0.905, 0.84, 0.985), radius = Math.max(1, Number(cfg.interactionRadius) || 1.65);
      if (!reducedMotionQuery.matches) {
        for (let i = 0; i < count; i += 1) {
          const j = i * 3;
          let x = positions[j], y = positions[j + 1], z = positions[j + 2], vx = velocities[j], vy = velocities[j + 1], vz = velocities[j + 2];
          vx += (targets[j] - x) * attraction * dt; vy += (targets[j + 1] - y) * attraction * dt; vz += (targets[j + 2] - z) * attraction * dt;
          if (pointerActive) {
            const dx = x - pointerLocal.x, dy = y - pointerLocal.y, dz = z - pointerLocal.z, dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
            if (dist < radius) { const falloff = 1 - dist / radius, force = (pointerForce * falloff + pulse * pulseForce * falloff) * dt; vx += (dx / dist) * force; vy += (dy / dist) * force; vz += (dz / dist) * force; }
          }
          vx *= damping; vy *= damping; vz *= damping; positions[j] = x + vx * dt; positions[j + 1] = y + vy * dt; positions[j + 2] = z + vz * dt; velocities[j] = vx; velocities[j + 1] = vy; velocities[j + 2] = vz;
        }
        geometry.attributes.position.needsUpdate = true; pulse *= 0.91; group.rotation.y = (Number(cfg.baseTiltY) || 0.006) + Math.sin(now * 0.00042) * (Number(cfg.tiltAmountY) || 0.015); group.rotation.x = (Number(cfg.baseTiltX) || -0.004) + Math.cos(now * 0.00031) * (Number(cfg.tiltAmountX) || 0.008); group.rotation.z = (Number(cfg.baseTiltZ) || 0) + Math.sin(now * 0.00027) * (Number(cfg.tiltAmountZ) || 0.004); dust.rotation.z += 0.00024 * runtime.motionStrength * dt; dust.rotation.y = Math.sin(now * 0.0002) * 0.05;
      }
      renderer.render(scene, camera); frame = requestAnimationFrame(tick);
    }
    function start() { if (!runtime.physicsEnabled || document.hidden || !visible) return; stage.classList.remove('is-paused'); if (reducedMotionQuery.matches) { renderStatic(); return; } if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); } }
    function stop() { stage.classList.add('is-paused'); if (frame) cancelAnimationFrame(frame); frame = 0; }

    if (logo) { logo.classList.add('hero-panel-logo--managed'); logo.setAttribute('aria-hidden', displayMode === 'replace' ? 'true' : 'false'); }
    runtime.physics = { stage, start, stop, renderStatic, syncColors };
    resize(); syncColors();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(brand); else window.addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); if (visible) start(); else stop(); }, { threshold: 0.02 }).observe(panel);
    brand.addEventListener('pointermove', updatePointer, { passive: true }); brand.addEventListener('pointerdown', (event) => { updatePointer(event); pulse = 1; }, { passive: true }); brand.addEventListener('pointerleave', () => { pointerActive = false; }, { passive: true }); brand.addEventListener('pointercancel', () => { pointerActive = false; }, { passive: true }); window.addEventListener('portfolio:experience-theme-change', syncColors); syncPhysicsAnimation();
  }


  async function initSpaceNetwork() {
    if (!isFeatureEnabled('spaceNetwork')) return;
    const cfg = experienceConfig.spaceNetwork || {};
    const stage = document.createElement('div');
    stage.className = 'experience-space-network';
    stage.setAttribute('aria-hidden', 'true');
    document.body.prepend(stage);
    try {
      const moduleUrl = cfg.moduleUrl || experienceConfig.physicsShowcase?.moduleUrl || 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';
      const THREE = await import(moduleUrl);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
      camera.position.z = 10;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.max(1, Number(cfg.maxDevicePixelRatio) || 1.35)));
      stage.appendChild(renderer.domElement);

      const mobile = window.matchMedia('(max-width: 760px)').matches;
      const count = Math.max(24, mobile ? Number(cfg.nodesMobile) || 42 : Number(cfg.nodesDesktop) || 78);
      const spreadX = Number(cfg.spreadX) || 12.5, spreadY = Number(cfg.spreadY) || 7.2, spreadZ = Number(cfg.spreadZ) || 7.5;
      const base = new Float32Array(count * 3), positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const j = i * 3, phi = i * 2.3999632297;
        const band = ((i * 37) % 101) / 100;
        base[j] = Math.cos(phi) * spreadX * (0.2 + band * 0.8);
        base[j + 1] = Math.sin(phi * 1.17) * spreadY * (0.24 + (((i * 19) % 97) / 96) * 0.76);
        base[j + 2] = -spreadZ * 0.55 + (((i * 53) % 103) / 102) * spreadZ;
        positions[j] = base[j]; positions[j + 1] = base[j + 1]; positions[j + 2] = base[j + 2];
      }
      const pointGeometry = new THREE.BufferGeometry();
      pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ size: Number(cfg.pointSize) || 0.055, vertexColors: true, transparent: true, opacity: Number(cfg.pointOpacity) || 0.62, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
      scene.add(points);
      const lineGeometry = new THREE.BufferGeometry();
      const maxSegments = count * 8;
      const linePositions = new Float32Array(maxSegments * 6), lineColors = new Float32Array(maxSegments * 6);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
      lineGeometry.setDrawRange(0, 0);
      const lines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: Number(cfg.lineOpacity) || 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      scene.add(lines);
      const pointer = { x: 0, y: 0 }, targetPointer = { x: 0, y: 0 };
      let frame = 0, last = performance.now();
      function syncColors() {
        const palette = [readCssVariable('--accent'), readCssVariable('--accent-2'), readCssVariable('--accent-3')].map((hex) => new THREE.Color(hex || '#fff'));
        for (let i = 0; i < count; i += 1) { const c = palette[i % palette.length], j = i * 3; colors[j] = c.r; colors[j+1] = c.g; colors[j+2] = c.b; }
        pointGeometry.attributes.color.needsUpdate = true;
      }
      function resize() { const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
      function updateLines() {
        const limit = Number(cfg.connectionDistance) || 2.55; let segment = 0;
        for (let a=0; a<count && segment<maxSegments; a+=1) {
          const aj=a*3;
          for (let b=a+1; b<count && segment<maxSegments; b+=1) {
            const bj=b*3, dx=positions[aj]-positions[bj], dy=positions[aj+1]-positions[bj+1], dz=positions[aj+2]-positions[bj+2];
            if (dx*dx+dy*dy+dz*dz > limit*limit) continue;
            const k=segment*6;
            linePositions[k]=positions[aj]; linePositions[k+1]=positions[aj+1]; linePositions[k+2]=positions[aj+2];
            linePositions[k+3]=positions[bj]; linePositions[k+4]=positions[bj+1]; linePositions[k+5]=positions[bj+2];
            lineColors[k]=colors[aj]; lineColors[k+1]=colors[aj+1]; lineColors[k+2]=colors[aj+2]; lineColors[k+3]=colors[bj]; lineColors[k+4]=colors[bj+1]; lineColors[k+5]=colors[bj+2]; segment+=1;
          }
        }
        lineGeometry.setDrawRange(0, segment*2); lineGeometry.attributes.position.needsUpdate=true; lineGeometry.attributes.color.needsUpdate=true;
      }
      function tick(now) {
        frame=0; if (!runtime.networkEnabled || document.hidden) return;
        const dt=Math.min(2,Math.max(.4,(now-last)/16.667)); last=now; const drift=(Number(cfg.drift)||.16)*runtime.motionStrength;
        pointer.x += (targetPointer.x-pointer.x)*.035*dt; pointer.y += (targetPointer.y-pointer.y)*.035*dt;
        for (let i=0;i<count;i+=1) { const j=i*3, phase=now*.00012*(1+(i%5)*.08); positions[j]=base[j]+Math.sin(phase+i*.73)*drift; positions[j+1]=base[j+1]+Math.cos(phase*.82+i*.51)*drift; positions[j+2]=base[j+2]+Math.sin(phase*.64+i*.31)*drift*.65; }
        pointGeometry.attributes.position.needsUpdate=true; updateLines();
        const parallax=Number(cfg.pointerParallax)||.32; scene.rotation.y=pointer.x*parallax*.08; scene.rotation.x=-pointer.y*parallax*.055; scene.rotation.z=Math.sin(now*.00008)*.012;
        renderer.render(scene,camera); frame=requestAnimationFrame(tick);
      }
      function start(){ if (!runtime.networkEnabled || document.hidden || frame) return; stage.classList.remove('is-paused'); last=performance.now(); if (reducedMotionQuery.matches) { updateLines(); renderer.render(scene,camera); return; } frame=requestAnimationFrame(tick); }
      function stop(){ stage.classList.add('is-paused'); if(frame) cancelAnimationFrame(frame); frame=0; }
      function onPointer(event){ targetPointer.x=(event.clientX/Math.max(1,innerWidth)-.5)*2; targetPointer.y=(event.clientY/Math.max(1,innerHeight)-.5)*2; }
      runtime.spaceNetwork={stage,start,stop,syncColors}; resize(); syncColors(); updateLines(); renderer.render(scene,camera);
      addEventListener('resize',resize,{passive:true}); addEventListener('pointermove',onPointer,{passive:true}); addEventListener('portfolio:experience-theme-change',syncColors); start();
    } catch (error) { stage.classList.add('is-unavailable'); console.warn('[portfolio] 3D network unavailable.', error); }
  }

  function syncSpaceNetworkAnimation() {
    if (!runtime.spaceNetwork) return;
    runtime.spaceNetwork.stage.classList.toggle('is-paused', !runtime.networkEnabled);
    if (runtime.networkEnabled && !document.hidden) runtime.spaceNetwork.start(); else runtime.spaceNetwork.stop();
  }

  function syncPhysicsAnimation() {
    if (!runtime.physics) return;
    runtime.physics.stage.classList.toggle('is-paused', !runtime.physicsEnabled);
    if (runtime.physicsEnabled && !document.hidden) runtime.physics.start();
    else runtime.physics.stop();
  }

  function syncAmbientCanvasAnimation() {
    if (!runtime.ambientCanvas) return;
    runtime.ambientCanvas.canvas.classList.toggle('is-paused', !runtime.ambientEnabled || document.hidden);
    if (runtime.ambientEnabled && !document.hidden) runtime.ambientCanvas.start();
    else runtime.ambientCanvas.stop();
  }

  const CARD_SELECTOR = [
    '.hero-copy', '.hero-panel', '.about-card', '.impact-card', '.recruiter-card', '.timeline-card',
    '.service-card', '.project-card', '.certificate-card', '.education-card', '.contact-card',
    '.project-spec-item', '.project-technology-grid li', '.project-technical-hero', '.project-decision-item',
    '.project-technology-list li', '.project-architecture-node', '.project-story__step'
  ].join(',');
  const MAGNET_SELECTOR = '.btn, .filter-chip, .content-carousel-button, .project-modal-tab, .project-access-link, .back-top, .project-story__jump, .project-story__arrow';
  const microBound = new WeakSet();
  const magnetBound = new WeakSet();

  // ---------------------------------------------------------------------------
  // Three.js free particle field: decorative depth without forming an object.
  // ---------------------------------------------------------------------------
  async function initParticleField() {
    if (!isFeatureEnabled('particleField')) return;
    const cfg = experienceConfig.particleField || {};
    const stage = document.createElement('div');
    stage.className = 'experience-particle-field';
    stage.setAttribute('aria-hidden', 'true');
    document.body.prepend(stage);
    try {
      const moduleUrl = cfg.moduleUrl || experienceConfig.physicsShowcase?.moduleUrl || 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';
      const THREE = await import(moduleUrl);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
      camera.position.z = 9;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Number(cfg.maxDevicePixelRatio) || 1.35));
      renderer.setClearColor(0x000000, 0);
      stage.appendChild(renderer.domElement);
      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      const count = Math.max(50, isMobile ? Number(cfg.particlesMobile) || 120 : Number(cfg.particlesDesktop) || 260);
      const positions = new Float32Array(count * 3), base = new Float32Array(count * 3), velocity = new Float32Array(count * 3), colors = new Float32Array(count * 3);
      const spreadX=Number(cfg.spreadX)||13.5, spreadY=Number(cfg.spreadY)||8.5, spreadZ=Number(cfg.spreadZ)||8;
      for(let i=0;i<count;i++){ const j=i*3; base[j]=(Math.random()-.5)*spreadX; base[j+1]=(Math.random()-.5)*spreadY; base[j+2]=(Math.random()-.5)*spreadZ; positions[j]=base[j]; positions[j+1]=base[j+1]; positions[j+2]=base[j+2]; }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
      const material = new THREE.PointsMaterial({ size:isMobile?(Number(cfg.pointSizeMobile)||.064):(Number(cfg.pointSizeDesktop)||.052), vertexColors:true, transparent:true, opacity:clamp(Number(cfg.opacity)||.72,.1,1), depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true });
      const points = new THREE.Points(geometry,material); scene.add(points);
      const pointer = new THREE.Vector2(99,99), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0,0,1),0), hit = new THREE.Vector3();
      let frame=0, last=performance.now();
      function syncColors(){ const palette=[readCssVariable('--accent'),readCssVariable('--accent-2'),readCssVariable('--accent-3')].map(h=>new THREE.Color(h||'#fff')); for(let i=0;i<count;i++){ const c=palette[i%palette.length],j=i*3; colors[j]=c.r; colors[j+1]=c.g; colors[j+2]=c.b; } geometry.attributes.color.needsUpdate=true; }
      function resize(){ const w=Math.max(1,innerWidth), h=Math.max(1,innerHeight); renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
      function onPointer(e){ pointer.x=(e.clientX/innerWidth)*2-1; pointer.y=-(e.clientY/innerHeight)*2+1; }
      function tick(now){ frame=0; if(!runtime.particleFieldEnabled||document.hidden)return; const dt=Math.min(2,Math.max(.4,(now-last)/16.667)); last=now; const drift=(Number(cfg.drift)||.22)*runtime.motionStrength, force=(Number(cfg.pointerForce)||.12)*runtime.motionStrength, radius=Number(cfg.pointerRadius)||2.2; ray.setFromCamera(pointer,camera); ray.ray.intersectPlane(plane,hit); for(let i=0;i<count;i++){ const j=i*3; const bx=base[j],by=base[j+1],bz=base[j+2]; velocity[j]+=Math.sin(now*.00035+i)*.0007*drift; velocity[j+1]+=Math.cos(now*.00028+i*.7)*.0007*drift; const dx=positions[j]-hit.x,dy=positions[j+1]-hit.y,dz=positions[j+2]-hit.z,dist=Math.sqrt(dx*dx+dy*dy+dz*dz)||1; if(dist<radius){ const f=(1-dist/radius)*force; velocity[j]+=(dx/dist)*f; velocity[j+1]+=(dy/dist)*f; velocity[j+2]+=(dz/dist)*f*.6; } velocity[j]+=(bx-positions[j])*.0025; velocity[j+1]+=(by-positions[j+1])*.0025; velocity[j+2]+=(bz-positions[j+2])*.0025; positions[j]+=velocity[j]*dt;positions[j+1]+=velocity[j+1]*dt;positions[j+2]+=velocity[j+2]*dt; velocity[j]*=.965;velocity[j+1]*=.965;velocity[j+2]*=.965; } geometry.attributes.position.needsUpdate=true; points.rotation.y=Math.sin(now*.00008)*.035; renderer.render(scene,camera); frame=requestAnimationFrame(tick); }
      function start(){ if(!frame && runtime.particleFieldEnabled&&!document.hidden) frame=requestAnimationFrame(tick); }
      function stop(){ if(frame) cancelAnimationFrame(frame); frame=0; }
      runtime.particleField={stage,start,stop,syncColors}; resize(); syncColors(); renderer.render(scene,camera); start();
      addEventListener('resize',resize,{passive:true}); addEventListener('pointermove',onPointer,{passive:true}); addEventListener('pointerdown',onPointer,{passive:true}); window.addEventListener('portfolio:experience-theme-change',syncColors);
    } catch(e){ stage.classList.add('is-unavailable'); console.warn('[portfolio] Particle field unavailable.',e); }
  }

  function syncParticleFieldAnimation(){
    if(!runtime.particleField)return;
    runtime.particleField.stage.classList.toggle('is-paused',!runtime.particleFieldEnabled);
    if(runtime.particleFieldEnabled&&!document.hidden) runtime.particleField.start(); else runtime.particleField.stop();
  }

  function initMicroInteractions() {
    if (!isFeatureEnabled('microInteractions')) return;
    bindMicroInteractions(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) bindMicroInteractions(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function bindMicroInteractions(context) {
    const cards = [];
    if (context.matches?.(CARD_SELECTOR)) cards.push(context);
    cards.push(...qa(CARD_SELECTOR, context));
    cards.forEach(bindCardMicroInteraction);

    const controls = [];
    if (context.matches?.(MAGNET_SELECTOR)) controls.push(context);
    controls.push(...qa(MAGNET_SELECTOR, context));
    controls.forEach(bindMagneticControl);
  }

  function bindCardMicroInteraction(card) {
    if (microBound.has(card)) return;
    microBound.add(card);
    card.classList.add('experience-reactive');
    card.addEventListener('pointermove', (event) => {
      if (!runtime.microEnabled) return;
      const rect = card.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      card.style.setProperty('--experience-spot-x', `${x}px`);
      card.style.setProperty('--experience-spot-y', `${y}px`);
      card.style.setProperty('--experience-spot-opacity', String(Number(experienceConfig.microInteractions?.spotlightOpacity) || 0.18));
    }, { passive: true });
    card.addEventListener('pointerenter', () => {
      if (runtime.microEnabled) card.classList.add('is-experience-active');
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-experience-active', 'is-experience-touch');
    }, { passive: true });
    card.addEventListener('pointerdown', (event) => {
      if (!runtime.microEnabled || event.pointerType === 'mouse') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--experience-spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--experience-spot-y', `${event.clientY - rect.top}px`);
      card.classList.add('is-experience-touch');
      window.setTimeout(() => card.classList.remove('is-experience-touch'), 520);
    }, { passive: true });
  }

  function bindMagneticControl(control) {
    if (magnetBound.has(control)) return;
    magnetBound.add(control);
    control.classList.add('experience-magnetic');
    control.addEventListener('pointermove', (event) => {
      if (!runtime.microEnabled || reducedMotionQuery.matches || !finePointerQuery.matches) return;
      const rect = control.getBoundingClientRect();
      const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const distance = (Number(experienceConfig.microInteractions?.magneticDistance) || 7) * runtime.motionStrength;
      control.style.setProperty('--experience-magnet-x', `${dx * distance}px`);
      control.style.setProperty('--experience-magnet-y', `${dy * distance}px`);
    }, { passive: true });
    control.addEventListener('pointerleave', () => {
      control.style.removeProperty('--experience-magnet-x');
      control.style.removeProperty('--experience-magnet-y');
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Ambient depth for header, sections and footer
  // ---------------------------------------------------------------------------

  function initAmbientDepth() {
    if (!isFeatureEnabled('ambientDepth')) return;
    const surfaces = [q('.site-header'), ...qa('main > .section'), q('.site-footer')].filter(Boolean);
    surfaces.forEach((surface, index) => { surface.classList.add('experience-ambient-surface'); surface.style.setProperty('--experience-section-index', String(index)); });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('is-experience-visible', entry.isIntersecting)), { rootMargin: '-12% 0px -12% 0px', threshold: 0.08 });
      surfaces.filter((surface) => surface.matches('.section')).forEach((surface) => observer.observe(surface));
    } else surfaces.forEach((surface) => surface.classList.add('is-experience-visible'));
    initAmbientConstellation();
  }

  function initAmbientConstellation() {
    const cfg = experienceConfig.ambientDepth || {};
    const canvas = document.createElement('canvas');
    canvas.className = 'experience-ambient-orbit';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0, height = 0, frame = 0;
    const pointer = { x: 0.5, y: 0.5, active: false };
    let particles = [];

    function makeParticles() {
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const count = Math.max(8, isMobile ? Number(cfg.particlesMobile) || 12 : Number(cfg.particlesDesktop) || 22);
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0.35 + Math.random() * 0.9,
        vx: (-0.5 + Math.random()) * ((Number(cfg.drift) || 0.12) * 0.65),
        vy: (-0.5 + Math.random()) * ((Number(cfg.drift) || 0.12) * 0.65),
        seed: index * 0.17 + Math.random() * 12,
        radius: 1.4 + Math.random() * 2.8
      }));
    }

    function resize() {
      width = Math.max(1, window.innerWidth); height = Math.max(1, window.innerHeight);
      canvas.width = Math.round(width * Math.min(window.devicePixelRatio || 1, 1.5));
      canvas.height = Math.round(height * Math.min(window.devicePixelRatio || 1, 1.5));
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0); makeParticles();
    }

    function updatePointer(event) { pointer.x = event.clientX / Math.max(1, width); pointer.y = event.clientY / Math.max(1, height); pointer.active = true; }
    function stopPointer() { pointer.active = false; }

    function draw(now) {
      frame = 0; if (!runtime.ambientEnabled || document.hidden) return;
      context.clearRect(0, 0, width, height);
      const palette = [readCssVariable('--accent'), readCssVariable('--accent-2'), readCssVariable('--accent-3')], linkDistance = Math.max(110, Number(cfg.linkDistance) || 170), glowOpacity = clamp(Number(cfg.glowOpacity) || 0.42, 0.1, 0.9), lineOpacity = clamp(Number(cfg.lineOpacity) || 0.18, 0.04, 0.4);
      for (const particle of particles) {
        particle.x += particle.vx * particle.z; particle.y += particle.vy * particle.z; particle.x += Math.sin(now * 0.00017 + particle.seed) * 0.08 * particle.z; particle.y += Math.cos(now * 0.00015 + particle.seed) * 0.08 * particle.z;
        if (pointer.active) {
          const px = pointer.x * width, py = pointer.y * height, dx = particle.x - px, dy = particle.y - py, dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 140) { const force = (1 - dist / 140) * 0.18; particle.x += (dx / dist) * force * 8; particle.y += (dy / dist) * force * 8; }
        }
        if (particle.x < -40) particle.x = width + 40; if (particle.x > width + 40) particle.x = -40; if (particle.y < -40) particle.y = height + 40; if (particle.y > height + 40) particle.y = -40;
      }
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > linkDistance) continue;
          const alpha = (1 - distance / linkDistance) * lineOpacity * ((a.z + b.z) / 2), gradient = context.createLinearGradient(a.x, a.y, b.x, b.y), alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
          gradient.addColorStop(0, `${palette[i % palette.length]}${alphaHex}`); gradient.addColorStop(1, `${palette[j % palette.length]}${alphaHex}`);
          context.strokeStyle = gradient; context.lineWidth = 0.8 + ((a.z + b.z) / 2) * 0.8; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
        }
      }
      particles.forEach((particle, index) => { const color = palette[index % palette.length]; context.beginPath(); context.fillStyle = color; context.globalAlpha = glowOpacity * particle.z; context.shadowBlur = 14 * particle.z; context.shadowColor = color; context.arc(particle.x, particle.y, particle.radius * particle.z, 0, Math.PI * 2); context.fill(); });
      context.globalAlpha = 1; context.shadowBlur = 0; frame = requestAnimationFrame(draw);
    }

    function start() { canvas.classList.remove('is-paused'); if (!frame) frame = requestAnimationFrame(draw); }
    function stop() { canvas.classList.add('is-paused'); if (frame) cancelAnimationFrame(frame); frame = 0; }

    runtime.ambientCanvas = { canvas, start, stop };
    resize(); window.addEventListener('resize', resize, { passive: true }); window.addEventListener('pointermove', updatePointer, { passive: true }); window.addEventListener('pointerleave', stopPointer, { passive: true }); window.addEventListener('pointercancel', stopPointer, { passive: true }); if (runtime.ambientEnabled) start();
  }

  // ---------------------------------------------------------------------------
  // Project story
  // ---------------------------------------------------------------------------

  function extendProjectTabs(tabs, project, data) {
    const result = [...tabs];
    const details = project?.details || {};
    const hasNarrative = Boolean(project?.description || details.description || details.features?.length || details.technicalSpecs?.length);

    if (isFeatureEnabled('projectStory') && hasNarrative) {
      const overviewIndex = result.findIndex((tab) => tab.id === 'overview');
      const insertAt = overviewIndex >= 0 ? overviewIndex + 1 : 0;
      result.splice(insertAt, 0, { id: 'story', label: data?.modal?.storyTab || 'Story' });
    }
    return result;
  }

  function renderProjectTab({ tabId, project, data, root: contentRoot }) {
    if (tabId === 'story' && isFeatureEnabled('projectStory')) {
      contentRoot.innerHTML = renderStory(project, data);
      bindStory(contentRoot, data);
      return true;
    }
    return false;
  }

  function buildStorySteps(project, data) {
    const details = project?.details || {};
    const modal = data?.modal || {};
    const steps = [];
    const push = (title, body, type) => {
      if (!body || !String(body).trim()) return;
      if (steps.some((item) => item.body === body)) return;
      steps.push({ title, body: String(body), type });
    };
    push(modal.storyChallengeTitle || 'Context', project.description, 'context');
    push(modal.storySolutionTitle || 'Solution', details.description, 'solution');
    const maxFeatureSteps = Math.max(1, Number(experienceConfig.story?.maxFeatureSteps) || 3);
    (details.features || []).slice(0, maxFeatureSteps).forEach((feature) => { const body = typeof feature === 'string' ? feature : feature?.label || feature?.value || ''; push(modal.storyFeatureTitle || 'Product decision', body, 'feature'); });
    return steps;
  }

  function renderStory(project, data) {
    const modal = data?.modal || {}, steps = buildStorySteps(project, data);
    const image = project.image ? `<img src="${escapeHtml(project.image)}" alt="" loading="lazy">` : '';
    const chips = (project.stack || []).slice(0, 5).map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    return `<section class="project-story">
      <div class="project-story__visual">
        <div class="project-story__media">${image}<div class="project-story__media-glow"></div></div>
        <div class="project-story__summary">
          <span class="project-story__eyebrow">${escapeHtml(modal.storyEyebrow || 'INTERACTIVE CASE')}</span>
          <h3>${escapeHtml(project.title || modal.storyTitle || '')}</h3>
          <p>${escapeHtml(modal.storyTitle || '')}</p>
          ${chips ? `<div class="project-story__chips">${chips}</div>` : ''}
          <div class="project-story__progress" aria-hidden="true"><i id="project-story-progress-bar"></i></div>
          <span class="project-story__progress-text" id="project-story-progress-text"></span>
        </div>
      </div>
      <div class="project-story__steps" id="project-story-steps">
        ${steps.map((step,index)=>`<button type="button" class="project-story__step ${index===0?'is-active':''}" data-story-step="${index}" aria-current="${index===0?'step':'false'}"><span class="project-story__step-number">${String(index+1).padStart(2,'0')}</span><span class="project-story__step-copy"><span class="project-story__step-type">${escapeHtml(step.title)}</span><span class="project-story__step-body">${escapeHtml(step.body)}</span></span></button>`).join('')}
      </div>
    </section>`;
  }

  function bindStory(contentRoot, data) {
    const steps = qa('[data-story-step]', contentRoot);
    if (!steps.length) return;
    const bar = q('#project-story-progress-bar', contentRoot);
    const progressText = q('#project-story-progress-text', contentRoot);
    let activeIndex = 0;
    const setActive = (index) => {
      activeIndex = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((step, idx) => {
        const active = idx === activeIndex;
        step.classList.toggle('is-active', active);
        step.setAttribute('aria-current', active ? 'step' : 'false');
      });
      if (bar) bar.style.width = `${((activeIndex + 1) / steps.length) * 100}%`;
      if (progressText) progressText.textContent = replacePlaceholders(data?.modal?.storyProgress || '{current}/{count}', { current: activeIndex + 1, count: steps.length });
    };
    const scrollToStep = (index) => {
      const step = steps[Math.max(0, Math.min(steps.length - 1, index))];
      if (!step) return;
      setActive(Number(step.dataset.storyStep) || 0);
      step.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    };
    steps.forEach((step, index) => step.addEventListener('click', () => scrollToStep(index)));
    if ('IntersectionObserver' in window) {
      const ratios = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
        if (contentRoot.scrollTop <= 6) { setActive(0); return; }
        const maxScroll = contentRoot.scrollHeight - contentRoot.clientHeight;
        if (maxScroll - contentRoot.scrollTop <= 8) { setActive(steps.length - 1); return; }
        let best = activeIndex, bestRatio = 0;
        steps.forEach((step, idx) => { const ratio = ratios.get(step) || 0; if (ratio > bestRatio) { bestRatio = ratio; best = idx; } });
        if (bestRatio >= 0.34) setActive(best);
      }, { root: contentRoot, rootMargin: '-14% 0px -42% 0px', threshold: [0.2, 0.34, 0.5, 0.72] });
      steps.forEach((step) => observer.observe(step));
    }
    contentRoot.addEventListener('scroll', () => {
      if (contentRoot.scrollTop <= 6) setActive(0);
      const maxScroll = contentRoot.scrollHeight - contentRoot.clientHeight;
      if (maxScroll - contentRoot.scrollTop <= 8) setActive(steps.length - 1);
    }, { passive: true });
    setActive(0);
  }

  // ---------------------------------------------------------------------------
  // Public bridge used by main.js without coupling its core rendering to effects.  // ---------------------------------------------------------------------------
  // Public bridge used by main.js without coupling its core rendering to effects.
  // ---------------------------------------------------------------------------

  function setLocale(locale, data) {
    runtime.locale = locale || runtime.locale;
    runtime.data = data || runtime.data;
    updateLabLanguage();
  }

  function onProjectModalClose() {
    // Reserved hook: project-specific observers are attached to nodes and are
    // naturally released when the modal content is replaced.
  }

  window.PortfolioExperience = {
    extendProjectTabs,
    renderProjectTab,
    setLocale,
    onProjectModalClose
  };

  function init() {
    restoreSavedState();
    syncRuntimeCss();

    // Keep the hero interaction responsive, but move decorative/non-critical work
    // out of the initial rendering path. This matters on GitHub Pages and mobile.
    if (isFeatureEnabled('physicsShowcase')) initPhysicsShowcase();
    if (isFeatureEnabled('ambientDepth')) initAmbientDepth();

    const runDeferredExperience = () => {
      if (isFeatureEnabled('experienceLab')) renderLab();
      if (isFeatureEnabled('interactiveCanvas')) initCanvas();
      if (isFeatureEnabled('spaceNetwork')) initSpaceNetwork();
      if (isFeatureEnabled('particleField')) initParticleField();
      if (isFeatureEnabled('microInteractions')) initMicroInteractions();
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runDeferredExperience, { timeout: 1400 });
    } else {
      window.setTimeout(runDeferredExperience, 550);
    }

    document.addEventListener('visibilitychange', () => { syncCanvasAnimation(); syncPhysicsAnimation(); syncAmbientCanvasAnimation(); syncSpaceNetworkAnimation(); syncParticleFieldAnimation(); });
    reducedMotionQuery.addEventListener?.('change', () => {
      syncCanvasAnimation();
      syncPhysicsAnimation();
      syncAmbientCanvasAnimation();
      syncSpaceNetworkAnimation();
      syncParticleFieldAnimation();
      renderLabBody();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && runtime.labOpen) setLabOpen(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
