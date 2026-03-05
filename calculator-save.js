/**
 * Conitiv — Sauvegarde et chargement des calculs
 */
(function () {
  const STORAGE_KEY = 'conitiv-calculs-sauvegardes';
  const SAVE_IDS = [
    'clientEntreprise', 'clientPrenom', 'clientNom',
    'sector', 'size',
    'inputPIncident', 'inputPTiers', 'inputImpactDirect', 'inputImpactIndirect',
    'inputRatioCyber', 'inputInvestissement',
    'nis2EntityType', 'nis2Ca',
    'nis2FacteurIncidentPublic', 'nis2FacteurTiersCritiques', 'nis2FacteurMaturiteFaible', 'nis2FacteurSecteurRegule', 'nis2FacteurHistoriqueConformite',
    'inputEsgImpact', 'inputInvestissementEsg',
    'inputRgpd', 'inputNis2', 'inputDora', 'inputInvestissementRgpd',
    'inputPDefaillance', 'inputDefImpact', 'inputInvestissementDefaillance'
  ];

  function getValue(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (el.type === 'checkbox') return el.checked ? '1' : '0';
    if (el.tagName === 'SELECT') return el.value;
    return el.value !== undefined ? el.value : (el.textContent || '').trim();
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (!el || value == null) return;
    if (el.type === 'checkbox') {
      el.checked = (value === '1' || value === 'true' || value === true);
    } else if (el.tagName === 'SELECT') {
      el.value = value;
    } else if (el.value !== undefined) {
      el.value = value;
    }
  }

  function collectData() {
    const data = { date: new Date().toISOString(), activeTab: getActiveTab(), values: {} };
    SAVE_IDS.forEach(id => {
      const v = getValue(id);
      if (v != null && v !== '') data.values[id] = v;
    });
    const entreprise = getValue('clientEntreprise') || '';
    const prenom = getValue('clientPrenom') || '';
    const nom = getValue('clientNom') || '';
    data.label = entreprise || [prenom, nom].filter(Boolean).join(' ') || 'Sans nom';
    return data;
  }

  function getActiveTab() {
    const active = document.querySelector('.tab-btn--active');
    return active ? active.dataset.tab : 'cyber';
  }

  function setActiveTab(tab) {
    const btns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    btns.forEach(b => {
      b.classList.toggle('tab-btn--active', b.dataset.tab === tab);
    });
    panels.forEach(p => {
      p.classList.toggle('tab-panel--active', p.id === 'panel-' + tab);
    });
  }

  function getSaves() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveSaves(saves) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves.slice(-20)));
    } catch (e) {
      console.warn('Impossible de sauvegarder:', e);
    }
  }

  function refreshLoadSelect() {
    const selectLoad = document.getElementById('selectLoadCalculs');
    if (!selectLoad) return;
    const saves = getSaves();
    const currentVal = selectLoad.value;
    selectLoad.innerHTML = '<option value="">Charger une sauvegarde...</option>' +
      saves.slice().reverse().map((s, i) => {
        const d = s.date ? new Date(s.date) : null;
        const label = (s.label || 'Sans nom') + (d ? ' — ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
        return '<option value="' + (saves.length - 1 - i) + '">' + label + '</option>';
      }).join('');
    selectLoad.value = currentVal || '';
  }

  function save() {
    const data = collectData();
    const saves = getSaves();
    saves.push(data);
    saveSaves(saves);
    refreshLoadSelect();
    showToast('Calculs sauvegardés.', 'success');
  }

  function load(saveData) {
    if (!saveData || !saveData.values) return;
    Object.entries(saveData.values).forEach(([id, value]) => {
      if (id === 'size' && value === 'eti') value = 'eti_inf';
      if (id === 'nis2Situation') {
        const incidentPublic = document.getElementById('nis2FacteurIncidentPublic');
        const maturiteFaible = document.getElementById('nis2FacteurMaturiteFaible');
        const historique = document.getElementById('nis2FacteurHistoriqueConformite');
        if (incidentPublic) incidentPublic.checked = (value === 'incident' || value === 'nonconformite');
        if (maturiteFaible) maturiteFaible.checked = (value === 'nonconformite');
        if (historique) historique.checked = (value === 'nonconformite');
        return;
      }
      setValue(id, value);
    });

    // Compatibilité anciennes sauvegardes (anciens IDs facteurs)
    try {
      const v = saveData.values || {};
      if (v.nis2FacteurIncident != null) setValue('nis2FacteurIncidentPublic', v.nis2FacteurIncident);
      if (v.nis2FacteurTiers != null) setValue('nis2FacteurTiersCritiques', v.nis2FacteurTiers);
      if (v.nis2FacteurSecteur != null) setValue('nis2FacteurSecteurRegule', v.nis2FacteurSecteur);
      if (v.nis2FacteurAudit != null) setValue('nis2FacteurHistoriqueConformite', v.nis2FacteurAudit);
      if (v.nis2FacteurNotification != null) setValue('nis2FacteurHistoriqueConformite', v.nis2FacteurNotification);
      if (v.nis2FacteurSignalement != null) setValue('nis2FacteurHistoriqueConformite', v.nis2FacteurSignalement);
    } catch {}

    if (saveData.activeTab) setActiveTab(saveData.activeTab);
    triggerRecalc();
    showToast('Calculs chargés.', 'success');
  }

  function triggerRecalc() {
    document.getElementById('sector')?.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('inputPIncident')?.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('inputImpactDirect')?.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('inputEsgImpact')?.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('inputRgpd')?.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('inputPDefaillance')?.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'calculator-toast calculator-toast--' + (type || 'info');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#1976d2;color:#fff;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:fadeIn 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function init() {
    const btnSave = document.getElementById('btnSaveCalculs');
    const selectLoad = document.getElementById('selectLoadCalculs');

    if (btnSave) {
      btnSave.addEventListener('click', save);
    }

    if (selectLoad) {
      refreshLoadSelect();
      selectLoad.addEventListener('change', function () {
        const idx = parseInt(this.value, 10);
        if (isNaN(idx) || idx < 0) return;
        const saves = getSaves();
        const saveData = saves[saves.length - 1 - idx];
        if (saveData) load(saveData);
        this.value = '';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
