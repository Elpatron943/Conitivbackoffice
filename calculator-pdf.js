/**
 * Conitiv — Génération PDF synthèse par onglet
 */
(function () {
  function getText(id) {
    const el = document.getElementById(id);
    if (!el) return '—';
    const val = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') ? (el.value || '') : (el.textContent || '');
    return String(val).trim() || '—';
  }

  function getSelectLabel(id) {
    const el = document.getElementById(id);
    if (!el || !el.options) return '—';
    const opt = el.options[el.selectedIndex];
    return opt ? opt.text.trim() : '—';
  }

  function addSection(doc, title, lines, y) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let yy = y + 7;
    lines.forEach(function (item) {
      if (yy > 270) {
        doc.addPage();
        yy = 20;
      }
      const label = typeof item === 'string' ? item : item[0];
      const value = typeof item === 'string' ? '' : item[1];
      doc.text(label, 20, yy);
      if (value) doc.text(String(value), 120, yy);
      yy += 6;
    });
    return yy + 5;
  }

  function generatePdf() {
    const jspdfLib = window.jspdf || (typeof jspdf !== 'undefined' ? jspdf : null);
    if (!jspdfLib || !jspdfLib.jsPDF) {
      alert('Erreur : la bibliothèque PDF n\'est pas chargée.');
      return;
    }
    const jsPDF = jspdfLib.jsPDF;
    const doc = new jsPDF();
    const clientName = getText('clientName') || 'Client';
    const sector = getSelectLabel('sector');
    const size = getSelectLabel('size');
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    let y = 20;
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Synthèse risque tiers', 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(clientName + ' — ' + sector + ' — ' + size, 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Généré le ' + date + ' | Conitiv', 20, y);
    doc.setTextColor(0, 0, 0);
    y += 15;

    // Onglet Cyber
    y = addSection(doc, '1. Risque cyber', [
      ['Probabilité incident cyber annuel', getText('pIncident')],
      ['Part des incidents via tiers', getText('pTiers')],
      ['Probabilité incident via tiers / an', getText('pViaTiers')],
      ['Tendance 2026', getText('pViaTiers2026')],
      ['Impact direct', getText('impactDirect')],
      ['Impact indirect', getText('impactIndirect')],
      ['Impact total moyen', getText('impactTotal')],
      ['Risque financier annuel (cyber)', getText('risqueFinancier')],
      ['Part pondérée scoring', getText('inputRatioCyber') + ' %'],
      ['Exposition réductible', getText('risqueEviteCyber')],
      ['Investissement solution (k€)', getText('inputInvestissement')],
      ['ROI', getText('roiValue')],
      ['— NIS2 —', ''],
      ['Type entité', getText('nis2EntityType') === 'essentielle' ? 'Essentielle' : 'Importante'],
      ['CA mondial (M€)', getText('nis2Ca')],
      ['Situation', { sans: 'Sans incident', incident: 'Incident significatif', nonconformite: 'Incident + non-conformité' }[getText('nis2Situation')] || getText('nis2Situation')],
      ['Amende max NIS2', getText('nis2AmendeMax')],
      ['Exposition NIS2 (espérance)', getText('nis2Exposition')]
    ], y);

    // Onglet ESG
    y = addSection(doc, '2. Risque ESG', [
      ['CSRD', getText('esgCsrd')],
      ['Devoir de vigilance', getText('esgDevoir')],
      ['Impact financier potentiel', getText('esgImpact')],
      ['Exposition ESG', getText('risqueEsg')],
      ['ROI ESG', getText('roiEsg')]
    ], y);

    // Onglet RGPD
    y = addSection(doc, '3. Risque RGPD', [
      ['RGPD', getText('rgpdAmende')],
      ['NIS2', getText('nis2Amende')],
      ['DORA', getText('doraAmende')],
      ['Total exposition amendes', getText('rgpdTotal')],
      ['Exposition réglementaire', getText('risqueRgpd')],
      ['ROI RGPD', getText('roiRgpd')]
    ], y);

    // Onglet Défaillance
    y = addSection(doc, '4. Risque défaillances', [
      ['Probabilité défaillance / an', getText('defPDefaillance')],
      ['Impact moyen', getText('defImpact')],
      ['Risque financier annuel', getText('risqueDefaillance')],
      ['ROI défaillance', getText('roiDefaillance')]
    ], y);

    // Onglet Consolidé
    y = addSection(doc, '5. Synthèse consolidée', [
      ['Risque cyber', getText('consCyber')],
      ['Risque ESG', getText('consEsg')],
      ['Risque RGPD', getText('consRgpd')],
      ['Risque défaillances', getText('consDefaillance')]
    ], y);

    doc.text('—', 20, y + 5);
    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Les ratios de réduction sont des ordres de grandeur. Une solution de scoring ne supprime pas le risque fournisseur.', 20, y);
    doc.text('Sources : Verizon DBIR, ENISA, Marsh, Banque de France, CSRD, NIS2, CNIL.', 20, y + 5);

    const filename = 'Conitiv-synthese-' + (clientName || 'client').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '.pdf';
    doc.save(filename);
  }

  function init() {
    document.getElementById('btnPdfSynthèse')?.addEventListener('click', generatePdf);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
