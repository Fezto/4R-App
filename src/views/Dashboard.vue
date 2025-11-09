<template>
  <section class="view-container">
    <header class="view-header">
      <div class="view-header__meta">
        <span class="view-kicker">Resumen ejecutivo</span>
        <h1 class="view-title">Dashboard</h1>
        <p class="view-description">Una mirada rápida al pulso de tus operaciones, documentos y socios comerciales.</p>
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

    <div class="dashboard-metrics">
      <Card class="dashboard-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="dashboard-metric__header">
            <span class="dashboard-metric__kicker">Proveedores</span>
            <Tag value="Activos" severity="success" />
          </div>
        </template>
        <template #content>
          <div class="dashboard-metric__value">{{ formatNumber(activeSuppliers) }}</div>
          <p class="dashboard-metric__hint">{{ totalSuppliers }} en total · {{ inactiveSuppliers }} inactivos</p>
          <div class="dashboard-metric__actions">
            <RouterLink to="/suppliers">
              <Button label="Gestionar" icon="pi pi-users" size="small" outlined />
            </RouterLink>
          </div>
        </template>
      </Card>

      <Card class="dashboard-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="dashboard-metric__header">
            <span class="dashboard-metric__kicker">Operaciones</span>
            <Tag :value="`${pendingApprovals} pendientes`" severity="warning" />
          </div>
        </template>
        <template #content>
          <div class="dashboard-metric__value">{{ formatNumber(totalOperations) }}</div>
          <div class="dashboard-metric__chips">
            <Tag v-for="item in operationChips" :key="item.label" :severity="item.severity" :value="item.text" rounded />
          </div>
          <div class="dashboard-metric__actions">
            <RouterLink to="/warehouse">
              <Button label="Registrar movimiento" icon="pi pi-plus-circle" size="small" outlined />
            </RouterLink>
          </div>
        </template>
      </Card>

      <Card class="dashboard-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="dashboard-metric__header">
            <span class="dashboard-metric__kicker">Ingresos estimados</span>
            <Tag value="MXN" severity="info" />
          </div>
        </template>
        <template #content>
          <div class="dashboard-metric__value">{{ formatCurrency(totalRevenue) }}</div>
          <p class="dashboard-metric__hint">Promedio {{ formatCurrency(averageTicket) }} por operación</p>
          <div class="dashboard-metric__actions">
            <RouterLink to="/invoices">
              <Button label="Ver facturas" icon="pi pi-file" size="small" outlined />
            </RouterLink>
          </div>
        </template>
      </Card>

      <Card class="dashboard-metric glass-panel border border-white/10 shadow-none">
        <template #title>
          <div class="dashboard-metric__header">
            <span class="dashboard-metric__kicker">Documentos</span>
            <Tag :value="`${recentDocuments.length} recientes`" severity="secondary" />
          </div>
        </template>
        <template #content>
          <div class="dashboard-metric__value">{{ formatNumber(totalDocuments) }}</div>
          <div class="dashboard-metric__chips">
            <Tag v-for="item in documentChips" :key="item.label" :severity="item.severity" :value="item.text" rounded />
          </div>
          <div class="dashboard-metric__actions">
            <RouterLink to="/documents">
              <Button label="Administrar" icon="pi pi-folder" size="small" outlined />
            </RouterLink>
          </div>
        </template>
      </Card>
    </div>

    <div class="dashboard-columns">
      <div class="dashboard-main">
        <Card class="dashboard-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="dashboard-card__title">
              <span class="font-medium">Últimas operaciones</span>
              <small class="dashboard-card__subtitle">Movimientos recientes registrados en el sistema</small>
            </div>
          </template>
          <template #content>
            <div v-if="!recentOperations.length" class="dashboard-empty">
              <i class="pi pi-box"></i>
              <p>No hay operaciones registradas todavía.</p>
            </div>
            <table v-else class="dashboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in recentOperations" :key="item.id">
                  <td>{{ item.id }}</td>
                  <td>
                    <div class="table-cell-primary">
                      <span>{{ item.product_name }}</span>
                      <small v-if="item.notes" class="table-cell-secondary">{{ item.notes }}</small>
                    </div>
                  </td>
                  <td>
                    <Tag :value="operationMeta[item.operation_type]?.label ?? item.operation_type" :severity="operationMeta[item.operation_type]?.severity ?? 'secondary'" />
                  </td>
                  <td>{{ formatQuantity(item.quantity) }}</td>
                  <td>{{ formatCurrency(toNumber(item.subtotal)) }}</td>
                  <td>
                    <Tag
                      v-if="item.is_approved === true"
                      value="Aprobada"
                      severity="success"
                    />
                    <Tag
                      v-else-if="item.is_approved === false"
                      value="Pendiente"
                      severity="warning"
                    />
                    <Tag
                      v-else
                      value="Sin estatus"
                      severity="secondary"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </Card>

        <Card class="dashboard-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="dashboard-card__title">
              <span class="font-medium">Inventario en piso</span>
              <small class="dashboard-card__subtitle">Resumen de peso consolidado por material</small>
            </div>
          </template>
          <template #content>
            <div v-if="inventoryRows.length" class="inventory-summary">
              <div class="inventory-summary__metric">
                <span class="inventory-summary__kicker">Inventario total</span>
                <div class="inventory-summary__value">{{ formatTonsFromKg(inventoryTotalKg) }} ton</div>
                <small class="inventory-summary__hint">Equivalente a {{ formatQuantity(inventoryTotalKg) }} kg</small>
              </div>
              <div class="inventory-summary__meta">
                <span>Materiales monitoreados</span>
                <div class="inventory-summary__count">{{ formatNumber(inventoryRows.length) }}</div>
              </div>
            </div>
            <div v-if="inventoryTop.length" class="inventory-top">
              <div class="inventory-top__header">
                <span class="font-medium">Top 5 por peso</span>
                <small>Ordenado por toneladas equivalentes</small>
              </div>
              <ul class="inventory-top__list">
                <li v-for="item in inventoryTop" :key="item.id" class="inventory-top__item">
                  <div class="inventory-top__info">
                    <span class="inventory-top__name">{{ item.name }}</span>
                    <small class="inventory-top__meta">{{ item.unitLabel }} · {{ item.formattedOriginal }}</small>
                  </div>
                  <div class="inventory-top__measure">
                    <strong>{{ formatQuantity(item.weightKg) }} kg</strong>
                  </div>
                </li>
              </ul>
            </div>
            <div v-else class="dashboard-empty">
              <i class="pi pi-database"></i>
              <p>No hay datos de inventario disponibles.</p>
            </div>
          </template>
        </Card>
      </div>

      <div class="dashboard-side">
        <Card class="dashboard-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="dashboard-card__title">
              <span class="font-medium">Mix de operaciones</span>
              <small class="dashboard-card__subtitle">Participación por tipo en el periodo actual</small>
            </div>
          </template>
          <template #content>
            <div v-if="operationsDistribution.length" class="distribution-list">
              <div v-for="item in operationsDistribution" :key="item.label" class="distribution-row">
                <div class="distribution-row__header">
                  <span>{{ item.label }}</span>
                  <span class="distribution-row__value">{{ formatNumber(item.count) }}</span>
                </div>
                <div class="distribution-row__bar">
                  <div class="distribution-row__bar-fill" :class="`is-${item.severity}`" :style="{ width: `${item.percent}%` }"></div>
                </div>
                <small class="distribution-row__percent">{{ item.percent }}%</small>
              </div>
            </div>
            <div v-else class="dashboard-empty">
              <i class="pi pi-chart-bar"></i>
              <p>No hay movimientos registrados.</p>
            </div>
          </template>
        </Card>

        <Card class="dashboard-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="dashboard-card__title">
              <span class="font-medium">Documentos recientes</span>
              <small class="dashboard-card__subtitle">Últimos archivos generados por tus movimientos</small>
            </div>
          </template>
          <template #content>
            <div v-if="!recentDocuments.length" class="dashboard-empty">
              <i class="pi pi-file"></i>
              <p>No se han generado documentos.</p>
            </div>
            <ul v-else class="dashboard-list">
              <li v-for="doc in recentDocuments" :key="doc.id" class="dashboard-list__item">
                <div class="dashboard-list__info">
                  <span class="dashboard-list__title">{{ doc.fileName }}</span>
                  <small class="dashboard-list__subtitle">
                    {{ documentTypeMeta[doc.type]?.label ?? doc.type }} · Operación {{ doc.operation_id ?? '—' }}
                  </small>
                </div>
                <Tag :value="documentTypeMeta[doc.type]?.label ?? doc.type" :severity="documentTypeMeta[doc.type]?.severity ?? 'secondary'" />
              </li>
            </ul>
          </template>
        </Card>

        <Card class="dashboard-card glass-panel border border-white/10 shadow-none">
          <template #title>
            <div class="dashboard-card__title">
              <span class="font-medium">Acciones rápidas</span>
              <small class="dashboard-card__subtitle">Atajos frecuentes para mantener la operación corriendo</small>
            </div>
          </template>
          <template #content>
            <div class="dashboard-actions">
              <RouterLink to="/warehouse"><Button label="Registrar entrada" icon="pi pi-download" text /></RouterLink>
              <RouterLink to="/warehouse"><Button label="Registrar salida" icon="pi pi-upload" text /></RouterLink>
              <RouterLink to="/documents"><Button label="Ver documentos" icon="pi pi-folder" text /></RouterLink>
              <RouterLink to="/suppliers"><Button label="Nuevo proveedor" icon="pi pi-user-plus" text /></RouterLink>
              <RouterLink to="/reports"><Button label="Reportes" icon="pi pi-chart-line" text /></RouterLink>
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
const activeSuppliers = computed(() => suppliers.value.filter(item => item.status === 'active').length)
const inactiveSuppliers = computed(() => suppliers.value.filter(item => item.status === 'inactive').length)
const totalSuppliers = computed(() => suppliers.value.length)
const pendingApprovals = computed(() => operations.value.filter(item => item.is_approved === false).length)
const approvedOperations = computed(() => operations.value.filter(item => item.is_approved === true).length)

