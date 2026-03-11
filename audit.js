/**
 * Conitiv — Audit risque tiers
 * Page dédiée : formulaire, scoring, téléchargement avec radar et moyennes.
 */

(function () {
  const AUDIT_FORM_KEY = 'conitiv_audit_form';
  const AUDIT_SAVED_KEY = 'conitiv_audit_saved';

  function slugify(str) {
    return (str || '').toLowerCase()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'audit-' + Date.now();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  const AUDIT_QUESTIONS = [
    { id: 1, pilier: 'Gouvernance', text: "Existe-t-il une politique formalisée de gestion des risques liés aux tiers ?" },
    { id: 2, pilier: 'Gouvernance', text: 'La direction valide-t-elle la cartographie des risques tiers ?' },
    { id: 3, pilier: 'Gouvernance', text: 'Un responsable interne est-il désigné pour le risque cyber tiers ?' },
    { id: 4, pilier: 'Gouvernance', text: "Le risque tiers est-il intégré dans la cartographie globale des risques ?" },
    { id: 5, pilier: 'Gouvernance', text: 'Un reporting régulier est-il présenté au COMEX/Board ?' },
    { id: 6, pilier: 'Cartographie & Criticité', text: "Disposez-vous d'un inventaire exhaustif des tiers critiques ?" },
    { id: 7, pilier: 'Cartographie & Criticité', text: 'Les tiers sont-ils classifiés selon leur criticité ?' },
    { id: 8, pilier: 'Cartographie & Criticité', text: 'Avez-vous identifié les tiers ayant accès à des données sensibles ?' },
    { id: 9, pilier: 'Cartographie & Criticité', text: 'Avez-vous identifié les tiers impactant la continuité d\'activité ?' },
    { id: 10, pilier: 'Contractuel & Conformité', text: 'Les contrats incluent-ils des clauses cyber obligatoires ?' },
    { id: 11, pilier: 'Contractuel & Conformité', text: 'Les contrats prévoient-ils une notification d\'incident < 24h ?' },
    { id: 12, pilier: 'Contractuel & Conformité', text: 'Des exigences de certification (ISO 27001, SOC2…) sont-elles demandées ?' },
    { id: 13, pilier: 'Contractuel & Conformité', text: 'Un audit de conformité NIS2 incluant les tiers a-t-il été réalisé ?' },
    { id: 14, pilier: 'Évaluation & Due Diligence', text: "Une évaluation cyber est-elle réalisée avant onboarding d'un tiers critique ?" },
    { id: 15, pilier: 'Évaluation & Due Diligence', text: 'Un questionnaire sécurité est-il systématiquement envoyé ?' },
    { id: 16, pilier: 'Évaluation & Due Diligence', text: 'Un scoring externe (type cyber rating) est-il utilisé ?' },
    { id: 17, pilier: 'Évaluation & Due Diligence', text: 'Les tiers critiques sont-ils réévalués au moins annuellement ?' },
    { id: 18, pilier: 'Contrôles Techniques', text: 'Les accès tiers sont-ils protégés par MFA ?' },
    { id: 19, pilier: 'Contrôles Techniques', text: 'Le principe du moindre privilège est-il appliqué aux tiers ?' },
    { id: 20, pilier: 'Contrôles Techniques', text: 'Les accès tiers sont-ils revus périodiquement ?' },
    { id: 21, pilier: 'Contrôles Techniques', text: "Une segmentation réseau limite-t-elle l'accès des tiers ?" },
    { id: 22, pilier: 'Surveillance & Résilience', text: 'Un monitoring continu des vulnérabilités des tiers est-il en place ?' },
    { id: 23, pilier: 'Surveillance & Résilience', text: 'Les capacités de sauvegarde des tiers critiques sont-elles vérifiées ?' },
    { id: 24, pilier: 'Surveillance & Résilience', text: 'Des tests de gestion de crise incluant les tiers sont-ils réalisés ?' },
    { id: 25, pilier: 'Surveillance & Résilience', text: "Une procédure d'offboarding sécurisé des tiers existe-t-elle ?" }
  ];
  const AUDIT_POIDS = 4;
  const AUDIT_SCORE_MAX = 100;

  const AUDIT_PILIERS = [
    { name: 'Gouvernance', label: 'Gouvernance', questionIds: [1, 2, 3, 4, 5] },
    { name: 'Cartographie & Criticité', label: 'Carto. & Criticité', questionIds: [6, 7, 8, 9] },
    { name: 'Contractuel & Conformité', label: 'Contract. & Conformité', questionIds: [10, 11, 12, 13] },
    { name: 'Évaluation & Due Diligence', label: 'Éval. & Due Diligence', questionIds: [14, 15, 16, 17] },
    { name: 'Contrôles Techniques', label: 'Contrôles Techn.', questionIds: [18, 19, 20, 21] },
    { name: 'Surveillance & Résilience', label: 'Surveill. & Résilience', questionIds: [22, 23, 24, 25] }
  ];

  const AUDIT_RESULTS_KEY = 'conitiv_audit_results';
  const AUDIT_TAILLE_LABELS = {
    pme: 'PME',
    eti_250_1000: 'ETI (250-1000)',
    eti_1000_5000: 'ETI (1000-5000)',
    grand: 'Grande entreprise'
  };
  const AUDIT_SECTEUR_LABELS = {
    industrie: 'Industrie',
    finance: 'Finance',
    retail: 'Retail',
    sante: 'Santé',
    telecom: 'Télécom',
    services: 'Services'
  };

  function collectAuditState() {
    const audit = {
      nomEntreprise: document.getElementById('auditNomEntreprise')?.value ?? '',
      taille: document.getElementById('auditTaille')?.value ?? '',
      secteur: document.getElementById('auditSecteur')?.value ?? '',
      prenom: document.getElementById('auditPrenom')?.value ?? '',
      nom: document.getElementById('auditNom')?.value ?? ''
    };
    const radios = {};
    for (let i = 1; i <= 25; i++) {
      const el = document.querySelector(`input[name="audit_${i}"]:checked`);
      if (el) radios['audit_' + i] = el.value;
    }
    return { audit, radios };
  }

  function applyAuditState(state) {
    if (!state?.audit) return;
    const a = state.audit;
    const ids = { nomEntreprise: 'auditNomEntreprise', taille: 'auditTaille', secteur: 'auditSecteur', prenom: 'auditPrenom', nom: 'auditNom' };
    Object.entries(ids).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el) el.value = a[k] || '';
    });
    if (state.radios) {
      Object.entries(state.radios).forEach(([name, value]) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (el) el.checked = true;
      });
    }
  }

  function getAuditScore() {
    let total = 0;
    for (let i = 1; i <= 25; i++) {
      const el = document.querySelector(`input[name="audit_${i}"]:checked`);
      if (el && el.value === 'oui') total += AUDIT_POIDS;
    }
    return total;
  }

  function getPillarScores(radios) {
    return AUDIT_PILIERS.map(p => {
      let sum = 0;
      const max = p.questionIds.length * AUDIT_POIDS;
      p.questionIds.forEach(id => {
        if (radios['audit_' + id] === 'oui') sum += AUDIT_POIDS;
      });
      return max ? Math.round((sum / max) * 100) : 0;
    });
  }

  function getAuditResults() {
    try {
      const raw = localStorage.getItem(AUDIT_RESULTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAuditResult(entry) {
    const list = getAuditResults();
    list.push(entry);
    try {
      localStorage.setItem(AUDIT_RESULTS_KEY, JSON.stringify(list));
    } catch (e) { /* quota */ }
  }

  /** Moyenne combinée : même taille ET même secteur (un seul profil). */
  function getAveragesByTailleAndSecteur(taille, secteur) {
    const list = getAuditResults();
    const byProfil = list.filter(r => r.taille && r.secteur && r.taille === taille && r.secteur === secteur);
    const avg = (arr, idx) => {
      if (!arr.length) return null;
      const sum = arr.reduce((s, r) => s + (r.pillarScores[idx] ?? 0), 0);
      return Math.round(sum / arr.length);
    };
    const avgProfil = AUDIT_PILIERS.map((_, i) => avg(byProfil, i));
    const tailleLabel = taille ? (AUDIT_TAILLE_LABELS[taille] || taille) : '';
    const secteurLabel = secteur ? (AUDIT_SECTEUR_LABELS[secteur] || secteur) : '';
    const profilLabel = [tailleLabel, secteurLabel].filter(Boolean).join(' — ') || '';
    return {
      avgProfil: byProfil.length > 0 ? avgProfil : null,
      countProfil: byProfil.length,
      profilLabel: profilLabel
    };
  }

  function isAuditComplete() {
    for (let i = 1; i <= 25; i++) {
      const el = document.querySelector(`input[name="audit_${i}"]:checked`);
      if (!el) return { complete: false, message: 'Répondez à toutes les questions (Oui/Non) pour télécharger.' };
    }
    return { complete: true, message: '' };
  }

  function updateDownloadButtons() {
    const { complete } = isAuditComplete();
    const hint = document.getElementById('auditDownloadHint');
    const btnHtml = document.getElementById('btnDownloadAudit');
    const btnPdf = document.getElementById('btnDownloadAuditPdf');
    if (hint) hint.textContent = complete ? 'Audit complet. Vous pouvez télécharger le rapport.' : 'Remplissez toutes les questions (Oui/Non) pour débloquer le téléchargement.';
    if (btnHtml) btnHtml.disabled = !complete;
    if (btnPdf) btnPdf.disabled = !complete;
  }

  function updateAuditScoreDisplay() {
    const totalEl = document.getElementById('auditScoreTotal');
    if (totalEl) totalEl.textContent = getAuditScore();
    for (let i = 1; i <= 25; i++) {
      const el = document.querySelector(`span[data-audit-score="${i}"]`);
      if (el) {
        const radio = document.querySelector(`input[name="audit_${i}"]:checked`);
        el.textContent = (radio && radio.value === 'oui') ? AUDIT_POIDS : 0;
      }
    }
  }

  function saveForm() {
    try {
      const state = collectAuditState();
      localStorage.setItem(AUDIT_FORM_KEY, JSON.stringify(state));
    } catch (e) { /* quota */ }
  }

  function getSavedAudits() {
    try {
      const raw = localStorage.getItem(AUDIT_SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSavedAudits(list) {
    try {
      localStorage.setItem(AUDIT_SAVED_KEY, JSON.stringify(list));
    } catch (e) { /* quota */ }
  }

  function saveAuditToList() {
    const state = collectAuditState();
    const nom = (state.audit?.nomEntreprise || '').trim() || 'Sans nom';
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const label = nom + ' — ' + dateStr;
    const id = slugify(nom) + '-' + Date.now();
    const list = getSavedAudits();
    list.unshift({ id: id, label: label, savedAt: new Date().toISOString(), state: state });
    saveSavedAudits(list);
    refreshSavedAuditList();
  }

  function refreshSavedAuditList() {
    const sel = document.getElementById('auditSavedList');
    if (!sel) return;
    const list = getSavedAudits();
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Choisir un audit --</option>';
    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.label;
      sel.appendChild(opt);
    });
    if (currentVal && list.some(item => item.id === currentVal)) sel.value = currentVal;
    const hasSelection = sel.value !== '';
    document.getElementById('btnLoadAudit').disabled = !hasSelection;
    document.getElementById('btnDeleteSavedAudit').disabled = !hasSelection;
  }

  function loadSavedAudit() {
    const sel = document.getElementById('auditSavedList');
    const id = sel?.value;
    if (!id) return;
    const list = getSavedAudits();
    const item = list.find(x => x.id === id);
    if (!item?.state) return;
    applyAuditState(item.state);
    updateAuditScoreDisplay();
    updateDownloadButtons();
    saveForm();
    showToast('Audit chargé.');
  }

  function deleteSavedAudit() {
    const sel = document.getElementById('auditSavedList');
    const id = sel?.value;
    if (!id) return;
    if (typeof confirm !== 'undefined' && !confirm('Supprimer cet audit enregistré ?')) return;
    const list = getSavedAudits().filter(x => x.id !== id);
    saveSavedAudits(list);
    refreshSavedAuditList();
    showToast('Audit supprimé.');
  }

  function resetAllAuditData() {
    if (typeof confirm !== 'undefined' && !confirm('Effacer toutes les données d\'audit ?\n\n• Brouillon actuel\n• Liste des audits enregistrés\n• Historique des scores (moyennes du radar)\n\nCette action est irréversible.')) return;
    try {
      localStorage.removeItem(AUDIT_FORM_KEY);
      localStorage.removeItem(AUDIT_SAVED_KEY);
      localStorage.removeItem(AUDIT_RESULTS_KEY);
    } catch (e) { /* ignore */ }
    resetForm();
    refreshSavedAuditList();
    updateDownloadButtons();
    showToast('Toutes les données d\'audit ont été effacées. Vous repartez de zéro.');
  }

  function loadForm() {
    try {
      const raw = localStorage.getItem(AUDIT_FORM_KEY);
      if (raw) applyAuditState(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    updateAuditScoreDisplay();
    updateDownloadButtons();
    refreshSavedAuditList();
  }

  function resetForm() {
    applyAuditState({
      audit: { nomEntreprise: '', taille: '', secteur: '', prenom: '', nom: '' },
      radios: {}
    });
    document.querySelectorAll('#auditSection input[type="radio"]').forEach(r => { r.checked = false; });
    updateAuditScoreDisplay();
    saveForm();
  }

  function buildReportHtml(forPdf) {
    const { audit, radios } = collectAuditState();
    const nomEntreprise = (audit?.nomEntreprise || '').trim() || 'Entreprise';
    const taille = (audit?.taille || '').trim();
    const secteur = (audit?.secteur || '').trim();
    const prenom = (audit?.prenom || '').trim();
    const nom = (audit?.nom || '').trim();
    const auditeLabel = [prenom, nom].filter(Boolean).join(' ') || '—';
    const tailleLabel = taille ? (AUDIT_TAILLE_LABELS[taille] || taille) : '';
    const secteurLabel = secteur ? (AUDIT_SECTEUR_LABELS[secteur] || secteur) : '';

    const pillarScores = getPillarScores(radios);
    if (taille || secteur) {
      saveAuditResult({
        taille: taille || undefined,
        secteur: secteur || undefined,
        pillarScores: pillarScores,
        date: new Date().toISOString()
      });
    }
    const { avgProfil, countProfil, profilLabel } = getAveragesByTailleAndSecteur(taille, secteur);

    const radarLabels = AUDIT_PILIERS.map(p => p.label);
    const radarData = {
      labels: radarLabels,
      current: pillarScores,
      avgProfil: countProfil > 0 ? avgProfil : null,
      profilLabel: profilLabel
    };
    const radarDataJson = JSON.stringify(radarData).replace(/<\/script/gi, '<\\/script');

    const rows = AUDIT_QUESTIONS.map(q => {
      const rep = radios['audit_' + q.id] || '';
      const score = rep === 'oui' ? AUDIT_POIDS : 0;
      const repLabel = rep === 'oui' ? 'Oui' : rep === 'non' ? 'Non' : '—';
      return `<tr><td>${escapeHtml(q.pilier)}</td><td>${q.id}</td><td>${escapeHtml(q.text)}</td><td>${escapeHtml(repLabel)}</td><td>${score}</td></tr>`;
    }).join('');
    const scoreTotal = getAuditScore();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport d'audit risque tiers — ${escapeHtml(nomEntreprise)} | Conitiv</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 6px; color: #1a1a1a; line-height: 1.25; width: 210mm; min-height: 297mm; max-height: 297mm; overflow: hidden; }
    .one-page { display: flex; flex-direction: column; height: 285mm; }
    .report-header { flex-shrink: 0; margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    h1 { font-size: 11px; margin: 0 0 2px; color: #0d47a1; }
    .meta { color: #444; font-size: 8px; margin: 0; }
    .meta-line { display: flex; flex-wrap: wrap; gap: 0 12px; }
    .report-body { display: flex; gap: 8px; flex: 1; min-height: 0; }
    .col-radar { flex: 0 0 42%; display: flex; flex-direction: column; }
    .col-radar h2 { font-size: 9px; margin: 0 0 2px; }
    .radar-wrap { flex: 1; min-height: 0; position: relative; }
    .radar-wrap canvas { max-width: 100%; max-height: 100%; width: auto !important; height: auto !important; }
    .col-table { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .col-table h2 { font-size: 9px; margin: 0 0 2px; }
    .table-wrap { flex: 1; overflow: hidden; font-size: 6px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 2px 3px; text-align: left; border: 1px solid #ddd; }
    th { font-weight: 600; background: #f0f0f0; }
    .score-total { flex-shrink: 0; font-size: 9px; font-weight: 600; margin: 4px 0 0; padding-top: 4px; border-top: 1px solid #ddd; }
    .footer { flex-shrink: 0; font-size: 6px; color: #888; margin-top: 2px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="one-page">
    <div class="report-header">
      <h1>Rapport d'audit — Risque tiers (cyber / TPRM)</h1>
      <div class="meta meta-line">
        <span><strong>Entreprise :</strong> ${escapeHtml(nomEntreprise)}</span>
        <span><strong>Audité :</strong> ${escapeHtml(auditeLabel)}</span>
        ${tailleLabel ? `<span><strong>Taille :</strong> ${escapeHtml(tailleLabel)}</span>` : ''}
        ${secteurLabel ? `<span><strong>Secteur :</strong> ${escapeHtml(secteurLabel)}</span>` : ''}
      </div>
    </div>
    <div class="report-body">
      <div class="col-radar">
        <h2>Score par pilier (radar)</h2>
        <div class="radar-wrap">
          <canvas id="auditRadarChart" width="280" height="280"></canvas>
        </div>
      </div>
      <div class="col-table">
        <h2>Détail des réponses</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Pilier</th><th>N°</th><th>Question</th><th>Rép.</th><th>Pt</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="score-total">Score total : ${scoreTotal} / ${AUDIT_SCORE_MAX}</p>
      </div>
    </div>
    <p class="footer">Document généré par Conitiv — Risk management tiers</p>
  </div>

  <script>
    (function() {
      var data = ${radarDataJson};
      if (typeof Chart === 'undefined') return;
      var ctx = document.getElementById('auditRadarChart');
      if (!ctx) return;
      var datasets = [
        { label: 'Votre audit', data: data.current, borderColor: '#0d47a1', backgroundColor: 'rgba(13, 71, 161, 0.2)', borderWidth: 2, pointBackgroundColor: '#0d47a1' }
      ];
      if (data.avgProfil && data.profilLabel) {
        datasets.push({ label: 'Moyenne (votre profil: ' + data.profilLabel + ')', data: data.avgProfil, borderColor: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.15)', borderWidth: 1.5, borderDash: [4, 2], pointBackgroundColor: '#2e7d32' });
      }
      new Chart(ctx, {
        type: 'radar',
        data: { labels: data.labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
          plugins: { legend: { position: 'bottom' } }
        }
      });
    })();
  <\/script>
</body>
</html>`;
  }

  function downloadAudit() {
    const { complete, message } = isAuditComplete();
    if (!complete) {
      showToast(message);
      return;
    }
    const html = buildReportHtml(false);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nomEntreprise = (collectAuditState().audit?.nomEntreprise || '').trim() || 'Entreprise';
    a.download = `Conitiv-Audit-${slugify(nomEntreprise)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    saveForm();
    showToast('Rapport d\'audit téléchargé.');
  }

  function downloadAuditPdf() {
    const { complete, message } = isAuditComplete();
    if (!complete) {
      showToast(message);
      return;
    }
    if (typeof html2pdf === 'undefined') {
      showToast('Génération PDF indisponible. Rechargez la page.');
      return;
    }
    const html = buildReportHtml(true);
    const filename = `Conitiv-Audit-${slugify((collectAuditState().audit?.nomEntreprise || '').trim() || 'Entreprise')}.pdf`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:794px;height:1123px;left:-9999px;top:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    function doPdf() {
      try {
        const el = iframe.contentDocument.body;
        if (!el) { document.body.removeChild(iframe); showToast('Erreur PDF.'); return; }
        html2pdf().set({
          margin: 5,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: 'avoid-all', avoid: ['tr', 'table'] }
        }).from(el).save().then(() => {
          document.body.removeChild(iframe);
          saveForm();
          showToast('Rapport PDF téléchargé.');
        }).catch(() => {
          document.body.removeChild(iframe);
          showToast('Erreur lors de la génération du PDF.');
        });
      } catch (e) {
        document.body.removeChild(iframe);
        showToast('Erreur lors de la génération du PDF.');
      }
    }
    iframe.onload = function () {
      setTimeout(doPdf, 2500);
    };
  }

  function showToast(msg) {
    const existing = document.getElementById('auditToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'auditToast';
    toast.setAttribute('role', 'status');
    toast.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:0.5rem 1rem;border-radius:6px;font-size:0.875rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  function init() {
    loadForm();
    updateDownloadButtons();
    document.getElementById('btnSaveAudit')?.addEventListener('click', () => {
      saveForm();
      saveAuditToList();
      showToast('Audit enregistré. Vous pouvez le recharger ou le supprimer.');
    });
    document.getElementById('auditSavedList')?.addEventListener('change', function () {
      const hasSelection = this.value !== '';
      document.getElementById('btnLoadAudit').disabled = !hasSelection;
      document.getElementById('btnDeleteSavedAudit').disabled = !hasSelection;
    });
    document.getElementById('btnLoadAudit')?.addEventListener('click', loadSavedAudit);
    document.getElementById('btnDeleteSavedAudit')?.addEventListener('click', deleteSavedAudit);
    document.getElementById('btnDownloadAudit')?.addEventListener('click', downloadAudit);
    document.getElementById('btnDownloadAuditPdf')?.addEventListener('click', downloadAuditPdf);
    document.getElementById('btnResetAudit')?.addEventListener('click', () => {
      if (typeof confirm !== 'undefined' && !confirm('Réinitialiser tout le formulaire d\'audit ?')) return;
      resetForm();
      updateDownloadButtons();
      showToast('Formulaire réinitialisé.');
    });
    document.getElementById('btnResetAllAudit')?.addEventListener('click', resetAllAuditData);
    document.getElementById('auditSection')?.addEventListener('change', function (e) {
      if (e.target && (e.target.name?.startsWith('audit_') || ['auditNomEntreprise', 'auditTaille', 'auditSecteur', 'auditPrenom', 'auditNom'].includes(e.target.id))) {
        updateAuditScoreDisplay();
        saveForm();
        updateDownloadButtons();
      }
    });
    document.getElementById('auditSection')?.addEventListener('input', function (e) {
      if (e.target && ['auditNomEntreprise', 'auditPrenom', 'auditNom'].includes(e.target.id)) {
        saveForm();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
