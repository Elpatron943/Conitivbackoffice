/**
 * Conitiv — Processus de vente MEDDIC
 * Sauvegarde par client
 */

(function () {
  const CLIENTS_KEY = 'conitiv_clients';
  const clientPrefix = 'conitiv_client_';

  function slugify(str) {
    return (str || '').toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client-' + Date.now();
  }

  function getClients() {
    try {
      const raw = localStorage.getItem(CLIENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveClients(clients) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }

  function getCurrentClientId() {
    const sel = document.getElementById('clientSelect');
    return sel?.value || '';
  }

  function collectFormState() {
    const state = { prospect: {}, notes: {}, checkboxes: {}, radios: {}, questions: {} };
    const prospectNom = document.getElementById('prospectNom');
    const prospectContact = document.getElementById('prospectContact');
    const prospectDate = document.getElementById('prospectDate');
    const prospectRdv = document.getElementById('prospectRdv');
    if (prospectNom) state.prospect.nom = prospectNom.value;
    if (prospectContact) state.prospect.contact = prospectContact.value;
    if (prospectDate) state.prospect.date = prospectDate.value;
    if (prospectRdv) state.prospect.rdv = prospectRdv.value;

    ['notesRdv1', 'notesRdv2', 'notesRdv3', 'notesRdv4', 'notesRdv5'].forEach(id => {
      const el = document.getElementById(id);
      if (el) state.notes[id] = el.value;
    });

    document.querySelectorAll('.question-champ').forEach(el => {
      const key = el.dataset.q;
      if (key) state.questions[key] = el.value;
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
      if (el.id) state.checkboxes[el.id] = el.checked;
    });

    document.querySelectorAll('input[type="radio"]:checked').forEach(el => {
      if (el.name) state.radios[el.name] = el.value;
    });

    return state;
  }

  function applyFormState(state) {
    if (!state) return;
    if (state.prospect) {
      const p = document.getElementById('prospectNom');
      if (p) p.value = state.prospect.nom || '';
      const c = document.getElementById('prospectContact');
      if (c) c.value = state.prospect.contact || '';
      const d = document.getElementById('prospectDate');
      if (d) d.value = state.prospect.date || '';
      const r = document.getElementById('prospectRdv');
      if (r) r.value = state.prospect.rdv || '1';
    }
    if (state.notes) {
      Object.entries(state.notes).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      });
    }
    if (state.questions) {
      Object.entries(state.questions).forEach(([key, val]) => {
        const el = document.querySelector(`.question-champ[data-q="${key}"]`);
        if (el) el.value = val || '';
      });
    }
    if (state.checkboxes) {
      Object.entries(state.checkboxes).forEach(([key, checked]) => {
        const el = document.getElementById(key);
        if (el) el.checked = checked;
      });
    }
    if (state.radios) {
      Object.entries(state.radios).forEach(([name, value]) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (el) el.checked = true;
      });
    }
  }

  function refreshClientSelect() {
    const sel = document.getElementById('clientSelect');
    if (!sel) return;
    const clients = getClients();
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Choisir ou créer --</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (current && clients.some(c => c.id === current)) sel.value = current;
  }

  function save(silent) {
    const clientId = getCurrentClientId();
    if (!clientId) {
      if (!silent) showToast('Sélectionnez ou créez un client pour enregistrer.', 'warning');
      return;
    }
    try {
      const state = collectFormState();
      localStorage.setItem(clientPrefix + clientId, JSON.stringify(state));
      if (!silent) {
        const clients = getClients();
        const client = clients.find(c => c.id === clientId);
        showToast('Fiche enregistrée' + (client ? ` pour ${client.name}` : '') + '.');
      }
    } catch (e) {
      showToast('Erreur lors de l\'enregistrement.', 'error');
    }
  }

  function load(clientId) {
    if (!clientId) {
      applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {} });
      return;
    }
    try {
      const raw = localStorage.getItem(clientPrefix + clientId);
      if (raw) applyFormState(JSON.parse(raw));
      else applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {} });
    } catch (e) {
      console.warn('Chargement impossible:', e);
    }
  }

  function clearForm() {
    applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {} });
    const r = document.getElementById('prospectRdv');
    if (r) r.value = '1';
  }

  function newClient() {
    showModal({ title: 'Nouveau client', prompt: true, placeholder: 'Nom du client / entreprise' }).then(name => {
      if (!name || !name.trim()) return;
      const id = slugify(name.trim());
      const clients = getClients();
      if (clients.some(c => c.id === id)) {
        showToast('Ce client existe déjà.', 'warning');
        document.getElementById('clientSelect').value = id;
        load(id);
        return;
      }
      clients.push({ id, name: name.trim() });
      saveClients(clients);
      refreshClientSelect();
      document.getElementById('clientSelect').value = id;
      clearForm();
      const p = document.getElementById('prospectNom');
      if (p) p.value = name.trim();
      showToast('Client créé. Remplissez la fiche et enregistrez.');
    });
  }

  function deleteClient() {
    const clientId = getCurrentClientId();
    if (!clientId) {
      showToast('Aucun client sélectionné.');
      return;
    }
    showModal({ title: 'Supprimer le client', message: 'Supprimer ce client et ses données ?' }).then(ok => {
      if (!ok) return;
      const clients = getClients().filter(c => c.id !== clientId);
      saveClients(clients);
      localStorage.removeItem(clientPrefix + clientId);
      refreshClientSelect();
      document.getElementById('clientSelect').value = '';
      clearForm();
      showToast('Client supprimé.');
    });
  }

  function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.className = 'toast-notification';
    toast.style.cssText = 'position:fixed;bottom:1rem;right:1rem;padding:0.5rem 1rem;border-radius:4px;font-size:0.875rem;z-index:9999;';
    toast.style.background = type === 'error' ? '#c62828' : type === 'warning' ? '#f57c00' : '#2e7d32';
    toast.style.color = '#fff';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function showModal(options) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('modalOverlay');
      const titleEl = document.getElementById('modalTitle');
      const bodyEl = document.getElementById('modalBody');
      const actionsEl = document.getElementById('modalActions');
      if (!overlay || !titleEl || !bodyEl || !actionsEl) return resolve(null);

      titleEl.textContent = options.title || '';
      bodyEl.innerHTML = '';

      if (options.prompt) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = options.placeholder || '';
        input.value = options.value || '';
        input.autofocus = true;
        bodyEl.appendChild(input);
        const handleOk = () => {
          closeModal();
          resolve(input.value.trim());
        };
        const handleCancel = () => {
          closeModal();
          resolve(null);
        };
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleOk();
          if (e.key === 'Escape') handleCancel();
        });
        actionsEl.innerHTML = '<button type="button" class="btn btn-secondary" data-action="cancel">Annuler</button><button type="button" class="btn btn-primary" data-action="ok">OK</button>';
        actionsEl.querySelector('[data-action="ok"]').addEventListener('click', handleOk);
        actionsEl.querySelector('[data-action="cancel"]').addEventListener('click', handleCancel);
        setTimeout(() => input.focus(), 50);
      } else {
        const p = document.createElement('p');
        p.textContent = options.message || '';
        bodyEl.appendChild(p);
        actionsEl.innerHTML = '<button type="button" class="btn btn-secondary" data-action="cancel">Annuler</button><button type="button" class="btn btn-primary" data-action="ok">Confirmer</button>';
        actionsEl.querySelector('[data-action="ok"]').addEventListener('click', () => { closeModal(); resolve(true); });
        actionsEl.querySelector('[data-action="cancel"]').addEventListener('click', () => { closeModal(); resolve(false); });
      }

      function closeModal() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
      }

      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      overlay.onclick = (e) => { if (e.target === overlay) closeModal(); resolve(options.prompt ? null : false); };
    });
  }

  function reset() {
    showModal({ title: 'Réinitialiser', message: 'Réinitialiser la fiche du client actuel ?' }).then(ok => {
      if (!ok) return;
      const clientId = getCurrentClientId();
      clearForm();
      if (clientId) localStorage.removeItem(clientPrefix + clientId);
      showToast('Fiche réinitialisée.');
    });
  }

  function init() {
    refreshClientSelect();
    const clientId = getCurrentClientId();
    if (clientId) load(clientId);

    document.getElementById('clientSelect')?.addEventListener('change', function () {
      load(this.value);
    });
    document.getElementById('btnNewClient')?.addEventListener('click', newClient);
    document.getElementById('btnDeleteClient')?.addEventListener('click', deleteClient);
    document.getElementById('btnSave')?.addEventListener('click', () => save(false));
    document.getElementById('btnReset')?.addEventListener('click', reset);

    let saveTimeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => save(true), 800);
    };
    document.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('change', debouncedSave);
      el.addEventListener('input', debouncedSave);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
