import axios from 'axios';
import { BASE_URL } from '../config/api.js';
import { icones } from '../js/utils.js';
import Swal from 'sweetalert2';

export default class EstruturaController {
  async init() {
    this.injectIcons();
    await this.fetchSchemaAndRender();
    this.bindEvents();
  }

  injectIcons() {
    const iconContainer = document.querySelector('.icone-database-estrutura');
    if (iconContainer) {
      iconContainer.innerHTML = icones.database;
    }
  }

  async fetchSchemaAndRender() {
    const container = document.getElementById('mermaid-diagram-container');
    if (!container) return;

    container.innerHTML = `
      <div class="text-muted spinner-border text-danger" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    `;

    try {
      const response = await axios.get(`${BASE_URL}/api/schema`, {
        withCredentials: true
      });
      const data = response.data;

      if (data.success) {
        let erMarkup = "erDiagram\n";
        
        data.tables.forEach(table => {
          erMarkup += `  ${table.name} {\n`;
          table.columns.forEach(col => {
            const cleanType = col.type.replace(/[^a-zA-Z0-9]/g, '');
            erMarkup += `    ${cleanType} ${col.name} ${col.pk ? 'PK' : ''}\n`;
          });
          erMarkup += `  }\n`;
        });

        data.relationships.forEach(rel => {
          // Simplifica o nome do relacionamento
          erMarkup += `  ${rel.from_table} ||--o{ ${rel.to_table} : "relaciona"\n`;
        });

        container.innerHTML = `<pre class="mermaid" id="mermaid-svg-target" style="background-color: transparent; text-align: center; margin: 0; padding: 0;">${erMarkup}</pre>`;

        if (window.mermaid) {
          try {
            await window.mermaid.run({
              nodes: [document.getElementById('mermaid-svg-target')]
            });
          } catch (renderError) {
            console.error('Error executing mermaid.run:', renderError);
            container.innerHTML = '<div class="text-danger small">Erro ao renderizar o diagrama com o Mermaid.</div>';
          }
        } else {
          container.innerHTML = '<div class="text-warning small">Biblioteca Mermaid não carregada no navegador.</div>';
        }
      } else {
        container.innerHTML = `<div class="text-danger small">Erro: ${data.message}</div>`;
      }
    } catch (error) {
      console.error('Failed to load database schema:', error);
      container.innerHTML = '<div class="text-danger small">Erro de rede ao buscar estrutura do banco.</div>';
    }
  }

  bindEvents() {
    const btn = document.getElementById('btn-atualizar-estrutura');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';
        
        await this.fetchSchemaAndRender();
        
        btn.disabled = false;
        btn.textContent = originalText;

        Swal.fire({
          title: 'Diagrama Atualizado!',
          text: 'O modelo físico foi sincronizado e renderizado com sucesso.',
          icon: 'success',
          confirmButtonColor: '#dc3545',
          timer: 2000
        });
      });
    }
  }
}
