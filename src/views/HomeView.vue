<template>
  <div class="home">
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
          <button @click="openBookingModal" class="btn btn-primary shadow-pulse">Reservar Cita</button>
          <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'active': mobileMenuOpen }">
      <div class="mobile-links">
        <a href="#inicio" @click="mobileMenuOpen = false">Inicio</a>
        <a href="#servicios" @click="mobileMenuOpen = false">Tratamientos</a>
        <a href="#nosotros" @click="mobileMenuOpen = false">Nosotros</a>
        <router-link to="/pacientes" @click="mobileMenuOpen = false">Portal Pacientes</router-link>
        <router-link to="/login" @click="mobileMenuOpen = false" class="admin-link">Acceso Profesional</router-link>
        <button @click="openBookingModal" class="btn btn-primary mt-4">Reservar Cita</button>
      </div>
    </div>

    <!-- Hero Section -->
    <section id="inicio" class="hero">
      <div class="hero-shape"></div>
      <div class="container hero-content">
        <div class="hero-text fade-in">
          <div class="badge-premium">
            <i class="fas fa-award"></i> Excelencia en Odontología
          </div>
          <h1 class="hero-title">
            Tu sonrisa merece el cuidado de <span class="highlight-text">Expertos</span>
          </h1>
          <p class="hero-subtitle">
            Combina tecnología de vanguardia y un trato humano excepcional en Villa Lugano.
            Resultados naturales que transforman tu bienestar.
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
          <div v-for="service in allServices" :key="service.id" class="service-card-modern">
            <div class="service-icon-wrapper">
              <i :class="service.icon"></i>
            </div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="nosotros" class="section">
      <div class="container split-grid">
        <div class="image-side">
          <div class="exp-badge">
            <span class="num">20+</span>
            <span class="txt">Años de <br>Trayectoria</span>
          </div>
          <img :src="siteConfig.aboutImage" alt="Profesional" class="about-img">
        </div>
        <div class="text-side">
          <span class="tag">Sobre Nosotros</span>
          <h2 class="section-title">Ciencia y <span class="highlight-text">Cercanía</span></h2>
          <p class="about-p">En el Centro Odontológico Integral, brindamos una atención personalizada enfocada en la salud de cada paciente.</p>
          <ul class="feature-checks">
            <li><i class="fas fa-check-circle"></i> Atención especial Martes y Jueves</li>
            <li><i class="fas fa-check-circle"></i> Equipamiento de última generación</li>
            <li><i class="fas fa-check-circle"></i> Ubicación privilegiada en Villa Lugano</li>
          </ul>
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
          <div class="logo-text">
            <span class="brand white">Centro Odontológico Integral</span>
            <span class="sub-brand">Dra. Adriana Pagnotta</span>
          </div>
          <p class="mt-4">Liderando la salud dental en Villa Lugano con profesionalismo y calidez.</p>
        </div>
        <div class="footer-contact">
          <h4>Vía Directa</h4>
          <div class="contact-links">
            <a :href="'tel:' + config.phoneFixed"><i class="fas fa-phone"></i> {{ config.phoneFixed }}</a>
            <a :href="'https://wa.me/549' + config.phoneMobile" target="_blank"><i class="fab fa-whatsapp"></i> {{ config.phoneMobile }}</a>
            <p><i class="fas fa-map-marker-alt"></i> {{ config.address }}</p>
            <p><i class="fas fa-clock"></i> {{ config.hours }}</p>
          </div>
        </div>
        <div class="footer-map">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3280.208119864757!2d-58.47797738837315!3d-34.68597716172561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc968038b348d%3A0xe6bf4ff50d99ef82!2sCosqu%C3%ADn%204809%2C%20C1439%20Cdad.%20Aut%C3%B3noma%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1706660000000!5m2!1ses-419!2sar" 
            width="100%" height="200" style="border:0; border-radius: 1rem;" allowfullscreen="" loading="lazy"></iframe>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Centro Odontológico Integral. Todos los derechos reservados.</p>
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
              <input v-model="form.selectedDate" type="date" :min="today" :filter="onlyTuTh" required>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ChatBot from '../components/ChatBot.vue'
