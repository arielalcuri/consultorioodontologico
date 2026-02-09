<template>
    <div>Hola Mundo</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { allTurnos, updateTurno, deleteTurno, allUsers, updateUser, deleteUser, allServices, addService, updateService, deleteService, botKnowledge, siteConfig } from '../store'

const router = useRouter()
const currentTab = ref('agenda')
// const selectedDay = ref(null) <--- BORRADO

if (!botKnowledge.value.faqs) {
  botKnowledge.value.faqs = []
}

// Calendar State
const now = new Date()
const currentMonth = ref(now.getMonth())
const currentYear = ref(now.getFullYear())

// Auto-seleccionar el día de hoy al cargar
const selectedDay = ref(now.getDate()) // <--- ESTE SE QUEDA

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
</script>
