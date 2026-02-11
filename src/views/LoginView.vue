<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <i class="fas fa-tooth"></i>
        <span>Acceso Administración</span>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="admin@ejemplo.com">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input v-model="password" type="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </form>
      <router-link to="/" class="back-link">Volver al sitio</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    // En una app real podrías verificar el rol aquí, pero por ahora permitimos acceso
    router.push('/admin')
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Email o contraseña incorrectos.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0e7490 0%, #155e75 100%);
}
.login-card {
  background: white;
  padding: 3rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.logo {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--primary);
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
input { padding: 0.8rem; border: 1px solid #ddd; border-radius: 0.5rem; }
.btn-login {
  width: 100%;
  padding: 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}
.error-msg { color: #ef4444; text-align: center; margin-top: 1rem; font-size: 0.9rem; }
.back-link { display: block; text-align: center; margin-top: 1.5rem; text-decoration: none; color: #64748b; font-size: 0.9rem; }
</style>
