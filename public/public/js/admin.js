// ---- Auth helpers ----
function getToken() { return localStorage.getItem('admin_token'); }
function setToken(t) { localStorage.setItem('admin_token', t); }
function clearToken() { localStorage.removeItem('admin_token'); }
function authHeader() { return { 'Authorization': `Bearer ${getToken()}` }; }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

const loginScreen = document.getElementById('loginScreen');
const adminShell = document.getElementById('adminShell');

function showLoggedIn() {
  loginScreen.style.display = 'none';
  adminShell.style.display = 'block';
  loadProfileIntoForm();
  loadProjectsList();
  loadCertsList();
}

function showLoggedOut() {
  loginScreen.style.display = 'flex';
  adminShell.style.display = 'none';
}

if (getToken()) showLoggedIn(); else showLoggedOut();

// ---- Login ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('loginError');
  errorBox.classList.remove('visible');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    showLoggedIn();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearToken();
  showLoggedOut();
});

// Handle expired/invalid token on any admin API call
async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...authHeader() }
  });
  if (res.status === 401) {
    clearToken();
    showLoggedOut();
    throw new Error('Session expired, please log in again');
  }
  return res;
}

// ---- Tabs ----
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// ===================== PROFILE =====================
async function loadProfileIntoForm() {
  try {
    const res = await fetch('/api/profile');
    const p = await res.json();

    document.getElementById('pName').value = p.name || '';
    document.getElementById('pRole').value = p.role || '';
    document.getElementById('pBio').value = p.bio || '';
    document.getElementById('pSkills').value = (p.skills || []).join(', ');
    document.getElementById('pEmail').value = p.email || '';
    document.getElementById('pGithub').value = p.github || '';
    document.getElementById('pLinkedin').value = p.linkedin || '';
    document.getElementById('pGithubUsername').value = p.githubUsername || '';
    document.getElementById('pSyncGithub').checked = !!p.syncProjectsFromGithub;
    document.getElementById('githubSyncNotice').style.display = p.syncProjectsFromGithub ? 'block' : 'none';

    const photoWrap = document.getElementById('currentPhotoWrap');
    if (p.photo) {
      document.getElementById('currentPhotoImg').src = p.photo;
      photoWrap.style.display = 'flex';
    } else {
      photoWrap.style.display = 'none';
    }

    const resumeText = document.getElementById('currentResumeText');
    if (p.resume) {
      resumeText.textContent = `Current resume: ${p.resumeFilename || 'uploaded'}`;
      resumeText.style.display = 'block';
    } else {
      resumeText.style.display = 'none';
    }
  } catch (err) {
    console.error('Could not load profile', err);
  }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('profileError');
  const successBox = document.getElementById('profileSuccess');
  errorBox.classList.remove('visible');
  successBox.classList.remove('visible');

  const btn = document.getElementById('profileSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const formData = new FormData();
  formData.append('name', document.getElementById('pName').value.trim());
  formData.append('role', document.getElementById('pRole').value.trim());
  formData.append('bio', document.getElementById('pBio').value.trim());
  formData.append('skills', document.getElementById('pSkills').value.trim());
  formData.append('email', document.getElementById('pEmail').value.trim());
  formData.append('github', document.getElementById('pGithub').value.trim());
  formData.append('linkedin', document.getElementById('pLinkedin').value.trim());
  formData.append('githubUsername', document.getElementById('pGithubUsername').value.trim());
  formData.append('syncProjectsFromGithub', document.getElementById('pSyncGithub').checked);

  const photoFile = document.getElementById('pPhoto').files[0];
  if (photoFile) formData.append('photo', photoFile);
  const resumeFile = document.getElementById('pResume').files[0];
  if (resumeFile) formData.append('resume', resumeFile);

  try {
    const res = await adminFetch('/api/profile', { method: 'PUT', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save profile');

    successBox.textContent = 'Profile saved!';
    successBox.classList.add('visible');
    document.getElementById('pPhoto').value = '';
    document.getElementById('pResume').value = '';
    loadProfileIntoForm();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save profile';
  }
});

// ===================== PROJECTS =====================
let allProjects = [];

async function loadProjectsList() {
  const list = document.getElementById('projectsList');
  try {
    const res = await fetch('/api/projects');
    allProjects = await res.json();

    if (!allProjects.length) {
      list.innerHTML = '<p class="empty-hint">No projects yet — add your first one.</p>';
      return;
    }

    list.innerHTML = allProjects.map(p => `
      <div class="list-item">
        ${p.image ? `<img class="list-thumb" src="${p.image}" alt="" />` : `<div class="list-thumb-placeholder">📦</div>`}
        <div class="list-info">
          <div class="list-title">${escapeHtml(p.title)}</div>
          <div class="list-meta">${(p.stack || []).join(', ')}</div>
        </div>
        <div class="list-actions">
          <button class="icon-btn" data-edit="${p._id}" title="Edit">✎</button>
          <button class="icon-btn delete" data-delete="${p._id}" title="Delete">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openProjectModal(allProjects.find(p => p._id === btn.dataset.edit)));
    });
    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this project?')) return;
        const res = await adminFetch(`/api/projects/${btn.dataset.delete}`, { method: 'DELETE' });
        if (res.ok) loadProjectsList();
      });
    });
  } catch (err) {
    list.innerHTML = '<p class="empty-hint">Could not load projects.</p>';
  }
}

const projectModal = document.getElementById('projectModal');
function openProjectModal(project = null) {
  document.getElementById('projectForm').reset();
  document.getElementById('projectFormError').classList.remove('visible');
  document.getElementById('projectId').value = project ? project._id : '';
  document.getElementById('projectModalTitle').textContent = project ? 'Edit Project' : 'New Project';

  if (project) {
    document.getElementById('projTitle').value = project.title;
    document.getElementById('projDesc').value = project.description || '';
    document.getElementById('projStack').value = (project.stack || []).join(', ');
    document.getElementById('projLink').value = project.link || '';
    document.getElementById('projImageUrl').value = project.image && !project.image.startsWith('data:') ? project.image : '';
  }
  projectModal.classList.add('open');
}
function closeProjectModal() { projectModal.classList.remove('open'); }

document.getElementById('newProjectBtn').addEventListener('click', () => openProjectModal());
document.getElementById('projectCancelBtn').addEventListener('click', closeProjectModal);
projectModal.addEventListener('click', (e) => { if (e.target === projectModal) closeProjectModal(); });

document.getElementById('projectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('projectFormError');
  errorBox.classList.remove('visible');

  const id = document.getElementById('projectId').value;
  const formData = new FormData();
  formData.append('title', document.getElementById('projTitle').value.trim());
  formData.append('description', document.getElementById('projDesc').value.trim());
  formData.append('stack', document.getElementById('projStack').value.trim());
  formData.append('link', document.getElementById('projLink').value.trim());
  formData.append('imageUrl', document.getElementById('projImageUrl').value.trim());
  const imageFile = document.getElementById('projImageFile').files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';
    const res = await adminFetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save project');

    closeProjectModal();
    loadProjectsList();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('visible');
  }
});

// ===================== GITHUB IMPORT =====================
const githubModal = document.getElementById('githubModal');
let fetchedRepos = [];

document.getElementById('importGithubBtn').addEventListener('click', () => {
  document.getElementById('githubFormError').classList.remove('visible');
  document.getElementById('githubRepoListWrap').style.display = 'none';
  document.getElementById('githubUsername').value = '';
  githubModal.classList.add('open');
});
document.getElementById('githubCancelBtn').addEventListener('click', () => githubModal.classList.remove('open'));
githubModal.addEventListener('click', (e) => { if (e.target === githubModal) githubModal.classList.remove('open'); });

document.getElementById('githubFetchBtn').addEventListener('click', async () => {
  const errorBox = document.getElementById('githubFormError');
  errorBox.classList.remove('visible');
  const username = document.getElementById('githubUsername').value.trim();
  if (!username) return;

  const btn = document.getElementById('githubFetchBtn');
  btn.disabled = true;
  btn.textContent = 'Fetching…';

  try {
    const res = await adminFetch(`/api/projects/github/${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not fetch repositories');

    fetchedRepos = data;
    const listEl = document.getElementById('githubRepoList');

    if (!fetchedRepos.length) {
      listEl.innerHTML = '<p class="empty-hint">No public repositories found for this username.</p>';
    } else {
      listEl.innerHTML = fetchedRepos.map((r, i) => `
        <label class="github-repo-item">
          <input type="checkbox" data-repo-index="${i}" />
          <div>
            <div class="repo-name">${escapeHtml(r.name)}</div>
            ${r.description ? `<div class="repo-desc">${escapeHtml(r.description)}</div>` : ''}
            ${r.language ? `<span class="repo-lang">${escapeHtml(r.language)}</span>` : ''}
          </div>
        </label>
      `).join('');
    }

    document.getElementById('githubRepoListWrap').style.display = 'block';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Fetch repositories';
  }
});

document.getElementById('githubImportBtn').addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('#githubRepoList input[type="checkbox"]:checked'));
  if (!checked.length) return;

  const btn = document.getElementById('githubImportBtn');
  btn.disabled = true;
  btn.textContent = 'Importing…';

  try {
    for (const cb of checked) {
      const repo = fetchedRepos[parseInt(cb.dataset.repoIndex, 10)];
      const formData = new FormData();
      formData.append('title', repo.name);
      formData.append('description', repo.description || '');
      formData.append('stack', repo.language || '');
      formData.append('link', repo.url);
      formData.append('imageUrl', '');
      await adminFetch('/api/projects', { method: 'POST', body: formData });
    }
    githubModal.classList.remove('open');
    loadProjectsList();
  } catch (err) {
    alert('Some repos could not be imported. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add selected';
  }
});

// ===================== CERTIFICATES =====================
let allCerts = [];

async function loadCertsList() {
  const list = document.getElementById('certsList');
  try {
    const res = await fetch('/api/certificates');
    allCerts = await res.json();

    if (!allCerts.length) {
      list.innerHTML = '<p class="empty-hint">No certificates yet — add your first one.</p>';
      return;
    }

    list.innerHTML = allCerts.map(c => `
      <div class="list-item">
        ${c.fileType === 'pdf' ? `<div class="list-thumb-placeholder">📄</div>` : `<img class="list-thumb" src="${c.file}" alt="" />`}
        <div class="list-info">
          <div class="list-title">${escapeHtml(c.title)}</div>
          <div class="list-meta">${escapeHtml(c.issuer)}${c.issuer && c.date ? ' · ' : ''}${escapeHtml(c.date)}</div>
        </div>
        <div class="list-actions">
          <button class="icon-btn" data-edit="${c._id}" title="Edit">✎</button>
          <button class="icon-btn delete" data-delete="${c._id}" title="Delete">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openCertModal(allCerts.find(c => c._id === btn.dataset.edit)));
    });
    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this certificate?')) return;
        const res = await adminFetch(`/api/certificates/${btn.dataset.delete}`, { method: 'DELETE' });
        if (res.ok) loadCertsList();
      });
    });
  } catch (err) {
    list.innerHTML = '<p class="empty-hint">Could not load certificates.</p>';
  }
}

const certModal = document.getElementById('certModal');
function openCertModal(cert = null) {
  document.getElementById('certForm').reset();
  document.getElementById('certFormError').classList.remove('visible');
  document.getElementById('certId').value = cert ? cert._id : '';
  document.getElementById('certModalTitle').textContent = cert ? 'Edit Certificate' : 'New Certificate';
  document.getElementById('certFile').required = !cert;
  document.getElementById('certFileHint').textContent = cert
    ? 'Leave blank to keep the current file.'
    : 'Required — upload an image or PDF of the certificate.';

  if (cert) {
    document.getElementById('certTitle').value = cert.title;
    document.getElementById('certIssuer').value = cert.issuer || '';
    document.getElementById('certDate').value = cert.date || '';
  }
  certModal.classList.add('open');
}
function closeCertModal() { certModal.classList.remove('open'); }

document.getElementById('newCertBtn').addEventListener('click', () => openCertModal());
document.getElementById('certCancelBtn').addEventListener('click', closeCertModal);
certModal.addEventListener('click', (e) => { if (e.target === certModal) closeCertModal(); });

document.getElementById('certForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('certFormError');
  errorBox.classList.remove('visible');

  const id = document.getElementById('certId').value;
  const formData = new FormData();
  formData.append('title', document.getElementById('certTitle').value.trim());
  formData.append('issuer', document.getElementById('certIssuer').value.trim());
  formData.append('date', document.getElementById('certDate').value.trim());
  const file = document.getElementById('certFile').files[0];
  if (file) formData.append('file', file);

  try {
    const url = id ? `/api/certificates/${id}` : '/api/certificates';
    const method = id ? 'PUT' : 'POST';
    const res = await adminFetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save certificate');

    closeCertModal();
    loadCertsList();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('visible');
  }
});
