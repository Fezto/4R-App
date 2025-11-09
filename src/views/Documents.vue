<template>
  <section class="view-container">
    <header class="view-header">
      <div class="view-header__meta">
        <span class="view-kicker">Operaciones</span>
        <h1 class="view-title">Documentos</h1>
        <p class="view-description">Explora, filtra y administra los archivos generados por las operaciones.</p>
      </div>
      <div class="view-header__actions">
        <Button
          label="Recargar"
          icon="pi pi-refresh"
          text
          :loading="isBusy"
          @click="refresh"
        />
      </div>
    </header>

    <Card class="documents-card shadow-none glass-panel border border-white/10">
      <template #title>
        <div class="documents-card__title">
          <span class="font-medium">Listado de documentos</span>
          <small class="documents-card__subtitle">{{ filteredCount }} {{ filteredCount === 1 ? 'resultado' : 'resultados' }}</small>
        </div>
      </template>

      <template #content>
        <div class="documents-summary">
          <div class="documents-summary__item">
            <span class="documents-summary__label">Total</span>
            <span class="documents-summary__value">{{ totalDocuments }}</span>
          </div>
          <div class="documents-summary__item">
            <span class="documents-summary__label">Con operación</span>
            <span class="documents-summary__value">{{ linkedDocuments }}</span>
          </div>
          <div class="documents-summary__item">
            <span class="documents-summary__label">Sin operación</span>
            <span class="documents-summary__value">{{ orphanDocuments }}</span>
          </div>
          <div class="documents-summary__types">
            <Tag
              v-for="option in documentTypeOptions"
              :key="option.value"
              :value="`${option.label}: ${typeTotals[option.value] ?? 0}`"
              :severity="documentTypeMeta[option.value]?.severity ?? 'secondary'"
              rounded
            />
          </div>
        </div>

        <div class="documents-filters">
          <div class="documents-filters__field documents-filters__field--grow">
            <label>Buscar</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                v-model="search"
                placeholder="Nombre, ruta, notas de operación..."
                class="w-full"
              />
            </span>
          </div>
          <div class="documents-filters__field">
            <label>Tipo de documento</label>
            <MultiSelect
              v-model="typeFilter"
              :options="documentTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              display="chip"
            />
          </div>
          <div class="documents-filters__field">
            <label>Tipo de operación</label>
            <MultiSelect
              v-model="operationFilter"
              :options="operationTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas"
              display="chip"
              :disabled="!operationTypeOptions.length"
            />
          </div>
          <div class="documents-filters__field">
            <label>ID de operación</label>
            <InputText
              v-model="operationIdFilter"
              placeholder="Ej. 105"
              inputmode="numeric"
            />
          </div>
          <div class="documents-filters__field documents-filters__field--reset">
            <label class="sr-only">Limpiar filtros</label>
            <Button
              label="Limpiar"
              icon="pi pi-filter-slash"
              text
              @click="resetFilters"
              :disabled="!hasActiveFilters"
            />
          </div>
        </div>

        <DataTable
          :value="filteredRows"
          dataKey="id"
          :loading="isBusy"
          :rows="10"
          :paginator="true"
          :rowsPerPageOptions="[10, 20, 50]"
          :rowHover="true"
          :sortField="'id'"
          :sortOrder="-1"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Mostrando {first}-{last} de {totalRecords}"
          responsiveLayout="scroll"
          class="documents-table"
        >
          <template #empty>
            <div class="documents-empty">
              <i class="pi pi-inbox"></i>
              <p>No se encontraron documentos con los filtros actuales.</p>
            </div>
          </template>
          <template #loading>
            <div class="documents-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Cargando documentos...</span>
            </div>
          </template>

          <Column field="id" header="#" sortable style="width: 6rem; text-align: right;" />

          <Column header="Archivo" :sortable="true" sortField="fileName">
            <template #body="{ data }">
              <div class="documents-file">
                <span class="documents-file__name">{{ data.fileName }}</span>
                <small v-if="data.document_path" class="documents-file__path">{{ data.document_path }}</small>
                <small v-else class="documents-file__path">Sin ruta registrada</small>
              </div>
            </template>
          </Column>

          <Column field="type" header="Tipo" sortable style="width: 9rem; text-transform: capitalize;">
            <template #body="{ data }">
              <Tag
                :icon="documentTypeMeta[data.type]?.icon"
                :value="documentTypeMeta[data.type]?.label ?? data.type"
                :severity="documentTypeMeta[data.type]?.severity ?? 'secondary'"
              />
            </template>
          </Column>

          <Column header="Operación" :sortable="true" sortField="operationSortKey">
            <template #body="{ data }">
              <div v-if="data.hasOperation" class="documents-operation">
                <span class="documents-operation__title">{{ data.operationLabel }}</span>
                <small class="documents-operation__meta">ID {{ data.operation_id }} · {{ formatQuantity(data.quantity) }} · {{ formatCurrency(data.subtotal) }}</small>
              </div>
              <Tag v-else value="Sin vincular" severity="secondary" />
            </template>
          </Column>

          <Column field="isApproved" header="Estatus" sortable style="width: 9rem;">
            <template #body="{ data }">
              <Tag v-if="data.isApproved === true" value="Aprobada" severity="success" />
              <Tag v-else-if="data.isApproved === false" value="Pendiente" severity="warning" />
              <Tag v-else value="Sin estatus" severity="secondary" />
            </template>
          </Column>

          <Column header="Acciones" style="width: 9rem; text-align: right;">
            <template #body="{ data }">
              <div class="documents-actions">
                <Button
                  icon="pi pi-external-link"
                  text
                  rounded
                  severity="primary"
                  :disabled="!data.document_path"
                  aria-label="Abrir documento"
                  @click="openDocument(data)"
                />
                <Button
                  icon="pi pi-copy"
                  text
                  rounded
                  severity="secondary"
                  :disabled="!data.document_path"
                  aria-label="Copiar ruta"
                  @click="copyPath(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useListDocuments } from '@/services/api/generated/documents/documents'
