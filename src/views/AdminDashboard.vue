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
      </nav>
      <div class="sidebar-footer">
        <!-- Botón de Exportación de Seguridad (Backup) -->
        <button @click="exportDatabaseJSON" class="btn-sidebar danger" title="Resguardar todos los datos">
           <i class="fas fa-download"></i> Backup Local
        </button>
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>
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

      <!-- Agenda Tab (MODERN LIST VIEW) -->
      <section v-if="currentTab === 'agenda'" class="tab-content agenda-unified-layout">
        <div class="calendar-section glass-morphism">
          <div class="calendar-header-pro">
            <div class="month-selector">
              <button @click="prevMonth" class="btn-nav-flat"><i class="fas fa-chevron-left"></i></button>
              <h3>{{ monthNames[currentMonth] }} <span>{{ currentYear }}</span></h3>
              <button @click="nextMonth" class="btn-nav-flat"><i class="fas fa-chevron-right"></i></button>
            </div>
            <button @click="openManualTurnModal" class="btn btn-primary">
              <i class="fas fa-plus"></i> Asignar Turno Manual
            </button>
          </div>
          
          <div class="calendar-grid-pro">
            <div v-for="day in weekDays" :key="day" class="weekday-pro">{{ day }}</div>
            <div v-for="n in startDayOffset" :key="'blank-'+n" class="day-cell-pro blank"></div>
            <div v-for="day in daysInMonth" :key="day" 
                 class="day-cell-pro" 
                 :class="{ 
                    'today': isToday(day), 
                    'selected': selectedDay === day, 
                    'has-turns': getTurnsForDay(day).length > 0 
                 }"
                 @click="selectDay(day)">
              <span class="day-num-pro">{{ day }}</span>
              <div v-if="getTurnsForDay(day).length > 0" class="mini-indicators">
                <span v-for="i in Math.min(getTurnsForDay(day).length, 3)" :key="i" class="mini-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedDay" class="agenda-list-section mt-8 scale-in">
          <div class="section-header-flex">
            <h3>Turnos para el {{ selectedDay }} de {{ monthNames[currentMonth] }}</h3>
            <div class="stats-pills">
               <span class="pill pill-orto">{{ getTurnStats(selectedDay).orto }} Ortodoncia</span>
               <span class="pill pill-gral">{{ getTurnStats(selectedDay).gral }} General</span>
            </div>
          </div>

          <div v-if="getTurnsForDay(selectedDay).length > 0" class="appointments-grid">
            <div v-for="turno in getTurnsForDay(selectedDay).sort((a,b) => a.assignedTime.localeCompare(b.assignedTime))" 
                 :key="turno.id" 
                 class="patient-card-row"
                 :class="isOrto(turno.type) ? 'border-orto' : 'border-gral'">
              <div class="patient-time">
                <i class="far fa-clock"></i>
                <span>{{ turno.assignedTime }}hs</span>
              </div>
              <div class="patient-info-main">
                <h4>{{ turno.lastName }}, {{ turno.firstName }}</h4>
                <div class="patient-meta">
                   <span><i class="fas fa-id-card"></i> {{ turno.dni }}</span>
                   <span><i class="fas fa-teeth"></i> {{ turno.type }}</span>
                </div>
              </div>
              <div class="patient-actions-list">
                <a :href="'https://wa.me/549' + turno.phone?.replace(/\D/g,'')" target="_blank" class="btn-action-round wa" title="WhatsApp">
                  <i class="fab fa-whatsapp"></i> Chat
                </a>
                <button @click="openEditModal(turno)" class="btn-action-round edit" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="handleDelete(turno.id)" class="btn-action-round delete" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-data-card">
            <i class="fas fa-calendar-day mb-3"></i>
            <p>No hay turnos confirmados para esta fecha.</p>
          </div>
        </div>
        <div v-else class="select-day-prompt card-modern">
           <i class="fas fa-hand-pointer mb-4"></i>
           <p>Selecciona un día en el calendario para gestionar la lista de turnos.</p>
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
                <td>
                  <strong>{{ service.title }}</strong><br>
                  <small class="text-gray-500">
                    {{ service.allowedDays?.map(d => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d]).join(', ') || 'Sin días' }}
                  </small>
                </td>
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
          <div class="admin-card mb-8 border-2 border-cyan-100 bg-cyan-50">
            <div class="card-header bg-cyan-100">
              <i class="fas fa-cloud-upload-alt"></i>
              <h3>Sincronización Cloud (Firebase)</h3>
            </div>
            <div class="p-6">
              <p class="mb-4 text-sm text-slate-600">
                Usa este panel para subir tus cambios locales (servicios, fotos, chatbot) a la base de datos oficial de Firebase.
              </p>
              <div class="flex gap-4">
                <button @click="syncToCloud" class="btn btn-primary" :disabled="isSyncing">
                  <i class="fas fa-sync" :class="{ 'fa-spin': isSyncing }"></i> 
                  {{ isSyncing ? 'Sincronizando...' : 'Sincronizar Todo con Cloud' }}
                </button>
                <button @click="initializeCloudData" class="btn btn-secondary" :disabled="isSyncing">
                  <i class="fas fa-magic"></i> Inicializar con Contenido Profesional
                </button>
              </div>
            </div>
          </div>

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
                  <div class="mt-2 flex gap-2">
                    <input type="file" @change="e => handleDirectUpload(e, 'hero')" accept="image/*" class="hidden" ref="heroInput">
                    <button @click="$refs.heroInput.click()" class="btn btn-secondary btn-sm" :disabled="isUploading">
                       <i class="fas fa-upload"></i> Subir desde mi PC
                    </button>
                  </div>
                  <div class="preview-img-admin mt-2">
                    <img :src="siteConfig.heroImage" alt="Hero Preview">
                  </div>
                </div>
                <div class="form-group">
                  <label>Imagen Nosotros (Sobre Adriana)</label>
                  <input v-model="siteConfig.aboutImage" class="input-modern" placeholder="URL de la imagen">
                  <div class="mt-2 flex gap-2">
                    <input type="file" @change="e => handleDirectUpload(e, 'about')" accept="image/*" class="hidden" ref="aboutInput">
                    <button @click="$refs.aboutInput.click()" class="btn btn-secondary btn-sm" :disabled="isUploading">
                       <i class="fas fa-upload"></i> Subir desde mi PC
                    </button>
                  </div>
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

          <div class="admin-card">
            <div class="card-header flex justify-between items-center">
              <div class="flex items-center gap-2">
                <i class="fas fa-star"></i>
                <h3>Reseñas / Testimonios</h3>
              </div>
              <button @click="siteConfig.reviews.unshift({ id: Date.now(), name: '', stars: 5, text: '', date: 'Hace 1 mes' })" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Nueva Reseña
              </button>
            </div>
            <div class="p-6">
              <div class="faq-management-list">
                 <div v-for="(review, index) in (siteConfig.reviews || [])" :key="review.id" class="faq-editor-card">
                    <div class="faq-editor-main">
                       <div class="form-row mb-2">
                          <input v-model="review.name" placeholder="Nombre (Ej: Juan Perez)" class="input-modern">
                          <select v-model="review.stars" class="input-modern">
                             <option :value="5">⭐⭐⭐⭐⭐ 5 Estrellas</option>
                             <option :value="4">⭐⭐⭐⭐ 4 Estrellas</option>
                             <option :value="3">⭐⭐⭐ 3 Estrellas</option>
                          </select>
                       </div>
                       <input v-model="review.date" placeholder="Fecha (Ej: Hace 2 semanas)" class="input-modern mb-2">
                       <textarea v-model="review.text" placeholder="Comentario del paciente..." rows="3" class="input-modern"></textarea>
                    </div>
                    <div class="faq-editor-side">
                       <button @click="siteConfig.reviews.splice(index, 1)" class="btn-action-delete">
                          <i class="fas fa-trash"></i>
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Promo Config Section -->
          <div class="admin-card mt-8">
            <div class="card-header bg-amber-50">
              <i class="fas fa-gift text-amber-600"></i>
              <h3>Gestión de Promociones (Pop-up)</h3>
            </div>
            <div class="p-6" v-if="siteConfig.promo">
              <div class="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                 <label class="switch">
                    <input type="checkbox" v-model="siteConfig.promo.enabled">
                    <span class="slider round"></span>
                 </label>
                 <div>
                    <span class="font-bold text-slate-800">Mostrar Pop-up de Promoción</span>
                    <p class="text-xs text-slate-500">Si lo activas, aparecerá a los pacientes después de unos segundos.</p>
                 </div>
              </div>
              
              <div v-if="siteConfig.promo.enabled" class="chatbot-config-grid">
                <div class="form-group">
                  <label>Título del Pop-up</label>
                  <input v-model="siteConfig.promo.title" class="input-modern" placeholder="Ej: ¡Oferta de Bienvenida!">
                </div>
                <div class="form-group">
                  <label>Texto de la Promoción</label>
                  <textarea v-model="siteConfig.promo.text" rows="2" class="input-modern" placeholder="Ej: Obtén un 20% de descuento..."></textarea>
                </div>
                <div class="form-group">
                  <label>Texto del Botón</label>
                  <input v-model="siteConfig.promo.btnText" class="input-modern" placeholder="Ej: Aprovechar ahora">
                </div>
              </div>
            </div>
            <div class="p-6 text-center text-slate-400" v-else>
               Cargando configuración de promociones...
            </div>
          </div>
        </div>
      </section>

      <!-- ChatBot Config Tab -->
      <section v-if="currentTab === 'chatbot'" class="tab-content">
        <div class="chatbot-admin-container">
          <!-- Gemini Config -->
          <div class="admin-card mb-8 border-2 border-purple-100 bg-purple-50">
            <div class="card-header bg-purple-100">
              <i class="fas fa-magic"></i>
              <h3>Cerebro de IA Avanzada (Google Gemini)</h3>
            </div>
            <div class="p-6">
              <p class="mb-4 text-sm text-slate-600">
                Conecta tu chatbot con <strong>Google Gemini</strong> para que pueda responder dudas complejas de forma natural. 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-purple-600 font-bold underline ml-1">Obten tu clave GRATIS aquí</a>.
              </p>
              <div class="form-group">
                <label>API KEY de Google Gemini</label>
                <div class="flex gap-2">
                  <input v-model="botKnowledge.geminiKey" type="password" class="input-modern" placeholder="Pega tu clave AIzaSy..." style="flex: 1;">
                  <button @click="testGemini" class="btn btn-secondary btn-sm" :disabled="!botKnowledge.geminiKey">Probar Conexión</button>
                </div>
              </div>
            </div>
          </div>

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

      <!-- Galeria Tab -->
      <section v-if="currentTab === 'galeria'" class="tab-content">
        <div class="gallery-admin-container">
           <div class="admin-card mb-8">
              <div class="card-header flex justify-between items-center">
                 <div class="flex items-center gap-2">
                    <i class="fas fa-images"></i>
                    <h3>Banco de Imágenes del Consultorio</h3>
                 </div>
                 <div>
                    <input type="file" @change="handleGalleryUpload" accept="image/*" class="hidden" ref="galleryInput" multiple>
                    <button @click="$refs.galleryInput.click()" class="btn btn-primary" :disabled="isUploading">
                       <i class="fas fa-cloud-upload-alt mr-2"></i> Subir Nueva Foto
                    </button>
                 </div>
              </div>
              <div class="p-6">
                 <p class="text-sm text-slate-500 mb-6">Todas las fotos que subas aquí se guardan en Firebase y puedes usarlas en cualquier parte del sitio.</p>
                 
                 <div v-if="isUploading" class="upload-progress-bar mb-6">
                    <div class="spinner"></div> Subiendo archivos al servidor...
                 </div>

                 <div v-if="galleryFiles.length === 0" class="no-data-msg">
                    <i class="fas fa-image mb-3" style="font-size: 3rem; opacity: 0.2;"></i>
                    <br>Aún no hay fotos en tu galería cloud.
                 </div>

                 <div class="gallery-grid-admin">
                    <div v-for="img in galleryFiles" :key="img.fullPath" class="gallery-item-card">
                       <div class="gallery-img-wrapper">
                          <img :src="img.url" alt="Gallery item">
                          <div class="gallery-overlay">
                             <button @click="copyToClipboard(img.url)" class="btn-overlay" title="Copiar Link">
                                <i class="fas fa-link"></i>
                             </button>
                             <button @click="deleteFromGallery(img)" class="btn-overlay delete" title="Eliminar">
                                <i class="fas fa-trash"></i>
                             </button>
                          </div>
                       </div>
                       <div class="gallery-info">
                          <span class="text-xs truncate block text-slate-500">{{ img.name }}</span>
                       </div>
                    </div>
                 </div>
              </div>
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
              <div class="form-group"><label>DNI *</label><input v-model="newUserForm.dni" required></div>
              <div class="form-group"><label>F. Nacimiento *</label><input v-model="newUserForm.birthDate" type="date" required></div>
            </div>
            <div class="form-group"><label>Domicilio (Calle, N°, Localidad) *</label><input v-model="newUserForm.address" placeholder="Ej: Av. Rivadavia 1234, Ramos Mejía" required></div>
            <div class="form-group"><label>Teléfono *</label><input v-model="newUserForm.phone" required></div>
            <div class="form-group"><label>Email (Opcional)</label><input v-model="newUserForm.email" type="email" autocomplete="email"></div>
            <div class="form-group"><label>Contraseña *</label><input v-model="newUserForm.password" type="password" required autocomplete="current-password"></div>
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
            <div class="form-group"><label>Email</label><input v-model="editUserForm.email" disabled autocomplete="username"></div>
            <div class="form-group"><label>Nueva Clave (opcional)</label><input v-model="editUserForm.password" type="password" placeholder="Nueva contraseña" autocomplete="new-password"></div>
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
            
            <div class="form-group">
               <label>Imagen del Servicio</label>
               <input v-model="serviceForm.image" class="input-modern" placeholder="URL de la imagen">
               <div class="mt-2 flex gap-2">
                  <input type="file" @change="e => handleDirectUpload(e, 'service')" accept="image/*" class="hidden" ref="serviceImgInput">
                  <button type="button" @click="$refs.serviceImgInput.click()" class="btn btn-secondary btn-sm" :disabled="isUploading">
                     <i class="fas fa-upload"></i> Subir Foto
                  </button>
               </div>
               <div v-if="serviceForm.image" class="preview-img-admin mt-2">
                  <img :src="serviceForm.image" alt="Service Preview">
               </div>
            </div>
            
            <div class="form-group">
               <label>Días de Atención</label>
               <div class="days-selector-grid">
                  <label v-for="(day, idx) in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']" :key="idx" class="day-checkbox">
                     <input type="checkbox" :value="idx" v-model="serviceForm.allowedDays">
                     <span>{{ day }}</span>
                  </label>
               </div>
               <small class="text-xs text-gray-400 mt-1">Selecciona los días que se presta este servicio (ej: Ortodoncia Martes).</small>
            </div>

            <button type="submit" class="btn btn-primary btn-full mt-4">Guardar</button>
         </form>
       </div>
    </div>

    <!-- Manual Turn Modal -->
    <div v-if="showManualTurnModal" class="modal-overlay" @click.self="showManualTurnModal = false">
      <div class="modal-content admin-modal scale-in">
        <h3>Asignar Turno - Paso {{ manualTurnStep }}</h3>
        
        <!-- Paso 1: Buscar Paciente -->
        <div v-if="manualTurnStep === 1">
           <p class="mb-4">Busque un paciente existente o cree uno nuevo.</p>
           <div class="form-group">
             <label>Buscar por Nombre o DNI</label>
             <input v-model="userSearchQuery" placeholder="Escriba para buscar..." class="input-modern" autofocus>
           </div>
           
           <div v-if="filteredUsers.length > 0" class="user-results-list mt-2">
              <div v-for="user in filteredUsers" :key="user.email" class="user-result-item" @click="selectUserForTurn(user)">
                 <strong>{{ user.lastName }}, {{ user.name }}</strong>
                 <small>DNI: {{ user.dni }}</small>
              </div>
           </div>
           <p v-else-if="userSearchQuery.length > 2" class="text-sm text-gray-500 mt-2">No se encontraron pacientes.</p>

           <div class="mt-6 border-t pt-4">
              <button @click="goToNewUserStep" class="btn btn-secondary btn-full">
                <i class="fas fa-user-plus"></i> Crear Nuevo Paciente
              </button>
           </div>
        </div>

        <!-- Paso 2: Crear Nuevo Paciente (Reutilizando campos) -->
        <div v-if="manualTurnStep === 2">
           <form @submit.prevent="saveNewUserAndContinue" class="edit-form mt-2">
              <div class="form-row">
                <div class="form-group"><label>Nombre *</label><input v-model="newUserForm.name" required></div>
                <div class="form-group"><label>Apellido *</label><input v-model="newUserForm.lastName" required></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label>DNI *</label><input v-model="newUserForm.dni" required></div>
                <div class="form-group"><label>F. Nac *</label><input v-model="newUserForm.birthDate" type="date" required></div>
              </div>
              <div class="form-group"><label>Domicilio *</label><input v-model="newUserForm.address" placeholder="Calle, N°, Localidad" required></div>
              <div class="form-group"><label>Teléfono *</label><input v-model="newUserForm.phone" required></div>
              <div class="form-group"><label>Email (Opcional)</label><input v-model="newUserForm.email" type="email"></div>
              <div class="form-group"><label>Contraseña *</label><input v-model="newUserForm.password" type="password" required></div>
              
              <div class="form-actions mt-4 flex gap-2">
                 <button type="button" @click="manualTurnStep = 1" class="btn-secondary" style="flex:1">Volver</button>
                 <button type="submit" class="btn-primary" style="flex:1">Guardar y Continuar</button>
              </div>
           </form>
        </div>

        <!-- Paso 3: Datos del Turno -->
        <div v-if="manualTurnStep === 3">
           <div class="selected-user-summary mb-4 p-3 bg-blue-50 rounded border border-blue-100">
              <p>Paciente: <strong>{{ selectedUserForTurn.lastName }}, {{ selectedUserForTurn.name }}</strong></p>
              <p>Fecha: <strong>{{ selectedDay }}/{{ currentMonth + 1 }}/{{ currentYear }}</strong></p>
           </div>
           
           <div class="form-group">
              <label>Horario</label>
              <input v-model="manualTurnForm.time" type="time" required class="input-modern">
           </div>
           <div class="form-group">
              <label>Especialidad</label>
              <select v-model="manualTurnForm.type" class="input-modern">
                 <option v-for="s in allServices" :key="s.id" :value="s.title">{{ s.title }}</option>
              </select>
           </div>
           <div class="form-group">
              <label>Detalles / Motivo (Opcional)</label>
              <textarea v-model="manualTurnForm.details" rows="2" class="input-modern"></textarea>
           </div>

           <div class="form-actions mt-6 flex gap-2">
              <button @click="manualTurnStep = 1" class="btn-secondary" style="flex:1">Cambiar Paciente</button>
              <button @click="saveManualTurn" class="btn-primary" style="flex:1">Confirmar Turno</button>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { allTurnos, updateTurno, deleteTurno, addTurno, allUsers, updateUser, deleteUser, allServices, addService, updateService, deleteService, botKnowledge, siteConfig } from '../store'
