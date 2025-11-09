<template>
  <section class="view-container">
    <header class="view-header">
      <div class="view-header__meta">
        <span class="view-kicker">Catálogos</span>
        <h1 class="view-title">Proveedores</h1>
        <p class="view-description">Controla tu directorio de proveedores, filtra por estatus y registra nuevos contactos.</p>
      </div>
      <div class="view-header__actions">
        <Button
          label="Nuevo proveedor"
          icon="pi pi-plus"
          severity="primary"
          :disabled="isBusy"
          @click="openCreate"
        />
      </div>
    </header>

    <Card class="suppliers-card shadow-none glass-panel border border-white/10">
      <template #title>
        <div class="suppliers-card__title">
          <span class="font-medium">Listado de proveedores</span>
          <small class="suppliers-card__subtitle">{{ filteredCount }} {{ filteredCount === 1 ? 'resultado' : 'resultados' }}</small>
        </div>
      </template>

      <template #content>
        <div class="suppliers-summary">
          <div class="suppliers-summary__item">
            <span class="suppliers-summary__label">Activos</span>
            <span class="suppliers-summary__value text-emerald-300">{{ statusTotals.active }}</span>
          </div>
          <div class="suppliers-summary__item">
            <span class="suppliers-summary__label">Inactivos</span>
            <span class="suppliers-summary__value text-orange-300">{{ statusTotals.inactive }}</span>
          </div>
          <div class="suppliers-summary__item">
            <span class="suppliers-summary__label">Total</span>
            <span class="suppliers-summary__value">{{ suppliersCount }}</span>
          </div>
        </div>

        <div class="suppliers-filters">
          <div class="suppliers-filters__field suppliers-filters__field--grow">
            <label>Búsqueda</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                v-model="search"
                placeholder="Nombre, RFC, ciudad, email, teléfono..."
                class="w-full"
              />
            </span>
          </div>

          <div class="suppliers-filters__field">
            <label>Estatus</label>
            <Dropdown
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <div class="suppliers-filters__field">
            <label>Ciudad</label>
            <MultiSelect
              v-model="cityFilter"
              :options="cityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todas"
              :filter="true"
              display="chip"
            />
          </div>

          <div class="suppliers-filters__field">
            <label>Régimen SAT</label>
            <MultiSelect
              v-model="regimeFilter"
              :options="regimeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos"
              :filter="true"
              display="chip"
            />
          </div>

          <div class="suppliers-filters__field suppliers-filters__field--reset">
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
          :value="filteredSuppliers"
          dataKey="id"
          :loading="isBusy"
          :rows="12"
          :paginator="true"
          :rowsPerPageOptions="[12, 24, 50]"
          :rowHover="true"
          :sortField="'name'"
          :sortOrder="1"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="Mostrando {first}-{last} de {totalRecords}"
          responsiveLayout="scroll"
          class="suppliers-table"
        >
          <template #empty>
            <div class="suppliers-empty">
              <i class="pi pi-users"></i>
              <p>No hay proveedores que coincidan con los filtros actuales.</p>
            </div>
          </template>

          <template #loading>
            <div class="suppliers-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Cargando proveedores...</span>
            </div>
          </template>

          <Column field="name" header="Proveedor" sortable>
            <template #body="{ data }">
              <div class="supplier-name">
                <span class="supplier-name__title">{{ data.name }}</span>
                <small class="supplier-name__subtitle">{{ data.description || 'Sin descripción' }}</small>
              </div>
            </template>
          </Column>

          <Column field="rfc" header="RFC/NIT" sortable style="width: 10rem" />

          <Column header="Contacto" sortField="email">
            <template #body="{ data }">
              <div class="supplier-contact">
                <span v-if="data.email" class="supplier-contact__item">
                  <i class="pi pi-envelope" /> {{ data.email }}
                </span>
                <span v-if="data.phone" class="supplier-contact__item">
                  <i class="pi pi-phone" /> {{ data.phone }}
                </span>
                <span v-if="!data.email && !data.phone" class="supplier-contact__placeholder">Sin datos</span>
              </div>
            </template>
          </Column>

          <Column header="Ubicación" sortField="city" style="width: 12rem;">
            <template #body="{ data }">
              <div class="supplier-location">
                <span>{{ data.city || '—' }}</span>
                <small v-if="data.state" class="supplier-location__state">{{ data.state }}</small>
              </div>
            </template>
          </Column>

          <Column field="sat_regime" header="Régimen" sortable style="width: 10rem;" />

          <Column field="status" header="Estatus" sortable style="width: 9rem;">
            <template #body="{ data }">
              <Tag
                :value="statusMeta[data.status]?.label ?? data.status"
                :severity="statusMeta[data.status]?.severity ?? 'secondary'"
              />
            </template>
          </Column>

          <Column header="Acciones" style="width: 10rem; text-align: right;">
            <template #body="{ data }">
              <div class="suppliers-actions">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="primary"
                  @click="openEdit(data)"
                  aria-label="Editar proveedor"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  @click="confirmDelete(data)"
                  aria-label="Eliminar proveedor"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editing ? 'Editar proveedor' : 'Nuevo proveedor'"
      modal
      :style="{ width: '34rem' }"
    >
      <form class="supplier-form" @submit.prevent="submit">
        <div class="supplier-form__grid">
          <div class="supplier-form__field supplier-form__field--span-2">
            <label>Nombre comercial *</label>
            <InputText v-model.trim="form.name" placeholder="Recicladora del Norte" required />
          </div>

          <div class="supplier-form__field">
            <label>RFC/NIT *</label>
            <InputText v-model.trim="form.rfc" placeholder="XAXX010101000" required />
          </div>

          <div class="supplier-form__field">
            <label>Email</label>
            <InputText v-model.trim="form.email" placeholder="ventas@empresa.com" type="email" />
          </div>

          <div class="supplier-form__field">
            <label>Teléfono</label>
            <InputText v-model.trim="form.phone" placeholder="555-123-4567" />
          </div>

          <div class="supplier-form__field">
            <label>Estatus *</label>
            <Dropdown v-model="form.status" :options="statusSelectOptions" optionLabel="label" optionValue="value" />
          </div>

          <div class="supplier-form__field">
            <label>Ciudad</label>
            <InputText v-model.trim="form.city" placeholder="Guadalajara" />
          </div>

          <div class="supplier-form__field">
            <label>Estado</label>
            <InputText v-model.trim="form.state" placeholder="Jalisco" />
          </div>

          <div class="supplier-form__field">
            <label>Régimen SAT</label>
            <InputText v-model.trim="form.sat_regime" placeholder="601 - General de Ley Personas Morales" />
          </div>

          <div class="supplier-form__field supplier-form__field--span-2">
            <label>Dirección</label>
            <Textarea v-model.trim="form.address" rows="2" autoResize placeholder="Calle, número, colonia..." />
          </div>

          <div class="supplier-form__field supplier-form__field--span-2">
            <label>Descripción</label>
            <Textarea v-model.trim="form.description" rows="2" autoResize placeholder="Proveedor especializado en..." />
          </div>
        </div>
      </form>

      <template #footer>
        <div class="dialog-actions">
          <Button label="Cancelar" icon="pi pi-times" text @click="closeDialog" />
          <Button
            :label="editing ? 'Guardar cambios' : 'Crear proveedor'"
            icon="pi pi-check"
            :loading="mutationLoading"
            @click="submit"
          />
        </div>
      </template>
    </Dialog>

    <ConfirmDialog></ConfirmDialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import {
  useCreateSupplier,
  useDeleteSupplier,
  useListSuppliers,
  useUpdateSupplier
} from '@/services/api/generated/suppliers/suppliers'

