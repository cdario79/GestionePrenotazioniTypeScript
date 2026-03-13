import { APIService } from './services/apiService';
import { UIManager } from './ui/uiManager';
import { Prenotazione, Sala } from './models/types';
import { generateId } from './utils/helpers';

declare const bootstrap: {
  Modal: {
    getOrCreateInstance: (el: Element) => { show: () => void; hide: () => void };
  };
};

class App {
  private apiService: APIService;
  private uiManager: UIManager;
  private sale: Sala[] = [];
  private prenotazioni: Prenotazione[] = [];
  private currentDate: Date = new Date();

  constructor() {
    this.apiService = new APIService();
    this.uiManager = new UIManager();
  }

  async init(): Promise<void> {
    this.setupEventListeners();
    await this.caricaDatiIniziali();
  }

  private async caricaDatiIniziali(): Promise<void> {
    await this.caricaSale();
    await this.caricaPrenotazioni();
    this.aggiornaGriglia();
  }

  private async caricaSale(): Promise<void> {
    try {
      this.sale = await this.apiService.getSale();
    } catch (error) {
      console.error('Errore caricamento sale:', error);
      this.uiManager.showAlert('Impossibile caricare le sale', 'danger');
    }
  }

  private async caricaPrenotazioni(): Promise<void> {
    try {
      this.prenotazioni = await this.apiService.getPrenotazioni();
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
      this.uiManager.showAlert('Impossibile caricare le prenotazioni', 'warning');
    }
  }

  private setupEventListeners(): void {
    document.getElementById('giornoPrev')?.addEventListener('click', () => this.navigaGiorno(-1));
    document.getElementById('giornoNext')?.addEventListener('click', () => this.navigaGiorno(1));
    document.getElementById('giornoOggi')?.addEventListener('click', () => this.vaiAOggi());

    document.getElementById('griglia-body')?.addEventListener('click', (e) => {
      this.handleGrigliaClick(e);
    });

    document.getElementById('griglia-mobile')?.addEventListener('click', (e) => {
      this.handleGrigliaClick(e);
    });

    document.getElementById('griglia-mobile')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleGrigliaClick(e);
      }
    });

    document.getElementById('griglia-header')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-action="info-sala"]');
      if (btn) {
        this.uiManager.showAlert('Clicca sulla sala nella riga per vedere i dettagli', 'info');
      }
    });

    document.getElementById('btnConfermaPrenotazione')?.addEventListener('click', () => this.confermaPrenotazione());

    document.getElementById('prenotazioneModal')?.addEventListener('hidden.bs.modal', () => {
      this.aggiornaGriglia();
    });

    document.getElementById('btnChiudiRisultato')?.addEventListener('click', () => {
      this.aggiornaGriglia();
    });

    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.aggiornaGriglia();
      }, 250);
    });
  }

  private handleGrigliaClick(e: Event): void {
    const target = e.target as HTMLElement;
    const cell = target.closest('.griglia-cell, .sala-item') as HTMLElement;

    if (cell) {
      if (cell.classList.contains('libero')) {
        const salaId = cell.dataset.salaId;
        const data = cell.dataset.data;
        const ora = cell.dataset.ora;
        if (salaId && data && ora) this.apriModalPrenotazione(salaId, data, ora);
      }
    }
  }

  private navigaGiorno(direzione: number): void {
    this.currentDate.setDate(this.currentDate.getDate() + direzione);
    this.aggiornaGriglia();
  }

  private vaiAOggi(): void {
    this.currentDate = new Date();
    this.aggiornaGriglia();
  }

  private aggiornaGriglia(): void {
    this.uiManager.renderGriglia(this.sale, this.prenotazioni, this.currentDate);
    this.uiManager.aggiornaTitoloGiorno(this.currentDate);
  }

  private mostraDettagliSala(salaId: string): void {
    const sala = this.sale.find(s => s.id === salaId);
    if (sala) {
      this.uiManager.apriModalDettagliSala(sala);
    }
  }

  private apriModalPrenotazione(salaId: string, dataStr: string, ora: string): void {
    const sala = this.sale.find(s => s.id === salaId);
    if (!sala) return;

    this.uiManager.apriModalPrenotazione(salaId, sala.nome, dataStr, ora);
  }

  private async confermaPrenotazione(): Promise<void> {
    if (!this.uiManager.validaForm()) {
      this.uiManager.showAlert('Compila tutti i campi obbligatori', 'warning');
      return;
    }

    const dati = this.uiManager.getDatiForm();

    const dataInizio = new Date(`${dati.data}T${dati.oraInizio}:00`);
    const dataFine = new Date(`${dati.data}T${dati.oraFine}:00`);

    if (dataFine <= dataInizio) {
      this.uiManager.mostraRisultato(false, 'L\'ora di fine deve essere successiva all\'ora di inizio');
      return;
    }

    const prenotazione: Prenotazione = {
      id: generateId(),
      salaId: dati.salaId,
      utenteId: dati.nome,
      dataInizio: dataInizio.toISOString(),
      dataFine: dataFine.toISOString(),
      stato: 'confermata'
    };

    try {
      await this.apiService.creaPrenotazione(prenotazione);

      this.uiManager.chiudiModal('prenotazioneModal');
      this.uiManager.mostraRisultato(true, `La sala è stata prenotata per il ${dataInizio.toLocaleDateString('it-IT')} dalle ${dati.oraInizio} alle ${dati.oraFine}`);

      await this.caricaPrenotazioni();
    } catch (error) {
      console.error('Errore conferma prenotazione:', error);
      const messaggio = error instanceof Error ? error.message : 'Errore sconosciuto';
      this.uiManager.chiudiModal('prenotazioneModal');
      this.uiManager.mostraRisultato(false, messaggio + '. Lo slot potrebbe essere stato occupato da un altro utente.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(error => {
    console.error('Errore inizializzazione app:', error);
  });
});
