/**
 * Conitiv — Logique du calculateur de risque tiers (4 risques + consolidé)
 */

(function () {
  const sectorSelect = document.getElementById('sector');
  const sizeSelect = document.getElementById('size');

  function getSector() { return sectorSelect.value; }
  function getSize() { return sizeSelect.value; }

  // Parse "25–30 %" -> [25, 30]
  function parseProba(str) {
    if (!str) return [0, 0];
    const m = str.replace(/\s*%?\s*$/, '').split(/[–\-]/).map(s => parseFloat(s.trim()));
    return m.length >= 2 ? [m[0], m[1]] : [m[0] || 0, m[0] || 0];
  }

  // Parse "350k–900k" or "1,2M–3,2M" -> [min, max] in euros
  function parseImpact(str) {
    if (!str) return [0, 0];
    const parts = str.replace(/,/g, '.').split(/[–\-]/).map(s => s.trim());
    const toNum = (s) => {
      const n = parseFloat(s.replace(/[kKmM]/g, ''));
      if (s.toLowerCase().includes('m')) return n * 1e6;
      if (s.toLowerCase().includes('k')) return n * 1e3;
      return n;
    };
    return parts.length >= 2 ? [toNum(parts[0]), toNum(parts[1])] : [toNum(parts[0]), toNum(parts[0])];
  }

  // Midpoint of impact range, in k€ (for input default)
  function impactMidpointK(str) {
    const [min, max] = parseImpact(str);
    return Math.round((min + max) / 2 / 1000);
  }

  function formatRisk(euros) {
    if (euros >= 1e6) return (euros / 1e6).toFixed(1).replace('.', ',') + ' M€';
    if (euros >= 1e3) return Math.round(euros / 1e3) + ' k€';
    return Math.round(euros) + ' €';
  }

  // Parse risk string (e.g. "18–72 k€" or "28 k€") to euros
  function parseRiskToEuros(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim();
    if (!s || s === '—' || s === '–') return null;
    const m = s.match(/([\d,]+)\s*[–\-]\s*([\d,]+)\s*k/i);
    if (m) {
      const mid = (parseFloat(m[1].replace(',', '.')) + parseFloat(m[2].replace(',', '.'))) / 2;
      return mid * 1000;
    }
    const singleK = s.match(/([\d,\.]+)\s*k/i);
    if (singleK) return parseFloat(singleK[1].replace(',', '.')) * 1000;
    const singleM = s.match(/([\d,\.]+)\s*M/i);
    if (singleM) return parseFloat(singleM[1].replace(',', '.')) * 1e6;
    const [min, max] = parseImpact(s);
    if (min > 0 || max > 0) return (min + max) / 2;
    return null;
  }

  // === Onglets ===
  function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        btns.forEach(b => b.classList.remove('tab-btn--active'));
        btn.classList.add('tab-btn--active');
        panels.forEach(p => {
          p.classList.toggle('tab-panel--active', p.id === `panel-${tab}`);
        });
      });
    });
  }

  // === Probabilités personnalisées (chiffres précis) ===
  function getCustomProbas() {
    const p1 = parseFloat(document.getElementById('inputPIncident').value);
    const p2 = parseFloat(document.getElementById('inputPTiers').value);
    return { p1: isNaN(p1) ? null : p1, p2: isNaN(p2) ? null : p2 };
  }

  function applyProbasFromRef() {
    const sector = getSector();
    const size = getSize();
    const prob = PROBABILITES_CYBER[sector]?.[size];
    if (!prob) return;
    const [p1Min, p1Max] = parseProba(prob.pIncident);
    const [p2Min, p2Max] = parseProba(prob.pTiers);
    const p1Mid = ((p1Min + p1Max) / 2).toFixed(1);
    const p2Mid = ((p2Min + p2Max) / 2).toFixed(1);
    document.getElementById('inputPIncident').value = p1Mid;
    document.getElementById('inputPTiers').value = p2Mid;
  }

  function getCustomImpacts() {
    const d = parseFloat(document.getElementById('inputImpactDirect').value);
    const i = parseFloat(document.getElementById('inputImpactIndirect').value);
    return { directK: isNaN(d) ? null : d, indirectK: isNaN(i) ? null : i };
  }

  function applyImpactsFromRef() {
    const sector = getSector();
    const size = getSize();
    const impacts = IMPACTS_OPERATIONNELS[sector]?.[size];
    if (!impacts) return;
    document.getElementById('inputImpactDirect').value = impactMidpointK(impacts.direct);
    document.getElementById('inputImpactIndirect').value = impactMidpointK(impacts.indirect);
  }

  let lastRiskEuros = null;
  let lastNis2Euros = 0;

  function recalcFromInputs() {
    recalcNis2();
    const { p1, p2 } = getCustomProbas();
    const { directK, indirectK } = getCustomImpacts();
    const sector = getSector();
    const size = getSize();
    const prob = PROBABILITES_CYBER[sector]?.[size];
    const impactsRef = IMPACTS_OPERATIONNELS[sector]?.[size];

    const hasProbas = p1 != null && p2 != null && p1 >= 0 && p1 <= 100 && p2 >= 0 && p2 <= 100;
    const hasImpacts = directK != null && indirectK != null && directK >= 0 && indirectK >= 0;

    if (hasProbas) {
      const pViaTiers = (p1 / 100) * (p2 / 100) * 100;
      document.getElementById('pIncident').textContent = p1 + ' %';
      document.getElementById('pTiers').textContent = p2 + ' %';
      document.getElementById('pViaTiers').textContent = pViaTiers.toFixed(2) + ' %';
    } else if (prob) {
      document.getElementById('pIncident').textContent = prob.pIncident;
      document.getElementById('pTiers').textContent = prob.pTiers;
      document.getElementById('pViaTiers').textContent = prob.pViaTiers;
    }

    if (hasImpacts) {
      const totalK = directK + indirectK;
      document.getElementById('impactDirect').textContent = directK + ' k€';
      document.getElementById('impactIndirect').textContent = indirectK + ' k€';
      document.getElementById('impactTotal').textContent = totalK + ' k€';
      const impactTotalEuros = totalK * 1000;
      if (hasProbas) {
        const pViaTiers = (p1 / 100) * (p2 / 100) * 100;
        const risk = (pViaTiers / 100) * impactTotalEuros;
        lastRiskEuros = risk;
        const totalRisk = risk + lastNis2Euros;
        const riskStr = formatRisk(risk);
        document.getElementById('risqueFinancier').textContent = formatRisk(totalRisk);
        const bd1 = document.getElementById('risqueCyberBreakdown');
        if (bd1) bd1.textContent = 'Risque cyber : ' + riskStr + (lastNis2Euros > 0 ? ' + Exposition NIS2 : ' + formatRisk(lastNis2Euros) : '');
        const consCyber = document.getElementById('consCyber');
        if (consCyber) consCyber.textContent = formatRisk(totalRisk);
      } else if (prob) {
        const [pMin, pMax] = parseProba(prob.pViaTiers);
        const pMid = (pMin + pMax) / 200;
        const risk = pMid * impactTotalEuros;
        lastRiskEuros = risk;
        const totalRisk = risk + lastNis2Euros;
        document.getElementById('risqueFinancier').textContent = formatRisk(totalRisk);
        const bd = document.getElementById('risqueCyberBreakdown');
        if (bd) bd.textContent = 'Risque cyber : ' + formatRisk(risk) + (lastNis2Euros > 0 ? ' + Exposition NIS2 : ' + formatRisk(lastNis2Euros) : '');
        const consCyber = document.getElementById('consCyber');
        if (consCyber) consCyber.textContent = formatRisk(totalRisk);
      }
    } else if (impactsRef) {
      document.getElementById('impactDirect').textContent = impactsRef.direct;
      document.getElementById('impactIndirect').textContent = impactsRef.indirect;
      document.getElementById('impactTotal').textContent = impactsRef.total;
    }

    if (hasProbas && !hasImpacts && impactsRef) {
      const pViaTiers = (p1 / 100) * (p2 / 100) * 100;
      const [impMin, impMax] = parseImpact(impactsRef.total);
      const risk = (pViaTiers / 100) * ((impMin + impMax) / 2);
      lastRiskEuros = risk;
      const totalRisk = risk + lastNis2Euros;
      document.getElementById('risqueFinancier').textContent = formatRisk(totalRisk);
      const bd2 = document.getElementById('risqueCyberBreakdown');
      if (bd2) bd2.textContent = 'Risque cyber : ' + formatRisk(risk) + (lastNis2Euros > 0 ? ' + Exposition NIS2 : ' + formatRisk(lastNis2Euros) : '');
      const consCyber = document.getElementById('consCyber');
      if (consCyber) consCyber.textContent = formatRisk(totalRisk);
    } else if (!hasProbas && prob) {
      const refRisque = RISQUE_FINANCIER_ANNUEL[sector]?.[size] || '—';
      lastRiskEuros = parseRiskToEuros(refRisque);
      const risk = lastRiskEuros ?? 0;
      const totalRisk = risk + lastNis2Euros;
      document.getElementById('risqueFinancier').textContent = formatRisk(totalRisk);
      const bd3 = document.getElementById('risqueCyberBreakdown');
      if (bd3) bd3.textContent = 'Risque cyber : ' + (lastRiskEuros != null ? formatRisk(risk) : refRisque) + (lastNis2Euros > 0 ? ' + Exposition NIS2 : ' + formatRisk(lastNis2Euros) : '');
      const consCyber = document.getElementById('consCyber');
      if (consCyber) consCyber.textContent = formatRisk(totalRisk);
    } else if (!hasImpacts && impactsRef && !hasProbas) {
      const refRisque = RISQUE_FINANCIER_ANNUEL[sector]?.[size] || '—';
      lastRiskEuros = parseRiskToEuros(refRisque);
      const risk = lastRiskEuros ?? 0;
      const totalRisk = risk + lastNis2Euros;
      document.getElementById('risqueFinancier').textContent = formatRisk(totalRisk);
      const bd4 = document.getElementById('risqueCyberBreakdown');
      if (bd4) bd4.textContent = 'Risque cyber : ' + (lastRiskEuros != null ? formatRisk(risk) : refRisque) + (lastNis2Euros > 0 ? ' + Exposition NIS2 : ' + formatRisk(lastNis2Euros) : '');
      const consCyber = document.getElementById('consCyber');
      if (consCyber) consCyber.textContent = formatRisk(totalRisk);
    } else {
      lastRiskEuros = null;
      if (lastNis2Euros > 0) {
        document.getElementById('risqueFinancier').textContent = formatRisk(lastNis2Euros);
        const bd5 = document.getElementById('risqueCyberBreakdown');
        if (bd5) bd5.textContent = 'Exposition NIS2 : ' + formatRisk(lastNis2Euros);
        const consCyber = document.getElementById('consCyber');
        if (consCyber) consCyber.textContent = formatRisk(lastNis2Euros);
      } else {
        document.getElementById('risqueFinancier').textContent = '—';
        const bd5 = document.getElementById('risqueCyberBreakdown');
        if (bd5) bd5.textContent = 'Risque cyber = Probabilité incident via tiers × Impact total moyen. + Exposition NIS2 (si applicable).';
        const consCyber = document.getElementById('consCyber');
        if (consCyber) consCyber.textContent = '—';
      }
    }
    updateROI();
    updateConsolide();
  }

  function updateROI() {
    const investInput = document.getElementById('inputInvestissement');
    const investK = parseFloat(investInput?.value);
    const roiEl = document.getElementById('roiValue');
    const economieEl = document.getElementById('roiEconomie');
    const riskEviteEl = document.getElementById('risqueEviteCyber');
    if (!roiEl) return;
    const ratioInput = parseFloat(document.getElementById('inputRatioCyber')?.value);
    const ratio = (!isNaN(ratioInput) && ratioInput >= 0 && ratioInput <= 100) ? ratioInput / 100 : 0.40;
    const ratioNis2 = (typeof REDUCTION_SCORING !== 'undefined' && REDUCTION_SCORING?.rgpd?.default) ?? 0.75;
    const riskCyber = lastRiskEuros ?? 0;
    const riskEvite = (riskCyber * ratio) + (lastNis2Euros * ratioNis2);
    if (investK == null || isNaN(investK) || investK <= 0) {
      roiEl.textContent = '—';
      if (economieEl) economieEl.textContent = '';
      if (riskEviteEl) riskEviteEl.textContent = riskEvite > 0 ? formatRisk(riskEvite) : '—';
      return;
    }
    const investEuros = investK * 1000;
    if (riskEviteEl) riskEviteEl.textContent = formatRisk(riskEvite);
    const roi = ((riskEvite - investEuros) / investEuros) * 100;
    roiEl.textContent = roi.toFixed(0) + ' %';
    if (economieEl) {
      const economieParEuro = riskEvite / investEuros;
      economieEl.textContent = economieParEuro >= 0.01
        ? `Pour 1 € investi : ${economieParEuro.toFixed(2).replace('.', ',')} € d'exposition évitée grâce au scoring`
        : '';
    }
  }

  // === Onglet Cyber ===
  function updateCyber() {
    const sector = getSector();
    const size = getSize();

    const prob = PROBABILITES_CYBER[sector]?.[size];
    if (prob) {
      document.getElementById('refPIncident').textContent = prob.pIncident;
      document.getElementById('refPTiers').textContent = prob.pTiers;
      applyProbasFromRef();
      recalcFromInputs();
    }

    const impacts = IMPACTS_OPERATIONNELS[sector]?.[size];
    if (impacts) {
      document.getElementById('refImpactDirect').textContent = impacts.direct;
      document.getElementById('refImpactIndirect').textContent = impacts.indirect;
      applyImpactsFromRef();
    }

    const exemples = IMPACTS_EXEMPLES[sector];
    const exemplesEl = document.getElementById('impactsExemplesContent');
    if (exemplesEl && exemples) {
      exemplesEl.innerHTML = `
        <div class="exemples-col">
          <h4>Impact direct</h4>
          <ul>${exemples.direct.map(e => `<li>${e}</li>`).join('')}</ul>
        </div>
        <div class="exemples-col">
          <h4>Impact indirect</h4>
          <ul>${exemples.indirect.map(e => `<li>${e}</li>`).join('')}</ul>
        </div>
      `;
    }

    const p2026 = PROBABILITES_CYBER_2026[sector]?.[size]?.pViaTiers;
    const el2026 = document.getElementById('pViaTiers2026');
    if (el2026 && p2026) el2026.textContent = p2026;

    recalcNis2();
  }

  function recalcNis2() {
    const entityType = document.getElementById('nis2EntityType')?.value;
    const caM = parseFloat(document.getElementById('nis2Ca')?.value);
    const situation = document.getElementById('nis2Situation')?.value;

    const amendeMaxEl = document.getElementById('nis2AmendeMax');
    const probaEl = document.getElementById('nis2Proba');
    const expositionEl = document.getElementById('nis2Exposition');

    const PROBA_NIS2 = { sans: 0.005, incident: 0.30, nonconformite: 0.60 };
    const proba = PROBA_NIS2[situation] ?? 0.005;
    const probaLabel = situation === 'sans' ? '< 1 %' : situation === 'incident' ? '30 %' : '60 %';

    let amendeMax = 0;
    if (entityType === 'essentielle') {
      const plafond = 10e6;
      const pctCa = (caM != null && !isNaN(caM) && caM > 0) ? caM * 1e6 * 0.02 : 0;
      amendeMax = Math.max(plafond, pctCa);
    } else if (entityType === 'importante') {
      const plafond = 7e6;
      const pctCa = (caM != null && !isNaN(caM) && caM > 0) ? caM * 1e6 * 0.014 : plafond;
      amendeMax = Math.max(plafond, pctCa);
    }

    const exposition = amendeMax * proba;
    lastNis2Euros = exposition;

    if (amendeMaxEl) amendeMaxEl.textContent = amendeMax > 0 ? formatRisk(amendeMax) : '—';
    if (probaEl) probaEl.textContent = probaLabel;
    if (expositionEl) expositionEl.textContent = exposition > 0 ? formatRisk(exposition) : '—';
  }

  // === Onglet ESG ===
  let lastEsgEuros = null;

  function getCustomEsgImpact() {
    const k = parseFloat(document.getElementById('inputEsgImpact')?.value);
    return isNaN(k) ? null : k;
  }

  function applyEsgFromRef() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_ESG[sector]?.[size];
    if (!data) return;
    const [min, max] = parseImpact(data.impact);
    document.getElementById('inputEsgImpact').value = Math.round((min + max) / 2 / 1000);
  }

  function recalcEsg() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_ESG[sector]?.[size];
    const customK = getCustomEsgImpact();

    if (data) {
      document.getElementById('refEsgImpact').textContent = data.impact;
      document.getElementById('esgCsrd').textContent = data.csrd;
      document.getElementById('esgDevoir').textContent = data.devoirVigilance;
      document.getElementById('esgEnv').textContent = data.env;
      document.getElementById('esgSocial').textContent = data.social;
      document.getElementById('esgGov').textContent = data.gov;
    }

    if (customK != null && customK >= 0) {
      lastEsgEuros = customK * 1000;
      document.getElementById('esgImpactCalc').textContent = customK + ' k€';
      document.getElementById('risqueEsg').textContent = formatRisk(lastEsgEuros);
      const consEsg = document.getElementById('consEsg');
      if (consEsg) consEsg.textContent = formatRisk(lastEsgEuros);
    } else if (data) {
      const impactStr = (data.impact || '').replace(/\s*€\s*$/, '');
      lastEsgEuros = parseRiskToEuros(impactStr);
      if (lastEsgEuros == null) {
        const [a, b] = parseImpact(impactStr);
        lastEsgEuros = (a + b) / 2;
      }
      document.getElementById('esgImpactCalc').textContent = data.impact;
      document.getElementById('risqueEsg').textContent = data.impact;
      document.getElementById('esgImpact').textContent = data.impact;
      const consEsg = document.getElementById('consEsg');
      if (consEsg) consEsg.textContent = data.impact;
    } else {
      lastEsgEuros = null;
    }
    updateRoiEsg();
    updateConsolide();
  }

  function updateRoiEsg() {
    const investK = parseFloat(document.getElementById('inputInvestissementEsg')?.value);
    const roiEl = document.getElementById('roiEsg');
    const economieEl = document.getElementById('roiEconomieEsg');
    const ratio = (typeof REDUCTION_SCORING !== 'undefined' && REDUCTION_SCORING?.esg?.default) ?? 0.65;
    if (!roiEl) return;
    if (lastEsgEuros == null || investK == null || isNaN(investK) || investK <= 0) {
      roiEl.textContent = '—';
      if (economieEl) economieEl.textContent = '';
      return;
    }
    const investEuros = investK * 1000;
    const riskEvite = lastEsgEuros * ratio;
    const roi = ((riskEvite - investEuros) / investEuros) * 100;
    roiEl.textContent = roi.toFixed(0) + ' %';
    if (economieEl) {
      const economieParEuro = riskEvite / investEuros;
      economieEl.textContent = economieParEuro >= 0.01
        ? `Pour 1 € investi : ${economieParEuro.toFixed(2).replace('.', ',')} € d'exposition évitée grâce au scoring`
        : '';
    }
  }

  function updateEsg() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_ESG[sector]?.[size];
    if (data) {
      document.getElementById('refEsgImpact').textContent = data.impact;
      applyEsgFromRef();
      recalcEsg();
    }
  }

  // === Onglet RGPD ===
  let lastRgpdEuros = null;

  function getCustomRgpd() {
    const rgpd = parseFloat(document.getElementById('inputRgpd')?.value);
    const nis2 = parseFloat(document.getElementById('inputNis2')?.value);
    const dora = parseFloat(document.getElementById('inputDora')?.value);
    return {
      rgpdK: isNaN(rgpd) ? null : rgpd,
      nis2K: isNaN(nis2) ? null : nis2,
      doraK: isNaN(dora) ? null : dora
    };
  }

  function applyRgpdFromRef() {
    const sector = getSector();
    const size = getSize();
    const amendes = AMENDES_REGLEMENTAIRES[sector]?.[size];
    if (!amendes) return;
    document.getElementById('inputRgpd').value = impactMidpointK(amendes.rgpd);
    document.getElementById('inputNis2').value = impactMidpointK(amendes.nis2);
    document.getElementById('inputDora').value = amendes.dora === '—' ? '' : impactMidpointK(amendes.dora);
  }

  function recalcRgpd() {
    const sector = getSector();
    const size = getSize();
    const amendes = AMENDES_REGLEMENTAIRES[sector]?.[size];
    const custom = getCustomRgpd();

    if (amendes) {
      document.getElementById('refRgpd').textContent = amendes.rgpd;
      document.getElementById('refNis2').textContent = amendes.nis2;
      document.getElementById('refDora').textContent = amendes.dora || '—';
    }

    const hasRgpd = custom.rgpdK != null && custom.rgpdK >= 0;
    const hasNis2 = custom.nis2K != null && custom.nis2K >= 0;
    const hasDora = custom.doraK != null && custom.doraK >= 0;

    if (hasRgpd || hasNis2 || hasDora) {
      const rgpdK = hasRgpd ? custom.rgpdK : (amendes ? impactMidpointK(amendes.rgpd) : 0);
      const nis2K = hasNis2 ? custom.nis2K : (amendes ? impactMidpointK(amendes.nis2) : 0);
      const doraK = hasDora ? custom.doraK : (amendes && amendes.dora !== '—' ? impactMidpointK(amendes.dora) : 0);
      const totalK = rgpdK + nis2K + doraK;
      lastRgpdEuros = totalK * 1000;
      document.getElementById('rgpdAmende').textContent = hasRgpd ? custom.rgpdK + ' k€' : amendes?.rgpd || '—';
      document.getElementById('nis2Amende').textContent = hasNis2 ? custom.nis2K + ' k€' : amendes?.nis2 || '—';
      document.getElementById('doraAmende').textContent = hasDora ? custom.doraK + ' k€' : amendes?.dora || '—';
      document.getElementById('rgpdTotal').textContent = formatRisk(lastRgpdEuros);
      document.getElementById('risqueRgpd').textContent = formatRisk(lastRgpdEuros);
      const consRgpd = document.getElementById('consRgpd');
      if (consRgpd) consRgpd.textContent = formatRisk(lastRgpdEuros);
    } else if (amendes) {
      lastRgpdEuros = parseRiskToEuros(amendes.total);
      document.getElementById('rgpdAmende').textContent = amendes.rgpd;
      document.getElementById('nis2Amende').textContent = amendes.nis2;
      document.getElementById('doraAmende').textContent = amendes.dora || '—';
      document.getElementById('rgpdTotal').textContent = amendes.total;
      document.getElementById('risqueRgpd').textContent = amendes.total;
      const consRgpd = document.getElementById('consRgpd');
      if (consRgpd) consRgpd.textContent = amendes.total;
    }
    updateRoiRgpd();
    updateConsolide();
  }

  function updateRoiRgpd() {
    const investK = parseFloat(document.getElementById('inputInvestissementRgpd')?.value);
    const roiEl = document.getElementById('roiRgpd');
    const economieEl = document.getElementById('roiEconomieRgpd');
    const ratio = (typeof REDUCTION_SCORING !== 'undefined' && REDUCTION_SCORING?.rgpd?.default) ?? 0.75;
    if (!roiEl) return;
    if (lastRgpdEuros == null || investK == null || isNaN(investK) || investK <= 0) {
      roiEl.textContent = '—';
      if (economieEl) economieEl.textContent = '';
      return;
    }
    const investEuros = investK * 1000;
    const riskEvite = lastRgpdEuros * ratio;
    const roi = ((riskEvite - investEuros) / investEuros) * 100;
    roiEl.textContent = roi.toFixed(0) + ' %';
    if (economieEl) {
      const economieParEuro = riskEvite / investEuros;
      economieEl.textContent = economieParEuro >= 0.01
        ? `Pour 1 € investi : ${economieParEuro.toFixed(2).replace('.', ',')} € d'exposition évitée grâce au scoring`
        : '';
    }
  }

  function updateRgpd() {
    const sector = getSector();
    const size = getSize();
    const amendes = AMENDES_REGLEMENTAIRES[sector]?.[size];
    if (amendes) {
      applyRgpdFromRef();
      recalcRgpd();
    }
  }

  // === Onglet Défaillance ===
  let lastDefaillanceEuros = null;

  function getCustomDefaillance() {
    const p = parseFloat(document.getElementById('inputPDefaillance')?.value);
    const impactK = parseFloat(document.getElementById('inputDefImpact')?.value);
    return { p: isNaN(p) ? null : p, impactK: isNaN(impactK) ? null : impactK };
  }

  function applyDefaillanceFromRef() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_DEFAILLANCE[sector]?.[size];
    if (!data) return;
    const [pMin, pMax] = parseProba(data.pDefaillance);
    document.getElementById('inputPDefaillance').value = ((pMin + pMax) / 2).toFixed(1);
    document.getElementById('inputDefImpact').value = impactMidpointK(data.impact);
  }

  function recalcDefaillance() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_DEFAILLANCE[sector]?.[size];
    const custom = getCustomDefaillance();

    if (data) {
      document.getElementById('refPDefaillance').textContent = data.pDefaillance;
      document.getElementById('refDefImpact').textContent = data.impact;
      document.getElementById('defDependance').textContent = data.dependance;
      document.getElementById('defDomino').textContent = data.domino;
    }

    const hasCustom = custom.p != null && custom.p >= 0 && custom.p <= 100 && custom.impactK != null && custom.impactK >= 0;

    if (hasCustom) {
      const riskEuros = (custom.p / 100) * (custom.impactK * 1000);
      lastDefaillanceEuros = riskEuros;
      document.getElementById('defPDefaillance').textContent = custom.p + ' %';
      document.getElementById('defImpact').textContent = custom.impactK + ' k€';
      document.getElementById('defRisqueCalc').textContent = formatRisk(riskEuros);
      document.getElementById('risqueDefaillance').textContent = formatRisk(riskEuros);
      const consDef = document.getElementById('consDefaillance');
      if (consDef) consDef.textContent = formatRisk(riskEuros);
    } else if (data) {
      lastDefaillanceEuros = parseRiskToEuros(RISQUE_FINANCIER_DEFAILLANCE[sector]?.[size]);
      document.getElementById('defPDefaillance').textContent = data.pDefaillance;
      document.getElementById('defImpact').textContent = data.impact;
      document.getElementById('defRisqueCalc').textContent = RISQUE_FINANCIER_DEFAILLANCE[sector]?.[size] || '—';
      document.getElementById('risqueDefaillance').textContent = RISQUE_FINANCIER_DEFAILLANCE[sector]?.[size] || '—';
      const consDef = document.getElementById('consDefaillance');
      if (consDef) consDef.textContent = RISQUE_FINANCIER_DEFAILLANCE[sector]?.[size] || '—';
    }
    updateRoiDefaillance();
    updateConsolide();
  }

  function updateRoiDefaillance() {
    const investK = parseFloat(document.getElementById('inputInvestissementDefaillance')?.value);
    const roiEl = document.getElementById('roiDefaillance');
    const economieEl = document.getElementById('roiEconomieDefaillance');
    const ratio = (typeof REDUCTION_SCORING !== 'undefined' && REDUCTION_SCORING?.defaillance?.default) ?? 0.55;
    if (!roiEl) return;
    if (lastDefaillanceEuros == null || investK == null || isNaN(investK) || investK <= 0) {
      roiEl.textContent = '—';
      if (economieEl) economieEl.textContent = '';
      return;
    }
    const investEuros = investK * 1000;
    const riskEvite = lastDefaillanceEuros * ratio;
    const roi = ((riskEvite - investEuros) / investEuros) * 100;
    roiEl.textContent = roi.toFixed(0) + ' %';
    if (economieEl) {
      const economieParEuro = riskEvite / investEuros;
      economieEl.textContent = economieParEuro >= 0.01
        ? `Pour 1 € investi : ${economieParEuro.toFixed(2).replace('.', ',')} € d'exposition évitée grâce au scoring`
        : '';
    }
  }

  function updateDefaillance() {
    const sector = getSector();
    const size = getSize();
    const data = RISQUE_DEFAILLANCE[sector]?.[size];
    if (data) {
      applyDefaillanceFromRef();
      recalcDefaillance();
    }
  }

  // === Onglet Consolidé ===
  function updateConsolide() {
    const sector = getSector();
    const size = getSize();

    const cyberEl = document.getElementById('consCyber');
    const esgEl = document.getElementById('consEsg');
    const rgpdEl = document.getElementById('consRgpd');
    const defEl = document.getElementById('consDefaillance');

    if (cyberEl) cyberEl.textContent = lastRiskEuros != null ? formatRisk(lastRiskEuros) : (RISQUE_FINANCIER_ANNUEL[sector]?.[size] || '—');
    if (esgEl) esgEl.textContent = lastEsgEuros != null ? formatRisk(lastEsgEuros) : (RISQUE_ESG[sector]?.[size]?.impact || '—');
    if (rgpdEl) rgpdEl.textContent = lastRgpdEuros != null ? formatRisk(lastRgpdEuros) : (AMENDES_REGLEMENTAIRES[sector]?.[size]?.total || '—');
    if (defEl) defEl.textContent = lastDefaillanceEuros != null ? formatRisk(lastDefaillanceEuros) : (RISQUE_FINANCIER_DEFAILLANCE[sector]?.[size] || '—');
  }

  function updateReferences() {
    const sector = getSector();
    const size = getSize();
    const refs = (REFERENCES || []).filter(r => {
      const matchSector = !r.sectors?.length || r.sectors.includes(sector);
      const matchSize = !r.sizes?.length || r.sizes.includes(size);
      return matchSector && matchSize;
    });
    const cardIds = { proba: 'refsProba', tendance2026: 'refsTendance2026', impacts: 'refsImpacts', risque: 'refsRisque', roi: 'refsRoi', reduction: 'refsReduction' };
    Object.entries(cardIds).forEach(([card, id]) => {
      const cardRefs = refs.filter(r => r.cards?.includes(card));
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = cardRefs.length
        ? '<span class="card-refs-label">Sources :</span> ' + cardRefs.map(r =>
            `<a href="${r.url}" target="_blank" rel="noopener" class="ref-link">${r.source} (${r.year})</a>`
          ).join(', ')
        : '';
    });
    const globalEl = document.getElementById('referencesContent');
    if (globalEl) {
      globalEl.innerHTML = refs.map(r =>
        `<a href="${r.url}" target="_blank" rel="noopener" class="ref-link">
          <span class="ref-source">${r.source} (${r.year})</span>
          <span class="ref-title">${r.title}</span>
        </a>`
      ).join('');
    }
  }

  function updateAll() {
    updateCyber();
    updateEsg();
    updateRgpd();
    updateDefaillance();
    updateConsolide();
    updateReferences();
  }

  function init() {
    initTabs();
    updateAll();

    sectorSelect.addEventListener('change', updateAll);
    sizeSelect.addEventListener('change', updateAll);

    ['inputPIncident', 'inputPTiers', 'inputImpactDirect', 'inputImpactIndirect'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalcFromInputs);
      document.getElementById(id)?.addEventListener('change', recalcFromInputs);
    });
    const investEl = document.getElementById('inputInvestissement');
    if (investEl) {
      investEl.addEventListener('input', recalcFromInputs);
      investEl.addEventListener('change', recalcFromInputs);
    }
    document.getElementById('inputRatioCyber')?.addEventListener('input', recalcFromInputs);
    document.getElementById('inputRatioCyber')?.addEventListener('change', recalcFromInputs);
    ['nis2EntityType', 'nis2Ca', 'nis2Situation'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalcFromInputs);
      document.getElementById(id)?.addEventListener('change', recalcFromInputs);
    });
    document.getElementById('inputEsgImpact')?.addEventListener('input', recalcEsg);
    document.getElementById('inputEsgImpact')?.addEventListener('change', recalcEsg);
    document.getElementById('inputInvestissementEsg')?.addEventListener('input', recalcEsg);
    document.getElementById('inputInvestissementEsg')?.addEventListener('change', recalcEsg);

    ['inputRgpd', 'inputNis2', 'inputDora'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalcRgpd);
      document.getElementById(id)?.addEventListener('change', recalcRgpd);
    });
    document.getElementById('inputInvestissementRgpd')?.addEventListener('input', recalcRgpd);
    document.getElementById('inputInvestissementRgpd')?.addEventListener('change', recalcRgpd);

    ['inputPDefaillance', 'inputDefImpact'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalcDefaillance);
      document.getElementById(id)?.addEventListener('change', recalcDefaillance);
    });
    document.getElementById('inputInvestissementDefaillance')?.addEventListener('input', recalcDefaillance);
    document.getElementById('inputInvestissementDefaillance')?.addEventListener('change', recalcDefaillance);

    document.getElementById('btnResetProbas')?.addEventListener('click', () => {
      applyProbasFromRef();
      recalcFromInputs();
    });
    document.getElementById('btnResetImpacts')?.addEventListener('click', () => {
      applyImpactsFromRef();
      recalcFromInputs();
    });
    document.getElementById('btnResetEsg')?.addEventListener('click', () => {
      applyEsgFromRef();
      recalcEsg();
    });
    document.getElementById('btnResetRgpd')?.addEventListener('click', () => {
      applyRgpdFromRef();
      recalcRgpd();
    });
    document.getElementById('btnResetDefaillance')?.addEventListener('click', () => {
      applyDefaillanceFromRef();
      recalcDefaillance();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
