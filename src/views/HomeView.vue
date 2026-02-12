<template>
  <div class="home" :class="{ 'dark-mode': isDarkMode }">
    <!-- Welcome Promo Modal (Step 5) -->
    <div v-if="showPromo" class="modal-overlay" @click.self="showPromo = false" style="z-index: 10000;">
      <div class="promo-card scale-in glass-morphism">
        <button @click="showPromo = false" class="close-promo">&times;</button>
        <div class="promo-badge">¡Oferta Especial! 🎁</div>
        <h2>{{ siteConfig.promo?.title || 'Sonrisa Brillante' }}</h2>
        <p>{{ siteConfig.promo?.text || 'Obtén un descuento especial.' }}</p>
        <button @click="showPromo = false; openBookingModal()" class="btn btn-primary btn-full mt-4">
          {{ siteConfig.promo?.btnText || 'Aprovechar ahora' }}
        </button>
      </div>
    </div>

    <!-- Patient Dashboard Panel (Step 2) -->
    <div v-if="showPatientPanel && currentUser" class="patient-panel-overlay" @click.self="showPatientPanel = false">
       <div class="patient-panel glass-morphism slide-right">
          <div class="panel-header">
             <h3>Hola, {{ currentUser.name }} 👋</h3>
             <button @click="showPatientPanel = false" class="close-panel">&times;</button>
          </div>
          
          <div class="panel-section">
             <h4>🚀 Próximo Turno</h4>
             <div v-if="nextTurn" class="next-turn-card">
                <div class="countdown-badge">En {{ nextTurnCountDown }} días</div>
                <p><strong>{{ nextTurn.type }}</strong></p>
                <p><i class="far fa-calendar-alt"></i> {{ formatDate(nextTurn.selectedDate) }}</p>
                <p><i class="far fa-clock"></i> {{ nextTurn.assignedTime || 'Pendiente de horario' }}</p>
                <div class="panel-actions mt-4">
                   <button @click="cancelTurno(nextTurn.id)" class="btn-text-danger">Cancelar Turno</button>
                </div>
             </div>
             <p v-else class="text-sm text-slate-500">No tienes turnos pendientes de atención.</p>
          </div>

          <div class="panel-section">
             <h4>📜 Historial Reciente</h4>
             <div class="history-list">
                <div v-for="t in pastTurns" :key="t.id" class="history-item">
                   <span class="history-date">{{ formatDate(t.selectedDate) }}</span>
                   <span class="history-type">{{ t.type }}</span>
                </div>
                <p v-if="pastTurns.length === 0" class="text-xs text-slate-400">Sin historial registrado.</p>
             </div>
          </div>

          <button @click="logoutUser" class="btn btn-secondary btn-full mt-auto">Cerrar Sesión</button>
       </div>
    </div>
    <!-- Navbar -->
    <nav class="navbar" :class="{ 'scrolled': scrollY > 50 }">
      <div class="container nav-container">
        <router-link to="/" class="logo">
          <i class="fas fa-tooth logo-icon"></i>
          <div class="logo-text">
            <span class="brand">Centro Odontológico Integral</span>
            <span class="sub-brand">Dra. Adriana Pagnotta</span>
          </div>
        </router-link>
        
        <div class="nav-links">
          <a href="#inicio" class="nav-link">Inicio</a>
          <a href="#servicios" class="nav-link">Tratamientos</a>
          <a href="#nosotros" class="nav-link">Nosotros</a>
          <router-link to="/pacientes" class="nav-link patient-link">Pacientes</router-link>
          <router-link to="/login" class="nav-link admin-link">Acceso Profesional</router-link>
        </div>

        <div class="nav-actions">
          <button @click="isDarkMode = !isDarkMode" class="theme-toggle" title="Cambiar Tema">
            <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
          
          <div v-if="currentUser" class="user-pill" @click="showPatientPanel = !showPatientPanel">
            <i class="fas fa-user-circle"></i>
            <span>{{ currentUser.name }}</span>
          </div>

          <button @click="openBookingModal" class="btn btn-primary shadow-pulse">Reservar Cita</button>
          <button class="mobile-menu-btn" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
     </div>
    </nav>

    <!-- Mobile Menu Overlay (Click Outside to Close) -->
    <div v-show="menuOpen" class="mobile-menu-overlay fade-in" @click="menuOpen = false"></div>

    <!-- Mobile Menu Panel -->
    <div class="mobile-menu" :class="{ 'active': menuOpen }">
      <button class="close-menu-btn" @click="menuOpen = false">
        &times;
      </button>
      <div class="mobile-links">
        <a href="#inicio" @click="menuOpen = false">Inicio</a>
        <a href="#servicios" @click="menuOpen = false">Tratamientos</a>
        <a href="#nosotros" @click="menuOpen = false">Nosotros</a>
        <router-link to="/pacientes" @click="menuOpen = false">Pacientes</router-link>
        <router-link to="/login" class="text-sm font-semibold !text-slate-400 mt-2" @click="menuOpen = false">Acceso Profesional</router-link>
        <button @click="{ openBookingModal(); menuOpen = false }" class="btn btn-primary mt-4">Reservar Cita</button>
      </div>
    </div>

    <!-- Hero Section -->
    <section id="inicio" class="hero">
      <div class="hero-shape"></div>
      <div class="container hero-content">
        <div class="hero-text fade-in">

          <h1 class="hero-title">
            Tu sonrisa merece el cuidado de <span class="highlight-text">Expertos</span>
          </h1>
          <p class="hero-subtitle">
            Brindamos una atención dedicada y un trato humano excepcional en Villa Lugano.
            Resultados naturales que priorizan tu salud y bienestar.
          </p>
          <div class="hero-buttons">
            <button @click="openBookingModal" class="btn btn-primary btn-lg">Agendar ahora</button>
            <a href="#servicios" class="btn btn-outline btn-lg">Nuestros servicios</a>
          </div>
        </div>
        <div class="hero-image-wrapper">
          <div class="glass-float top-right">
            <i class="fas fa-check-circle"></i>
            <span>Implantes Certificados</span>
          </div>
          <img :src="siteConfig.heroImage" alt="Clínica" class="main-hero-img">
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="servicios" class="section bg-light">
      <div class="container">
        <div class="section-header text-center">
          <span class="tag">Tratamientos Especializados</span>
          <h2 class="section-title">Especialidades <span class="highlight-text">Premium</span></h2>
        </div>
        <div class="services-grid">
          <div v-for="service in allServices" :key="service.id" 
               class="service-card-modern" :class="{ 'clickable': service.image }"
               @click="service.image ? openLightbox(service) : null">
            <div class="service-icon-wrapper">
              <i :class="service.icon"></i>
            </div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
            <span v-if="service.image" class="view-more">Ver tratamiento <i class="fas fa-arrow-right"></i></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Lightbox Modal -->
    <div v-if="selectedServiceImg" class="modal-overlay lightbox" @click="selectedServiceImg = null">
      <div class="lightbox-content scale-in" @click.stop>
        <button class="close-lightbox" @click="selectedServiceImg = null">&times;</button>
        <div class="lightbox-img-wrapper">
          <img :src="selectedServiceImg.image" :alt="selectedServiceImg.title">
        </div>
        <div class="lightbox-footer">
          <h3>{{ selectedServiceImg.title }}</h3>
          <p>{{ selectedServiceImg.description }}</p>
        </div>
      </div>
    </div>

    <!-- About Section -->
    <section id="nosotros" class="section">
      <div class="container split-grid">
        <div class="image-side">
          <div class="exp-badge shadow-pulse">
            <span class="num">30+</span>
            <span class="txt">Años de <br>Trayectoria <br><strong>Profesional</strong></span>
          </div>
          <img :src="siteConfig.aboutImage" alt="Profesional" class="about-img">
        </div>
        <div class="text-side">
          <span class="tag">Sobre Nosotros</span>
          <h2 class="section-title"><span class="highlight-text">Cercanía</span></h2>
          <p class="about-p">En el Centro Odontológico Integral, brindamos una atención personalizada enfocada en la salud y el bienestar integral de cada paciente.</p>
          <ul class="feature-checks">
            <li><i class="fas fa-check-circle"></i> <span>Atención dedicada Martes y Jueves</span></li>
            <li><i class="fas fa-check-circle"></i> <span>Ubicación privilegiada en Villa Lugano</span></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonios" class="section">
      <div class="container">
        <div class="section-header text-center">
          <span class="tag">Opiniones Reales</span>
          <h2 class="section-title">Lo que dicen nuestros <span class="highlight-text">Pacientes</span></h2>
        </div>
        <div class="testimonials-widget mt-12">
            <div class="sk-ww-google-reviews" data-embed-id="25649984"></div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="section bg-light">
      <div class="container max-w-2xl">
        <div class="section-header text-center">
          <span class="tag">Dudas comunes</span>
          <h2 class="section-title">Preguntas <span class="highlight-text">Frecuentes</span></h2>
        </div>
        <div class="faq-accordion mt-8">
          <div v-for="(faq, index) in siteConfig.faqs" :key="faq.id" 
               class="faq-item" :class="{ 'active': activeFaq === index }"
               @click="activeFaq = activeFaq === index ? -1 : index">
            <div class="faq-question">
              <h3>{{ faq.q }}</h3>
              <i class="fas" :class="activeFaq === index ? 'fa-minus' : 'fa-plus'"></i>
            </div>
            <div class="faq-answer" v-show="activeFaq === index">
              <p>{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer / Contact Info -->
    <footer id="contacto" class="footer">
      <div class="container footer-grid">
        <div class="footer-info">
          <div class="footer-brand-wrapper" style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-tooth" style="font-size: 2.5rem; color: #22d3ee;"></i>
            <div class="logo-text">
               <span class="brand" style="color: white !important; font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; display: block;">Centro Odontológico Integral</span>
               <span class="sub-brand" style="color: #cbd5e1 !important; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; display: block; margin-top: 5px;">Dra. Adriana Pagnotta</span>
            </div>
          </div>
          <p class="mt-4">Liderando la salud dental en Villa Lugano con profesionalismo y calidez.</p>
        </div>
        <div class="footer-contact">
          <h4>Vía Directa</h4>
          <div class="contact-links">
            <a :href="'tel:' + siteConfig.phoneFixed"><i class="fas fa-phone"></i> {{ siteConfig.phoneFixed }}</a>
            <a :href="'https://wa.me/549' + siteConfig.phoneMobile" target="_blank"><i class="fab fa-whatsapp"></i> {{ siteConfig.phoneMobile }}</a>
            <p><i class="fas fa-map-marker-alt"></i> {{ siteConfig.address }}</p>
            <p><i class="fas fa-clock"></i> {{ siteConfig.hours }}</p>
          </div>
        </div>
        <div class="footer-map">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3280.208119864757!2d-58.47797738837315!3d-34.68597716172561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc968038b348d%3A0xe6bf4ff50d99ef82!2sCosqu%C3%ADn%204809%2C%20C1439%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1706660000000!5m2!1ses-419!2sar" 
            width="100%" height="200" style="border:0; border-radius: 1rem;" allowfullscreen="" loading="lazy"></iframe>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Centro Odontológico Integral Dra. Adriana Pagnotta. Todos los derechos reservados. <span style="opacity:0.5; font-size:0.8em">v1.5</span></p>
      </div>
    </footer>

    <!-- Booking Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeBookingModal">
      <div class="modal-content glass-morphism scale-in">
        <button @click="closeBookingModal" class="close-btn">&times;</button>
        <div class="modal-header">
          <h3>Reservar Cita</h3>
          <p>Dra. Adriana Pagnotta</p>
        </div>
        
        <form @submit.prevent="submitBooking" class="booking-form-fancy">
          <div class="form-row">
            <div class="form-group">
              <label>Apellido</label>
              <input v-model="form.lastName" type="text" placeholder="Ej: Perez" required>
            </div>
            <div class="form-group">
              <label>Nombre</label>
              <input v-model="form.firstName" type="text" placeholder="Ej: Juan" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>DNI / Documento</label>
              <input v-model="form.dni" type="text" required>
            </div>
            <div class="form-group">
              <label>Fecha de Nacimiento</label>
              <input v-model="form.birthDate" type="date" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input v-model="form.phone" type="tel" required>
            </div>
            <div class="form-group">
              <label>Fecha deseada (Mar/Jue)</label>
              <input v-model="form.selectedDate" type="date" :min="today" required>
              <small class="hint">Atención: Martes y Jueves</small>
            </div>
          </div>

          <div class="form-group">
            <label>E-mail</label>
            <input v-model="form.email" type="email" required>
          </div>

          <div class="form-group">
            <label>Especialidad</label>
            <select v-model="form.type" required style="padding: 1rem; border-radius: 1rem; border: 2px solid #f1f5f9; background: #f8fafc;">
               <option v-for="s in allServices" :key="s.id" :value="s.title">{{ s.title }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Motivo de consulta</label>
            <textarea v-model="form.details" rows="3" placeholder="Cuéntenos brevemente qué le sucede..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-full" :disabled="submitting || !isTuTh">
            {{ submitting ? 'Procesando...' : 'Confirmar Petición' }}
          </button>
          
          <p v-if="!isTuTh && form.selectedDate && !currentHoliday" class="error-text">Por favor seleccione un Martes o Jueves.</p>
          <p v-if="currentHoliday" class="error-text">El día seleccionado es feriado: {{ currentHoliday }}</p>
          <p v-if="success" class="success-alert">¡Solicitud enviada! Nos contactaremos para confirmar el horario final.</p>
        </form>
      </div>
    </div>
    <!-- ChatBot -->
    <ChatBot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import ChatBot from '../components/ChatBot.vue'
import { allServices, addTurno, registerUser, siteConfig, botKnowledge, isDarkMode, currentUser, allTurnos, logout, updateTurno, deleteTurno } from '../store'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const showPatientPanel = ref(false)
const showPromo = ref(false)

const nextTurn = computed(() => {
   if (!currentUser.value) return null
   // Filtrar turnos del usuario que sean hoy o en el futuro
   const now = new Date().toISOString().split('T')[0]
   return allTurnos.value
     .filter(t => t.dni === currentUser.value.dni && t.selectedDate >= now)
     .sort((a, b) => a.selectedDate.localeCompare(b.selectedDate))[0]
})

const nextTurnCountDown = computed(() => {
   if (!nextTurn.value) return 0
   const diff = new Date(nextTurn.value.selectedDate).getTime() - new Date().getTime()
   return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const pastTurns = computed(() => {
   if (!currentUser.value) return []
   const now = new Date().toISOString().split('T')[0]
   return allTurnos.value
     .filter(t => t.dni === currentUser.value.dni && t.selectedDate < now)
     .sort((a,b) => b.selectedDate.localeCompare(a.selectedDate))
     .slice(0, 3)
})

const logoutUser = () => {
   logout()
   showPatientPanel.value = false
}

const cancelTurno = (id) => {
   if (confirm('¿Estás seguro de que deseas cancelar este turno?')) {
      deleteTurno(id)
   }
}

const formatDate = (dateStr) => {
  if(!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const scrollY = ref(0)
const mobileMenuOpen = ref(false)
const showModal = ref(false)
const menuOpen = ref(false)
const submitting = ref(false)
const success = ref(false)
const activeFaq = ref(-1)
const selectedServiceImg = ref(null)

const toggleMenu = () => {
    menuOpen.value = !menuOpen.value
}

const openLightbox = (service) => {
  selectedServiceImg.value = service
}

const today = new Date().toISOString().split('T')[0]
const feriados = ref([])

const fetchFeriados = async () => {
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/feriados/2026')
    if (res.ok) feriados.value = await res.json()
  } catch (e) { console.error('Error cargando feriados', e) }
}

const updateScroll = () => { scrollY.value = window.scrollY }

onMounted(async () => {
  window.addEventListener('scroll', updateScroll)
  fetchFeriados()
  
  // Mostrar promo si está habilitada y no se mostró en esta sesión
  if (siteConfig.value.promo?.enabled && !sessionStorage.getItem('promo_shown')) {
     setTimeout(() => {
        showPromo.value = true
        sessionStorage.setItem('promo_shown', 'true')
     }, 4000)
  }
  
  // SociableKit Script Injection
  const scriptId = 'SociableKitScript'
  if (!document.getElementById(scriptId)) {
    const js = document.createElement('script')
    js.id = scriptId
    js.src = "https://widgets.sociablekit.com/google-reviews/widget.js"
    js.defer = true
    document.head.appendChild(js)
  }

  // Cargar datos desde Firebase para asegurar que los pacientes vean lo último editado
  try {
    const siteSnap = await getDoc(doc(db, 'config', 'site'))
    if (siteSnap.exists()) {
      Object.assign(siteConfig.value, siteSnap.data())
    }
    
    const servSnap = await getDoc(doc(db, 'config', 'services'))
    if (servSnap.exists() && servSnap.data().list) {
      allServices.value = servSnap.data().list
    }

    const botSnap = await getDoc(doc(db, 'config', 'chatbot'))
    if (botSnap.exists()) {
      Object.assign(botKnowledge.value, botSnap.data())
    }
  } catch (err) {
    console.warn('Usando datos locales:', err)
  }
})
onUnmounted(() => window.removeEventListener('scroll', updateScroll))

// Los datos de configuración y servicios ahora se manejan centralizadamente en store.js y se sincronizan con Firestore

const form = ref({
  lastName: '', firstName: '', dni: '', birthDate: '',
  phone: '', email: '', selectedDate: '', details: ''
})

const openBookingModal = () => {
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeBookingModal = () => {
  showModal.value = false
  document.body.style.overflow = 'auto'
}

const isTuTh = computed(() => {
  if (!form.value.selectedDate) return true
  
  // 1. Validar si la fecha existe físicamente (ej: 29 de febrero en años no bisiestos)
  const parts = form.value.selectedDate.split('-')
  const y = parseInt(parts[0])
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  const testDate = new Date(y, m - 1, d)
  if (testDate.getFullYear() !== y || testDate.getMonth() + 1 !== m || testDate.getDate() !== d) return false

  // 2. Validar si es feriado
  const esFeriado = feriados.value.some(f => f.fecha === form.value.selectedDate)
  if (esFeriado) return false

  // 3. Validar Martes (2) o Jueves (4)
  const day = testDate.getDay()
  return day === 2 || day === 4
})

const currentHoliday = computed(() => {
  return feriados.value.find(f => f.fecha === form.value.selectedDate)?.nombre || ''
})

const submitBooking = async () => {
  if (!isTuTh.value) return
  submitting.value = true
  
  // Registrar al usuario automáticamente si no existe para que el ChatBot lo reconozca
  await registerUser({
    name: form.value.firstName,
    lastName: form.value.lastName,
    dni: form.value.dni,
    email: form.value.email,
    phone: form.value.phone,
    birthDate: form.value.birthDate,
    password: 'paciente' // Clave por defecto
  })

  await addTurno({
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    dni: form.value.dni,
    birthDate: form.value.birthDate,
    email: form.value.email,
    phone: form.value.phone,
    type: form.value.type || (allServices.value[0]?.title),
    selectedDate: form.value.selectedDate,
    details: form.value.details
  })

  setTimeout(() => {
    submitting.value = false
    success.value = true
    setTimeout(() => {
      closeBookingModal()
      success.value = false
      Object.keys(form.value).forEach(k => form.value[k] = '')
    }, 2000)
  }, 1000)
}
</script>

<style scoped>
/* Reset & Base */
.home { color: #1e293b; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.section { padding: 6rem 0; }
.tag { color: #0e7490; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; margin-bottom: 1rem; display: inline-block; }
.highlight-text { color: #0e7490; position: relative; }
.highlight-text::after { content: ''; position: absolute; bottom: 5px; left: 0; width: 100%; height: 10px; background: rgba(34, 211, 238, 0.2); z-index: -1; }

/* Navbar */
.navbar { position: fixed; top: 0; left: 0; width: 100%; height: 80px; padding: 0.5rem 0; transition: 0.4s; z-index: 1200; background: rgba(255,255,255,0.98); backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.05); display: flex; align-items: center; }
.navbar.scrolled { height: 70px; }
.nav-container { display: flex; justify-content: space-between; align-items: center; width: 100%; position: relative; }
.logo { text-decoration: none; display: flex; align-items: center; gap: 0.8rem; z-index: 1300; }
.logo-icon { font-size: 2.2rem; color: #0e7490; transition: transform 0.3s; }
.logo:hover .logo-icon { transform: rotate(20deg); }
.logo .brand { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: #0e7490; line-height: 1.1; display: block; }
.logo .sub-brand { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 500; }
.nav-actions { display: flex; align-items: center; gap: 1rem; z-index: 1300; }
.nav-links { display: flex; gap: 2.5rem; }
.nav-link { text-decoration: none; color: #1e293b; font-weight: 600; font-size: 0.95rem; transition: 0.3s; }
.nav-link:hover { color: #0e7490; }
.admin-link { color: #64748b; font-size: 0.8rem; border: 1px solid #e2e8f0; padding: 0.4rem 1rem; border-radius: 50px; }

/* Buttons */
.btn { border: none; padding: 0.8rem 2rem; border-radius: 50px; font-weight: 700; cursor: pointer; transition: 0.3s; font-family: 'Outfit', sans-serif; display: inline-block; text-decoration: none; }
.btn-primary { background: #0e7490; color: white; box-shadow: 0 8px 20px rgba(14, 116, 144, 0.3); }
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(14, 116, 144, 0.4); }
.btn-outline { border: 2px solid #0e7490; color: #0e7490; background: transparent; }
.btn-lg { padding: 1.1rem 2.8rem; font-size: 1.1rem; }
.btn-full { width: 100%; margin-top: 1rem; }

/* Hero */
.hero { min-height: 100vh; display: flex; align-items: center; background: #f8fafc; position: relative; overflow: hidden; padding-top: 80px; }
.hero-shape { position: absolute; top: -10%; right: -5%; width: 50%; height: 120%; background: #0e7490; clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%); opacity: 0.05; }
.hero-content { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 4rem; align-items: center; position: relative; z-index: 10; }
.hero-title { font-size: 4rem; margin-bottom: 2rem; font-family: 'Playfair Display', serif; }
.hero-subtitle { font-size: 1.2rem; color: #64748b; margin-bottom: 3rem; max-width: 550px; }
.badge-premium { display: inline-flex; align-items: center; gap: 0.5rem; background: #ecfeff; color: #0e7490; padding: 0.5rem 1.2rem; border-radius: 50px; font-weight: 700; font-size: 0.85rem; margin-bottom: 2rem; }
.hero-buttons { display: flex; gap: 1.5rem; }
.hero-image-wrapper { position: relative; }
.main-hero-img { width: 100%; border-radius: 3rem; box-shadow: 30px 30px 0 #0e749010; transition: 0.5s; }
.glass-float { position: absolute; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); padding: 1rem 1.5rem; border-radius: 1.5rem; display: flex; align-items: center; gap: 0.8rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); font-weight: 700; color: #1e293b; z-index: 20; }
.top-right { top: 10%; right: -20px; }

/* About Section */
.split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; }
.image-side { position: relative; }
.about-img { width: 100%; border-radius: 2.5rem; box-shadow: 20px 20px 60px rgba(0,0,0,0.1); border: 8px solid white; transition: 0.5s; }
.about-img:hover { transform: scale(1.02); }

.exp-badge { 
  position: absolute; bottom: -30px; left: -30px; 
  background: linear-gradient(135deg, #0e7490, #22d3ee); 
  color: white; padding: 2rem; border-radius: 2rem; 
  display: flex; align-items: center; gap: 1.2rem; 
  box-shadow: 0 20px 40px rgba(14, 116, 144, 0.4); z-index: 10;
  border: 4px solid white;
}
.exp-badge .num { font-size: 3rem; font-weight: 800; line-height: 1; font-family: 'Playfair Display', serif; }
.exp-badge .txt { font-size: 0.85rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; line-height: 1.4; opacity: 0.9; }
.exp-badge .txt strong { display: block; font-size: 1rem; color: #fff; margin-top: 2px; }

.text-side { padding-left: 2rem; }
.about-p { font-size: 1.15rem; color: #475569; margin-bottom: 2.5rem; line-height: 1.8; }
.feature-checks { list-style: none; display: flex; flex-direction: column; gap: 1.2rem; }
.feature-checks li { display: flex; align-items: center; gap: 1rem; font-weight: 600; color: #1e293b; font-size: 1.05rem; }
.feature-checks li i { color: #0e7490; font-size: 1.4rem; filter: drop-shadow(0 4px 6px rgba(14, 116, 144, 0.2)); }

/* Service Cards Modern */
.bg-light { background: #f1f5f9; }
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 4rem; }
.service-card-modern { background: white; padding: 3rem 2rem; border-radius: 2rem; transition: 0.4s; border-bottom: 5px solid transparent; }
.service-card-modern:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); border-bottom-color: #0e7490; }
.service-card-modern.clickable { cursor: pointer; }
.service-icon-wrapper { width: 60px; height: 60px; background: #ecfeff; border-radius: 1.2rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #0e7490; margin-bottom: 2rem; }
.service-card-modern h3 { margin-bottom: 1rem; }
.service-card-modern p { color: #64748b; }
.view-more { display: inline-block; margin-top: 1.5rem; color: #0e7490; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }

/* Lightbox Styles */
.lightbox { z-index: 3000; }
.lightbox-content { width: 90%; max-width: 900px; background: white; border-radius: 2rem; overflow: hidden; position: relative; }
.close-lightbox { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(0,0,0,0.5); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
.close-lightbox:hover { background: rgba(0,0,0,0.8); transform: rotate(90deg); }
.lightbox-img-wrapper { width: 100%; height: auto; max-height: 70vh; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.lightbox-img-wrapper img { max-width: 100%; max-height: 70vh; object-fit: contain; }
.lightbox-footer { padding: 2.5rem; text-align: center; }
.lightbox-footer h3 { font-size: 1.8rem; color: #0e7490; margin-bottom: 0.5rem; font-family: 'Playfair Display', serif; }
.lightbox-footer p { color: #64748b; font-size: 1.1rem; }

/* Modal & Form */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
.glass-morphism { background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-content { width: 100%; max-width: 650px; border-radius: 2.5rem; padding: 3rem; position: relative; max-height: 90vh; overflow-y: auto; }
.modal-header { text-align: center; margin-bottom: 2.5rem; }
.modal-header h3 { font-size: 2rem; color: #0e7490; }
.close-btn { position: absolute; top: 2rem; right: 2rem; border: none; background: #f1f5f9; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; }

.booking-form-fancy { display: grid; gap: 1.5rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
label { font-weight: 700; font-size: 0.85rem; color: #475569; }
input, textarea { padding: 1rem; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 1rem; font-family: inherit; transition: 0.3s; color: #1e293b; }
input:focus, textarea:focus { outline: none; border-color: #0e7490; background: white; color: #0f172a; }
input::placeholder, textarea::placeholder { color: #94a3b8; }
.hint { font-size: 0.75rem; color: #0e7490; font-weight: 600; margin-top: 0.2rem; }
.error-text { color: #ef4444; font-size: 0.9rem; font-weight: 600; text-align: center; }
.success-alert { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 1rem; text-align: center; font-weight: 700; margin-top: 1rem; }

/* Footer */
.footer { background: #0f172a; color: white; padding: 5rem 0 2rem; }
/* Footer Branding Force */
footer .logo-text .brand { color: white !important; }
footer .logo-text .sub-brand { color: #cbd5e1 !important; }
.footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 4rem; }
.white { color: white !important; }
.footer-contact h4 { margin-bottom: 2rem; color: #22d3ee; }
.contact-links { display: flex; flex-direction: column; gap: 1.2rem; }
.contact-links a { color: #94a3b8; text-decoration: none; display: flex; align-items: center; gap: 0.8rem; transition: 0.3s; }
.contact-links a:hover { color: white; }
.footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); margin-top: 4rem; padding-top: 2rem; text-align: center; color: #475569; font-size: 0.9rem; }

/* Mobile Menu Toggle */
.mobile-menu-btn { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 0.5rem; }
.mobile-menu-btn span { width: 25px; height: 3px; background: #0e7490; border-radius: 3px; transition: 0.3s; }

.mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); z-index: 2000; backdrop-filter: blur(5px); }
.mobile-menu { 
  position: fixed; top: 0; right: -100%; width: 85%; max-width: 350px; height: 100vh; 
  background: white; z-index: 2100; transition: cubic-bezier(0.4, 0, 0.2, 1) 0.4s; padding: 6rem 2rem;
  box-shadow: -10px 0 30px rgba(0,0,0,0.2);
}
.mobile-menu.active { right: 0; }
.close-menu-btn { 
  position: absolute; top: 1.5rem; right: 1.5rem; 
  background: #f1f5f9; border: 2px solid #e2e8f0; 
  font-size: 1.8rem; color: #0e7490; font-family: sans-serif; font-weight: bold;
  width: 50px; height: 50px; border-radius: 50%; 
  display: flex !important; align-items: center; justify-content: center; 
  cursor: pointer; z-index: 2200; box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
}
.close-menu-btn:hover { background: #e2e8f0; transform: rotate(90deg); }
.mobile-links { display: flex; flex-direction: column; gap: 2rem; }
.mobile-links a { font-size: 1.4rem; font-weight: 700; text-decoration: none; color: #1e293b; display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; transition: 0.3s; }
.mobile-links a:hover { color: #0e7490; padding-left: 10px; border-color: #e2e8f0; }

/* Responsive */
@media (max-width: 992px) {
  .nav-links { display: none; }
  .mobile-menu-btn { display: flex; }
  .navbar { padding: 0.5rem 0; }
  .hero-content { grid-template-columns: 1fr; text-align: center; }
  .hero-title { font-size: 2.5rem; }
  .hero-subtitle { margin: 0 auto 3rem; }
  .hero-buttons { justify-content: center; }
  .hero-image-wrapper { 
    display: block; 
    margin-top: 3rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .main-hero-img { 
    border-radius: 2rem;
    box-shadow: 15px 15px 0 #0e749010;
  }
  .glass-float { display: none; }
  .footer-grid { grid-template-columns: 1fr; gap: 3rem; }
}
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .modal-content { padding: 2rem 1.5rem; }
}

/* Animations */
.fade-in { animation: fadeIn 1s ease-out; }
.scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* FAQ Styles */
.max-w-2xl { max-width: 800px !important; }
.faq-accordion { display: flex; flex-direction: column; gap: 1rem; }
.faq-item { background: white; border-radius: 1.5rem; padding: 1.5rem 2rem; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 2px solid transparent; }
.faq-item:hover { border-color: #0e7490; transform: translateY(-3px); }
.faq-item.active { border-color: #0e7490; background: #ecfeff; }
.faq-question { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.faq-question h3 { font-size: 1.1rem; font-weight: 700; margin: 0; color: #1e293b; }
.faq-question i { color: #0e7490; font-size: 0.9rem; }
.faq-answer { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(14, 116, 144, 0.1); animation: fadeIn 0.4s ease-out; }
.faq-answer p { color: #64748b; line-height: 1.7; margin: 0; }

/* Testimonials Styles */
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.review-card { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; transition: 0.3s; display: flex; flex-direction: column; }
.review-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-color: #0e7490; }
.review-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.reviewer-avatar { width: 45px; height: 45px; background: #eab308; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; text-transform: uppercase; }
.reviewer-info h4 { margin: 0; font-size: 1rem; color: #1e293b; font-weight: 700; }
.stars { font-size: 0.85rem; display: flex; gap: 2px; }
.stars .gold { color: #f59e0b; }
.stars .gray { color: #cbd5e1; }
.google-icon { margin-left: auto; color: #ea4335; font-size: 1.5rem; opacity: 0.8; }
.review-text { font-size: 1rem; font-style: italic; color: #475569; margin-bottom: 1rem; line-height: 1.6; flex-grow: 1; }
.review-date { font-size: 0.8rem; color: #94a3b8; text-align: right; display: block; }

@media (max-width: 768px) {
  .testimonials-grid { grid-template-columns: 1fr; }
}

/* New Features Styles (Profile, Dark Mode, Promo) */
.home.dark-mode { background-color: var(--bg-primary); color: var(--text-primary); }
.home.dark-mode .navbar { background: rgba(15, 23, 42, 0.9); border-bottom-color: var(--border-color); }
.home.dark-mode .navbar.scrolled { background: var(--bg-primary); }
.home.dark-mode .service-card-modern, 
.home.dark-mode .faq-item, 
.home.dark-mode .review-card,
.home.dark-mode .section.bg-light,
.home.dark-mode .modal-content,
.home.dark-mode .promo-card,
.home.dark-mode .next-turn-card { border-color: var(--border-color); }

.home.dark-mode .service-card-modern,
.home.dark-mode .faq-item,
.home.dark-mode .review-card {
    background: var(--bg-secondary);
    color: var(--text-primary);
}

.home.dark-mode .section.bg-light { background: #0f172a !important; }
.home.dark-mode h1, .home.dark-mode h2, .home.dark-mode h3, .home.dark-mode h4, .home.dark-mode .brand { color: var(--text-primary); }
.home.dark-mode .hero-subtitle, .home.dark-mode .faq-answer p, .home.dark-mode .review-text { color: var(--text-secondary); }

.nav-actions { display: flex; align-items: center; gap: 1rem; }
.theme-toggle { background: var(--bg-secondary); border: 1px solid var(--border-color); width: 40px; height: 40px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; color: var(--brand-primary); display: flex; align-items: center; justify-content: center; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.theme-toggle:hover { transform: rotate(15deg) scale(1.1); background: var(--brand-primary); color: white; }

.user-pill { display: flex; align-items: center; gap: 0.6rem; background: var(--brand-primary); color: white; padding: 0.5rem 1.2rem; border-radius: 50px; cursor: pointer; transition: 0.3s; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(14, 116, 144, 0.3); }
.user-pill:hover { transform: translateY(-2px); filter: brightness(1.1); }

.promo-card { position: relative; width: 90%; max-width: 400px; padding: 2.5rem; text-align: center; border-radius: 2.5rem; border-top: 5px solid var(--brand-primary); animation: slideUp 0.5s ease; }
.promo-badge { background: #fef3c7; color: #d97706; font-weight: 800; font-size: 0.75rem; padding: 0.4rem 1rem; border-radius: 50px; display: inline-block; margin-bottom: 1.2rem; }
.promo-card h2 { font-family: 'Playfair Display', serif; font-size: 1.8rem; margin-bottom: 0.5rem; }
.close-promo { position: absolute; top: 1.2rem; right: 1.2rem; border: none; background: #f1f5f9; width: 30px; height: 30px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; color: #475569; display: flex; align-items: center; justify-content: center; }

.patient-panel-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 9000; display: flex; justify-content: flex-end; }
.patient-panel { width: 100%; max-width: 380px; height: 100%; padding: 2.5rem; display: flex; flex-direction: column; gap: 2rem; box-shadow: -15px 0 50px rgba(0,0,0,0.15); border-left: 1px solid var(--border-color); }
.panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
.panel-header h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; }
.close-panel { font-size: 2rem; border: none; background: none; cursor: pointer; color: var(--text-secondary); line-height: 1; }
.panel-section h4 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--brand-primary); margin-bottom: 1.5rem; font-weight: 800; }
.next-turn-card { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color: white; padding: 1.8rem; border-radius: 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(14, 116, 144, 0.3); }
.countdown-badge { position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.15); padding: 0.6rem 1.2rem; border-bottom-left-radius: 1.5rem; font-size: 0.75rem; font-weight: 900; letter-spacing: 0.5px; }
.next-turn-card p { margin: 0.4rem 0; font-size: 1rem; font-weight: 500; }
.next-turn-card i { margin-right: 8px; opacity: 0.8; }
.btn-text-danger { background: none; border: none; color: #fee2e2; font-size: 0.85rem; cursor: pointer; padding: 0.5rem 0; opacity: 0.8; font-weight: 600; }
.btn-text-danger:hover { opacity: 1; text-decoration: underline; }
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-item { display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-primary); border-radius: 1rem; border: 1px solid var(--border-color); font-size: 0.9rem; transition: 0.3s; }
.history-item:hover { transform: scale(1.02); border-color: var(--brand-primary); }
.history-date { font-weight: 800; color: var(--brand-primary); }
.history-type { color: var(--text-primary); }

.slide-right { animation: slideRight 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); }
@keyframes slideRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>