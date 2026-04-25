/**
 * modals.js
 * 
 * Este archivo gestiona el comportamiento de las ventanas modales de la aplicación,
 * incluyendo su apertura, cierre, formateo de fechas y preparación de formularios
 * para la creación o edición de registros (CRUD).
 */

/**
 * Formatea una fecha en formato ISO para que pueda ser asignada al valor
 * de un input de tipo datetime-local en los formularios HTML.
 * @param {string} isoString - Fecha en formato ISO 8601 (ej. "2023-10-25T10:30:00.000Z")
 * @returns {string} - Fecha formateada (ej. "2023-10-25T06:30")
 */
function formatForDateTimeLocal(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Abre una ventana modal por su ID.
 * También realiza ajustes específicos a los títulos y campos requeridos
 * si se está abriendo en modo "Creación" (cuando los campos ocultos de ID están vacíos).
 * @param {string} id - El ID del elemento modal en el DOM (ej. 'transactionModal')
 */
function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
    
    // Ajustes dinámicos según el tipo de modal:
    // Si se está creando un nuevo registro (el ID oculto está vacío),
    // se restauran los títulos y los requisitos de los campos (ej. la contraseña es obligatoria).
    if (id === 'userModal') {
        const uid = document.getElementById('userId').value;
        if (!uid) {
            document.getElementById('userModalTitle').textContent = 'Nuevo Usuario Oficial';
            document.getElementById('userPassword').setAttribute('required', 'true');
        }
    }
    if (id === 'areaModal') {
        const aid = document.getElementById('areaId').value;
        if (!aid) {
            document.getElementById('areaModalTitle').textContent = 'Nueva Área';
        }
    }
    if (id === 'collaboratorModal') {
        const cid = document.getElementById('collabId').value;
        if (!cid) {
            document.getElementById('collaboratorModalTitle').textContent = 'Nuevo Colaborador';
        }
    }
    if (id === 'radioModal') {
        const rid = document.getElementById('radioId').value;
        if (!rid) {
            document.getElementById('radioModalTitle').textContent = 'Nuevo Radio';
        }
    }
    if (id === 'keyModal') {
        const kid = document.getElementById('keyId').value;
        if (!kid) {
            document.getElementById('keyModalTitle').textContent = 'Nueva Llave';
        }
    }
}

/**
 * Cierra una ventana modal por su ID y resetea su formulario asociado 
 * para limpiar cualquier dato previo (evitando estados inconsistentes).
 * @param {string} id - El ID del modal a cerrar
 */
function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
    
    // Limpieza de formularios y campos ocultos
    if (id === 'userModal') {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
    }
    if (id === 'areaModal') {
        document.getElementById('areaForm').reset();
        document.getElementById('areaId').value = '';
    }
    if (id === 'collaboratorModal') {
        document.getElementById('collaboratorForm').reset();
        document.getElementById('collabId').value = '';
    }
    if (id === 'radioModal') {
        document.getElementById('radioForm').reset();
        document.getElementById('radioId').value = '';
    }
    if (id === 'keyModal') {
        document.getElementById('keyForm').reset();
        document.getElementById('keyId').value = '';
    }
}

// ==============================================================
// FUNCIONES DE PREPARACIÓN DE EDICIÓN (Llenado de Formularios)
// ==============================================================

/**
 * Prepara el modal para editar los tiempos de una transacción existente.
 * @param {number} id - ID de la transacción a editar
 */
function editTransaction(id) {
    const t = dataCache.transactions.find(x => x.id === id);
    if (!t) return;
    document.getElementById('editTransId').value = t.id;
    document.getElementById('editTransDateOut').value = formatForDateTimeLocal(t.dateOut);
    document.getElementById('editTransDateIn').value = formatForDateTimeLocal(t.dateIn);
    openModal('editTransactionModal');
}

/**
 * Prepara el modal para editar los tiempos de acceso de un socio.
 * @param {number} id - ID del registro de acceso
 */
