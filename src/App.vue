<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// PrimeVue components


const router = useRouter()
const route = useRoute()

const collapsed = ref(false)

function go(path) {
  if (route.path !== path) router.push(path)
}

const menuItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', to: '/', command: () => go('/') },
  { label: 'Ordenes de compra', icon: 'pi pi-shopping-cart', to: '/purchase-orders', command: () => go('/purchase-orders') },
  { label: 'Almacén', icon: 'pi pi-box', to: '/warehouse', command: () => go('/warehouse') },
  { label: 'Documentos', icon: 'pi pi-file', to: '/documents', command: () => go('/documents') },
  { label: 'Proveedores', icon: 'pi pi-truck', to: '/suppliers', command: () => go('/suppliers') },
  { label: 'Reportes', icon: 'pi pi-chart-bar', to: '/reports', command: () => go('/reports') }
])

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
const sidebarWidth = computed(() => (collapsed.value ? '4rem' : '16rem'))
</script>

<template>
  <Toast />

  <div class="min-h-screen">
    <aside :class="['fixed inset-y-0 left-0 border  flex flex-col transition-all duration-200 ']" :style="{ width: sidebarWidth }">
      <div class="flex items-center gap-2 p-3 border-b">
        <Button icon="pi pi-bars" text rounded aria-label="Alternar menú" @click="collapsed = !collapsed" />
        <span v-if="!collapsed" class="font-semibold">4R</span>
      </div>

      <div class="p-2 overflow-auto flex-1">
        <!-- Expandido: PanelMenu con etiquetas -->
        <PanelMenu v-if="!collapsed" :model="menuItems" />

        <!-- Colapsado: menú vertical solo íconos -->
        <div v-else class="flex flex-col gap-1 pt-1">
          <Button
            v-for="item in menuItems"
            :key="item.label"
            :icon="item.icon"
            text
            rounded
            class="justify-center w-full"
            :aria-label="item.label"
            :title="item.label"
            :severity="isActive(item.to) ? 'primary' : undefined"
            @click="go(item.to)"
          />
        </div>
      </div>
    </aside>

    <main class="transition-all duration-200 p-4" :style="{ marginLeft: sidebarWidth }">
      <RouterView />
    </main>
  </div>
</template>
