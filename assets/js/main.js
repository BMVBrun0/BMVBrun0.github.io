const data = window.portfolioData;
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function renderSkills() {
  const root = qs('#skills-list');
  root.innerHTML = data.skills.map((skill) => `
    <article class="skill-item">
      <header>
        <span>${skill.name}</span>
        <strong>${skill.level}%</strong>
      </header>
      <div class="skill-bar" aria-hidden="true">
        <span style="width:${skill.level}%"></span>
      </div>
    </article>
  `).join('');
}

function renderExperience() {
  const root = qs('#experience-list');
  root.innerHTML = data.experience.map((item) => `
    <article class="timeline-item reveal">
      <span class="timeline-dot" aria-hidden="true"></span>
      <div class="timeline-card">
        <p class="timeline-period">${item.period}</p>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    </article>
  `).join('');
}

function renderServices() {
  const root = qs('#services-list');
  root.innerHTML = data.services.map((item) => `
    <article class="service-card reveal">
      <img src="${item.icon}" alt="" class="service-icon">
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `).join('');
}

let activeCategory = 'all';

function renderFilters() {
  const root = qs('#project-filters');
  root.innerHTML = data.categories.map((category) => `
    <button
      type="button"
      class="filter-chip ${category.id === activeCategory ? 'is-active' : ''}"
      data-category="${category.id}"
      aria-pressed="${String(category.id === activeCategory)}">
      ${category.label}
    </button>
  `).join('');

  qsa('.filter-chip', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderProjects();
    });
  });
}

function renderProjects() {
  const root = qs('#projects-list');
  const projects = activeCategory === 'all'
    ? data.projects
    : data.projects.filter((project) => project.category === activeCategory);

  root.innerHTML = projects.map((project) => `
    <article class="project-card reveal">
      <div class="project-media">
        <img src="${project.image}" alt="${project.title}" loading="lazy">
      </div>
      <div class="project-body">
        <div class="project-meta">
          <span class="project-tag">${data.categories.find((item) => item.id === project.category)?.label ?? 'Projeto'}</span>
          ${project.status ? `<span class="project-status">${project.status}</span>` : ''}
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        ${Array.isArray(project.stack) && project.stack.length ? `
          <ul class="project-stack" aria-label="Stack prevista">
            ${project.stack.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </article>
  `).join('');
}

function initRoleRotation() {
  const target = qs('#typed-role');
  if (!target) return;
  let index = 0;

  const paint = () => {
    target.textContent = data.roles[index];
    index = (index + 1) % data.roles.length;
  };

  paint();
  window.setInterval(paint, 2200);
}

function initMenu() {
  const toggle = qs('.nav-toggle');
  const nav = qs('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isExpanded));
    nav.classList.toggle('is-open');
  });

  qsa('.site-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initReveal() {
  const elements = qsa('.reveal');
  if (!('IntersectionObserver' in window) || !elements.length) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  elements.forEach((element) => observer.observe(element));
}

function setCurrentYear() {
  const year = qs('#current-year');
  if (year) year.textContent = new Date().getFullYear();
}

function init() {
  renderSkills();
  renderExperience();
  renderServices();
  renderFilters();
  renderProjects();
  initRoleRotation();
  initMenu();
  initReveal();
  setCurrentYear();
}

document.addEventListener('DOMContentLoaded', init);
