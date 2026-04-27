/**
 * api.js
 * 
 * Este archivo contiene la lógica para la comunicación con el backend,
 * almacenamiento en caché de los datos obtenidos y funciones genéricas 
 * para ordenar y filtrar listas de datos.
 */

// Variable global para almacenar el usuario autenticado
let currentUser = null;

// Objeto que actúa como caché de datos para evitar peticiones redundantes al backend
let dataCache = { 
    radios: [], 
    keys: [], 
    collaborators: [], 
    users: [], 
    transactions: [], 
    areas: [], 
    member_access: [],
    logs: [],
    archived_radios: [],
    archived_keys: [],
    archived_users: []
};

// Estado actual del ordenamiento para cada tabla (campo por el cual se ordena y dirección)
let sortState = {
    transactions: { field: 'dateOut', dir: 'desc' },
    radios: { field: 'numero', dir: 'asc' },
    keys: { field: 'numero', dir: 'asc' },
    collaborators: { field: 'name', dir: 'asc' },
    users: { field: 'name', dir: 'asc' },
    areas: { field: 'name', dir: 'asc' },
    member_access: { field: 'dateIn', dir: 'desc' },
    logs: { field: 'time', dir: 'desc' },
    archived_radios: { field: 'archivedAt', dir: 'desc' },
    archived_keys: { field: 'archivedAt', dir: 'desc' },
    archived_users: { field: 'archivedAt', dir: 'desc' }
};

/**
 * Cambia el estado de ordenamiento para una columna específica de una tabla
 * y vuelve a renderizar la vista correspondiente.
 * 
 * @param {string} endpoint - Nombre de la entidad (radios, keys, etc.)
 * @param {string} field - Campo de la base de datos a ordenar (ej. 'name', 'dateIn')
 */
function toggleSort(endpoint, field) {
    // Si se hace clic en el mismo campo, invertir la dirección (asc -> desc)
    if (sortState[endpoint].field === field) {
        sortState[endpoint].dir = sortState[endpoint].dir === 'asc' ? 'desc' : 'asc';
    } else {
        // Si se hace clic en un campo nuevo, ordenarlo ascendentemente por defecto
        sortState[endpoint].field = field;
        sortState[endpoint].dir = 'asc';
    }
    
    // Llamar a la función de renderizado correspondiente para reflejar los cambios
    if(endpoint === 'radios') renderRadios();
    else if(endpoint === 'keys') renderKeys();
    else if(endpoint === 'collaborators') renderCollaborators();
    else if(endpoint === 'areas') renderAreas();
    else if(endpoint === 'users') renderUsers();
    else if(endpoint === 'transactions') renderTransactions();
    else if(endpoint === 'member_access') renderMemberAccess();
    else if(endpoint === 'logs') renderLogs();
    else if(endpoint === 'archived_radios') renderArchivedRadios();
    else if(endpoint === 'archived_keys') renderArchivedKeys();
    else if(endpoint === 'archived_users') renderArchivedUsers();
}

/**
 * Actualiza los indicadores visuales (flechas ↑ ↓) en los encabezados de las tablas
 * 
 * @param {string} tableId - ID del elemento HTML de la tabla
 * @param {string} endpoint - Entidad que se está ordenando
 */
function updateSortIndicators(tableId, endpoint) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const ths = table.querySelectorAll('th');
    ths.forEach(th => {
        const span = th.querySelector('span');
        if (!span) return;
        
        const attr = th.getAttribute('onclick');
        // Identificar qué columna es la activa buscando su onclick
        if (attr && attr.includes(`'${sortState[endpoint].field}'`)) {
            span.textContent = sortState[endpoint].dir === 'asc' ? ' ↑' : ' ↓';
        } else {
            span.textContent = ''; // Limpiar indicador de columnas inactivas
        }
    });
}

/**
 * Filtra y ordena un arreglo de datos según el texto de búsqueda y el estado de ordenamiento.
 * 
 * @param {string} endpoint - Nombre de la entidad a procesar
 * @param {Array} list - Lista completa de datos a filtrar
 * @param {Array} searchFields - Campos sobre los cuales aplicar la búsqueda
 * @returns {Array} - Arreglo filtrado y ordenado listo para renderizar
 */
