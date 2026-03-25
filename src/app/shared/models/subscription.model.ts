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

export type ProduitType = 'AUTO' | 'HABITATION' | 'SANTE' | 'VIE';

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
  client?: ClientDetails;
  clientId?: string;
  produit?: ProduitDetails;
  idProduit?: string;
  dateDebut: string; // ISO date string
  dureeMois: number;
  primePersonnalisee: number;
  optionsSupplementaires?: string;
  dateFin?: string;  // ISO date string
  statut: 'EN_COURS' | 'TERMINE' | 'ANNULÉ' | 'EN_ATTENTE';
  montant: number;
  commentaire?: string;
}

