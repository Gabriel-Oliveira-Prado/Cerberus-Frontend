import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { BASE_URL } from "../config/api.js";
import { icones } from "../js/utils.js";

export default class BackupsController {
  async init() {
    this.injectIcons();
    this.connectSocket();
    this.bindEvents();
    await this.loadBackups();
    this.renderIntegrityStatus();
  }

  injectIcons() {
    document
      .querySelectorAll(".icone-pontos")
      .forEach((el) => (el.innerHTML = icones.pontos));
  }

  // ─── Histórico de Backups ──────────────────────────────────────────────────

  async loadBackups() {
    try {
      const response = await fetch(`${BASE_URL}/api/backups`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      const tbody = document.getElementById("backups-table-body");
      if (!tbody) return;

      tbody.innerHTML = "";

      if (!data.success || data.backups.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum backup realizado ainda. Use o botão "Novo Backup" para gerar um.</td></tr>`;
        return;
      }

      data.backups.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td data-label="Data / Hora">${item.date}</td>
          <td data-label="Arquivo" class="fw-bold text-success font-monospace" style="font-size:0.85rem">${item.filename}</td>
          <td data-label="Tamanho">${item.size}</td>
          <td data-label="Retenção"><span class="badge bg-secondary-subtle text-secondary px-2 py-1 border border-secondary">${item.retention}</span></td>
          <td data-label="Ações" class="text-end">
            <button class="btn btn-link btn-sm text-primary text-decoration-none p-0 fw-semibold btn-restaurar-backup me-2" data-filename="${item.filename}">Restaurar</button>
            <button class="btn btn-link btn-sm text-danger text-decoration-none p-0 fw-semibold btn-excluir-backup" data-filename="${item.filename}">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      this.bindRestoreEvents();
      this.bindDeleteEvents();
    } catch (err) {
      console.error("Erro ao buscar backups:", err);
    }
  }

  bindRestoreEvents() {
    document.querySelectorAll(".btn-restaurar-backup").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filename = e.currentTarget.getAttribute("data-filename");
        Swal.fire({
          title: "Confirmar Restauração?",
          html: `Deseja restaurar o banco a partir de <code>${filename}</code>?<br><span class="text-danger small">Esta operação é irreversível.</span>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Sim, Restaurar",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (!result.isConfirmed) return;
          Swal.fire({
            title: "Restaurando...",
            text: "Aguarde...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          fetch(`${BASE_URL}/api/restaurar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ filename }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                Swal.fire({
                  title: "Restaurado!",
                  text: `Snapshot '${filename}' restaurado com sucesso.`,
                  icon: "success",
                  confirmButtonColor: "#dc3545",
                });
              } else {
                Swal.fire({
                  title: "Erro!",
                  text: `Falha: ${data.message}`,
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            })
            .catch((err) =>
              Swal.fire({
                title: "Erro de conexão",
                text: err.message,
                icon: "error",
                confirmButtonColor: "#dc3545",
              }),
            );
        });
      });
    });
  }

  bindDeleteEvents() {
    document.querySelectorAll(".btn-excluir-backup").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filename = e.currentTarget.getAttribute("data-filename");
        Swal.fire({
          title: "Excluir backup?",
          html: `O arquivo <code>${filename}</code> será removido permanentemente.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Sim, Excluir",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (!result.isConfirmed) return;
          fetch(`${BASE_URL}/api/backups/excluir`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ filename }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                Swal.fire({
                  title: "Excluído!",
                  text: "Backup removido.",
                  icon: "success",
                  confirmButtonColor: "#dc3545",
                });
                this.loadBackups();
              } else {
                Swal.fire({
                  title: "Erro!",
                  text: data.message,
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            })
            .catch((err) =>
              Swal.fire({
                title: "Erro de conexão",
                text: err.message,
                icon: "error",
                confirmButtonColor: "#dc3545",
              }),
            );
        });
      });
    });
  }

  // ─── Status de Integridade ─────────────────────────────────────────────────

  renderIntegrityStatus() {
    const dbName = sessionStorage.getItem("db_name") || "cerberus.db (Local)";
    const tbody = document.getElementById("integrity-tbody");
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td data-label="Alvo" class="fw-bold">${dbName}</td>
        <td data-label="Status"><span class="badge bg-success-subtle text-success px-2 py-1" id="integrity-badge">Saudável</span></td>
        <td data-label="Última Checagem" id="integrity-last-check">Aguardando checagem...</td>
        <td data-label="Checksum"><code class="small text-secondary" id="integrity-checksum">—</code></td>
        <td data-label="Ações" class="text-end">
          <button class="btn btn-link btn-sm text-danger text-decoration-none p-0 btn-inspecionar">Inspecionar</button>
        </td>
      </tr>
    `;
    this.bindIntegrityEvents();
  }

  updateIntegrityRow(result) {
    const badge = document.getElementById("integrity-badge");
    const lastCheck = document.getElementById("integrity-last-check");
    const checksum = document.getElementById("integrity-checksum");

    const now = new Date().toLocaleTimeString();

    if (badge) {
      badge.textContent = result.status;
      badge.className = result.ok
        ? "badge bg-success-subtle text-success px-2 py-1"
        : "badge bg-danger-subtle text-danger px-2 py-1";
    }
    if (lastCheck)
      lastCheck.innerHTML = `há poucos segundos <span class="text-muted small">(${now})</span>`;
    if (checksum) checksum.textContent = result.checksum || "—";

    this._lastIntegrityResult = result;
  }

  bindIntegrityEvents() {
    document.querySelectorAll(".btn-inspecionar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = this._lastIntegrityResult;
        const dbName =
          sessionStorage.getItem("db_name") || "cerberus.db (Local)";
        const status = r ? r.status : "Aguardando verificação";
        const checksum = r ? r.checksum || "—" : "—";
        const tables = r
          ? r.tables_count !== undefined
            ? r.tables_count
            : "—"
          : "—";
        const size = r ? r.db_size || "—" : "—";
        Swal.fire({
          title: "Detalhes da Integridade",
          html: `
            <div class="text-start font-monospace bg-light p-3 rounded border small">
              <div><strong>Alvo:</strong> ${dbName}</div>
              <div><strong>Status:</strong> ${status}</div>
              <div><strong>Checksum MD5:</strong> ${checksum}</div>
              <div><strong>Tabelas:</strong> ${tables}</div>
              <div><strong>Tamanho:</strong> ${size}</div>
              <div><strong>Criptografia:</strong> AES-256</div>
            </div>`,
          icon: "info",
          confirmButtonColor: "#dc3545",
        });
      });
    });
  }

  // ─── "Executar Verificação" — só checa, não gera backup ───────────────────

  async runVerification() {
    const btn =
      document.getElementById("btn-verificar") ||
      document.getElementById("btn-verificar-mobile");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Verificando...";
    }

    try {
      const response = await fetch(`${BASE_URL}/api/verificar`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      this.updateIntegrityRow({
        ok: data.success,
        status: data.success ? "Saudável" : "Falha",
        checksum: data.checksum,
        tables_count: data.tables_count,
        db_size: data.db_size,
      });

      Swal.fire({
        title: data.success ? "Verificação concluída!" : "Atenção",
        text: data.message,
        icon: data.success ? "success" : "warning",
        confirmButtonColor: "#dc3545",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível conectar ao servidor.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Executar Verificação";
      }
    }
  }

  // ─── Menus de 3 pontinhos ─────────────────────────────────────────────────

  bindMenuEvents() {
    // --- Cartão de Integridade ---
    document
      .getElementById("menu-exportar-log")
      ?.addEventListener("click", () => {
        this._exportLog();
      });

    document
      .getElementById("menu-detalhes-integridade")
      ?.addEventListener("click", () => {
        document.querySelector(".btn-inspecionar")?.click();
      });

    // --- Cartão de Histórico ---
    document
      .getElementById("menu-exportar-csv")
      ?.addEventListener("click", () => {
        this._exportCSV();
      });

    document
      .getElementById("menu-novo-backup")
      ?.addEventListener("click", () => {
        this._triggerBackup();
      });

    // --- Cartão de Log ---
    document
      .getElementById("menu-limpar-log")
      ?.addEventListener("click", () => {
        const container = document.getElementById("backups-log-container");
        if (container) {
          container.innerHTML = `<div class="text-muted">Log limpo manualmente.</div>`;
        }
      });

    document
      .getElementById("menu-copiar-log")
      ?.addEventListener("click", () => {
        const container = document.getElementById("backups-log-container");
        if (container) {
          navigator.clipboard.writeText(container.innerText).then(() => {
            Swal.fire({
              title: "Copiado!",
              text: "Log copiado para a área de transferência.",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
          });
        }
      });
  }

  _exportLog() {
    const container = document.getElementById("backups-log-container");
    const text = container ? container.innerText : "Sem dados";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cerberus-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _exportCSV() {
    const tbody = document.getElementById("backups-table-body");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    let csv = "Data/Hora,Arquivo,Tamanho,Retenção\n";
    rows.forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length >= 4) {
        const row = [
          cells[0].textContent,
          cells[1].textContent,
          cells[2].textContent,
          cells[3].textContent,
        ]
          .map((v) => `"${v.trim().replace(/"/g, '""')}"`)
          .join(",");
        csv += row + "\n";
      }
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cerberus-backups-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _triggerBackup() {
    Swal.fire({
      title: "Executando Backup...",
      html: 'Progresso: <b>0%</b>.<br><div class="progress mt-3" style="height:10px;"><div id="swal-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" style="width:0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        this.socket.emit("trigger_backup", {});
      },
    });
  }

  // ─── WebSocket ─────────────────────────────────────────────────────────────

  connectSocket() {
    this.socket = io(BASE_URL, {
      withCredentials: true,
      transports: ["polling"],
    });

    this.socket.on("connect", () => console.log("Backups socket connected"));

    this.socket.on("backup_progress", (data) => {
      if (!Swal.isVisible()) return;
      const container = Swal.getHtmlContainer();
      if (!container) return;
      const progressText = container.querySelector("b");
      const progressBar = container.querySelector("#swal-progress-bar");
      if (progressText) progressText.textContent = `${data.progress}%`;
      if (progressBar) {
        progressBar.style.width = `${data.progress}%`;
        progressBar.setAttribute("aria-valuenow", data.progress);
      }
    });

    this.socket.on("backup_completed", (data) => {
      Swal.fire({
        title: "Backup Concluído!",
        text: `Arquivo '${data.filename}' gerado com sucesso.`,
        icon: "success",
        confirmButtonColor: "#dc3545",
      });
      this.loadBackups();
    });

    this.socket.on("metrics_update", (data) => {
      // Atualiza timestamp da integridade em tempo real
      const lastCheck = document.getElementById("integrity-last-check");
      if (lastCheck && this._lastIntegrityResult) {
        const now = new Date().toLocaleTimeString();
        lastCheck.innerHTML = `há poucos segundos <span class="text-muted small">(${now})</span>`;
      }

      // Atualiza Log de Eventos
      const logContainer = document.getElementById("backups-log-container");
      if (logContainer && data.event_history && data.event_history.length > 0) {
        logContainer.innerHTML = "";
        [...data.event_history].reverse().forEach((ev) => {
          const div = document.createElement("div");
          let textClass = "text-muted";
          if (ev.message.startsWith("SUCESSO:")) textClass = "text-success";
          else if (ev.message.startsWith("AVISO:")) textClass = "text-warning";
          else if (ev.message.startsWith("ERRO:")) textClass = "text-danger";
          else if (ev.message.startsWith("INFO:")) textClass = "text-info";
          const colonIdx = ev.message.indexOf(":");
          const level = ev.message.substring(0, colonIdx);
          const content = ev.message.substring(colonIdx + 1).trim();
          div.innerHTML = `<span class="text-secondary fw-semibold">[${ev.time}]</span> <span class="${textClass} fw-bold">${level}:</span> ${content}`;
          logContainer.appendChild(div);
        });
      }
    });
  }

  // ─── Bind principal ────────────────────────────────────────────────────────

  bindEvents() {
    document
      .getElementById("btn-verificar")
      ?.addEventListener("click", () => this.runVerification());
    document
      .getElementById("btn-verificar-mobile")
      ?.addEventListener("click", () => this.runVerification());
    this.bindMenuEvents();
  }

  destroy() {
    if (this.socket) this.socket.disconnect();
  }
}
