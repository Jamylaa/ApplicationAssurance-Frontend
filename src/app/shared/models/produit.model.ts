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
  type?: 'AUTO' | 'HABITATION' | 'SANTE' | 'VIE';
  couverture?: number;
  dureeMax?: string;
  conditions?: string;
  dateCreation: string;
}
