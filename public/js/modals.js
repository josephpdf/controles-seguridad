// ---- UTILS & MODALS ----
function formatForDateTimeLocal(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
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

function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
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

function editTransaction(id) {
    const t = dataCache.transactions.find(x => x.id === id);
    if (!t) return;
    document.getElementById('editTransId').value = t.id;
    document.getElementById('editTransDateOut').value = formatForDateTimeLocal(t.dateOut);
    document.getElementById('editTransDateIn').value = formatForDateTimeLocal(t.dateIn);
    openModal('editTransactionModal');
}

function editMemberAccess(id) {
    const a = dataCache.member_access.find(x => x.id === id);
    if (!a) return;
    document.getElementById('editAccessId').value = a.id;
    document.getElementById('editAccessDateIn').value = formatForDateTimeLocal(a.dateIn);
    document.getElementById('editAccessDateOut').value = formatForDateTimeLocal(a.dateOut);
    openModal('editMemberAccessModal');
}

function editUser(id) {
    const user = dataCache.users.find(u => u.id === id);
    if (!user) return;
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').removeAttribute('required');
    document.getElementById('userModalTitle').textContent = 'Editar Usuario';
    openModal('userModal');
}

function editArea(id) {
    const area = dataCache.areas.find(a => a.id === id);
    if (!area) return;
    document.getElementById('areaId').value = area.id;
    document.getElementById('areaName').value = area.name;
    document.getElementById('areaModalTitle').textContent = 'Editar Área';
    openModal('areaModal');
}

function editCollaborator(id) {
    const collab = dataCache.collaborators.find(c => c.id === id);
    if (!collab) return;
    document.getElementById('collabId').value = collab.id;
    document.getElementById('collabName').value = collab.name;
    document.getElementById('collabArea').value = collab.area;
    document.getElementById('collaboratorModalTitle').textContent = 'Editar Colaborador';
    openModal('collaboratorModal');
}

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
