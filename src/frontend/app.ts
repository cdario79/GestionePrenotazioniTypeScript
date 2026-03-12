import { APIService } from './services/apiService';
import { UIManager } from './ui/uiManager';
import { Prenotazione } from './models/types';
import { generateId, getElement } from './utils/helpers';

class App {
  private apiService: APIService;
  private uiManager: UIManager;

  constructor() {
    this.apiService = new APIService();
    this.uiManager = new UIManager();
  }

  async init(): Promise<void> {
    this.setupEventListeners();
    this.setupDateInputs();
    await this.caricaDatiIniziali();
  }

  private async caricaDatiIniziali(): Promise<void> {
    await this.caricaSale();
    await this.caricaPrenotazioni();
  }

  private async caricaSale(): Promise<void> {
    try {
      const sale = await this.apiService.getSale();
      this.uiManager.renderSale(sale);
      this.uiManager.popolaSelectSale(sale);
    } catch (error) {
      console.error('Errore:', error);
      this.uiManager.showAlert('Impossibile caricare le sale. Riprova più tardi.', 'danger');
    }
  }

  private async caricaPrenotazioni(): Promise<void> {
    try {
      const prenotazioni = await this.apiService.getPrenotazioni();
      this.uiManager.renderPrenotazioni(prenotazioni);
    } catch (error) {
      console.error('Errore:', error);
      this.uiManager.showAlert('Impossibile caricare le prenotazioni.', 'warning');
    }
  }

  private setupEventListeners(): void {
    const form = getElement<HTMLFormElement>('prenotazione-form');
    form.addEventListener('submit', (e) => this.handleFormSubmit(e));

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLButtonElement;

      if (button) {
        const action = button.dataset.action;

        if (action === 'select-sala') {
          const salaId = button.dataset.salaId;
          if (salaId) this.selezionaSala(salaId);
        } else if (action === 'delete-prenotazione') {
          const prenotazioneId = button.dataset.prenotazioneId;
          if (prenotazioneId) this.cancellaPrenotazione(prenotazioneId);
        }
      }
    });
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      this.uiManager.showAlert('Compila tutti i campi obbligatori', 'warning');
      return;
    }

    this.uiManager.setSubmitButtonLoading(true);

    const prenotazione: Prenotazione = {
      id: generateId(),
      salaId: getElement<HTMLSelectElement>('sala-select').value,
      utenteId: getElement<HTMLInputElement>('utente-nome').value,
      dataInizio: new Date(getElement<HTMLInputElement>('data-inizio').value).toISOString(),
      dataFine: new Date(getElement<HTMLInputElement>('data-fine').value).toISOString(),
      stato: 'confermata'
    };

    try {
      await this.apiService.creaPrenotazione(prenotazione);
      this.uiManager.showAlert('Prenotazione confermata con successo!', 'success');
      form.reset();
      form.classList.remove('was-validated');
      await this.caricaPrenotazioni();
    } catch (error) {
      console.error('Errore:', error);
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      this.uiManager.showAlert(message, 'danger');
    } finally {
      this.uiManager.setSubmitButtonLoading(false);
    }
  }

  private selezionaSala(salaId: string): void {
    const select = getElement<HTMLSelectElement>('sala-select');
    select.value = salaId;
    select.focus();

    getElement('prenotazione-form').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  private async cancellaPrenotazione(id: string): Promise<void> {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return;
    }

    try {
      await this.apiService.cancellaPrenotazione(id);
      this.uiManager.showAlert('Prenotazione cancellata', 'info');
      await this.caricaPrenotazioni();
    } catch (error) {
      console.error('Errore:', error);
      this.uiManager.showAlert('Impossibile cancellare la prenotazione', 'danger');
    }
  }

  private setupDateInputs(): void {
    const now = new Date();
    const minDateTime = now.toISOString().slice(0, 16);

    getElement<HTMLInputElement>('data-inizio').min = minDateTime;
    getElement<HTMLInputElement>('data-fine').min = minDateTime;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(error => {
    console.error('Errore inizializzazione app:', error);
  });
});
