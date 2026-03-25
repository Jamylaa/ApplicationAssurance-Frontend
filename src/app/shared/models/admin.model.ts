import { Departement } from './departement.enum';
import { Role } from './role.enum';

export interface Admin {
  idUser?: string;
  userName: string;
  email: string;
  password?: string;
  phone: number;
  departement: Departement;
  role?: Role;
}
