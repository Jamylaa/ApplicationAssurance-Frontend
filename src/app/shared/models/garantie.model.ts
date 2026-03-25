export interface Garantie {
dateCreation: string;
  idGarantie?: string;
  nomGarantie: string;
  description: string;
  plafondAnnuel: number;
  tauxCouverture: number;
  actif: boolean;
  //dateCreation?: Date;
}
