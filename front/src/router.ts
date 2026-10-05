import type { RouteRecordRaw } from 'vue-router'

import Home from './pages/Home.vue'
import Contact from './pages/Contact.vue'
import Playground from './pages/Playground.vue'


export const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/contact',
        name: 'Contact',
        component: Contact
    },
    {
        path: '/playground',
        name: 'Playground',
        component: Playground
    },
]
