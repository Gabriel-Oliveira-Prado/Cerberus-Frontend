import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';

export default class EstruturaController {
  async init() {
    this.container = document.getElementById('schema-explorer-container');
    this.refreshButton = document.getElementById('btn-atualizar-estrutura');
    this.exportButton = document.getElementById('btn-exportar-schema');
    this.relayoutButton = document.getElementById('btn-reorganizar-schema');
    this.fitButton = document.getElementById('btn-centralizar-schema');
    this.searchInput = document.getElementById('schema-search-input');
    this.viewButtons = [...document.querySelectorAll('[data-schema-view]')];
    this.activeView = 'map';

    this.refreshButton?.addEventListener('click', this.handleRefresh);
    this.exportButton?.addEventListener('click', this.exportSchema);
    this.relayoutButton?.addEventListener('click', this.relayoutGraph);
    this.fitButton?.addEventListener('click', this.fitGraph);
    this.searchInput?.addEventListener('input', this.handleSearch);
    this.viewButtons.forEach((button) => button.addEventListener('click', this.handleViewChange));
    window.addEventListener('resize', this.handleResize);

    await this.fetchSchemaAndRender();
  }

  setLoading() {
    if (!this.container) return;
    this.container.innerHTML = '<div class="loading-state"><span class="loading-indicator" aria-hidden="true"></span>Consultando o catálogo</div>';
  }

