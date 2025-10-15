<template>
  <section class="p-4 space-y-4">
    <!-- Título y subtítulo -->
    <div>
      <h1 class="text-3xl font-bold text-emerald-700">Gestión de Almacén</h1>
      <p class="text-sm text-gray-600">Registra entradas y salidas de almacén</p>
    </div>

    <!-- Tabs Entrada / Salida (modelo: Tabs + TabList + TabPanels) -->
    <Tabs v-model:activeIndex="activeTab" class="rounded-lg">
      <TabList>
        <Tab :value="0">
          <span class="flex items-center gap-2">
            <i class="pi pi-sign-in" />
            <span>Entrada de Almacén</span>
          </span>
        </Tab>
        <Tab :value="1">
          <span class="flex items-center gap-2">
            <i class="pi pi-sign-out" />
            <span>Salida de Almacén</span>
          </span>
        </Tab>
      </TabList>

      <TabPanels>
        <!-- PANEL 0: Entrada -->
        <TabPanel :value="0">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Columna izquierda: Formulario -->
            <Card class="lg:col-span-2 border rounded-xl shadow-sm">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-box text-gray-700" />
                  <span>Registro de Entrada</span>
                </div>
              </template>
              <template #subtitle>
                <span class="text-sm text-gray-500">Registra una nueva entrada de mercancía al almacén</span>
              </template>

              <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Folio -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Número de Folio</label>
                  <InputGroup>
                    <InputText v-model="form.folio" disabled />
                    <InputGroupAddon>
                      <Button label="Editar" size="small" text @click="editarFolio" />
                    </InputGroupAddon>
                  </InputGroup>
                </div>

                <!-- Fecha -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Fecha</label>
                  <Calendar v-model="form.fecha" date-format="dd/mm/yy" show-icon icon-display="input" class="w-full" />
                </div>

                <!-- Orden de Compra -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Orden de Compra</label>
                  <Dropdown v-model="form.orden" :options="ordenes" optionLabel="label" optionValue="value" placeholder="Seleccionar orden" class="w-full" />
                </div>

                <!-- Kilos -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Kilos</label>
                  <InputNumber v-model="form.kilos" mode="decimal" :minFractionDigits="2" class="w-full" />
                </div>

                <!-- Transportista -->
                <div class="md:col-span-2 flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Nombre del Transportista</label>
                  <InputText v-model="form.transportista" placeholder="Nombre de la empresa transportista" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <!-- Autorizó -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700">Autorizó</label>
                    <InputText v-model="form.autorizo" placeholder="Nombre de quien autoriza" />
                  </div>

                  <!-- Recibió -->
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700">Recibió</label>
                    <InputText v-model="form.recibio" placeholder="Nombre de quien recibe" />
                  </div>
                </div>

                <!-- Observaciones -->
                <div class="md:col-span-2 flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-700">Observaciones</label>
                  <Textarea v-model="form.observaciones" rows="4" auto-resize placeholder="Observaciones adicionales..." />
                </div>

                <div class="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button label="Cancelar" severity="secondary" text @click="resetForm" />
                  <Button label="Guardar" icon="pi pi-save" @click="guardar" />
                </div>
              </div>
            </Card>

            <!-- Columna derecha: Información -->
            <Card class="border rounded-xl shadow-sm">
              <template #title>
                <span>Información</span>
              </template>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Folio:</span>
                  <span class="font-medium">{{ form.folio }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Tipo:</span>
                  <Tag value="Entrada" severity="success" />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Estado:</span>
                  <Tag :value="estado" :severity="estadoSeverity" />
                </div>
              </div>
            </Card>
          </div>
        </TabPanel>

        <!-- PANEL 1: Salida (placeholder) -->
        <TabPanel :value="1">
          <div class="p-4 border rounded-xl text-gray-600">Próximamente: formulario de salida.</div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

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
  { label: 'Seleccionar orden', value: null },
  { label: 'OC-2025-001', value: 'OC-2025-001' },
  { label: 'OC-2025-002', value: 'OC-2025-002' },
  { label: 'OC-2025-003', value: 'OC-2025-003' }
])

const estado = ref('Borrador')
const estadoSeverity = computed(() => (estado.value === 'Borrador' ? 'secondary' : estado.value === 'Enviado' ? 'info' : 'success'))

function editarFolio() { /* ... */ }
function resetForm() {
  form.value = { folio: form.value.folio, fecha: new Date(), orden: null, kilos: 0, transportista: '', autorizo: '', recibio: '', observaciones: '' }
}
function guardar() { /* ... */ }
</script>
