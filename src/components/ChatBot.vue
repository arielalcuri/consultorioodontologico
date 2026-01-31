<template>
  <div class="chatbot-wrapper">
    <!-- Floating Button -->
    <button @click="toggleChat" class="chat-toggle-btn shadow-pulse" :class="{ 'active': isOpen }">
      <i :class="isOpen ? 'fas fa-times' : 'fas fa-comments-medical'"></i>
      <span v-if="!isOpen" class="chat-badge">Asistente Virtual</span>
    </button>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chat-window glass-morphism scale-in">
      <div class="chat-header">
        <div class="bot-avatar">
          <i class="fas fa-tooth"></i>
        </div>
        <div class="bot-info">
          <h4>Asistente Inteligente</h4>
          <span class="status">AI Dental Activa</span>
        </div>
      </div>

      <div class="chat-messages" ref="messageContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div class="msg-content" v-html="msg.text"></div>
        </div>
        <div v-if="isTyping" class="message bot typing">
          <div class="msg-content">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input 
          v-model="userInput" 
          @keyup.enter="sendMessage" 
          placeholder="Consulta lo que desees..."
          type="text"
        >
        <button @click="sendMessage" :disabled="!userInput.trim()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUpdated, nextTick, computed } from 'vue'
import { allServices, botKnowledge, findUserByDetails, addTurno, allTurnos, deleteTurno } from '../store'

const isOpen = ref(false)
const userInput = ref('')
const isTyping = ref(false)
const messageContainer = ref(null)

