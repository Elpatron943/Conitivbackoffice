/**
 * Conitiv — Intégration CRM depuis le calculateur
 */
(function () {
    const SNAPSHOT_IDS = [
    'clientEntreprise', 'clientPrenom', 'clientNom',
    'pIncident', 'pTiers', 'pViaTiers', 'pViaTiers2026',
    'impactDirect', 'impactIndirect', 'impactTotal',
    'risqueFinancier', 'impactsReductibles', 'amendesReductibles', 'risqueEviteCyber', 'roiImpacts', 'roiAmendes', 'roiValue',
    'consCyber', 'consEsg', 'consRgpd', 'consDefaillance',
    'risqueEsg', 'roiEsg', 'risqueRgpd', 'roiRgpd',
    'risqueDefaillance', 'roiDefaillance',
    'nis2AmendeMax', 'nis2Exposition'
  ];

  function getText(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    return (el.value !== undefined ? el.value : el.textContent || '').trim();
  }

  function getClientName() {
    const entreprise = getText('clientEntreprise');
    const prenom = getText('clientPrenom');
    const nom = getText('clientNom');
    const contact = [prenom, nom].filter(Boolean).join(' ').trim();
    if (entreprise && contact) return entreprise + ' — ' + contact;
    return entreprise || contact || 'Prospect';
  }

  function getClientEntreprise() {
    return getText('clientEntreprise') || '';
  }

  function getSelectLabel(id) {
    const el = document.getElementById(id);
    if (!el || !el.options) return '';
    const opt = el.options[el.selectedIndex];
    return opt ? opt.text.trim() : '';
  }

  function collectSnapshot() {
    const s = {};
    SNAPSHOT_IDS.forEach(id => {
      const v = getText(id);
      if (v && v !== '—') s[id] = v;
    });
    return s;
  }

  function addToCrm() {
    if (typeof ConitivCRM === 'undefined') {
      alert('Le module CRM n\'est pas chargé.');
      return;
    }
    const clientName = getClientName();
    const sector = document.getElementById('sector')?.value || '';
    const size = document.getElementById('size')?.value || '';
    const sectorLabel = getSelectLabel('sector');
    const sizeLabel = getSelectLabel('size');

    const snapshot = collectSnapshot();
    snapshot.sector = sector;
    snapshot.size = size;
    snapshot.sectorLabel = sectorLabel;
    snapshot.sizeLabel = sizeLabel;

    ConitivCRM.addLead({
      clientName: getClientEntreprise() || clientName,
      sector,
      size,
      stage: 'prospect',
      snapshot: { ...snapshot, sectorLabel: getSelectLabel('sector'), sizeLabel: getSelectLabel('size') }
    });

    if (confirm('Lead ajouté au CRM. Voulez-vous ouvrir le CRM ?')) {
      location.href = 'crm.html?added=1';
    }
  }

  function initEntrepriseSearch() {
    const input = document.getElementById('clientEntreprise');
    const suggestionsEl = document.getElementById('entrepriseSuggestions');
    const datalist = document.getElementById('entrepriseList');
    if (!input || !suggestionsEl) return;

    function getEntreprises() {
      return (typeof ConitivCRM !== 'undefined' && ConitivCRM.getEntreprises) ? ConitivCRM.getEntreprises() : [];
    }

    function showSuggestions(term) {
      const entreprises = getEntreprises();
      const q = (term || '').toLowerCase().trim();
      const matches = q ? entreprises.filter(e => (e.nom || '').toLowerCase().includes(q)) : entreprises.slice(0, 10);
      suggestionsEl.innerHTML = '';
      suggestionsEl.setAttribute('aria-hidden', 'true');
      if (matches.length === 0) return;

      suggestionsEl.setAttribute('aria-hidden', 'false');
      matches.slice(0, 8).forEach(ent => {
        const div = document.createElement('div');
        div.className = 'entreprise-suggestion-item';
        div.textContent = ent.nom;
        if (ent.secteur || ent.taille) {
          const sub = document.createElement('span');
          sub.className = 'entreprise-suggestion-meta';
          sub.textContent = [ent.secteur, ent.taille].filter(Boolean).join(' · ');
          div.appendChild(sub);
        }
        div.dataset.id = ent.id;
        div.dataset.nom = ent.nom;
        div.dataset.secteur = ent.secteur || '';
        div.dataset.taille = ent.taille || '';
        div.addEventListener('click', () => selectEntreprise(ent));
        suggestionsEl.appendChild(div);
      });
    }

    function selectEntreprise(ent) {
      input.value = ent.nom || '';
      suggestionsEl.innerHTML = '';
      suggestionsEl.setAttribute('aria-hidden', 'true');

      const sectorEl = document.getElementById('sector');
      const sizeEl = document.getElementById('size');
      if (sectorEl && ent.secteur) sectorEl.value = ent.secteur;
      if (sizeEl && ent.taille) sizeEl.value = (ent.taille === 'eti' ? 'eti_inf' : ent.taille);

      const contacts = (typeof ConitivCRM !== 'undefined' && ConitivCRM.getContactsByEntreprise) ? ConitivCRM.getContactsByEntreprise(ent.id) : [];
      const contact = contacts[0];
      if (contact) {
        const prenomEl = document.getElementById('clientPrenom');
        const nomEl = document.getElementById('clientNom');
        if (prenomEl) prenomEl.value = contact.prenom || '';
        if (nomEl) nomEl.value = contact.nom || '';
      }

      const affaires = (typeof ConitivCRM !== 'undefined' && ConitivCRM.getAffairesByEntreprise) ? ConitivCRM.getAffairesByEntreprise(ent.id) : [];
      const affaire = affaires[0];
      if (affaire && affaire.snapshot && Object.keys(affaire.snapshot).length > 0) {
        loadSnapshot(affaire.snapshot);
      }

      sectorEl?.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function loadSnapshot(snapshot) {
      Object.entries(snapshot).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el && value != null && value !== '') {
          if (el.tagName === 'SELECT') el.value = value;
          else if (el.value !== undefined) el.value = value;
        }
      });
      document.getElementById('sector')?.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function refreshDatalist() {
      if (!datalist) return;
      const entreprises = getEntreprises();
      datalist.innerHTML = entreprises.map(e => '<option value="' + String(e.nom || '').replace(/"/g, '&quot;') + '"></option>').join('');
    }

    input.addEventListener('input', () => {
      showSuggestions(input.value);
      refreshDatalist();
    });
    input.addEventListener('focus', () => showSuggestions(input.value));
    input.addEventListener('blur', () => setTimeout(() => { suggestionsEl.innerHTML = ''; suggestionsEl.setAttribute('aria-hidden', 'true'); }, 200));

    refreshDatalist();
  }

  function init() {
    document.getElementById('btnAddToCrm')?.addEventListener('click', addToCrm);
    initEntrepriseSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
