<template>
  <div class="admin-dashboard">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>Admin Pagnotta</h3>
      </div>
      <nav class="sidebar-nav">
        <button v-for="tab in tabs" :key="tab.id" 
                :class="{ active: currentTab === tab.id }"
                @click="currentTab = tab.id">
          <i :class="tab.icon"></i> {{ tab.name }}
          <span v-if="tab.id === 'solicitudes' && pendingCount > 0" class="badge-count">{{ pendingCount }}</span>
        </button>
        <button @click="currentTab = 'web'" :class="{ active: currentTab === 'web' }">
          <i class="fas fa-globe"></i> Web
        </button>
      </nav>
      <button class="logout-btn" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
      </button>
    </aside>

    <main class="content">
      <header class="content-header">
        <h2>{{ tabs.find(t => t.id === currentTab)?.name }}</h2>
      </header>

      <!-- Solicitudes Tab -->
      <section v-if="currentTab === 'solicitudes'" class="tab-content">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Datos</th>
                <th>Especialidad / Motivo</th>
                <th>Fecha Solicitada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="turno in pendingTurnos" :key="turno.id">
                <td>
                  <strong>{{ turno.lastName }}, {{ turno.firstName }}</strong>
                  <div class="dni-text">DNI: {{ turno.dni }}</div>
                </td>
                <td>
                  <div class="contact-info">
                    <small><i class="fas fa-phone"></i> {{ turno.phone }}</small><br>
                    <small><i class="fas fa-envelope"></i> {{ turno.email }}</small>
                  </div>
                </td>
                <td class="specialty-cell">
                  <span class="badge-specialty">{{ turno.type }}</span>
                  <div class="motivo-wrapper">
                    <p class="motivo-text">{{ turno.details || 'Sin detalles' }}</p>
                  </div>
                </td>
                <td>
                  <div class="date-req">{{ formatDate(turno.selectedDate) }}</div>
                </td>
                <td class="actions">
                  <button @click="openConfirmModal(turno)" class="btn-icon confirm" title="Confirmar"><i class="fas fa-check"></i></button>
                  <button @click="openEditModal(turno)" class="btn-icon edit" title="Editar"><i class="fas fa-edit"></i></button>
                  <button @click="handleDelete(turno.id)" class="btn-icon delete" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="pendingTurnos.length === 0" class="no-data">No hay nuevas solicitudes pendientes.</p>
        </div>
      </section>

      <!-- Agenda Tab (CALENDAR VIEW) -->
      <section v-if="currentTab === 'agenda'" class="tab-content">
        <div class="calendar-container glass-morphism">
          <div class="calendar-header">
            <button @click="prevMonth" class="btn-nav"><i class="fas fa-chevron-left"></i></button>
            <h3>{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="btn-nav"><i class="fas fa-chevron-right"></i></button>
          </div>
          <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
            <div v-for="n in startDayOffset" :key="'blank-'+n" class="day-cell blank"></div>
            <div v-for="day in daysInMonth" :key="day" 
                 class="day-cell" 
                 :class="{ 'has-turns': getTurnsForDay(day).length > 0, 'selected': selectedDay === day, 'past-day': isPastDay(day) }"
                 @click="selectDay(day)">
              <span class="day-num">{{ day }}</span>
              <div v-if="getTurnsForDay(day).length > 0" class="indicators-wrapper">
                <div v-if="getTurnStats(day).orto > 0" class="turn-indicator orto">
                  {{ getTurnStats(day).orto }} Ortodoncia
                </div>
                <div v-if="getTurnStats(day).gral > 0" class="turn-indicator gral">
                  {{ getTurnStats(day).gral }} Gral
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Day Details -->
        <div v-if="selectedDay" class="day-details mt-8 slide-up">
          <div class="details-header">
            <h4>Turnos para el {{ selectedDay }}/{{ currentMonth + 1 }}/{{ currentYear }}</h4>
            <button @click="selectedDay = null" class="btn-close-details">&times;</button>
          </div>
          <div v-if="getTurnsForDay(selectedDay).length > 0" class="table-container mt-4">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Tratamiento</th>
                  <th>Contacto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="turno in getTurnsForDay(selectedDay)" :key="turno.id">
                  <td><strong>{{ turno.assignedTime }}hs</strong></td>
                  <td>{{ turno.lastName }}, {{ turno.firstName }}</td>
                  <td><span class="badge-specialty" :class="isOrto(turno.type) ? 'orto' : 'gral'">{{ turno.type }}</span></td>
                  <td>
                    <a :href="'https://wa.me/549' + turno.phone?.replace(/\D/g,'')" target="_blank" class="wa-link">
                      <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                  </td>
                  <td class="actions">
                    <button @click="openEditModal(turno)" class="btn-icon edit"><i class="fas fa-edit"></i></button>
                    <button @click="handleDelete(turno.id)" class="btn-icon delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="no-turns-msg">No hay turnos confirmados para este día.</p>
        </div>
      </section>

      <!-- Usuarios Tab -->
      <section v-if="currentTab === 'usuarios'" class="tab-content">
        <div class="mb-4">
          <button @click="openNewUserModal" class="btn btn-primary"><i class="fas fa-user-plus"></i> Nuevo Paciente</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI / Nacimiento</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in allUsers" :key="user.email">
                <td><strong>{{ user.lastName }}, {{ user.name }}</strong></td>
                <td>
                  <div>DNI: {{ user.dni }}</div>
                  <small>F. Nac: {{ formatDate(user.birthDate) }}</small>
                </td>
                <td>
                  <div><i class="fas fa-envelope"></i> {{ user.email }}</div>
                  <div><i class="fas fa-phone"></i> {{ user.phone }}</div>
                </td>
                <td class="actions">
                  <button @click="openEditUserModal(user)" class="btn-icon edit"><i class="fas fa-user-edit"></i></button>
                  <button @click="handleDeleteUser(user.email)" class="btn-icon delete"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Servicios Tab -->
      <section v-if="currentTab === 'servicios'" class="tab-content">
        <div class="mb-4">
          <button @click="openNewServiceModal" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Servicio</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Icono</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="service in allServices" :key="service.id">
                <td><i :class="service.icon" class="service-icon-preview"></i></td>
                <td><strong>{{ service.title }}</strong></td>
                <td>{{ service.description }}</td>
                <td class="actions">
                  <button @click="openEditServiceModal(service)" class="btn-icon edit"><i class="fas fa-edit"></i></button>
                  <button @click="handleDeleteService(service.id)" class="btn-icon delete"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Web Config Tab -->
      <section v-if="currentTab === 'web'" class="tab-content">
        <div class="chatbot-admin-container">
          <div class="admin-card mb-8">
            <div class="card-header">
              <i class="fas fa-image"></i>
              <h3>Imágenes del Sitio</h3>
            </div>
            <div class="p-6">
              <div class="chatbot-config-grid">
                <div class="form-group">
                  <label>Imagen Hero (Principal)</label>
                  <input v-model="siteConfig.heroImage" class="input-modern" placeholder="URL de la imagen">
                  <div class="preview-img-admin mt-2">
                    <img :src="siteConfig.heroImage" alt="Hero Preview">
                  </div>
                </div>
                <div class="form-group">
                  <label>Imagen Nosotros (Sobre Adriana)</label>
                  <input v-model="siteConfig.aboutImage" class="input-modern" placeholder="URL de la imagen">
                  <div class="preview-img-admin mt-2">
                    <img :src="siteConfig.aboutImage" alt="About Preview">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="admin-card">
            <div class="card-header flex justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="fas fa-list-ul"></i>
                <h3>Preguntas Frecuentes (FAQ en Home)</h3>
              </div>
              <button @click="siteConfig.faqs.unshift({ id: Date.now(), q: '', a: '' })" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Nueva FAQ
              </button>
            </div>
            <div class="p-6">
              <div class="faq-management-list">
                <div v-for="(faq, index) in siteConfig.faqs" :key="faq.id" class="faq-editor-card">
                  <div class="faq-editor-main">
                    <input v-model="faq.q" placeholder="Pregunta (Ej: ¿Tienen WiFi?)" class="input-modern mb-2">
                    <textarea v-model="faq.a" placeholder="Respuesta..." rows="2" class="input-modern"></textarea>
                  </div>
                  <div class="faq-editor-side">
                    <button @click="siteConfig.faqs.splice(index, 1)" class="btn-action-delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ChatBot Config Tab -->
      <section v-if="currentTab === 'chatbot'" class="tab-content">
        <div class="chatbot-admin-container">
          <div class="admin-card mb-8">
            <div class="card-header">
              <i class="fas fa-brain"></i>
              <h3>Conocimiento Base de la IA</h3>
            </div>
            <div class="p-6">
              <div class="chatbot-config-grid">
                <div class="form-group">
                  <label>Mensaje de Bienvenida</label>
                  <textarea v-model="botKnowledge.welcome" rows="2" class="input-modern"></textarea>
                </div>
                <div class="form-group">
                  <label>Obras Sociales / Prepagas</label>
                  <textarea v-model="botKnowledge.insuranceInfo" rows="2" class="input-modern"></textarea>
                </div>
                <div class="form-group">
                  <label>Información de Turnos</label>
                  <textarea v-model="botKnowledge.appointmentInfo" rows="3" class="input-modern"></textarea>
                </div>
                <div class="form-group">
                  <label>Información de Contacto</label>
                  <textarea v-model="botKnowledge.contactInfo" rows="2" class="input-modern"></textarea>
                </div>
                <div class="form-group full-width">
                  <label>Respuesta por defecto (Cuando la IA no entiende)</label>
                  <textarea v-model="botKnowledge.defaultResponse" rows="2" class="input-modern"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="admin-card">
            <div class="card-header flex justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="fas fa-question-circle"></i>
                <h3>Preguntas Frecuentes Personalizadas</h3>
              </div>
              <button @click="botKnowledge.faqs.unshift({ id: Date.now(), q: '', a: '' })" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Nueva Pregunta
              </button>
            </div>
            <div class="p-6">
              <div v-if="botKnowledge.faqs.length === 0" class="no-data-msg">
                <i class="fas fa-robot mb-3" style="font-size: 2rem; display: block; opacity: 0.3;"></i>
                No hay preguntas personalizadas aún.<br>Agrega una para que la IA aprenda sobre tu consultorio.
              </div>
              <div class="faq-management-list">
                <div v-for="(faq, index) in (botKnowledge.faqs || [])" :key="index" class="faq-editor-card">
                  <div class="faq-editor-main">
                    <div class="faq-input-group">
                      <label>Si el paciente consulta sobre:</label>
                      <input v-model="faq.q" placeholder="Ej: WiFi, estacionamiento, tarjetas..." class="input-modern">
                    </div>
                    <div class="faq-input-group mt-4">
                      <label>La IA responderá:</label>
                      <textarea v-model="faq.a" placeholder="Escribe la respuesta que dará el asistente virtual..." rows="2" class="input-modern"></textarea>
                    </div>
                  </div>
                  <div class="faq-editor-side">
                    <button @click="confirmDeleteFaq(index)" class="btn-action-delete" title="Borrar esta pregunta">
                      <i class="fas fa-trash"></i>
                      <span>Borrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="save-status-floating" v-if="showSaveAlert">
            <i class="fas fa-check-circle"></i> Cambios guardados automáticamente
          </div>
        </div>
      </section>
    </main>

    <!-- Modals (Simplified versions of the existing ones) -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal-content admin-modal scale-in">
        <h3>Confirmar Turno</h3>
        <p>Asignar horario para <strong>{{ selectedTurno?.lastName }}</strong></p>
        <div class="form-group mt-4">
          <label>Horario</label>
          <input v-model="assignedTime" type="time" required>
        </div>
        <div class="confirm-actions">
          <button @click="showConfirmModal = false" class="btn-secondary">Volver</button>
          <button @click="confirmTurno" class="btn-primary" :disabled="!assignedTime">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- Edit Turno Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content admin-modal scale-in">
        <h3>Editar Turno</h3>
        <form @submit.prevent="saveEdit" class="edit-form mt-4">
          <div class="form-row">
            <div class="form-group"><label>Nombre</label><input v-model="editForm.firstName"></div>
            <div class="form-group"><label>Apellido</label><input v-model="editForm.lastName"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Fecha</label><input v-model="editForm.selectedDate" type="date"></div>
            <div class="form-group"><label>Horario</label><input v-model="editForm.assignedTime" type="time"></div>
          </div>
          <div class="form-group">
            <label>Especialidad</label>
            <select v-model="editForm.type">
              <option v-for="s in allServices" :key="s.id" :value="s.title">{{ s.title }}</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-4">Guardar Cambios</button>
        </form>
      </div>
    </div>
    
    <!-- New User Modal -->
    <div v-if="showNewUserModal" class="modal-overlay" @click.self="showNewUserModal = false">
       <div class="modal-content admin-modal scale-in">
         <h3>Nuevo Paciente</h3>
         <form @submit.prevent="saveNewUser" class="edit-form mt-4">
            <div class="form-row">
              <div class="form-group"><label>Nombre</label><input v-model="newUserForm.name" required></div>
              <div class="form-group"><label>Apellido</label><input v-model="newUserForm.lastName" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>DNI</label><input v-model="newUserForm.dni" required></div>
              <div class="form-group"><label>Teléfono</label><input v-model="newUserForm.phone" required></div>
            </div>
            <div class="form-group"><label>Email</label><input v-model="newUserForm.email" type="email" required autocomplete="email"></div>
            <div class="form-group"><label>Fecha Nacimiento</label><input v-model="newUserForm.birthDate" type="date"></div>
            <div class="form-group"><label>Contraseña Acceso</label><input v-model="newUserForm.password" type="password" placeholder="Clave para el portal" autocomplete="current-password"></div>
            <button type="submit" class="btn btn-primary btn-full">Registrar Paciente</button>
         </form>
       </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="modal-overlay" @click.self="showEditUserModal = false">
       <div class="modal-content admin-modal scale-in">
         <h3>Editar Paciente</h3>
         <form @submit.prevent="saveUserEdit" class="edit-form mt-4">
            <div class="form-row">
              <div class="form-group"><label>Nombre</label><input v-model="editUserForm.name"></div>
              <div class="form-group"><label>Apellido</label><input v-model="editUserForm.lastName"></div>
            </div>
            <div class="form-group"><label>Email</label><input v-model="editUserForm.email" disabled></div>
            <div class="form-group"><label>Nueva Clave (opcional)</label><input v-model="editUserForm.password" type="text" placeholder="Nueva contraseña"></div>
            <button type="submit" class="btn btn-primary btn-full">Guardar</button>
         </form>
       </div>
    </div>

    <div v-if="showServiceModal" class="modal-overlay" @click.self="showServiceModal = false">
       <div class="modal-content admin-modal scale-in">
         <h3>Servicio</h3>
         <form @submit.prevent="saveService" class="edit-form mt-4">
            <div class="form-group"><label>Título</label><input v-model="serviceForm.title"></div>
            <div class="form-group"><label>Descripción</label><input v-model="serviceForm.description"></div>
            <div class="form-group"><label>Icono (FA)</label><input v-model="serviceForm.icon"></div>
            <button type="submit" class="btn btn-primary btn-full">Guardar</button>
         </form>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { allTurnos, updateTurno, deleteTurno, allUsers, updateUser, deleteUser, allServices, addService, updateService, deleteService, botKnowledge, siteConfig } from '../store'

const router = useRouter()
const currentTab = ref('agenda')
const selectedDay = ref(null)

// Asegurar inicialización de FAQs si el localstorage estaba corrupto
if (!botKnowledge.value.faqs) {
  botKnowledge.value.faqs = []
}

// Calendar State
const now = new Date()
const currentMonth = ref(now.getMonth())
const currentYear = ref(now.getFullYear())

// Auto-seleccionar el día de hoy al cargar
const selectedDay = ref(now.getDate())

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Modal States
const showConfirmModal = ref(false)
const showEditModal = ref(false)
const showEditUserModal = ref(false)
const showNewUserModal = ref(false)
const showServiceModal = ref(false)

const selectedTurno = ref(null)
const assignedTime = ref('')
const editForm = ref({})
const editUserForm = ref({})
const newUserForm = ref({ name: '', lastName: '', dni: '', email: '', phone: '', birthDate: '', password: 'admin' })
const serviceForm = ref({ title: '', description: '', icon: 'fas fa-tooth' })
const isEditingService = ref(false)

const tabs = [
  { id: 'solicitudes', name: 'Solicitudes', icon: 'fas fa-bell' },
  { id: 'agenda', name: 'Calendario / Agenda', icon: 'fas fa-calendar-alt' },
  { id: 'usuarios', name: 'Pacientes', icon: 'fas fa-users' },
  { id: 'servicios', name: 'Servicios', icon: 'fas fa-concierge-bell' },
  { id: 'chatbot', name: 'ChatBot AI', icon: 'fas fa-robot' }
]

const pendingTurnos = computed(() => allTurnos.value.filter(t => t.status === 'pendiente'))
const pendingCount = computed(() => pendingTurnos.value.length)
const confirmedTurnos = computed(() => allTurnos.value.filter(t => t.status === 'confirmado'))

// Calendar Logic
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const startDayOffset = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())

