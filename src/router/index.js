import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import PatientPortal from '../views/PatientPortal.vue'

const routes = [
    { path: '/', name: 'home', component: HomeView },
    { path: '/servicios', name: 'servicios', component: HomeView },
    { path: '/nosotros', name: 'nosotros', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/admin', name: 'admin', component: AdminDashboard },
    { path: '/pacientes', name: 'pacientes', component: PatientPortal }
]

const router = createRouter({
    // Usamos HashHistory para evitar problemas de redirección en GitHub Pages
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to) {
        if (to.path === '/servicios') {
            return { el: '#servicios', behavior: 'smooth' }
        }
        if (to.path === '/nosotros') {
            return { el: '#nosotros', behavior: 'smooth' }
        }
        if (to.hash) {
            return { el: to.hash, behavior: 'smooth' }
        }
        return { top: 0, behavior: 'smooth' }
    }
})

export default router