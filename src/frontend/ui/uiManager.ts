import { Sala, Prenotazione, AlertType } from '../models/types';
import { escapeHtml, formatTime } from '../utils/helpers';

export class UIManager {
  private sale: Sala[] = [];
  private prenotazioni: Prenotazione[] = [];

  showAlert(message: string, type: AlertType = 'info'): void {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alertId = `alert-${Date.now()}`;
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Chiudi avviso"></button>
    `;

    alertContainer.appendChild(alert);

    setTimeout(() => {
      const alertEl = document.getElementById(alertId);
      if (alertEl) {
        alertEl.remove();
      }
    }, 5000);
  }

  renderGriglia(sale: Sala[], prenotazioni: Prenotazione[], dataCorrente: Date): void {
    this.sale = sale;
    this.prenotazioni = prenotazioni;

    const header = document.getElementById('griglia-header');
    const body = document.getElementById('griglia-body');
    const mobileContainer = document.getElementById('griglia-mobile');
    if (!header || !body || !mobileContainer) return;

    const dataStr = dataCorrente.toISOString().split('T')[0];
    const fasceOrarie = this.generaFasceOrarie();

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.renderMobileView(sale, prenotazioni, dataStr, fasceOrarie, mobileContainer);
      return;
    }

    let headerHtml = '<th class="ora-colonna"><span class="visually-hidden">Orario</span></th>';
    sale.forEach(sala => {
      headerHtml += `<th scope="col">${escapeHtml(sala.nome)}</th>`;
    });
    header.innerHTML = headerHtml;

    if (!sale || sale.length === 0) {
      body.innerHTML = `
        <tr>
          <td colspan="${sale.length + 1}" class="text-center py-5">
            <div class="alert alert-info mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Nessuna sala disponibile
            </div>
          </td>
        </tr>
      `;
      mobileContainer.innerHTML = '';
      return;
    }

    let bodyHtml = '';
    fasceOrarie.forEach(fascia => {
      bodyHtml += `<tr>`;
      bodyHtml += `<th scope="row" class="ora-colonna">${fascia}</th>`;

      const [ora, min] = fascia.split(':').map(Number);

      sale.forEach(sala => {
        const prenotazioniSala = prenotazioni.filter(p => p.salaId === sala.id);
        const slotKey = `${dataStr}-${ora}-${min}`;
        const info = this.getSlotInfo(prenotazioniSala, dataStr, slotKey);

        const ariaLabel = info 
          ? `${sala.nome}, ${fascia}, occupato da ${info.nome}`
          : `${sala.nome}, ${fascia}, libero`;

        if (info) {
          bodyHtml += `
            <td>
              <div class="griglia-cell occupato" 
                   data-sala-id="${sala.id}" 
                   data-ora="${fascia}"
                   aria-label="${ariaLabel}"
                   title="${escapeHtml(info.nome)} (${info.inizio} - ${info.fine})">
                <span class="prenotazione-info">${escapeHtml(info.nome)}</span>
              </div>
            </td>
          `;
        } else {
          bodyHtml += `
            <td>
              <div class="griglia-cell libero" 
                   data-sala-id="${sala.id}" 
                   data-ora="${fascia}"
                   data-data="${dataStr}"
                   aria-label="${ariaLabel}"
                   title="Clicca per prenotare: ${sala.nome} - ${fascia}"></div>
            </td>
          `;
        }
      });

      bodyHtml += `</tr>`;
    });

    body.innerHTML = bodyHtml;
    mobileContainer.innerHTML = '';
  }

  private renderMobileView(sale: Sala[], prenotazioni: Prenotazione[], dataStr: string, fasceOrarie: string[], container: HTMLElement): void {
    const tableHeader = document.getElementById('griglia-header');
    const tableBody = document.getElementById('griglia-body');
    if (!tableHeader || !tableBody) return;

    tableHeader.innerHTML = '<th class="ora-colonna"><span class="visually-hidden">Orario</span></th>';
    sale.forEach(sala => {
      tableHeader.innerHTML += `<th scope="col">${escapeHtml(sala.nome)}</th>`;
    });

    if (!sale || sale.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="${sale.length + 1}" class="text-center py-5">
            <div class="alert alert-info mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Nessuna sala disponibile
            </div>
          </td>
        </tr>
      `;
      container.innerHTML = '';
      return;
    }

