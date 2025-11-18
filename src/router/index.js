import { createRouter, createWebHistory } from "vue-router";

const Dashboard = () => import("../views/Dashboard.vue");
const Customers = () => import("../views/Customers.vue");
const Materials = () => import("../views/Materials.vue");
const Invoices = () => import("../views/Invoices.vue");
const PurchaseOrders = () => import("../views/PurchaseOrders.vue");
const Warehouse = () => import("../views/Warehouse.vue");
const Documents = () => import("../views/Documents.vue");
const Suppliers = () => import("../views/Suppliers.vue");
const Reports = () => import("../views/Reports.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "dashboard", component: Dashboard },
    { path: "/customers", name: "customers", component: Customers },
    { path: "/materials", name: "materials", component: Materials },
    { path: "/invoices", name: "invoices", component: Invoices },
    {
      path: "/purchase-orders",
      name: "purchase-orders",
      component: PurchaseOrders,
    },
    { path: "/warehouse", name: "warehouse", component: Warehouse },
    { path: "/documents", name: "documents", component: Documents },
    { path: "/suppliers", name: "suppliers", component: Suppliers },
    {
      path: "/reports",
      alias: "/reportes",
      name: "reports",
      component: Reports,
    },
  ],
});

export default router;