import { allServices, addTurno, registerUser, siteConfig } from '../store'

const scrollY = ref(0)
const mobileMenuOpen = ref(false)
const showModal = ref(false)
const submitting = ref(false)
const success = ref(false)
const activeFaq = ref(0)

const today = new Date().toISOString().split('T')[0]
const feriados = ref([])

const fetchFeriados = async () => {
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/feriados/2026')
    if (res.ok) feriados.value = await res.json()
  } catch (e) { console.error('Error cargando feriados', e) }
}

const updateScroll = () => { scrollY.value = window.scrollY }
onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  fetchFeriados()
})
onUnmounted(() => window.removeEventListener('scroll', updateScroll))

const config = {
  address: 'Cosquín 4809, Villa Lugano, CABA',
  hours: 'Martes y Jueves de 15:30 a 20:00hs',
  phoneFixed: '4601-8957',
  phoneMobile: '1130019567'
}

const services = [
  { title: 'Estética', description: 'Carillas, coronas y diseño de sonrisa.', icon: 'fas fa-gem' },
  { title: 'Ortodoncia', description: 'Brackets metálicos, cerámicos y zafiro.', icon: 'fas fa-teeth-open' },
  { title: 'Implantes', description: 'Reposición dental con tecnología de punta.', icon: 'fas fa-shapes' },
  { title: 'Endodoncia', description: 'Tratamiento de conducto avanzado.', icon: 'fas fa-microscope' },
  { title: 'Periodoncia', description: 'Cuidado especializado de encías.', icon: 'fas fa-hand-holding-medical' },
  { title: 'Odontopediatría', description: 'Atención dental kids con cariño.', icon: 'fas fa-child' }
]

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
  registerUser({
    name: form.value.firstName,
    lastName: form.value.lastName,
    dni: form.value.dni,
    email: form.value.email,
    phone: form.value.phone,
    birthDate: form.value.birthDate,
    password: 'paciente' // Clave por defecto
  })

  addTurno({
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
.navbar { position: fixed; top: 0; width: 100%; padding: 1.5rem 0; transition: 0.4s; z-index: 1000; }
.navbar.scrolled { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 0.8rem 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
.nav-container { display: flex; justify-content: space-between; align-items: center; }
.logo { text-decoration: none; display: flex; align-items: center; gap: 0.8rem; }
.logo-icon { font-size: 2rem; color: #0e7490; }
.brand { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: #0e7490; line-height: 1; display: block; }
.sub-brand { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
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

/* Service Cards Modern */
.bg-light { background: #f1f5f9; }
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 4rem; }
.service-card-modern { background: white; padding: 3rem 2rem; border-radius: 2rem; transition: 0.4s; border-bottom: 5px solid transparent; }
.service-card-modern:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); border-bottom-color: #0e7490; }
.service-icon-wrapper { width: 60px; height: 60px; background: #ecfeff; border-radius: 1.2rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #0e7490; margin-bottom: 2rem; }
.service-card-modern h3 { margin-bottom: 1rem; }
.service-card-modern p { color: #64748b; }

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

.mobile-menu { 
  position: fixed; top: 0; right: -100%; width: 80%; height: 100vh; 
  background: white; z-index: 1500; transition: 0.5s; padding: 6rem 2rem;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
}
.mobile-menu.active { right: 0; }
.mobile-links { display: flex; flex-direction: column; gap: 2rem; }
.mobile-links a { font-size: 1.5rem; font-weight: 700; text-decoration: none; color: #1e293b; }

/* Responsive */
@media (max-width: 992px) {
  .nav-links { display: none; }
  .mobile-menu-btn { display: flex; }
  .hero-content { grid-template-columns: 1fr; text-align: center; }
  .hero-title { font-size: 3rem; }
  .hero-subtitle { margin: 0 auto 3rem; }
  .hero-buttons { justify-content: center; }
  .hero-image-wrapper { display: none; }
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
</style>
