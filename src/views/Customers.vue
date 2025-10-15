<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { getCustomers, saveCustomer, deleteCustomer, updateCustomer } from '../services/storage'

const toast = useToast()
const customers = ref(getCustomers())

const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ name: '', taxId: '', email: '', phone: '' })

function openCreate() {
  editing.value = null
  form.value = { name: '', taxId: '', email: '', phone: '' }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = { ...row }
  form.value = { name: row.name, taxId: row.taxId, email: row.email, phone: row.phone }
  dialogVisible.value = true
}
function submit() {
  if (!form.value.name || !form.value.taxId) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Nombre y RFC/NIT son obligatorios', life: 2500 })
    return
  }
  if (editing.value) {
    updateCustomer({ ...editing.value, ...form.value })
    toast.add({ severity: 'success', summary: 'Cliente actualizado', life: 1500 })
  } else {
    saveCustomer(form.value)
    toast.add({ severity: 'success', summary: 'Cliente creado', life: 1500 })
  }
  customers.value = getCustomers()
  dialogVisible.value = false
}
function remove(row) {
  deleteCustomer(row.id)
  customers.value = getCustomers()
  toast.add({ severity: 'info', summary: 'Cliente eliminado', life: 1500 })
}
</script>

<template>
  <div class="page">
    <div class="actions">
      <Button label="Nuevo cliente" icon="pi pi-plus" @click="openCreate" />
    </div>

    <Card>
      <template #title>Clientes</template>
      <template #content>
        <DataTable :value="customers" dataKey="id" size="small" :stripedRows="true" :paginator="true" :rows="5">
          <Column field="name" header="Nombre" sortable></Column>
          <Column field="taxId" header="RFC/NIT" sortable></Column>
          <Column field="email" header="Email"></Column>
          <Column field="phone" header="Teléfono"></Column>
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

    <Dialog v-model:visible="dialogVisible" modal :header="editing ? 'Editar cliente' : 'Nuevo cliente'" :style="{ width: '28rem' }">
      <div class="form">
        <label>Nombre</label>
        <InputText v-model="form.name" placeholder="Razón social" />
        <label>RFC/NIT</label>
        <InputText v-model="form.taxId" placeholder="Identificación fiscal" />
        <label>Email</label>
        <InputText v-model="form.email" placeholder="correo@dominio.com" />
        <label>Teléfono</label>
        <InputText v-model="form.phone" placeholder="555-0000" />
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

