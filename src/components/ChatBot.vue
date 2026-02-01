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

// Opciones rápidas (Chips)
const currentOptions = ref([])

const defaultOptions = [
  { label: '📅 Reservar Turno', action: 'turno' },
  { label: '🦷 Tratamientos', action: 'servicios' },
  { label: '📍 Ubicación', action: 'ubicacion' },
  { label: '📞 Contacto', action: 'contacto' }
]

const getTime = () => {
  const now = new Date()
  return now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0')
}

const messages = ref([
  { role: 'bot', text: '¡Hola! Soy la IA de la Dra. Pagnotta 🦷. Estoy aquí para ayudarte a agendar turnos, resolver dudas y guiarte en tu salud dental. ¿Qué necesitas hoy?', time: getTime() }
])

onMounted(() => {
  currentOptions.value = defaultOptions
  setTimeout(() => showBadge.value = false, 5000)
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    showBadge.value = false
    nextTick(() => {
      scrollToBottom()
      if(inputField.value) inputField.value.focus()
    })
  }
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTo({
      top: messageContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const handleOptionClick = (opt) => {
  userInput.value = opt.label // Simular escritura
  sendMessage(null, opt.action)
}

// --- LÓGICA INTELIGENTE V2 ---

const processIntent = (input, forceAction = null) => {
  const lower = input.toLowerCase()
  let response = ""
  let nextOpts = defaultOptions // Volver a las opciones por defecto tras responder

  // Si hay una acción forzada por botón
  if (forceAction === 'turno') {
    response = "Para reservar, podés usar nuestro botón 'Reservar Cita' en la parte superior o decirme tu nombre y DNI si ya sos paciente nuestro."
    nextOpts = [{ label: '📝 Ver mis turnos', action: 'mis_turnos' }]
  } 
  else if (forceAction === 'servicios') {
    const list = allServices.value.map(s => `• ${s.title}`).join('<br>')
    response = `Realizamos los siguientes tratamientos especializados:<br><br>${list}<br><br>¿Te interesa alguno en particular?`
  }
  else if (forceAction === 'ubicacion') {
    response = "Estamos ubicados en <strong>Cosquín 4809</strong>, Villa Lugano, CABA. <br>📍 <a href='https://maps.google.com' target='_blank' style='color:#0e7490;text-decoration:underline'>Ver en Mapa</a>"
  }
  else if (forceAction === 'contacto') {
    response = "📞 Teléfono fijo: <strong>4601-8957</strong><br>📱 WhatsApp: <strong>11 3001-9567</strong><br>⏰ Horarios: Mar y Jue de 15:30 a 20:00hs."
    nextOpts = [{ label: '💬 Ir a WhatsApp', action: 'whatsapp_link' }]
  }
  else if (forceAction === 'whatsapp_link') {
    window.open('https://wa.me/5491130019567', '_blank')
    response = "Te he abierto el chat de WhatsApp en otra pestaña. ¡Gracías!"
  }
  // Procesamiento de Texto Libre
  else if (lower.includes('hola') || lower.includes('buen')) {
    response = "¡Hola! ¿Cómo estás? ¿En qué puedo ayudarte hoy?"
  }
  else if (lower.includes('precio') || lower.includes('costo') || lower.includes('valor')) {
    response = "Cada sonrisa es única. Para darte un presupuesto exacto, la Dra. Adriana necesita evaluarte. La consulta inicial es fundamental para un diagnóstico preciso."
    nextOpts = [{ label: '📅 Agendar Evaluación', action: 'turno' }]
  }
  else if (lower.includes('obra social') || lower.includes('prepaga')) {
    response = botKnowledge.value.insuranceInfo || "Por el momento trabajamos de manera particular para garantizar la máxima calidad en materiales y tiempo de atención. Emitimos factura para reintegros."
  }
  // Fallback
  else {
    // Buscar en FAQ
    const foundFaq = botKnowledge.value.faqs.find(f => lower.includes(f.q.toLowerCase()))
    if (foundFaq) {
      response = foundFaq.a
    } else {
      response = "Mmm... no estoy seguro de entender esa consulta específica. 🤔 Pero puedo conectarte directamente con la secretaría."
      nextOpts = [{ label: '💬 Hablar con Secretaria', action: 'whatsapp_link' }, { label: '📅 Reservar Turno', action: 'turno' }]
    }
  }

  return { text: response, options: nextOpts }
}

const sendMessage = (e, forceAction = null) => {
  const text = userInput.value.trim()
  if (!text && !forceAction) return

  // User Message
  messages.value.push({ role: 'user', text: text, time: getTime() })
  userInput.value = ''
  currentOptions.value = [] // Ocultar opciones mientras piensa
  isTyping.value = true
  scrollToBottom()

  // Simular delay de pensamiento IA
  setTimeout(() => {
    const result = processIntent(text, forceAction)
    
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
