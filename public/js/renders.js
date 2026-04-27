/**
 * renders.js
 * 
 * Este archivo contiene todas las funciones encargadas de dibujar (renderizar)
 * la interfaz de usuario. Principalmente lee de la caché de datos (dataCache)
 * y genera las filas de las tablas HTML dinámicamente.
 */

/**
 * Función principal que llama a todas las funciones de renderizado individuales
 * para actualizar toda la vista al mismo tiempo. Se usa después de la carga inicial
 * o después de crear/editar un registro.
 */
function renderAll() {
    renderTransactions();
    renderMemberAccess();
    renderDashboardChart();
    renderRadios();
    renderKeys();
    renderCollaborators();
    
    // Solo renderizar Usuarios y Áreas si el usuario actual tiene permisos
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
        renderUsers();
        renderAreas();
        renderArchivedRadios();
        renderArchivedKeys();
    }
    
    // Llenar los selectores desplegables (dropdowns) en los modales
    populateAreaSelects();
}

/**
 * Renderiza la tabla de Transacciones (Préstamos y Devoluciones).
 * Aplica filtros por estado (En uso / Devuelto) y por fecha antes de dibujar.
 */
function renderTransactions() {
    const tbody = document.querySelector('#transactionsTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const statusFilter = document.getElementById('status-transactions')?.value || '';
    const dateFilter = document.getElementById('filter-date-transactions')?.value || '';
    
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

    if (dateFilter) {
        const [year, month, day] = dateFilter.split('-');
        const filterStr = new Date(year, month - 1, day).toLocaleDateString();
        list = list.filter(t => new Date(t.dateOut).toLocaleDateString() === filterStr);
    }

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
                ${isPending ? `<button class="btn-secondary" onclick="receiveEquipment(${t.id})">Recibir</button>` : ''}
                ${currentUser.role === 'superadmin' ? `<button class="btn-edit" onclick="editTransaction(${t.id})">Editar</button>` : ''}
                ${!isPending && currentUser.role !== 'superadmin' ? '-' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza la tabla del inventario de Radios.
 * Calcula el estado en tiempo real (Disponible, En uso temporal o Asignado fijo).
 */
function renderRadios() {
    const tbody = document.querySelector('#radiosTable tbody');
    if(!tbody) return;
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
                  `<button class="btn-edit" onclick="editRadio(${r.id})">Editar</button>
                   <button class="btn-danger" onclick="deleteItem('radios', ${r.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function switchRadioTab(tab) {
    const btnActive = document.getElementById('tab-active-radios');
    const btnArchived = document.getElementById('tab-archived-radios');
    const viewActive = document.getElementById('radios-active-view');
    const viewArchived = document.getElementById('radios-archived-view');
    
    if (tab === 'active') {
        btnActive.className = 'btn-primary w-auto';
        btnArchived.className = 'btn-secondary w-auto';
        viewActive.style.display = 'block';
        viewArchived.style.display = 'none';
        renderRadios();
    } else {
        btnActive.className = 'btn-secondary w-auto';
        btnArchived.className = 'btn-primary w-auto';
        viewActive.style.display = 'none';
        viewArchived.style.display = 'block';
        renderArchivedRadios();
    }
}

function renderArchivedRadios() {
    const tbody = document.querySelector('#archivedRadiosTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    let list = getFilteredAndSorted('archived_radios', dataCache.archived_radios || [], ['numero', 'detalle', 'area', 'archivedBy']);
    
    list.forEach(r => {
        const tr = document.createElement('tr');
        const dateStr = r.archivedAt ? new Date(r.archivedAt).toLocaleString() : '-';
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${r.archivedBy || '-'}</td>
            <td>${r.numero}</td>
            <td>${r.detalle}</td>
            <td>${r.area || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderKeys() {
    const tbody = document.querySelector('#keysTable tbody');
    if(!tbody) return;
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
                  `<button class="btn-edit" onclick="editKey(${k.id})">Editar</button>
                   <button class="btn-danger" onclick="deleteItem('keys', ${k.id})">Eliminar</button>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function switchKeyTab(tab) {
    const btnActive = document.getElementById('tab-active-keys');
    const btnArchived = document.getElementById('tab-archived-keys');
    const viewActive = document.getElementById('keys-active-view');
    const viewArchived = document.getElementById('keys-archived-view');
    
    if (tab === 'active') {
        btnActive.className = 'btn-primary w-auto';
        btnArchived.className = 'btn-secondary w-auto';
        viewActive.style.display = 'block';
        viewArchived.style.display = 'none';
        renderKeys();
    } else {
        btnActive.className = 'btn-secondary w-auto';
        btnArchived.className = 'btn-primary w-auto';
        viewActive.style.display = 'none';
        viewArchived.style.display = 'block';
        renderArchivedKeys();
    }
}

function renderArchivedKeys() {
    const tbody = document.querySelector('#archivedKeysTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    let list = getFilteredAndSorted('archived_keys', dataCache.archived_keys || [], ['numero', 'detalle', 'archivedBy']);
    
    list.forEach(k => {
        const tr = document.createElement('tr');
        const dateStr = k.archivedAt ? new Date(k.archivedAt).toLocaleString() : '-';
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${k.archivedBy || '-'}</td>
            <td>${k.numero}</td>
            <td>${k.detalle}</td>
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
                ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 
                  `<button class="btn-edit" onclick="editCollaborator(${c.id})">Editar</button>
                   <button class="btn-danger" onclick="deleteItem('collaborators', ${c.id})">Eliminar</button>` : '-'}
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
                <button class="btn-edit" onclick="editArea(${a.id})">Editar</button>
                <button class="btn-danger" onclick="deleteItem('areas', ${a.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Llena todos los `<select>` (listas desplegables) de la aplicación 
 * con las Áreas y Colaboradores registrados.
 */
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

function renderMemberAccess() {
    const tbody = document.querySelector('#memberAccessTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const statusFilter = document.getElementById('status-member-access')?.value || '';
    const dateFilter = document.getElementById('filter-date-member-access')?.value || '';
    
    let list = dataCache.member_access || [];
    list = list.map(a => ({
        ...a,
        dateInFormatted: new Date(a.dateIn).toLocaleString(),
        dateOutFormatted: a.dateOut ? new Date(a.dateOut).toLocaleString() : '-'
    }));

    if (statusFilter === 'dentro') list = list.filter(a => !a.dateOut);
    if (statusFilter === 'salio') list = list.filter(a => a.dateOut);

    if (dateFilter) {
        const [year, month, day] = dateFilter.split('-');
        const filterStr = new Date(year, month - 1, day).toLocaleDateString();
        list = list.filter(a => new Date(a.dateIn).toLocaleDateString() === filterStr);
    }

    list = getFilteredAndSorted('member_access', list, ['dateInFormatted', 'dateOutFormatted', 'memberNumber', 'memberName', 'observations', 'officerIn', 'officerOut']);
    
    list.forEach(a => {
        const isInside = !a.dateOut;
        
        // Comprobar si el ingreso fue el día de hoy
        const entryDateStr = new Date(a.dateIn).toLocaleDateString();
        const todayStr = new Date().toLocaleDateString();
        const isToday = entryDateStr === todayStr;
        
        const showExitButton = isInside && isToday;
        
        let statusBadge = '';
        let statusText = '';
        if (isInside) {
            if (isToday) {
                statusBadge = 'en-uso';
                statusText = 'Dentro';
            } else {
                statusBadge = 'no-disponible'; // Usamos rojo para indicar que expiró o salió por otro lado
                statusText = 'Salida no registrada';
            }
        } else {
            statusBadge = 'disponible';
            statusText = 'Salió';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.dateInFormatted}</td>
            <td>${a.dateOutFormatted}</td>
            <td>${a.memberNumber}</td>
            <td>${a.memberName}</td>
            <td>${a.observations || ''}</td>
            <td>${a.officerIn}</td>
            <td>${a.officerOut || '-'}</td>
            <td><span class="badge ${statusBadge}">${statusText}</span></td>
            <td>
                ${showExitButton ? `<button class="btn-secondary" onclick="registerMemberExit(${a.id})">Registrar Salida</button>` : ''}
                ${currentUser.role === 'superadmin' ? `<button class="btn-edit" onclick="editMemberAccess(${a.id})">Editar</button>` : ''}
                ${!showExitButton && currentUser.role !== 'superadmin' ? '-' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Renderiza la tabla de Auditoría (Logs) de manera visual para el superadministrador.
 */
function renderLogs() {
    const tbody = document.querySelector('#logsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Filtro y ordenamiento
    let list = getFilteredAndSorted('logs', dataCache.logs || [], ['user', 'action', 'resource', 'details']);
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay registros de auditoría para la fecha seleccionada.</td></tr>';
        return;
    }
    
    list.forEach(log => {
        let badgeClass = 'disponible'; // Color verde por defecto
        if (log.action === 'Eliminar') badgeClass = 'no-disponible'; // Rojo para eliminación
        if (log.action === 'Crear/Editar') badgeClass = 'en-uso'; // Naranja/Amarillo
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.time}</td>
            <td><strong>${log.user}</strong></td>
            <td><span class="badge ${badgeClass}">${log.action}</span></td>
            <td>${log.resource}</td>
            <td style="font-size: 0.9em; color: var(--text-muted);">${log.details}</td>
        `;
        tbody.appendChild(tr);
    });
}
