/* ============================================
   ADMIN PANEL — JAVASCRIPT
   ============================================ */
(function () {
  'use strict';

  let content = {};
  let password = '';

  // --- AUTH ---
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginScreen = document.getElementById('loginScreen');
  const adminPanel = document.getElementById('adminPanel');
  const passwordInput = document.getElementById('passwordInput');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    password = passwordInput.value;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'flex';
        loadContent();
      } else {
        loginError.textContent = 'Invalid password';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch {
      loginError.textContent = 'Connection error';
    }
  });

  // --- SIDEBAR NAV ---
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');
  const cmsSections = document.querySelectorAll('.cms-section');
  const sectionTitle = document.getElementById('sectionTitle');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      cmsSections.forEach(s => s.classList.remove('active'));
      document.querySelector(`.cms-section[data-section="${section}"]`).classList.add('active');

      sectionTitle.textContent = link.textContent.trim();
    });
  });

  // --- LOAD CONTENT ---
  async function loadContent() {
    try {
      const res = await fetch('/api/content');
      content = await res.json();
      populateFields();
      renderPortfolio();
      renderPricingTiers();
      renderAddons();
      renderProcess();
    } catch (err) {
      console.error('Failed to load content:', err);
    }
  }

  // --- FIELD POPULATION ---
  function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
  }

  function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    const lastKey = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : parseInt(keys[keys.length - 1]);
    current[lastKey] = value;
  }

  function populateFields() {
    document.querySelectorAll('[data-path]').forEach(field => {
      const val = getNestedValue(content, field.dataset.path);
      if (field.tagName === 'TEXTAREA') {
        field.value = val;
      } else {
        field.value = val;
      }
    });

    // Listen for changes
    document.querySelectorAll('[data-path]').forEach(field => {
      field.addEventListener('input', () => {
        setNestedValue(content, field.dataset.path, field.value);
      });
    });
  }

  // --- PORTFOLIO ---
  const uploadZone = document.getElementById('uploadZone');
  const imageUpload = document.getElementById('imageUpload');
  const portfolioPreview = document.getElementById('portfolioPreview');

  uploadZone.addEventListener('click', () => imageUpload.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    for (const file of files) {
      await uploadImage(file);
    }
  });

  imageUpload.addEventListener('change', async () => {
    const files = Array.from(imageUpload.files);
    for (const file of files) {
      await uploadImage(file);
    }
    imageUpload.value = '';
  });

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Admin-Password': password },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        content.portfolio.push(data.path);
        renderPortfolio();
        showSaveStatus('Image uploaded — save to keep changes');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  function renderPortfolio() {
    portfolioPreview.innerHTML = '';
    (content.portfolio || []).forEach((imgPath, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'portfolio-thumb';
      thumb.draggable = true;
      thumb.dataset.index = index;
      thumb.innerHTML = `
        <img src="/${imgPath}" alt="Portfolio ${index + 1}">
        <div class="thumb-actions">
          <button class="thumb-delete" data-index="${index}" title="Remove">✕</button>
        </div>
      `;

      // Drag to reorder
      thumb.addEventListener('dragstart', (e) => {
        thumb.classList.add('dragging');
        e.dataTransfer.setData('text/plain', index);
      });
      thumb.addEventListener('dragend', () => thumb.classList.remove('dragging'));
      thumb.addEventListener('dragover', (e) => e.preventDefault());
      thumb.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        if (fromIndex !== toIndex) {
          const item = content.portfolio.splice(fromIndex, 1)[0];
          content.portfolio.splice(toIndex, 0, item);
          renderPortfolio();
        }
      });

      // Delete
      thumb.querySelector('.thumb-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        content.portfolio.splice(index, 1);
        renderPortfolio();
      });

      portfolioPreview.appendChild(thumb);
    });
  }

  // --- PRICING TIERS ---
  function renderPricingTiers() {
    const container = document.getElementById('pricingTiersEditor');
    container.innerHTML = '';
    (content.pricing?.tiers || []).forEach((tier, i) => {
      const card = document.createElement('div');
      card.className = 'tier-card';
      card.innerHTML = `
        <div class="tier-card-header">
          <span class="tier-card-title">${tier.name}${tier.featured ? ' ★' : ''}</span>
          ${tier.featured ? '<span class="tier-featured-badge">Featured</span>' : ''}
        </div>
        <div class="tier-fields">
          <div class="field-group">
            <label class="field-label">Tier Name</label>
            <input type="text" class="field-input" value="${tier.name}" data-tier="${i}" data-field="name">
          </div>
          <div class="field-group">
            <label class="field-label">Price</label>
            <input type="text" class="field-input" value="${tier.price}" data-tier="${i}" data-field="price">
          </div>
          <div class="field-group">
            <label class="field-label">Per Label</label>
            <input type="text" class="field-input" value="${tier.per}" data-tier="${i}" data-field="per" placeholder="e.g. /person">
          </div>
          <div class="field-group">
            <label class="field-label">Button Text</label>
            <input type="text" class="field-input" value="${tier.buttonText}" data-tier="${i}" data-field="buttonText">
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Features</label>
          <div class="tier-features-list">
            ${tier.features.map((f, fi) => `
              <div class="tier-feature-row">
                <input type="text" value="${f}" data-tier="${i}" data-feature="${fi}">
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Bind inputs
      card.querySelectorAll('[data-tier][data-field]').forEach(input => {
        input.addEventListener('input', () => {
          content.pricing.tiers[parseInt(input.dataset.tier)][input.dataset.field] = input.value;
        });
      });

      card.querySelectorAll('[data-tier][data-feature]').forEach(input => {
        input.addEventListener('input', () => {
          content.pricing.tiers[parseInt(input.dataset.tier)].features[parseInt(input.dataset.feature)] = input.value;
        });
      });

      container.appendChild(card);
    });
  }

  // --- ADDONS ---
  function renderAddons() {
    const container = document.getElementById('addonsEditor');
    container.innerHTML = '';
    (content.pricing?.addons || []).forEach((addon, i) => {
      const card = document.createElement('div');
      card.className = 'addon-card';
      card.innerHTML = `
        <div class="tier-fields">
          <div class="field-group">
            <label class="field-label">Name</label>
            <input type="text" class="field-input" value="${addon.name}" data-addon="${i}" data-field="name">
          </div>
          <div class="field-group">
            <label class="field-label">Detail</label>
            <input type="text" class="field-input" value="${addon.detail}" data-addon="${i}" data-field="detail">
          </div>
        </div>
      `;

      card.querySelectorAll('[data-addon][data-field]').forEach(input => {
        input.addEventListener('input', () => {
          content.pricing.addons[parseInt(input.dataset.addon)][input.dataset.field] = input.value;
        });
      });

      container.appendChild(card);
    });
  }

  // --- PROCESS ---
  function renderProcess() {
    const container = document.getElementById('processEditor');
    container.innerHTML = '';
    (content.process || []).forEach((step, i) => {
      const card = document.createElement('div');
      card.className = 'process-card';
      card.innerHTML = `
        <div class="tier-fields">
          <div class="field-group">
            <label class="field-label">Step Number</label>
            <input type="text" class="field-input" value="${step.number}" data-process="${i}" data-field="number">
          </div>
          <div class="field-group">
            <label class="field-label">Title</label>
            <input type="text" class="field-input" value="${step.title}" data-process="${i}" data-field="title">
          </div>
        </div>
        <div class="field-group" style="margin-top: 0.8rem;">
          <label class="field-label">Description</label>
          <input type="text" class="field-input" value="${step.desc}" data-process="${i}" data-field="desc">
        </div>
      `;

      card.querySelectorAll('[data-process][data-field]').forEach(input => {
        input.addEventListener('input', () => {
          content.process[parseInt(input.dataset.process)][input.dataset.field] = input.value;
        });
      });

      container.appendChild(card);
    });
  }

  // --- SAVE ---
  const saveStatus = document.getElementById('saveStatus');

  window.saveContent = async function () {
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        },
        body: JSON.stringify(content)
      });
      if (res.ok) {
        showSaveStatus('✓ Saved');
      } else {
        showSaveStatus('✕ Save failed');
      }
    } catch {
      showSaveStatus('✕ Connection error');
    }
  };

  function showSaveStatus(msg) {
    saveStatus.textContent = msg;
    saveStatus.classList.add('visible');
    setTimeout(() => saveStatus.classList.remove('visible'), 3000);
  }
})();
