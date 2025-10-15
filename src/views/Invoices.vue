<script setup>
import { ref, computed, watch } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import { useToast } from 'primevue/usetoast'
import { getInvoices, addInvoice, deleteInvoice, getCustomers, getMaterials, findCustomer, findMaterial } from '../services/storage'

const toast = useToast()
const invoices = ref(getInvoices())
const customers = ref(getCustomers())
const materials = ref(getMaterials())

// Create invoice dialog
const dialogVisible = ref(false)
const form = ref({
  date: new Date(),
  customerId: customers.value[0]?.id || null,
  items: []
})

function openCreate() {
  form.value = {
    date: new Date(),
    customerId: customers.value[0]?.id || null,
    items: [{ materialId: materials.value[0]?.id || null, qty: 1, unitPrice: materials.value[0]?.price || 0 }]
  }
  dialogVisible.value = true
}

function addItem() {
  const m = materials.value[0]
  form.value.items.push({ materialId: m?.id || null, qty: 1, unitPrice: m?.price || 0 })
}

function removeItem(index) {
  form.value.items.splice(index, 1)
}

function onMaterialChange(index) {
  const row = form.value.items[index]
  const m = materials.value.find(x => x.id === row.materialId)
  if (m) row.unitPrice = m.price
}

const subtotal = computed(() => form.value.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0))
const tax = computed(() => +(subtotal.value * 0.16).toFixed(2))
const total = computed(() => +(subtotal.value + tax.value).toFixed(2))

function submit() {
  if (!form.value.customerId) {
    toast.add({ severity: 'warn', summary: 'Falta cliente', life: 2000 })
    return
  }
  if (!form.value.date) {
    toast.add({ severity: 'warn', summary: 'Falta fecha', life: 2000 })
    return
  }
  if (!form.value.items.length) {
    toast.add({ severity: 'warn', summary: 'Agrega al menos un concepto', life: 2000 })
    return
  }
  const dateStr = new Date(form.value.date).toISOString().slice(0, 10)
  const created = addInvoice({
    date: dateStr,
    customerId: form.value.customerId,
    items: form.value.items.map(it => ({ materialId: it.materialId, qty: Number(it.qty) || 0, unitPrice: Number(it.unitPrice) || 0 }))
  })
  invoices.value = getInvoices()
  dialogVisible.value = false
  toast.add({ severity: 'success', summary: `Factura ${created.number} creada`, life: 2000 })
}

function remove(inv) {
  deleteInvoice(inv.id)
  invoices.value = getInvoices()
  toast.add({ severity: 'info', summary: 'Factura eliminada', life: 1500 })
}

function customerName(id) {
  return findCustomer(id)?.name || '-'
}
</script>

<template>
  <div class="page">
    <div class="actions">
      <Button label="Nueva factura" icon="pi pi-plus" @click="openCreate" />
    </div>

    <Card>
      <template #title>Facturas</template>
      <template #content>
        <DataTable :value="invoices" dataKey="id" size="small" :stripedRows="true" :paginator="true" :rows="5">
          <Column field="number" header="#" sortable></Column>
          <Column field="date" header="Fecha" sortable></Column>
          <Column header="Cliente">
            <template #body="{ data }">
              {{ customerName(data.customerId) }}
            </template>
          </Column>
          <Column field="subtotal" header="Subtotal" sortable>
            <template #body="{ data }">${{ Number(data.subtotal).toFixed(2) }}</template>
          </Column>
          <Column field="tax" header="IVA" sortable>
            <template #body="{ data }">${{ Number(data.tax).toFixed(2) }}</template>
          </Column>
          <Column field="total" header="Total" sortable>
            <template #body="{ data }">${{ Number(data.total).toFixed(2) }}</template>
          </Column>
          <Column header="Acciones" :exportable="false" style="width: 8rem">
            <template #body="{ data }">
              <Button icon="pi pi-trash" severity="danger" rounded text @click="remove(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal header="Nueva factura" :style="{ width: '56rem' }">
      <div class="grid-2">
        <div>
          <label>Cliente</label>
          <Dropdown v-model="form.customerId" :options="customers" optionLabel="name" optionValue="id" placeholder="Selecciona" class="w-full" />
        </div>
        <div>
          <label>Fecha</label>
          <DatePicker v-model="form.date" dateFormat="yy-mm-dd" class="w-full" />
        </div>
      </div>

      <div class="items">
        <div class="items-head">
          <div>Material</div>
          <div>Cantidad</div>
          <div>Precio Unitario</div>
          <div>Importe</div>
          <div></div>
        </div>
        <div v-for="(it, idx) in form.items" :key="idx" class="items-row">
          <Dropdown v-model="it.materialId" :options="materials" optionLabel="name" optionValue="id" @change="onMaterialChange(idx)" />
          <InputNumber v-model="it.qty" :min="0" :step="1" inputClass="w-8rem" />
          <InputNumber v-model="it.unitPrice" mode="currency" currency="USD" :min="0" :step="0.01" inputClass="w-10rem" />
          <div>${{ ((Number(it.qty)||0) * (Number(it.unitPrice)||0)).toFixed(2) }}</div>
          <Button icon="pi pi-times" rounded text severity="secondary" @click="removeItem(idx)" />
        </div>
        <div class="items-actions">
          <Button label="Agregar concepto" icon="pi pi-plus" outlined @click="addItem" />
        </div>
      </div>

      <div class="totals">
        <div></div>
        <div></div>
        <div class="label">Subtotal</div>
        <div class="value">${{ subtotal.toFixed(2) }}</div>
        <div class="label">IVA (16%)</div>
        <div class="value">${{ tax.toFixed(2) }}</div>
        <div class="label grand">Total</div>
        <div class="value grand">${{ total.toFixed(2) }}</div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="dialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" @click="submit" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 1rem; }
.actions { display: flex; justify-content: flex-end; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.items { display: grid; gap: 0.5rem; }
.items-head, .items-row { display: grid; grid-template-columns: 2fr 1fr 1.2fr 1fr auto; align-items: center; gap: 0.5rem; }
.items-head { font-weight: 600; }
.items-actions { display: flex; justify-content: flex-start; margin-top: 0.5rem; }
.totals { display: grid; grid-template-columns: 1fr 1fr auto 10rem; gap: 0.5rem; justify-items: end; margin-top: 1rem; }
.totals .label { font-weight: 500; }
.totals .grand { font-size: 1.1rem; font-weight: 700; }
.w-full { width: 100%; }
.w-8rem { width: 8rem; }
.w-10rem { width: 10rem; }
</style>

