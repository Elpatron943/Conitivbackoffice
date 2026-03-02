/**
 * Conitiv — Intégration CRM depuis le calculateur
 */
(function () {
  const SNAPSHOT_IDS = [
    'pIncident', 'pTiers', 'pViaTiers', 'pViaTiers2026',
    'impactDirect', 'impactIndirect', 'impactTotal',
    'risqueFinancier', 'risqueEviteCyber', 'roiValue',
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
    const clientName = getText('clientName');
    const sector = document.getElementById('sector')?.value || '';
    const size = document.getElementById('size')?.value || '';
    const sectorLabel = getSelectLabel('sector');
    const sizeLabel = getSelectLabel('size');

    const snapshot = collectSnapshot();
    snapshot.sectorLabel = sectorLabel;
    snapshot.sizeLabel = sizeLabel;

    ConitivCRM.addLead({
      clientName: clientName || 'Prospect',
      sector,
      size,
      stage: 'prospect',
      snapshot: { ...snapshot, sectorLabel: getSelectLabel('sector'), sizeLabel: getSelectLabel('size') }
    });

    if (confirm('Lead ajouté au CRM. Voulez-vous ouvrir le CRM ?')) {
      location.href = 'crm.html?added=1';
    }
  }

  function init() {
    document.getElementById('btnAddToCrm')?.addEventListener('click', addToCrm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
