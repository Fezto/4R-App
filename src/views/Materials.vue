<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { getMaterials, saveMaterial, deleteMaterial, updateMaterial } from '../services/storage'

const toast = useToast()
const materials = ref(getMaterials())

const dialogVisible = ref(false)
const editing = ref(null)
const units = [ 'kg', 'ton', 'pieza', 'unidad', 'm3' ]
const form = ref({ name: '', unit: units[0], price: 0 })

function openCreate() {
  editing.value = null
  form.value = { name: '', unit: units[0], price: 0 }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = { ...row }
  form.value = { name: row.name, unit: row.unit, price: row.price }
  dialogVisible.value = true
}
function submit() {
  if (!form.value.name) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'El nombre es obligatorio', life: 2500 })
    return
  }
  if (form.value.price < 0) {
    toast.add({ severity: 'warn', summary: 'Precio inválido', detail: 'Debe ser 0 o mayor', life: 2500 })
    return
  }
  if (editing.value) {
    updateMaterial({ ...editing.value, ...form.value })
    toast.add({ severity: 'success', summary: 'Material actualizado', life: 1500 })
  } else {
    saveMaterial(form.value)
    toast.add({ severity: 'success', summary: 'Material creado', life: 1500 })
  }
  materials.value = getMaterials()
  dialogVisible.value = false
}
function remove(row) {
  deleteMaterial(row.id)
  materials.value = getMaterials()
  toast.add({ severity: 'info', summary: 'Material eliminado', life: 1500 })
}
</script>

<template>
  <div class="page">
    <div class="actions">
      <Button label="Nuevo material" icon="pi pi-plus" @click="openCreate" />
    </div>

    <Card>
      <template #title>Materiales</template>
      <template #content>
        <DataTable :value="materials" dataKey="id" size="small" :stripedRows="true" :paginator="true" :rows="5">
          <Column field="name" header="Nombre" sortable></Column>
          <Column field="unit" header="Unidad" sortable></Column>
          <Column field="price" header="Precio" sortable>
            <template #body="{ data }">
              ${{ Number(data.price).toFixed(2) }}
            </template>
          </Column>
          <Column header="Acciones" :exportable="false" style="width: 10rem">
            <template #body="{ data }">
              <div class="row-actions">
                <Button icon="pi pi-pencil" rounded text @click="openEdit(data)" />
                <Button icon="pi pi-trash" severity="danger" rounded text @click="remove(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="dialogVisible" modal :header="editing ? 'Editar material' : 'Nuevo material'" :style="{ width: '28rem' }">
      <div class="form">
        <label>Nombre</label>
        <InputText v-model="form.name" placeholder="p.ej. PET" />
        <label>Unidad</label>
        <Dropdown v-model="form.unit" :options="units" placeholder="Unidad" />
        <label>Precio</label>
        <InputNumber v-model="form.price" mode="currency" currency="USD" :min="0" :step="0.01" />
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
.form { display: grid; gap: 0.5rem; }
.row-actions { display: flex; gap: 0.25rem; }
</style>

