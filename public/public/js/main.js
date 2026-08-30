// ---- Terminal typing effect ----
function typeText(el, text, speed = 35) {
  return new Promise(resolve => {
    if (!text) return resolve();
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---- Load profile and populate hero, contact, nav ----
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    const p = await res.json();

    document.getElementById('navLogo').textContent = `~/${(p.name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}`;
    document.getElementById('heroRole').textContent = p.role || 'Full-Stack Developer';
    document.getElementById('heroBio').textContent = p.bio || '';
    document.getElementById('footerNote').textContent = `© ${new Date().getFullYear()} ${p.name || ''}. Built from scratch, deployed with pride.`;

    // Avatar
    const avatarWrap = document.getElementById('avatarWrap');
    if (p.photo) {
      avatarWrap.innerHTML = `<img src="${p.photo}" alt="${escapeHtml(p.name)}" class="avatar" />`;
    }

    // Resume button
    if (p.resume) {
      const resumeLink = document.getElementById('resumeLink');
      resumeLink.href = p.resume;
      resumeLink.setAttribute('download', p.resumeFilename || 'resume.pdf');
      resumeLink.style.display = 'inline-block';
    }

    // Contact links
    const contactLinks = document.getElementById('contactLinks');
    let html = '';
    if (p.email) html += `<a href="mailto:${p.email}">${escapeHtml(p.email)}</a>`;
    if (p.github) html += `<a href="${p.github}" target="_blank" rel="noopener">GitHub</a>`;
    if (p.linkedin) html += `<a href="${p.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`;
    contactLinks.innerHTML = html;

    // Terminal typing effect
    await typeText(document.getElementById('typedName'), (p.name || '').toLowerCase().replace(/\s+/g, '-'));
    await typeText(document.getElementById('typedRole'), p.role || '');
    await typeText(document.getElementById('typedSkills'), (p.skills || []).join('  '));
  } catch (err) {
    console.error('Could not load profile', err);
  }
}

// ---- Load projects ----
async function loadProjects() {
  const grid = document.getElementById('projectGrid');
  try {
    const res = await fetch('/api/projects');
    const projects = await res.json();

    if (!projects.length) {
      grid.innerHTML = '<p class="loading">No projects yet — check back soon.</p>';
      return;
    }

    grid.innerHTML = projects.map(p => `
      <article class="project-card">
        <img src="${p.image || `https://placehold.co/600x400/1a1f2e/e8a33d?text=${encodeURIComponent(p.title.slice(0,20))}`}" alt="${escapeHtml(p.title)} preview" loading="lazy" />
        <div class="project-card-body">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>
          <div class="stack-tags">
            ${(p.stack || []).map(s => `<span>${escapeHtml(s)}</span>`).join('')}
          </div>
          ${p.link ? `<a class="project-link" href="${p.link}" target="_blank" rel="noopener">View project &rarr;</a>` : ''}
        </div>
      </article>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="loading">Could not load projects.</p>';
  }
}

// ---- Load certificates ----
async function loadCertificates() {
  const grid = document.getElementById('certGrid');
  try {
    const res = await fetch('/api/certificates');
    const certs = await res.json();

    if (!certs.length) {
      grid.innerHTML = '<p class="loading">No certificates added yet.</p>';
      return;
    }

    grid.innerHTML = certs.map(c => `
      <a class="cert-card" href="${c.file}" target="_blank" rel="noopener">
        ${c.fileType === 'pdf'
          ? `<div class="cert-thumb-pdf">📄<span>View PDF</span></div>`
          : `<img class="cert-thumb" src="${c.file}" alt="${escapeHtml(c.title)}" loading="lazy" />`
        }
        <div class="cert-body">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.issuer)}${c.issuer && c.date ? ' · ' : ''}${escapeHtml(c.date)}</p>
        </div>
      </a>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="loading">Could not load certificates.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadProjects();
  loadCertificates();
});
