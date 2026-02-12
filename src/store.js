import { ref, watch, computed } from 'vue'

const TURNO_KEY = 'dental_clinic_turnos_v1'
const USER_KEY = 'dental_clinic_users_v1'

// --- SEED DE PRUEBAS (Base de datos precargada) ---
const defaultUsers = [
    {
        name: 'Ariel',
        lastName: 'Alcuri',
        dni: '32456789',
        email: 'ariel@ejemplo.com',
        phone: '1122334455',
        password: 'admin'
    },
    {
        name: 'Adriana',
        lastName: 'Pagnotta',
        dni: '12345678',
        email: 'adriana@ejemplo.com',
        phone: '1155443322',
        password: 'admin'
    }
]

const defaultTurnos = [
    {
        id: 1,
        lastName: 'Alcuri',
        firstName: 'Ariel',
        dni: '32456789',
        email: 'ariel@ejemplo.com',
        phone: '1122334455',
        type: 'Estética Dental',
        details: 'Consulta inicial de estética.',
        selectedDate: '2026-02-10',
        status: 'confirmado',
        assignedTime: '16:00'
    },
    {
        id: 2,
        lastName: 'Alcuri',
        firstName: 'Ariel',
        dni: '32456789',
        email: 'ariel@ejemplo.com',
        phone: '1122334455',
        type: 'Ortodoncia',
        details: 'Control de brackets.',
        selectedDate: '2026-02-24',
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
export const allUsers = ref(storedUsers ? JSON.parse(storedUsers) : defaultUsers)

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
    const exists = allUsers.value.find(u => u.dni === userData.dni)
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
        const cleanDni = u.dni?.toString().replace(/\D/g, '')
        const targetDni = dni?.toString().replace(/\D/g, '')
        return cleanDni === targetDni
    })
}

export const deleteUser = (email) => {
    allUsers.value = allUsers.value.filter(u => u.email !== email)
}

// SERVICES STORE
const defaultServices = [
    { id: 1, title: 'Estética Dental', description: 'Carillas, coronas de porcelana y diseño de sonrisa.', icon: 'fas fa-gem', image: 'https://i.ibb.co/BK5xKtkY/Captura-de-pantalla-2026-02-01-134805.jpg', allowedDays: [2, 4] },
    { id: 2, title: 'Ortodoncia', description: 'Brackets metálicos, cerámicos y zafiro.', icon: 'fas fa-teeth-open', image: 'https://neuroncdn.com/cdn-0001/7ad87ade3f518397f0d5a5236a18cbba3158cabbf035f5fca872c426744003c7?ts=1727129627', allowedDays: [2] },
    { id: 3, title: 'Implantes', description: 'Reposición dental con implantes de alta precisión.', icon: 'fas fa-shapes', image: 'https://www.alvaroyfrancodental.com/wp-content/uploads/2020/02/consejos-para-el-cuidado-de-tus-implantes-dentales.jpg', allowedDays: [2, 4] },
    { id: 4, title: 'Endodoncia', description: 'Tratamiento de conducto avanzado y sin dolor.', icon: 'fas fa-microscope', image: 'https://clinicadentalgetxo.es/wp-content/uploads/2019/11/endodoncia-1200x900.png', allowedDays: [2, 4] },
    { id: 5, title: 'Prótesis', description: 'Soluciones completas y naturales para tu dentadura.', icon: 'fas fa-user-md', image: 'https://i.ibb.co/TBBFVHwX/Captura-de-pantalla-2026-02-01-134013.jpg', allowedDays: [2, 4] }
]

