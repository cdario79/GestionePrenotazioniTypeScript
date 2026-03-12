import { Sala, Prenotazione, AlertType, AppState } from '../models/types';
import { escapeHtml, formatDateTime } from '../utils/helpers';

declare const bootstrap: any;

export class UIManager {
  private state: AppState;

  constructor() {
    this.state = {
      sale: [],
      prenotazioni: [],
      loading: false
    };
  }

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
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
        bsAlert.close();
      }
    }, 5000);
  }

  renderSale(sale: Sala[]): void {
    this.state.sale = sale;
    const container = document.getElementById('sale-list');
    if (!container) return;

    if (!sale || sale.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info" role="alert">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            Nessuna sala disponibile al momento.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = sale.map(sala => `
      <div class="col-md-6 col-lg-4" role="listitem">
        <div class="card sala-card h-100 fade-in" tabindex="0">
          <div class="card-body">
            <h3 class="card-title h5">
              <i class="bi bi-door-closed text-primary" aria-hidden="true"></i>
              ${escapeHtml(sala.nome)}
            </h3>
            <p class="card-text text-muted">
              ${escapeHtml(sala.descrizione || 'Sala riunioni')}
            </p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge bg-primary badge-capacita">
                <i class="bi bi-people-fill" aria-hidden="true"></i>
                ${sala.capacita} persone
              </span>
              <button
                class="btn btn-sm btn-outline-primary"
                data-sala-id="${sala.id}"
                data-action="select-sala"
                aria-label="Prenota ${escapeHtml(sala.nome)}">
                Prenota
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  popolaSelectSale(sale: Sala[]): void {
    const select = document.getElementById('sala-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">Seleziona una sala...</option>' +
      sale.map(sala => `
        <option value="${sala.id}">
          ${escapeHtml(sala.nome)} (${sala.capacita} persone)
        </option>
      `).join('');
  }

  renderPrenotazioni(prenotazioni: Prenotazione[]): void {
    this.state.prenotazioni = prenotazioni;
    const container = document.getElementById('prenotazioni-list');
    if (!container) return;

    if (!prenotazioni || prenotazioni.length === 0) {
      container.innerHTML = `
        <p class="text-muted">
          <i class="bi bi-inbox" aria-hidden="true"></i>
          Nessuna prenotazione attiva
        </p>
      `;
      return;
    }

    container.innerHTML = prenotazioni.map(p => {
      const sala = this.state.sale.find(s => s.id === p.salaId);
      const salaNome = sala ? sala.nome : 'Sala sconosciuta';

      return `
        <div class="card prenotazione-item mb-3 fade-in" role="listitem">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h3 class="h6 mb-2">
                  <i class="bi bi-door-closed" aria-hidden="true"></i>
                  ${escapeHtml(salaNome)}
                </h3>
                <p class="mb-1 small">
                  <i class="bi bi-person" aria-hidden="true"></i>
                  <strong>Utente:</strong> ${escapeHtml(p.utenteId)}
                </p>
                <p class="mb-1 small">
                  <i class="bi bi-clock" aria-hidden="true"></i>
                  <strong>Inizio:</strong> ${formatDateTime(p.dataInizio)}
                </p>
                <p class="mb-1 small">
                  <i class="bi bi-clock-fill" aria-hidden="true"></i>
                  <strong>Fine:</strong> ${formatDateTime(p.dataFine)}
                </p>
                <span class="badge stato-${p.stato}">
                  ${p.stato.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                data-prenotazione-id="${p.id}"
                data-action="delete-prenotazione"
                aria-label="Cancella prenotazione per ${escapeHtml(salaNome)}">
                <i class="bi bi-trash" aria-hidden="true"></i>
                Cancella
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  setSubmitButtonLoading(loading: boolean): void {
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    if (!submitBtn) return;

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Prenotazione in corso...';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-circle" aria-hidden="true"></i> Conferma Prenotazione';
    }
  }
}
