<template>
  <section class="p-4 space-y-4">
    <!-- Título y subtítulo -->
    <div>
      <h1 class="text-3xl font-bold">Gestión de Almacén</h1>
      <p class="text-sm">Registra entradas y salidas de almacén</p>
    </div>

    <!-- Tabs Entrada / Salida -->
    <Tabs value="0">
      <TabList>
        <Tab value="0">
          <span class="flex items-center gap-2">
            <i class="pi pi-sign-in"/>
            <span>Entrada de Almacén</span>
          </span>
        </Tab>
        <Tab value="1">
          <span class="flex items-center gap-2">
            <i class="pi pi-sign-out"/>
            <span>Salida de Almacén</span>
          </span>
        </Tab>
      </TabList>

      <TabPanels>
        <!-- PANEL 0: Entrada -->
        <TabPanel value="0">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <!-- Columna izquierda: Formulario -->
            <Card class="lg:col-span-2">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-box"/>
                  <span>Registro de Entrada</span>
                </div>
              </template>
              <template #subtitle>
                <span class="text-sm">Registra una nueva entrada de mercancía al almacén</span>
              </template>
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Folio -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Número de Folio</label>
                    <InputGroup>
                      <InputText v-model="form.folio" disabled/>
                      <Button label="Editar" size="small" text @click="editarFolio"/>
                    </InputGroup>
                  </div>

                  <!-- Fecha -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Fecha</label>
                    <DatePicker v-model="form.fecha" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="w-full"/>
                  </div>

                  <!-- Orden de Compra -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Orden de Compra</label>
                    <Select v-model="form.orden" :options="ordenes" optionLabel="label" optionValue="value"
                            placeholder="Seleccionar orden" class="w-full"/>
                  </div>

                  <!-- Kilos -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Kilos</label>
                    <InputNumber v-model="form.kilos" mode="decimal" :minFractionDigits="2" class="w-full"/>
                  </div>

                  <!-- Transportista -->
                  <div class="md:col-span-2 flex flex-col gap-2">
                    <label class="text-sm font-medium">Nombre del Transportista</label>
                    <InputText v-model="form.transportista" placeholder="Nombre de la empresa transportista"/>
                  </div>

                  <!-- Autorizó -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Autorizó</label>
                    <InputText v-model="form.autorizo" placeholder="Nombre de quien autoriza"/>
                  </div>

                  <!-- Recibió -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium">Recibió</label>
                    <InputText v-model="form.recibio" placeholder="Nombre de quien recibe"/>
                  </div>

                  <!-- Observaciones -->
                  <div class="md:col-span-2 flex flex-col gap-2">
                    <label class="text-sm font-medium">Observaciones</label>
                    <Textarea v-model="form.observaciones" rows="4" autoResize
                              placeholder="Observaciones adicionales..."/>
                  </div>

                  <div class="md:col-span-2 flex justify-end gap-2 pt-2">
                    <Button label="Cancelar" severity="secondary" text @click="resetForm"/>
                    <Button label="Guardar" icon="pi pi-save" @click="guardar"/>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Columna derecha: Información -->
            <Card>
              <template #title>
                <span>Información</span>
              </template>
              <template #content>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span>Folio:</span>
                    <span class="font-medium">{{ form.folio }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Tipo:</span>
                    <Tag value="Entrada" severity="success"/>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Estado:</span>
                    <Tag :value="estado" :severity="estadoSeverity"/>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- PANEL 1: Salida (placeholder) -->
        <TabPanel value="1">
          <div class="p-4 mt-4">Próximamente: formulario de salida.</div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup>
import {ref, computed} from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputGroup from 'primevue/inputgroup'

const activeTab = ref(0)

// Datos de ejemplo / estado del formulario
const form = ref({
  folio: 'ALM-2025-095',
  fecha: new Date(),
  orden: null,
  kilos: 0,
  transportista: '',
  autorizo: '',
  recibio: '',
  observaciones: ''
})

const ordenes = ref([
  {label: 'Seleccionar orden', value: null},
  {label: 'OC-2025-001', value: 'OC-2025-001'},
  {label: 'OC-2025-002', value: 'OC-2025-002'},
  {label: 'OC-2025-003', value: 'OC-2025-003'}
])

const estado = ref('Borrador')
const estadoSeverity = computed(() => (estado.value === 'Borrador' ? 'secondary' : estado.value === 'Enviado' ? 'info' : 'success'))

function editarFolio() {
  // Aquí podrías abrir un dialog para editar folio
}

function resetForm() {
  form.value = {
    folio: form.value.folio,
    fecha: new Date(),
    orden: null,
    kilos: 0,
    transportista: '',
    autorizo: '',
    recibio: '',
    observaciones: ''
  }
}

function guardar() {
  // Validación mínima de ejemplo
  // En un caso real, dispararías un request o guardarías en storage/servicio
}
</script>