const totalRevenue = computed(() => operations.value.reduce((acc, item) => acc + toNumber(item.subtotal), 0))
const averageTicket = computed(() => (totalOperations.value ? totalRevenue.value / totalOperations.value : 0))

const totalDocuments = computed(() => documents.value.length)
const inventoryRows = computed(() => inventories.value.map(item => {
  const weightKg = toKilograms(toNumber(item.weight), item.unit)
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    description: item.description ?? '',
    weight: toNumber(item.weight),
    weightKg,
    formattedOriginal: formatOriginalWeight(item.weight, item.unit),
    unitLabel: unitLabel(item.unit)
  }
}))
const inventoryTotalKg = computed(() => inventoryRows.value.reduce((acc, item) => acc + item.weightKg, 0))
const inventoryTop = computed(() => [...inventoryRows.value].sort((a, b) => b.weightKg - a.weightKg).slice(0, 5))

const operationMeta = {
  [OperationType.purchase]: { label: 'Compra', severity: 'info' },
  [OperationType.inbound]: { label: 'Entrada', severity: 'success' },
  [OperationType.outbound]: { label: 'Salida', severity: 'warn' },
  [OperationType.other]: { label: 'Otro', severity: 'secondary' }
}

const documentTypeMeta = {
  [DocumentType.pdf]: { label: 'PDF', severity: 'danger' },
  [DocumentType.png]: { label: 'PNG', severity: 'info' },
  [DocumentType.docx]: { label: 'DOCX', severity: 'primary' }
}

