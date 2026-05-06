export default function ReportFiltersPanel({
  categories,
  paymentMethods,
  draftFilters,
  appliedFilters,
  loading,
  exporting,
  onChange,
  onApply,
  onReset,
  onExport
}) {
  return (
    <aside className="report-sidebar">
      <div className="report-sidebar__sticky">
        <section className="report-filter-panel">
          <div className="report-filter-panel__header">
            <span className="report-filter-panel__eyebrow">Control</span>
            <h2>Filtros del reporte</h2>
            <p>Ajusta el periodo y el foco del analisis sin salir del tablero.</p>
          </div>

          <form className="module-form" onSubmit={onApply}>
            <div className="inline-grid">
              <div>
                <label htmlFor="report-from">Desde</label>
                <input
                  id="report-from"
                  type="date"
                  value={draftFilters.from}
                  onChange={(event) => onChange('from', event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="report-to">Hasta</label>
                <input
                  id="report-to"
                  type="date"
                  value={draftFilters.to}
                  onChange={(event) => onChange('to', event.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="report-category">Categoria</label>
              <select
                id="report-category"
                value={draftFilters.categoryId}
                onChange={(event) => onChange('categoryId', event.target.value)}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre} ({category.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-payment-method">Metodo de pago</label>
              <select
                id="report-payment-method"
                value={draftFilters.paymentMethodId}
                onChange={(event) => onChange('paymentMethodId', event.target.value)}
              >
                <option value="">Todos</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod.id} value={paymentMethod.id}>
                    {paymentMethod.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-type">Tipo de transaccion</label>
              <select
                id="report-type"
                value={draftFilters.transactionType}
                onChange={(event) => onChange('transactionType', event.target.value)}
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="gasto">Gastos</option>
              </select>
            </div>

            <div className="module-actions report-filter-panel__actions">
              <button className="button-primary" type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Aplicar filtros'}
              </button>
              <button className="button-secondary" type="button" onClick={onReset}>
                Limpiar
              </button>
            </div>
          </form>

          <div className="report-filter-summary">
            <strong>Rango activo</strong>
            <span>
              {appliedFilters.from} a {appliedFilters.to}
            </span>
          </div>

          <div className="report-filter-export">
            <div className="report-filter-export__copy">
              <strong>Exportar reporte</strong>
              <span>Descarga el resultado filtrado en PDF o Excel.</span>
            </div>

            <div className="module-actions report-filter-export__actions">
              <button
                className="button-secondary"
                type="button"
                onClick={() => onExport('xlsx')}
                disabled={exporting === 'xlsx'}
              >
                {exporting === 'xlsx' ? 'Exportando Excel...' : 'Exportar Excel'}
              </button>
              <button
                className="button-primary"
                type="button"
                onClick={() => onExport('pdf')}
                disabled={exporting === 'pdf'}
              >
                {exporting === 'pdf' ? 'Exportando PDF...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          <div className="report-filter-chips">
            {appliedFilters.categoryId ? <span>Categoria filtrada</span> : <span>Todas las categorias</span>}
            {appliedFilters.paymentMethodId ? <span>Metodo filtrado</span> : <span>Todos los metodos</span>}
            {appliedFilters.transactionType ? (
              <span>Tipo: {appliedFilters.transactionType}</span>
            ) : (
              <span>Todos los tipos</span>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
