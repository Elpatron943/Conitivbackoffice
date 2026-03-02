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

  const METRIQUES_IDS = ['metriqueCA', 'metriqueEffectif', 'metriqueFournisseursTotal', 'metriqueFournisseursCritiques', 'metriqueBudgetIT', 'metriqueETPRisque', 'metriqueTauxCouverture', 'metriqueImpactEstime', 'metriqueBudgetProjet'];

  let currentCrmActionsCreated = {};

  function collectFormState() {
    const state = { prospect: {}, notes: {}, checkboxes: {}, radios: {}, questions: {}, metriques: {}, datesNext: {}, crmActionsCreated: currentCrmActionsCreated };
    const prospectNom = document.getElementById('prospectNom');
    const prospectContact = document.getElementById('prospectContact');
    const prospectDate = document.getElementById('prospectDate');
    const prospectRdv = document.getElementById('prospectRdv');
    if (prospectNom) state.prospect.nom = prospectNom.value;
    if (prospectContact) state.prospect.contact = prospectContact.value;
    if (prospectDate) state.prospect.date = prospectDate.value;
    if (prospectRdv) state.prospect.rdv = prospectRdv.value;
    const filterRisques = getSelectedFilterRisques();
    state.prospect.risque = filterRisques.length > 0 ? filterRisques[0] : '';
    const prospectFields = ['direction', 'secteur', 'industrie', 'modele', 'presence', 'enjeux', 'structure', 'siege', 'fonctions', 'pilotage', 'reporting', 'outils'];
    prospectFields.forEach(f => {
      const el = document.getElementById('prospect' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el) state.prospect[f] = el.value;
    });

    ['notesRdv1', 'notesRdv2', 'notesRdv3', 'notesRdv4', 'notesRdv5'].forEach(id => {
      const el = document.getElementById(id);
      if (el) state.notes[id] = el.value;
    });
    const actionsCommunes = document.getElementById('actionsCommunes');
    if (actionsCommunes) state.actionsCommunes = actionsCommunes.value;

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

    METRIQUES_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value !== '') state.metriques[id] = el.value;
    });

    ['dateNext1', 'dateNext2', 'dateNext3', 'dateNext4', 'dateNext5'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value) state.datesNext[id] = el.value;
    });

    return state;
  }

  function applyFormState(state) {
    if (!state) return;
    if (state.prospect) {
      const prospectMap = { nom: 'prospectNom', contact: 'prospectContact', date: 'prospectDate', rdv: 'prospectRdv', direction: 'prospectDirection', secteur: 'prospectSecteur', industrie: 'prospectIndustrie', modele: 'prospectModele', presence: 'prospectPresence', enjeux: 'prospectEnjeux', structure: 'prospectStructure', siege: 'prospectSiege', fonctions: 'prospectFonctions', pilotage: 'prospectPilotage', reporting: 'prospectReporting', outils: 'prospectOutils' };
      Object.entries(prospectMap).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = state.prospect[key] || '';
      });
      if (state.prospect.risque) setFilterRisqueCheckboxes(state.prospect.risque);
    }
    if (state.notes) {
      Object.entries(state.notes).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      });
    }
    const actionsEl = document.getElementById('actionsCommunes');
    if (actionsEl && state.actionsCommunes !== undefined) actionsEl.value = state.actionsCommunes || '';
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
    if (state.metriques) {
      Object.entries(state.metriques).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });
    }
    if (state.datesNext) {
      Object.entries(state.datesNext).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      });
    }
    currentCrmActionsCreated = state.crmActionsCreated || {};
    updateQuestionVisibility();
  }

  function setFilterRisqueCheckboxes(risque) {
    document.querySelectorAll('input[name="filterRisque"]').forEach(cb => {
      cb.checked = (cb.value === risque);
    });
    updateRisqueReadonly();
  }

  function updateRisqueReadonly() {
    const el = document.getElementById('risqueReadonly');
    if (!el) return;
    const risques = getSelectedFilterRisques();
    if (risques.length === 0) {
      el.textContent = 'Cochez un ou plusieurs risques dans les filtres ci-dessus';
      el.classList.remove('risque-readonly--set');
    } else {
      el.textContent = risques.map(r => getRisqueLabel(r)).join(', ');
      el.classList.add('risque-readonly--set');
    }
  }

  function getSelectedFilterRisques() {
    return Array.from(document.querySelectorAll('input[name="filterRisque"]:checked')).map(el => el.value);
  }

  function getSelectedFilterDirections() {
    return Array.from(document.querySelectorAll('input[name="filterDirection"]:checked')).map(el => el.value);
  }

  function getClientOptions() {
    const clients = getClients();
    const filterRisques = getSelectedFilterRisques();
    const filterDirections = getSelectedFilterDirections();
    const filteredClients = clients.filter(c => {
      const matchRisque = filterRisques.length === 0 || filterRisques.includes(c.risque || '');
      const matchDirection = filterDirections.length === 0 || filterDirections.includes(c.direction || '');
      return matchRisque && matchDirection;
    });
    const clientIds = new Set(clients.map(c => c.id));
    const options = filteredClients.map(c => {
      const badges = [];
      if (c.risque) badges.push(getRisqueLabel(c.risque));
      if (c.direction) badges.push(getDirectionLabel(c.direction));
      const suffix = badges.length ? ` (${badges.join(', ')})` : '';
      return { value: c.id, label: c.name + suffix, source: 'processus' };
    });
    if (typeof ConitivCRM !== 'undefined') {
      const entreprises = ConitivCRM.getEntreprises();
      entreprises.forEach(e => {
        const slug = slugify(e.nom || '');
        if (!slug || clientIds.has(slug)) return;
        options.push({ value: 'crm_' + e.id, label: (e.nom || 'Sans nom'), source: 'crm', entreprise: e });
      });
    }
    return options;
  }

  function refreshClientCombobox() {
    const searchEl = document.getElementById('clientSearch');
    const hiddenEl = document.getElementById('clientSelect');
    if (!searchEl || !hiddenEl) return;
    const opts = getClientOptions();
    const current = hiddenEl.value;
    const opt = opts.find(o => o.value === current || (o.source === 'processus' && o.value === current));
    searchEl.value = opt ? opt.label : '';
  }

  function initClientCombobox() {
    const searchEl = document.getElementById('clientSearch');
    const hiddenEl = document.getElementById('clientSelect');
    const listEl = document.getElementById('clientList');
    if (!searchEl || !hiddenEl || !listEl) return;
    if (searchEl.dataset.comboboxInit) return;
    searchEl.dataset.comboboxInit = '1';

    function showList() {
      const q = (searchEl.value || '').toLowerCase().trim();
      const opts = getClientOptions();
      const filtered = q ? opts.filter(o => (o.label || '').toLowerCase().includes(q)) : opts;
      const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      listEl.innerHTML = filtered.slice(0, 60).map(o => {
        const badge = o.source === 'crm' ? ' <span class="client-combobox-crm-badge">(CRM)</span>' : '';
        return `<li data-value="${esc(o.value)}" data-label="${esc(o.label)}" data-source="${o.source || ''}">${esc(o.label)}${badge}</li>`;
      }).join('');
      listEl.classList.add('client-combobox-list--open');
      listEl.querySelectorAll('li').forEach(li => {
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const val = li.dataset.value || '';
          const src = li.dataset.source || '';
          hiddenEl.value = val;
          searchEl.value = li.dataset.label || '';
          listEl.classList.remove('client-combobox-list--open');
          if (src === 'crm' && val.startsWith('crm_')) {
            const entrepriseId = val.slice(4);
            const entreprises = typeof ConitivCRM !== 'undefined' ? ConitivCRM.getEntreprises() : [];
            const ent = entreprises.find(e => e.id === entrepriseId);
            if (ent) {
              const id = slugify(ent.nom || '');
              const clients = getClients();
              if (!clients.some(c => c.id === id)) {
                clients.push({ id, name: ent.nom || 'Sans nom' });
                saveClients(clients);
              }
              hiddenEl.value = id;
              clearForm();
              const p = document.getElementById('prospectNom');
              if (p) p.value = ent.nom || '';
              load(id);
              showToast('Client créé à partir du CRM. Remplissez la fiche et enregistrez.');
            }
          } else {
            load(val);
          }
        });
      });
    }

    function hideList() {
      setTimeout(() => listEl.classList.remove('client-combobox-list--open'), 150);
    }

    searchEl.addEventListener('focus', showList);
    searchEl.addEventListener('input', showList);
    searchEl.addEventListener('blur', hideList);
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { searchEl.blur(); listEl.classList.remove('client-combobox-list--open'); }
    });
  }

  function updateQuestionVisibility() {
    const filterRisques = getSelectedFilterRisques();
    const filterDirections = getSelectedFilterDirections();
    const prospectDirection = document.getElementById('prospectDirection')?.value || '';
    const riskContext = filterRisques;
    const directionContext = filterDirections.length > 0 ? filterDirections : (prospectDirection ? [prospectDirection] : []);
    document.querySelectorAll('.question-block[data-risque], .question-block[data-direction]').forEach(block => {
      const blockRisque = block.dataset.risque || '';
      const blockDirection = block.dataset.direction || '';
      const matchRisque = !blockRisque ||
        riskContext.includes(blockRisque) ||
        (riskContext.includes('consolide') && ['cyber', 'esg', 'rgpd', 'defaillance'].includes(blockRisque));
      const matchDirection = !blockDirection || directionContext.includes(blockDirection);
      block.style.display = (matchRisque && matchDirection) ? '' : 'none';
    });
  }

  function getRisqueLabel(v) {
    const map = { cyber: 'Cyber', esg: 'ESG', rgpd: 'RGPD', defaillance: 'Défaillance', consolide: 'Consolidé' };
    return map[v] || v;
  }

  function getDirectionLabel(v) {
    const map = { it: 'IT', finance: 'Finance', achats: 'Achats', risk: 'Risk', juridique: 'Juridique', rssi: 'RSSI', direction: 'Dir.', autre: 'Autre' };
    return map[v] || v;
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
      const clients = getClients();
      const client = clients.find(c => c.id === clientId);
      if (client && state.prospect) {
        client.risque = state.prospect.risque || '';
        client.direction = state.prospect.direction || '';
        saveClients(clients);
      }
      if (!silent && client) {
        showToast('Fiche enregistrée pour ' + client.name + '.');
      }
    } catch (e) {
      showToast('Erreur lors de l\'enregistrement.', 'error');
    }
  }

  function load(clientId) {
    if (!clientId) {
      currentCrmActionsCreated = {};
      applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {}, metriques: {}, actionsCommunes: '', datesNext: {} });
      document.querySelectorAll('input[name="filterRisque"]').forEach(cb => { cb.checked = false; });
      updateRisqueReadonly();
      updateQuestionVisibility();
      return;
    }
    try {
      const raw = localStorage.getItem(clientPrefix + clientId);
      if (raw) applyFormState(JSON.parse(raw));
      else applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {}, metriques: {}, actionsCommunes: '', datesNext: {} });
    } catch (e) {
      console.warn('Chargement impossible:', e);
    }
  }

  function clearForm() {
    currentCrmActionsCreated = {};
    applyFormState({ prospect: {}, notes: {}, questions: {}, checkboxes: {}, radios: {}, metriques: {}, actionsCommunes: '', datesNext: {} });
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
        refreshClientCombobox();
        load(id);
        return;
      }
      clients.push({ id, name: name.trim() });
      saveClients(clients);
      document.getElementById('clientSelect').value = id;
      refreshClientCombobox();
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
      document.getElementById('clientSelect').value = '';
      refreshClientCombobox();
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

  function getSelectLabel(id) {
    const el = document.getElementById(id);
    if (!el || el.tagName !== 'SELECT') return '';
    const opt = el.options[el.selectedIndex];
    return opt ? opt.text : '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function downloadSynthese() {
    const clientId = getCurrentClientId();
    if (!clientId) {
      showToast('Sélectionnez un client pour générer la synthèse.', 'warning');
      return;
    }
    save(true);
    const state = collectFormState();
    const nom = state.prospect?.nom || 'Client';
    const dateStr = state.prospect?.date ? new Date(state.prospect.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

    const metriquesLabels = {
      metriqueCA: 'CA annuel (M€)',
      metriqueEffectif: 'Effectif',
      metriqueFournisseursTotal: 'Nb. fournisseurs tiers',
      metriqueFournisseursCritiques: 'Nb. fournisseurs critiques',
      metriqueBudgetIT: 'Budget IT / cyber (k€)',
      metriqueETPRisque: 'ETP risque fournisseur',
      metriqueTauxCouverture: 'Taux fournisseurs suivis (%)',
      metriqueImpactEstime: 'Impact incident estimé (k€)',
      metriqueBudgetProjet: 'Budget projet envisagé (k€)'
    };

    let metriquesHtml = '';
    METRIQUES_IDS.forEach(id => {
      const val = state.metriques?.[id];
      if (val !== undefined && val !== '') {
        metriquesHtml += `<tr><td>${metriquesLabels[id] || id}</td><td>${val}</td></tr>`;
      }
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Synthèse — ${escapeHtml(nom)} | Conitiv</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; color: #0d47a1; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.35rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #555; width: 45%; }
    .section { margin-bottom: 1.5rem; }
    .notes { background: #f8f9fa; padding: 1rem; border-radius: 6px; white-space: pre-wrap; font-size: 0.9rem; }
    .actions { background: #e3f2fd; padding: 1rem; border-radius: 6px; border-left: 4px solid #0d47a1; white-space: pre-wrap; font-size: 0.95rem; }
    .footer { margin-top: 2rem; font-size: 0.8rem; color: #888; }
    @media print { body { padding: 1rem; } .section { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>Synthèse — Risque fournisseurs tiers / TPRM</h1>
  <p class="meta">${escapeHtml(nom)} — ${escapeHtml(state.prospect?.contact || '')} — ${dateStr}</p>
  ${(state.prospect?.risque || state.prospect?.direction) ? `<p class="meta">Risque : ${escapeHtml(getRisqueLabel(state.prospect.risque))} | Direction : ${escapeHtml(getDirectionLabel(state.prospect.direction))}</p>` : ''}

  <div class="section">
    <h2>Activité</h2>
    <table>
      <tr><th>Secteur</th><td>${escapeHtml(getSelectLabel('prospectSecteur') || state.prospect?.secteur || '—')}</td></tr>
      <tr><th>Industrie / métier</th><td>${escapeHtml(state.prospect?.industrie || '—')}</td></tr>
      <tr><th>Modèle</th><td>${escapeHtml(getSelectLabel('prospectModele') || state.prospect?.modele || '—')}</td></tr>
      <tr><th>Présence</th><td>${escapeHtml(state.prospect?.presence || '—')}</td></tr>
      <tr><th>Enjeux réglementaires</th><td>${escapeHtml(state.prospect?.enjeux || '—')}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Organisation</h2>
    <table>
      <tr><th>Structure</th><td>${escapeHtml(getSelectLabel('prospectStructure') || state.prospect?.structure || '—')}</td></tr>
      <tr><th>Siège / périmètre</th><td>${escapeHtml(state.prospect?.siege || '—')}</td></tr>
      <tr><th>Fonctions impliquées</th><td>${escapeHtml(state.prospect?.fonctions || '—')}</td></tr>
      <tr><th>Pilotage risque tiers</th><td>${escapeHtml(state.prospect?.pilotage || '—')}</td></tr>
      <tr><th>Outils actuels</th><td>${escapeHtml(state.prospect?.outils || '—')}</td></tr>
    </table>
  </div>

  ${metriquesHtml ? `<div class="section"><h2>Données quantitatives</h2><table>${metriquesHtml}</table></div>` : ''}

  <div class="section">
    <h2>Synthèse des échanges</h2>
    ${['notesRdv1','notesRdv2','notesRdv3','notesRdv4','notesRdv5'].map((id, i) => {
      const v = state.notes?.[id];
      if (!v || !v.trim()) return '';
      const t = ['Exploration', 'Déconstruction', 'Pouvoir & budget', 'Justification exécutive', 'Closing'][i];
      return `<p><strong>RDV ${i + 1} — ${t}</strong></p><div class="notes">${escapeHtml(v)}</div>`;
    }).filter(Boolean).join('') || '<p>—</p>'}
  </div>

  <div class="section">
    <h2>Actions mutuelles par RDV</h2>
    ${[1,2,3,4,5].map(rdv => {
      const vendeurChecked = Object.entries(state.checkboxes || {}).filter(([k,v]) => k.startsWith('vendeur' + rdv) && v).map(([k]) => k);
      const clientChecked = Object.entries(state.checkboxes || {}).filter(([k,v]) => k.startsWith('client' + rdv) && v).map(([k]) => k);
      const dateNext = state.datesNext?.['dateNext' + rdv];
      if (vendeurChecked.length === 0 && clientChecked.length === 0 && !dateNext) return '';
      const labels = { vendeur1a:'Envoyer compte-rendu', vendeur1b:'Envoyer documentation / présentation', vendeur1c:'Impliquer un autre interlocuteur',
        vendeur2a:'Organiser démo / POC', vendeur2b:'Envoyer étude de cas / référence',
        vendeur3a:'Organiser rencontre avec décideur', vendeur3b:'Préparer business case / ROI', vendeur3c:'Rassurer les parties prenantes',
        vendeur4a:'Envoyer proposition commerciale', vendeur4b:'Répondre aux objections',
        vendeur5a:'Planifier kick-off projet',
        client1a:'Fournir liste fournisseurs / périmètre',
        client2a:'Valider critères de décision', client2b:'Fournir données pour chiffrage',
        client3a:'Valider budget / process achats',
        client4a:'Passer par achats / juridique', client4b:'Valider périmètre final',
        client5a:'Signer le contrat', client5b:'Finaliser conditions' };
      const vItems = vendeurChecked.map(id => labels[id] || id);
      const cItems = clientChecked.map(id => labels[id] || id);
      const parts = [];
      if (vItems.length) parts.push('Vendeur: ' + vItems.join(' • '));
      if (cItems.length) parts.push('Client: ' + cItems.join(' • '));
      return `<p><strong>RDV ${rdv}</strong>${parts.length ? ': ' + parts.join(' — ') : ''}${dateNext ? ' — Prochaine étape: ' + dateNext : ''}</p>`;
    }).filter(Boolean).join('') || '<p>—</p>'}
  </div>

  <div class="section">
    <h2>Actions communes / Prochaines étapes</h2>
    <div class="actions">${escapeHtml(state.actionsCommunes || 'À définir ensemble.')}</div>
  </div>

  <p class="footer">Document généré par Conitiv — Risk management tiers</p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conitiv-Synthese-${slugify(nom)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Synthèse téléchargée.');
  }

  function init() {
    initClientCombobox();
    refreshClientCombobox();
    const clientId = getCurrentClientId();
    if (clientId) load(clientId);
    else { updateQuestionVisibility(); updateRisqueReadonly(); }
    document.getElementById('filterRisqueGroup')?.addEventListener('change', () => {
      refreshClientCombobox();
      updateQuestionVisibility();
      updateRisqueReadonly();
    });
    document.getElementById('filterDirectionGroup')?.addEventListener('change', () => {
      refreshClientCombobox();
      updateQuestionVisibility();
    });
    document.getElementById('prospectDirection')?.addEventListener('change', updateQuestionVisibility);
    document.getElementById('btnNewClient')?.addEventListener('click', newClient);
    document.getElementById('btnDeleteClient')?.addEventListener('click', deleteClient);
    document.getElementById('btnSave')?.addEventListener('click', () => save(false));
    document.getElementById('btnDownloadSynthese')?.addEventListener('click', downloadSynthese);
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

    document.querySelectorAll('input[data-crm-label]').forEach(cb => {
      cb.addEventListener('change', function () {
        if (!this.checked) return;
        const clientId = getCurrentClientId();
        if (!clientId) {
          showToast('Sélectionnez ou créez un client pour créer une action CRM.', 'warning');
          return;
        }
        if (currentCrmActionsCreated[this.id]) return;
        const nom = (document.getElementById('prospectNom')?.value || '').trim();
        if (!nom) {
          showToast('Indiquez le nom du prospect pour créer une action CRM.', 'warning');
          return;
        }
        if (typeof ConitivCRM === 'undefined') {
          showToast('CRM non chargé.', 'error');
          return;
        }
        const label = this.dataset.crmLabel || this.id;
        let entrepriseId = ConitivCRM.getEntreprises().find(e => (e.nom || '').toLowerCase().trim() === nom.toLowerCase())?.id;
        if (!entrepriseId) entrepriseId = ConitivCRM.addEntreprise({ nom });
        const actionId = ConitivCRM.addAction({
          type: 'rdv',
          sujet: label,
          entrepriseId,
          statut: 'a_faire',
          date: new Date().toISOString().slice(0, 10)
        });
        currentCrmActionsCreated[this.id] = actionId;
        save(true);
        showToast('Action CRM créée : ' + label);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
