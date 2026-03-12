import { Sala } from '../models';

export class GestoreSale {
  private sale: Map<string, Sala>;

  constructor() {
    this.sale = new Map();
    this.inizializzaSale();
  }

  private inizializzaSale(): void {
    const saleIniziali: Sala[] = [
      {
        id: 'sala-1',
        nome: 'Sala Monte Rosa',
        capacita: 8,
        descrizione: 'Sala riunioni con vista montagna, ideale per meeting medi'
      },
      {
        id: 'sala-2',
        nome: 'Sala Triangolo',
        capacita: 12,
        descrizione: 'Sala grande con tavolo ovale, perfetta per presentazioni'
      },
      {
        id: 'sala-3',
        nome: 'Sala Compact',
        capacita: 4,
        descrizione: 'Sala intima per piccoli gruppi o colloqui'
      },
      {
        id: 'sala-4',
        nome: 'Sala Creative',
        capacita: 6,
        descrizione: 'Sala con Lavagna interattiva e ambientazione informale'
      },
      {
        id: 'sala-5',
        nome: 'Sala Executive',
        capacita: 20,
        descrizione: 'Sala plenaria per conference call e eventi aziendali'
      }
    ];

    saleIniziali.forEach(sala => this.sale.set(sala.id, sala));
  }

  aggiungiSala(sala: Sala): boolean {
    if (this.sale.has(sala.id)) {
      return false;
    }
    this.sale.set(sala.id, sala);
    return true;
  }

  rimuoviSala(salaId: string): boolean {
    return this.sale.delete(salaId);
  }

  getSala(salaId: string): Sala | undefined {
    return this.sale.get(salaId);
  }

  elencaSale(): Sala[] {
    return Array.from(this.sale.values());
  }

  esisteSala(salaId: string): boolean {
    return this.sale.has(salaId);
  }
}
