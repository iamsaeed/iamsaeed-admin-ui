import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import '@ui/styles/phone-flags.css'
import './styles.css'

createApp(App).use(router).mount('#app')