const operationsByType = computed(() => {
  const base = {
    [OperationType.purchase]: 0,
    [OperationType.inbound]: 0,
    [OperationType.outbound]: 0,
    [OperationType.other]: 0
  }
  for (const op of operations.value) {
    if (base[op.operation_type] !== undefined) base[op.operation_type] += 1
    else base[OperationType.other] += 1
  }
  return base
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

const operationChips = computed(() => [
  {
    label: 'Entradas',
    text: `${operationsByType.value[OperationType.inbound]} entradas`,
    severity: 'success'
  },
  {
    label: 'Salidas',
    text: `${operationsByType.value[OperationType.outbound]} salidas`,
    severity: 'warn'
  },
  {
    label: 'Compras',
    text: `${operationsByType.value[OperationType.purchase]} compras`,
    severity: 'info'
  }
])

const operationsDistribution = computed(() => {
  const total = totalOperations.value || 0
  const base = [
    { key: OperationType.inbound, label: 'Entradas', severity: 'success' },
    { key: OperationType.outbound, label: 'Salidas', severity: 'warn' },
    { key: OperationType.purchase, label: 'Compras', severity: 'info' },
    { key: OperationType.other, label: 'Otros', severity: 'secondary' }
  ]

  return base
    .map(item => {
      const count = operationsByType.value[item.key] ?? 0
      const percent = total ? Math.round((count / total) * 100) : 0
      return { ...item, count, percent }
    })
    .filter(item => item.count > 0 || total === 0)
})

const documentChips = computed(() => [
  {
    label: 'PDF',
    text: `${documentsByType.value[DocumentType.pdf]} PDF`,
    severity: 'danger'
  },
  {
    label: 'PNG',
    text: `${documentsByType.value[DocumentType.png]} PNG`,
    severity: 'info'
  },
  {
    label: 'DOCX',
    text: `${documentsByType.value[DocumentType.docx]} DOCX`,
    severity: 'primary'
  }
])

const recentOperations = computed(() =>
  [...operations.value]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6)
)

const recentDocuments = computed(() =>
  [...documents.value]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6)
    .map(doc => ({
      ...doc,
      fileName: extractFileName(doc.document_path ?? '')
    }))
)

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

const quantityFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
})

const tonFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4
})

function formatNumber(value) {
  return numberFormatter.format(value ?? 0)
}

function formatQuantity(value) {
  return quantityFormatter.format(toNumber(value))
}

function formatCurrency(value) {
  return currencyFormatter.format(toNumber(value))
}

function formatTonsFromKg(kgValue) {
  const numericValue = toNumber(kgValue) / 1000
  return tonFormatter.format(numericValue)
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
    toast.add({ severity: 'info', summary: 'Dashboard actualizado', detail: 'Datos sincronizados', life: 2000 })
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

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.dashboard-metric {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dashboard-metric__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-metric__kicker {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.9);
}

.dashboard-metric__value {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.dashboard-metric__hint {
  margin: 0;
  color: rgba(148, 163, 184, 0.8);
}

.dashboard-metric__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dashboard-metric__actions {
  display: flex;
  justify-content: flex-start;
}

.dashboard-columns {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-card__title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-card__subtitle {
  color: rgba(148, 163, 184, 0.8);
}

.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(148, 163, 184, 0.75);
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.dashboard-table th,
.dashboard-table td {
  padding: 0.75rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.dashboard-table th {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.75);
}

.table-cell-primary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.table-cell-secondary {
  color: rgba(148, 163, 184, 0.75);
}

.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.inventory-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.inventory-summary__metric {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.inventory-summary__kicker {
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.8);
}

.inventory-summary__value {
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.inventory-summary__hint {
  color: rgba(148, 163, 184, 0.8);
}

.inventory-summary__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.9rem;
  color: rgba(148, 163, 184, 0.85);
}

.inventory-summary__count {
  font-size: 1.25rem;
  font-weight: 600;
}

.inventory-top {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inventory-top__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.inventory-top__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inventory-top__item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.inventory-top__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.inventory-top__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.inventory-top__name {
  font-weight: 500;
}

.inventory-top__meta {
  color: rgba(148, 163, 184, 0.75);
}

.inventory-top__measure {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.distribution-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.distribution-row__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.distribution-row__value {
  font-weight: 600;
}

.distribution-row__bar {
  height: 0.5rem;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 999px;
  overflow: hidden;
}

.distribution-row__bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.distribution-row__bar-fill.is-success {
  background: rgba(34, 197, 94, 0.85);
}

.distribution-row__bar-fill.is-warn {
  background: rgba(250, 204, 21, 0.85);
}

.distribution-row__bar-fill.is-info {
  background: rgba(59, 130, 246, 0.85);
}

.distribution-row__bar-fill.is-secondary {
  background: rgba(148, 163, 184, 0.7);
}

.distribution-row__percent {
  color: rgba(148, 163, 184, 0.75);
  font-size: 0.8rem;
}

.dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.dashboard-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.dashboard-list__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.dashboard-list__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-list__title {
  font-weight: 500;
}

.dashboard-list__subtitle {
  color: rgba(148, 163, 184, 0.75);
}

.dashboard-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-actions :deep(.p-button) {
  justify-content: flex-start;
}

@media (max-width: 1024px) {
  .dashboard-columns {
    grid-template-columns: 1fr;
  }

  .inventory-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .inventory-summary__meta {
    align-items: flex-start;
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

