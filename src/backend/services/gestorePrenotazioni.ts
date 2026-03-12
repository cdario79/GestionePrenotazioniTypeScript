import { Prenotazione, Result, StatoPrenotazione } from '../models';

export class GestorePrenotazioni {
  private prenotazioni: Map<string, Prenotazione>;

  constructor() {
    this.prenotazioni = new Map();
  }

  creaPrenotazione(prenotazione: Prenotazione): Result<Prenotazione> {
    if (!this.verificaDisponibilita(prenotazione.salaId, prenotazione.dataInizio, prenotazione.dataFine)) {
      return {
        success: false,
        error: 'La sala è già prenotata per l\'orario richiesto'
      };
    }

    if (prenotazione.dataInizio >= prenotazione.dataFine) {
      return {
        success: false,
        error: 'La data di inizio deve essere precedente alla data di fine'
      };
    }

    if (prenotazione.dataInizio < new Date()) {
      return {
        success: false,
        error: 'Non è possibile prenotare per una data passata'
      };
    }

    this.prenotazioni.set(prenotazione.id, prenotazione);
    return {
      success: true,
      data: prenotazione
    };
  }

  cancellaPrenotazione(id: string): boolean {
    const prenotazione = this.prenotazioni.get(id);
    if (!prenotazione) {
      return false;
    }

    prenotazione.stato = 'cancellata';
    this.prenotazioni.set(id, prenotazione);
    return true;
  }

  verificaDisponibilita(salaId: string, dataInizio: Date, dataFine: Date): boolean {
    for (const prenotazione of this.prenotazioni.values()) {
      if (prenotazione.salaId !== salaId) {
        continue;
      }

      if (prenotazione.stato === 'cancellata') {
        continue;
      }

      const inizioEsistente = prenotazione.dataInizio.getTime();
      const fineEsistente = prenotazione.dataFine.getTime();
      const inizioNuovo = dataInizio.getTime();
      const fineNuovo = dataFine.getTime();

      if (inizioNuovo < fineEsistente && fineNuovo > inizioEsistente) {
        return false;
      }
    }

    return true;
  }

  getPrenotazioniSala(salaId: string): Prenotazione[] {
    return Array.from(this.prenotazioni.values()).filter(
      p => p.salaId === salaId && p.stato !== 'cancellata'
    );
  }

  getPrenotazione(id: string): Prenotazione | undefined {
    return this.prenotazioni.get(id);
  }

  elencoPrenotazioni(): Prenotazione[] {
    return Array.from(this.prenotazioni.values()).filter(
      p => p.stato !== 'cancellata'
    );
  }

  aggiornaStato(id: string, stato: StatoPrenotazione): boolean {
    const prenotazione = this.prenotazioni.get(id);
    if (!prenotazione) {
      return false;
    }
    prenotazione.stato = stato;
    this.prenotazioni.set(id, prenotazione);
    return true;
  }
}
