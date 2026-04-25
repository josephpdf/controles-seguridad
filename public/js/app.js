/**
 * app.js
 * 
 * Este es el archivo principal de la aplicación. Se encarga de inicializar
 * el dashboard, configurar la interfaz según el rol y área del usuario,
 * manejar la navegación del menú lateral y adjuntar eventos a los formularios.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICACIÓN DE SESIÓN
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    
    // 2. CONFIGURACIÓN DEL PERFIL EN LA INTERFAZ
    currentUser = JSON.parse(userStr);
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userRoleDisplay').textContent = currentUser.role.toUpperCase();

    const initialsEl = document.getElementById('userNameInitials');
    if (initialsEl) initialsEl.textContent = currentUser.name.charAt(0).toUpperCase();

    const selectedArea = localStorage.getItem('selectedArea') || 'Parqueo';
    const areaDisplay = document.getElementById('userAreaDisplay');
    if (areaDisplay) {
        areaDisplay.textContent = `Área: ${selectedArea}`;
    }

    // 3. RESTRICCIONES DE FECHAS EN FILTROS
    // Limitar fechas a máximo el día de hoy para evitar transacciones en el futuro
    const todayStr = new Date().toISOString().split('T')[0];
    const dtTx = document.getElementById('filter-date-transactions');
    const dtMa = document.getElementById('filter-date-member-access');
    if (dtTx) {
        dtTx.setAttribute('max', todayStr);
        dtTx.value = todayStr;
    }
    if (dtMa) {
        dtMa.setAttribute('max', todayStr);
        dtMa.value = todayStr;
    }

    // 4. CONFIGURAR PERMISOS BASADOS EN ROLES
    document.getElementById('navCollaborators').style.display = 'block'; // Todos pueden ver colaboradores
    
    // Solo admins y superadmins pueden ver las pestañas de Áreas y Usuarios
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
        document.getElementById('navAreas').style.display = 'block';
        document.getElementById('navUsers').style.display = 'block';
    }
    
    // Restringir que los admins no puedan crear nuevos superadmins
    if (currentUser.role !== 'superadmin') {
        const roleSelect = document.getElementById('userRole');
        if (roleSelect) {
            const superOption = roleSelect.querySelector('option[value="superadmin"]');
            if (superOption) superOption.remove();
        }
    }
    
    // Ocultar botones de "Agregar nuevo" para usuarios regulares (oficiales)
    if (currentUser.role === 'user') {
        const btnNewRadio = document.getElementById('btn-new-radio');
        const btnNewKey = document.getElementById('btn-new-key');
        const btnNewCollab = document.getElementById('btn-new-collaborator');
        if (btnNewRadio) btnNewRadio.style.display = 'none';
        if (btnNewKey) btnNewKey.style.display = 'none';
        if (btnNewCollab) btnNewCollab.style.display = 'none';

        // LÓGICA ESPECÍFICA SEGÚN EL ÁREA DE TRABAJO (Parqueo vs Hectárea)
        const reportSelector = document.getElementById('report-type-selector');
        
        if (selectedArea === 'Parqueo') {
            // El Parqueo solo maneja Radios y Llaves, no acceso de socios
            const memAccLi = document.querySelector('.nav-menu li[data-section="member-access"]');
            if(memAccLi) memAccLi.style.display = 'none';
            
            if (reportSelector) {
                reportSelector.value = 'equipos';
                reportSelector.style.display = 'none'; // Forzar reporte de equipos
                currentReportTab = 'equipos';
                document.getElementById('report-socios-wrapper').style.display = 'none';
                document.getElementById('report-equipos-wrapper').style.display = 'block';
            }
        } else if (selectedArea === 'Hectárea') {
            // La Hectárea solo maneja Ingreso de Socios
            const transLi = document.querySelector('.nav-menu li[data-section="transactions"]');
            const radLi = document.querySelector('.nav-menu li[data-section="radios"]');
            const keyLi = document.querySelector('.nav-menu li[data-section="keys"]');
            const colLi = document.querySelector('.nav-menu li[data-section="collaborators"]');
            
            if(transLi) transLi.style.display = 'none';
            if(radLi) radLi.style.display = 'none';
            if(keyLi) keyLi.style.display = 'none';
            if(colLi) colLi.style.display = 'none';
            
            if (reportSelector) {
                reportSelector.value = 'socios';
                reportSelector.style.display = 'none'; // Forzar reporte de socios
                currentReportTab = 'socios';
                document.getElementById('report-socios-wrapper').style.display = 'block';
                document.getElementById('report-equipos-wrapper').style.display = 'none';
            }
            
            // Redirigir a la pestaña correcta por defecto
            setTimeout(() => {
                const memAccBtn = document.querySelector('.nav-menu li[data-section="member-access"]');
                if(memAccBtn) memAccBtn.click();
            }, 100);
        }
    }

    // 5. MANEJO DE EVENTOS DE NAVEGACIÓN (Menú lateral y responsive)
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Eventos de clic para los items del menú de navegación
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', (e) => {
            // Actualizar estilo activo en el menú
            document.querySelectorAll('.nav-menu li').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
            
            // Ocultar todas las secciones y mostrar la seleccionada
            const section = e.target.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
            document.getElementById(`sec-${section}`).style.display = 'block';

            // Cerrar menú en móviles
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if(overlay) overlay.classList.remove('active');
            }
            
            // Lógica específica al abrir "Reportes"
            if (section === 'reports') {
                const dateInput = document.getElementById('report-date');
                if (!dateInput.value) {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    dateInput.value = `${yyyy}-${mm}-${dd}`;
                }
                renderReports();
            }
        });
    });

    // 6. CARGAR DATOS INICIALES DESDE EL BACKEND
    loadAllData();

    // 7. CONFIGURACIÓN DE ENVÍO DE FORMULARIOS (Configuración Dinámica)
    // Se define un arreglo con la configuración de cada formulario para mapear los campos a JSON
    const forms = [
        { id: 'transactionForm', endpoint: 'transactions', modal: 'transactionModal', customSubmit: handleTransactionSubmit },
        { id: 'editTransactionForm', endpoint: 'transactions', modal: 'editTransactionModal', fields: ['editTransDateOut', 'editTransDateIn'], map: f => ({ dateOut: new Date(f[0]).toISOString(), dateIn: f[1] ? new Date(f[1]).toISOString() : null }) },
        { id: 'radioForm', endpoint: 'radios', modal: 'radioModal', fields: ['radioNumero', 'radioSerie', 'radioArea', 'radioColaborador', 'radioDetalle'], map: f => ({ numero: f[0], serie: f[1], area: f[2], colaborador: f[3], detalle: f[4] }) },
        { id: 'keyForm', endpoint: 'keys', modal: 'keyModal', fields: ['keyNumero', 'keyColaborador', 'keyDetalle'], map: f => ({ numero: f[0], colaborador: f[1], detalle: f[2] }) },
        { id: 'collaboratorForm', endpoint: 'collaborators', modal: 'collaboratorModal', fields: ['collabName', 'collabArea'], map: f => ({ name: f[0], area: f[1] }) },
        { id: 'userForm', endpoint: 'users', modal: 'userModal', fields: ['userName', 'userUsername', 'userPassword', 'userRole'], map: f => ({ name: f[0], username: f[1], password: f[2], role: f[3] }) },
        { id: 'areaForm', endpoint: 'areas', modal: 'areaModal', fields: ['areaName'], map: f => ({ name: f[0] }) },
        { id: 'memberAccessForm', endpoint: 'member_access', modal: 'memberAccessModal', customSubmit: handleMemberAccessSubmit },
        { id: 'editMemberAccessForm', endpoint: 'member_access', modal: 'editMemberAccessModal', fields: ['editAccessDateIn', 'editAccessDateOut'], map: f => ({ dateIn: new Date(f[0]).toISOString(), dateOut: f[1] ? new Date(f[1]).toISOString() : null }) }
    ];

    // Asignar el event listener a cada formulario iterando sobre la configuración
    forms.forEach(f => {
        const formEl = document.getElementById(f.id);
        if (formEl) {
            formEl.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Si existe un manejador personalizado (como transacciones), usarlo
                if (f.customSubmit) {
                    await f.customSubmit(e);
                    return;
                }
                
                // Obtener valores de los inputs definidos en 'fields'
                const values = f.fields.map(fid => document.getElementById(fid).value);
                // Mapear los valores a un objeto payload para el backend usando 'map'
                const payload = f.map(values);
                
                // --- MANEJO DE IDs PARA EDICIÓN ---
                // Si el formulario tiene un campo oculto con ID, significa que es una actualización (PUT/PATCH), 
                // se añade el ID al payload.
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
                if (f.id === 'editTransactionForm') {
                    const tid = document.getElementById('editTransId').value;
                    if (tid) payload.id = parseInt(tid);
                }
                if (f.id === 'editMemberAccessForm') {
                    const aid = document.getElementById('editAccessId').value;
                    if (aid) payload.id = parseInt(aid);
                }

                // Enviar la petición de guardado/actualización al backend
                await fetch(`/api/${f.endpoint}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-User': currentUser.username // Enviado para los logs de auditoría
                    },
                    body: JSON.stringify(payload)
                });
                
                // Limpiar formulario y cerrar modal
                formEl.reset();
                
                // Resetear campos ocultos de IDs y títulos a su estado por defecto
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
                if (f.id === 'editTransactionForm') {
                    document.getElementById('editTransId').value = '';
                }
                if (f.id === 'editMemberAccessForm') {
                    document.getElementById('editAccessId').value = '';
                }
                
                closeModal(f.modal);
                // Recargar todos los datos para refrescar las tablas
                await loadAllData();
            });
        }
    });
});
