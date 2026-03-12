// @ts-ignore
import { Sala, Prenotazione, APIError } from '../models';

export class APIService {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  async getSale(): Promise<Sala[]> {
    const response = await fetch(`${this.baseURL}/sale`);
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle sale');
    }
    return response.json();
  }

  async getPrenotazioni(): Promise<Prenotazione[]> {
    const response = await fetch(`${this.baseURL}/prenotazioni`);
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle prenotazioni');
    }
    return response.json();
  }

  async creaPrenotazione(prenotazione: Prenotazione): Promise<Prenotazione> {
    const response = await fetch(`${this.baseURL}/prenotazioni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prenotazione)
    });

    if (!response.ok) {
      const error: APIError = await response.json();
      throw new Error(error.error || 'Errore nella prenotazione');
    }

    return response.json();
  }

  async cancellaPrenotazione(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/prenotazioni/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Errore nella cancellazione');
    }

    const result = await response.json();
    return result.success;
  }
}
