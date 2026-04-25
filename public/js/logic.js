/**
 * logic.js
 * 
 * Este archivo contiene la lógica de negocio específica para procesar 
 * formularios complejos como las Transacciones (préstamo/devolución)
 * y los Accesos de Socios (ingreso/salida).
 */

// ==========================================
// TRANSACCIONES (Préstamos y Devoluciones)
// ==========================================

/**
 * Prepara y abre el modal para registrar una nueva salida (préstamo)
 */
function openTransactionModal() {
    // Cargar las opciones del equipo (radios o llaves) en base al tipo seleccionado
    loadEquipmentOptions();
    
    // Cargar la lista unificada de colaboradores y usuarios para asignación
    const selectC = document.getElementById('transCollaborator');
    // Se ordenan alfabéticamente para facilitar la búsqueda en el dropdown
    const sortedCollabs = getAllPeople().sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    selectC.innerHTML = sortedCollabs.map(c => `<option value="${c.id}">${c.name} (${c.area})</option>`).join('');
    
    openModal('transactionModal');
}

/**
 * Filtra y carga los equipos disponibles en el selector del formulario
 * de préstamos, garantizando que no se preste algo que ya está en uso.
 */
function loadEquipmentOptions() {
    const type = document.getElementById('transType').value;
    const selectE = document.getElementById('transEquipment');
    
    // Decidir qué catálogo revisar según el tipo
    const catalog = type === 'radio' ? dataCache.radios : dataCache.keys;
    
    // Filtrar los que no están en uso temporal ni asignados fijamente
    const available = catalog.filter(item => {
        const isPermanentlyAssigned = item.colaborador && item.colaborador !== '';
        // Buscar si existe una transacción activa para este equipo específico
        const hasActiveTransaction = dataCache.transactions.some(t => t.type === type && t.equipmentId == item.id && !t.dateIn);
        
        return !isPermanentlyAssigned && !hasActiveTransaction;
    });

    if (available.length === 0) {
        selectE.innerHTML = '<option value="">-- No hay equipos disponibles --</option>';
    } else {
        selectE.innerHTML = available.map(e => `<option value="${e.id}">${e.numero} - ${e.detalle}</option>`).join('');
    }
}

/**
 * Maneja el envío del formulario para crear un nuevo préstamo.
 * Toma los datos, añade metadatos (fecha, oficial) y envía al backend.
 * @param {Event} e - Evento de formulario
 */
function handleTransactionSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('transType').value;
    const equipmentId = document.getElementById('transEquipment').value;
    const collaboratorId = document.getElementById('transCollaborator').value;
    
    if (!type || !equipmentId || !collaboratorId) {
        alert('Por favor complete todos los campos.');
        return;
    }
    
    // Construir el objeto transacción
    const payload = {
        type,
        equipmentId: parseInt(equipmentId),
        collaboratorId: parseInt(collaboratorId),
        officerOut: currentUser.name, // Oficial que realiza la entrega
        dateOut: new Date().toISOString(), // Fecha/Hora actual
        dateIn: null, // Aún no ha sido devuelto
        officerIn: null
    };
    
    fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User': currentUser.name },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        closeModal('transactionModal');
        loadAllData(); // Recargar datos para mostrar en la tabla
    }).catch(e => console.error('Error al guardar transacción:', e));
}

/**
 * Registra la devolución de un equipo marcando la transacción activa como finalizada.
 * @param {number} transactionId - ID de la transacción a cerrar
 */
async function receiveEquipment(transactionId) {
    if (!confirm('¿Confirmar recepción del equipo?')) return;
    
    const t = dataCache.transactions.find(x => x.id === transactionId);
    if (!t) return;

    // Actualizar campos de finalización
    t.dateIn = new Date().toISOString();
    t.officerIn = currentUser.name;

    await fetch('/api/transactions', {
        method: 'POST', // Nuestro backend maneja PUT dentro de POST si hay un ID
        headers: { 
            'Content-Type': 'application/json',
            'X-User': currentUser.username
        },
        body: JSON.stringify(t)
    });

    await loadAllData();
}

// ==========================================
// CONTROL DE ACCESO DE SOCIOS
// ==========================================

/**
 * Maneja el registro de un nuevo ingreso de socio a las instalaciones
 * @param {Event} e - Evento del formulario
 */
function handleMemberAccessSubmit(e) {
    e.preventDefault();
    const memberNumber = document.getElementById('accessMemberNumber').value;
    const memberName = document.getElementById('accessMemberName').value;
    const observations = document.getElementById('accessObservations').value;
    
    if (!memberNumber || !memberName) {
        alert('Por favor complete el número y nombre del socio.');
        return;
    }
    
    // Construir el registro de acceso
    const payload = {
        memberNumber,
        memberName,
        observations,
        officerIn: currentUser.name, // Oficial que da acceso
        dateIn: new Date().toISOString(),
        dateOut: null, // Aún no ha salido
        officerOut: null
    };
    
    fetch('/api/member_access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User': currentUser.name },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        closeModal('memberAccessModal');
        document.getElementById('memberAccessForm').reset();
        loadAllData();
    }).catch(e => console.error('Error al guardar acceso:', e));
}

/**
 * Registra la salida de un socio de las instalaciones
 * @param {number} id - ID del registro de acceso
 */
async function registerMemberExit(id) {
    if (!confirm('¿Confirmar salida del socio?')) return;
    
    const a = dataCache.member_access.find(x => x.id === id);
    if (!a) return;

    // Marcar la salida
    a.dateOut = new Date().toISOString();
    a.officerOut = currentUser.name;

    await fetch('/api/member_access', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User': currentUser.username
        },
        body: JSON.stringify(a)
    });

    await loadAllData();
}
