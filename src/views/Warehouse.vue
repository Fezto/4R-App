<template>
  <section class="view-container">
    <header class="view-header">
      <div class="view-header__meta">
        <span class="view-kicker">Operaciones</span>
        <h1 class="view-title">Almacén</h1>
        <p class="view-description">Registra entradas y salidas completas (transacción única).</p>
      </div>
    </header>

    <Tabs :value="activeTab" @update:value="activeTab = $event">
      <TabList class="mb-6">
        <Tab value="overview">
          <i class="pi pi-chart-bar mr-2" /> Vistazo general
        </Tab>
        <Tab value="inbound">
          <i class="pi pi-download mr-2" /> Entrada
        </Tab>
        <Tab value="outbound">
          <i class="pi pi-upload mr-2" /> Salida
        </Tab>
      </TabList>

      <TabPanels>
        <!-- ========================== OVERVIEW ========================== -->
        <TabPanel value="overview">
          <Card class="movement-card shadow-none glass-panel border border-white/10">
            <template #title>
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium">Resumen operativo</span>
                <Tag v-if="overviewLoading" value="Actualizando" severity="info" />
                <Tag v-else value="Datos en vivo" severity="success" />
              </div>
            </template>
            <template #content>
              <div class="overflow-x-auto">
                <table class="overview-table">
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Valor</th>
                      <th>Detalle</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Operaciones totales</td>
                      <td>{{ totalOperations }}</td>
                      <td>
                        <div class="overview-table__chips">
                          <Tag value="Entradas" severity="success" />
                          <span>{{ inboundOperations }}</span>
                          <Tag value="Salidas" severity="warn" />
                          <span>{{ outboundOperations }}</span>
                          <Tag value="Otras" severity="info" />
                          <span>{{ otherOperations }}</span>
                        </div>
                      </td>
                      <td>
                        <RouterLink to="/reports">
                          <Button label="Ver reportes" icon="pi pi-chart-line" text size="small" />
                        </RouterLink>
                      </td>
                    </tr>
                    <tr>
                      <td>Inventario disponible</td>
                      <td>{{ formatKg(inventoryTotalWeight) }} kg</td>
                      <td>
                        <div class="overview-table__chips">
                          <Tag value="Items" severity="info" />
                          <span>{{ inventoryCount }}</span>
                        </div>
                      </td>
                      <td>
                        <RouterLink to="/materials">
                          <Button label="Ver inventario" icon="pi pi-box" text size="small" />
                        </RouterLink>
                      </td>
                    </tr>
                    <tr>
                      <td>Último movimiento</td>
                      <td>
                        <template v-if="latestOperation">
                          {{ operationTypeLabel(latestOperation.operation_type) }} · #{{ latestOperation.id }}
                        </template>
                        <template v-else>—</template>
                      </td>
                      <td>
                        <div class="overview-table__chips">
                          <Tag v-if="latestOperation?.is_approved === true" value="Aprobado" severity="success" />
                          <Tag v-else-if="latestOperation?.is_approved === false" value="Pendiente" severity="warning" />
                          <Tag v-else value="Sin estatus" severity="secondary" />
                          <span v-if="latestOperation">{{ formatCurrency(toNumber(latestOperation.subtotal)) }}</span>
                        </div>
                      </td>
                      <td>
                        <RouterLink v-if="latestOperation" to="/reports">
                          <Button label="Detalles" icon="pi pi-external-link" text size="small" />
                        </RouterLink>
                        <span v-else>—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </Card>

          <Card class="movement-card shadow-none glass-panel border border-white/10">
            <template #title>
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium">Inventario por material</span>
                <Tag :value="`${inventoryRows.length} materiales`" severity="info" />
              </div>
            </template>
            <template #content>
              <div v-if="inventoryRows.length" class="overflow-x-auto">
                <table class="overview-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Unidad base</th>
                      <th>Existencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in inventoryRows" :key="row.id">
                      <td>
                        <div class="table-cell-primary">
                          <span>{{ row.name }}</span>
                          <small v-if="row.description" class="table-cell-secondary">{{ row.description }}</small>
                        </div>
                      </td>
                      <td>{{ row.unitLabel }}</td>
                      <td>{{ row.formattedOriginal }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="overview-empty">
                <i class="pi pi-box"></i>
                <p>No hay inventario registrado.</p>
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- ========================== INBOUND ========================== -->
        <TabPanel value="inbound">
          <form @submit.prevent="submitInbound" class="space-y-8">
            <!-- Datos generales -->
            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium">Datos generales</span>
                  <Button type="button" icon="pi pi-refresh" text rounded size="small" @click="regenerateFolio(inboundForm,'ENT')" v-tooltip.top="'Nuevo folio'" />
                </div>
              </template>
              <template #content>
                <div class="movement-grid">
                  <div class="movement-field">
                    <label class="field-label field-label--required">Folio</label>
                    <InputText v-model="inboundForm.folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Fecha</label>
                    <DatePicker v-model="inboundForm.movement_date" showIcon dateFormat="dd/mm/yy" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Proveedor</label>
                    <Select v-model="inboundForm.supplier_id" :options="supplierOptions" optionLabel="label" optionValue="value" filter placeholder="Selecciona proveedor" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Transportista</label>
                    <Select v-model="inboundForm.transporter" :options="transporterChoices" optionLabel="label" optionValue="value" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Placas</label>
                    <InputText v-model="inboundForm.license_plate" placeholder="ABC-123" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Ticket</label>
                    <InputText v-model="inboundForm.ticket_number" placeholder="T-001" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Autorizó</label>
                    <InputText v-model="inboundForm.authorized_by" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Recibió</label>
                    <InputText v-model="inboundForm.received_by" />
                  </div>
                  <div class="movement-field col-span-2">
                    <label class="field-label">Observaciones</label>
                    <Textarea v-model="inboundForm.observations" rows="2" />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Datos fiscales opcionales -->
            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <span class="font-medium">Datos fiscales (opcionales)</span>
              </template>
              <template #content>
                <div class="movement-grid">
                  <div class="movement-field">
                    <label class="field-label">Folio factura</label>
                    <InputText v-model="inboundForm.invoice_folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Forma de pago</label>
                    <Select v-model="inboundForm.payment_form_code" :options="paymentFormChoices" optionLabel="label" optionValue="value" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Folio pago</label>
                    <InputText v-model="inboundForm.payment_folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Tasa impuesto</label>
                    <InputNumber v-model="inboundForm.tax_rate" :minFractionDigits="2" :maxFractionDigits="4" mode="decimal" />
                  </div>
                  <div class="movement-field col-span-2">
                    <label class="field-label">Folio fiscal (UUID)</label>
                    <InputText v-model="inboundForm.fiscal_folio" />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Materiales -->
            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Materiales</span>
                  <Button type="button" label="Agregar material" icon="pi pi-plus" size="small" @click="addItem(inboundForm)" />
                </div>
              </template>
              <template #content>
                <div class="space-y-5">
                  <div v-for="(item, idx) in inboundForm.items" :key="item.uid" class="movement-material">
                    <div class="material-row-grid">
                      <div class="movement-field">
                        <label class="field-label field-label--required">Inventario</label>
                        <Select v-model="item.inventory_id" :options="inventoryOptions" optionLabel="label" optionValue="value" filter placeholder="Selecciona" />
                        <small v-if="item.inventory_id" class="text-xs text-slate-400">Unidad: {{ inventoryMap.get(item.inventory_id)?.unit }} · Stock: {{ formatKg(inventoryMap.get(item.inventory_id)?.weight) }}</small>
                      </div>
                      <div class="movement-field">
                        <label class="field-label field-label--required">Cantidad</label>
                        <InputNumber v-model="item.quantity" mode="decimal" :minFractionDigits="2" :maxFractionDigits="3" />
                      </div>
                      <div class="movement-field">
                        <label class="field-label field-label--required">Precio unitario</label>
                        <InputNumber v-model="item.unit_price" mode="currency" currency="MXN" locale="es-MX" :minFractionDigits="2" :maxFractionDigits="4" />
                      </div>
                      <div class="movement-field material-row-grid__total">
                        <label class="field-label">Total</label>
                        <div class="text-cyan-400 font-semibold material-row-grid__total-value">{{ formatCurrency(rowTotal(item)) }}</div>
                        <Button type="button" icon="pi pi-trash" severity="danger" text rounded size="small" :disabled="inboundForm.items.length===1" @click="removeItem(inboundForm,item.uid)" />
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between items-center pt-4 border-t border-white/10">
                    <span class="text-sm">Total general</span>
                    <span class="text-xl font-bold text-cyan-400">{{ formatCurrency(inboundTotal) }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Opciones -->
            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #content>
                <div class="flex items-center gap-3">
                  <Checkbox v-model="inboundForm.generate_pdf" binary inputId="inbound-pdf" />
                  <label for="inbound-pdf" class="text-sm cursor-pointer">Generar PDF automáticamente</label>
                </div>
              </template>
            </Card>

            <div class="flex justify-end gap-3 flex-wrap">
              <Button type="button" label="Cancelar" severity="secondary" text @click="resetInbound" />
              <Button type="submit" label="Guardar entrada" icon="pi pi-save" :loading="inboundSubmitting" :disabled="inboundSubmitting" severity="success" />
            </div>
          </form>
        </TabPanel>

        <!-- ========================== OUTBOUND ========================== -->
        <TabPanel value="outbound">
          <form @submit.prevent="submitOutbound" class="space-y-8">
            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <div class="flex items-center justify-between gap-2">
                  <span class="font-medium">Datos generales</span>
                  <Button type="button" icon="pi pi-refresh" text rounded size="small" @click="regenerateFolio(outboundForm,'SAL')" v-tooltip.top="'Nuevo folio'" />
                </div>
              </template>
              <template #content>
                <div class="movement-grid">
                  <div class="movement-field">
                    <label class="field-label field-label--required">Folio</label>
                    <InputText v-model="outboundForm.folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Fecha</label>
                    <DatePicker v-model="outboundForm.movement_date" showIcon dateFormat="dd/mm/yy" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Cliente</label>
                    <Select v-model="outboundForm.supplier_id" :options="supplierOptions" optionLabel="label" optionValue="value" filter placeholder="Selecciona cliente" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Transportista</label>
                    <Select v-model="outboundForm.transporter" :options="transporterChoices" optionLabel="label" optionValue="value" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Placas</label>
                    <InputText v-model="outboundForm.license_plate" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Ticket</label>
                    <InputText v-model="outboundForm.ticket_number" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Autorizó</label>
                    <InputText v-model="outboundForm.authorized_by" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label field-label--required">Recibió</label>
                    <InputText v-model="outboundForm.received_by" />
                  </div>
                  <div class="movement-field col-span-2">
                    <label class="field-label">Observaciones</label>
                    <Textarea v-model="outboundForm.observations" rows="2" />
                  </div>
                </div>
              </template>
            </Card>

            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <span class="font-medium">Datos fiscales (opcionales)</span>
              </template>
              <template #content>
                <div class="movement-grid">
                  <div class="movement-field">
                    <label class="field-label">Folio factura</label>
                    <InputText v-model="outboundForm.invoice_folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Forma de pago</label>
                    <Select v-model="outboundForm.payment_form_code" :options="paymentFormChoices" optionLabel="label" optionValue="value" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Folio pago</label>
                    <InputText v-model="outboundForm.payment_folio" />
                  </div>
                  <div class="movement-field">
                    <label class="field-label">Tasa impuesto</label>
                    <InputNumber v-model="outboundForm.tax_rate" :minFractionDigits="2" :maxFractionDigits="4" mode="decimal" />
                  </div>
                  <div class="movement-field col-span-2">
                    <label class="field-label">Folio fiscal (UUID)</label>
                    <InputText v-model="outboundForm.fiscal_folio" />
                  </div>
                </div>
              </template>
            </Card>

            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #title>
                <div class="flex justify-between items-center">
                  <span class="font-medium">Materiales</span>
                  <Button type="button" label="Agregar material" icon="pi pi-plus" size="small" @click="addItem(outboundForm)" />
                </div>
              </template>
              <template #content>
                <div class="space-y-5">
                  <div v-for="(item, idx) in outboundForm.items" :key="item.uid" class="movement-material">
                    <div class="material-row-grid">
                      <div class="movement-field">
                        <label class="field-label field-label--required">Inventario</label>
                        <Select v-model="item.inventory_id" :options="inventoryOptions" optionLabel="label" optionValue="value" filter placeholder="Selecciona" />
                        <small v-if="item.inventory_id" class="text-xs text-slate-400">Stock: {{ formatKg(inventoryMap.get(item.inventory_id)?.weight) }}</small>
                      </div>
                      <div class="movement-field">
                        <label class="field-label field-label--required">Cantidad</label>
                        <InputNumber v-model="item.quantity" mode="decimal" :minFractionDigits="2" :maxFractionDigits="3" />
                      </div>
                      <div class="movement-field">
                        <label class="field-label field-label--required">Precio unitario</label>
                        <InputNumber v-model="item.unit_price" mode="currency" currency="MXN" locale="es-MX" :minFractionDigits="2" :maxFractionDigits="4" />
                      </div>
                      <div class="movement-field material-row-grid__total">
                        <label class="field-label">Total</label>
                        <div class="text-cyan-400 font-semibold material-row-grid__total-value">{{ formatCurrency(rowTotal(item)) }}</div>
                        <Button type="button" icon="pi pi-trash" severity="danger" text rounded size="small" :disabled="outboundForm.items.length===1" @click="removeItem(outboundForm,item.uid)" />
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between items-center pt-4 border-t border-white/10">
                    <span class="text-sm">Total general</span>
                    <span class="text-xl font-bold text-cyan-400">{{ formatCurrency(outboundTotal) }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <Card class="movement-card shadow-none glass-panel border border-white/10">
              <template #content>
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <Checkbox v-model="outboundForm.generate_pdf" binary inputId="outbound-pdf" />
                    <label for="outbound-pdf" class="text-sm cursor-pointer">Generar PDF</label>
                  </div>
                  <div class="flex items-center gap-3">
                    <Checkbox v-model="outboundForm.generate_purchase_order" binary inputId="outbound-po" />
                    <label for="outbound-po" class="text-sm cursor-pointer">Generar orden de compra</label>
                  </div>
                </div>
              </template>
            </Card>

            <div class="flex justify-end gap-3 flex-wrap">
              <Button type="button" label="Cancelar" severity="secondary" text @click="resetOutbound" />
              <Button type="submit" label="Guardar salida" icon="pi pi-save" :loading="outboundSubmitting" :disabled="outboundSubmitting" severity="danger" />
            </div>
          </form>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useQueryClient } from '@tanstack/vue-query'
import { useListSuppliers } from '@/services/api/generated/suppliers/suppliers'
import { useListInventories } from '@/services/api/generated/inventory/inventory'
import { useListOperations } from '@/services/api/generated/operations/operations'
import { useCreateCompleteInbound, useCreateCompleteOutbound } from '@/services/api/generated/transactions/transactions'
import { downloadInboundPDF, downloadOutboundPDF, downloadPurchaseOrderPDF } from '@/services/api/generated/pdfs/pdfs'
import { PaymentFormCode as PaymentFormCodeEnum, Transporter as TransporterEnum } from '@/services/api/generated/schemas'

const toast = useToast()
const queryClient = useQueryClient()
const activeTab = ref('overview')

// Queries
const suppliersQuery = useListSuppliers()
const inventoriesQuery = useListInventories()
const operationsQuery = useListOperations()

// Choices
const transporterChoices = [
  { label: 'Empresa logística', value: TransporterEnum.company },
  { label: 'Cliente', value: TransporterEnum.client }
]

const paymentFormChoices = [
  { label: 'PPD (99)', value: PaymentFormCodeEnum.NUMBER_99 },
  { label: 'PUE (03)', value: PaymentFormCodeEnum.NUMBER_03 }
]

// Mapped options
const supplierOptions = computed(() => (suppliersQuery.data.value?.data ?? []).map(s => ({ label: s.name, value: s.id })))
const inventoryOptions = computed(() => (inventoriesQuery.data.value?.data ?? []).map(i => ({ label: `${i.name} · ${i.unit}`, value: i.id, unit: i.unit, weight: i.weight })))
const inventoryMap = computed(() => {
  const m = new Map()
  for (const i of inventoriesQuery.data.value?.data ?? []) m.set(i.id, i)
  return m
})

const operations = computed(() => operationsQuery.data.value?.data ?? [])
const totalOperations = computed(() => operations.value.length)
const inboundOperations = computed(() => operations.value.filter(op => op.operation_type === 'inbound').length)
const outboundOperations = computed(() => operations.value.filter(op => op.operation_type === 'outbound').length)
const otherOperations = computed(() => operations.value.filter(op => !['inbound','outbound'].includes(op.operation_type)).length)
const latestOperation = computed(() => operations.value.slice().sort((a, b) => b.id - a.id)[0] || null)

const inventoryCount = computed(() => (inventoriesQuery.data.value?.data ?? []).length)
const inventoryTotalWeight = computed(() => (inventoriesQuery.data.value?.data ?? []).reduce((acc, item) => acc + toKilograms(Number(item.weight) || 0, item.unit), 0))
const inventoryRows = computed(() => (inventoriesQuery.data.value?.data ?? []).map(item => {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    description: item.description ?? '',
    weight: Number(item.weight) || 0,
    formattedOriginal: formatOriginalWeight(item.weight, item.unit),
    unitLabel: unitLabel(item.unit)
  }
}))

const overviewLoading = computed(() =>
  operationsQuery.isFetching.value ||
  inventoriesQuery.isFetching.value ||
  suppliersQuery.isFetching.value
)

// Mutations
const inboundMutation = useCreateCompleteInbound()
const outboundMutation = useCreateCompleteOutbound()

// Helpers
function randomUid() { return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}` }
function createItem() { return { uid: randomUid(), inventory_id: null, quantity: null, unit_price: null } }
function generateFolio(prefix) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const seq = String(d.getMilliseconds()).padStart(3,'0');
  return `${prefix}-${y}${m}${day}-${seq}`.toUpperCase()
}
function newForm(prefix) {
  return {
    folio: generateFolio(prefix),
    movement_date: new Date(),
    supplier_id: null,
    transporter: TransporterEnum.company,
    license_plate: '',
    ticket_number: '',
    authorized_by: '',
    received_by: '',
    observations: '',
    invoice_folio: '',
    payment_form_code: PaymentFormCodeEnum.NUMBER_99,
    payment_folio: '',
    tax_rate: null,
    fiscal_folio: '',
    items: [createItem()],
    generate_pdf: true,
    generate_purchase_order: false
  }
}
function regenerateFolio(form,prefix){ form.folio = generateFolio(prefix) }
function addItem(form){ form.items.push(createItem()) }
function removeItem(form, uid){ if (form.items.length===1) return; const i=form.items.findIndex(x=>x.uid===uid); if(i>-1) form.items.splice(i,1) }
function resetInbound(){ Object.assign(inboundForm, newForm('ENT')) }
function resetOutbound(){ Object.assign(outboundForm, newForm('SAL')) }

const inboundForm = reactive(newForm('ENT'))
const outboundForm = reactive(newForm('SAL'))

// Formatting
const currencyFmt = new Intl.NumberFormat('es-MX',{ style:'currency', currency:'MXN', minimumFractionDigits:2 })
const numberFmt = new Intl.NumberFormat('es-MX',{ minimumFractionDigits:2, maximumFractionDigits:3 })
const tonFormatter = new Intl.NumberFormat('es-MX',{ minimumFractionDigits:3, maximumFractionDigits:4 })
function formatCurrency(v){ return currencyFmt.format(Number(v)||0) }
function formatKg(v){ return numberFmt.format(Number(v)||0) }
function rowTotal(item){ return (Number(item.quantity)||0)*(Number(item.unit_price)||0) }
function operationTypeLabel(type){
  const map = { inbound: 'Entrada', outbound: 'Salida', purchase: 'Compra', other: 'Otro' }
  return map[type] ?? type
}
function toNumber(value){ const parsed = Number(value); return Number.isFinite(parsed)?parsed:0 }
function toKilograms(value, unit){
  if (!Number.isFinite(value)) return 0
  if (unit === 'ton') return value * 1000
  return value
}
function unitLabel(unit){
  const map = { ton: 'Toneladas', kg: 'Kilogramos' }
  return map[unit] ?? unit
}
function formatOriginalWeight(weight, unit){
  const value = Number(weight) || 0
  const formatter = unit === 'ton' ? tonFormatter : numberFmt
  const suffix = unit === 'ton' ? 'ton' : 'kg'
  return `${formatter.format(value)} ${suffix}`
}

// Totals
const inboundTotal = computed(()=> inboundForm.items.reduce((a,i)=>a+rowTotal(i),0))
const outboundTotal = computed(()=> outboundForm.items.reduce((a,i)=>a+rowTotal(i),0))

// Validation
function validate(form){
  const errors=[]
  const isEmpty=v=>!v || !String(v).trim()
  if(isEmpty(form.folio)) errors.push('Indica el folio')
  if(!form.movement_date) errors.push('Selecciona la fecha')
  if(!form.supplier_id) errors.push('Selecciona el proveedor/cliente')
  if(isEmpty(form.authorized_by)) errors.push('Indica quién autorizó')
  if(isEmpty(form.received_by)) errors.push('Indica quién recibió')
  if(!form.items.length) errors.push('Agrega al menos un material')
  form.items.forEach((it,idx)=>{
    const r=idx+1
    if(!it.inventory_id) errors.push(`Material ${r}: faltan inventario`)
    if(!it.quantity || Number(it.quantity)<=0) errors.push(`Material ${r}: cantidad inválida`)
    if(!it.unit_price || Number(it.unit_price)<=0) errors.push(`Material ${r}: precio inválido`)
  })
  return errors
}

function toDateString(value){ const d = value instanceof Date ? value : new Date(value); return d.toISOString().split('T')[0] }
function opt(v){ const s=(v??'').toString().trim(); return s||undefined }
function parseApiError(resp){ if(resp?.status===422 && resp?.data?.detail?.length) return resp.data.detail.map(i=>i.msg||'Dato inválido').join(' • '); if(resp?.status===400 && resp?.data?.detail) return resp.data.detail; return 'Operación rechazada' }
function extractMessage(e){ if(typeof e==='string') return e; if(e?.message) return e.message; return 'Fallo inesperado' }

const inboundSubmitting = ref(false)
const outboundSubmitting = ref(false)

async function submitInbound(){
  const issues = validate(inboundForm)
  if(issues.length){ toast.add({severity:'warn', summary:'Revisa la captura', detail:issues.join(' • '), life:6000}); return }
  inboundSubmitting.value=true
  try {
    const payload={
      transporter: inboundForm.transporter,
      license_plate: opt(inboundForm.license_plate),
      folio: inboundForm.folio.trim(),
      ticket_number: opt(inboundForm.ticket_number),
      movement_date: toDateString(inboundForm.movement_date),
      supplier_id: inboundForm.supplier_id,
      observations: opt(inboundForm.observations),
      authorized_by: opt(inboundForm.authorized_by),
      received_by: opt(inboundForm.received_by),
      invoice_folio: opt(inboundForm.invoice_folio),
      payment_form_code: inboundForm.payment_form_code,
      payment_folio: opt(inboundForm.payment_folio),
      tax_rate: inboundForm.tax_rate || undefined,
      fiscal_folio: opt(inboundForm.fiscal_folio),
      items: inboundForm.items.map(i=>({ inventory_id:i.inventory_id, quantity:Number(i.quantity)||0, unit_price:Number(i.unit_price)||0 })),
      generate_pdf: inboundForm.generate_pdf
    }
    const resp = await inboundMutation.mutateAsync({data:payload})
    if(resp.status===201){
      toast.add({severity:'success', summary:'Entrada creada', detail: resp.data.message || `Folio ${payload.folio} listo`, life:4500})
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['inbound']}),
        queryClient.invalidateQueries({queryKey:['inventory']}),
        queryClient.invalidateQueries({queryKey:['operations']})
      ])
      // Trigger PDF download if requested and ID is available
      if(inboundForm.generate_pdf && resp.data?.inbound_id){
        try {
          await downloadInboundPDF(resp.data.inbound_id)
          toast.add({severity:'info', summary:'PDF descargado', detail:`Remisión de entrada generada`, life:3000})
        } catch(pdfErr){
          console.error('PDF download failed:', pdfErr)
          toast.add({severity:'warn', summary:'PDF no descargado', detail:'La entrada se guardó pero el PDF falló', life:4000})
        }
      }
      resetInbound()
    } else throw new Error(parseApiError(resp))
  } catch(e){ console.error(e); toast.add({severity:'error', summary:'No se pudo guardar', detail:extractMessage(e), life:6000}) }
  finally { inboundSubmitting.value=false }
}

async function submitOutbound(){
  const issues = validate(outboundForm)
  if(issues.length){ toast.add({severity:'warn', summary:'Revisa la captura', detail:issues.join(' • '), life:6000}); return }
  outboundSubmitting.value=true
  try {
    const payload={
      transporter: outboundForm.transporter,
      license_plate: opt(outboundForm.license_plate),
      folio: outboundForm.folio.trim(),
      ticket_number: opt(outboundForm.ticket_number),
      movement_date: toDateString(outboundForm.movement_date),
      supplier_id: outboundForm.supplier_id,
      observations: opt(outboundForm.observations),
      authorized_by: opt(outboundForm.authorized_by),
      received_by: opt(outboundForm.received_by),
      invoice_folio: opt(outboundForm.invoice_folio),
      payment_form_code: outboundForm.payment_form_code,
      payment_folio: opt(outboundForm.payment_folio),
      tax_rate: outboundForm.tax_rate || undefined,
      fiscal_folio: opt(outboundForm.fiscal_folio),
      items: outboundForm.items.map(i=>({ inventory_id:i.inventory_id, quantity:Number(i.quantity)||0, unit_price:Number(i.unit_price)||0 })),
      generate_pdf: outboundForm.generate_pdf,
      generate_purchase_order: outboundForm.generate_purchase_order
    }
    const resp = await outboundMutation.mutateAsync({data:payload})
    if(resp.status===201){
      toast.add({severity:'success', summary:'Salida creada', detail: resp.data.message || `Folio ${payload.folio} listo`, life:4500})
      await Promise.all([
        queryClient.invalidateQueries({queryKey:['outbound']}),
        queryClient.invalidateQueries({queryKey:['inventory']}),
        queryClient.invalidateQueries({queryKey:['operations']})
      ])
      // Trigger PDF downloads if requested and ID is available
      if(resp.data?.outbound_id){
        const downloadPromises = []
        if(outboundForm.generate_pdf){
          downloadPromises.push(
            downloadOutboundPDF(resp.data.outbound_id)
              .then(()=> toast.add({severity:'info', summary:'PDF descargado', detail:'Remisión de salida generada', life:3000}))
              .catch(err=>{ console.error('Outbound PDF failed:', err); toast.add({severity:'warn', summary:'PDF de salida falló', life:4000}) })
          )
        }
        if(outboundForm.generate_purchase_order){
          downloadPromises.push(
            downloadPurchaseOrderPDF(resp.data.outbound_id)
              .then(()=> toast.add({severity:'info', summary:'PDF descargado', detail:'Orden de compra generada', life:3000}))
              .catch(err=>{ console.error('Purchase order PDF failed:', err); toast.add({severity:'warn', summary:'PDF de orden de compra falló', life:4000}) })
          )
        }
        if(downloadPromises.length > 0){
          await Promise.allSettled(downloadPromises)
        }
      }
      resetOutbound()
    } else throw new Error(parseApiError(resp))
  } catch(e){ console.error(e); toast.add({severity:'error', summary:'No se pudo guardar', detail:extractMessage(e), life:6000}) }
  finally { outboundSubmitting.value=false }
}

watch(() => operationsQuery.error.value, err => {
  if (err) toast.add({severity:'error', summary:'Error al cargar operaciones', detail:extractMessage(err), life:4500})
})
</script>
