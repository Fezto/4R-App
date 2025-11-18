<template>
  <section class="view-container reports-view">
    <header class="view-header">
      <div class="view-header__meta">
        <span class="view-kicker">Analítica avanzada</span>
        <h1 class="view-title">Reportes</h1>
        <p class="view-description">Explora la mezcla de operaciones, inventario y documentos para detectar oportunidades y riesgos.</p>
      </div>
      <div class="view-header__actions">
        <Button
          label="Refrescar"
          icon="pi pi-refresh"
          text
          :loading="isRefreshing"
          @click="refresh"
        />
      </div>
    </header>

    <div class="reports-metrics">
      <Card class="report-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="report-metric__header">
            <span class="report-metric__kicker">Ingresos totales</span>
            <Tag value="MXN" severity="info" />
          </div>
        </template>
        <template #content>
          <div class="report-metric__value">{{ formatCurrency(totalRevenue) }}</div>
          <p class="report-metric__hint">Ticket promedio {{ formatCurrency(averageTicket) }}</p>
        </template>
      </Card>

      <Card class="report-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="report-metric__header">
            <span class="report-metric__kicker">Movimiento operativo</span>
            <Tag :value="`${totalOperations} totales`" severity="secondary" />
          </div>
        </template>
        <template #content>
          <div class="report-metric__value">{{ formatNumber(totalOperations) }}</div>
          <div class="report-metric__chips">
            <Tag
              v-for="item in operationChips"
              :key="item.label"
              :severity="item.severity"
              :value="item.text"
              rounded
            />
          </div>
        </template>
      </Card>

      <Card class="report-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="report-metric__header">
            <span class="report-metric__kicker">Aprobaciones</span>
            <Tag :value="`${pendingApprovals} pendientes`" severity="warn" />
          </div>
        </template>
        <template #content>
          <div class="report-metric__value">{{ formatPercentage(approvalRate) }}</div>
          <p class="report-metric__hint">{{ approvedOperations }} aprobadas · {{ pendingApprovals }} en espera</p>
          <div class="report-progress">
            <div class="report-progress__fill" :style="{ width: formatPercentWidth(approvalRate) }"></div>
          </div>
        </template>
      </Card>

      <Card class="report-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="report-metric__header">
            <span class="report-metric__kicker">Inventario consolidado</span>
            <Tag :value="`${formatNumber(inventoryRows.length)} SKU`" severity="success" />
          </div>
        </template>
        <template #content>
          <div class="report-metric__value">{{ formatTonsFromKg(inventoryTotalKg) }} ton</div>
          <p class="report-metric__hint">Equivalente a {{ formatQuantity(inventoryTotalKg) }} kg</p>
        </template>
      </Card>
    </div>

    <div class="reports-columns">
      <div class="reports-main">
        <Card class="report-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="report-card__title">
              <span class="font-medium">Ingresos por tipo de operación</span>
              <small class="report-card__subtitle">Comparativa de volumen y valor generado por cada flujo</small>
            </div>
          </template>
          <template #content>
            <div v-if="!revenueMix.length" class="reports-empty">
              <i class="pi pi-chart-bar"></i>
              <p>No hay datos disponibles.</p>
            </div>
            <table v-else class="reports-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Operaciones</th>
                  <th>Participación</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in revenueMix" :key="row.key">
                  <td>
                    <div class="table-cell-primary">
                      <span>{{ row.label }}</span>
                      <small class="table-cell-secondary">{{ row.count }} operaciones</small>
                    </div>
                  </td>
                  <td>{{ formatNumber(row.count) }}</td>
                  <td>
                    <div class="reports-distribution">
                      <div class="reports-distribution__fill" :class="`is-${row.severity}`" :style="{ width: `${row.share}%` }"></div>
                    </div>
                    <small class="table-cell-secondary">{{ row.share }}%</small>
                  </td>
                  <td>{{ formatCurrency(row.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </Card>

        <Card class="report-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="report-card__title">
              <span class="font-medium">Top materiales por peso</span>
              <small class="report-card__subtitle">Los 8 SKU con mayor participación en inventario</small>
            </div>
          </template>
          <template #content>
            <div v-if="!inventoryTop.length" class="reports-empty">
              <i class="pi pi-database"></i>
              <p>No hay inventario registrado.</p>
            </div>
            <ul v-else class="reports-toplist">
              <li v-for="item in inventoryTop" :key="item.id" class="reports-toplist__item">
                <div class="reports-toplist__info">
                  <span class="reports-toplist__name">{{ item.name }}</span>
                  <small class="reports-toplist__meta">{{ item.unitLabel }} · {{ item.formattedOriginal }}</small>
                </div>
                <div class="reports-toplist__value">
                  <strong>{{ formatQuantity(item.weightKg) }} kg</strong>
                </div>
              </li>
            </ul>
          </template>
        </Card>
      </div>

      <div class="reports-side">
        <Card class="report-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="report-card__title">
              <span class="font-medium">Salud documental</span>
              <small class="report-card__subtitle">Tipos de archivo generados y uso reciente</small>
            </div>
          </template>
          <template #content>
            <div class="reports-docs">
              <div v-for="item in documentChips" :key="item.label" class="reports-docs__row">
                <div class="reports-docs__label">
                  <Tag :value="item.label" :severity="item.severity" rounded />
                  <span>{{ item.text }}</span>
                </div>
              </div>
            </div>
            <div class="reports-recents">
              <span class="reports-recents__title">Recientes</span>
              <ul class="reports-recents__list">
                <li v-for="doc in recentDocuments" :key="doc.id">
                  <span>{{ doc.fileName }}</span>
                  <small>{{ documentTypeMeta[doc.type]?.label ?? doc.type }}</small>
                </li>
              </ul>
            </div>
          </template>
        </Card>

        <Card class="report-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="report-card__title">
              <span class="font-medium">Red de proveedores</span>
              <small class="report-card__subtitle">Actividad por estatus y promedio de contacto</small>
            </div>
          </template>
          <template #content>
            <div class="reports-suppliers">
              <div class="reports-suppliers__stat">
                <span class="reports-suppliers__label">Activos</span>
                <strong>{{ formatNumber(activeSuppliers) }}</strong>
              </div>
              <div class="reports-suppliers__stat">
                <span class="reports-suppliers__label">Inactivos</span>
                <strong>{{ formatNumber(inactiveSuppliers) }}</strong>
              </div>
              <div class="reports-suppliers__stat">
                <span class="reports-suppliers__label">Último alta</span>
                <strong>{{ suppliersNewest }}</strong>
              </div>
            </div>
            <div class="reports-suppliers__footer">
              <span>{{ contactCoverage }}</span>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useListOperations } from '@/services/api/generated/operations/operations'
import { useListDocuments } from '@/services/api/generated/documents/documents'
import { useListSuppliers } from '@/services/api/generated/suppliers/suppliers'
import { useListInventories } from '@/services/api/generated/inventory/inventory'
import { OperationType } from '@/services/api/generated/schemas/operationType'
import { DocumentType } from '@/services/api/generated/schemas/documentType'

const toast = useToast()

const operationsQuery = useListOperations()
const documentsQuery = useListDocuments()
const suppliersQuery = useListSuppliers()
const inventoryQuery = useListInventories()

const operations = computed(() => operationsQuery.data.value?.data ?? [])
const documents = computed(() => documentsQuery.data.value?.data ?? [])
const suppliers = computed(() => suppliersQuery.data.value?.data ?? [])
const inventories = computed(() => inventoryQuery.data.value?.data ?? [])

const totalOperations = computed(() => operations.value.length)
const approvedOperations = computed(() => operations.value.filter(item => item.is_approved === true).length)
const pendingApprovals = computed(() => operations.value.filter(item => item.is_approved === false).length)
const approvalRate = computed(() => (totalOperations.value ? approvedOperations.value / totalOperations.value : 0))

const totalRevenue = computed(() => operations.value.reduce((acc, item) => acc + toNumber(item.subtotal), 0))
const averageTicket = computed(() => (totalOperations.value ? totalRevenue.value / totalOperations.value : 0))

const operationsByType = computed(() => {
  const base = {
    [OperationType.purchase]: { label: 'Compras', severity: 'info', count: 0, revenue: 0 },
    [OperationType.inbound]: { label: 'Entradas', severity: 'success', count: 0, revenue: 0 },
    [OperationType.outbound]: { label: 'Salidas', severity: 'warn', count: 0, revenue: 0 },
    [OperationType.other]: { label: 'Otros', severity: 'secondary', count: 0, revenue: 0 }
  }

  for (const op of operations.value) {
    const entry = base[op.operation_type] ?? base[OperationType.other]
    entry.count += 1
    entry.revenue += toNumber(op.subtotal)
  }

  return base
})

const operationChips = computed(() => [
  {
    label: 'Entradas',
    text: `${operationsByType.value[OperationType.inbound].count} entradas`,
    severity: 'success'
  },
  {
    label: 'Salidas',
    text: `${operationsByType.value[OperationType.outbound].count} salidas`,
    severity: 'warn'
  },
  {
    label: 'Compras',
    text: `${operationsByType.value[OperationType.purchase].count} compras`,
    severity: 'info'
  }
])

const revenueMix = computed(() => {
  const totalRevenueLocal = totalRevenue.value || 0
  return Object.entries(operationsByType.value)
    .map(([key, value]) => {
      const share = totalRevenueLocal ? Math.round((value.revenue / totalRevenueLocal) * 100) : 0
      return {
        key,
        ...value,
        share
      }
    })
    .filter(item => item.count > 0 || totalRevenueLocal === 0)
    .sort((a, b) => b.revenue - a.revenue)
})

const inventoryRows = computed(() =>
  inventories.value.map(item => {
    const weightKg = toKilograms(toNumber(item.weight), item.unit)
    return {
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      unit: item.unit,
      weightKg,
      formattedOriginal: formatOriginalWeight(item.weight, item.unit),
      unitLabel: unitLabel(item.unit)
    }
  })
)

const inventoryTotalKg = computed(() => inventoryRows.value.reduce((acc, item) => acc + item.weightKg, 0))
const inventoryTop = computed(() => [...inventoryRows.value].sort((a, b) => b.weightKg - a.weightKg).slice(0, 8))

const activeSuppliers = computed(() => suppliers.value.filter(item => item.status === 'active').length)
const inactiveSuppliers = computed(() => suppliers.value.filter(item => item.status === 'inactive').length)
const suppliersNewest = computed(() => {
  if (!suppliers.value.length) return '—'
  const numericIds = suppliers.value
    .map(item => Number(item.id))
    .filter(Number.isFinite)
  if (numericIds.length) return `#${Math.max(...numericIds)}`
  const lastSupplier = suppliers.value[suppliers.value.length - 1]
  return lastSupplier?.name ?? '—'
})
const suppliersWithContact = computed(() => suppliers.value.filter(item => item.email || item.phone).length)
const contactCoverage = computed(() => {
  if (!suppliers.value.length) return 'Sin proveedores registrados'
  const pct = Math.round((suppliersWithContact.value / suppliers.value.length) * 100)
  return `${pct}% con datos de contacto`
})

const documentsByType = computed(() => {
  const base = {
    [DocumentType.pdf]: 0,
    [DocumentType.png]: 0,
    [DocumentType.docx]: 0
  }
  for (const doc of documents.value) {
    if (base[doc.type] !== undefined) base[doc.type] += 1
  }
  return base
})

const documentChips = computed(() => [
  { label: 'PDF', text: `${documentsByType.value[DocumentType.pdf]} archivos`, severity: 'danger' },
  { label: 'PNG', text: `${documentsByType.value[DocumentType.png]} imágenes`, severity: 'info' },
  { label: 'DOCX', text: `${documentsByType.value[DocumentType.docx]} documentos`, severity: 'primary' }
])

const recentDocuments = computed(() =>
  [...documents.value]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)
    .map(doc => ({
      ...doc,
      fileName: extractFileName(doc.document_path ?? '')
    }))
)

const documentTypeMeta = {
  [DocumentType.pdf]: { label: 'PDF', severity: 'danger' },
  [DocumentType.png]: { label: 'PNG', severity: 'info' },
  [DocumentType.docx]: { label: 'DOCX', severity: 'primary' }
}

const isRefreshing = computed(
  () =>
    operationsQuery.isFetching.value ||
    documentsQuery.isFetching.value ||
    suppliersQuery.isFetching.value ||
    inventoryQuery.isFetching.value
)

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const numberFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0
})

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
})

const quantityFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const percentFormatter = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const tonFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4
})

function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

function formatCurrency(value) {
  return currencyFormatter.format(toNumber(value))
}

function formatQuantity(value) {
  return quantityFormatter.format(toNumber(value))
}

function formatPercentage(value) {
  return percentFormatter.format(value ?? 0)
}

function formatPercentWidth(value) {
  const pct = Math.round((value ?? 0) * 100)
  return `${pct}%`
}

function toKilograms(value, unit) {
  if (!Number.isFinite(value)) return 0
  if (unit === 'ton') return value * 1000
  return value
}

function unitLabel(unit) {
  const map = { ton: 'Toneladas', kg: 'Kilogramos' }
  return map[unit] ?? unit
}

function formatOriginalWeight(weight, unit) {
  const numericValue = toNumber(weight)
  const formatter = unit === 'ton' ? tonFormatter : quantityFormatter
  const suffix = unit === 'ton' ? 'ton' : 'kg'
  return `${formatter.format(numericValue)} ${suffix}`
}

function formatTonsFromKg(kgValue) {
  const numericValue = toNumber(kgValue) / 1000
  return tonFormatter.format(numericValue)
}

function extractFileName(path) {
  if (!path) return 'Sin archivo'
  const segments = path.split(/[\\/]/)
  const name = segments[segments.length - 1]
  return name || path
}