// Helper para saber si un día ya pasó
const isPastDay = (day) => {
  const checkDate = new Date(currentYear.value, currentMonth.value, day)
  const today = new Date()
  today.setHours(0,0,0,0)
  return checkDate < today
}

const getTurnsForDay = (day) => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return confirmedTurnos.value.filter(t => t.selectedDate === dateStr)
}

const getTurnStats = (day) => {
  const turns = getTurnsForDay(day)
  let orto = 0
  let gral = 0
  turns.forEach(t => {
    if (t.type.toLowerCase().includes('ortodoncia')) orto++
    else gral++
  })
  return { orto, gral }
}
const isOrto = (type) => type?.toLowerCase().includes('ortodoncia')

const selectDay = (day) => {
  selectedDay.value = day
}

const prevMonth = () => {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
  else currentMonth.value--;
  selectedDay.value = null;
}

const nextMonth = () => {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
  else currentMonth.value++;
  selectedDay.value = null;
}

const formatDate = (dateStr) => {
  if(!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// Actions
const openConfirmModal = (turno) => { selectedTurno.value = turno; assignedTime.value = ''; showConfirmModal.value = true; }
const confirmTurno = () => { updateTurno(selectedTurno.value.id, { status: 'confirmado', assignedTime: assignedTime.value }); showConfirmModal.value = false; }
const openEditModal = (turno) => { selectedTurno.value = turno; editForm.value = { ...turno }; showEditModal.value = true; }
const saveEdit = () => { updateTurno(selectedTurno.value.id, editForm.value); showEditModal.value = false; }
const handleDelete = (id) => { if (confirm('¿Eliminar turno?')) deleteTurno(id) }

const openEditUserModal = (user) => { editUserForm.value = { ...user }; showEditUserModal.value = true; }
const openNewUserModal = () => { newUserForm.value = { name: '', lastName: '', dni: '', email: '', phone: '', birthDate: '', password: 'admin' }; showNewUserModal.value = true; }
const saveNewUser = () => { 
  allUsers.value.push({ ...newUserForm.value }); 
  showNewUserModal.value = false;
  alert('Paciente registrado exitosamente en LocalStorage');
}
const saveUserEdit = () => { updateUser(editUserForm.value.email, editUserForm.value); showEditUserModal.value = false; }
const handleDeleteUser = (email) => { if (confirm('¿Eliminar usuario?')) deleteUser(email) }

const openNewServiceModal = () => { isEditingService.value = false; serviceForm.value = { title: '', description: '', icon: 'fas fa-tooth' }; showServiceModal.value = true; }
const openEditServiceModal = (service) => { isEditingService.value = true; serviceForm.value = { ...service }; showServiceModal.value = true; }
const saveService = () => {
  if (isEditingService.value) updateService(serviceForm.value.id, serviceForm.value)
  else addService(serviceForm.value)
  showServiceModal.value = false
}
const handleDeleteService = (id) => { if (confirm('¿Eliminar servicio?')) deleteService(id) }

const showSaveAlert = ref(false)
const confirmDeleteFaq = (index) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta pregunta? El ChatBot dejará de responderla inmediatamente.')) {
    botKnowledge.value.faqs.splice(index, 1)
  }
}

