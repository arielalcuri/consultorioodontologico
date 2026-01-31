import { ref, watch } from 'vue'

const TURNO_KEY = 'dental_clinic_turnos_v1'
const USER_KEY = 'dental_clinic_users_v1'

const defaultTurnos = [
    {
        id: 1,
        lastName: 'García',
        firstName: 'Carlos',
        dni: '32.456.789',
        email: 'carlos@example.com',
        phone: '1130004455',
        type: 'Estética Dental',
        details: 'Consulta carillas.',
        selectedDate: '2026-02-03',
        status: 'pendiente',
        assignedTime: null
    }
]

// TURNOS STORE
const storedTurnos = localStorage.getItem(TURNO_KEY)
export const allTurnos = ref(storedTurnos ? JSON.parse(storedTurnos) : defaultTurnos)

watch(allTurnos, (newVal) => {
    localStorage.setItem(TURNO_KEY, JSON.stringify(newVal))
}, { deep: true })

// USERS STORE
const storedUsers = localStorage.getItem(USER_KEY)
export const allUsers = ref(storedUsers ? JSON.parse(storedUsers) : [])

watch(allUsers, (newVal) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newVal))
}, { deep: true })

// ACTIONS
export const addTurno = (turno) => {
    allTurnos.value.push({
        id: Date.now(),
        status: 'pendiente',
        assignedTime: null,
        ...turno
    })
}

export const updateTurno = (id, updatedFields) => {
    const index = allTurnos.value.findIndex(t => t.id === id)
    if (index !== -1) {
        allTurnos.value[index] = { ...allTurnos.value[index], ...updatedFields }
    }
}

export const deleteTurno = (id) => {
    allTurnos.value = allTurnos.value.filter(t => t.id !== id)
}

export const registerUser = (userData) => {
    const exists = allUsers.value.find(u => u.email === userData.email)
    if (!exists) {
        allUsers.value.push(userData)
        return userData
    }
    return exists
}

export const findUser = (email, password) => {
    return allUsers.value.find(u => u.email === email && u.password === password)
}

export const updateUser = (email, updatedFields) => {
    const index = allUsers.value.findIndex(u => u.email === email)
    if (index !== -1) {
        allUsers.value[index] = { ...allUsers.value[index], ...updatedFields }
    }
}

export const findUserByDetails = (dni, lastName) => {
    return allUsers.value.find(u => {
        const cleanDni = u.dni?.replace(/\D/g, '')
        const targetDni = dni?.replace(/\D/g, '')
        return cleanDni === targetDni || u.lastName?.toLowerCase().includes(lastName?.toLowerCase())
    })
}

export const deleteUser = (email) => {
    allUsers.value = allUsers.value.filter(u => u.email !== email)
}

// SERVICES STORE
const defaultServices = [
    { id: 1, title: 'Estética Dental', description: 'Carillas, coronas y diseño de sonrisa.', icon: 'fas fa-gem' },
    { id: 2, title: 'Ortodoncia', description: 'Brackets metálicos, cerámicos y zafiro.', icon: 'fas fa-teeth-open' },
    { id: 3, title: 'Implantes', description: 'Reposición dental con tecnología de punta.', icon: 'fas fa-shapes' },
    { id: 4, title: 'Endodoncia', description: 'Tratamiento de conducto avanzado.', icon: 'fas fa-microscope' }
]

const SERVICE_KEY = 'dental_clinic_services_v1'
const storedServices = localStorage.getItem(SERVICE_KEY)
export const allServices = ref(storedServices ? JSON.parse(storedServices) : defaultServices)

watch(allServices, (newVal) => {
    localStorage.setItem(SERVICE_KEY, JSON.stringify(newVal))
}, { deep: true })

export const addService = (service) => {
    allServices.value.push({ id: Date.now(), ...service })
}

export const updateService = (id, updatedFields) => {
    const index = allServices.value.findIndex(s => s.id === id)
    if (index !== -1) {
        allServices.value[index] = { ...allServices.value[index], ...updatedFields }
    }
}

export const deleteService = (id) => {
    allServices.value = allServices.value.filter(s => s.id !== id)
}

// --- CHATBOT KNOWLEDGE ---
const KNOWLEDGE_KEY = 'dental_clinic_knowledge_v1'
const storedKnowledge = localStorage.getItem(KNOWLEDGE_KEY)
const defaultKnowledge = {
    welcome: '¡Hola! Soy tu asistente con IA de la clínica. He sido programado para entender tus consultas sobre tratamientos, turnos y fechas. ¿En qué puedo servirte hoy?',
    defaultResponse: 'He analizado tu consulta pero para brindarte una asesoría exacta y profesional, te sugiero conversar con nuestra secretaria al 📞 4601-8957 o por WhatsApp al 11 3001-9567.',
    appointmentInfo: 'Con mucho gusto te oriento. Para reservar una cita tienes dos opciones:<br>1. Presionar el botón <strong>Reservar Cita</strong> en la cabecera.<br>2. Ingresar a tu <strong>Portal de Pacientes</strong>.<br><br>Recuerda que atendemos Martes y Jueves de 15:30 a 20:00hs.',
    contactInfo: 'Para una atención personalizada, puedes contactar a nuestra secretaria a través de:<br>📞 Fijo: 4601-8957<br>📱 WhatsApp: 11 3001-9567',
    insuranceInfo: 'Actualmente trabajamos con las siguientes obras sociales: OSDE, Swiss Medical, Galeno y Medicus. Para otras coberturas, por favor consúltanos directamente.',
    faqs: []
}

const initialKnowledge = storedKnowledge ? JSON.parse(storedKnowledge) : { ...defaultKnowledge }
// Garantizar que todas las propiedades nuevas del sistema existan
Object.keys(defaultKnowledge).forEach(key => {
    if (initialKnowledge[key] === undefined) {
        initialKnowledge[key] = defaultKnowledge[key]
    }
})
// Asegurar IDs en FAQs para mejor tracking
if (initialKnowledge.faqs) {
    initialKnowledge.faqs = initialKnowledge.faqs.map(f => ({ id: f.id || Date.now() + Math.random(), ...f }))
}
export const botKnowledge = ref(initialKnowledge)

watch(botKnowledge, (newVal) => {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(newVal))
}, { deep: true })

export const updateBotKnowledge = (newData) => {
    botKnowledge.value = { ...botKnowledge.value, ...newData }
}