function getFilteredAndSorted(endpoint, list, searchFields) {
    const input = document.getElementById(`search-${endpoint}`);
    const query = input ? input.value.toLowerCase() : '';
    
    let result = [...list];
    
    // 1. Filtrado por texto de búsqueda
    if (query) {
        result = result.filter(item => {
            return searchFields.some(field => {
                const val = item[field];
                return val && val.toString().toLowerCase().includes(query);
            });
        });
    }
    
    // 2. Ordenamiento
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
    
    // 3. Actualizar indicadores visuales de forma asíncrona tras el retorno
    setTimeout(() => updateSortIndicators(`${endpoint}Table`, endpoint), 0);
    return result;
}

/**
 * Helper para obtener todas las personas (Usuarios y Colaboradores) unificados.
 * Útil para menús desplegables donde se deba seleccionar a una persona.
 * 
 * @returns {Array} - Arreglo con objetos de personas {id, name, area}
 */
function getAllPeople() {
    const peopleMap = new Map();
    
    // Agregar primero los colaboradores
    if (Array.isArray(dataCache.collaborators)) {
        dataCache.collaborators.forEach(c => {
            peopleMap.set(c.id, { id: c.id, name: c.name, area: c.area });
        });
    }
    
    // Luego agregar usuarios del sistema, evitando duplicados
    if (Array.isArray(dataCache.users)) {
        dataCache.users.forEach(u => {
            const exists = Array.from(peopleMap.values()).some(p => p.name.toLowerCase().trim() === u.name.toLowerCase().trim());
            if (!exists) {
                peopleMap.set(u.id, { id: u.id, name: u.name, area: 'Usuario del Sistema' });
            }
        });
    }
    
    return Array.from(peopleMap.values());
}

/**
 * Carga inicial de todos los datos desde el backend usando peticiones asíncronas concurrentes
 */
async function loadAllData() {
    await Promise.all([
        fetchData('radios'),
        fetchData('keys'),
        fetchData('collaborators'),
        fetchData('transactions'),
        fetchData('member_access'),
        // Restricción de seguridad básica: cargar áreas y usuarios solo si es admin/superadmin
        (currentUser.role === 'superadmin' || currentUser.role === 'admin') ? fetchData('areas') : Promise.resolve(),
        (currentUser.role === 'superadmin' || currentUser.role === 'admin') ? fetchData('users') : Promise.resolve(),
        (currentUser.role === 'superadmin') ? fetchData('archived_radios') : Promise.resolve(),
        (currentUser.role === 'superadmin') ? fetchData('archived_keys') : Promise.resolve(),
        (currentUser.role === 'superadmin') ? fetchData('archived_users') : Promise.resolve()
    ]);
    
    // Una vez cargados todos los datos, proceder a renderizar la interfaz
    renderAll();
}

/**
 * Función genérica para obtener datos del servidor y almacenarlos en caché.
 * 
 * @param {string} endpoint - Recurso de la API a obtener
 */
async function fetchData(endpoint) {
    try {
        const res = await fetch(`/api/${endpoint}`);
        dataCache[endpoint] = await res.json();
    } catch (e) {
        console.error(`Error loading ${endpoint}:`, e);
    }
}

/**
 * Función genérica para eliminar un registro de la base de datos.
 * 
 * @param {string} endpoint - Entidad donde se va a eliminar
 * @param {number|string} id - ID del registro a eliminar
 */
async function deleteItem(endpoint, id) {
    if (!(await showCustomConfirm('¿Está seguro de eliminar este registro?'))) return;
    
    await fetch(`/api/${endpoint}/${id}`, { 
        method: 'DELETE',
        headers: { 'X-User': currentUser.username } // Enviar usuario para log/auditoría
    });
    
    // Recargar datos tras eliminación
    await loadAllData();
}

/**
 * Función específica para obtener los logs de una fecha y renderizarlos
 */
async function fetchAndRenderLogs() {
    const dateInput = document.getElementById('log-date')?.value;
    if (!dateInput) return;
    
    try {
        const res = await fetch(`/api/logs?date=${dateInput}`);
        if (res.ok) {
            dataCache.logs = await res.json();
            if (typeof renderLogs === 'function') renderLogs();
        } else {
            console.error('Error fetching logs');
            dataCache.logs = [];
            if (typeof renderLogs === 'function') renderLogs();
        }
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}