// --- Lógica de Extracción de Datos (Turnos Inteligentes) ---
const bookingState = ref({
  active: false,
  extractedUser: null,
  extractedDate: null,
  extractedService: null,
  cancelMode: false,
  serviceMode: false,
  customMode: false, // Nueva bandera para mensaje personalizado
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

const sendMessage = () => {
  if (!userInput.value.trim()) return
  const input = userInput.value.trim()
  messages.value.push({ role: 'user', text: input })
  userInput.value = ''
  isTyping.value = true
  scrollToBottom()

  setTimeout(() => {
    const lower = input.toLowerCase()
    let response = ""

    // 1. Extraer datos posibles
    const dni = extractDni(lower)
    const service = extractService(lower)
    const date = extractDateStr(lower)

    // 2. Lógica de Turnos Inteligente
    if (dni || lower.includes('turno') || lower.includes('cita') || bookingState.value.active) {
      const user = dni ? findUserByDetails(dni, lower) : (bookingState.value.extractedUser || null)
      
      if (user) {
        bookingState.value.active = true
        bookingState.value.extractedUser = user

        // --- MODO MENSAJE PERSONALIZADO ---
        if (bookingState.value.customMode) {
          addTurno({
            lastName: user.lastName, firstName: user.name, dni: user.dni, email: user.email, phone: user.phone,
            type: 'Otro / Consulta Especial', details: `MENSAJE DEL PACIENTE: ${input}`, selectedDate: bookingState.value.extractedDate || 'Sin fecha definida'
          })
          response = `Entendido <strong>${user.name}</strong>. He registrado tu mensaje personalizado para la Dra. Adriana. Se comunicarán con vos a la brevedad para evaluar tu caso. ¿En qué más puedo ayudarte?`
          bookingState.value = { active: false, extractedUser: null, extractedDate: null, extractedService: null, cancelMode: false, serviceMode: false, customMode: false, turnosToList: [] }
          return processResponse(response)
        }

        const selectedIndex = parseInt(lower)

        // --- MODO CANCELACIÓN ACTIVO ---
        if (bookingState.value.cancelMode && !isNaN(selectedIndex)) {
          const turnoToDelete = bookingState.value.turnosToList[selectedIndex - 1]
          if (turnoToDelete) {
            deleteTurno(turnoToDelete.id)
            response = `Entendido <strong>${user.name}</strong>. He cancelado tu turno de <strong>${turnoToDelete.type}</strong> para el ${formatDateFriendly(turnoToDelete.selectedDate)}.<br><br>¿Deseas agendar un nuevo turno para otra fecha?`
            bookingState.value.cancelMode = false
            bookingState.value.turnosToList = []
          } else {
            response = `Lo siento, el número <strong>${selectedIndex}</strong> no es válido para cancelar. Elige uno de la lista o escribe "salir".`
          }
        }
        // --- MODO SELECCIÓN DE SERVICIO ACTIVO (POR NÚMERO) ---
        else if (bookingState.value.serviceMode) {
          if (!isNaN(selectedIndex)) {
            // Opción "Otro" (última en la lista)
            if (selectedIndex === allServices.value.length + 1) {
              bookingState.value.customMode = true
              bookingState.value.serviceMode = false
              response = `Perfecto <strong>${user.name}</strong>. Por favor, <strong>escribí a continuación</strong> brevemente el motivo de tu consulta o el servicio que buscás para que la Dra. pueda revisarlo.`
            } else {
              const selectedService = allServices.value[selectedIndex - 1]
              if (selectedService) {
                bookingState.value.extractedService = selectedService
                bookingState.value.serviceMode = false
                if (!bookingState.value.extractedDate) {
                    response = `Perfecto, elegiste <strong>${selectedService.title}</strong>. ¿Para qué fecha de 2026 quieres tu turno? (Atendemos Martes y Jueves)`
                } else {
                    addTurno({
                        lastName: user.lastName, firstName: user.name, dni: user.dni, email: user.email, phone: user.phone,
                        type: selectedService.title, details: 'Solicitado vía ChatBot', selectedDate: bookingState.value.extractedDate
                    })
                    response = `¡Excelente noticia, <strong>${user.name}</strong>! He registrado tu solicitud para <strong>${selectedService.title}</strong> el día <strong>${formatDateFriendly(bookingState.value.extractedDate)}</strong>. En el transcurso de la semana antes del turno, nos comunicaremos con vos para confirmar el horario exacto disponible.`
                    bookingState.value = { active: false, extractedUser: null, extractedDate: null, extractedService: null, cancelMode: false, serviceMode: false, customMode: false, turnosToList: [] }
                }
              } else {
                response = `El número <strong>${selectedIndex}</strong> no corresponde a un servicio de la lista. Por favor intentalo de nuevo.`
              }
            }
          } else if (lower.includes('otro') || lower.includes('no esta')) {
            bookingState.value.customMode = true
            bookingState.value.serviceMode = false
            response = `Perfecto <strong>${user.name}</strong>. Por favor, <strong>escribí a continuación</strong> brevemente el motivo de tu consulta o el servicio que buscás.`
          } else {
            // Si el modo servicio está activo pero el usuario escribe texto de un servicio
            const matchedService = extractService(lower)
            if (matchedService) {
              bookingState.value.extractedService = matchedService
              bookingState.value.serviceMode = false
              response = `Perfecto, elegiste <strong>${matchedService.title}</strong>. ¿Para qué fecha de 2026 quieres tu turno?`
            } else {
              response = `Por favor elige un número de la lista o escribe tu servicio.`
            }
          }
        }
        // --- CONSULTAR O CANCELAR INICIO ---
        else if (lower.includes('mis turnos') || lower.includes('consultar') || lower.includes('ver mis') || lower.includes('tengo') || lower.includes('cancelar') || lower.includes('borrar') || lower.includes('eliminar')) {
          const misTurnos = allTurnos.value.filter(t => t.dni === user.dni)
          if (misTurnos.length > 0) {
            bookingState.value.turnosToList = misTurnos
            bookingState.value.cancelMode = true
            bookingState.value.serviceMode = false
            response = `Hola <strong>${user.name}</strong>, encontré estos turnos a tu nombre. <strong>Escribe el número</strong> del que deseas cancelar:<br><br>`
            misTurnos.forEach((t, i) => { 
                const status = t.status === 'confirmado' ? '✅' : '⏳'
                response += `${i+1}. <strong>${t.type}</strong> (${formatDateFriendly(t.selectedDate)}) ${status}<br>` 
            })
            response += `<br>Si no quieres cancelar ninguno, solo dime "no".`
          } else { 
            response = `Hola <strong>${user.name}</strong>, no tienes turnos registrados actualmente. ¿Te gustaría agendar uno?` 
            bookingState.value.cancelMode = false
          }
        } else if (lower.includes('salir') || lower.includes('chau')) {
          response = `De acuerdo <strong>${user.name}</strong>. ¿En qué más puedo ayudarte?`
          bookingState.value = { active: false, extractedUser: null, extractedDate: null, extractedService: null, cancelMode: false, serviceMode: false, customMode: false, turnosToList: [] }
        } else if (/\bno\b/i.test(lower) && !lower.includes('turno')) {
          response = `Entendido. ¿Deseas consultar algo más?`
          bookingState.value.cancelMode = false
          bookingState.value.serviceMode = false
          bookingState.value.turnosToList = []
        }
        else {
          // Lógica de reserva (Detección por texto o siguiente paso)
          if (date) bookingState.value.extractedDate = date
          if (service) bookingState.value.extractedService = service
          
          if (bookingState.value.extractedDate && bookingState.value.extractedService) {
            addTurno({
              lastName: user.lastName, firstName: user.name, dni: user.dni, email: user.email, phone: user.phone,
              type: bookingState.value.extractedService.title, details: 'Solicitado vía ChatBot', selectedDate: bookingState.value.extractedDate
            })
            const dateFriendly = formatDateFriendly(bookingState.value.extractedDate)
            response = `¡Excelente noticia, <strong>${user.name}</strong>! He registrado tu solicitud para <strong>${bookingState.value.extractedService.title}</strong> el día <strong>${dateFriendly}</strong>. En el transcurso de la semana antes del turno, nos comunicaremos con vos para confirmar el horario exacto disponible.`
            bookingState.value = { active: false, extractedUser: null, extractedDate: null, extractedService: null, cancelMode: false, serviceMode: false, customMode: false, turnosToList: [] }
          } else if (!bookingState.value.extractedService) {
            bookingState.value.serviceMode = true
            response = `¡Hola ${user.name}! He validado tus datos. ¿Para qué servicio deseas el turno? <strong>Escribe el número</strong> correspondiente:<br><br>`
            allServices.value.forEach((s, i) => {
              response += `${i+1}. <strong>${s.title}</strong><br>`
            })
            response += `${allServices.value.length + 1}. <strong>Otro (Mensaje personalizado)</strong>`
          } else if (!bookingState.value.extractedDate) {
            response = `Entendido ${user.name}. ¿Para qué fecha de 2026 (solo Martes o Jueves) deseas agendar el turno de ${bookingState.value.extractedService.title}?`
          }
        }
      } else if (dni && !user) {
        response = `He buscado en nuestra base de pacientes pero no encuentro un registro con el DNI <strong>${dni}</strong>. ¿Podrías verificarlo o decirme tu nombre y apellido?`
      } else {
        response = "Con gusto te ayudo. Para consultar, cancelar o pedir un turno, por favor dime tu <strong>DNI</strong> para encontrarte en el sistema."
      }
    } else {
      // 3. IA de Intenciones (Scoring)
      let bestMatch = null
      let maxScore = 0

      intents.forEach(intent => {
        let score = 0
        intent.patterns.forEach(p => { if (lower.includes(p)) score++ })
        if (score > maxScore) {
          maxScore = score
          bestMatch = intent
        }
      })

      if (bestMatch && maxScore > 0) {
        response = bestMatch.response
      } else {
        // 4. Buscar en FAQ personalizadas
        let bestFaq = null
        let maxFaqScore = 0

        botKnowledge.value.faqs.forEach(f => {
          if (!f.q || !f.a) return
          const qWords = f.q.toLowerCase().replace(/[?¿!¡,.]/g, '').split(' ')
          let currentScore = 0
          qWords.forEach(word => { if (word.length > 2 && lower.includes(word)) currentScore += word.length })
          if (currentScore > maxFaqScore) {
            maxFaqScore = currentScore
            bestFaq = f
          }
        })

        if (bestFaq && maxFaqScore > 3) {
          response = bestFaq.a
        } else {
          // 5. Respuesta por defecto
          response = botKnowledge.value.defaultResponse
        }
      }
    }

    processResponse(response)
  }, 800)
}

const processResponse = (text) => {
  messages.value.push({ role: 'bot', text: text })
  isTyping.value = false
  nextTick(scrollToBottom)
}

onUpdated(scrollToBottom)
</script>

<style scoped>
.chatbot-wrapper { position: fixed; bottom: 2rem; right: 2rem; z-index: 3000; font-family: 'Outfit', sans-serif; }
.chat-toggle-btn { width: 60px; height: 60px; border-radius: 50%; background: #0e7490; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: 0.3s; position: relative; }
.chat-toggle-btn.active { background: #ef4444; }
.chat-badge { position: absolute; top: -10px; left: -80px; background: white; color: #0e7490; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 2px solid #0e7490; }

.chat-window { position: absolute; bottom: 85px; right: 0; width: 360px; height: 550px; background: white; border-radius: 2rem; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.25); border: 1px solid rgba(0,0,0,0.05); }
.chat-header { background: linear-gradient(135deg, #0e7490, #22d3ee); color: white; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.bot-avatar { width: 45px; height: 45px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }
.bot-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; }
.status { font-size: 0.75rem; opacity: 0.9; display: flex; align-items: center; gap: 4px; }
.status::before { content: ''; width: 8px; height: 8px; background: #4dfa7e; border-radius: 50%; box-shadow: 0 0 5px #4dfa7e; }

.chat-messages { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; background: #fdfdfd; }
.message { max-width: 85%; padding: 0.9rem 1.2rem; border-radius: 1.5rem; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.message.bot { background: #f1f5f9; align-self: flex-start; border-bottom-left-radius: 0.3rem; color: #334155; }
.message.user { background: #0e7490; color: white; align-self: flex-end; border-bottom-right-radius: 0.3rem; }

.chat-input { padding: 1.2rem; background: white; border-top: 1px solid #f1f5f9; display: flex; gap: 0.8rem; }
.chat-input input { flex: 1; border: 2px solid #f1f5f9; padding: 0.8rem 1.2rem; border-radius: 1.5rem; font-size: 0.95rem; outline: none; transition: 0.3s; }
.chat-input input:focus { border-color: #0e7490; }
.chat-input button { background: #0e7490; color: white; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(14,116,144,0.3); }

.typing .dot { height: 8px; width: 8px; background: #cbd5e1; border-radius: 50%; display: inline-block; margin: 0 3px; animation: bounce 1.4s infinite ease-in-out; }
@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
@keyframes scaleIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
</style>
