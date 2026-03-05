/**
 * Conitiv — Configuration des questions du processus de vente
 * Permet de charger une config depuis le DOM ou le localStorage et de réappliquer le rendu.
 */
(function () {
  const CONFIG_KEY = 'conitiv_processus_questions_config';

  function getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  function escapeAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Construit la config à partir du DOM actuel (RDV + axes + questions). */
  function buildQuestionsConfigFromDOM() {
    const rdvs = [];
    document.querySelectorAll('.rdv-section[id^="rdv"]').forEach((rdvEl) => {
      const id = (rdvEl.id || '').replace('rdv', '');
      const h2 = rdvEl.querySelector('.rdv-header h2');
      const title = (h2?.textContent || '').trim();
      if (id) rdvs.push({ rdv: String(id), title });
    });

    const axes = [];
    document.querySelectorAll('.questions-list[data-rdv][data-axe]').forEach((listEl) => {
      const rdv = listEl.dataset.rdv;
      const axe = listEl.dataset.axe;
      const axeEl = listEl.closest('.axe');
      const title = axeEl ? (axeEl.querySelector('h4')?.textContent || '').trim() : '';
      const questions = [];
      listEl.querySelectorAll('.question-block').forEach((block) => {
        const champ = block.querySelector('.question-champ');
        const textEl = block.querySelector('.question-text');
        const id = champ?.dataset?.q || `q_${rdv}_${axe}_${questions.length}`;
        let type = 'textarea';
        let options = null;
        if (champ?.classList?.contains('question-champ--checkboxes')) {
          type = 'checkbox';
          options = Array.from(champ.querySelectorAll('input[type="checkbox"]')).map(cb => cb.value).filter(Boolean);
        } else {
          const tag = champ?.tagName?.toLowerCase() || 'textarea';
          type = tag === 'textarea' ? 'textarea' : (champ?.type === 'number' ? 'number' : 'text');
        }
        const dirsStr = block.dataset.directions || '';
        const directions = dirsStr ? dirsStr.split(',').map(s => s.trim()).filter(Boolean) : null;
        const swId = (block.dataset.showWhenQuestion || '').trim();
        const swOpts = (block.dataset.showWhenOptions || '').split('|').map(s => s.trim()).filter(Boolean);
        const q = {
          id,
          text: (textEl?.textContent || '').trim(),
          type,
          placeholder: (champ?.getAttribute('placeholder') || '').trim() || 'Réponse du prospect...',
          risque: block.dataset.risque || null,
          direction: block.dataset.direction || null
        };
        if (directions && directions.length) q.directions = directions;
        if (swId && swOpts.length) q.showWhen = { questionId: swId, options: swOpts };
        if (options) q.options = options;
        questions.push(q);
      });
      axes.push({ rdv, axe, title, questions });
    });
    return { version: 2, rdvs, axes };
  }

  function applyRdvTitles(config) {
    (config.rdvs || []).forEach((r) => {
      const rdvEl = document.getElementById('rdv' + r.rdv);
      if (!rdvEl) return;
      const h2 = rdvEl.querySelector('.rdv-header h2');
      if (h2 && r.title) h2.textContent = r.title;
    });
  }

  function computeNomenclature(config) {
    const nomenclatures = {};
    const childCount = {};
    let topLevelIndex = 0;
    const byRdv = new Map();
    (config.axes || []).forEach((axis) => {
      const r = String(axis.rdv);
      if (!byRdv.has(r)) byRdv.set(r, []);
      byRdv.get(r).push(axis);
    });
    const ordered = [];
    (config.rdvs || []).forEach((r) => {
      const rdv = String(r.rdv);
      (byRdv.get(rdv) || []).forEach((axis) => {
        (axis.questions || []).forEach((q) => {
          const id = q.id || axis.rdv + '_' + axis.axe + '_' + ordered.length;
          const parentId = (q.showWhen && q.showWhen.questionId) ? String(q.showWhen.questionId) : null;
          ordered.push({ id, parentId });
        });
      });
    });
    ordered.forEach((q) => {
      if (!q.parentId) {
        topLevelIndex += 1;
        nomenclatures[q.id] = String(topLevelIndex);
      } else {
        const parentNum = nomenclatures[q.parentId];
        if (parentNum == null) {
          nomenclatures[q.id] = '?';
          return;
        }
        childCount[q.parentId] = (childCount[q.parentId] || 0) + 1;
        nomenclatures[q.id] = parentNum + '.' + childCount[q.parentId];
      }
    });
    return nomenclatures;
  }

  function buildAxisHtml(axis, nomenclatures) {
    const title = axis.title ? escapeAttr(axis.title) : '';
    const listId = (axis.rdv === '1' && String(axis.axe) === '6') ? 'questionsAdaptatives' : '';
    const idAttr = listId ? ` id="${listId}"` : '';
    const listAttrs = ` class="questions-list" data-rdv="${escapeAttr(axis.rdv)}" data-axe="${escapeAttr(axis.axe)}"${idAttr}`;

    const questionsHtml = (axis.questions || []).map((q) => {
      const qId = q.id || '';
      const num = (nomenclatures && nomenclatures[qId]) ? nomenclatures[qId] : '';
      const depth = num ? (num.split('.').length - 1) : 0;
      const depthAttr = ' data-depth="' + depth + '"';
      const numHtml = num ? `<span class="question-num">${escapeAttr(num)}</span> ` : '';
      const risqueAttr = q.risque ? ` data-risque="${escapeAttr(q.risque)}"` : '';
      const dirs = Array.isArray(q.directions) ? q.directions : (q.direction ? [q.direction] : []);
      const dirAttr = dirs.length > 0 ? ` data-directions="${escapeAttr(dirs.join(','))}"` : (q.direction ? ` data-direction="${escapeAttr(q.direction)}"` : '');
      const showWhenAttrs = (q.showWhen && q.showWhen.questionId && q.showWhen.options && q.showWhen.options.length)
        ? ` data-show-when-question="${escapeAttr(q.showWhen.questionId)}" data-show-when-options="${escapeAttr(q.showWhen.options.join('|'))}"`
        : '';
      const ph = escapeAttr(q.placeholder || 'Réponse du prospect...');
      const textEsc = escapeAttr(q.text);
      let champ = '';
      if (q.type === 'checkbox' && Array.isArray(q.options) && q.options.length > 0) {
        const name = 'q_' + escapeAttr(q.id);
        const optsHtml = q.options.map((opt) => {
          const v = escapeAttr(opt);
          return `<label class="question-checkbox-label"><input type="checkbox" name="${name}" value="${v}"> ${v}</label>`;
        }).join('');
        champ = `<div class="question-champ question-champ--checkboxes" data-q="${escapeAttr(q.id)}">${optsHtml}</div>`;
      } else if (q.type === 'textarea') {
        champ = `<textarea class="question-champ" data-q="${escapeAttr(q.id)}" placeholder="${ph}"></textarea>`;
      } else {
        champ = `<input type="${q.type === 'number' ? 'number' : 'text'}" class="question-champ" data-q="${escapeAttr(q.id)}" placeholder="${ph}">`;
      }
      return `<div class="question-block question-branch"${depthAttr}${risqueAttr}${dirAttr}${showWhenAttrs}><div class="question-text">${numHtml}${textEsc}</div>${champ}</div>`;
    }).join('\n');

    const adaptClass = (axis.rdv === '1' && String(axis.axe) === '6') ? ' axe-adaptatif' : '';
    return `<div class="axe${adaptClass}" data-rdv="${escapeAttr(axis.rdv)}" data-axe="${escapeAttr(axis.axe)}"><h4>${title}</h4><div${listAttrs}>${questionsHtml}</div></div>`;
  }

  /** Applique la config : remplit chaque RDV (axes + questions) à partir de la config. */
  function applyQuestionsConfig(config) {
    if (!config || !config.axes) return;
    applyRdvTitles(config);
    const nomenclatures = computeNomenclature(config);

    const byRdv = new Map();
    (config.axes || []).forEach((a) => {
      const key = String(a.rdv);
      if (!byRdv.has(key)) byRdv.set(key, []);
      byRdv.get(key).push(a);
    });

    byRdv.forEach((axes, rdv) => {
      const rdvEl = document.getElementById('rdv' + rdv);
      const axesWrap = rdvEl?.querySelector('.rdv-axes');
      if (!axesWrap) return;
      axesWrap.innerHTML = axes.map((axis) => buildAxisHtml(axis, nomenclatures)).join('\n');
    });
  }

  /** Au chargement : si une config existe, l'appliquer. */
  function init() {
    const config = getConfig();
    if (config) applyQuestionsConfig(config);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ConitivProcessusQuestions = {
    getConfig,
    setConfig,
    buildQuestionsConfigFromDOM,
    applyQuestionsConfig,
    CONFIG_KEY
  };
})();