import { db, storage } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage'

const router = useRouter()
const currentTab = ref('agenda')
const isSyncing = ref(false)

// Backup Logic
const exportDatabaseJSON = () => {
  const data = {
    turnos: allTurnos.value,
    pacientes: allUsers.value,
    config: siteConfig.value,
    chatbot: botKnowledge.value,
    servicios: allServices.value,
    timestamp: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup_clinica_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  alert("✅ ¡Backup descargado! Guarda este archivo en un lugar seguro (USB o Disco Externo). Contiene todos tus turnos y pacientes.")
}

const syncToCloud = async () => {
  if (!confirm('¿Quieres subir todos los cambios de diseño y configuración a la nube (Firebase)? Esto actualizará lo que ven los pacientes.')) return
  
  isSyncing.value = true
  try {
    await setDoc(doc(db, 'config', 'site'), siteConfig.value)
    await setDoc(doc(db, 'config', 'chatbot'), botKnowledge.value)
    await setDoc(doc(db, 'config', 'services'), { list: allServices.value })
    
    alert('✅ ¡Sincronización Exitosa! El sitio web oficial ha sido actualizado con tus cambios.')
  } catch (err) {
    console.error('Sync error:', err)
    alert('❌ Error al sincronizar: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}

const initializeCloudData = async () => {
  if (!confirm('¿Deseas inicializar la base de datos con el contenido profesional predeterminado?')) return
  
  isSyncing.value = true
  try {
     const defaultProfServices = [
        { id: 1, title: 'Estética Dental', description: 'Carillas, coronas de porcelana y diseño de sonrisa con resultados naturales.', icon: 'fas fa-gem', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1000&auto=format&fit=crop' },
        { id: 2, title: 'Ortodoncia', description: 'Brackets metálicos, cerámicos y zafiro para niños y adultos.', icon: 'fas fa-teeth-open', image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=1000&auto=format&fit=crop' },
        { id: 3, title: 'Implantes', description: 'Reposición dental con tecnología de alta precisión y biocompatibilidad.', icon: 'fas fa-shapes', image: 'https://images.unsplash.com/photo-1593054174034-78330547000e?q=80&w=1000&auto=format&fit=crop' },
        { id: 4, title: 'Endodoncia', description: 'Tratamientos de conducto avanzados, rápidos y sin dolor.', icon: 'fas fa-microscope', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop' },
        { id: 5, title: 'Prótesis', description: 'Soluciones fijas y removibles que devuelven la función y estética.', icon: 'fas fa-user-md', image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1000&auto=format&fit=crop' }
     ]

     allServices.value = defaultProfServices
     
     // Sincronizamos las 3 colecciones principales de configuración
     await setDoc(doc(db, 'config', 'site'), siteConfig.value)
     await setDoc(doc(db, 'config', 'chatbot'), botKnowledge.value)
     await setDoc(doc(db, 'config', 'services'), { list: allServices.value })
     
     alert('✨ Base de datos inicializada con servicios profesionales.')
  } catch (err) {
    alert('Error: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}
// const selectedDay = ref(null) (Removed duplicate declaration)

// Asegurar inicialización de FAQs si el localstorage estaba corrupto
if (!botKnowledge.value.faqs) {
  botKnowledge.value.faqs = []
}

// Calendar State
const now = new Date()
const currentMonth = ref(now.getMonth())
// Auto-seleccionar el día de hoy al cargar
const selectedDay = ref(now.getDate())
const currentYear = ref(now.getFullYear())

const initialDay = ref(now.getDate())
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Modal States
const showConfirmModal = ref(false)
const showEditModal = ref(false)
const showEditUserModal = ref(false)
const showNewUserModal = ref(false)
const showServiceModal = ref(false)
const showManualTurnModal = ref(false)
const manualTurnStep = ref(1) // 1: Buscar Paciente, 2: Nuevo Paciente, 3: Datos Turno
const userSearchQuery = ref('')
const selectedUserForTurn = ref(null)
const manualTurnForm = ref({ time: '', type: '', details: '' })

const selectedTurno = ref(null)
const assignedTime = ref('')
const editForm = ref({})
const editUserForm = ref({})
const newUserForm = ref({ name: '', lastName: '', dni: '', email: '', phone: '', birthDate: '', address: '', password: '' })
const serviceForm = ref({ title: '', description: '', icon: 'fas fa-tooth', allowedDays: [2, 4] })
const isEditingService = ref(false)
const isUploading = ref(false)
const galleryFiles = ref([])

const loadGallery = async () => {
  try {
    const listRef = storageRef(storage, 'galeria')
    const res = await listAll(listRef)
    const urls = await Promise.all(res.items.map(async (item) => {
      const url = await getDownloadURL(item)
      return { name: item.name, url, fullPath: item.fullPath }
    }))
    galleryFiles.value = urls
  } catch (err) {
    console.error("Error carrgando galeria:", err)
  }
}

// Cargar galería al cambiar a la pestaña
watch(currentTab, (newTab) => {
  if (newTab === 'galeria') loadGallery()
})

const handleGalleryUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return
  isUploading.value = true
  try {
    for (const file of files) {
      const fileRef = storageRef(storage, `galeria/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
    }
    await loadGallery()
    alert('✅ Fotos subidas con éxito!')
  } catch (err) {
    alert('Error al subir: ' + err.message)
  } finally {
    isUploading.value = false
  }
}

const deleteFromGallery = async (img) => {
  if (!confirm('¿Eliminar esta imagen de la galería?')) return
  try {
    const fileRef = storageRef(storage, img.fullPath)
    await deleteObject(fileRef)
    await loadGallery()
  } catch (err) {
    alert('Error al borrar: ' + err.message)
  }
}

const handleDirectUpload = async (event, target) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  try {
    const fileRef = storageRef(storage, `site/${target}_${Date.now()}_${file.name}`)
    await uploadBytes(fileRef, file)
    const url = await getDownloadURL(fileRef)
    
    if (target === 'hero') siteConfig.value.heroImage = url
    if (target === 'about') siteConfig.value.aboutImage = url
    if (target === 'service') serviceForm.value.image = url
    
    alert('✅ Imagen subida y aplicada con éxito!')
  } catch (err) {
    alert('Error al subir: ' + err.message)
  } finally {
    isUploading.value = false
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  alert('¡Link copiado al portapapeles!')
}

const tabs = [
  { id: 'solicitudes', name: 'Solicitudes', icon: 'fas fa-bell' },
  { id: 'agenda', name: 'Agenda', icon: 'fas fa-calendar-alt' },
  { id: 'usuarios', name: 'Pacientes', icon: 'fas fa-users' },
  { id: 'servicios', name: 'Servicios', icon: 'fas fa-list' },
  { id: 'galeria', name: 'Galería/Fotos', icon: 'fas fa-images' },
  { id: 'chatbot', name: 'ChatBot AI', icon: 'fas fa-robot' },
  { id: 'web', name: 'Web / Nube', icon: 'fas fa-globe' }
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

const isToday = (day) => {
  const t = new Date()
  return t.getDate() === day && t.getMonth() === currentMonth.value && t.getFullYear() === currentYear.value
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
const saveNewUser = async () => { 
  await registerUser({ ...newUserForm.value }); 
  showNewUserModal.value = false;
  alert('Paciente registrado exitosamente');
}
const saveUserEdit = async () => { await updateUser(editUserForm.value.email, editUserForm.value); showEditUserModal.value = false; }
const handleDeleteUser = (email) => { if (confirm('¿Eliminar usuario?')) deleteUser(email) }

const openNewServiceModal = () => { isEditingService.value = false; serviceForm.value = { title: '', description: '', icon: 'fas fa-tooth', allowedDays: [2, 4] }; showServiceModal.value = true; }
const openEditServiceModal = (service) => { isEditingService.value = true; serviceForm.value = { allowedDays: [2, 4], ...service }; showServiceModal.value = true; }
const saveService = () => {
  if (isEditingService.value) updateService(serviceForm.value.id, serviceForm.value)
  else addService(serviceForm.value)
  showServiceModal.value = false
}
const handleDeleteService = (id) => { if (confirm('Ãƒâ€šÃ‚Â¿Eliminar servicio?')) deleteService(id) }

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

// Manual Turn Logic
const openManualTurnModal = () => {
    manualTurnStep.value = 1
    userSearchQuery.value = ''
    selectedUserForTurn.value = null
    manualTurnForm.value = { time: '', type: allServices.value[0]?.title || '', details: '' }
    // Pre-limpiar formulario
    newUserForm.value = { name: '', lastName: '', dni: '', email: '', phone: '', birthDate: '', address: '', password: '' }
    showManualTurnModal.value = true
}

const filteredUsers = computed(() => {
    if (!userSearchQuery.value) return []
    const lower = userSearchQuery.value.toLowerCase()
    return allUsers.value.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.lastName.toLowerCase().includes(lower) || 
        u.dni.includes(lower)
    ).slice(0, 5) // Limitar resultados
})

const selectUserForTurn = (user) => {
    selectedUserForTurn.value = user
    manualTurnStep.value = 3
}

const goToNewUserStep = () => {
    manualTurnStep.value = 2
}

const saveNewUserAndContinue = async () => {
    // Validar campos obligatorios
    const f = newUserForm.value
    if(!f.name || !f.lastName || !f.dni || !f.birthDate || !f.address || !f.phone || !f.password) {
        alert('Por favor complete todos los campos obligatorios (marcados con *)')
        return
    }
    // Guardar usuario
    await registerUser({ ...newUserForm.value })
    selectedUserForTurn.value = { ...newUserForm.value }
    alert('Paciente creado correctamente')
    manualTurnStep.value = 3
}

const saveManualTurn = async () => {
    if (!manualTurnForm.value.time) {
        alert('Debe asignar un horario')
        return
    }
    
    // Construir fecha formato YYYY-MM-DD
    const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`

    await addTurno({
        firstName: selectedUserForTurn.value.name,
        lastName: selectedUserForTurn.value.lastName,
        dni: selectedUserForTurn.value.dni,
        email: selectedUserForTurn.value.email,
        phone: selectedUserForTurn.value.phone,
        birthDate: selectedUserForTurn.value.birthDate,
        type: manualTurnForm.value.type,
        details: manualTurnForm.value.details || 'Turno administrativo',
        selectedDate: dateStr,
        status: 'confirmado',
        assignedTime: manualTurnForm.value.time
    })
    
    showManualTurnModal.value = false
    alert('Turno asignado correctamente')
}

const remindTurno = (turno) => {
    const msg = encodeURIComponent(`Hola ${turno.firstName}, te recordamos tu turno para el día ${formatDate(turno.selectedDate)} a las ${turno.assignedTime}hs en el consultorio de la Dra. Pagnotta. ¡Te esperamos!`)
    const phone = turno.phone?.replace(/\D/g, '')
    window.open(`https://wa.me/549${phone}?text=${msg}`, '_blank')
}

const testGemini = async () => {
  if (!botKnowledge.value.geminiKey) return
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${botKnowledge.value.geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hola, responde solo 'OK' si recibes esto." }] }]
      })
    })
    const data = await response.json()
    if (data.candidates) alert('✅ ¡Conexión con Gemini Exitosa!')
    else alert('❌ Error en la clave: ' + JSON.stringify(data.error || data))
  } catch (err) {
    alert('❌ Error de red: ' + err.message)
  }
}
</script>

<style scoped>
.admin-dashboard { display: grid; grid-template-columns: 260px 1fr; height: 100vh; background: #f1f5f9; }
.sidebar { background: #0f172a; color: white; padding: 1.5rem 0; display: flex; flex-direction: column; }
.sidebar-nav { flex: 1; }
.sidebar-nav button { width: 100%; padding: 1rem 1.5rem; background: none; border: none; color: #94a3b8; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; font-weight: 500; transition: 0.3s; }
.sidebar-nav button.active { background: rgba(34, 211, 238, 0.1); color: #22d3ee; border-right: 4px solid #0e7490; }
.badge-count { margin-left: auto; background: #0e7490; color: white; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.7rem; }

.sidebar-footer { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); }
.btn-sidebar { padding: 0.8rem; border: none; border-radius: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; font-weight: 600; font-size: 0.85rem; transition: 0.3s; }
.btn-sidebar.danger { background: #fbbf24; color: #78350f; }
.btn-sidebar.danger:hover { background: #f59e0b; transform: scale(1.02); }
.logout-btn { background: #ef4444; color: white; }
.logout-btn:hover { background: #dc2626; transform: scale(1.02); }

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
.indicators-wrapper { display: flex; flex-direction: column; gap: 3px; width: 100%; margin-top: auto; }
.turn-indicator { font-size: 0.65rem; padding: 0.25rem 0.4rem; border-radius: 4px; text-align: left; font-weight: 700; color: white !important; line-height: 1.2; }
.turn-indicator.orto { background-color: #7c3aed !important; border-left: 3px solid #4c1d95; } /* Violeta Fuerte */
.turn-indicator.gral { background-color: #0284c7 !important; border-left: 3px solid #075985; } /* Azul Fuerte */

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

/* Manual Turn Styles */
.user-results-list { border: 1px solid #e2e8f0; border-radius: 0.5rem; max-height: 200px; overflow-y: auto; }
.user-result-item { padding: 0.8rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.user-result-item:hover { background: #f8fafc; color: #0e7490; }
.user-result-item:last-child { border-bottom: none; }
.selected-user-summary p { margin: 0; color: #1e293b; font-size: 0.9rem; }

/* Day Selector Styles */
.days-selector-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
.day-checkbox { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; background: #f8fafc; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; transition: 0.3s; }
.day-checkbox:hover { background: #f1f5f9; }
.day-checkbox input:checked + span { color: #0e7490; font-weight: 700; }
.day-checkbox input { width: auto; height: auto; margin: 0; }
/* Switch Toggle */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: #0e7490; }
input:focus + .slider { box-shadow: 0 0 1px #0e7490; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

/* UNIFIED LIST AGENDA (REFINED) */
.agenda-unified-layout { display: flex; flex-direction: column; gap: 2rem; }
.calendar-section { background: white; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.calendar-header-pro { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.month-selector { display: flex; align-items: center; gap: 1.5rem; }
.month-selector h3 { font-size: 1.6rem; font-weight: 800; color: #0f172a; }
.month-selector h3 span { color: #94a3b8; font-weight: 400; }
.btn-nav-flat { background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; transition: 0.3s; color: #64748b; }
.btn-nav-flat:hover { background: #0e7490; color: white; transform: scale(1.05); }

.calendar-grid-pro { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.weekday-pro { text-align: center; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; padding-bottom: 1rem; }
.day-cell-pro { aspect-ratio: 1.2; background: #f8fafc; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; position: relative; border: 1px solid transparent; }
.day-cell-pro:hover { background: white; border-color: #0e7490; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.day-cell-pro.today { background: #ecfeff; border-color: #22d3ee; }
.day-cell-pro.selected { background: #0e7490; color: white; transform: scale(1.05); z-index: 2; box-shadow: 0 10px 20px rgba(14, 116, 144, 0.2); }
.day-cell-pro.selected .day-num-pro { color: white; }
.day-num-pro { font-weight: 700; font-size: 1.1rem; color: #334155; }

.mini-indicators { display: flex; gap: 3px; position: absolute; bottom: 8px; }
.mini-dot { width: 4px; height: 4px; border-radius: 50%; background: #94a3b8; }
.selected .mini-dot { background: rgba(255,255,255,0.6); }

/* LIST SECTION */
.section-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.stats-pills { display: flex; gap: 8px; }
.pill { padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.pill-orto { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.pill-gral { background: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; }

.appointments-grid { display: flex; flex-direction: column; gap: 12px; }
.patient-card-row { background: white; padding: 1rem 1.5rem; border-radius: 1rem; display: grid; grid-template-columns: 100px 1fr auto; align-items: center; gap: 1.5rem; transition: 0.3s; border-left: 8px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.patient-card-row:hover { transform: translateX(5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.border-orto { border-left-color: #fbbf24; }
.border-gral { border-left-color: #22d3ee; }

.patient-time { font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
.patient-time i { color: #94a3b8; font-size: 0.9rem; }
.patient-info-main h4 { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.2rem; }
.patient-meta { display: flex; gap: 1.5rem; font-size: 0.85rem; color: #64748b; }
.patient-meta span { display: flex; align-items: center; gap: 6px; }

.patient-actions-list { display: flex; gap: 10px; }
.btn-action-round { padding: 0.5rem 1rem; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; transition: 0.3s; text-decoration: none; }
.btn-action-round.wa { background: #22c55e; color: white; }
.btn-action-round.edit { background: #f1f5f9; color: #475569; }
.btn-action-round.delete { background: #fee2e2; color: #ef4444; }
.btn-action-round:hover { opacity: 0.9; transform: translateY(-2px); }

.no-data-card, .select-day-prompt { background: white; padding: 4rem 2rem; border-radius: 1.5rem; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; }
.select-day-prompt i { font-size: 3rem; opacity: 0.2; }

/* Gallery Admin Styles */
.gallery-grid-admin { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem; }
.gallery-item-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: 0.3s; border: 1px solid #e2e8f0; }
.gallery-item-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
.gallery-img-wrapper { position: relative; aspect-ratio: 1; overflow: hidden; background: #f1f5f9; }
.gallery-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.gallery-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; gap: 1rem; opacity: 0; transition: 0.3s; }
.gallery-item-card:hover .gallery-overlay { opacity: 1; }
.btn-overlay { width: 40px; height: 40px; border-radius: 50%; border: none; background: white; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn-overlay:hover { transform: scale(1.1); background: #0e7490; color: white; }
.btn-overlay.delete:hover { background: #ef4444; }
.gallery-info { padding: 0.8rem; border-top: 1px solid #f1f5f9; }

.upload-progress-bar { background: #ecfeff; color: #0e7490; padding: 1rem; border-radius: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 1rem; }
.spinner { width: 20px; height: 20px; border: 3px solid #0e749020; border-top: 3px solid #0e7490; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.preview-img-admin img { width: 100%; max-height: 150px; object-fit: cover; border-radius: 0.8rem; border: 1px solid #e2e8f0; }
.hidden { display: none; }

</style>
