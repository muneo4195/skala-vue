import './assets/main.css'
// Element Plus 전체 대신 실제 쓰는 컴포넌트(ElTooltip, ElRate)만 불러와서 번들 크기를 줄임
import 'element-plus/es/components/tooltip/style/css'
import 'element-plus/es/components/rate/style/css'
import 'element-plus/es/components/slider/style/css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElTooltip } from 'element-plus'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElTooltip)

app.mount('#app')
