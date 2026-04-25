let currentUser = null;
let dataCache = { radios: [], keys: [], collaborators: [], users: [], transactions: [], areas: [], member_access: [] };

let sortState = {
    transactions: { field: 'dateOut', dir: 'desc' },
    radios: { field: 'numero', dir: 'asc' },
    keys: { field: 'numero', dir: 'asc' },
    collaborators: { field: 'name', dir: 'asc' },
    users: { field: 'name', dir: 'asc' },
    areas: { field: 'name', dir: 'asc' },
    member_access: { field: 'dateIn', dir: 'desc' }
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
    else if(endpoint === 'member_access') renderMemberAccess();
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
        fetchData('member_access'),
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

async function deleteItem(endpoint, id) {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    await fetch(`/api/${endpoint}/${id}`, { 
        method: 'DELETE',
        headers: { 'X-User': currentUser.username }
    });
    await loadAllData();
}
