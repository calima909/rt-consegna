import { createRouter, createWebHistory } from 'vue-router'
import Home from './components/Home.vue'
import Game from './components/Game.vue'


const routes = [
  { path: '/', component: Home },

  {
    path: '/:room([a-zA-Z0-9_\\- ]+)/:player([a-zA-Z0-9_\\- ]+)',
    component: Game,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})
