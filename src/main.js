import './assets/main.css'

import {createApp} from 'vue'
import App from './App.vue'

// PrimeVue + Theme
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'


// Components
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
import InputGroupAddon from 'primevue/inputgroupaddon'
import Toast from 'primevue/toast'
import PanelMenu from 'primevue/panelmenu'

// Router
import router from './router'

// Toast service (for notifications)
import ToastService from 'primevue/toastservice'

// Seed local storage with dummy data
import {ensureInit} from './services/storage'



ensureInit()

const app = createApp(App)
app.component('Card', Card)
app.component('Button', Button)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('Select', Select)
app.component('DatePicker', DatePicker)
app.component('Textarea', Textarea)
app.component('Tag', Tag)
app.component('Tabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('Toast', Toast)
app.component('PanelMenu', PanelMenu)


app.use(PrimeVue, {
    theme: {preset: Aura}
})

app.use(ToastService)
app.use(router)

app.mount('#app')
