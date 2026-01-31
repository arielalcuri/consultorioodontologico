<template>
  <div class="patient-portal">
    <nav class="portal-nav">
      <router-link to="/" class="back-link"><i class="fas fa-arrow-left"></i> Volver al Inicio</router-link>
      <div v-if="user" class="user-info">
        <span class="user-display"><i class="fas fa-user-circle"></i> {{ user.name }} {{ user.lastName }}</span>
        <button @click="logout" class="btn-logout">Cerrar Sesión</button>
      </div>
    </nav>

    <!-- Auth Section -->
    <div v-if="!user" class="auth-container scale-in">
      <div class="auth-box glass-morphism">
        <div class="auth-tabs">
          <button :class="{ active: authMode === 'login' }" @click="authMode = 'login'">Ingresar</button>
          <button :class="{ active: authMode === 'register' }" @click="authMode = 'register'">Registrarse</button>
        </div>

        <!-- Login Form -->
        <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <h2>Bienvenido/a</h2>
          <div class="form-group">
            <label>Email</label>
            <input v-model="loginForm.email" type="email" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <div class="password-input-wrapper">
              <input v-model="loginForm.password" :type="showPass ? 'text' : 'password'" required>
              <button type="button" class="eye-btn" @click="showPass = !showPass">
                <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Iniciar Sesión</button>
          <p v-if="authError" class="auth-error mt-4">{{ authError }}</p>
        </form>

        <!-- Register Form -->
        <form v-if="authMode === 'register'" @submit.prevent="handleRegister" class="auth-form">
          <h2>Crear Cuenta</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input v-model="regForm.name" type="text" required>
            </div>
            <div class="form-group">
              <label>Apellido</label>
              <input v-model="regForm.lastName" type="text" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>DNI</label>
              <input v-model="regForm.dni" type="text" required>
            </div>
            <div class="form-group">
              <label>F. Nacimiento</label>
              <input v-model="regForm.birthDate" type="date" required>
            </div>
          </div>
          <div class="form-group">
            <label>Domicilio</label>
            <input v-model="regForm.address" type="text" placeholder="Calle, Número, Localidad" required>
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="regForm.phone" type="tel" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="regForm.email" type="email" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contraseña</label>
              <div class="password-input-wrapper">
                <input v-model="regForm.password" :type="showPassReg ? 'text' : 'password'" required>
                <button type="button" class="eye-btn" @click="showPassReg = !showPassReg">
                  <i :class="showPassReg ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirmar</label>
              <input v-model="regForm.confirmPassword" :type="showPassReg ? 'text' : 'password'" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="regForm.password !== regForm.confirmPassword && regForm.confirmPassword !== ''">
            Registrarse
          </button>
          <p v-if="regForm.password !== regForm.confirmPassword && regForm.confirmPassword !== ''" class="auth-error mt-2">
            Las contraseñas no coinciden
          </p>
        </form>
      </div>
    </div>

    <!-- Portal Content -->
    <div v-else class="portal-content container py-8">
      <div class="portal-layout">
        <!-- Sidebar Patient -->
        <aside class="portal-sidebar glass-morphism">
          <button :class="{ active: view === 'turns' }" @click="view = 'turns'"><i class="fas fa-calendar-alt"></i> Mis Turnos</button>
          <button :class="{ active: view === 'profile' }" @click="view = 'profile'"><i class="fas fa-user-edit"></i> Mi Perfil</button>
          <button @click="openModal" class="btn btn-primary mt-4"><i class="fas fa-plus"></i> Nuevo Turno</button>
        </aside>

        <!-- Main View -->
        <main class="portal-main">
          <section v-if="view === 'turns'" class="scale-in">
            <h1>Mis Solicitudes</h1>
            <div class="turns-grid mt-4">
              <div v-for="t in myTurns" :key="t.id" class="turn-card" :class="t.status">
                <div class="turn-status">{{ t.status }}</div>
                <div class="turn-info">
                  <span class="type">{{ t.type }}</span>
                  <span class="date"><i class="far fa-calendar-alt"></i> {{ formatDate(t.selectedDate) }}</span>
                  <span v-if="t.assignedTime" class="time"><i class="far fa-clock"></i> {{ t.assignedTime }}hs</span>
                  <p class="details">{{ t.details }}</p>
                </div>
              </div>
              <p v-if="myTurns.length === 0" class="no-turns">No tienes turnos agendados.</p>
            </div>
          </section>

          <section v-if="view === 'profile'" class="scale-in">
            <h1>Mis Datos Personales</h1>
            <form @submit.prevent="handleUpdateProfile" class="profile-form glass-morphism mt-4">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre</label>
                  <input v-model="user.name" type="text" required>
                </div>
                <div class="form-group">
                  <label>Apellido</label>
                  <input v-model="user.lastName" type="text" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>DNI</label>
                  <input v-model="user.dni" type="text" required>
                </div>
                <div class="form-group">
                  <label>F. Nacimiento</label>
                  <input v-model="user.birthDate" type="date" required>
                </div>
              </div>
              <div class="form-group">
                <label>Domicilio</label>
                <input v-model="user.address" type="text" required>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="user.phone" type="tel" required>
              </div>
              <div class="form-group">
                <label>Contraseña</label>
                <div class="password-input-wrapper">
                  <input v-model="user.password" :type="showPassProfile ? 'text' : 'password'" required>
                  <button type="button" class="eye-btn" @click="showPassProfile = !showPassProfile">
                    <i :class="showPassProfile ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Actualizar mis datos</button>
            </form>
          </section>
        </main>
      </div>
    </div>

    <!-- Booking Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content glass-morphism scale-in">
        <button @click="showModal = false" class="close-btn">&times;</button>
        <h3>Nueva Solicitud</h3>
        <form @submit.prevent="submitTurno" class="booking-form-fancy mt-4">
          <div class="form-group">
            <label>Especialidad</label>
            <select v-model="newTurno.type" required>
              <option v-for="s in allServices" :key="s.id" :value="s.title">
                {{ s.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha deseada (Mar/Jue)</label>
            <input v-model="newTurno.date" type="date" :min="today" required>
            <p v-if="newTurno.date && !isDateValid && !holidayMsg" class="auth-error mt-2">Atención: Solo Martes y Jueves.</p>
            <p v-if="holidayMsg" class="auth-error mt-2">Feriado: {{ holidayMsg }}</p>
          </div>
          <div class="form-group">
            <label>Mensaje adicional</label>
            <textarea v-model="newTurno.details" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full" :disabled="!isDateValid">Enviar Solicitud</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { allTurnos, addTurno, registerUser, findUser, updateUser, allServices } from '../store'

const user = ref(null)
const view = ref('turns')
const authMode = ref('login')
const showModal = ref(false)
const today = new Date().toISOString().split('T')[0]
const feriados = ref([])

const fetchFeriados = async () => {
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/feriados/2026')
    if (res.ok) feriados.value = await res.json()
  } catch (e) { console.error(e) }
}
fetchFeriados()

const isDateValid = computed(() => {
  if (!newTurno.value.date) return true
  const [y, m, d] = newTurno.value.date.split('-').map(Number)
  const test = new Date(y, m - 1, d)
  const exists = test.getFullYear() === y && test.getMonth() + 1 === m && test.getDate() === d
  const esFeriado = feriados.value.some(f => f.fecha === newTurno.value.date)
  const day = test.getDay()
  const esDiaLaboral = day === 2 || day === 4
  return exists && !esFeriado && esDiaLaboral
})

const holidayMsg = computed(() => {
  return feriados.value.find(f => f.fecha === newTurno.value.date)?.nombre || ''
})

// Visibility controls
const showPass = ref(false)
const showPassReg = ref(false)
const showPassProfile = ref(false)

const loginForm = ref({ email: '', password: '' })
const regForm = ref({ name: '', lastName: '', dni: '', birthDate: '', address: '', email: '', password: '', confirmPassword: '', phone: '' })
const newTurno = ref({ type: 'Estética Dental', date: '', details: '' })
const authError = ref('')

const myTurns = computed(() => {
  if (!user.value) return []
  return allTurnos.value.filter(t => t.email === user.value.email)
})

const handleLogin = () => {
  authError.value = ''
  const found = findUser(loginForm.value.email, loginForm.value.password)
  if (found) {
    user.value = { ...found }
    loginForm.value = { email: '', password: '' }
  } else {
    authError.value = 'Email o contraseña incorrectos.'
  }
}

const handleRegister = () => {
  if (regForm.value.password !== regForm.value.confirmPassword) return
  authError.value = ''
  const newUser = registerUser({
    name: regForm.value.name,
    lastName: regForm.value.lastName,
    dni: regForm.value.dni,
    birthDate: regForm.value.birthDate,
    address: regForm.value.address,
    email: regForm.value.email,
    password: regForm.value.password,
    phone: regForm.value.phone
  })
  user.value = { ...newUser }
  regForm.value = { name: '', lastName: '', dni: '', birthDate: '', address: '', email: '', password: '', confirmPassword: '', phone: '' }
}

const handleUpdateProfile = () => {
  updateUser(user.value.email, user.value)
  alert('Perfil actualizado correctamente.')
}

const logout = () => { user.value = null }
const openModal = () => { showModal.value = true }

const formatDate = (dateStr) => {
  if(!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const submitTurno = () => {
  addTurno({
    firstName: user.value.name,
    lastName: user.value.lastName,
    dni: user.value.dni,
    email: user.value.email,
    phone: user.value.phone,
    type: newTurno.value.type,
    selectedDate: newTurno.value.date,
    details: newTurno.value.details
  })
  showModal.value = false
  newTurno.value = { type: 'Estética Dental', date: '', details: '' }
  alert('Solicitud enviada.')
}
</script>

<style scoped>
.patient-portal { min-height: 100vh; background: #f1f5f9; }
.portal-nav { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.back-link { color: #0e7490; font-weight: 600; text-decoration: none; }
.user-info { display: flex; align-items: center; gap: 1rem; }
.btn-logout { background: #fee2e2; color: #dc2626; border: none; padding: 0.4rem 1rem; border-radius: 5px; cursor: pointer; font-weight: 600; }

.auth-container { display: flex; align-items: center; justify-content: center; padding: 2rem; }
.auth-box { width: 100%; max-width: 500px; background: white; border-radius: 2rem; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
.auth-tabs { display: flex; background: #f8fafc; }
.auth-tabs button { flex: 1; padding: 1.2rem; border: none; background: none; cursor: pointer; font-weight: 700; color: #94a3b8; }
.auth-tabs button.active { background: white; color: #0e7490; border-bottom: 3px solid #0e7490; }
.auth-form { padding: 2rem; }
.auth-form h2 { margin-bottom: 1.5rem; color: #0e7490; font-family: 'Playfair Display', serif; text-align: center; }

.password-input-wrapper { position: relative; display: flex; align-items: center; }
.password-input-wrapper input { width: 100%; padding-right: 3rem; }
.eye-btn { position: absolute; right: 0.8rem; background: none; border: none; color: #0e7490; cursor: pointer; font-size: 1.1rem; }

.portal-layout { display: grid; grid-template-columns: 250px 1fr; gap: 2rem; padding: 2rem; max-width: 1200px; margin: 0 auto; }
.portal-sidebar { background: white; padding: 2rem; border-radius: 2rem; display: flex; flex-direction: column; gap: 1rem; height: fit-content; }
.portal-sidebar button { background: none; border: none; padding: 1rem; text-align: left; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 0.8rem; transition: 0.3s; }
.portal-sidebar button.active { background: #ecfeff; color: #0e7490; }

.profile-form { background: white; padding: 2.5rem; border-radius: 2rem; }

.turns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.turn-card { background: white; padding: 1.5rem; border-radius: 1.2rem; border-left: 6px solid #e2e8f0; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.turn-card.pendiente { border-left-color: #d97706; }
.turn-card.confirmado { border-left-color: #059669; }
.turn-status { position: absolute; top: 1rem; right: 1rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; }

.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
label { font-weight: 700; font-size: 0.85rem; color: #475569; }
input, select, textarea { padding: 0.8rem; border: 2px solid #f1f5f9; border-radius: 0.8rem; font-family: inherit; }
.btn-primary { background: #0e7490; color: white; border: none; padding: 1rem; border-radius: 50px; font-weight: 700; cursor: pointer; }
.btn-full { width: 100%; }
.auth-error { color: #ef4444; font-size: 0.85rem; font-weight: 700; text-align: center; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { width: 100%; max-width: 500px; background: white; border-radius: 2rem; padding: 2.5rem; position: relative; }
.close-btn { position: absolute; top: 1rem; right: 1rem; border: none; background: #f1f5f9; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; }
</style>
