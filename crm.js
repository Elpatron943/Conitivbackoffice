/**
 * Conitiv — CRM (localStorage)
 * Entités : Entreprises, Contacts, Actions, Affaires
 */
(function () {
  const KEYS = {
    entreprises: 'conitiv_crm_entreprises',
    contacts: 'conitiv_crm_contacts',
    actions: 'conitiv_crm_actions',
    affaires: 'conitiv_crm_affaires',
    campaignTypes: 'conitiv_crm_campaign_types'
  };

  const SECTORS = { industrie: 'Industrie', finance: 'Finance', retail: 'Retail', sante: 'Santé', telecom: 'Télécom', services: 'Services' };
  const SIZES = { pme: 'PME', eti: 'ETI', grand: 'Grande entreprise' };

  const AFFAIRE_STAGES = {
    prospect: { label: 'Prospect', color: '#6b7280' },
    contact: { label: 'Contact établi', color: '#3b82f6' },
    devis: { label: 'Devis envoyé', color: '#f59e0b' },
    negociation: { label: 'Négociation', color: '#8b5cf6' },
    gagne: { label: 'Gagné', color: '#10b981' },
    perdu: { label: 'Perdu', color: '#ef4444' }
  };

  const ACTION_TYPES_BASE = {
    appel: 'Appel',
    email: 'Email',
    rdv: 'RDV',
    demo: 'Démonstration',
    proposition: 'Proposition commerciale',
    relance: 'Relance',
    autre: 'Autre'
  };

  const ACTION_STATS = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' };

  const DEFAULT_CAMPAIGN_CYBER = {
    id: 'campagne_cyber',
    nom: 'Campagne cyber',
    steps: [
      { id: 'preparation', label: 'Préparation', jour: -2, description: 'Recherche & veille' },
      { id: 'email1', label: 'Email 1 envoyé', jour: 0, description: 'Demande de connexion' },
      { id: 'avant_call1', label: 'Avant Call #1', jour: 3, description: 'Interaction passive' },
      { id: 'apres_email2', label: 'Après Email 2', jour: 6, description: 'Message court métier' },
      { id: 'avant_email3', label: 'Avant Email 3', jour: 10, description: 'Interaction contenu' },
      { id: 'apres_email3', label: 'Après Email 3', jour: 15, description: 'Message audit' },
      { id: 'breakup', label: 'Breakup', jour: 22, description: 'Dernier message' }
    ]
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function get(key) {
    try {
      const raw = localStorage.getItem(KEYS[key]);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(key, data) {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  }

  // === Entreprises ===
  function getEntreprises() { return get('entreprises'); }
  function getEntreprise(id) { return getEntreprises().find(e => e.id === id); }
  function addEntreprise(data) {
    const list = getEntreprises();
    const ent = {
      id: uid(),
      nom: data.nom || '',
      secteur: data.secteur || '',
      taille: data.taille || '',
      siret: data.siret || '',
      adresse: data.adresse || '',
      ville: data.ville || '',
      codePostal: data.codePostal || '',
      pays: data.pays || 'France',
      siteWeb: data.siteWeb || '',
      email: data.email || '',
      telephone: data.telephone || '',
      ca: data.ca || '',
      effectif: data.effectif || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(ent);
    save('entreprises', list);
    return ent.id;
  }
  function updateEntreprise(id, updates) {
    const list = getEntreprises();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    save('entreprises', list);
    return true;
  }
  function deleteEntreprise(id) {
    save('entreprises', getEntreprises().filter(e => e.id !== id));
    return true;
  }

  // === Contacts ===
  function getContacts() { return get('contacts'); }
  function getContact(id) { return getContacts().find(c => c.id === id); }
  function getContactsByEntreprise(entrepriseId) {
    if (!entrepriseId) return getContacts();
    return getContacts().filter(c => c.entrepriseId === entrepriseId);
  }
  function addContact(data) {
    const list = getContacts();
    const c = {
      id: uid(),
      prenom: data.prenom || '',
      nom: data.nom || '',
      email: data.email || '',
      telephone: data.telephone || '',
      poste: data.poste || '',
      entrepriseId: data.entrepriseId || '',
      estDecideur: !!data.estDecideur,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(c);
    save('contacts', list);
    return c.id;
  }
  function updateContact(id, updates) {
    const list = getContacts();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    save('contacts', list);
    return true;
  }
  function deleteContact(id) {
    save('contacts', getContacts().filter(c => c.id !== id));
    return true;
  }

  // === Actions ===
  function getActions() { return get('actions'); }
  function getAction(id) { return getActions().find(a => a.id === id); }
  function getActionsByEntreprise(entrepriseId) { return getActions().filter(a => a.entrepriseId === entrepriseId); }
  function getActionsByContact(contactId) { return getActions().filter(a => a.contactId === contactId); }
  function getActionsByAffaire(affaireId) { return getActions().filter(a => a.affaireId === affaireId); }
  function addAction(data) {
    const list = getActions();
    const a = {
      id: uid(),
      type: data.type || 'appel',
      date: data.date || new Date().toISOString().slice(0, 10),
      sujet: data.sujet || '',
      description: data.description || '',
      entrepriseId: data.entrepriseId || '',
      contactId: data.contactId || '',
      affaireId: data.affaireId || '',
      statut: data.statut || 'a_faire',
      echeance: data.echeance || '',
      dateJ0: data.dateJ0 || '',
      stepDone: data.stepDone || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(a);
    save('actions', list);
    return a.id;
  }
  function updateAction(id, updates) {
    const list = getActions();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    save('actions', list);
    return true;
  }
  function deleteAction(id) {
    save('actions', getActions().filter(a => a.id !== id));
    return true;
  }

  // === Affaires ===
  function getAffaires() { return get('affaires'); }
  function getAffaire(id) { return getAffaires().find(a => a.id === id); }
  function getAffairesByEntreprise(entrepriseId) { return getAffaires().filter(a => a.entrepriseId === entrepriseId); }
  function addAffaire(data) {
    const list = getAffaires();
    const a = {
      id: uid(),
      nom: data.nom || '',
      montant: data.montant || '',
      devise: data.devise || '€',
      etape: data.etape || 'prospect',
      entrepriseId: data.entrepriseId || '',
      contactId: data.contactId || '',
      probabilite: data.probabilite || 0,
      dateCloturePrevue: data.dateCloturePrevue || '',
      dateClotureReelle: data.dateClotureReelle || '',
      produits: data.produits || [],
      notes: data.notes || '',
      snapshot: data.snapshot || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(a);
    save('affaires', list);
    return a.id;
  }
  function updateAffaire(id, updates) {
    const list = getAffaires();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    save('affaires', list);
    return true;
  }
  function deleteAffaire(id) {
    save('affaires', getAffaires().filter(a => a.id !== id));
    return true;
  }

  // === Types de campagnes ===
  function getCampaignTypes() {
    let list = get('campaignTypes');
    if (!list || list.length === 0) {
      list = [DEFAULT_CAMPAIGN_CYBER];
      save('campaignTypes', list);
    }
    return list;
  }
  function getCampaignType(id) {
    return getCampaignTypes().find(c => c.id === id);
  }
  function addCampaignType(data) {
    const list = getCampaignTypes();
    const id = 'campagne_' + uid();
    const ct = {
      id,
      nom: data.nom || 'Nouvelle campagne',
      steps: data.steps || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(ct);
    save('campaignTypes', list);
    return ct.id;
  }
  function updateCampaignType(id, updates) {
    const list = getCampaignTypes();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    save('campaignTypes', list);
    return true;
  }
  function deleteCampaignType(id) {
    save('campaignTypes', getCampaignTypes().filter(c => c.id !== id));
    return true;
  }
  function getActionTypes() {
    const campaigns = getCampaignTypes().map(c => ({ value: c.id, label: c.nom }));
    const base = Object.entries(ACTION_TYPES_BASE).map(([k, v]) => ({ value: k, label: v }));
    const linkedinCompat = campaigns.some(c => c.value === 'campagne_cyber')
      ? [{ value: 'linkedin', label: 'Campagne cyber' }]
      : [];
    return [...campaigns, ...linkedinCompat, ...base];
  }
  function getWorkflowForCampaign(typeId) {
    if (!typeId) return null;
    const id = typeId === 'linkedin' ? 'campagne_cyber' : typeId;
    if (!id.startsWith('campagne_')) return null;
    const ct = getCampaignType(id);
    return ct ? ct.steps : null;
  }

  // Rétrocompatibilité : depuis le calculateur, crée entreprise + affaire
  function addLead(data) {
    const entrepriseId = addEntreprise({
      nom: data.clientName || 'Prospect',
      secteur: data.sector || '',
      taille: data.size || '',
      notes: data.notes || ''
    });
    return addAffaire({
      nom: data.clientName || 'Prospect',
      entrepriseId,
      etape: data.stage || 'prospect',
      notes: data.notes || '',
      snapshot: data.snapshot || {}
    });
  }

  window.ConitivCRM = {
    getEntreprises, getEntreprise, addEntreprise, updateEntreprise, deleteEntreprise,
    getContacts, getContact, getContactsByEntreprise, addContact, updateContact, deleteContact,
    getActions, getAction, getActionsByEntreprise, getActionsByContact, getActionsByAffaire,
    addAction, updateAction, deleteAction,
    getAffaires, getAffaire, getAffairesByEntreprise, addAffaire, updateAffaire, deleteAffaire,
    getCampaignTypes, getCampaignType, addCampaignType, updateCampaignType, deleteCampaignType,
    getActionTypes, getWorkflowForCampaign,
    addLead,
    SECTORS, SIZES, AFFAIRE_STAGES: AFFAIRE_STAGES, ACTION_TYPES_BASE, ACTION_STATS
  };
})();