import { useListOperations } from '@/services/api/generated/operations/operations'
import { DocumentType } from '@/services/api/generated/schemas/documentType'
import { OperationType } from '@/services/api/generated/schemas/operationType'

const toast = useToast()

const documentsQuery = useListDocuments()
const operationsQuery = useListOperations()

const search = ref('')
const typeFilter = ref([])
const operationFilter = ref([])
const operationIdFilter = ref('')

const documentTypeMeta = {
  [DocumentType.pdf]: { label: 'PDF', icon: 'pi pi-file-pdf', severity: 'danger' },
  [DocumentType.png]: { label: 'PNG', icon: 'pi pi-image', severity: 'info' },
  [DocumentType.docx]: { label: 'DOCX', icon: 'pi pi-file-word', severity: 'primary' }
}

const operationTypeMeta = {
  [OperationType.purchase]: { label: 'Compra', icon: 'pi pi-shopping-cart' },
  [OperationType.inbound]: { label: 'Entrada', icon: 'pi pi-download' },
  [OperationType.outbound]: { label: 'Salida', icon: 'pi pi-upload' },
  [OperationType.other]: { label: 'Otro', icon: 'pi pi-ellipsis-h' }
}

const documentTypeOptions = Object.values(DocumentType).map(value => ({
  label: documentTypeMeta[value]?.label ?? value,
  value,
  icon: documentTypeMeta[value]?.icon
}))

const documents = computed(() => documentsQuery.data.value?.data ?? [])
const operations = computed(() => operationsQuery.data.value?.data ?? [])

const operationsMap = computed(() => {
  const map = new Map()
  for (const op of operations.value) map.set(op.id, op)
  return map
})

function extractFileName(path) {
  if (!path) return 'Sin archivo'
  const segments = path.split(/[\\/]/)
  const name = segments[segments.length - 1]
  return name || path
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const rows = computed(() =>
  documents.value.map(doc => {
    const operation = doc.operation_id ? operationsMap.value.get(doc.operation_id) ?? null : null
    const operationType = operation?.operation_type ?? null
    const quantity = operation ? toNumber(operation.quantity) : null
    const subtotal = operation ? toNumber(operation.subtotal) : null
    return {
      ...doc,
      fileName: extractFileName(doc.document_path ?? ''),
      operation,
      operationType,
      operationLabel: operation
        ? `${operationTypeMeta[operationType]?.label ?? operationType ?? 'Operación'} · ${operation.product_name}`
        : 'Sin operación',
      quantity,
      subtotal,
      hasOperation: Boolean(operation),
      isApproved: operation?.is_approved ?? null,
      operationSortKey: operation
        ? `${operationType ?? 'zzz'}-${String(operation.id).padStart(5, '0')}`
        : 'zzz'
    }
  })
)

const operationTypeOptions = computed(() => {
  const seen = new Set()
  const options = []
  for (const row of rows.value) {
    if (row.operationType && !seen.has(row.operationType)) {
      seen.add(row.operationType)
      options.push({
        value: row.operationType,
        label: operationTypeMeta[row.operationType]?.label ?? row.operationType,
        icon: operationTypeMeta[row.operationType]?.icon
      })
    }
  }
  return options
})

const numberFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2
})

function formatQuantity(value) {
  if (value === null || value === undefined) return '—'
  return numberFormatter.format(value)
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return currencyFormatter.format(value)
}