async function refresh() {
  try {
    await Promise.all([
      operationsQuery.refetch(),
      documentsQuery.refetch(),
      suppliersQuery.refetch(),
      inventoryQuery.refetch()
    ])
    toast.add({ severity: 'info', summary: 'Reportes actualizados', detail: 'Datos sincronizados', life: 2200 })
  } catch (err) {
    toast.add({ severity: 'warn', summary: 'Actualización incompleta', detail: getErrorMessage(err), life: 4000 })
  }
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err?.data?.detail) return Array.isArray(err.data.detail) ? err.data.detail.join(' • ') : err.data.detail
  return 'Ocurrió un error inesperado'
}

watch(
  () => operationsQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar operaciones', detail: getErrorMessage(err), life: 4500 })
  }
)

watch(
  () => documentsQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar documentos', detail: getErrorMessage(err), life: 4500 })
  }
)

watch(
  () => suppliersQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar proveedores', detail: getErrorMessage(err), life: 4500 })
  }
)

watch(
  () => inventoryQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar inventario', detail: getErrorMessage(err), life: 4500 })
  }
)
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.view-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.view-header__meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.view-header__actions {
  display: flex;
  justify-content: flex-end;
}

.view-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.8);
}

.view-title {
  margin: 0;
}

