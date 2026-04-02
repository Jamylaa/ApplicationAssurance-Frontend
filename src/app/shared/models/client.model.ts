import { Role } from './role.enum';
export interface Client {
  idUser?: string;
  userName: string;
  email: string;
  password?: string;
  phone: number;
  role?: Role;
  age: number;
  sexe: string;
  profession: string;
  situationFamiliale: string;
  maladieChronique: boolean;
  diabetique: boolean;
  tension: boolean;
  nombreBeneficiaires: number;
  actif?: boolean;
  dateCreation?: Date;
  score?: number;
}

export interface ClientDTO {
  idUser?: string;
  userName: string;
  email: string;
  password?: string;
  phone: number;
  role?: Role;
  age?: number;
  sexe?: string;
  profession?: string;
  situationFamiliale?: string;
  maladieChronique?: boolean;
  diabetique?: boolean;
  tension?: boolean;
  nombreBeneficiaires?: number;
  actif?: boolean;
  dateCreation?: Date;
  score?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}