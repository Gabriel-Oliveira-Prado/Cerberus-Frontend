import { icones } from '../js/utils.js';

export default class ServidoresController {
  // Inicializa o controle de servidores e injeta os ícones na view
  async init() {
    this.injectIcons();
  }

  // Preenche os placeholders com os ícones SVG apropriados
  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
    document.querySelectorAll('.icone-cpu').forEach(el => el.innerHTML = icones.cpu);
    document.querySelectorAll('.icone-memoria').forEach(el => el.innerHTML = icones.memoria);
    document.querySelectorAll('.icone-disco').forEach(el => el.innerHTML = icones.disco);
    document.querySelectorAll('.icone-database').forEach(el => el.innerHTML = icones.database);
  }
}
