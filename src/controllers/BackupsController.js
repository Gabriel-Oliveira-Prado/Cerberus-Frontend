import Swal from 'sweetalert2';
import { icones } from '../js/utils.js';

export default class BackupsController {
  // Inicializa a view de backups injetando ícones e mapeando eventos
  async init() {
    this.injectIcons();
    this.bindEvents();
  }

  // Substitui os placeholders pelos ícones SVG correspondentes
  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
  }

  // Configura os ouvintes de eventos para as ações dos botões (verificar e detalhes do checksum)
  bindEvents() {
    const btnVerificar = document.getElementById('btn-verificar');
    if (btnVerificar) {
      btnVerificar.addEventListener('click', () => {
        Swal.fire({
          title: 'Verificação Iniciada',
          text: 'A varredura de integridade dos backups foi colocada na fila.',
          icon: 'success',
          confirmButtonColor: '#dc3545'
        });
      });
    }

    document.querySelectorAll('.btn-acao-verificar').forEach(btn => {
      btn.addEventListener('click', () => {
        Swal.fire({
          title: 'Detalhes do Checksum',
          html: '<p class="font-monospace text-start bg-light p-3 rounded border">Hash MD5: 8b1a9953c4611296a827abf8c47804d7<br>Tamanho: 12.4 GB<br>Criptografia: AES-256</p>',
          icon: 'info',
          confirmButtonColor: '#dc3545'
        });
      });
    });
  }
}