// Alerta de autoguardado (opcional, para dar feedback visual)
watch(botKnowledge, () => {
  showSaveAlert.value = true
  setTimeout(() => showSaveAlert.value = false, 2000)
}, { deep: true })

const handleLogout = () => router.push('/')
</script>

<style scoped>
.admin-dashboard { display: grid; grid-template-columns: 260px 1fr; height: 100vh; background: #f1f5f9; }
.sidebar { background: #0f172a; color: white; padding: 1.5rem 0; }
.sidebar-nav button { width: 100%; padding: 1rem 1.5rem; background: none; border: none; color: #94a3b8; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; }
.sidebar-nav button.active { background: rgba(14, 116, 144, 0.2); color: #22d3ee; border-right: 4px solid #0e7490; }
.badge-count { margin-left: auto; background: #0e7490; color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem; }
.logout-btn { margin: 1.5rem; padding: 0.8rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer; width: calc(100% - 3rem); }

.content { padding: 2rem; overflow-y: auto; }
.table-container { background: white; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { background: #f8fafc; padding: 1rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; }
td { padding: 1rem; border-top: 1px solid #f1f5f9; }

/* CALENDAR STYLES */
.calendar-container { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.calendar-header h3 { font-size: 1.5rem; color: #0f172a; font-family: 'Playfair Display', serif; }
.btn-nav { background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: 0.3s; }
.btn-nav:hover { background: #e2e8f0; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1rem; }
.weekday { text-align: center; font-weight: 700; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; padding-bottom: 1rem; }
.day-cell { min-height: 100px; padding: 0.8rem; border-radius: 1rem; background: #f8fafc; cursor: pointer; transition: 0.3s; border: 2px solid transparent; display: flex; flex-direction: column; }
.day-cell:hover { background: #f1f5f9; transform: translateY(-3px); }
.day-cell.blank { background: transparent; cursor: default; }
.day-cell.blank:hover { transform: none; }
.day-cell.selected { border-color: #0e7490; background: #ecfeff; }
.day-cell.past-day { opacity: 0.5; background: #f1f5f9; }
.day-cell.has-turns { background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.day-num { font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
.day-num { font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
.indicators-wrapper { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.turn-indicator { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 6px; text-align: center; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.turn-indicator.orto { background: #8b5cf6; } /* Violeta para Ortodoncia */
.turn-indicator.gral { background: #0ea5e9; } /* Azul para General */

.badge-specialty { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; color: white; background: #64748b; }
.badge-specialty.orto { background: #8b5cf6; }
.badge-specialty.gral { background: #0ea5e9; }

.day-details { background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.btn-close-details { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; }

.btn-icon { width: 32px; height: 32px; border: none; border-radius: 8px; cursor: pointer; color: white; margin-right: 5px; }
.confirm { background: #059669; }
.edit { background: #3b82f6; }
.delete { background: #ef4444; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.admin-modal { background: white; padding: 2rem; border-radius: 1.5rem; width: 90%; max-width: 500px; }
.form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
input, select, textarea { padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
.btn-primary { background: #0e7490; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
.btn-secondary { background: #e2e8f0; color: #475569; padding: 0.8rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; }
.btn-full { width: 100%; }

.slide-up { animation: slideUp 0.4s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.scale-in { animation: scaleIn 0.3s ease-out; }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
/* CHATBOT ADMIN STYLES */
.chatbot-admin-container { max-width: 900px; margin: 0 auto; padding-bottom: 5rem; color: #1e293b; }
.admin-card { background: #ffffff; border-radius: 1.5rem; box-shadow: 0 4px 25px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
.card-header { background: #f1f5f9; padding: 1.2rem 1.5rem; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 0.8rem; }
.card-header h3 { font-size: 1.1rem; color: #0f172a; margin: 0; font-weight: 800; }
.card-header i { color: #0e7490; font-size: 1.3rem; }

.chatbot-config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding: 1.5rem; }
@media (max-width: 768px) { .chatbot-config-grid { grid-template-columns: 1fr; } }
.full-width { grid-column: 1 / -1; }

.form-group label { font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; display: block; }
.input-modern { width: 100%; border: 2px solid #e2e8f0; border-radius: 0.8rem; padding: 0.9rem 1.1rem; font-family: inherit; font-size: 1rem; color: #1e293b; transition: 0.3s; outline: none; background: #fff; }
.input-modern:focus { border-color: #0e7490; background: #f0f9ff; box-shadow: 0 0 0 4px rgba(14, 116, 144, 0.1); }

.faq-management-list { padding: 0.5rem; }
.faq-editor-card { display: grid; grid-template-columns: 1fr 120px; gap: 1.5rem; padding: 1.8rem; background: #fdfdfd; border-radius: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: 0.3s; }
.faq-editor-card:hover { background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.08); transform: translateY(-3px); border-color: #0e7490; }

.faq-editor-side { display: flex; align-items: center; justify-content: center; border-left: 2px dashed #e2e8f0; padding-left: 1.5rem; }
.btn-action-delete { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 0.8rem; border-radius: 1rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; transition: 0.3s; width: 100%; }
.btn-action-delete:hover { background: #ef4444; color: white; border-color: #dc2626; transform: scale(1.05); }

.save-status-floating { position: fixed; bottom: 3rem; left: 50%; transform: translateX(-50%); background: #064e3b; color: #ecfdf5; padding: 1rem 2rem; border-radius: 3rem; box-shadow: 0 15px 40px rgba(0,0,0,0.4); z-index: 9999; animation: slideUpBounce 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); font-weight: 700; display: flex; align-items: center; gap: 10px; }

@keyframes slideUpBounce { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

.no-data-msg { text-align: center; padding: 4rem 2rem; background: #f8fafc; border-radius: 1.5rem; border: 2px dashed #e2e8f0; color: #64748b; }
.preview-img-admin { border-radius: 0.5rem; overflow: hidden; height: 80px; border: 1px solid #e2e8f0; }
.preview-img-admin img { width: 100%; height: 100%; object-fit: cover; }
.btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
</style>
