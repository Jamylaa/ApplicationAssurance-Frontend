export interface ClientDetails {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  dateNaissance: string;
  numeroCIN: string;
  numeroPermis: string;
}

export type ProduitType = 'SANTE' | 'AUTO' | 'HABITATION' | 'VIE';

export interface ProduitDetails {
  idProduit?: string;
  type: ProduitType;
  nomProduit: string;
  description: string;
  prixBase: number;
  couverture: number;
  dureeMax: string;
  actif: boolean;
  conditions?: string;
}

export interface Subscription {
  idContrat?: string;
  // --- Snapshot fields from Backend ---
  clientId?: string;
  clientNom?: string;
  clientEmail?: string;
  clientPhone?: string;
  produitId?: string;
  produitNom?: string;
  produitDescription?: string;
  produitPrixBase?: number;
  packId?: string;
  packNom?: string;
  
  // --- Enriched objects for Frontend ---
  client?: ClientDetails;
  produit?: ProduitDetails;

  // --- Contract details ---
  dateDebut: string; // ISO date string
  dureeMois: number;
  primePersonnalisee: number;
  optionsSupplementaires?: string;
  dateFin?: string;  // ISO date string
  statut: 'EN_COURS' | 'TERMINE' | 'ANNULÉ' | 'EN_ATTENTE' | 'VALIDE' | 'RESILIE';
  montant: number;
  commentaire?: string;
}

