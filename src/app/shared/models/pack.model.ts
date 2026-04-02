export interface Pack {
  idPack?: string;
  nomPack: string;
  description: string;
  typeProduit: string;
  produitsIds: string[];
  prixMensuel: number;
  dureeMinContrat: number;
  dureeMaxContrat: number;
  niveauCouverture: string;
  actif: boolean;
  dateCreation?: string;
}