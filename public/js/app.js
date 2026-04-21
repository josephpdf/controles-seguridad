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
        { id: 'radioForm', endpoint: 'radios', modal: 'radioModal', fields: ['radioNumero', 'radioSerie', 'radioArea', 'radioColaborador', 'radioDetalle'], map: f => ({ numero: f[0], serie: f[1], area: f[2], colaborador: f[3], detalle: f[4] }) },
        { id: 'keyForm', endpoint: 'keys', modal: 'keyModal', fields: ['keyNumero', 'keyColaborador', 'keyDetalle'], map: f => ({ numero: f[0], colaborador: f[1], detalle: f[2] }) },
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
                if (f.id === 'radioForm') {
                    const rid = document.getElementById('radioId').value;
                    if (rid) payload.id = parseInt(rid);
                }
                if (f.id === 'keyForm') {
                    const kid = document.getElementById('keyId').value;
                    if (kid) payload.id = parseInt(kid);
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
                if (f.id === 'radioForm') {
                    document.getElementById('radioId').value = '';
                    document.getElementById('radioModalTitle').textContent = 'Nuevo Radio';
                }
                if (f.id === 'keyForm') {
                    document.getElementById('keyId').value = '';
                    document.getElementById('keyModalTitle').textContent = 'Nueva Llave';
                }
                closeModal(f.modal);
                await loadAllData();
            });
        }
    });
});

let sortState = {
    transactions: { field: 'dateOut', dir: 'desc' },
    radios: { field: 'numero', dir: 'asc' },
    keys: { field: 'numero', dir: 'asc' },
    collaborators: { field: 'name', dir: 'asc' },
    users: { field: 'name', dir: 'asc' },
    areas: { field: 'name', dir: 'asc' }
};

function toggleSort(endpoint, field) {
    if (sortState[endpoint].field === field) {
        sortState[endpoint].dir = sortState[endpoint].dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState[endpoint].field = field;
        sortState[endpoint].dir = 'asc';
    }
    if(endpoint === 'radios') renderRadios();
    else if(endpoint === 'keys') renderKeys();
    else if(endpoint === 'collaborators') renderCollaborators();
    else if(endpoint === 'areas') renderAreas();
    else if(endpoint === 'users') renderUsers();
    else if(endpoint === 'transactions') renderTransactions();
}

function updateSortIndicators(tableId, endpoint) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const ths = table.querySelectorAll('th');
    ths.forEach(th => {
        const span = th.querySelector('span');
        if (!span) return;
        const attr = th.getAttribute('onclick');
        if (attr && attr.includes(`'${sortState[endpoint].field}'`)) {
            span.textContent = sortState[endpoint].dir === 'asc' ? ' ↑' : ' ↓';
        } else {
            span.textContent = '';
        }
    });
}

