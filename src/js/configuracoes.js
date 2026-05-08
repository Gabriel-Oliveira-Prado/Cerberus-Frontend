import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/estilos.css';
import { carregarDados, icones } from './comum.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('container-conteudo');
  
  const htmlFinal = `
    <div class="row g-4 fade-in">
      <div class="col-md-4">
        <div class="list-group shadow-sm rounded-4 overflow-hidden border-0">
          <button class="list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 active bg-danger">
            <span style="width: 20px; height: 20px;">${icones.engrenagem}</span>
            <span class="fw-semibold">Configurações Gerais</span>
          </button>
          <button class="list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 text-muted">
            <span style="width: 20px; height: 20px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span class="fw-semibold">Editar Perfil</span>
          </button>
          <button class="list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 text-muted">
            <span style="width: 20px; height: 20px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </span>
            <span class="fw-semibold">Notificações</span>
          </button>
          <button class="list-group-item list-group-item-action border-0 p-3 d-flex align-items-center gap-3 text-danger mt-3" id="btn-sair-sistema">
            <span style="width: 20px; height: 20px;">${icones.sair}</span>
            <span class="fw-semibold">Sair do Sistema</span>
          </button>
        </div>
      </div>
      
      <div class="col-md-8">
        <div class="cartao h-100 d-flex flex-column">
          <div class="flex-grow-1">
            <h3 class="h5 mb-4 border-bottom pb-2">Configurações Gerais</h3>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Nome do Sistema</label>
              <input type="text" class="form-control" value="DATAGUARD-ALPHA-01">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Idioma Padrão</label>
              <select class="form-select">
                <option selected>Português (Brasil)</option>
                <option>English (US)</option>
              </select>
            </div>
          </div>
          <div class="text-end mt-5 pt-3 border-top">
            <button class="btn btn-primary" id="btn-salvar-config">Salvar Alterações</button>
          </div>
        </div>
      </div>
    </div>
  `;

  await carregarDados(container, htmlFinal, 500);

  // SweetAlert actions
  const btnSalvar = document.getElementById('btn-salvar-config');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', () => {
      Swal.fire({
        title: 'Sucesso!',
        text: 'As configurações foram salvas.',
        icon: 'success',
        confirmButtonColor: '#dc3545',
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  const btnSair = document.getElementById('btn-sair-sistema');
  if (btnSair) {
    btnSair.addEventListener('click', () => {
      Swal.fire({
        title: 'Sair do Sistema?',
        text: 'Você precisará fazer login novamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, sair!',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/login.html';
        }
      });
    });
  }
});
