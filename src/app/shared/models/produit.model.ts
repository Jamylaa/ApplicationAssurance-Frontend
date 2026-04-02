export type ProduitType = 'AUTO' | 'HABITATION' | 'SANTE';

export interface Produit {
  idProduit?: string;
  nomProduit: string;
  description: string;
  prixBase: number;
  ageMin: number;
  ageMax: number;
  garantiesIds: string[];
  maladieChroniqueAutorisee: boolean;
  diabetiqueAutorise: boolean;
  actif: boolean;
  type?: ProduitType;
  couverture?: number;
  dureeMax?: string;
  conditions?: string;
  dateCreation: string;
}
