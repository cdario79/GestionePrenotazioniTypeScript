import { Prenotazione, ValidationResult, Sala } from '../models';

export class ValidatorePrenotazione {
  static valida(
    prenotazione: Prenotazione,
    sale: Sala[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!prenotazione.salaId || prenotazione.salaId.trim() === '') {
      errors.push('ID sala obbligatorio');
    }

    const salaEsiste = sale.some(s => s.id === prenotazione.salaId);
    if (!salaEsiste) {
      errors.push('La sala specificata non esiste');
    }

    if (!prenotazione.utenteId || prenotazione.utenteId.trim() === '') {
      errors.push('ID utente obbligatorio');
    }

    if (!prenotazione.dataInizio || !(prenotazione.dataInizio instanceof Date)) {
      errors.push('Data inizio obbligatoria');
    }

    if (!prenotazione.dataFine || !(prenotazione.dataFine instanceof Date)) {
      errors.push('Data fine obbligatoria');
    }

    if (prenotazione.dataInizio && prenotazione.dataFine) {
      if (prenotazione.dataInizio >= prenotazione.dataFine) {
        errors.push('La data di inizio deve essere precedente alla data di fine');
      }

      const now = new Date();
      if (prenotazione.dataInizio < now) {
        errors.push('Non è possibile prenotare per una data passata');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export class ValidatoreSala {
  static valida(sala: Sala): ValidationResult {
    const errors: string[] = [];

    if (!sala.id || sala.id.trim() === '') {
      errors.push('ID sala obbligatorio');
    }

    if (!sala.nome || sala.nome.trim() === '') {
      errors.push('Nome sala obbligatorio');
    }

    if (!sala.capacita || sala.capacita <= 0) {
      errors.push('Capacità sala deve essere maggiore di 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
