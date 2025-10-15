// Simple localStorage-backed storage with seed data and CRUD helpers

const KEYS = {
  customers: 'erp.customers',
  materials: 'erp.materials',
  invoices: 'erp.invoices'
}

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn('storage read error', key, e)
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('storage write error', key, e)
  }
}

function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function ensureInit() {
  if (!safeRead(KEYS.customers)) {
    safeWrite(KEYS.customers, [
      { id: uid('c_'), name: 'Recicla Norte', taxId: 'RN-123456', email: 'contacto@norte.com', phone: '555-1010' },
      { id: uid('c_'), name: 'EcoSur', taxId: 'ES-987654', email: 'ventas@ecosur.com', phone: '555-2020' }
    ])
  }
  if (!safeRead(KEYS.materials)) {
    safeWrite(KEYS.materials, [
      { id: uid('m_'), name: 'PET', unit: 'kg', price: 0.35 },
      { id: uid('m_'), name: 'HDPE', unit: 'kg', price: 0.50 },
      { id: uid('m_'), name: 'Cartón', unit: 'kg', price: 0.12 }
    ])
  }
  if (!safeRead(KEYS.invoices)) {
    const customers = safeRead(KEYS.customers, [])
    const materials = safeRead(KEYS.materials, [])
    const firstCustomer = customers[0]?.id
    const firstMaterial = materials[0]
    const invoiceId = uid('f_')
    const date = new Date().toISOString().slice(0, 10)
    const items = firstMaterial ? [{ materialId: firstMaterial.id, qty: 100, unitPrice: firstMaterial.price }] : []
    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0)
    const tax = +(subtotal * 0.16).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    safeWrite(KEYS.invoices, [
      { id: invoiceId, number: 'F-0001', date, customerId: firstCustomer, items, subtotal, tax, total }
    ])
  }
}

// Customers
export function getCustomers() {
  return safeRead(KEYS.customers, [])
}
export function saveCustomer(c) {
  const list = getCustomers()
  const created = { ...c, id: uid('c_') }
  list.push(created)
  safeWrite(KEYS.customers, list)
  return created
}
export function updateCustomer(c) {
  const list = getCustomers()
  const idx = list.findIndex(x => x.id === c.id)
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...c }
    safeWrite(KEYS.customers, list)
  }
}
export function deleteCustomer(id) {
  const list = getCustomers().filter(x => x.id !== id)
  safeWrite(KEYS.customers, list)
}
export function findCustomer(id) {
  return getCustomers().find(x => x.id === id)
}

// Materials
export function getMaterials() {
  return safeRead(KEYS.materials, [])
}
export function saveMaterial(m) {
  const list = getMaterials()
  const created = { ...m, id: uid('m_') }
  list.push(created)
  safeWrite(KEYS.materials, list)
  return created
}
export function updateMaterial(m) {
  const list = getMaterials()
  const idx = list.findIndex(x => x.id === m.id)
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...m }
    safeWrite(KEYS.materials, list)
  }
}
export function deleteMaterial(id) {
  const list = getMaterials().filter(x => x.id !== id)
  safeWrite(KEYS.materials, list)
}
export function findMaterial(id) {
  return getMaterials().find(x => x.id === id)
}

// Invoices
export function getInvoices() {
  return safeRead(KEYS.invoices, [])
}
export function addInvoice(inv) {
  const list = getInvoices()
  const id = uid('f_')
  const number = inv.number || `F-${String(list.length + 1).padStart(4, '0')}`
  const items = inv.items || []
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0)
  const tax = +(subtotal * 0.16).toFixed(2)
  const total = +(subtotal + tax).toFixed(2)
  const created = { id, number, date: inv.date, customerId: inv.customerId, items, subtotal, tax, total }
  list.push(created)
  safeWrite(KEYS.invoices, list)
  return created
}
export function deleteInvoice(id) {
  const list = getInvoices().filter(x => x.id !== id)
  safeWrite(KEYS.invoices, list)
}

