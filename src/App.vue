<script setup>
import {ref, computed} from 'vue'
import {useRouter, useRoute} from 'vue-router'

// PrimeVue components
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'

const router = useRouter()
const route = useRoute()

// Drawer state
const expanded = ref(true) // Drawer visible (expandido)
const railWidth = '4rem'
const drawerWidth = '16rem'
const sidebarWidth = computed(() => (expanded.value ? drawerWidth : railWidth))

function toggleDrawer() {
  expanded.value = !expanded.value
}

function go(path) {
  if (route.path !== path) router.push(path)
}

const menuItems = ref([
  {label: 'Dashboard', icon: 'pi pi-home', to: '/', command: () => go('/')},
  {
    label: 'Ordenes de compra',
    icon: 'pi pi-shopping-cart',
    to: '/purchase-orders',
    command: () => go('/purchase-orders')
  },
  {label: 'Almacén', icon: 'pi pi-box', to: '/warehouse', command: () => go('/warehouse')},
  {label: 'Documentos', icon: 'pi pi-file', to: '/documents', command: () => go('/documents')},
  {label: 'Proveedores', icon: 'pi pi-truck', to: '/suppliers', command: () => go('/suppliers')},
  {label: 'Reportes', icon: 'pi pi-chart-bar', to: '/reports', command: () => go('/reports')}
])

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
</script>

<template>
  <Toast/>

  <div class="min-h-screen">
    <!-- Rail colapsado siempre visible -->
    <aside class="fixed inset-y-0 left-0 flex flex-col items-center py-2 gap-2" :style="{ width: railWidth }">
      <div class="flex-1 flex flex-col gap-1 w-full px-1">
        <Button icon="pi pi-bars" text rounded aria-label="Alternar menú" @click="toggleDrawer"/>

        <Button
            v-for="item in menuItems"
            :key="item.label"
            :icon="item.icon"
            text
            rounded
            :aria-label="item.label"
            :title="item.label"
            :severity="isActive(item.to) ? 'primary' : undefined"
            @click="go(item.to)"
        />
      </div>
    </aside>

    <!-- Drawer expandido con etiquetas -->
    <Drawer
        v-model:visible="expanded"
        position="left"
        :modal="false"
        :dismissable="false"
        :showCloseIcon="false"
        :style="{ width: drawerWidth }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <Button icon="pi pi-bars" text rounded aria-label="Colapsar menú" @click="toggleDrawer"/>
          <span class="font-semibold">Recicladora 4R</span>
        </div>
      </template>

      <nav class="p-2 overflow-auto h-full">
        <ul class="flex flex-col gap-1">
          <li v-for="item in menuItems" :key="item.label">
            <Button
                :icon="item.icon"
                :label="item.label"
                class="w-full !justify-start"
                :severity="isActive(item.to) ? 'primary' : undefined"
                text
                @click="go(item.to)"
            />
          </li>
        </ul>
      </nav>
    </Drawer>

    <!-- Contenido principal: respeta el ancho del rail o del drawer -->
    <main class="transition-all duration-200 p-4" :style="{ marginLeft: sidebarWidth }">
      <RouterView/>
    </main>
  </div>
</template>
