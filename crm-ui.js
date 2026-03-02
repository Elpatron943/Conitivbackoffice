/**
 * Conitiv — CRM UI
 */
(function () {
  const { getEntreprises, getEntreprise, addEntreprise, updateEntreprise, deleteEntreprise,
    getContacts, getContact, getContactsByEntreprise, addContact, updateContact, deleteContact,
    getActions, getAction, getActionsByEntreprise, getActionsByContact, getActionsByAffaire,
    addAction, updateAction, deleteAction,
    getAffaires, getAffaire, getAffairesByEntreprise, addAffaire, updateAffaire, deleteAffaire,
    getCampaignTypes, getCampaignType, addCampaignType, updateCampaignType, deleteCampaignType,
    getActionTypes, getWorkflowForCampaign,
    SECTORS, SIZES, AFFAIRE_STAGES, ACTION_TYPES_BASE, ACTION_STATS } = ConitivCRM;

  function isCampaignType(type) {
    return type && (type.startsWith('campagne_') || type === 'linkedin');
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
        btn.classList.add('tab-btn--active');
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.toggle('tab-panel--active', p.id === 'panel-' + tab);
        });
        renderAll();
      });
    });
  }

  function openModal(id) {
    document.getElementById(id).style.display = 'flex';
  }
  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.crm-modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); });
  });

  function fillSelect(id, options, valueKey = 'value', labelKey = 'label') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = options.map(o =>
      `<option value="${o[valueKey]}">${o[labelKey]}</option>`
    ).join('');
  }

  function fillEntrepriseSelects() {
    const ents = getEntreprises();
    fillSelect('filterContactEntreprise', [{ value: '', label: 'Toutes les entreprises' }, ...ents.map(e => ({ value: e.id, label: e.nom || 'Sans nom' }))]);
  }

  function fillContactSelects(entrepriseId) {
    // Options chargées dynamiquement dans les combobox
  }

  function fillAffaireSelects() {
    // Options chargées dynamiquement dans les combobox
  }

  function initCombobox(searchId, hiddenId, listId, getOptions, onSelect) {
    const searchEl = document.getElementById(searchId);
    const hiddenEl = document.getElementById(hiddenId);
    const listEl = document.getElementById(listId);
    if (!searchEl || !hiddenEl || !listEl) return;
    if (searchEl.dataset.comboboxInit) return;
    searchEl.dataset.comboboxInit = '1';

    function showList() {
      const q = (searchEl.value || '').toLowerCase().trim();
      const opts = [{ value: '', label: '— Aucun —' }, ...getOptions()];
      const filtered = q ? opts.filter(o => (o.label || '').toLowerCase().includes(q)) : opts;
      const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      listEl.innerHTML = filtered.slice(0, 50).map(o =>
        `<li data-value="${esc(o.value)}" data-label="${esc(o.label)}">${esc(o.label) || '—'}</li>`
      ).join('');
      listEl.classList.add('crm-combobox-list--open');
      listEl.querySelectorAll('li').forEach(li => {
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          hiddenEl.value = li.dataset.value || '';
          searchEl.value = li.dataset.label || '';
          listEl.classList.remove('crm-combobox-list--open');
          if (onSelect) onSelect(hiddenEl.value);
        });
      });
    }

    function hideList() {
      setTimeout(() => listEl.classList.remove('crm-combobox-list--open'), 150);
    }

    searchEl.addEventListener('focus', showList);
    searchEl.addEventListener('input', showList);
    searchEl.addEventListener('blur', hideList);
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { searchEl.blur(); listEl.classList.remove('crm-combobox-list--open'); }
    });
  }

  function setComboboxValue(searchId, hiddenId, value, getOptions) {
    const searchEl = document.getElementById(searchId);
    const hiddenEl = document.getElementById(hiddenId);
    if (!searchEl || !hiddenEl) return;
    const val = value || '';
    hiddenEl.value = val;
    const opts = typeof getOptions === 'function' ? getOptions() : getOptions;
    const opt = opts.find(o => String(o.value || '') === val);
    searchEl.value = opt ? (opt.label || '') : '';
  }

  function clearCombobox(searchId, hiddenId) {
    const searchEl = document.getElementById(searchId);
    const hiddenEl = document.getElementById(hiddenId);
    if (searchEl) searchEl.value = '';
    if (hiddenEl) hiddenEl.value = '';
  }

  function fillActionStatut(type, selectedValue) {
    const workflow = getWorkflowForCampaign(type);
    const isCampaign = !!workflow;
    const statutGroup = document.getElementById('actStatutGroup');
    const campagneEl = document.getElementById('actCampagneCyberFields');
    const etapeEl = document.getElementById('actCampagneCyberEtape');
    const checkboxWrap = document.getElementById('actEtapeTerminee')?.closest('.form-group');

    if (statutGroup) statutGroup.style.display = isCampaign ? 'none' : '';
    if (campagneEl) campagneEl.style.display = isCampaign ? '' : 'none';
    const hint = document.getElementById('actTypeHint');
    if (hint) hint.style.display = isCampaign ? 'none' : 'block';

    if (isCampaign && etapeEl && workflow.length) {
      const options = workflow.map(w => ({ value: w.id, label: `J${(w.jour || 0) >= 0 ? '+' : ''}${w.jour || 0} — ${w.label}` }));
      const valid = options.some(o => o.value === selectedValue);
      const sel = valid ? selectedValue : workflow[0].id;
      const lastId = workflow[workflow.length - 1]?.id;
      etapeEl.innerHTML = options.map(o => `<option value="${o.value}" ${o.value === sel ? 'selected' : ''}>${o.label}</option>`).join('');
      if (checkboxWrap) checkboxWrap.style.display = sel === lastId ? 'none' : '';
    } else {
      const el = document.getElementById('actStatut');
      if (el) {
        const options = Object.entries(ACTION_STATS).map(([k, v]) => ({ value: k, label: v }));
        const valid = options.some(o => o.value === selectedValue);
        const sel = valid ? selectedValue : 'a_faire';
        el.innerHTML = options.map(o => `<option value="${o.value}" ${o.value === sel ? 'selected' : ''}>${o.label}</option>`).join('');
      }
    }
  }

  function toggleEtapeTermineeCheckbox() {
    const type = document.getElementById('actType').value;
    if (!isCampaignType(type)) return;
    const workflow = getWorkflowForCampaign(type);
    const etape = document.getElementById('actCampagneCyberEtape')?.value;
    const checkboxWrap = document.getElementById('actEtapeTerminee')?.closest('.form-group');
    const lastId = workflow?.length ? workflow[workflow.length - 1]?.id : '';
    if (checkboxWrap) checkboxWrap.style.display = etape === lastId ? 'none' : '';
  }

  function getCampaignEtapeAttendue(dateJ0, workflow) {
    if (!dateJ0 || !workflow?.length) return null;
    const j0 = new Date(dateJ0);
    j0.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jours = Math.floor((today - j0) / 86400000);
    let etape = workflow[0];
    for (const w of workflow) {
      if (jours >= (w.jour || 0)) etape = w;
    }
    return etape;
  }

  // === Entreprises ===
  function renderEntreprises() {
    let list = getEntreprises();
    const search = (document.getElementById('searchEntreprise')?.value || '').toLowerCase().trim();
    const secteur = document.getElementById('filterEntrepriseSecteur')?.value || '';
    const taille = document.getElementById('filterEntrepriseTaille')?.value || '';
    if (search) list = list.filter(e =>
      (e.nom || '').toLowerCase().includes(search) ||
      (e.email || '').toLowerCase().includes(search) ||
      (e.ville || '').toLowerCase().includes(search) ||
      (e.secteur || '').toLowerCase().includes(search)
    );
    if (secteur) list = list.filter(e => e.secteur === secteur);
    if (taille) list = list.filter(e => e.taille === taille);
    const el = document.getElementById('listEntreprises');
    if (list.length === 0) {
      el.innerHTML = '<div class="crm-empty"><p>Aucune entreprise.</p><button type="button" class="btn btn-primary" onclick="document.getElementById(\'btnAddEntreprise\').click()">Ajouter une entreprise</button></div>';
      return;
    }
    el.innerHTML = list.map(e => `
      <div class="crm-card" data-id="${e.id}" data-type="entreprise">
        <div class="crm-card-main">
          <h3>${e.nom || 'Sans nom'}</h3>
          <div class="crm-card-meta">${SECTORS[e.secteur] || e.secteur || '—'} · ${SIZES[e.taille] || e.taille || '—'}${e.ville ? ' · ' + e.ville : ''}</div>
          ${e.email ? `<div class="crm-card-extra">${e.email}</div>` : ''}
        </div>
        <div class="crm-card-actions">
          <button type="button" class="btn btn-secondary btn--small" data-edit="entreprise">Modifier</button>
          <button type="button" class="btn btn-secondary btn--small" data-delete="entreprise">Supprimer</button>
        </div>
      </div>
    `).join('');
    el.querySelectorAll('.crm-card').forEach(card => {
      card.querySelector('[data-edit]')?.addEventListener('click', () => editEntreprise(card.dataset.id));
      card.querySelector('[data-delete]')?.addEventListener('click', () => {
        if (confirm('Supprimer cette entreprise ?')) { deleteEntreprise(card.dataset.id); renderAll(); }
      });
      card.addEventListener('click', (e) => { if (!e.target.closest('button')) editEntreprise(card.dataset.id); });
    });
  }

  function editEntreprise(id) {
    const e = getEntreprise(id);
    if (!e) return;
    document.getElementById('modalEntrepriseTitle').textContent = 'Modifier l\'entreprise';
    document.getElementById('entId').value = e.id;
    document.getElementById('entNom').value = e.nom || '';
    document.getElementById('entSecteur').value = e.secteur || '';
    document.getElementById('entTaille').value = e.taille || '';
    document.getElementById('entSiret').value = e.siret || '';
    document.getElementById('entAdresse').value = e.adresse || '';
    document.getElementById('entVille').value = e.ville || '';
    document.getElementById('entCodePostal').value = e.codePostal || '';
    document.getElementById('entPays').value = e.pays || 'France';
    document.getElementById('entSiteWeb').value = e.siteWeb || '';
    document.getElementById('entEmail').value = e.email || '';
    document.getElementById('entTelephone').value = e.telephone || '';
    document.getElementById('entCa').value = e.ca || '';
    document.getElementById('entEffectif').value = e.effectif || '';
    document.getElementById('entNotes').value = e.notes || '';
    openModal('modalEntreprise');
  }

  document.getElementById('btnAddEntreprise').addEventListener('click', () => {
    document.getElementById('modalEntrepriseTitle').textContent = 'Nouvelle entreprise';
    document.getElementById('formEntreprise').reset();
    document.getElementById('entId').value = '';
    document.getElementById('entPays').value = 'France';
    openModal('modalEntreprise');
  });

  document.getElementById('formEntreprise').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('entId').value;
    const data = {
      nom: document.getElementById('entNom').value,
      secteur: document.getElementById('entSecteur').value,
      taille: document.getElementById('entTaille').value,
      siret: document.getElementById('entSiret').value,
      adresse: document.getElementById('entAdresse').value,
      ville: document.getElementById('entVille').value,
      codePostal: document.getElementById('entCodePostal').value,
      pays: document.getElementById('entPays').value,
      siteWeb: document.getElementById('entSiteWeb').value,
      email: document.getElementById('entEmail').value,
      telephone: document.getElementById('entTelephone').value,
      ca: document.getElementById('entCa').value,
      effectif: document.getElementById('entEffectif').value,
      notes: document.getElementById('entNotes').value
    };
    if (id) updateEntreprise(id, data);
    else addEntreprise(data);
    closeModal('modalEntreprise');
    renderAll();
  });

  // === Contacts ===
  function renderContacts() {
    let list = getContacts();
    const search = (document.getElementById('searchContact')?.value || '').toLowerCase().trim();
    const entrepriseId = document.getElementById('filterContactEntreprise')?.value || '';
    if (search) list = list.filter(c => {
      const full = ((c.prenom || '') + ' ' + (c.nom || '')).toLowerCase();
      return full.includes(search) || (c.email || '').toLowerCase().includes(search) || (c.poste || '').toLowerCase().includes(search);
    });
    if (entrepriseId) list = list.filter(c => c.entrepriseId === entrepriseId);
    const el = document.getElementById('listContacts');
    if (list.length === 0) {
      el.innerHTML = '<div class="crm-empty"><p>Aucun contact.</p></div>';
      return;
    }
    el.innerHTML = list.map(c => {
      const ent = getEntreprise(c.entrepriseId);
      return `
      <div class="crm-card" data-id="${c.id}" data-type="contact">
        <div class="crm-card-main">
          <h3>${(c.prenom + ' ' + c.nom).trim() || 'Sans nom'}</h3>
          <div class="crm-card-meta">${ent ? ent.nom : '—'} · ${c.poste || '—'}</div>
          ${c.email ? `<div class="crm-card-extra">${c.email}</div>` : ''}
        </div>
        <div class="crm-card-actions">
          <button type="button" class="btn btn-secondary btn--small" data-edit="contact">Modifier</button>
          <button type="button" class="btn btn-secondary btn--small" data-delete="contact">Supprimer</button>
        </div>
      </div>
    `}).join('');
    el.querySelectorAll('.crm-card').forEach(card => {
      card.querySelector('[data-edit]')?.addEventListener('click', () => editContact(card.dataset.id));
      card.querySelector('[data-delete]')?.addEventListener('click', () => {
        if (confirm('Supprimer ce contact ?')) { deleteContact(card.dataset.id); renderAll(); }
      });
      card.addEventListener('click', (e) => { if (!e.target.closest('button')) editContact(card.dataset.id); });
    });
  }

  function editContact(id) {
    const c = getContact(id);
    if (!c) return;
    fillEntrepriseSelects();
    document.getElementById('modalContactTitle').textContent = 'Modifier le contact';
    document.getElementById('conId').value = c.id;
    document.getElementById('conPrenom').value = c.prenom || '';
    document.getElementById('conNom').value = c.nom || '';
    setComboboxValue('conEntrepriseSearch', 'conEntrepriseId', c.entrepriseId || '', () =>
      getEntreprises().map(e => ({ value: e.id, label: e.nom || 'Sans nom' }))
    );
    document.getElementById('conPoste').value = c.poste || '';
    document.getElementById('conEmail').value = c.email || '';
    document.getElementById('conTelephone').value = c.telephone || '';
    document.getElementById('conEstDecideur').checked = c.estDecideur || false;
    document.getElementById('conNotes').value = c.notes || '';
    openModal('modalContact');
  }

  document.getElementById('btnAddContact').addEventListener('click', () => {
    fillEntrepriseSelects();
    document.getElementById('modalContactTitle').textContent = 'Nouveau contact';
    document.getElementById('formContact').reset();
    document.getElementById('conId').value = '';
    clearCombobox('conEntrepriseSearch', 'conEntrepriseId');
    openModal('modalContact');
  });

  document.getElementById('formContact').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('conId').value;
    const data = {
      prenom: document.getElementById('conPrenom').value,
      nom: document.getElementById('conNom').value,
      entrepriseId: document.getElementById('conEntrepriseId')?.value || '',
      poste: document.getElementById('conPoste').value,
      email: document.getElementById('conEmail').value,
      telephone: document.getElementById('conTelephone').value,
      estDecideur: document.getElementById('conEstDecideur').checked,
      notes: document.getElementById('conNotes').value
    };
    if (id) updateContact(id, data);
    else addContact(data);
    closeModal('modalContact');
    renderAll();
  });

  // === Actions ===
  function renderActions() {
    let list = getActions();
    const search = (document.getElementById('searchAction')?.value || '').toLowerCase().trim();
    const typeFilter = document.getElementById('filterActionType')?.value || '';
    const statutFilter = document.getElementById('filterActionStatut')?.value || '';
    if (search) list = list.filter(a =>
      (a.sujet || '').toLowerCase().includes(search) ||
      (a.description || '').toLowerCase().includes(search)
    );
    if (typeFilter) list = list.filter(a => a.type === typeFilter);
    if (statutFilter) list = list.filter(a => a.statut === statutFilter);
    const el = document.getElementById('listActions');
    if (list.length === 0) {
      el.innerHTML = '<div class="crm-empty"><p>Aucune action.</p></div>';
      return;
    }
    el.innerHTML = list.map(a => {
      const ent = getEntreprise(a.entrepriseId);
      const con = getContact(a.contactId);
      const workflow = getWorkflowForCampaign(a.type);
      const isCampaign = !!workflow;
      const statut = isCampaign
        ? (workflow.find(w => w.id === a.statut)?.label || a.statut)
        : (ACTION_STATS[a.statut] || a.statut);
      const date = a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—';
      const etapeAttendue = isCampaign && a.dateJ0 ? getCampaignEtapeAttendue(a.dateJ0, workflow) : null;
      const typeLabel = getActionTypes().find(t => t.value === a.type)?.label || a.type;
      const stepDoneBadge = isCampaign && a.stepDone ? '<span class="badge badge--done">✓ Terminé</span>' : '';
      const workflowInfo = isCampaign && etapeAttendue
        ? `<div class="crm-card-workflow">Étape actuelle : ${statut}${etapeAttendue.id !== a.statut ? ' · Attendu : ' + etapeAttendue.label : ''} ${stepDoneBadge}</div>`
        : (isCampaign && a.stepDone ? `<div class="crm-card-workflow">${stepDoneBadge}</div>` : '');
      return `
      <div class="crm-card" data-id="${a.id}" data-type="action">
        <div class="crm-card-main">
          <h3>${a.sujet || 'Sans sujet'}</h3>
          <div class="crm-card-meta">${typeLabel} · ${statut} · ${date}</div>
          ${workflowInfo}
          <div class="crm-card-extra">${ent ? ent.nom : ''}${con ? ' · ' + (con.prenom + ' ' + con.nom).trim() : ''}</div>
        </div>
        <div class="crm-card-actions">
          <button type="button" class="btn btn-secondary btn--small" data-edit="action">Modifier</button>
          <button type="button" class="btn btn-secondary btn--small" data-delete="action">Supprimer</button>
        </div>
      </div>
    `}).join('');
    el.querySelectorAll('.crm-card').forEach(card => {
      card.querySelector('[data-edit]')?.addEventListener('click', () => editAction(card.dataset.id));
      card.querySelector('[data-delete]')?.addEventListener('click', () => {
        if (confirm('Supprimer cette action ?')) { deleteAction(card.dataset.id); renderAll(); }
      });
      card.addEventListener('click', (e) => { if (!e.target.closest('button')) editAction(card.dataset.id); });
    });
  }

  function editAction(id) {
    const a = getAction(id);
    if (!a) return;
    fillEntrepriseSelects();
    fillContactSelects();
    fillAffaireSelects();
    const typeEntries = getActionTypes();
    document.getElementById('actType').innerHTML = typeEntries.map(t =>
      `<option value="${t.value}" ${a.type === t.value ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    const type = a.type || 'appel';
    const workflow = getWorkflowForCampaign(type);
    fillActionStatut(type, a.statut || (workflow?.length ? workflow[0].id : 'a_faire'));
    document.getElementById('modalActionTitle').textContent = isCampaignType(type) ? 'Modifier la campagne' : 'Modifier l\'action';
    document.getElementById('actId').value = a.id;
    document.getElementById('actType').value = type;
    document.getElementById('actDate').value = a.date || '';
    document.getElementById('actEcheance').value = a.echeance || '';
    document.getElementById('actDateJ0').value = a.dateJ0 || '';
    document.getElementById('actEtapeTerminee').checked = !!a.stepDone;
    document.getElementById('actSujet').value = a.sujet || '';
    document.getElementById('actDescription').value = a.description || '';
    setComboboxValue('actEntrepriseSearch', 'actEntrepriseId', a.entrepriseId || '', () =>
      getEntreprises().map(e => ({ value: e.id, label: e.nom || 'Sans nom' }))
    );
    setComboboxValue('actContactSearch', 'actContactId', a.contactId || '', () =>
      getContacts().map(c => ({ value: c.id, label: (c.prenom + ' ' + c.nom).trim() || c.email || 'Sans nom' }))
    );
    setComboboxValue('actAffaireSearch', 'actAffaireId', a.affaireId || '', () =>
      getAffaires().map(aa => ({ value: aa.id, label: aa.nom || 'Sans nom' }))
    );
    openModal('modalAction');
  }

  document.getElementById('btnAddAction').addEventListener('click', () => {
    fillEntrepriseSelects();
    fillContactSelects();
    fillAffaireSelects();
    const typeEntries = getActionTypes();
    document.getElementById('actType').innerHTML = typeEntries.map(t =>
      `<option value="${t.value}">${t.label}</option>`
    ).join('');
    document.getElementById('modalActionTitle').textContent = 'Nouvelle action';
    document.getElementById('formAction').reset();
    document.getElementById('actId').value = '';
    document.getElementById('actType').value = 'appel';
    document.getElementById('actDate').value = new Date().toISOString().slice(0, 10);
    clearCombobox('actEntrepriseSearch', 'actEntrepriseId');
    clearCombobox('actContactSearch', 'actContactId');
    clearCombobox('actAffaireSearch', 'actAffaireId');
    fillActionStatut('appel', 'a_faire');
    openModal('modalAction');
  });

  document.getElementById('btnAddCampaign')?.addEventListener('change', (e) => {
    const campaignId = e.target.value;
    if (!campaignId) return;
    e.target.value = '';
    fillEntrepriseSelects();
    fillContactSelects();
    fillAffaireSelects();
    const typeEntries = getActionTypes();
    document.getElementById('actType').innerHTML = typeEntries.map(t =>
      `<option value="${t.value}">${t.label}</option>`
    ).join('');
    document.getElementById('modalActionTitle').textContent = 'Nouvelle campagne';
    document.getElementById('formAction').reset();
    document.getElementById('actId').value = '';
    document.getElementById('actType').value = campaignId;
    document.getElementById('actDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('actDateJ0').value = new Date().toISOString().slice(0, 10);
    clearCombobox('actEntrepriseSearch', 'actEntrepriseId');
    clearCombobox('actContactSearch', 'actContactId');
    clearCombobox('actAffaireSearch', 'actAffaireId');
    const wf = getWorkflowForCampaign(campaignId);
    fillActionStatut(campaignId, wf?.length ? wf[0].id : 'preparation');
    openModal('modalAction');
  });

  document.getElementById('actType')?.addEventListener('change', () => {
    const type = document.getElementById('actType').value;
    const currentStatut = isCampaignType(type)
      ? document.getElementById('actCampagneCyberEtape')?.value
      : document.getElementById('actStatut').value;
    fillActionStatut(type, currentStatut);
    if (isCampaignType(type) && !document.getElementById('actDateJ0').value) {
      document.getElementById('actDateJ0').value = new Date().toISOString().slice(0, 10);
    }
  });

  document.getElementById('actCampagneCyberEtape')?.addEventListener('change', toggleEtapeTermineeCheckbox);

  document.getElementById('formAction').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('actId').value;
    const type = document.getElementById('actType').value;
    const statut = isCampaignType(type)
      ? document.getElementById('actCampagneCyberEtape').value
      : document.getElementById('actStatut').value;
    const etapeTerminee = document.getElementById('actEtapeTerminee').checked;

    const data = {
      type,
      statut,
      date: document.getElementById('actDate').value,
      echeance: document.getElementById('actEcheance').value,
      sujet: document.getElementById('actSujet').value,
      description: document.getElementById('actDescription').value,
      entrepriseId: document.getElementById('actEntrepriseId').value || '',
      contactId: document.getElementById('actContactId').value || '',
      affaireId: document.getElementById('actAffaireId').value || ''
    };
    if (isCampaignType(type)) {
      data.dateJ0 = document.getElementById('actDateJ0').value || '';
      data.stepDone = etapeTerminee;
    }

    if (id) {
      updateAction(id, data);
      if (isCampaignType(type) && etapeTerminee) {
        const workflow = getWorkflowForCampaign(type);
        const idx = workflow?.findIndex(w => w.id === statut) ?? -1;
        const lastId = workflow?.length ? workflow[workflow.length - 1].id : '';
        if (idx >= 0 && idx < (workflow?.length || 0) - 1 && statut !== lastId) {
          const next = workflow[idx + 1];
          addAction({
            type,
            statut: next.id,
            date: new Date().toISOString().slice(0, 10),
            sujet: data.sujet,
            description: data.description,
            entrepriseId: data.entrepriseId,
            contactId: data.contactId,
            affaireId: data.affaireId,
            dateJ0: data.dateJ0
          });
        }
      }
    } else {
      addAction(data);
    }
    closeModal('modalAction');
    renderAll();
  });

  // === Affaires ===
  function renderAffaires() {
    let list = getAffaires();
    const search = (document.getElementById('searchAffaire')?.value || '').toLowerCase().trim();
    const filter = document.getElementById('filterAffaireStage')?.value;
    if (search) list = list.filter(a => (a.nom || '').toLowerCase().includes(search));
    if (filter) list = list.filter(a => a.etape === filter);
    const el = document.getElementById('listAffaires');
    if (list.length === 0) {
      el.innerHTML = '<div class="crm-empty"><p>Aucune affaire.</p></div>';
      return;
    }
    el.innerHTML = list.map(a => {
      const ent = getEntreprise(a.entrepriseId);
      const stage = AFFAIRE_STAGES[a.etape] || AFFAIRE_STAGES.prospect;
      const montant = a.montant ? a.montant + (a.devise || '€') : '—';
      const date = new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const s = a.snapshot || {};
      const snap = [s.risqueFinancier && `Risque: ${s.risqueFinancier}`, s.roiValue && `ROI: ${s.roiValue}`].filter(Boolean).join(' · ');
      const PROD_LABELS = { cyber: 'Cyber', esg: 'ESG', rgpd: 'RGPD', defaillance: 'Défaillance' };
      const prodBadges = (a.produits || []).map(p => `<span class="badge badge--prod">${PROD_LABELS[p] || p}</span>`).join('');
      return `
      <div class="crm-card" data-id="${a.id}" data-type="affaire">
        <div class="crm-card-main">
          <h3>${a.nom || 'Sans nom'}</h3>
          <div class="crm-card-meta">${ent ? ent.nom : '—'} · ${montant} · ${date}</div>
          ${prodBadges ? `<div class="crm-card-produits">${prodBadges}</div>` : ''}
          ${snap ? `<div class="crm-card-extra">${snap}</div>` : ''}
        </div>
        <span class="crm-stage-badge" style="background:${stage.color}20;color:${stage.color}">${stage.label}</span>
        <div class="crm-card-actions">
          <button type="button" class="btn btn-secondary btn--small" data-edit="affaire">Modifier</button>
          <button type="button" class="btn btn-secondary btn--small" data-delete="affaire">Supprimer</button>
        </div>
      </div>
    `}).join('');
    el.querySelectorAll('.crm-card').forEach(card => {
      card.querySelector('[data-edit]')?.addEventListener('click', () => editAffaire(card.dataset.id));
      card.querySelector('[data-delete]')?.addEventListener('click', () => {
        if (confirm('Supprimer cette affaire ?')) { deleteAffaire(card.dataset.id); renderAll(); }
      });
      card.addEventListener('click', (e) => { if (!e.target.closest('button')) editAffaire(card.dataset.id); });
    });
  }

  function editAffaire(id) {
    const a = getAffaire(id);
    if (!a) return;
    fillEntrepriseSelects();
    fillContactSelects(a.entrepriseId);
    document.getElementById('affEtape').innerHTML = Object.entries(AFFAIRE_STAGES).map(([k, v]) =>
      `<option value="${k}" ${a.etape === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    document.getElementById('modalAffaireTitle').textContent = 'Modifier l\'affaire';
    document.getElementById('affId').value = a.id;
    document.getElementById('affNom').value = a.nom || '';
    document.getElementById('affMontant').value = a.montant || '';
    document.getElementById('affDevise').value = a.devise || '€';
    document.getElementById('affEtape').value = a.etape || 'prospect';
    document.getElementById('affProbabilite').value = a.probabilite || 0;
    setComboboxValue('affEntrepriseSearch', 'affEntrepriseId', a.entrepriseId || '', () =>
      getEntreprises().map(e => ({ value: e.id, label: e.nom || 'Sans nom' }))
    );
    setComboboxValue('affContactSearch', 'affContactId', a.contactId || '', () => {
      const eid = document.getElementById('affEntrepriseId')?.value || '';
      const contacts = eid ? getContactsByEntreprise(eid) : getContacts();
      return contacts.map(c => ({ value: c.id, label: (c.prenom + ' ' + c.nom).trim() || c.email || 'Sans nom' }));
    });
    document.getElementById('affDateCloturePrevue').value = a.dateCloturePrevue || '';
    document.getElementById('affDateClotureReelle').value = a.dateClotureReelle || '';
    const PRODUIT_IDS = { cyber: 'Cyber', esg: 'Esg', rgpd: 'Rgpd', defaillance: 'Defaillance' };
    ['cyber', 'esg', 'rgpd', 'defaillance'].forEach(p => {
      const cb = document.getElementById('affProduit' + PRODUIT_IDS[p]);
      if (cb) cb.checked = (a.produits || []).includes(p);
    });
    document.getElementById('affNotes').value = a.notes || '';
    document.getElementById('affSnapshot').innerHTML = Object.keys(a.snapshot || {}).length ? 
      '<strong>Analyse :</strong><br>' + Object.entries(a.snapshot).map(([k, v]) => `${k}: ${v}`).join('<br>') : '';
    openModal('modalAffaire');
  }

  document.getElementById('btnAddAffaire').addEventListener('click', () => {
    fillEntrepriseSelects();
    fillContactSelects();
    document.getElementById('affEtape').innerHTML = Object.entries(AFFAIRE_STAGES).map(([k, v]) =>
      `<option value="${k}">${v.label}</option>`
    ).join('');
    document.getElementById('modalAffaireTitle').textContent = 'Nouvelle affaire';
    document.getElementById('formAffaire').reset();
    document.getElementById('affId').value = '';
    document.getElementById('affProbabilite').value = 0;
    document.getElementById('affSnapshot').innerHTML = '';
    clearCombobox('affEntrepriseSearch', 'affEntrepriseId');
    clearCombobox('affContactSearch', 'affContactId');
    ['cyber', 'esg', 'rgpd', 'defaillance'].forEach(p => {
      const cb = document.getElementById('affProduit' + { cyber: 'Cyber', esg: 'Esg', rgpd: 'Rgpd', defaillance: 'Defaillance' }[p]);
      if (cb) cb.checked = false;
    });
    openModal('modalAffaire');
  });

  document.getElementById('formAffaire').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('affId').value;
    const PRODUIT_IDS = { cyber: 'Cyber', esg: 'Esg', rgpd: 'Rgpd', defaillance: 'Defaillance' };
    const produits = ['cyber', 'esg', 'rgpd', 'defaillance'].filter(p => {
      const cb = document.getElementById('affProduit' + PRODUIT_IDS[p]);
      return cb && cb.checked;
    });
    const data = {
      nom: document.getElementById('affNom').value,
      montant: document.getElementById('affMontant').value,
      devise: document.getElementById('affDevise').value,
      etape: document.getElementById('affEtape').value,
      probabilite: parseInt(document.getElementById('affProbabilite').value) || 0,
      entrepriseId: document.getElementById('affEntrepriseId').value || '',
      contactId: document.getElementById('affContactId').value || '',
      dateCloturePrevue: document.getElementById('affDateCloturePrevue').value,
      dateClotureReelle: document.getElementById('affDateClotureReelle').value,
      produits,
      notes: document.getElementById('affNotes').value
    };
    if (id) {
      const aff = getAffaire(id);
      data.snapshot = aff?.snapshot || {};
      updateAffaire(id, data);
    } else addAffaire(data);
    closeModal('modalAffaire');
    renderAll();
  });


  const filterStageEl = document.getElementById('filterAffaireStage');
  if (filterStageEl) {
    filterStageEl.innerHTML = '<option value="">Toutes les étapes</option>' + Object.entries(AFFAIRE_STAGES).map(([k, v]) =>
      `<option value="${k}">${v.label}</option>`
    ).join('');
    filterStageEl.addEventListener('change', renderAffaires);
  }

  const filterActionTypeEl = document.getElementById('filterActionType');
  if (filterActionTypeEl) {
    const typeEntries = getActionTypes();
    filterActionTypeEl.innerHTML = '<option value="">Tous les types</option>' + typeEntries.map(t =>
      `<option value="${t.value}">${t.label}</option>`
    ).join('');
    filterActionTypeEl.addEventListener('change', renderActions);
  }
  const filterActionStatutEl = document.getElementById('filterActionStatut');
  if (filterActionStatutEl) {
    const statOpts = Object.entries(ACTION_STATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    const campaignOpts = getCampaignTypes().flatMap(c => c.steps.map(s => `<option value="${s.id}">${s.label}</option>`)).join('');
    filterActionStatutEl.innerHTML = '<option value="">Tous les statuts</option>' + statOpts + campaignOpts;
    filterActionStatutEl.addEventListener('change', renderActions);
  }

  ['searchEntreprise', 'filterEntrepriseSecteur', 'filterEntrepriseTaille'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderEntreprises);
    document.getElementById(id)?.addEventListener('change', renderEntreprises);
  });
  ['searchContact', 'filterContactEntreprise'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderContacts);
    document.getElementById(id)?.addEventListener('change', renderContacts);
  });
  ['searchAction', 'filterActionType', 'filterActionStatut'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderActions);
    document.getElementById(id)?.addEventListener('change', renderActions);
  });
  document.getElementById('searchAffaire')?.addEventListener('input', renderAffaires);

  function renderAll() {
    fillEntrepriseSelects();
    fillContactSelects();
    fillAffaireSelects();
    renderEntreprises();
    renderContacts();
    renderActions();
    renderAffaires();
    renderCampaignTypes();
    fillBtnAddCampaign();
  }

  function fillBtnAddCampaign() {
    const el = document.getElementById('btnAddCampaign');
    if (!el) return;
    const campaigns = getCampaignTypes();
    el.innerHTML = '<option value="">+ Nouvelle campagne…</option>' + campaigns.map(c =>
      `<option value="${c.id}">${c.nom}</option>`
    ).join('');
  }

  // === Types de campagnes ===
  function renderCampaignTypes() {
    const list = getCampaignTypes();
    const el = document.getElementById('listCampaignTypes');
    if (!el) return;
    if (list.length === 0) {
      el.innerHTML = '<div class="crm-empty"><p>Aucun type de campagne.</p><button type="button" class="btn btn-primary" id="btnAddCampaignType">Créer un type de campagne</button></div>';
      el.querySelector('#btnAddCampaignType')?.addEventListener('click', () => document.getElementById('btnAddCampaignType')?.click());
      return;
    }
    el.innerHTML = list.map(c => `
      <div class="crm-card" data-id="${c.id}" data-type="campaign">
        <div class="crm-card-main">
          <h3>${c.nom || 'Sans nom'}</h3>
          <div class="crm-card-meta">${(c.steps || []).length} étape(s)</div>
        </div>
        <div class="crm-card-actions">
          <button type="button" class="btn btn-secondary btn--small" data-edit="campaign">Modifier</button>
          <button type="button" class="btn btn-secondary btn--small" data-delete="campaign">Supprimer</button>
        </div>
      </div>
    `).join('');
    el.querySelectorAll('.crm-card').forEach(card => {
      card.querySelector('[data-edit]')?.addEventListener('click', () => editCampaignType(card.dataset.id));
      card.querySelector('[data-delete]')?.addEventListener('click', () => {
        if (confirm('Supprimer ce type de campagne ? Les actions existantes garderont leur type.')) {
          deleteCampaignType(card.dataset.id);
          renderAll();
        }
      });
    });
  }

  function editCampaignType(id) {
    const c = getCampaignType(id);
    if (!c) return;
    document.getElementById('modalCampaignTypeTitle').textContent = 'Modifier le type de campagne';
    document.getElementById('ctId').value = c.id;
    document.getElementById('ctNom').value = c.nom || '';
    renderStepsList(c.steps || []);
    openModal('modalCampaignType');
  }

  function renderStepsList(steps) {
    const el = document.getElementById('ctStepsList');
    if (!el) return;
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    el.innerHTML = steps.map((s, i) => `
      <div class="ct-step-row" data-step-id="${esc(s.id)}">
        <input type="number" placeholder="J" value="${s.jour ?? ''}" data-field="jour" title="Jours (ex: -2, 0, 3)">
        <input type="text" placeholder="Label" value="${esc(s.label)}" data-field="label">
        <input type="text" placeholder="Description" value="${esc(s.description)}" data-field="description">
        <button type="button" class="btn btn-secondary btn--small" data-remove-step>×</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-remove-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.ct-step-row')?.remove();
      });
    });
  }

  document.getElementById('btnAddCampaignType')?.addEventListener('click', () => {
    document.getElementById('modalCampaignTypeTitle').textContent = 'Nouveau type de campagne';
    document.getElementById('formCampaignType').reset();
    document.getElementById('ctId').value = '';
    renderStepsList([]);
    openModal('modalCampaignType');
  });

  document.getElementById('btnAddStep')?.addEventListener('click', () => {
    const el = document.getElementById('ctStepsList');
    const rows = el.querySelectorAll('.ct-step-row');
    const i = rows.length;
    const div = document.createElement('div');
    div.className = 'ct-step-row';
    div.dataset.stepId = '';
    div.innerHTML = `
      <input type="number" placeholder="J" data-field="jour" title="Jours (ex: -2, 0, 3)">
      <input type="text" placeholder="Label" data-field="label">
      <input type="text" placeholder="Description" data-field="description">
      <button type="button" class="btn btn-secondary btn--small" data-remove-step>×</button>
    `;
    div.querySelector('[data-remove-step]').addEventListener('click', () => div.remove());
    el.appendChild(div);
  });

  document.getElementById('formCampaignType')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('ctId').value;
    const nom = document.getElementById('ctNom').value.trim();
    const rows = document.querySelectorAll('#ctStepsList .ct-step-row');
    const steps = Array.from(rows).map((row, i) => {
      const labelEl = row.querySelector('[data-field="label"]');
      const existingId = row.dataset.stepId || '';
      const id = existingId.trim() || (labelEl?.value || 'step').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 30) || 'step_' + i;
      return {
        id,
        label: labelEl?.value || '',
        jour: parseInt(row.querySelector('[data-field="jour"]').value, 10) || 0,
        description: row.querySelector('[data-field="description"]').value || ''
      };
    });
    if (id) {
      updateCampaignType(id, { nom, steps });
    } else {
      addCampaignType({ nom, steps });
    }
    closeModal('modalCampaignType');
    renderAll();
  });

  initTabs();

  const entOpts = () => getEntreprises().map(e => ({ value: e.id, label: e.nom || 'Sans nom' }));
  const conOpts = () => getContacts().map(c => ({ value: c.id, label: (c.prenom + ' ' + c.nom).trim() || c.email || 'Sans nom' }));
  const conOptsByEnt = (entId) => (entId ? getContactsByEntreprise(entId) : getContacts()).map(c => ({ value: c.id, label: (c.prenom + ' ' + c.nom).trim() || c.email || 'Sans nom' }));
  const affOpts = () => getAffaires().map(a => ({ value: a.id, label: a.nom || 'Sans nom' }));

  initCombobox('conEntrepriseSearch', 'conEntrepriseId', 'conEntrepriseList', entOpts);
  initCombobox('actEntrepriseSearch', 'actEntrepriseId', 'actEntrepriseList', entOpts);
  initCombobox('actContactSearch', 'actContactId', 'actContactList', conOpts);
  initCombobox('actAffaireSearch', 'actAffaireId', 'actAffaireList', affOpts);
  initCombobox('affEntrepriseSearch', 'affEntrepriseId', 'affEntrepriseList', entOpts, () => {
    clearCombobox('affContactSearch', 'affContactId');
  });
  initCombobox('affContactSearch', 'affContactId', 'affContactList', () => {
    const eid = document.getElementById('affEntrepriseId')?.value || '';
    return conOptsByEnt(eid);
  });

  renderAll();
})();
