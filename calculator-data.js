/**
 * Conitiv — Données du calculateur de risque tiers
 * Sources : DBIR, ENISA, IBM Cost of Breach, Marsh, Allianz, textes UE (RGPD, NIS2, DORA)
 */

// Références articles & rapports — secteurs: [] = tous, sizes: [] = tous, cards: sections où afficher
const REFERENCES = [
  {
    title: '≳60 % des entreprises subissent des breaches supply chain',
    source: 'TechRadar Pro',
    year: 2025,
    url: 'https://www.techradar.com/pro/supply-chain-cyberattacks-are-becoming-unmanageable-and-uk-businesses-are-paying-the-price',
    sectors: [], sizes: ['grand', 'eti', 'pme'],
    cards: ['proba', 'tendance2026']
  },
  {
    title: '58 % des grandes institutions financières UK — attaque supply chain',
    source: 'Orange Cyberdefense',
    year: 2025,
    url: 'https://www.orangecyberdefense.com/uk/insights/over-half-of-uk-financial-services-institutions-have-suffered-at-least-one-third-party-supply-chain-attack-in-2024',
    sectors: ['finance'], sizes: ['grand', 'eti'],
    cards: ['proba']
  },
  {
    title: 'Cyberattaques supply chain doublées — retail, santé, industrie',
    source: 'Financial Times',
    year: 2025,
    url: 'https://www.ft.com/content/dd59b848-67c2-4622-a1e4-555b77196197',
    sectors: ['retail', 'sante', 'industrie'], sizes: [],
    cards: ['tendance2026']
  },
  {
    title: 'PME, TPE & ETI — ransomware, phishing, supply chain',
    source: 'SFR Business',
    year: 2025,
    url: 'https://www.sfrbusiness.fr/room/cybersecurite-en-entreprise/impacts-economiques-strategiques-dans-les-pme-et-tpe/',
    sectors: [], sizes: ['pme', 'eti'],
    cards: ['proba']
  },
  {
    title: '≈330 000 attaques sur PME en France — incidents fournisseurs',
    source: 'RiskIntel',
    year: 2025,
    url: 'https://www.riskintel.fr/en/articles/les-pme-sous-estiment-les-impacts-dune-cyberattaque',
    sectors: [], sizes: ['pme'],
    cards: ['proba']
  },
  {
    title: 'Risques cyber manufacture & supply chain',
    source: 'Aon',
    year: 2025,
    url: 'https://www.aon.com/cyber-risk-report//cyber-risk-in-an-increasingly-digitalized-manufacturing-sector/',
    sectors: ['industrie'], sizes: [],
    cards: ['impacts', 'risque']
  },
  {
    title: 'PME & ETI — cybermenaces secteur industriel/logistique',
    source: 'Livre blanc Maiage',
    year: 2024,
    url: 'https://maiage.fr/wp-content/uploads/2024/03/livre-blanc-PME-et-ETI-face-aux-cybermenaces.pdf',
    sectors: ['industrie'], sizes: ['pme', 'eti'],
    cards: ['impacts', 'risque']
  },
  {
    title: 'Cyber Supply Chain Attacks — conceptualisation',
    source: 'ResearchGate',
    year: 2024,
    url: 'https://www.researchgate.net/publication/369750209_Cyber_Supply_Chain_Attacks',
    sectors: [], sizes: [],
    cards: ['proba', 'risque', 'roi']
  },
  {
    title: 'Supply chain cyber risk management',
    source: 'Springer',
    year: 2026,
    url: 'https://link.springer.com/article/10.1007/s10207-025-01207-9',
    sectors: [], sizes: [],
    cards: ['roi']
  },
  {
    title: 'Third-party risks in the cyber supply chain',
    source: 'DIVA',
    year: 2024,
    url: 'https://www.diva-portal.org/smash/get/diva2%3A1955740/FULLTEXT01.pdf',
    sectors: [], sizes: [],
    cards: ['roi']
  },
  { title: 'Data Breach Investigations Report', source: 'Verizon', year: 2024, url: 'https://www.verizon.com/business/resources/reports/dbir/', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Threat Landscape / Supply Chain Attacks', source: 'ENISA', year: 2024, url: 'https://www.enisa.europa.eu/topics/threat-risk-management/threats-and-trends', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Cyber Risk & Third-Party Risk', source: 'Marsh', year: 2024, url: 'https://www.marsh.com/en/services/cyber-risk/insights.html', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Défaillances d\'entreprises', source: 'Banque de France', year: 2024, url: 'https://www.banque-france.fr/statistiques/entreprises/defaillances-dentreprises', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Supply Chain Risk', source: 'McKinsey', year: 2024, url: 'https://www.mckinsey.com/capabilities/operations/our-insights', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Corporate Sustainability Reporting Directive', source: 'Commission européenne', year: 2024, url: 'https://finance.ec.europa.eu/sustainable-finance/corporate-sustainability-reporting-directive_en', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Due Diligence Guidance', source: 'OCDE', year: 2023, url: 'https://www.oecd.org/corporate/mne/due-diligence-guidance.htm', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Directive NIS2 (UE 2022/2555)', source: 'EUR-Lex', year: 2022, url: 'https://eur-lex.europa.eu/eli/dir/2022/2555/oj', sectors: [], sizes: [], cards: ['reduction'] },
  { title: 'Sanctions prononcées', source: 'CNIL', year: 2024, url: 'https://www.cnil.fr/fr/sanctions-prononcees', sectors: [], sizes: [], cards: ['reduction'] }
];

/**
 * Réduction réaliste du risque par une solution de scoring (ordres de grandeur défendables).
 * Le scoring ne supprime jamais 100 % du risque ; ces ratios sont issus de rapports assureurs, autorités, risk.
 * Réf. : Verizon DBIR, ENISA, Marsh (cyber) ; Banque de France, Altares, McKinsey (défaillance) ;
 * UE CSRD, OCDE (ESG) ; NIS2, CNIL (réglementaire).
 */
const REDUCTION_SCORING = {
  cyber: {
    range: '20–40 %',
    default: 0.40
  },
  defaillance: { range: '40–70 %', default: 0.55 },
  esg: { range: '50–80 %', default: 0.65 },
  rgpd: { range: '60–90 %', default: 0.75 }
};

const SECTORS = {
  industrie: { label: 'Industrie manufacturière', icon: '🏭' },
  finance: { label: 'Finance / Assurance', icon: '🏦' },
  retail: { label: 'Retail / Distribution', icon: '🛒' },
  sante: { label: 'Santé & Pharma', icon: '🏥' },
  telecom: { label: 'Télécom & Connectivité', icon: '📡' },
  services: { label: 'Services professionnels', icon: '🏢' }
};

// Exemples d'impacts directs et indirects par secteur
const IMPACTS_EXEMPLES = {
  industrie: {
    direct: ['Arrêt de production', 'Remédiation IT', 'Experts cyber', 'Pénalités contractuelles fournisseurs'],
    indirect: ['Perte de CA (retards livraison)', 'Communication de crise', 'Perte de parts de marché', 'Atteinte réputation']
  },
  finance: {
    direct: ['Remédiation', 'Experts forensics', 'Notifications clients', 'Amendes réglementaires'],
    indirect: ['Départs clients', 'Coûts recapitalisation', 'Hausse primes assurance', 'Perte confiance investisseurs']
  },
  retail: {
    direct: ['Indisponibilité caisse / e-commerce', 'Restauration systèmes', 'Experts', 'Pénalités'],
    indirect: ['Perte de ventes', 'Fraude carte bancaire', 'Atteinte image de marque', 'Baisse fréquentation']
  },
  sante: {
    direct: ['Remédiation', 'Notification CNIL', 'Amendes RGPD', 'Interruption soins / essais cliniques'],
    indirect: ['Actions collectives', 'Perte confiance patients', 'Impact essais cliniques', 'Retards autorisations']
  },
  telecom: {
    direct: ['Indemnisation clients', 'Remédiation', 'Experts', 'Pénalités SLA'],
    indirect: ['Perte de contrats', 'Atteinte réputation', 'Coûts migration clients', 'Churn']
  },
  services: {
    direct: ['Remédiation', 'Experts', 'Notifications', 'Amendes'],
    indirect: ['Perte de mandats', 'Responsabilité contractuelle', 'Atteinte réputation', 'Perte confiance clients']
  }
};

const SIZES = {
  pme: { label: 'PME (10–250)', min: 10, max: 250 },
  eti: { label: 'ETI (250–5000)', min: 250, max: 5000 },
  grand: { label: 'Grande entreprise (>5000)', min: 5000, max: null }
};

// Matrice des tiers par secteur : [taille][type_fournisseur] = niveau risque
// Niveaux : critical, elevated, moderate, low
const MATRICE_TIERS = {
  industrie: {
    headers: ['MSP / Infogéreurs', 'SaaS métier', 'Cloud Providers', 'ESN / Freelances', 'RH / Paie', 'Sécurité Physique', 'Logistique & Transport'],
    pme: ['critical', 'elevated', 'elevated', 'elevated', 'moderate', 'low', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated', 'moderate'],
    grand: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'critical', 'critical']
  },
  finance: {
    headers: ['MSP / Infogéreurs', 'SaaS métier', 'Cloud Providers', 'ESN / Freelances', 'RH / Paie', 'Sécurité Physique', 'Conseillers externes'],
    pme: ['critical', 'critical', 'elevated', 'elevated', 'moderate', 'low', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated', 'elevated'],
    grand: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'critical', 'critical']
  },
  retail: {
    headers: ['MSP / Infogéreurs', 'SaaS POS / ERP', 'Cloud Providers', 'Logistique / Transport', 'Sécurité Physique', 'ESN', 'RH / Paie'],
    pme: ['critical', 'elevated', 'elevated', 'moderate', 'moderate', 'moderate', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated', 'elevated'],
    grand: ['critical', 'critical', 'critical', 'critical', 'critical', 'elevated', 'elevated']
  },
  sante: {
    headers: ['MSP / Infogéreurs', 'SaaS santé', 'Cloud Providers', 'ESN', 'RH / Paie', 'Sécurité Physique', 'Sous-traitants logistiques'],
    pme: ['critical', 'elevated', 'elevated', 'elevated', 'moderate', 'moderate', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated', 'elevated'],
    grand: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'critical', 'critical']
  },
  telecom: {
    headers: ['MSP / Infogéreurs', 'Cloud Providers', 'Réseaux / Opérateurs', 'SaaS interne', 'ESN', 'Sécurité Physique'],
    pme: ['critical', 'elevated', 'elevated', 'elevated', 'moderate', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated'],
    grand: ['critical', 'critical', 'critical', 'critical', 'elevated', 'critical']
  },
  services: {
    headers: ['MSP / Infogéreurs', 'SaaS métier', 'Cloud Providers', 'Conseils externes', 'RH / Paie', 'Sécurité Physique'],
    pme: ['critical', 'elevated', 'elevated', 'elevated', 'moderate', 'moderate'],
    eti: ['critical', 'critical', 'critical', 'elevated', 'elevated', 'elevated'],
    grand: ['critical', 'critical', 'critical', 'critical', 'elevated', 'critical']
  }
};

// Probabilités cyber via tiers : { pme: { pIncident, pTiers, pViaTiers }, eti, grand }
const PROBABILITES_CYBER = {
  industrie: {
    pme: { pIncident: '18–22 %', pTiers: '20–25 %', pViaTiers: '4–6 %' },
    eti: { pIncident: '25–30 %', pTiers: '30–35 %', pViaTiers: '8–10 %' },
    grand: { pIncident: '30–35 %', pTiers: '40–45 %', pViaTiers: '12–16 %' }
  },
  finance: {
    pme: { pIncident: '25–30 %', pTiers: '30–35 %', pViaTiers: '8–10 %' },
    eti: { pIncident: '30–35 %', pTiers: '40–45 %', pViaTiers: '12–16 %' },
    grand: { pIncident: '35–40 %', pTiers: '50–55 %', pViaTiers: '18–22 %' }
  },
  retail: {
    pme: { pIncident: '20–25 %', pTiers: '25–30 %', pViaTiers: '5–8 %' },
    eti: { pIncident: '25–30 %', pTiers: '35–40 %', pViaTiers: '9–12 %' },
    grand: { pIncident: '30–35 %', pTiers: '45–50 %', pViaTiers: '14–18 %' }
  },
  sante: {
    pme: { pIncident: '25–30 %', pTiers: '30–35 %', pViaTiers: '8–11 %' },
    eti: { pIncident: '30–35 %', pTiers: '40–45 %', pViaTiers: '12–16 %' },
    grand: { pIncident: '35–40 %', pTiers: '50–55 %', pViaTiers: '18–22 %' }
  },
  telecom: {
    pme: { pIncident: '25–30 %', pTiers: '30–35 %', pViaTiers: '8–10 %' },
    eti: { pIncident: '30–35 %', pTiers: '40–45 %', pViaTiers: '12–16 %' },
    grand: { pIncident: '35–45 %', pTiers: '50–60 %', pViaTiers: '18–27 %' }
  },
  services: {
    pme: { pIncident: '20–25 %', pTiers: '25–30 %', pViaTiers: '5–8 %' },
    eti: { pIncident: '25–30 %', pTiers: '35–40 %', pViaTiers: '9–12 %' },
    grand: { pIncident: '30–35 %', pTiers: '45–50 %', pViaTiers: '14–18 %' }
  }
};

// Probabilités cyber via tiers — Tendance 2026 (hausse attendue)
const PROBABILITES_CYBER_2026 = {
  industrie: {
    pme: { pViaTiers: '6–8 %' },
    eti: { pViaTiers: '11–14 %' },
    grand: { pViaTiers: '16–20 %' }
  },
  finance: {
    pme: { pViaTiers: '10–13 %' },
    eti: { pViaTiers: '16–20 %' },
    grand: { pViaTiers: '22–30 %' }
  },
  retail: {
    pme: { pViaTiers: '7–10 %' },
    eti: { pViaTiers: '12–16 %' },
    grand: { pViaTiers: '18–24 %' }
  },
  sante: {
    pme: { pViaTiers: '11–14 %' },
    eti: { pViaTiers: '16–20 %' },
    grand: { pViaTiers: '22–30 %' }
  },
  telecom: {
    pme: { pViaTiers: '10–13 %' },
    eti: { pViaTiers: '16–20 %' },
    grand: { pViaTiers: '22–30 %' }
  },
  services: {
    pme: { pViaTiers: '7–10 %' },
    eti: { pViaTiers: '12–16 %' },
    grand: { pViaTiers: '18–24 %' }
  }
};

// Impacts opérationnels (direct, indirect, total) en M€
const IMPACTS_OPERATIONNELS = {
  industrie: {
    pme: { direct: '150k–400k', indirect: '200k–500k', total: '350k–900k' },
    eti: { direct: '400k–1,2M', indirect: '800k–2M', total: '1,2M–3,2M' },
    grand: { direct: '1,5M–4M', indirect: '3M–10M', total: '4,5M–14M' }
  },
  finance: {
    pme: { direct: '300k–800k', indirect: '500k–1,2M', total: '800k–2M' },
    eti: { direct: '800k–2M', indirect: '2M–5M', total: '2,8M–7M' },
    grand: { direct: '3M–8M', indirect: '10M–30M', total: '13M–38M' }
  },
  retail: {
    pme: { direct: '200k–500k', indirect: '300k–800k', total: '500k–1,3M' },
    eti: { direct: '500k–1,5M', indirect: '1M–3M', total: '1,5M–4,5M' },
    grand: { direct: '2M–6M', indirect: '5M–15M', total: '7M–21M' }
  },
  sante: {
    pme: { direct: '300k–700k', indirect: '600k–1,5M', total: '900k–2,2M' },
    eti: { direct: '1M–2,5M', indirect: '2M–6M', total: '3M–8,5M' },
    grand: { direct: '4M–10M', indirect: '10M–30M', total: '14M–40M' }
  },
  telecom: {
    pme: { direct: '250k–600k', indirect: '400k–1M', total: '650k–1,6M' },
    eti: { direct: '800k–2M', indirect: '2M–5M', total: '2,8M–7M' },
    grand: { direct: '3M–8M', indirect: '8M–25M', total: '11M–33M' }
  },
  services: {
    pme: { direct: '200k–500k', indirect: '300k–800k', total: '500k–1,3M' },
    eti: { direct: '600k–1,5M', indirect: '1,5M–4M', total: '2,1M–5,5M' },
    grand: { direct: '2M–5M', indirect: '6M–15M', total: '8M–20M' }
  }
};

// Amendes réglementaires (RGPD, NIS2, DORA, total)
const AMENDES_REGLEMENTAIRES = {
  industrie: {
    pme: { rgpd: '50k–300k', nis2: '50k–200k', dora: '—', total: '100k–400k' },
    eti: { rgpd: '300k–2M', nis2: '200k–1M', dora: '—', total: '500k–3M' },
    grand: { rgpd: '2M–8M', nis2: '1M–5M', dora: '—', total: '3M–13M' }
  },
  finance: {
    pme: { rgpd: '200k–600k', nis2: '100k–300k', dora: '200k–500k', total: '500k–1,4M' },
    eti: { rgpd: '1M–4M', nis2: '500k–1,5M', dora: '1M–3M', total: '2,5M–8,5M' },
    grand: { rgpd: '5M–15M', nis2: '2M–8M', dora: '5M–20M', total: '12M–43M' }
  },
  retail: {
    pme: { rgpd: '100k–400k', nis2: '50k–200k', dora: '—', total: '150k–600k' },
    eti: { rgpd: '500k–3M', nis2: '200k–1M', dora: '—', total: '700k–4M' },
    grand: { rgpd: '3M–10M', nis2: '1M–5M', dora: '—', total: '4M–15M' }
  },
  sante: {
    pme: { rgpd: '200k–700k', nis2: '100k–300k', dora: '—', total: '300k–1M' },
    eti: { rgpd: '1M–5M', nis2: '500k–2M', dora: '—', total: '1,5M–7M' },
    grand: { rgpd: '5M–20M', nis2: '2M–8M', dora: '—', total: '7M–28M' }
  },
  telecom: {
    pme: { rgpd: '150k–500k', nis2: '100k–300k', dora: '—', total: '250k–800k' },
    eti: { rgpd: '800k–4M', nis2: '500k–2M', dora: '—', total: '1,3M–6M' },
    grand: { rgpd: '4M–15M', nis2: '2M–10M', dora: '—', total: '6M–25M' }
  },
  services: {
    pme: { rgpd: '100k–300k', nis2: '50k–150k', dora: '—', total: '150k–450k' },
    eti: { rgpd: '500k–2M', nis2: '200k–800k', dora: '—', total: '700k–2,8M' },
    grand: { rgpd: '3M–10M', nis2: '1M–4M', dora: '—', total: '4M–14M' }
  }
};

// Risque financier annuel (probabilité × impact moyen)
const RISQUE_FINANCIER_ANNUEL = {
  industrie: { pme: '18–72 k€', eti: '96–320 k€', grand: '540k–2,2M€' },
  finance: { pme: '64–200 k€', eti: '336k–1,1M€', grand: '2,3M–8,4M€' },
  retail: { pme: '25–104 k€', eti: '135–540 k€', grand: '980k–3,8M€' },
  sante: { pme: '72–242 k€', eti: '360k–1,4M€', grand: '2,5M–8,8M€' },
  telecom: { pme: '52–160 k€', eti: '336k–1,1M€', grand: '2M–8,9M€' },
  services: { pme: '25–104 k€', eti: '189–660 k€', grand: '1,1M–3,6M€' }
};

// Impacts responsables — version descriptive (gouvernance défaillante)
const IMPACTS_RESPONSABLES = {
  dirigeant: {
    titre: 'Dirigeants',
    desc: 'Exposition personnelle en cas de défaut de pilotage des fournisseurs : frais juridiques, sanctions, responsabilité de gouvernance.',
    ordreGrandeur: 'Dizaines de milliers d\'euros'
  },
  ciso: {
    titre: 'CISO / DSI',
    desc: 'Mise en cause professionnelle en cas d\'incident fournisseur non anticipé : pression board, perte de poste, frais de défense.',
    ordreGrandeur: 'Impact principalement carrière & réputation'
  },
  risk: {
    titre: 'Risk / Compliance',
    desc: 'Responsabilité sur la traçabilité et la conformité fournisseurs : audits, sanctions internes, crédibilité.',
    ordreGrandeur: 'Impact fonctionnel et managérial'
  }
};

// Poids scoring par type de fournisseur
const POIDS_SCORING = [
  { type: 'MSP / Infogéreur', poids: 5 },
  { type: 'Cloud Provider', poids: 5 },
  { type: 'SaaS métiers critiques', poids: 4 },
  { type: 'Accès physique', poids: 3 },
  { type: 'Logistique critique', poids: 3 },
  { type: 'ESN / Freelance', poids: 2 },
  { type: 'RH / Paie', poids: 2 },
  { type: 'Services généraux', poids: 1 }
];

const RISK_LABELS = {
  critical: { label: 'Critique', icon: '🔥', desc: 'surveillance prioritaire' },
  elevated: { label: 'Élevé', icon: '⚠️', desc: 'à monitorer' },
  moderate: { label: 'Modéré', icon: '🔹', desc: 'à considérer selon contexte' },
  low: { label: 'Faible', icon: '⚪', desc: 'pas prioritaire' }
};

// === RISQUE ESG (CSRD, devoir de vigilance) ===
const RISQUE_ESG = {
  industrie: {
    pme: { csrd: 'Faible', devoirVigilance: 'Modéré', env: 'Élevé', social: 'Modéré', gov: 'Modéré', impact: '50k–200k €' },
    eti: { csrd: 'Élevé', devoirVigilance: 'Élevé', env: 'Élevé', social: 'Élevé', gov: 'Élevé', impact: '200k–1M €' },
    grand: { csrd: 'Critique', devoirVigilance: 'Critique', env: 'Critique', social: 'Élevé', gov: 'Critique', impact: '1M–5M €' }
  },
  finance: {
    pme: { csrd: 'Modéré', devoirVigilance: 'Modéré', env: 'Modéré', social: 'Modéré', gov: 'Élevé', impact: '100k–400k €' },
    eti: { csrd: 'Élevé', devoirVigilance: 'Élevé', env: 'Modéré', social: 'Élevé', gov: 'Élevé', impact: '400k–2M €' },
    grand: { csrd: 'Critique', devoirVigilance: 'Critique', env: 'Élevé', social: 'Élevé', gov: 'Critique', impact: '2M–10M €' }
  },
  retail: {
    pme: { csrd: 'Modéré', devoirVigilance: 'Modéré', env: 'Modéré', social: 'Élevé', gov: 'Modéré', impact: '80k–350k €' },
    eti: { csrd: 'Élevé', devoirVigilance: 'Élevé', env: 'Élevé', social: 'Élevé', gov: 'Élevé', impact: '350k–1,5M €' },
    grand: { csrd: 'Critique', devoirVigilance: 'Critique', env: 'Élevé', social: 'Élevé', gov: 'Critique', impact: '1,5M–8M €' }
  },
  sante: {
    pme: { csrd: 'Modéré', devoirVigilance: 'Élevé', env: 'Modéré', social: 'Élevé', gov: 'Modéré', impact: '150k–500k €' },
    eti: { csrd: 'Élevé', devoirVigilance: 'Élevé', env: 'Élevé', social: 'Élevé', gov: 'Élevé', impact: '500k–2,5M €' },
    grand: { csrd: 'Critique', devoirVigilance: 'Critique', env: 'Élevé', social: 'Critique', gov: 'Critique', impact: '2,5M–12M €' }
  },
  telecom: {
    pme: { csrd: 'Modéré', devoirVigilance: 'Modéré', env: 'Modéré', social: 'Modéré', gov: 'Élevé', impact: '80k–300k €' },
    eti: { csrd: 'Élevé', devoirVigilance: 'Élevé', env: 'Modéré', social: 'Élevé', gov: 'Élevé', impact: '300k–1,5M €' },
    grand: { csrd: 'Critique', devoirVigilance: 'Critique', env: 'Élevé', social: 'Élevé', gov: 'Critique', impact: '1,5M–8M €' }
  },
  services: {
    pme: { csrd: 'Faible', devoirVigilance: 'Modéré', env: 'Faible', social: 'Modéré', gov: 'Modéré', impact: '30k–150k €' },
    eti: { csrd: 'Modéré', devoirVigilance: 'Élevé', env: 'Modéré', social: 'Élevé', gov: 'Élevé', impact: '150k–800k €' },
    grand: { csrd: 'Élevé', devoirVigilance: 'Critique', env: 'Modéré', social: 'Élevé', gov: 'Élevé', impact: '800k–4M €' }
  }
};

// === RISQUE RGPD / RÉGLEMENTAIRE (focus amendes) ===
// Réutilise AMENDES_REGLEMENTAIRES + détail par texte

// === RISQUE DÉFAILLANCE (fournisseurs) ===
const RISQUE_DEFAILLANCE = {
  industrie: {
    pme: { pDefaillance: '3–6 %', impact: '200k–600k €', dependance: 'Modérée', domino: 'Faible' },
    eti: { pDefaillance: '5–10 %', impact: '500k–2M €', dependance: 'Élevée', domino: 'Modéré' },
    grand: { pDefaillance: '8–15 %', impact: '2M–8M €', dependance: 'Critique', domino: 'Élevé' }
  },
  finance: {
    pme: { pDefaillance: '4–8 %', impact: '400k–1,5M €', dependance: 'Élevée', domino: 'Modéré' },
    eti: { pDefaillance: '6–12 %', impact: '1M–4M €', dependance: 'Critique', domino: 'Élevé' },
    grand: { pDefaillance: '10–18 %', impact: '5M–20M €', dependance: 'Critique', domino: 'Critique' }
  },
  retail: {
    pme: { pDefaillance: '4–8 %', impact: '300k–1M €', dependance: 'Élevée', domino: 'Modéré' },
    eti: { pDefaillance: '6–11 %', impact: '800k–3M €', dependance: 'Critique', domino: 'Élevé' },
    grand: { pDefaillance: '9–16 %', impact: '3M–15M €', dependance: 'Critique', domino: 'Critique' }
  },
  sante: {
    pme: { pDefaillance: '3–7 %', impact: '400k–1,2M €', dependance: 'Élevée', domino: 'Modéré' },
    eti: { pDefaillance: '5–10 %', impact: '1M–4M €', dependance: 'Critique', domino: 'Élevé' },
    grand: { pDefaillance: '8–14 %', impact: '4M–18M €', dependance: 'Critique', domino: 'Critique' }
  },
  telecom: {
    pme: { pDefaillance: '4–7 %', impact: '300k–1M €', dependance: 'Élevée', domino: 'Modéré' },
    eti: { pDefaillance: '6–11 %', impact: '1M–4M €', dependance: 'Critique', domino: 'Élevé' },
    grand: { pDefaillance: '9–15 %', impact: '4M–18M €', dependance: 'Critique', domino: 'Élevé' }
  },
  services: {
    pme: { pDefaillance: '3–6 %', impact: '150k–500k €', dependance: 'Modérée', domino: 'Faible' },
    eti: { pDefaillance: '5–9 %', impact: '500k–2M €', dependance: 'Élevée', domino: 'Modéré' },
    grand: { pDefaillance: '7–13 %', impact: '2M–10M €', dependance: 'Critique', domino: 'Élevé' }
  }
};

// Risque financier annuel défaillance (P × impact)
const RISQUE_FINANCIER_DEFAILLANCE = {
  industrie: { pme: '6–36 k€', eti: '25–200 k€', grand: '160k–1,2M€' },
  finance: { pme: '16–120 k€', eti: '60–480 k€', grand: '500k–3,6M€' },
  retail: { pme: '12–80 k€', eti: '48–330 k€', grand: '270k–2,4M€' },
  sante: { pme: '12–84 k€', eti: '50–400 k€', grand: '320k–2,5M€' },
  telecom: { pme: '12–70 k€', eti: '60–440 k€', grand: '360k–2,7M€' },
  services: { pme: '5–30 k€', eti: '25–180 k€', grand: '140k–1,3M€' }
};
