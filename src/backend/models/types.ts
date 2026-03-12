export interface Sala {
  id: string;
  nome: string;
  capacita: number;
  descrizione?: string;
}

export interface Prenotazione {
  id: string;
  salaId: string;
  dataInizio: Date;
  dataFine: Date;
  utenteId: string;
  stato: StatoPrenotazione;
}

export type StatoPrenotazione = 'confermata' | 'in_attesa' | 'cancellata';

export interface Utente {
  id: string;
  nome: string;
  email?: string;
  ruolo: RuoloUtente;
}

export type RuoloUtente = 'standard' | 'vip' | 'admin';

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