const filteredRows = computed(() => {
  const searchTerm = search.value.trim().toLowerCase()
  const selectedTypes = typeFilter.value
  const selectedOperationTypes = operationFilter.value
  const operationIdValue = operationIdFilter.value.trim()

  return rows.value.filter(row => {
    if (searchTerm) {
      const haystack = [
        row.fileName,
        row.document_path ?? '',
        row.operationLabel ?? '',
        row.operation?.notes ?? '',
        row.operation?.received_by ?? ''
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(searchTerm)) return false
    }

    if (selectedTypes.length && !selectedTypes.includes(row.type)) return false

    if (selectedOperationTypes.length) {
      if (!row.operationType || !selectedOperationTypes.includes(row.operationType)) return false
    }

    if (operationIdValue) {
      const normalized = String(row.operation_id ?? '')
      if (!normalized.includes(operationIdValue)) return false
    }

    return true
  })
})

const isBusy = computed(
  () =>
    documentsQuery.isLoading.value ||
    operationsQuery.isLoading.value ||
    documentsQuery.isFetching.value ||
    operationsQuery.isFetching.value
)

const filteredCount = computed(() => filteredRows.value.length)
const totalDocuments = computed(() => rows.value.length)
const linkedDocuments = computed(() => rows.value.filter(row => row.hasOperation).length)
const orphanDocuments = computed(() => totalDocuments.value - linkedDocuments.value)

const typeTotals = computed(() => {
  const totals = {}
  for (const row of rows.value) {
    totals[row.type] = (totals[row.type] ?? 0) + 1
  }
  return totals
})

const hasActiveFilters = computed(() => {
  return (
    Boolean(search.value.trim()) ||
    typeFilter.value.length > 0 ||
    operationFilter.value.length > 0 ||
    Boolean(operationIdFilter.value.trim())
  )
})

function resetFilters() {
  search.value = ''
  typeFilter.value = []
  operationFilter.value = []
  operationIdFilter.value = ''
}

function buildDocumentUrl(path) {
  if (!path) return null
  if (/^https?:/i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized.startsWith('/api/')) return normalized
  return `/api${normalized}`
}

function openDocument(row) {
  const url = buildDocumentUrl(row.document_path)
  if (!url) return
  window.open(url, '_blank', 'noopener')
}

async function copyPath(row) {
  if (!row.document_path) return
  try {
    await navigator.clipboard.writeText(row.document_path)
    toast.add({ severity: 'success', summary: 'Ruta copiada', detail: row.document_path, life: 2000 })
  } catch (err) {
    toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: getErrorMessage(err), life: 3000 })
  }
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err?.data?.detail) return Array.isArray(err.data.detail) ? err.data.detail.join(' • ') : err.data.detail
  return 'Ocurrió un error inesperado'
}

async function refresh() {
  try {
    await Promise.all([documentsQuery.refetch(), operationsQuery.refetch()])
    toast.add({ severity: 'info', summary: 'Actualizado', detail: 'Datos sincronizados', life: 2000 })
  } catch (err) {
    toast.add({ severity: 'warn', summary: 'Actualización incompleta', detail: getErrorMessage(err), life: 3000 })
  }
}

watch(
  () => documentsQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar documentos', detail: getErrorMessage(err), life: 4500 })
  }
)

watch(
  () => operationsQuery.error.value,
  err => {
    if (err) toast.add({ severity: 'error', summary: 'Error al cargar operaciones', detail: getErrorMessage(err), life: 4500 })
  }
)
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.documents-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.documents-card__title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.documents-card__subtitle {
  color: rgba(148, 163, 184, 0.85);
}

.documents-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  align-items: stretch;
}

.documents-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.documents-summary__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(148, 163, 184, 0.85);
}

.documents-summary__value {
  font-size: 1.5rem;
  font-weight: 600;
}

.documents-summary__types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.documents-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  align-items: end;
}

.documents-filters__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.documents-filters__field--grow {
  grid-column: span 2;
}

.documents-filters__field--reset {
  align-items: flex-start;
}

.documents-table :deep(.p-datatable-thead > tr > th) {
  background: rgba(15, 23, 42, 0.3);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.documents-table :deep(.p-datatable-tbody > tr > td) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.documents-file {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.documents-file__name {
  font-weight: 500;
}

.documents-file__path {
  color: rgba(148, 163, 184, 0.85);
}

.documents-operation {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.documents-operation__title {
  font-weight: 500;
}

.documents-operation__meta {
  color: rgba(148, 163, 184, 0.85);
}

.documents-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.documents-empty,
.documents-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(148, 163, 184, 0.8);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 768px) {
  .documents-filters__field--grow {
    grid-column: span 1;
  }

  .view-header {
    gap: 1.5rem;
  }

  .view-header__actions {
    justify-content: flex-start;
  }
}
</style>
