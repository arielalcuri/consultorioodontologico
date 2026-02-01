<template>
  <div class="chatbot-wrapper">
    <!-- Floating Button with Notification -->
    <div class="toggle-container">
      <button @click="toggleChat" class="chat-toggle-btn shadow-pulse" :class="{ 'active': isOpen }">
        <i :class="isOpen ? 'fas fa-chevron-down' : 'fas fa-robot'"></i>
      </button>
      <div v-if="!isOpen && showBadge" class="chat-notification scale-in">
        <span>¡Hola! ¿Te ayudo? 👋</span>
      </div>
    </div>

    <!-- Chat Window -->
    <transition name="chat-fade">
      <div v-if="isOpen" class="chat-window glass-morphism">
        <!-- Header -->
        <div class="chat-header">
          <div class="bot-status-wrapper">
            <div class="bot-avatar-container">
              <i class="fas fa-tooth bot-icon"></i>
              <div class="status-dot"></div>
            </div>
            <div class="bot-info">
              <h4>Asistente Virtual</h4>
              <span class="status-text">En línea • Respuestas al instante</span>
            </div>
          </div>
          <button class="close-header-btn" @click="toggleChat"><i class="fas fa-times"></i></button>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages" ref="messageContainer">
          <div class="chat-start-time">Hoy</div>
          
          <div v-for="(msg, index) in messages" :key="index" :class="['message-row', msg.role]">
            <div v-if="msg.role === 'bot'" class="mini-avatar"><i class="fas fa-tooth"></i></div>
            <div class="message-bubble" :class="msg.role">
              <div class="msg-content" v-html="msg.text"></div>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message-row bot typing-row">
            <div class="mini-avatar"><i class="fas fa-tooth"></i></div>
            <div class="message-bubble bot typing-bubble">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions (Chips) -->
        <div class="quick-actions" v-if="currentOptions.length > 0 && !isTyping">
          <button 
            v-for="(opt, idx) in currentOptions" 
            :key="idx" 
            class="action-chip"
            @click="handleOptionClick(opt)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <input 
            v-model="userInput" 
            @keyup.enter="sendMessage" 
            placeholder="Escribe tu consulta..."
            type="text"
            ref="inputField"
          >
          <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { allServices, botKnowledge, findUserByDetails, addTurno, allTurnos, deleteTurno } from '../store'

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const messageContainer = ref(null)
const inputField = ref(null)
const showBadge = ref(true)

const bookingState = ref({
  active: false,
  extractedUser: null,
  extractedDate: null,
  extractedService: null,
  cancelMode: false,
  serviceMode: false,
  customMode: false,
  registrationMode: false, // Nuevo: Modo Registro
  regStep: 0, // 0: Nombre, 1: Apellido, 2: Email, 3: Teléfono
  tempUser: {}, // Datos temporales del usuario nuevo
  startActionAfterReg: null, // Acción a ejecutar post-registro
  turnosToList: []
})

