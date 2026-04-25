// ---- LOGICA TRANSACCIONES ----
function openTransactionModal() {
    loadEquipmentOptions();
    
    // Cargar colaboradores ordenados alfabéticamente unificados
    const selectC = document.getElementById('transCollaborator');
    const sortedCollabs = getAllPeople().sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    selectC.innerHTML = sortedCollabs.map(c => `<option value="${c.id}">${c.name} (${c.area})</option>`).join('');
    
    openModal('transactionModal');
}

function loadEquipmentOptions() {
    const type = document.getElementById('transType').value;
    const selectE = document.getElementById('transEquipment');
    const catalog = type === 'radio' ? dataCache.radios : dataCache.keys;
    
    // Filtrar los que no están en uso y no están asignados permanentemente
    const available = catalog.filter(item => {
        const isPermanentlyAssigned = item.colaborador && item.colaborador !== '';
        const hasActiveTransaction = dataCache.transactions.some(t => t.type === type && t.equipmentId == item.id && !t.dateIn);
        return !isPermanentlyAssigned && !hasActiveTransaction;
    });

    if (available.length === 0) {
        selectE.innerHTML = '<option value="">-- No hay equipos disponibles --</option>';
    } else {
        selectE.innerHTML = available.map(e => `<option value="${e.id}">${e.numero} - ${e.detalle}</option>`).join('');
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('transType').value;
    const equipmentId = document.getElementById('transEquipment').value;
    const collaboratorId = document.getElementById('transCollaborator').value;
    
    if (!type || !equipmentId || !collaboratorId) {
        alert('Por favor complete todos los campos.');
        return;
    }
    
    const payload = {
        type,
        equipmentId: parseInt(equipmentId),
        collaboratorId: parseInt(collaboratorId),
        officerOut: currentUser.name,
        dateOut: new Date().toISOString(),
        dateIn: null,
        officerIn: null
    };
    
    fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User': currentUser.name },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        closeModal('transactionModal');
        loadAllData();
    }).catch(e => console.error('Error al guardar transacción:', e));
}

async function receiveEquipment(transactionId) {
    if (!confirm('¿Confirmar recepción del equipo?')) return;
    
    const t = dataCache.transactions.find(x => x.id === transactionId);
    if (!t) return;

    t.dateIn = new Date().toISOString();
    t.officerIn = currentUser.name;

    await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User': currentUser.username
        },
        body: JSON.stringify(t) // Envía el objeto actualizado, el backend lo reemplazará por el ID
    });

    await loadAllData();
}

function handleMemberAccessSubmit(e) {
    e.preventDefault();
    const memberNumber = document.getElementById('accessMemberNumber').value;
    const memberName = document.getElementById('accessMemberName').value;
    const observations = document.getElementById('accessObservations').value;
    
    if (!memberNumber || !memberName) {
        alert('Por favor complete el número y nombre del socio.');
        return;
    }
    
    const payload = {
        memberNumber,
        memberName,
        observations,
        officerIn: currentUser.name,
        dateIn: new Date().toISOString(),
        dateOut: null,
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

async function registerMemberExit(id) {
    if (!confirm('¿Confirmar salida del socio?')) return;
    
    const a = dataCache.member_access.find(x => x.id === id);
    if (!a) return;

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
