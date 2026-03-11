/**
 * Conitiv — Import en masse CRM (Excel / CSV)
 * Entreprises avec mapping des colonnes (nom, téléphone, email, etc.)
 */
(function () {
  if (typeof ConitivCRM === 'undefined') return;

  const { addEntreprise } = ConitivCRM;

  // Mapping: noms de colonnes possibles (minuscules, sans accents) -> clé modèle
  const HEADER_MAP = {
    nom: ['nom', 'nom entreprise', 'entreprise', 'company', 'societe', 'raison sociale', 'name'],
    secteur: ['secteur', 'sector'],
    taille: ['taille', 'size'],
    siret: ['siret'],
    adresse: ['adresse', 'address'],
    ville: ['ville', 'city'],
    codePostal: ['code postal', 'cp', 'zip'],
    pays: ['pays', 'country'],
    siteWeb: ['site web', 'site', 'website', 'url'],
    email: ['email', 'e-mail', 'mail'],
    telephone: ['telephone', 'tel', 'phone', 'tél', 'téléphone', 'mobile', 'portable'],
    ca: ['ca', 'chiffre d\'affaires', 'ca annuel', 'chiffre affaires'],
    effectif: ['effectif', 'effectifs', 'nb salariés', 'salariés'],
    notes: ['notes', 'commentaires', 'remarques']
  };

  function normalizeKey(header) {
    const h = String(header || '').toLowerCase().trim().normalize('NFD').replace(/\u0300/g, '');
    for (const [key, aliases] of Object.entries(HEADER_MAP)) {
      if (aliases.some(a => h === a || h.includes(a))) return key;
    }
    return null;
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const sep = lines[0].includes(';') ? ';' : ',';
    const parseLine = (line) => {
      const out = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (inQuotes) {
          cur += c;
        } else if (c === sep) {
          out.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      out.push(cur.trim());
      return out;
    };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine).filter(r => r.some(c => String(c).trim()));
    return { headers, rows };
  }

  function parseExcel(arrayBuffer) {
    if (typeof XLSX === 'undefined') return null;
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = wb.SheetNames[0];
    if (!firstSheet) return null;
    const ws = wb.Sheets[firstSheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!data.length) return { headers: [], rows: [] };
    const headers = data[0].map(c => String(c ?? '').trim());
    const rows = data.slice(1).map(row => {
      const arr = [];
      for (let i = 0; i < headers.length; i++) arr.push(row[i] != null ? String(row[i]).trim() : '');
      return arr;
    }).filter(r => r.some(c => c));
    return { headers, rows };
  }

  function buildRecords(headers, rows) {
    const keyIndex = {};
    headers.forEach((h, i) => {
      const k = normalizeKey(h);
      if (k) keyIndex[i] = k;
    });
    const secteurs = { industrie: 'industrie', finance: 'finance', retail: 'retail', sante: 'sante', telecom: 'telecom', services: 'services' };
    const tailles = { pme: 'pme', 'eti (250–1000)': 'eti_inf', 'eti (1000–5000)': 'eti_sup', 'grande entreprise': 'grand' };
    return rows.map(row => {
      const rec = {};
      Object.entries(keyIndex).forEach(([idx, key]) => {
        let val = row[parseInt(idx, 10)];
        if (val === undefined) val = '';
        rec[key] = String(val ?? '').trim();
      });
      if (rec.secteur && !secteurs[rec.secteur.toLowerCase()]) {
        const s = rec.secteur.toLowerCase().replace(/\s/g, '');
        if (secteurs[s]) rec.secteur = secteurs[s];
      }
      if (rec.taille && !tailles[rec.taille.toLowerCase()]) {
        const t = rec.taille.toLowerCase();
        if (t.includes('pme')) rec.taille = 'pme';
        else if (t.includes('eti') && (t.includes('1000') || t.includes('250'))) rec.taille = t.includes('5000') ? 'eti_sup' : 'eti_inf';
        else if (t.includes('grand')) rec.taille = 'grand';
      }
      return rec;
    });
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  let lastRecords = [];

  function showPreview(records) {
    lastRecords = records;
    const wrap = document.getElementById('importPreviewWrap');
    const table = document.getElementById('importPreviewTable');
    const countEl = document.getElementById('importPreviewCount');
    const btnCount = document.getElementById('importBtnCount');
    const closeOnly = document.getElementById('importCloseOnly');
    if (!wrap || !table) return;
    if (records.length === 0) {
      wrap.style.display = 'none';
      closeOnly.style.display = 'block';
      return;
    }
    closeOnly.style.display = 'none';
    wrap.style.display = 'block';
    countEl.textContent = `(${records.length} ligne${records.length > 1 ? 's' : ''})`;
    btnCount.textContent = records.length;
    const cols = ['nom', 'email', 'telephone', 'ville', 'secteur'];
    const headers = cols.filter(c => records.some(r => r[c]));
    if (headers.length === 0) headers.push('nom');
    table.innerHTML = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' +
      records.slice(0, 15).map(r => '<tr>' + headers.map(h => `<td>${String(r[h] || '').slice(0, 40)}</td>`).join('') + '</tr>').join('') +
      '</tbody>';
    if (records.length > 15) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${headers.length}" style="color:var(--color-text-muted);font-size:0.9rem">… et ${records.length - 15} autre(s) ligne(s)</td>`;
      table.querySelector('tbody').appendChild(tr);
    }
  }

  function doImport() {
    const n = lastRecords.length;
    lastRecords.forEach(r => {
      addEntreprise({
        nom: r.nom || '',
        secteur: r.secteur || '',
        taille: r.taille || '',
        siret: r.siret || '',
        adresse: r.adresse || '',
        ville: r.ville || '',
        codePostal: r.codePostal || '',
        pays: r.pays || 'France',
        siteWeb: r.siteWeb || '',
        email: r.email || '',
        telephone: r.telephone || '',
        ca: r.ca || '',
        effectif: r.effectif || '',
        notes: r.notes || ''
      });
    });
    closeModal('modalImportEntreprises');
    window.dispatchEvent(new CustomEvent('crm-import-done'));
    if (typeof alert !== 'undefined') alert(`${n} entreprise(s) importée(s).`);
  }

  function handleFile(file) {
    const zoneText = document.getElementById('importZoneText');
    if (!file) return;
    zoneText.textContent = file.name + ' — chargement…';
    const isExcel = /\.xlsx?$/i.test(file.name);
    const onData = (headers, rows) => {
      const records = buildRecords(headers, rows);
      zoneText.textContent = file.name + ` — ${records.length} ligne(s) détectée(s).`;
      showPreview(records);
    };
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = parseExcel(e.target.result);
        if (result) onData(result.headers, result.rows);
        else {
          zoneText.textContent = 'Impossible de lire le fichier Excel. Essayez en exportant en CSV.';
          showPreview([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target.result || '').replace(/^\uFEFF/, '');
        const { headers, rows } = parseCSV(text);
        onData(headers, rows);
      };
      reader.readAsText(file, 'UTF-8');
    }
  }

  function init() {
    const btn = document.getElementById('btnImportEntreprises');
    const zone = document.getElementById('importZone');
    const fileInput = document.getElementById('importFileInput');
    const zoneBtn = document.getElementById('importZoneBtn');
    const btnDoImport = document.getElementById('btnDoImport');
    if (!btn || !zone || !fileInput) return;

    btn.addEventListener('click', () => {
      document.getElementById('importPreviewWrap').style.display = 'none';
      document.getElementById('importCloseOnly').style.display = 'block';
      document.getElementById('importZoneText').textContent = 'Glissez-déposez un fichier ici ou cliquez sur Parcourir.';
      fileInput.value = '';
      lastRecords = [];
      openModal('modalImportEntreprises');
    });

    zoneBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('crm-import-zone--over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('crm-import-zone--over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('crm-import-zone--over');
      const f = e.dataTransfer?.files?.[0];
      if (f && (f.name.match(/\.(csv|xlsx|xls)$/i))) handleFile(f);
    });

    btnDoImport.addEventListener('click', doImport);

    document.querySelectorAll('[data-close="modalImportEntreprises"]').forEach(el => {
      el.addEventListener('click', () => closeModal('modalImportEntreprises'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
