export class PrenotazioneError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PrenotazioneError';
  }
}

export class SalaNonTrovataError extends PrenotazioneError {
  constructor(salaId: string) {
    super(`Sala con ID ${salaId} non trovata`, 'SALA_NON_TROVATA');
    this.name = 'SalaNonTrovataError';
  }
}

export class SovrapposizioneError extends PrenotazioneError {
  constructor(salaId: string, dataInizio: Date, dataFine: Date) {
    super(
      `Sala ${salaId} già occupata per l'orario richiesto (${dataInizio.toISOString()} - ${dataFine.toISOString()})`,
      'SOVRAPPOSIZIONE'
    );
    this.name = 'SovrapposizioneError';
  }
}

export class DataNonValidaError extends PrenotazioneError {
  constructor(message: string) {
    super(message, 'DATA_NON_VALIDA');
    this.name = 'DataNonValidaError';
  }
}

export class ValidazioneError extends PrenotazioneError {
  constructor(errors: string[]) {
    super(`Validazione fallita: ${errors.join(', ')}`, 'VALIDAZIONE');
    this.name = 'ValidazioneError';
  }
}
