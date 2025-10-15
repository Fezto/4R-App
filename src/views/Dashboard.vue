<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import { computed } from 'vue'
import { getCustomers, getMaterials, getInvoices } from '../services/storage'

const customersCount = computed(() => getCustomers().length)
const materialsCount = computed(() => getMaterials().length)
const invoices = computed(() => getInvoices())
const invoicesCount = computed(() => invoices.value.length)
const revenue = computed(() => invoices.value.reduce((s, i) => s + (i.total || 0), 0))
</script>

<template>
  <div class="grid">
    <div class="col">
      <Card>
        <template #title>Clientes</template>
        <template #content>
          <div class="stat">{{ customersCount }}</div>
          <RouterLink to="/customers"><Button label="Ver clientes" icon="pi pi-users" outlined /></RouterLink>
        </template>
      </Card>
    </div>
    <div class="col">
      <Card>
        <template #title>Materiales</template>
        <template #content>
          <div class="stat">{{ materialsCount }}</div>
          <RouterLink to="/materials"><Button label="Ver materiales" icon="pi pi-box" outlined /></RouterLink>
        </template>
      </Card>
    </div>
    <div class="col">
      <Card>
        <template #title>Facturas</template>
        <template #content>
          <div class="stat">{{ invoicesCount }}</div>
          <RouterLink to="/invoices"><Button label="Ver facturas" icon="pi pi-file" outlined /></RouterLink>
        </template>
      </Card>
    </div>
    <div class="col">
      <Card>
        <template #title>Ingresos estimados</template>
        <template #content>
          <div class="stat">${{ revenue.toFixed(2) }}</div>
          <RouterLink to="/invoices"><Button label="Generar factura" icon="pi pi-plus" /></RouterLink>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.stat {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}
.col :deep(.p-card) {
  height: 100%;
}
</style>