function editMemberAccess(id) {
    const a = dataCache.member_access.find(x => x.id === id);
    if (!a) return;
    document.getElementById('editAccessId').value = a.id;
    document.getElementById('editAccessDateIn').value = formatForDateTimeLocal(a.dateIn);
    document.getElementById('editAccessDateOut').value = formatForDateTimeLocal(a.dateOut);
    openModal('editMemberAccessModal');
}

/**
 * Prepara el modal para editar la información de un Usuario.
 * Nota: La contraseña no se carga por seguridad y se vuelve opcional.
 * @param {number} id - ID del usuario
 */
function editUser(id) {
    const user = dataCache.users.find(u => u.id === id);
    if (!user) return;
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userRole').value = user.role;
    
    // Configuración específica de contraseña
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').removeAttribute('required'); // Al editar no es obligatorio
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    
    openModal('userModal');
}

/**
 * Prepara el modal para editar un Área.
 * @param {number} id - ID del área
 */
function editArea(id) {
    const area = dataCache.areas.find(a => a.id === id);
    if (!area) return;
    document.getElementById('areaId').value = area.id;
    document.getElementById('areaName').value = area.name;
    document.getElementById('areaModalTitle').textContent = 'Editar Área';
    openModal('areaModal');
}

/**
 * Prepara el modal para editar un Colaborador.
 * @param {number} id - ID del colaborador
 */
function editCollaborator(id) {
    const collab = dataCache.collaborators.find(c => c.id === id);
    if (!collab) return;
    document.getElementById('collabId').value = collab.id;
    document.getElementById('collabName').value = collab.name;
    document.getElementById('collabArea').value = collab.area;
    document.getElementById('collaboratorModalTitle').textContent = 'Editar Colaborador';
    openModal('collaboratorModal');
}

/**
 * Prepara el modal para editar la información de un Radio.
 * @param {number} id - ID del radio
 */
function editRadio(id) {
    const radio = dataCache.radios.find(r => r.id === id);
    if (!radio) return;
    document.getElementById('radioId').value = radio.id;
    document.getElementById('radioNumero').value = radio.numero;
    document.getElementById('radioSerie').value = radio.serie || '';
    document.getElementById('radioArea').value = radio.area;
    document.getElementById('radioColaborador').value = radio.colaborador || '';
    document.getElementById('radioDetalle').value = radio.detalle;
    document.getElementById('radioModalTitle').textContent = 'Editar Radio';
    openModal('radioModal');
}

/**
 * Prepara el modal para editar la información de una Llave.
 * @param {number} id - ID de la llave
 */
function editKey(id) {
    const key = dataCache.keys.find(k => k.id === id);
    if (!key) return;
    document.getElementById('keyId').value = key.id;
    document.getElementById('keyNumero').value = key.numero;
    document.getElementById('keyColaborador').value = key.colaborador || '';
    document.getElementById('keyDetalle').value = key.detalle;
    document.getElementById('keyModalTitle').textContent = 'Editar Llave';
    openModal('keyModal');
}

// ==============================================================
// FUNCIONES DE ALERTAS Y CONFIRMACIONES PERSONALIZADAS
// ==============================================================

/**
 * Muestra un modal de alerta personalizado.
 * @param {string} message - Mensaje a mostrar
 * @param {function} callback - Función opcional a ejecutar al cerrar la alerta
 */
function showCustomAlert(message, callback = null) {
    document.getElementById('customAlertMessage').textContent = message;
    window.customAlertCallback = callback;
    openModal('customAlertModal');
}

/**
 * Muestra un modal de confirmación personalizado y devuelve una Promesa.
 * @param {string} message - Mensaje a mostrar en la confirmación
 * @returns {Promise<boolean>} - Promesa que se resuelve con true o false
 */
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        document.getElementById('customConfirmMessage').textContent = message;
        window.customConfirmResolve = resolve;
        openModal('customConfirmModal');
    });
}