    let tableBodyHtml = '';
    fasceOrarie.forEach(fascia => {
      tableBodyHtml += `<tr>`;
      tableBodyHtml += `<th scope="row" class="ora-colonna">${fascia}</th>`;

      const [ora, min] = fascia.split(':').map(Number);

      sale.forEach(sala => {
        const prenotazioniSala = prenotazioni.filter(p => p.salaId === sala.id);
        const slotKey = `${dataStr}-${ora}-${min}`;
        const info = this.getSlotInfo(prenotazioniSala, dataStr, slotKey);

        const ariaLabel = info 
          ? `${sala.nome}, ${fascia}, occupato da ${info.nome}`
          : `${sala.nome}, ${fascia}, libero`;

        if (info) {
          tableBodyHtml += `
            <td>
              <div class="griglia-cell occupato" 
                   data-sala-id="${sala.id}" 
                   data-ora="${fascia}"
                   aria-label="${ariaLabel}"
                   title="${escapeHtml(info.nome)} (${info.inizio} - ${info.fine})">
                <span class="prenotazione-info">${escapeHtml(info.nome)}</span>
              </div>
            </td>
          `;
        } else {
          tableBodyHtml += `
            <td>
              <div class="griglia-cell libero" 
                   data-sala-id="${sala.id}" 
                   data-ora="${fascia}"
                   data-data="${dataStr}"
                   aria-label="${ariaLabel}"
                   title="Clicca per prenotare: ${sala.nome} - ${fascia}"></div>
            </td>
          `;
        }
      });

      tableBodyHtml += `</tr>`;
    });

    tableBody.innerHTML = tableBodyHtml;

    let mobileHtml = `<div class="griglia-mobile" role="listbox" aria-label="Prenotazioni per orario" aria-live="polite">`;
    
    fasceOrarie.forEach(fascia => {
      const [ora, min] = fascia.split(':').map(Number);
      const slotKey = `${dataStr}-${ora}-${min}`;

      mobileHtml += `
        <div class="ora-card" role="option" aria-label="Orario ${fascia}">
          <div class="ora-card-header">
            <i class="bi bi-clock me-2" aria-hidden="true"></i>
            <span class="fw-bold">${fascia}</span>
          </div>
          <div class="ora-card-body">
      `;

      sale.forEach(sala => {
        const prenotazioniSala = prenotazioni.filter(p => p.salaId === sala.id);
        const info = this.getSlotInfo(prenotazioniSala, dataStr, slotKey);

        const ariaLabel = info 
          ? `${sala.nome} - occupato da ${info.nome}`
          : `${sala.nome} - libero, clicca per prenotare`;

        if (info) {
          mobileHtml += `
            <div class="sala-item occupato" aria-label="${ariaLabel}">
              <div class="sala-item-info">
                <span class="sala-nome">${escapeHtml(sala.nome)}</span>
                <span class="prenotazione-nome">${escapeHtml(info.nome)}</span>
              </div>
              <span class="badge bg-danger">Occupato</span>
            </div>
          `;
        } else {
          mobileHtml += `
            <div class="sala-item libero" 
                 data-sala-id="${sala.id}" 
                 data-ora="${fascia}"
                 data-data="${dataStr}"
                 role="button"
                 tabindex="0"
                 aria-label="${ariaLabel}"
                 title="Clicca per prenotare: ${sala.nome} - ${fascia}">
              <div class="sala-item-info">
                <span class="sala-nome">${escapeHtml(sala.nome)}</span>
                <span class="text-muted">Libero</span>
              </div>
              <span class="badge bg-success">Prenota</span>
            </div>
          `;
        }
      });

      mobileHtml += `
          </div>
        </div>
      `;
    });