  async fetchSchemaAndRender() {
    if (!this.container) return false;
    this.setLoading();
    this.cy?.destroy();

    try {
      const response = await fetch(`${BASE_URL}/api/schema`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'A estrutura não pôde ser consultada.');
      }
      this.schemaData = data;
      await this.renderSchema(data);
      return true;
    } catch (error) {
      console.error('Falha ao consultar o esquema:', error);
      this.container.innerHTML = '<div class="error-state">Não foi possível consultar a estrutura do banco conectado.</div>';
      return false;
    }
  }

  async renderSchema(data) {
    this.container.replaceChildren();
    const objects = Array.isArray(data.tables) ? data.tables : [];
    const relationships = Array.isArray(data.relationships) ? data.relationships : [];
    this.objectsByName = new Map(objects.map((object) => [object.name, object]));

    const columnCount = objects.reduce((total, object) => total + (object.columns?.length || 0), 0);
    const primaryKeyCount = objects.reduce(
      (total, object) => total + (object.columns || []).filter((column) => column.pk).length,
      0
    );
    const indexCount = objects.reduce((total, object) => total + (object.indexes?.length || 0), 0);

    const summary = document.createElement('div');
    summary.className = 'schema-summary-grid';
    summary.append(
      this.createSummaryItem('Objetos', objects.length),
      this.createSummaryItem('Colunas', columnCount),
      this.createSummaryItem('Relações', relationships.length),
      this.createSummaryItem('Chaves primárias', primaryKeyCount),
      this.createSummaryItem('Índices', indexCount)
    );
    this.container.appendChild(summary);

    if (!objects.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhuma tabela ou view foi encontrada no banco conectado.';
      this.container.appendChild(empty);
      return;
    }

    this.mapView = document.createElement('div');
    this.mapView.className = 'schema-map-layout';
    this.mapView.dataset.schemaPanel = 'map';

    this.graphElement = document.createElement('div');
    this.graphElement.id = 'schema-graph';
    this.graphElement.setAttribute('role', 'img');
    this.graphElement.setAttribute('aria-label', `Mapa com ${objects.length} objetos e ${relationships.length} relacionamentos`);

    this.inspectorElement = document.createElement('aside');
    this.inspectorElement.className = 'schema-object-inspector';
    this.inspectorElement.setAttribute('aria-live', 'polite');
    this.mapView.append(this.graphElement, this.inspectorElement);

    this.catalogView = document.createElement('div');
    this.catalogView.className = 'schema-catalog d-none';
    this.catalogView.dataset.schemaPanel = 'catalog';
    this.renderCatalog(objects, relationships);

    this.container.append(this.mapView, this.catalogView);
    await this.createGraph(objects, relationships);
    this.renderObjectInspector(objects[0]);
    this.applyViewState();
  }

  createSummaryItem(label, value) {
    const item = document.createElement('div');
    item.className = 'schema-summary-item';
    const strong = document.createElement('strong');
    strong.textContent = String(value);
    const span = document.createElement('span');
    span.textContent = label;
    item.append(strong, span);
    return item;
  }

  async createGraph(objects, relationships) {
    if (!this.cytoscape) {
      this.cytoscape = (await import('cytoscape')).default;
    }
    const elements = [
      ...objects.map((object) => ({
        data: {
          id: object.name,
          label: object.name,
          kind: object.kind || 'table',
          columns: object.columns?.length || 0
        }
      })),
      ...relationships.map((relation, index) => ({
        data: {
          id: `relation-${index}`,
          source: relation.from_table,
          target: relation.to_table,
          label: relation.from_col || ''
        }
      })).filter((edge) => this.objectsByName.has(edge.data.source) && this.objectsByName.has(edge.data.target))
    ];

    this.cy = this.cytoscape({
      container: this.graphElement,
      elements,
      minZoom: 0.35,
      maxZoom: 2.2,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'rectangle',
            'width': 180,
            'height': 42,
            'padding': 16,
            'background-color': '#0f172a',
            'border-width': 1,
            'border-color': '#44536a',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': 12,
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': 170
          }
        },
        {
          selector: 'node[kind = "view"]',
          style: {
            'background-color': '#334155',
            'border-style': 'dashed'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#dc3545'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#8f9bad',
            'target-arrow-color': '#dc3545',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8
          }
        }
      ],
      layout: this.getLayoutOptions()
    });

    this.cy.on('tap', 'node', (event) => {
      this.renderObjectInspector(this.objectsByName.get(event.target.id()));
    });
  }

  getLayoutOptions() {
    return {
      name: 'cose',
      animate: false,
      fit: true,
      padding: 36,
      nodeRepulsion: 9000,
      idealEdgeLength: 120,
      nodeOverlap: 18,
      randomize: false
    };
  }

  renderObjectInspector(object) {
    if (!this.inspectorElement || !object) return;
    this.inspectorElement.replaceChildren();

    const kind = document.createElement('span');
    kind.className = 'schema-object-kind';
    kind.textContent = object.kind === 'view' ? 'View' : 'Tabela';
    const title = document.createElement('h4');
    title.textContent = object.name;
    const meta = document.createElement('p');
    meta.textContent = `${object.columns?.length || 0} colunas · ${object.indexes?.length || 0} índices`;
    this.inspectorElement.append(kind, title, meta);

    const list = document.createElement('dl');
    list.className = 'schema-column-list';
    (object.columns || []).forEach((column) => {
      const name = document.createElement('dt');
      name.textContent = column.name;
      const description = document.createElement('dd');
      const details = [column.type];
      if (column.pk) details.push('chave primária');
      if (column.nullable === false) details.push('obrigatória');
      description.textContent = details.join(' · ');
      list.append(name, description);
    });
    this.inspectorElement.appendChild(list);
  }

  renderCatalog(objects, relationships) {
    const list = document.createElement('div');
    list.className = 'schema-table-list';

    objects.forEach((object, index) => {
      const details = document.createElement('details');
      details.className = 'schema-table';
      details.dataset.searchValue = [
        object.name,
        ...(object.columns || []).map((column) => column.name)
      ].join(' ').toLowerCase();
      if (index === 0) details.open = true;

      const heading = document.createElement('summary');
      const name = document.createElement('span');
      name.textContent = object.name;
      const count = document.createElement('span');
      count.className = 'text-muted fw-normal';
      count.textContent = `${object.kind === 'view' ? 'view' : 'tabela'} · ${object.columns?.length || 0} colunas`;
      heading.append(name, count);

      const columnsWrap = document.createElement('div');
      columnsWrap.className = 'schema-columns table-responsive';
      const table = document.createElement('table');
      table.className = 'table table-sm';
      table.innerHTML = '<thead><tr><th>Coluna</th><th>Tipo</th><th>Regra</th><th>Padrão</th></tr></thead>';
      const body = document.createElement('tbody');
      (object.columns || []).forEach((column) => {
        const row = document.createElement('tr');
        row.append(
          this.createCell(column.name, 'Coluna'),
          this.createCell(column.type, 'Tipo'),
          this.createCell(column.pk ? 'Chave primária' : column.nullable === false ? 'Obrigatória' : 'Aceita nulo', 'Regra'),
          this.createCell(column.default || 'Sem padrão', 'Padrão')
        );
        body.appendChild(row);
      });
      table.appendChild(body);
      columnsWrap.appendChild(table);

      if (object.indexes?.length) {
        const indexes = document.createElement('p');
        indexes.className = 'schema-indexes';
        indexes.textContent = `Índices: ${object.indexes.map((indexItem) => `${indexItem.name} (${indexItem.columns.join(', ')})`).join('; ')}`;
        columnsWrap.appendChild(indexes);
      }

      details.append(heading, columnsWrap);
      list.appendChild(details);
    });
    this.catalogView.appendChild(list);

    const relationSection = document.createElement('section');
    relationSection.className = 'schema-relations-section';
    const title = document.createElement('h4');
    title.textContent = 'Relacionamentos';
    relationSection.appendChild(title);

    if (!relationships.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state border';
      empty.textContent = 'Nenhuma chave estrangeira foi encontrada.';
      relationSection.appendChild(empty);
    } else {
      relationships.forEach((relation) => {
        const item = document.createElement('div');
        item.className = 'schema-relation';
        const from = document.createElement('span');
        from.textContent = `${relation.from_table}.${relation.from_col || '?'}`;
        const label = document.createElement('span');
        label.className = 'text-muted';
        label.textContent = 'referencia';
        const to = document.createElement('span');
        to.className = 'text-end';
        to.textContent = `${relation.to_table}.${relation.to_col || '?'}`;
        item.append(from, label, to);
        relationSection.appendChild(item);
      });
    }
    this.catalogView.appendChild(relationSection);
  }

  createCell(value, label) {
    const cell = document.createElement('td');
    cell.dataset.label = label;
    cell.textContent = value ?? '';
    return cell;
  }

  handleViewChange = (event) => {
    this.activeView = event.currentTarget.dataset.schemaView;
    this.applyViewState();
  };

  applyViewState() {
    this.viewButtons.forEach((button) => {
      const active = button.dataset.schemaView === this.activeView;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    this.mapView?.classList.toggle('d-none', this.activeView !== 'map');
    this.catalogView?.classList.toggle('d-none', this.activeView !== 'catalog');
    if (this.activeView === 'map') requestAnimationFrame(() => this.fitGraph());
  }

  handleSearch = (event) => {
    const query = event.target.value.trim().toLowerCase();
    this.catalogView?.querySelectorAll('.schema-table').forEach((item) => {
      item.hidden = Boolean(query) && !item.dataset.searchValue.includes(query);
    });
    this.cy?.nodes().forEach((node) => {
      const object = this.objectsByName.get(node.id());
      const searchable = [
        object?.name,
        ...(object?.columns || []).map((column) => column.name)
      ].join(' ').toLowerCase();
      node.style('display', !query || searchable.includes(query) ? 'element' : 'none');
    });
    this.cy?.fit(this.cy.elements(':visible'), 36);
  };

  relayoutGraph = () => {
    this.cy?.layout(this.getLayoutOptions()).run();
  };

  fitGraph = () => {
    this.cy?.resize();
    this.cy?.fit(this.cy.elements(':visible'), 36);
  };

  handleResize = () => this.fitGraph();

  handleRefresh = async () => {
    const success = await this.fetchSchemaAndRender();
    if (success) {
      await Swal.fire({
        title: 'Estrutura atualizada',
        text: 'O catálogo foi consultado novamente.',
        icon: 'success',
        confirmButtonColor: '#dc3545',
        timer: 1400,
        showConfirmButton: false
      });
    }
  };

  exportSchema = async () => {
    if (!this.schemaData) return;
    const blob = new Blob([JSON.stringify(this.schemaData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cerberus-estrutura-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  destroy() {
    this.refreshButton?.removeEventListener('click', this.handleRefresh);
    this.exportButton?.removeEventListener('click', this.exportSchema);
    this.relayoutButton?.removeEventListener('click', this.relayoutGraph);
    this.fitButton?.removeEventListener('click', this.fitGraph);
    this.searchInput?.removeEventListener('input', this.handleSearch);
    this.viewButtons?.forEach((button) => button.removeEventListener('click', this.handleViewChange));
    window.removeEventListener('resize', this.handleResize);
    this.cy?.destroy();
  }
}