const SERVICE_KEY = 'dental_clinic_services_v5'
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
    defaultResponse: 'He analizado tu consulta pero para brindarte una asesoría exacta y profesional, te sugerimos conversar con nuestra secretaria al 📞 4601-8957 o por WhatsApp al 11 3001-9567.',
    appointmentInfo: 'Con mucho gusto te oriento. Para reservar una cita tienes dos opciones:<br>1. Presionar el botón <strong>Reservar Cita</strong> en la cabecera.<br>2. Ingresar a tu <strong>Portal de Pacientes</strong>.<br><br>Recuerda que atendemos Martes y Jueves de 15:30 a 20:00hs.',
    contactInfo: 'Para una atención personalizada, puedes contactar a nuestra secretaria a través de:<br>📞 Fijo: 4601-8957<br>📱 WhatsApp: 11 3001-9567',
    insuranceInfo: '',
    faqs: []
}

const initialKnowledge = storedKnowledge ? JSON.parse(storedKnowledge) : { ...defaultKnowledge }
Object.keys(defaultKnowledge).forEach(key => {
    if (initialKnowledge[key] === undefined) {
        initialKnowledge[key] = defaultKnowledge[key]
    }
})
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

// --- SITE CONFIG STORE (Images & FAQs) ---
const SITE_CONFIG_KEY = 'dental_clinic_site_config_v6'
const defaultSiteConfig = {
    heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop',
    aboutImage: 'https://estudidentalbarcelona.com/wp-content/uploads/2017/08/tomografia-dientes.jpg',
    address: 'Cosquín 4809, Villa Lugano, CABA',
    hours: 'Martes y Jueves de 15:30 a 20:00hs',
    phoneFixed: '4601-8957',
    phoneMobile: '1130019567',
    faqs: [
        { id: 1, q: '¿Aceptan obras sociales?', a: 'No, no trabajamos con obras sociales/prepagas. En caso de necesitar reintegro, realizamos la factura y la orden con el diagnóstico para que puedas solicitar el reintegro.' },
        { id: 2, q: '¿Tienen estacionamiento?', a: 'Hay estacionamiento libre sobre la calle Cosquín y alrededores.' },
        { id: 3, q: '¿Atienden urgencias?', a: 'Atendemos urgencias dentro de nuestro horario de atención (Martes y Jueves). En caso que necesites una atención inmediata, te solicitamos que te pongas en contacto con nosotros a los teléfonos: 4601-8957 o al 11 3001-9567.' }
    ],
    reviews: [
        { id: 1, name: 'Valeria M.', stars: 5, text: 'Excelente atención de la Dra. Pagnotta. Me realizó un tratamiento de conducto sin dolor y con mucha paciencia. ¡Super recomendable!', date: 'Hace 2 meses' },
        { id: 2, name: 'Carlos R.', stars: 5, text: 'El consultorio es impecable y la atención muy puntual. Me explicaron todo el procedimiento de mis implantes con claridad. Gracias.', date: 'Hace 5 meses' },
        { id: 3, name: 'Mariana S.', stars: 5, text: 'Llevo a mis hijos hace años y siempre nos reciben con una sonrisa. Gran profesional y excelente ser humano.', date: 'Hace 1 año' }
    ]
}

const storedConfig = localStorage.getItem(SITE_CONFIG_KEY)
export const siteConfig = ref(storedConfig ? JSON.parse(storedConfig) : defaultSiteConfig)

watch(siteConfig, (newVal) => {
    localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(newVal))
}, { deep: true })

export const updateSiteConfig = (newData) => {
    siteConfig.value = { ...siteConfig.value, ...newData }
}

// --- SESSION & UI STATE ---
export const currentUser = ref(JSON.parse(localStorage.getItem('dental_clinic_current_user') || 'null'))
watch(currentUser, (val) => {
    localStorage.setItem('dental_clinic_current_user', JSON.stringify(val))
})

export const isDarkMode = ref(localStorage.getItem('dental_clinic_dark_mode') === 'true')
watch(isDarkMode, (val) => {
    localStorage.setItem('dental_clinic_dark_mode', val)
    document.documentElement.classList.toggle('dark-mode', val)
})

export const logout = () => {
    currentUser.value = null
}