    mobileHtml += `</div>`;
    container.innerHTML = mobileHtml;
  }

  private getSlotInfo(prenotazioniSala: Prenotazione[], dataStr: string, slotKey: string): { nome: string; inizio: string; fine: string } | null {
    const occMap = this.getSlotStatus(prenotazioniSala, dataStr);
    return occMap.get(slotKey) || null;
  }

  private generaFasceOrarie(): string[] {
    const fasce: string[] = [];
    for (let ora = 9; ora < 18; ora++) {
      fasce.push(formatTime(ora, 0));
      fasce.push(formatTime(ora, 30));
    }
    return fasce;
  }

  private getSlotStatus(prenotazioniSala: Prenotazione[], dataStr: string): Map<string, { nome: string; inizio: string; fine: string }> {
    const occupati = new Map<string, { nome: string; inizio: string; fine: string }>();

    prenotazioniSala.forEach(p => {
      const inizio = new Date(p.dataInizio);
      const fine = new Date(p.dataFine);
      const inizioStr = inizio.toISOString().split('T')[0];
      const fineStr = fine.toISOString().split('T')[0];

      if (dataStr >= inizioStr && dataStr <= fineStr) {
        const oraInizio = inizio.getHours();
        const minInizio = inizio.getMinutes();
        const oraFine = fine.getHours();
        const minFine = fine.getMinutes();

        for (let ora = oraInizio; ora < oraFine || (ora === oraFine && minFine > 0); ora++) {
          const startMin = ora === oraInizio ? minInizio : 0;
          const endMin = ora === oraFine ? minFine : 60;

          for (let min = startMin; min < endMin; min += 30) {
            const slotKey = `${dataStr}-${ora}-${min}`;
            if (!occupati.has(slotKey)) {
              occupati.set(slotKey, {
                nome: p.utenteId,
                inizio: formatTime(inizio.getHours(), inizio.getMinutes()),
                fine: formatTime(fine.getHours(), fine.getMinutes())
              });
            }
          }
        }
      }
    });

    return occupati;
  }

  aggiornaTitoloGiorno(dataCorrente: Date): void {
    const titolo = document.getElementById('giornoTitolo');
    if (!titolo) return;

    const oggi = new Date();
    const isToday = dataCorrente.toDateString() === oggi.toDateString();

    if (isToday) {
      titolo.textContent = 'Oggi';
    } else {
      const domani = new Date(oggi);
      domani.setDate(domani.getDate() + 1);
      const isDomani = dataCorrente.toDateString() === domani.toDateString();

      if (isDomani) {
        titolo.textContent = 'Domani';
      } else {
        titolo.textContent = dataCorrente.toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      }
    }
  }

  popolaSelectOre(oraSelezionata?: string): void {
    const oraInizio = document.getElementById('ora-inizio') as HTMLSelectElement;
    const oraFine = document.getElementById('ora-fine') as HTMLSelectElement;

    if (!oraInizio || !oraFine) return;

    let optionsInizio = '<option value="">Seleziona...</option>';
    let optionsFine = '<option value="">Seleziona...</option>';

    for (let ora = 9; ora < 18; ora++) {
      optionsInizio += `<option value="${formatTime(ora, 0)}">${formatTime(ora, 0)}</option>`;
      optionsInizio += `<option value="${formatTime(ora, 30)}">${formatTime(ora, 30)}</option>`;

      if (ora < 17) {
        optionsFine += `<option value="${formatTime(ora, 30)}">${formatTime(ora, 30)}</option>`;
      }
      optionsFine += `<option value="${formatTime(ora + 1, 0)}">${formatTime(ora + 1, 0)}</option>`;
    }

    oraInizio.innerHTML = optionsInizio;
    oraFine.innerHTML = optionsFine;

    if (oraSelezionata) {
      oraInizio.value = oraSelezionata;
      const [ora, min] = oraSelezionata.split(':').map(Number);
      const nextH = min === 30 ? ora + 1 : ora;
      const nextM = min === 30 ? 0 : 30;
      oraFine.value = formatTime(nextH, nextM);
    }
  }

  apriModalPrenotazione(salaId: string, salaNome: string, dataStr: string, ora: string): void {
    const salaIdInput = document.getElementById('sala-id') as HTMLInputElement;
    const dataSelInput = document.getElementById('data-selezionata') as HTMLInputElement;
    const salaNomeEl = document.getElementById('prenotazione-sala');
    const dataEl = document.getElementById('prenotazione-data');
    const orarioEl = document.getElementById('prenotazione-orario');
    const nomeInput = document.getElementById('prenotazione-nome') as HTMLInputElement;
    const noteInput = document.getElementById('prenotazione-note') as HTMLTextAreaElement;
    const form = document.getElementById('prenotazione-form') as HTMLFormElement;

    if (!salaIdInput || !dataSelInput || !salaNomeEl || !dataEl || !orarioEl || !form) return;

    const [oraNum, minNum] = ora.split(':').map(Number);
    const oraFine = formatTime(oraNum + 1, minNum);

    salaIdInput.value = salaId;
    dataSelInput.value = dataStr;
    form.classList.remove('was-validated');
    nomeInput.value = '';
    noteInput.value = '';

    const [anno, mese, giorno] = dataStr.split('-').map(Number);
    const dataFormattata = new Date(anno, mese - 1, giorno).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    salaNomeEl.textContent = salaNome;
    dataEl.textContent = dataFormattata;
    orarioEl.textContent = `${ora} - ${oraFine}`;

    this.popolaSelectOre(ora);

    const modalEl = document.getElementById('prenotazioneModal');
    if (modalEl) {
      const modal = (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl);
      modal?.show();
    }
  }

  apriModalDettagliSala(sala: Sala): void {
    const nomeEl = document.getElementById('sala-dettagli-nome');
    const capacitaEl = document.getElementById('sala-dettagli-capacita');
    const descrEl = document.getElementById('sala-dettagli-descrizione');

    if (nomeEl) nomeEl.textContent = sala.nome;
    if (capacitaEl) capacitaEl.textContent = sala.capacita.toString();
    if (descrEl) descrEl.textContent = sala.descrizione || 'Sala riunioni';

    const modalEl = document.getElementById('dettagliSalaModal');
    if (modalEl) {
      const modal = (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl);
      modal?.show();
    }
  }

  mostraRisultato(successo: boolean, messaggio: string): void {
    const iconEl = document.getElementById('risultato-icon');
    const titoloEl = document.getElementById('risultato-titolo');
    const messaggioEl = document.getElementById('risultato-messaggio');

    if (!iconEl || !titoloEl || !messaggioEl) return;

    if (successo) {
      iconEl.innerHTML = '<i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>';
      titoloEl.textContent = 'Prenotazione confermata!';
      titoloEl.className = 'mb-2 text-success';
    } else {
      iconEl.innerHTML = '<i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>';
      titoloEl.textContent = 'Slot non disponibile';
      titoloEl.className = 'mb-2 text-danger';
    }

    messaggioEl.textContent = messaggio;

    const modalEl = document.getElementById('risultatoModal');
    if (modalEl) {
      const modal = (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl);
      modal?.show();
    }
  }

  chiudiModal(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl);
      modal?.hide();
    }
  }

  getDatiForm(): { salaId: string; data: string; oraInizio: string; oraFine: string; nome: string; note: string } {
    return {
      salaId: (document.getElementById('sala-id') as HTMLInputElement).value,
      data: (document.getElementById('data-selezionata') as HTMLInputElement).value,
      oraInizio: (document.getElementById('ora-inizio') as HTMLSelectElement).value,
      oraFine: (document.getElementById('ora-fine') as HTMLSelectElement).value,
      nome: (document.getElementById('prenotazione-nome') as HTMLInputElement).value,
      note: (document.getElementById('prenotazione-note') as HTMLTextAreaElement).value
    };
  }

  validaForm(): boolean {
    const form = document.getElementById('prenotazione-form') as HTMLFormElement;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return false;
    }
    return true;
  }
}
