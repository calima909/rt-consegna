import { createApp, ref } from 'vue'
import App from './App.vue'
import { io } from 'socket.io-client'
import { router } from './router'

const socket = io(`http://${window.location.hostname}:3000`)

socket.on('connect', () => {
  console.log('Socket connesso, id =', socket.id)
})

const app = createApp(App)

const gameMode = ref('survival')
const gameSpeed = ref('1')

app.provide('socket', socket)
app.provide('gameMode', gameMode)
app.provide('gameSpeed', gameSpeed)

app.use(router)
app.mount('#app')
