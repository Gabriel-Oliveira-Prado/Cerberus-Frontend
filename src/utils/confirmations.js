import Swal from 'sweetalert2';

const DANGER_COLOR = '#dc3545';
const CANCEL_COLOR = '#6c757d';

export async function confirmDatabaseDisconnect() {
  const result = await Swal.fire({
    title: 'Desconectar o banco?',
    text: 'A conexão salva será removida desta conta. Os dados do banco não serão apagados.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: DANGER_COLOR,
    cancelButtonColor: CANCEL_COLOR,
    confirmButtonText: 'Desconectar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  });

  return result.isConfirmed;
}

export async function confirmLogout() {
  const result = await Swal.fire({
    title: 'Sair da conta?',
    text: 'Você precisará informar suas credenciais para acessar o Cerberus novamente.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: DANGER_COLOR,
    cancelButtonColor: CANCEL_COLOR,
    confirmButtonText: 'Sair',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  });

  return result.isConfirmed;
}
