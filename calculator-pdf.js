/**
 * Conitiv — Génération PDF de synthèse (commerciale & neutre)
 */
(function () {
  const COLORS = {
    accent: [25, 118, 210],
    accentLight: [232, 245, 255],
    text: [33, 33, 33],
    textMuted: [97, 97, 97],
    border: [224, 224, 224],
    rowAlt: [248, 248, 248],
    highlight: [0, 100, 0]
  };

  function getText(id) {
    const el = document.getElementById(id);
    if (!el) return '—';
    const val = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') ? (el.value || '') : (el.textContent || '');
    return String(val).trim() || '—';
  }

  function getClientName() {
    const entreprise = getText('clientEntreprise');
    const prenom = getText('clientPrenom');
    const nom = getText('clientNom');
    const contact = [prenom, nom].filter(Boolean).join(' ').trim();
    if (entreprise && contact) return entreprise + ' — ' + contact;
    return entreprise || contact || 'Client';
  }

  function getSelectLabel(id) {
    const el = document.getElementById(id);
    if (!el || !el.options) return '—';
    const opt = el.options[el.selectedIndex];
    return opt ? opt.text.trim() : '—';
  }

  function addExecutiveSummary(doc, y) {
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - margin * 2;
    const activeTab = getActiveTab();

    const exposition = getText('risqueEviteCyber');
    const roi = getText('roiValue');
    const roiEsg = getText('roiEsg');
    const roiRgpd = getText('roiRgpd');
    const roiDefaillance = getText('roiDefaillance');
    const invest = getText('inputInvestissement');
    const economie = document.getElementById('roiEconomie')?.textContent?.trim() || '';

    const roiDisplay = activeTab === 'cyber' ? roi : (activeTab === 'esg' ? roiEsg : (activeTab === 'rgpd' ? roiRgpd : (activeTab === 'defaillance' ? roiDefaillance : roi)));

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text('Message clé', margin, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);
    y += 10;

    const hasRoi = roiDisplay && roiDisplay !== '—' && roiDisplay.indexOf('%') >= 0;
    const roiNum = hasRoi ? parseFloat(String(roiDisplay).replace(/\s*%/, '')) : 0;

    if (hasRoi && roiNum > 0 && invest && invest !== '—') {
      doc.setFillColor(230, 247, 230);
      doc.rect(margin, y - 4, contentW, 22, 'F');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 100, 0);
      doc.text('Lecture : ROI ' + roiDisplay + '. ' + (economie || 'L\'exposition évitée dépasse le coût de la solution.'), margin + 6, y + 4, { maxWidth: contentW - 12 });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...COLORS.text);
      y += 28;
    }

    const expoText = activeTab === 'cyber' ? exposition : (activeTab === 'esg' ? getText('risqueEsg') : (activeTab === 'rgpd' ? getText('risqueRgpd') : (activeTab === 'defaillance' ? getText('risqueDefaillance') : exposition)));
    const bullets = [
      expoText && expoText !== '—' ? 'Exposition : ' + expoText + '.' : '',
      invest && invest !== '—' ? 'Investissement : ' + invest + ' k€/an.' : '',
      roiDisplay && roiDisplay !== '—' ? 'ROI : ' + roiDisplay + '.' : '',
      'Réf. ANSSI/Cour des comptes : 466 k€ (PME) · 13 M€ (ETI) · 135 M€ (GE).',
      'Bessé : +50 % risque défaillance dans les 6 mois post-incident.',
      'Gouvernance fournisseur = protection dirigeants + meilleure assurance cyber.'
    ].filter(Boolean);

    doc.setFontSize(9);
    bullets.forEach(b => {
      doc.text('• ' + b, margin + 4, y, { maxWidth: contentW - 8 });
      y += 6;
    });

    return y + 10;
  }

  function addBoardArguments(doc, y) {
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - margin * 2;

    if (y > 240) {
      doc.addPage();
      y = 25;
    }

    doc.setFillColor(...COLORS.accentLight);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 6, contentW, 14, 'FD');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text('Points clés', margin + 8, y + 3);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    y += 18;

    const args = [
      { title: 'Protection des dirigeants', desc: 'Responsabilité de gouvernance, exposition personnelle. Une gouvernance fournisseur active et traçable renforce la défense du management.' },
      { title: 'ROI démontrable', desc: 'L\'exposition réductible (impacts + amendes NIS2) dépasse l\'investissement. Le scoring priorise les leviers à fort impact.' },
      { title: 'Conformité NIS2', desc: 'Les contrôles se renforcent. Démontrer une maîtrise du risque tiers réduit l\'exposition aux amendes et aux sanctions.' },
      { title: 'Assurance cyber', desc: 'Gouvernance fournisseur démontrée = meilleure éligibilité et réduction des primes (Marsh, Allianz).' },
      { title: 'Risque de défaillance', desc: 'Étude Bessé : +50 % de risque de défaillance dans les 6 mois après un incident. La crise réputation est le facteur moteur.' }
    ];

    args.forEach(a => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(a.title, margin + 4, y);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(a.desc, contentW - 8);
      doc.text(lines, margin + 4, y + 6);
      y += 6 + (lines.length * 5) + 6;
    });

    return y + 6;
  }

  function addSection(doc, title, lines, y) {
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - margin * 2;
    const valueX = pageW - margin;

    if (y > 250) {
      doc.addPage();
      y = 25;
    }

    doc.setFillColor(...COLORS.accentLight);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 6, contentW, 14, 'FD');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text(title, margin + 8, y + 3);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.text);

    let yy = y + 16;
    let rowIdx = 0;

    lines.forEach(function (item) {
      if (yy > 270) {
        doc.addPage();
        yy = 25;
        rowIdx = 0;
      }
      const label = typeof item === 'string' ? item : item[0];
      const value = typeof item === 'string' ? '' : item[1];
      const isHighlight = item[2] === true;

      if (label.startsWith('—')) {
        yy += 4;
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(label, margin + 8, yy);
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(10);
        yy += 10;
        rowIdx++;
        return;
      }

      if (rowIdx % 2 === 1) {
        doc.setFillColor(...COLORS.rowAlt);
        doc.rect(margin, yy - 5, contentW, 10, 'F');
      }
      doc.setFont(undefined, isHighlight ? 'bold' : 'normal');
      if (isHighlight) doc.setTextColor(...COLORS.accent);
      doc.text(label, margin + 8, yy);
      if (value) {
        doc.text(String(value), valueX, yy, { align: 'right' });
      }
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...COLORS.text);
      yy += 10;
      rowIdx++;
    });

    return yy + 12;
  }

  function getActiveTab() {
    const active = document.querySelector('.tab-btn--active');
    return active ? active.dataset.tab : 'cyber';
  }

  function getOpportuniteCards() {
    const cards = document.querySelectorAll('.opportunite-card');
    return Array.from(cards).map(card => {
      const badge = card.querySelector('.opportunite-badge');
      const title = card.querySelector('h4');
      const desc = card.querySelector('p');
      return {
        badge: badge ? badge.textContent.trim() : '',
        title: title ? title.textContent.trim() : '',
        desc: desc ? desc.textContent.trim() : ''
      };
    });
  }

  function addOpportunitesSection(doc, y) {
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const contentW = pageW - margin * 2;
    const cards = getOpportuniteCards();
    if (!cards.length) return y;

    if (y > 230) {
      doc.addPage();
      y = 25;
    }

    doc.setFillColor(...COLORS.accentLight);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 6, contentW, 14, 'FD');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.accent);
    doc.text('Opportunités par direction', margin + 8, y + 3);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);

    let yy = y + 16;

    const shortDesc = {
      'Dirigeants': 'Protection exposition personnelle. Gouvernance traçable = défense du management.',
      'CISO / DSI': 'Crédibilité professionnelle. Pilotage actif du risque cyber.',
      'Risk / Compliance': 'Traçabilité fournisseurs, conformité documentée. Leadership sur la gouvernance.',
      'Achats': 'Continuité d\'approvisionnement. Maîtrise du risque supply chain.',
      'Finance': 'Pilotage des risques fournisseurs. Réduction exposition défaillances.'
    };

    cards.forEach((card) => {
      if (yy > 268) {
        doc.addPage();
        yy = 25;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.accent);
      doc.text(card.badge, margin + 4, yy);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...COLORS.text);
      doc.text(card.title, margin + 4, yy + 5);
      doc.setFont(undefined, 'normal');
      const desc = shortDesc[card.title] || card.desc;
      const lines = doc.splitTextToSize(desc, contentW - 8);
      doc.text(lines, margin + 4, yy + 10);
      yy += 10 + (lines.length * 4.5) + 6;
    });

    return yy + 6;
  }

  function generatePdf() {
    const jspdfLib = window.jspdf || (typeof jspdf !== 'undefined' ? jspdf : null);
    if (!jspdfLib || !jspdfLib.jsPDF) {
      alert('Erreur : la bibliothèque PDF n\'est pas chargée.');
      return;
    }
    const jsPDF = jspdfLib.jsPDF;
    const doc = new jsPDF();
    const clientName = getClientName();
    const sector = getSelectLabel('sector');
    const size = getSelectLabel('size');
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const activeTab = getActiveTab();

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;

    doc.setFillColor(...COLORS.accent);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Synthèse exécutive — Risque tiers', margin, 16);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(clientName + ' · ' + sector + ' · ' + size, margin, 24);
    doc.setFontSize(8);
    doc.text('Généré le ' + date + ' | Conitiv', pageW - margin, 24, { align: 'right' });
    doc.setTextColor(...COLORS.text);

    let y = 48;

    y = addExecutiveSummary(doc, y);

    if (y > 250) {
      doc.addPage();
      y = 25;
    }

    if (activeTab === 'cyber') {
      y = addSection(doc, 'Chiffres clés — Risque cyber', [
        ['Exposition réductible totale', getText('risqueEviteCyber'), true],
        ['ROI global', getText('roiValue'), true],
        ['Investissement solution (k€/an)', getText('inputInvestissement')],
        ['Impacts réductibles', getText('impactsReductibles'), true],
        ['Amendes réductibles (NIS2)', getText('amendesReductibles')],
        ['— Détail —', ''],
        ['Impact total moyen', getText('impactTotal')],
        ['Probabilité incident via tiers / an', getText('pViaTiers')],
        ['Amende max NIS2', getText('nis2AmendeMax')],
        ['Probabilité d\'être contrôlé et amendé', document.getElementById('nis2Proba')?.textContent || '—']
      ], y);
    } else if (activeTab === 'esg') {
      y = addSection(doc, 'Chiffres clés — Risque ESG', [
        ['Exposition ESG', getText('risqueEsg'), true],
        ['ROI ESG', getText('roiEsg'), true],
        ['Impact financier potentiel', getText('esgImpact'), true],
        ['CSRD', getText('esgCsrd')],
        ['Devoir de vigilance', getText('esgDevoir')]
      ], y);
    } else if (activeTab === 'rgpd') {
      y = addSection(doc, 'Chiffres clés — Risque RGPD', [
        ['Exposition réglementaire', getText('risqueRgpd'), true],
        ['ROI RGPD', getText('roiRgpd'), true],
        ['Total exposition amendes', getText('rgpdTotal'), true],
        ['RGPD', getText('rgpdAmende')],
        ['NIS2', getText('nis2Amende')],
        ['DORA', getText('doraAmende')]
      ], y);
    } else if (activeTab === 'defaillance') {
      y = addSection(doc, 'Chiffres clés — Risque défaillances', [
        ['Risque financier annuel', getText('risqueDefaillance'), true],
        ['ROI défaillance', getText('roiDefaillance'), true],
        ['Probabilité défaillance / an', getText('defPDefaillance')],
        ['Impact moyen', getText('defImpact')]
      ], y);
    } else {
      y = addSection(doc, 'Synthèse consolidée', [
        ['Risque cyber', getText('consCyber')],
        ['Risque ESG', getText('consEsg')],
        ['Risque RGPD', getText('consRgpd')],
        ['Risque défaillances', getText('consDefaillance')]
      ], y);
    }

    y = addBoardArguments(doc, y);
    y = addOpportunitesSection(doc, y);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('Les ratios de réduction sont des ordres de grandeur. Une solution de scoring ne supprime pas le risque fournisseur.', margin, y, { maxWidth: pageW - margin * 2 });
    doc.text('Sources : ANSSI, Cour des comptes, CriseHelp, Bessé/G.P. Goldstein, Verizon DBIR, ENISA, Marsh, NIS2, CNIL.', margin, y + 6);

    const filename = 'Conitiv-synthese-executive-' + (activeTab || 'risque') + '-' + (clientName || 'client').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '.pdf';
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