const toast = useToast()
const confirm = useConfirm()

const suppliersQuery = useListSuppliers()
const createSupplierMutation = useCreateSupplier()
const updateSupplierMutation = useUpdateSupplier()
const deleteSupplierMutation = useDeleteSupplier()

const search = ref('')
const statusFilter = ref('all')
const cityFilter = ref([])
const regimeFilter = ref([])

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive(createEmptyForm())

const statusMeta = {
  active: { label: 'Activo', severity: 'success' },
  inactive: { label: 'Inactivo', severity: 'warning' }
}

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' }
]

const statusSelectOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' }
]

function createEmptyForm() {
  return {
    name: '',
    rfc: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    address: '',
    status: 'active',
    description: '',
    sat_regime: ''
  }
}

const suppliers = computed(() => suppliersQuery.data.value?.data ?? [])

const sanitizedSuppliers = computed(() =>
  suppliers.value.map(item => ({
    ...item,
    name: item.name?.trim() ?? '',
    city: item.city?.trim() ?? '',
    state: item.state?.trim() ?? '',
    sat_regime: item.sat_regime?.trim() ?? '',
    description: item.description?.trim() ?? '',
    email: item.email?.trim() ?? '',
    phone: item.phone?.trim() ?? ''
  }))
)

const suppliersCount = computed(() => sanitizedSuppliers.value.length)

