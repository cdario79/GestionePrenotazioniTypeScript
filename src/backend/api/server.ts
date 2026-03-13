import http, { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { GestoreSale, GestorePrenotazioni } from '../services';
import { Prenotazione } from '../models';

export class APIServer {
  private server: http.Server;
  private gestoreSale: GestoreSale;
  private gestorePrenotazioni: GestorePrenotazioni;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.gestoreSale = new GestoreSale();
    this.gestorePrenotazioni = new GestorePrenotazioni();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server in ascolto su porta ${this.port}`);
      console.log(`Apri http://localhost:${this.port} nel browser`);
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const parsedUrl = parseUrl(req.url || '', true);
    const pathname = parsedUrl.pathname || '';
    const method = req.method || 'GET';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname.startsWith('/api/')) {
      this.handleAPIRequest(pathname, method, req, res, parsedUrl);
    } else {
      this.serveStaticFile(pathname, res);
    }
  }

  private handleAPIRequest(
    pathname: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse,
    parsedUrl: { pathname: string | null; query: Record<string, string | string[] | undefined> }
  ): void {
    if (pathname === '/api/sale' && method === 'GET') {
      const sale = this.gestoreSale.elencaSale();
      this.sendJSON(res, 200, sale);
      return;
    }

    if (pathname === '/api/prenotazioni' && method === 'GET') {
      const prenotazioni = this.gestorePrenotazioni.elencoPrenotazioni();
      const sale = this.gestoreSale.elencaSale();
      const response = prenotazioni.map(p => ({
        ...p,
        dataInizio: p.dataInizio.toISOString(),
        dataFine: p.dataFine.toISOString()
      }));
      this.sendJSON(res, 200, response);
      return;
    }

    if (pathname === '/api/prenotazioni' && method === 'POST') {
      this.parseBody(req, (body) => {
        try {
          const prenotazione: Prenotazione = {
            id: body.id || this.generateId(),
            salaId: body.salaId,
            utenteId: body.utenteId,
            dataInizio: new Date(body.dataInizio),
            dataFine: new Date(body.dataFine),
            stato: body.stato || 'confermata'
          };

          const sale = this.gestoreSale.elencaSale();
          if (!this.gestoreSale.esisteSala(prenotazione.salaId)) {
            this.sendJSON(res, 400, { error: 'La sala specificata non esiste' });
            return;
          }

          const result = this.gestorePrenotazioni.creaPrenotazione(prenotazione);
          if (result.success) {
            const responseData = {
              ...result.data,
              dataInizio: result.data?.dataInizio.toISOString(),
              dataFine: result.data?.dataFine.toISOString()
            };
            this.sendJSON(res, 201, responseData);
          } else {
            this.sendJSON(res, 400, { error: result.error });
          }
        } catch (error) {
          console.error('Errore creazione prenotazione:', error);
          this.sendJSON(res, 500, { error: 'Errore interno del server' });
        }
      });
      return;
    }

    if (pathname.startsWith('/api/prenotazioni/') && method === 'DELETE') {
      const id = pathname.split('/')[3];
      const result = this.gestorePrenotazioni.cancellaPrenotazione(id);
      this.sendJSON(res, result ? 200 : 404, { success: result });
      return;
    }

    const saleMatch = pathname.match(/^\/api\/sale\/([^\/]+)\/prenotazioni$/);
    if (saleMatch && method === 'GET') {
      const salaId = saleMatch[1];
      const query = parsedUrl.query;
      const anno = query.anno ? parseInt(query.anno as string) : new Date().getFullYear();
      const mese = query.mese ? parseInt(query.mese as string) : new Date().getMonth();

      const inizioPeriodo = new Date(anno, mese, 1);
      const finePeriodo = new Date(anno, mese + 1, 0, 23, 59, 59);

      const prenotazioni = this.gestorePrenotazioni.getPrenotazioniSala(salaId).filter(p => {
        return p.dataInizio <= finePeriodo && p.dataFine >= inizioPeriodo;
      });

      const response = prenotazioni.map(p => ({
        ...p,
        dataInizio: p.dataInizio.toISOString(),
        dataFine: p.dataFine.toISOString()
      }));

      this.sendJSON(res, 200, response);
      return;
    }

    this.sendJSON(res, 404, { error: 'Endpoint non trovato' });
  }

  private serveStaticFile(pathname: string, res: ServerResponse): void {
    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.join(__dirname, '../../public', pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - File non trovato');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = this.getContentType(ext);

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  }

  private parseBody(req: IncomingMessage, callback: (body: any) => void): void {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        callback(parsed);
      } catch (error) {
        callback({});
      }
    });
  }

  private sendJSON(res: ServerResponse, status: number, data: any): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    return types[ext] || 'text/plain';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