// Función para normalizar texto (quitar tildes y pasar a minúsculas)
const normalizeText = (text) => {
  if (!text) return ""
  return text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const extractDni = (text) => {
  const match = text.replace(/\./g, '').match(/\d{7,10}/)
  return match ? match[0] : null
}

const extractDateStr = (text) => {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
  const regex = /(\d{1,2})\s+de\s+([a-zA-Z]+)/i
  const match = normalizeText(text).match(regex)
  if (match) {
    const day = parseInt(match[1])
    const month = months.indexOf(match[2])
    if (month !== -1) {
      return `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return null
}

const extractService = (text) => {
  const normalizedInput = normalizeText(text)
  return allServices.value.find(s => {
    const normalizedService = normalizeText(s.title)
    return normalizedInput.includes(normalizedService)
  })
}

const formatDateFriendly = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  return `${parseInt(d)} de ${months[parseInt(m)-1]}`
}
const feriados = ref([])

// Cargar feriados
const fetchFeriados = async () => {
  try {
    const res = await fetch('https://api.argentinadatos.com/v1/feriados/2026')
    if (res.ok) feriados.value = await res.json()
  } catch (e) { console.error(e) }
}
fetchFeriados()

const messages = ref([
  { role: 'bot', text: botKnowledge.value.welcome }
])

const toggleChat = () => { isOpen.value = !isOpen.value }
const scrollToBottom = () => { if (messageContainer.value) messageContainer.value.scrollTop = messageContainer.value.scrollHeight }

// --- MOTOR DE INTELIGENCIA (NLP SIMULATION) ---
const intents = [
  {
    id: 'saludo',
    patterns: ['hola', 'hey', 'buen dia', 'buenas tardes', 'como estas', 'saludos', 'quien sos'],
    response: botKnowledge.value.welcome
  },
  {
    id: 'turnos',
    patterns: ['turno', 'cita', 'agendar', 'reservar', 'visita', 'dental', 'sacar'],
    response: botKnowledge.value.appointmentInfo
  },
  {
    id: 'servicios',
    patterns: ['hacen', 'especialidad', 'servicio', 'tratamiento', 'haces', 'ofrecen', 'limpieza', 'carilla', 'implante', 'ortodoncia'],
    get response() {
      const list = allServices.value.map(s => s.title).join(', ')
      return `Nuestra clínica ofrece tratamientos especializados en: <strong>${list}</strong>. ¿Te gustaría información detallada sobre alguno de ellos en particular?`
    }
  },
  {
    id: 'contacto',
    patterns: ['telefono', 'numero', 'whatsapp', 'llamar', 'celular', 'contacto', 'comunicar'],
    response: botKnowledge.value.contactInfo
  },
  {
    id: 'ubicacion',
    patterns: ['donde', 'direccion', 'ubicados', 'llegar', 'mapa', 'calle', 'lugano'],
    response: botKnowledge.value.locationInfo || 'Estamos en Cosquín 4809, Villa Lugano, CABA.'
  },
  {
    id: 'precios',
    patterns: ['cuanto', 'precio', 'cuesta', 'valor', 'presupuesto', 'costo', 'barato', 'pago'],
    response: 'Los costos varían según cada diagnóstico. Te sugerimos agendar una consulta inicial para que la Dra. Adriana pueda evaluarte y brindarte un presupuesto preciso y profesional.'
  },
  {
    id: 'obras_sociales',
    patterns: ['obra social', 'prepaga', 'osde', 'swiss', 'galeno', 'medicus', 'cobertura', 'aceptan', 'toman'],
    response: botKnowledge.value.insuranceInfo
  }
]

// --- LÓGICA DE REGISTRO PASO A PASO ---
const handleRegistration = (text) => {
  let response = ""
  const state = bookingState.value

  if (state.regStep === 0) { // Nombre
    state.tempUser.firstName = text
    state.regStep++
    response = `Perfecto ${text}. ¿Cuál es tu <strong>Apellido</strong>?`
  } else if (state.regStep === 1) { // Apellido
    state.tempUser.lastName = text
    state.regStep++
    response = "Gracias. Ahora necesito tu <strong>Email</strong> para enviarte confirmaciones:"
  } else if (state.regStep === 2) { // Email
    state.tempUser.email = text
    state.regStep++
    response = "¡Casi listo! Por último, indícame un <strong>Teléfono</strong> de contacto:"
  } else if (state.regStep === 3) { // Teléfono / Finalizar
    state.tempUser.phone = text
    
    // Crear el usuario real
    const newUser = {
      name: state.tempUser.firstName,
      lastName: state.tempUser.lastName,
      dni: state.tempUser.dni,
      email: state.tempUser.email,
      phone: state.tempUser.phone,
      birthDate: new Date().toISOString().split('T')[0], // Default hoy
      password: 'paciente'
    }
    
    registerUser(newUser) // Guardar en store
    
    state.extractedUser = newUser // Auto-login en el contexto del chat
    state.active = true // Usuario activo
    state.registrationMode = false // Fin registro
    
    response = `¡Registro completado con éxito, <strong>${newUser.name}</strong>! 🎉<br>Ya eres parte de nuestra base de pacientes.<br><br>¿Te gustaría agendar ese turno ahora?`
    
    // Restaurar contexto previo si existía intención
    if (state.startActionAfterReg) {
      setTimeout(() => sendMessage(null, state.startActionAfterReg), 1500)
    }
  }
  
  return { text: response, options: [] }
}

const sendMessage = (e, forceAction = null) => {
  const text = userInput.value.trim()
  if (!text && !forceAction) return

  // User Message
  if (!forceAction) {
    messages.value.push({ role: 'user', text: text, time: getTime() })
  }
  userInput.value = ''
  currentOptions.value = [] // Ocultar opciones mientras piensa
  isTyping.value = true
  scrollToBottom()

  setTimeout(() => {
    let result = { text: "", options: [] }

    // --- MODO REGISTRO ---
    if (bookingState.value.registrationMode && !forceAction) {
      result = handleRegistration(text)
    } 
    else {
      // --- FLUJO NORMAL ---
      const lower = text.toLowerCase()
      
      // Chequear DNI en flujo general
      const dni = extractDni(lower)
      
      if (dni) {
          const user = findUserByDetails(dni, lower)
          if (user) {
              bookingState.value.extractedUser = user
              bookingState.value.active = true
              result = { text: `¡Hola de nuevo <strong>${user.name}</strong>! Te he identificado. ¿Qué deseas hacer hoy?`, options: defaultOptions }
          } else {
              // INICIAR REGISTRO SI NO EXISTE
              bookingState.value.registrationMode = true
              bookingState.value.regStep = 0
              bookingState.value.tempUser = { dni: dni } // Guardamos DNI
              bookingState.value.startActionAfterReg = forceAction // Guardar intención original
              result = { text: `No encuentro el DNI <strong>${dni}</strong> en mi sistema. 😕<br><br>¡Pero no hay problema! Vamos a registrarte rápidamente.<br>Por favor, dime tu <strong>Nombre</strong> (sin apellido):`, options: [] }
          }
      } else {
          result = processIntent(text, forceAction)
      }
    }
    
    messages.value.push({ role: 'bot', text: result.text, time: getTime() })
    isTyping.value = false
    currentOptions.value = result.options
    nextTick(scrollToBottom)
  }, 1200)
}

</script>

<style scoped>
.chatbot-wrapper { position: fixed; bottom: 2rem; right: 2rem; z-index: 9999; font-family: 'Outfit', sans-serif; }

/* Toggle Button */
.toggle-container { position: relative; }
.chat-toggle-btn { width: 65px; height: 65px; border-radius: 50%; background: linear-gradient(135deg, #0e7490, #06b6d4); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s; box-shadow: 0 8px 25px rgba(14, 116, 144, 0.4); }
.chat-toggle-btn:hover { transform: scale(1.1); box-shadow: 0 12px 30px rgba(14, 116, 144, 0.5); }
.chat-toggle-btn.active { transform: rotate(180deg) scale(0.9); background: #334155; }

.chat-notification { position: absolute; right: 80px; top: 10px; background: white; padding: 0.8rem 1.2rem; border-radius: 20px 20px 5px 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: nowrap; animation: float 3s ease-in-out infinite; border: 1px solid #e2e8f0; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

/* Chat Window */
.chat-fade-enter-active, .chat-fade-leave-active { transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
.chat-fade-enter-from, .chat-fade-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

.chat-window { position: absolute; bottom: 90px; right: 0; width: 380px; height: 600px; max-height: 80vh; background: #fff; border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255,255,255,0.5); }

/* Header */
.chat-header { background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%); padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 15px rgba(14, 116, 144, 0.2); }
.bot-status-wrapper { display: flex; align-items: center; gap: 12px; }
.bot-avatar-container { position: relative; width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2); }
.bot-icon { font-size: 1.4rem; color: white; }
.status-dot { position: absolute; bottom: 3px; right: 3px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid #0e7490; animation: pulse-green 2s infinite; }
.bot-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; letter-spacing: 0.3px; }
.status-text { font-size: 0.75rem; opacity: 0.9; font-weight: 400; }
.close-header-btn { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
.close-header-btn:hover { opacity: 1; transform: rotate(90deg); }

/* Messages */
.chat-messages { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; background: #f8fafc; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
.chat-start-time { text-align: center; color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.5rem; font-weight: 500; }

.message-row { display: flex; gap: 8px; max-width: 85%; align-items: flex-end; }
.message-row.user { align-self: flex-end; flex-direction: row-reverse; }
.mini-avatar { width: 28px; height: 28px; background: linear-gradient(135deg, #0e7490, #06b6d4); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

.message-bubble { padding: 0.8rem 1rem; border-radius: 18px; font-size: 0.95rem; line-height: 1.45; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
.message-bubble.bot { background: white; color: #334155; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
.message-bubble.user { background: linear-gradient(135deg, #0e7490, #0891b2); color: white; border-bottom-right-radius: 4px; }
.msg-time { display: block; font-size: 0.65rem; margin-top: 4px; opacity: 0.7; text-align: right; }

/* Typing */
.typing-bubble { padding: 1rem; display: flex; align-items: center; min-width: 60px; }
.typing-dots { display: flex; gap: 4px; }
.typing-dots span { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
@keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }

/* Quick Actions */
.quick-actions { padding: 0.5rem 1rem; display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; mask-image: linear-gradient(to right, black 90%, transparent 100%); }
.action-chip { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 0.4rem 0.9rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
.action-chip:hover { border-color: #0e7490; color: #0e7490; background: #ecfeff; transform: translateY(-2px); }

/* Input Area */
.chat-input-area { padding: 1rem; background: white; border-top: 1px solid #f1f5f9; display: flex; gap: 0.8rem; align-items: center; }
.chat-input-area input { flex: 1; border: 2px solid #f1f5f9; background: #f8fafc; padding: 0.8rem 1.2rem; border-radius: 25px; font-size: 0.95rem; outline: none; transition: 0.3s; color: #334155; }
.chat-input-area input:focus { border-color: #0e7490; background: white; box-shadow: 0 0 0 3px rgba(14, 116, 144, 0.1); }
.send-btn { width: 45px; height: 45px; border-radius: 50%; background: #0e7490; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: 0.2s; box-shadow: 0 4px 10px rgba(14, 116, 144, 0.2); }
.send-btn:hover:not(:disabled) { transform: scale(1.05); background: #0891b2; }
.send-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; }

/* Responsive */
@media (max-width: 480px) {
  .chat-window { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; max-height: 100vh; position: fixed; z-index: 10000; }
  .chatbot-wrapper { right: 0; bottom: 0; }
  .chat-header { padding-top: 1rem; }
  .toggle-container { position: fixed; bottom: 2rem; right: 2rem; }
}
</style>