.view-description {
  margin: 0;
}

.reports-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.report-metric {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-metric__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.report-metric__kicker {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.9);
}

.report-metric__value {
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.report-metric__hint {
  margin: 0;
  color: rgba(148, 163, 184, 0.8);
}

.report-metric__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.report-progress {
  width: 100%;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  overflow: hidden;
}

.report-progress__fill {
  height: 100%;
  background: rgba(34, 197, 94, 0.85);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.reports-columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.5rem;
}

.reports-main,
.reports-side {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.report-card__title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.report-card__subtitle {
  color: rgba(148, 163, 184, 0.8);
}

.reports-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(148, 163, 184, 0.75);
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.reports-table th,
.reports-table td {
  padding: 0.6rem 0.45rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.reports-table th {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.75);
}

.reports-distribution {
  width: 100%;
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.reports-distribution__fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.reports-distribution__fill.is-success { background: rgba(34, 197, 94, 0.85); }
.reports-distribution__fill.is-warn { background: rgba(250, 204, 21, 0.85); }
.reports-distribution__fill.is-info { background: rgba(59, 130, 246, 0.85); }
.reports-distribution__fill.is-secondary { background: rgba(148, 163, 184, 0.75); }

.reports-toplist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reports-toplist__item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.reports-toplist__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.reports-toplist__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reports-toplist__name {
  font-weight: 500;
}

.reports-toplist__meta {
  color: rgba(148, 163, 184, 0.75);
}

.reports-toplist__value {
  display: flex;
  align-items: center;
}

.reports-docs {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reports-docs__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.reports-docs__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reports-recents {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reports-recents__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(148, 163, 184, 0.85);
}

.reports-recents__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.reports-recents__list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.reports-recents__list small {
  color: rgba(148, 163, 184, 0.7);
}

.reports-suppliers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.reports-suppliers__stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reports-suppliers__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(148, 163, 184, 0.75);
}

.reports-suppliers__footer {
  font-size: 0.85rem;
  color: rgba(148, 163, 184, 0.75);
}

.table-cell-primary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.table-cell-secondary {
  color: rgba(148, 163, 184, 0.75);
  font-size: 0.75rem;
}

@media (max-width: 1024px) {
  .reports-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .view-header {
    gap: 1.5rem;
  }

  .view-header__actions {
    justify-content: flex-start;
  }
}
</style>
