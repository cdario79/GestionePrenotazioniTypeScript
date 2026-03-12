export interface Sala {
  id: string;
  nome: string;
  capacita: number;
  descrizione?: string;
}

export interface Prenotazione {
  id: string;
  salaId: string;
  dataInizio: string;
  dataFine: string;
  utenteId: string;
  stato: StatoPrenotazione;
}

export type StatoPrenotazione = 'confermata' | 'in_attesa' | 'cancellata';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface AppState {
  sale: Sala[];
  prenotazioni: Prenotazione[];
  loading: boolean;
}

export interface APIError {
  error: string;
  code?: string;
}