const cityOptions = computed(() => {
  const set = new Set()
  const options = []
  for (const item of sanitizedSuppliers.value) {
    if (item.city && !set.has(item.city)) {
      set.add(item.city)
      options.push({ label: item.city, value: item.city })
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
})

const regimeOptions = computed(() => {
  const set = new Set()
  const options = []
  for (const item of sanitizedSuppliers.value) {
    if (item.sat_regime && !set.has(item.sat_regime)) {
      set.add(item.sat_regime)
      options.push({ label: item.sat_regime, value: item.sat_regime })
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
})

const filteredSuppliers = computed(() => {
  const searchTerm = search.value.trim().toLowerCase()
  const status = statusFilter.value
  const cities = cityFilter.value
  const regimes = regimeFilter.value

  return sanitizedSuppliers.value.filter(item => {
    if (searchTerm) {
      const haystack = [
        item.name,
        item.rfc,
        item.email,
        item.phone,
        item.description,
        item.city,
        item.state,
        item.address,
        item.sat_regime
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(searchTerm)) return false
    }

    if (status !== 'all' && item.status !== status) return false

    if (cities.length && !cities.includes(item.city)) return false

    if (regimes.length && !regimes.includes(item.sat_regime)) return false

    return true
  })
})

const filteredCount = computed(() => filteredSuppliers.value.length)

const statusTotals = computed(() => {
  return sanitizedSuppliers.value.reduce(
    (acc, item) => {
      acc[item.status === 'inactive' ? 'inactive' : 'active'] += 1
      return acc
    },
    { active: 0, inactive: 0 }
  )
})

const isBusy = computed(
  () =>
    suppliersQuery.isLoading.value ||
    suppliersQuery.isFetching.value ||
    mutationLoading.value
)

const mutationLoading = computed(
  () =>
    createSupplierMutation.isPending.value ||
    updateSupplierMutation.isPending.value ||
    deleteSupplierMutation.isPending.value
)

const hasActiveFilters = computed(() => {
  return (
    Boolean(search.value.trim()) ||
    statusFilter.value !== 'all' ||
    cityFilter.value.length > 0 ||
    regimeFilter.value.length > 0
  )
})

function resetFilters() {
  search.value = ''
  statusFilter.value = 'all'
  cityFilter.value = []
  regimeFilter.value = []
}

function openCreate() {
  Object.assign(form, createEmptyForm())
  editing.value = null
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, {
    name: row.name ?? '',
    rfc: row.rfc ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    address: row.address ?? '',
    status: row.status ?? 'active',
    description: row.description ?? '',
    sat_regime: row.sat_regime ?? ''
  })
  editing.value = row
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

function validateForm() {
  const issues = []
  if (!form.name.trim()) issues.push('Indica el nombre del proveedor')
  if (!form.rfc.trim()) issues.push('Indica el RFC/NIT')
  if (!form.status) issues.push('Selecciona el estatus')
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) issues.push('El correo tiene un formato inválido')
  return issues
}

function sanitizePayload(payload) {
  const result = { ...payload }
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim()
      if (result[key] === '') result[key] = null
    }
  })
  return result
}

