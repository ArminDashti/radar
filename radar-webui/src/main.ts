import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import './assets/index.css'
import router from './router'
import { initializeTheme } from './lib/theme'

initializeTheme()
registerSW({ immediate: true })
createApp(App).use(router).mount('#app')