function getFilteredAndSorted(endpoint, list, searchFields) {
    const input = document.getElementById(`search-${endpoint}`);
    const query = input ? input.value.toLowerCase() : '';
    
    let result = [...list];
    
    if (query) {
        result = result.filter(item => {
            return searchFields.some(field => {
                const val = item[field];
                return val && val.toString().toLowerCase().includes(query);
            });
        });
    }
    
    const { field, dir } = sortState[endpoint];
    if (field) {
        result.sort((a, b) => {
            let valA = a[field]?.toString().toLowerCase() || '';
            let valB = b[field]?.toString().toLowerCase() || '';
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Defer updateSortIndicators until after the table renders or do it directly
    setTimeout(() => updateSortIndicators(`${endpoint}Table`, endpoint), 0);
    return result;
}

// Helper para obtener todas las personas (Usuarios + Colaboradores) unificados
function getAllPeople() {
    const peopleMap = new Map();
    
    // Primero agregamos los colaboradores
    if (Array.isArray(dataCache.collaborators)) {
        dataCache.collaborators.forEach(c => {
            peopleMap.set(c.id, { id: c.id, name: c.name, area: c.area });
        });
    }
    
    // Luego agregamos los usuarios que no estén (evitando duplicados por nombre)
    if (Array.isArray(dataCache.users)) {
        dataCache.users.forEach(u => {
            // Check si ya existe alguien con ese nombre
            const exists = Array.from(peopleMap.values()).some(p => p.name.toLowerCase().trim() === u.name.toLowerCase().trim());
            if (!exists) {
                peopleMap.set(u.id, { id: u.id, name: u.name, area: 'Usuario del Sistema' });
            }
        });
    }
    
    return Array.from(peopleMap.values());
}

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
    
    const statusFilter = document.getElementById('status-transactions')?.value || '';
    
    let list = dataCache.transactions.map(t => {
        const eqInfo = t.type === 'radio' 
            ? dataCache.radios.find(r => r.id == t.equipmentId)?.numero || 'Desconocido'
            : dataCache.keys.find(k => k.id == t.equipmentId)?.numero || 'Desconocido';
        const collab = getAllPeople().find(c => c.id == t.collaboratorId)?.name || 'Desconocido';
        return {
            ...t,
            eqInfo,
            collab,
            dateOutFormatted: new Date(t.dateOut).toLocaleString(),
            dateInFormatted: t.dateIn ? new Date(t.dateIn).toLocaleString() : '-'
        };
    });

    if (statusFilter === 'en-uso') list = list.filter(t => !t.dateIn);
    if (statusFilter === 'devuelto') list = list.filter(t => t.dateIn);

    list = getFilteredAndSorted('transactions', list, ['dateOutFormatted', 'dateInFormatted', 'type', 'eqInfo', 'collab', 'officerOut', 'officerIn']);
    
    list.forEach(t => {
        const isPending = !t.dateIn;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.dateOutFormatted}</td>
            <td>${t.dateInFormatted}</td>
            <td>${t.type.toUpperCase()}</td>
            <td>${t.eqInfo}</td>
            <td>${t.collab}</td>
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
    
    const statusFilter = document.getElementById('status-radios')?.value || '';
    
    let list = dataCache.radios.map(r => {
        const activeTx = dataCache.transactions.find(t => t.type === 'radio' && t.equipmentId == r.id && !t.dateIn);
        const inUse = !!activeTx;
        
        let statusVal = '';
        let statusBadge = '';
        let statusText = '';
        let collabName = '-';

        if (r.colaborador) {
            statusVal = 'no-disponible';
            statusBadge = 'en-uso';
            statusText = 'No Disponible';
            collabName = getAllPeople().find(c => c.id == r.colaborador)?.name || 'Desconocido';
        } else if (inUse) {
            statusVal = 'en-uso';
            statusBadge = 'en-uso';
            statusText = 'En Uso';
            collabName = getAllPeople().find(c => c.id == activeTx.collaboratorId)?.name || 'Desconocido';
        } else {
            statusVal = 'disponible';
            statusBadge = 'disponible';
            statusText = 'Disponible';
        }
        
        return { ...r, statusVal, statusBadge, statusText, collabName };
    });

    if (statusFilter) list = list.filter(r => r.statusVal === statusFilter);

    list = getFilteredAndSorted('radios', list, ['numero', 'area', 'detalle', 'collabName', 'statusText']);
    
    list.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.numero}</td>
            <td>${r.area}</td>
            <td>${r.detalle}</td>
            <td>${r.collabName}</td>
            <td><span class="badge ${r.statusBadge}">${r.statusText}</span></td>
            <td>
                ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 
                  `<button class="btn-secondary" onclick="editRadio(${r.id})">Editar</button>
                   <button class="btn-danger" onclick="deleteItem('radios', ${r.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderKeys() {
    const tbody = document.querySelector('#keysTable tbody');
    tbody.innerHTML = '';
    
    const statusFilter = document.getElementById('status-keys')?.value || '';
    
    let list = dataCache.keys.map(k => {
        const activeTx = dataCache.transactions.find(t => t.type === 'llave' && t.equipmentId == k.id && !t.dateIn);
        const inUse = !!activeTx;
        
        let statusVal = '';
        let statusBadge = '';
        let statusText = '';
        let collabName = '-';

        if (k.colaborador) {
            statusVal = 'no-disponible';
            statusBadge = 'en-uso';
            statusText = 'No Disponible';
            collabName = getAllPeople().find(c => c.id == k.colaborador)?.name || 'Desconocido';
        } else if (inUse) {
            statusVal = 'en-uso';
            statusBadge = 'en-uso';
            statusText = 'En Uso';
            collabName = getAllPeople().find(c => c.id == activeTx.collaboratorId)?.name || 'Desconocido';
        } else {
            statusVal = 'disponible';
            statusBadge = 'disponible';
            statusText = 'Disponible';
        }
        
        return { ...k, statusVal, statusBadge, statusText, collabName };
    });

    if (statusFilter) list = list.filter(k => k.statusVal === statusFilter);

    list = getFilteredAndSorted('keys', list, ['numero', 'detalle', 'collabName', 'statusText']);
    
    list.forEach(k => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${k.numero}</td>
            <td>${k.detalle}</td>
            <td>${k.collabName}</td>
            <td><span class="badge ${k.statusBadge}">${k.statusText}</span></td>
            <td>
                ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 
                  `<button class="btn-secondary" onclick="editKey(${k.id})">Editar</button>
                   <button class="btn-danger" onclick="deleteItem('keys', ${k.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCollaborators() {
    const tbody = document.querySelector('#collaboratorsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let list = getFilteredAndSorted('collaborators', dataCache.collaborators, ['name', 'area']);
    
    list.forEach(c => {
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
    
    let list = getFilteredAndSorted('users', dataCache.users, ['name', 'username', 'role']);
    
    list.forEach(u => {
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
    
    let list = getFilteredAndSorted('areas', dataCache.areas, ['name']);
    
    list.forEach(a => {
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
    
    if (collabSelect) collabSelect.innerHTML = options;
    if (radioSelect) radioSelect.innerHTML = options;

    const radioCollab = document.getElementById('radioColaborador');
    const keyCollab = document.getElementById('keyColaborador');
    const userNameSelect = document.getElementById('userName');
    const allPeople = getAllPeople();
    
    if (allPeople.length > 0) {
        const sortedCollabs = allPeople.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        
        // Opciones por ID (para transacciones, radios, llaves)
        const collabOptionsById = '<option value="">-- Ninguno (Disponible) --</option>' + 
            sortedCollabs.map(c => `<option value="${c.id}">${c.name} (${c.area})</option>`).join('');
            
        // Opciones por Nombre (para crear usuarios, porque la base de datos guarda el nombre directo)
        const collabOptionsByName = '<option value="">-- Seleccione un colaborador --</option>' + 
            sortedCollabs.map(c => `<option value="${c.name}">${c.name} (${c.area})</option>`).join('');
            
        if (radioCollab) radioCollab.innerHTML = collabOptionsById;
        if (keyCollab) keyCollab.innerHTML = collabOptionsById;
        if (userNameSelect) userNameSelect.innerHTML = collabOptionsByName;
    }
}

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

async function deleteItem(endpoint, id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    await fetch(`/api/${endpoint}/${id}`, { 
        method: 'DELETE',
        headers: { 'X-User': currentUser.username }
    });
    await loadAllData();
}
