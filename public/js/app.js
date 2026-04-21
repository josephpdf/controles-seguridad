let currentUser = null;
let dataCache = { radios: [], keys: [], collaborators: [], users: [], transactions: [], areas: [] };

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userRoleDisplay').textContent = currentUser.role.toUpperCase();

    // Configurar permisos de navegación y formularios
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
        document.getElementById('navCollaborators').style.display = 'block';
        document.getElementById('navAreas').style.display = 'block';
        document.getElementById('navUsers').style.display = 'block';
    }
    
    // Restringir que los admins puedan crear superadmins
    if (currentUser.role !== 'superadmin') {
        const roleSelect = document.getElementById('userRole');
        if (roleSelect) {
            const superOption = roleSelect.querySelector('option[value="superadmin"]');
            if (superOption) superOption.remove();
        }
    }

    // Eventos de navegación
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-menu li').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
            
            const section = e.target.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            document.getElementById(`sec-${section}`).style.display = 'block';
        });
    });

    // Cargar datos iniciales
    loadAllData();

    // Eventos de formularios
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    const forms = [
        { id: 'radioForm', endpoint: 'radios', modal: 'radioModal', fields: ['radioNumero', 'radioArea', 'radioDetalle'], map: f => ({ numero: f[0], area: f[1], detalle: f[2] }) },
        { id: 'keyForm', endpoint: 'keys', modal: 'keyModal', fields: ['keyNumero', 'keyArea', 'keyDetalle'], map: f => ({ numero: f[0], area: f[1], detalle: f[2] }) },
        { id: 'collaboratorForm', endpoint: 'collaborators', modal: 'collaboratorModal', fields: ['collabName', 'collabArea'], map: f => ({ name: f[0], area: f[1] }) },
        { id: 'userForm', endpoint: 'users', modal: 'userModal', fields: ['userName', 'userUsername', 'userPassword', 'userRole'], map: f => ({ name: f[0], username: f[1], password: f[2], role: f[3] }) },
        { id: 'areaForm', endpoint: 'areas', modal: 'areaModal', fields: ['areaName'], map: f => ({ name: f[0] }) }
    ];

    forms.forEach(f => {
        const formEl = document.getElementById(f.id);
        if (formEl) {
            formEl.addEventListener('submit', async (e) => {
                e.preventDefault();
                const values = f.fields.map(fid => document.getElementById(fid).value);
                const payload = f.map(values);
                
                if (f.id === 'userForm') {
                    const uid = document.getElementById('userId').value;
                    if (uid) payload.id = parseInt(uid);
                }
                if (f.id === 'areaForm') {
                    const aid = document.getElementById('areaId').value;
                    if (aid) payload.id = parseInt(aid);
                }
                if (f.id === 'collaboratorForm') {
                    const cid = document.getElementById('collabId').value;
                    if (cid) payload.id = parseInt(cid);
                }

                await fetch(`/api/${f.endpoint}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-User': currentUser.username
                    },
                    body: JSON.stringify(payload)
                });
                
                formEl.reset();
                if (f.id === 'userForm') {
                    document.getElementById('userId').value = '';
                    document.getElementById('userModalTitle').textContent = 'Nuevo Usuario Oficial';
                    document.getElementById('userPassword').setAttribute('required', 'true');
                }
                if (f.id === 'areaForm') {
                    document.getElementById('areaId').value = '';
                    document.getElementById('areaModalTitle').textContent = 'Nueva Área';
                }
                if (f.id === 'collaboratorForm') {
                    document.getElementById('collabId').value = '';
                    document.getElementById('collaboratorModalTitle').textContent = 'Nuevo Colaborador';
                }
                closeModal(f.modal);
                await loadAllData();
            });
        }
    });
});

async function loadAllData() {
    await Promise.all([
        fetchData('radios'),
        fetchData('keys'),
        fetchData('collaborators'),
        fetchData('transactions'),
        (currentUser.role === 'superadmin' || currentUser.role === 'admin') ? fetchData('areas') : Promise.resolve(),
        (currentUser.role === 'superadmin' || currentUser.role === 'admin') ? fetchData('users') : Promise.resolve()
    ]);
    renderAll();
}

async function fetchData(endpoint) {
    try {
        const res = await fetch(`/api/${endpoint}`);
        dataCache[endpoint] = await res.json();
    } catch (e) {
        console.error(`Error loading ${endpoint}:`, e);
    }
}

function renderAll() {
    renderTransactions();
    renderRadios();
    renderKeys();
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
        renderCollaborators();
        renderAreas();
        renderUsers();
    }
    populateAreaSelects();
}

// ---- RENDERIZADOS ----
function renderTransactions() {
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    
    // Sort transactions by date desc
    const sorted = [...dataCache.transactions].sort((a,b) => new Date(b.dateOut) - new Date(a.dateOut));
    
    sorted.forEach(t => {
        const eqInfo = t.type === 'radio' 
            ? dataCache.radios.find(r => r.id == t.equipmentId)?.numero || 'Desconocido'
            : dataCache.keys.find(k => k.id == t.equipmentId)?.numero || 'Desconocido';
            
        const collab = dataCache.collaborators.find(c => c.id == t.collaboratorId)?.name || 'Desconocido';
        const isPending = !t.dateIn;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(t.dateOut).toLocaleString()}</td>
            <td>${t.type.toUpperCase()}</td>
            <td>${eqInfo}</td>
            <td>${collab}</td>
            <td>${t.officerOut}</td>
            <td>${t.officerIn || '-'}</td>
            <td><span class="badge ${isPending ? 'en-uso' : 'disponible'}">${isPending ? 'En Uso' : 'Devuelto'}</span></td>
            <td>
                ${isPending ? `<button class="btn-secondary" onclick="receiveEquipment(${t.id})">Recibir</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderRadios() {
    const tbody = document.querySelector('#radiosTable tbody');
    tbody.innerHTML = '';
    dataCache.radios.forEach(r => {
        // Check if in use
        const inUse = dataCache.transactions.some(t => t.type === 'radio' && t.equipmentId == r.id && !t.dateIn);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.numero}</td>
            <td>${r.area}</td>
            <td>${r.detalle}</td>
            <td><span class="badge ${inUse ? 'en-uso' : 'disponible'}">${inUse ? 'En Uso' : 'Disponible'}</span></td>
            <td>
                ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 
                  `<button class="btn-danger" onclick="deleteItem('radios', ${r.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderKeys() {
    // Similar to radios
    const tbody = document.querySelector('#keysTable tbody');
    tbody.innerHTML = '';
    dataCache.keys.forEach(k => {
        const inUse = dataCache.transactions.some(t => t.type === 'llave' && t.equipmentId == k.id && !t.dateIn);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${k.numero}</td>
            <td>${k.area}</td>
            <td>${k.detalle}</td>
            <td><span class="badge ${inUse ? 'en-uso' : 'disponible'}">${inUse ? 'En Uso' : 'Disponible'}</span></td>
            <td>
                ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 
                  `<button class="btn-danger" onclick="deleteItem('keys', ${k.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCollaborators() {
    const tbody = document.querySelector('#collaboratorsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    dataCache.collaborators.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.area}</td>
            <td>
                <button class="btn-secondary" onclick="editCollaborator(${c.id})">Editar</button>
                <button class="btn-danger" onclick="deleteItem('collaborators', ${c.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    dataCache.users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.username}</td>
            <td>${u.role}</td>
            <td>
                ${(u.role !== 'superadmin' || currentUser.role === 'superadmin') ? 
                  `<button class="btn-secondary" onclick="editUser(${u.id})">Editar</button>` : '-'}
                ${(u.id !== currentUser.id && (u.role !== 'superadmin' || currentUser.role === 'superadmin')) ? 
                  `<button class="btn-danger" onclick="deleteItem('users', ${u.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAreas() {
    const tbody = document.querySelector('#areasTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(dataCache.areas)) return;
    dataCache.areas.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.name}</td>
            <td>
                <button class="btn-secondary" onclick="editArea(${a.id})">Editar</button>
                <button class="btn-danger" onclick="deleteItem('areas', ${a.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateAreaSelects() {
    if (!Array.isArray(dataCache.areas)) return;
    const options = dataCache.areas.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
    
    const collabSelect = document.getElementById('collabArea');
    const radioSelect = document.getElementById('radioArea');
    const keySelect = document.getElementById('keyArea');
    
    if (collabSelect) collabSelect.innerHTML = options;
    if (radioSelect) radioSelect.innerHTML = options;
    if (keySelect) keySelect.innerHTML = options;
}

// ---- LOGICA TRANSACCIONES ----
function openTransactionModal() {
    loadEquipmentOptions();
    
    // Cargar colaboradores
    const selectC = document.getElementById('transCollaborator');
    selectC.innerHTML = dataCache.collaborators.map(c => `<option value="${c.id}">${c.name} (${c.area})</option>`).join('');
    
    openModal('transactionModal');
}

function loadEquipmentOptions() {
    const type = document.getElementById('transType').value;
    const selectE = document.getElementById('transEquipment');
    const catalog = type === 'radio' ? dataCache.radios : dataCache.keys;
    
    // Filtrar los que no están en uso
    const available = catalog.filter(item => {
        return !dataCache.transactions.some(t => t.type === type && t.equipmentId == item.id && !t.dateIn);
    });

    if (available.length === 0) {
        selectE.innerHTML = '<option value="">-- No hay equipos disponibles --</option>';
    } else {
        selectE.innerHTML = available.map(e => `<option value="${e.id}">${e.numero} - ${e.detalle}</option>`).join('');
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const equipmentId = document.getElementById('transEquipment').value;
    if (!equipmentId) {
        alert("Seleccione un equipo disponible.");
        return;
    }

    const payload = {
        type: document.getElementById('transType').value,
        equipmentId: parseInt(equipmentId),
        collaboratorId: parseInt(document.getElementById('transCollaborator').value),
        officerOut: currentUser.name,
        dateOut: new Date().toISOString(),
        dateIn: null,
        officerIn: null
    };

    await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User': currentUser.username
        },
        body: JSON.stringify(payload)
    });

    closeModal('transactionModal');
    await loadAllData();
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

// ---- UTILS ----
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

async function deleteItem(endpoint, id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    await fetch(`/api/${endpoint}/${id}`, { 
        method: 'DELETE',
        headers: { 'X-User': currentUser.username }
    });
    await loadAllData();
}
