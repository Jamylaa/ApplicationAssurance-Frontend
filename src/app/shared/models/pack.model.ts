export interface Pack {
  idPack?: string;
  nomPack: string;
  description: string;
  prixMensuel: number;
  dureeMinContrat: number;
  dureeMaxContrat: number;
  produitsIds: string[];
  niveauCouverture: string;
  actif: boolean;
  dateCreation: string;
}