async function submit() {
  const issues = validateForm()
  if (issues.length) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: issues.join(' • '), life: 4000 })
    return
  }

  const payload = sanitizePayload(form)

  try {
    if (editing.value) {
      await updateSupplierMutation.mutateAsync({ supplierId: editing.value.id, data: payload })
      toast.add({ severity: 'success', summary: 'Proveedor actualizado', life: 2500 })
    } else {
      await createSupplierMutation.mutateAsync({ data: payload })
      toast.add({ severity: 'success', summary: 'Proveedor creado', life: 2500 })
    }
    await suppliersQuery.refetch()
    dialogVisible.value = false
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: getErrorMessage(err), life: 4500 })
  }
}

function confirmDelete(row) {
  confirm.require({
    message: `¿Eliminar a ${row.name}? Esta acción no se puede deshacer.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Eliminar',
    acceptClass: 'p-button-danger',
    accept: () => deleteSupplier(row)
  })
}

async function deleteSupplier(row) {
  try {
    await deleteSupplierMutation.mutateAsync({ supplierId: row.id })
    toast.add({ severity: 'success', summary: 'Proveedor eliminado', life: 2000 })
    await suppliersQuery.refetch()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar', detail: getErrorMessage(err), life: 4500 })
  }
}

function getErrorMessage(err) {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err?.data?.detail) return Array.isArray(err.data.detail) ? err.data.detail.join(' • ') : err.data.detail
  return 'Ocurrió un error inesperado'
}
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

.suppliers-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.suppliers-card__title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.suppliers-card__subtitle {
  color: rgba(148, 163, 184, 0.85);
}

.suppliers-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.suppliers-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.suppliers-summary__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(148, 163, 184, 0.85);
}

.suppliers-summary__value {
  font-size: 1.6rem;
  font-weight: 600;
}

.suppliers-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  align-items: end;
}

.suppliers-filters__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suppliers-filters__field--grow {
  grid-column: span 2;
}

.suppliers-filters__field--reset {
  align-items: flex-start;
}

.suppliers-table {
  font-size: 0.85rem;
}

.suppliers-table :deep(.p-datatable-thead > tr > th) {
  background: rgba(15, 23, 42, 0.3);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  padding: 0.5rem 0.65rem;
  font-size: 0.75rem;
}

.suppliers-table :deep(.p-datatable-tbody > tr > td) {
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  padding: 0.55rem 0.65rem;
}

.supplier-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.supplier-name__title {
  font-weight: 600;
  font-size: 0.95rem;
}

.supplier-name__subtitle {
  color: rgba(148, 163, 184, 0.85);
  font-size: 0.75rem;
}

.supplier-contact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.supplier-contact__item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.supplier-contact__placeholder {
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.8rem;
}

.supplier-location {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.supplier-location__state {
  color: rgba(148, 163, 184, 0.75);
  font-size: 0.75rem;
}

.suppliers-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.suppliers-empty,
.suppliers-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(148, 163, 184, 0.8);
}

.supplier-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.supplier-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.supplier-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.supplier-form__field--span-2 {
  grid-column: span 2;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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
  .suppliers-filters__field--grow {
    grid-column: span 1;
  }

  .supplier-form__grid {
    grid-template-columns: 1fr;
  }

  .supplier-form__field--span-2 {
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
