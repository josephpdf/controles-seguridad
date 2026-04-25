/**
 * reports.js
 * 
 * Este archivo gestiona la sección de reportes:
 * - Cambio entre pestañas (Socios vs Equipos)
 * - Cálculo de métricas agregadas por día
 * - Renderizado de tablas de reportes
 * - Exportación de datos a PDF y Excel
 */

// Referencias a las instancias de los gráficos para poder actualizarlos
let reportsChartInstance = null;
let equipmentReportsChartInstance = null;

// Controla qué pestaña de reporte está activa actualmente
let currentReportTab = 'socios';

/**
 * Alterna la vista entre el reporte de Socios y el de Equipos,
 * mostrando/ocultando los contenedores correspondientes y recargando los datos.
 */
function switchReportTab() {
    currentReportTab = document.getElementById('report-type-selector').value;
    
    if (currentReportTab === 'socios') {
        document.getElementById('report-socios-wrapper').style.display = 'block';
        document.getElementById('report-equipos-wrapper').style.display = 'none';
    } else {
        document.getElementById('report-socios-wrapper').style.display = 'none';
        document.getElementById('report-equipos-wrapper').style.display = 'block';
    }
    
    renderReports();
}

/**
 * Renderiza el reporte de Accesos de Socios para una fecha específica.
 * Calcula totales, identifica "picos" por hora para el gráfico de barras
 * y dibuja la tabla detallada. Si la pestaña activa es Equipos, delega el renderizado.
 */
function renderReports() {
    if (currentReportTab === 'equipos') {
        renderEquipmentReports();
        return;
    }

    const dateInput = document.getElementById('report-date')?.value;
    if (!dateInput) return;

    const [year, month, day] = dateInput.split('-');
    const selectedDateStr = new Date(year, month - 1, day).toLocaleDateString();

    const allAccess = dataCache.member_access || [];
    const dayAccess = allAccess.filter(a => new Date(a.dateIn).toLocaleDateString() === selectedDateStr);

    let totalIn = dayAccess.length;
    let noOut = 0;
    const officerCount = {};
    const hourlyData = new Array(24).fill(0);

    const tbody = document.querySelector('#reportsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    dayAccess.forEach(a => {
        const dIn = new Date(a.dateIn);
        const isInside = !a.dateOut;
        
        if (isInside) noOut++;
        officerCount[a.officerIn] = (officerCount[a.officerIn] || 0) + 1;
        hourlyData[dIn.getHours()]++;

        let statusText = isInside ? 'Salida no registrada' : 'Salió';
        if (isInside && selectedDateStr === new Date().toLocaleDateString()) {
            statusText = 'Dentro';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${a.dateOut ? new Date(a.dateOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
            <td>${a.memberNumber}</td>
            <td>${a.memberName}</td>
            <td>${a.officerIn}</td>
            <td>${a.officerOut || '-'}</td>
            <td>${statusText}</td>
        `;
        tbody.appendChild(tr);
    });

    let topOfficer = '-';
    let maxOps = 0;
    for (const off in officerCount) {
        if (officerCount[off] > maxOps) {
            maxOps = officerCount[off];
            topOfficer = `${off} (${maxOps})`;
        }
    }

    document.getElementById('rep-total-in').textContent = totalIn;
    document.getElementById('rep-no-out').textContent = noOut;
    document.getElementById('rep-top-officer').textContent = topOfficer;

    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;
    
    if (reportsChartInstance) {
        reportsChartInstance.destroy();
    }

    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    reportsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos por Hora',
                data: hourlyData,
                backgroundColor: '#3498DB',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Picos de Acceso (Por Hora)',
                    font: { family: 'Inter', size: 16 }
                }
            }
        }
    });
}

/**
 * Renderiza el reporte de Préstamos de Equipos para una fecha específica.
 * Calcula totales prestados, equipos no devueltos, el colaborador con más préstamos,
 * y grafica los picos de uso por hora.
 */
function renderEquipmentReports() {
    const dateInput = document.getElementById('report-date')?.value;
    if (!dateInput) return;

    const [year, month, day] = dateInput.split('-');
    const selectedDateStr = new Date(year, month - 1, day).toLocaleDateString();

    const allTx = dataCache.transactions || [];
    const dayTx = allTx.filter(t => new Date(t.dateOut).toLocaleDateString() === selectedDateStr);

    let totalLoans = dayTx.length;
    let noOut = 0;
    const collabCount = {};
    const hourlyData = new Array(24).fill(0);

    const tbody = document.querySelector('#equipmentReportsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    dayTx.forEach(t => {
        const dOut = new Date(t.dateOut);
        const isNotReturned = !t.dateIn;
        
        if (isNotReturned) noOut++;
        
        const collabName = getAllPeople().find(c => c.id == t.collaboratorId)?.name || 'Desconocido';
        collabCount[collabName] = (collabCount[collabName] || 0) + 1;
        
        hourlyData[dOut.getHours()]++;

        let statusText = isNotReturned ? 'No devuelto' : 'Devuelto';
        if (isNotReturned && selectedDateStr === new Date().toLocaleDateString()) {
            statusText = 'En Uso';
        }

        const eqInfo = t.type === 'radio' 
            ? dataCache.radios.find(r => r.id == t.equipmentId)?.numero || 'Desconocido'
            : dataCache.keys.find(k => k.id == t.equipmentId)?.numero || 'Desconocido';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${t.dateIn ? new Date(t.dateIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
            <td>${t.type.toUpperCase()}</td>
            <td>${eqInfo}</td>
            <td>${collabName}</td>
            <td>${t.officerOut || '-'}</td>
            <td>${t.officerIn || '-'}</td>
            <td>${statusText}</td>
        `;
        tbody.appendChild(tr);
    });

    let topCollab = '-';
    let maxOps = 0;
    for (const coll in collabCount) {
        if (collabCount[coll] > maxOps) {
            maxOps = collabCount[coll];
            topCollab = `${coll} (${maxOps})`;
        }
    }

    document.getElementById('rep-eq-total').textContent = totalLoans;
    document.getElementById('rep-eq-no-out').textContent = noOut;
    document.getElementById('rep-eq-top-collab').textContent = topCollab;

    const ctx = document.getElementById('equipmentReportsChart');
    if (!ctx) return;
    
    if (equipmentReportsChartInstance) {
        equipmentReportsChartInstance.destroy();
    }

    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    equipmentReportsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Préstamos por Hora',
                data: hourlyData,
                backgroundColor: '#F07E26',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Picos de Préstamo (Por Hora)',
                    font: { family: 'Inter', size: 16 }
                }
            }
        }
    });
}

/**
 * Exporta el reporte visible actual (Socios o Equipos) a un archivo PDF.
 * Utiliza jsPDF y jsPDF-AutoTable para crear el documento con encabezados,
 * métricas principales y la tabla de datos renderizada.
 */
function exportReportsPDF() {
    const dateInput = document.getElementById('report-date')?.value;
    if (!dateInput) return showCustomAlert('Seleccione una fecha primero.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    
    if (currentReportTab === 'socios') {
        doc.text("Reporte de Ingreso de Socios", 14, 20);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${dateInput}`, 14, 28);
        
        const totalIn = document.getElementById('rep-total-in').innerText;
        const noOut = document.getElementById('rep-no-out').innerText;
        const topOff = document.getElementById('rep-top-officer').innerText;
        
        doc.text(`Total de Ingresos: ${totalIn}`, 14, 38);
        doc.text(`Salidas no registradas: ${noOut}`, 14, 46);
        doc.text(`Oficial con más registros: ${topOff}`, 14, 54);

        const tbody = document.querySelector('#reportsTable tbody');
        const rows = [];
        tbody.querySelectorAll('tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            if(cells.length > 0) {
                rows.push(Array.from(cells).map(c => c.innerText));
            }
        });

        doc.autoTable({
            startY: 64,
            head: [['Hora Ingreso', 'Hora Salida', 'Nº Socio', 'Nombre', 'Oficial Ing.', 'Oficial Sal.', 'Estado']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] }
        });
        doc.save(`Reporte_Socios_${dateInput}.pdf`);
    } else {
        doc.text("Reporte de Préstamos de Equipos", 14, 20);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${dateInput}`, 14, 28);
        
        const total = document.getElementById('rep-eq-total').innerText;
        const noOut = document.getElementById('rep-eq-no-out').innerText;
        const topCollab = document.getElementById('rep-eq-top-collab').innerText;
        
        doc.text(`Total de Préstamos: ${total}`, 14, 38);
        doc.text(`Equipos NO devueltos: ${noOut}`, 14, 46);
        doc.text(`Colaborador más activo: ${topCollab}`, 14, 54);

        const tbody = document.querySelector('#equipmentReportsTable tbody');
        const rows = [];
        tbody.querySelectorAll('tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            if(cells.length > 0) {
                rows.push(Array.from(cells).map(c => c.innerText));
            }
        });

        doc.autoTable({
            startY: 64,
            head: [['Hora Préstamo', 'Hora Devol.', 'Tipo', 'Equipo', 'Colaborador', 'Ofic. Ent.', 'Ofic. Rec.', 'Estado']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] }
        });
        doc.save(`Reporte_Equipos_${dateInput}.pdf`);
    }
}

/**
 * Exporta el reporte visible actual (Socios o Equipos) a un archivo de Excel (.xlsx).
 * Utiliza la librería SheetJS (XLSX). Incrusta las métricas calculadas arriba
 * y luego exporta la tabla HTML tal cual se está mostrando.
 */
function exportReportsExcel() {
    const dateInput = document.getElementById('report-date')?.value;
    if (!dateInput) return showCustomAlert('Seleccione una fecha primero.');

    let tableId = '';
    let title = '';
    let metricsData = [];
    let filename = '';

    if (currentReportTab === 'socios') {
        tableId = 'reportsTable';
        title = "Reporte de Ingreso de Socios";
        filename = `Reporte_Socios_${dateInput}.xlsx`;
        metricsData = [
            ["Métricas"],
            ["Total de Ingresos:", document.getElementById('rep-total-in').innerText],
            ["Salidas no registradas:", document.getElementById('rep-no-out').innerText],
            ["Oficial más activo:", document.getElementById('rep-top-officer').innerText],
            []
        ];
    } else {
        tableId = 'equipmentReportsTable';
        title = "Reporte de Préstamos de Equipos";
        filename = `Reporte_Equipos_${dateInput}.xlsx`;
        metricsData = [
            ["Métricas"],
            ["Total de Préstamos:", document.getElementById('rep-eq-total').innerText],
            ["Equipos NO devueltos:", document.getElementById('rep-eq-no-out').innerText],
            ["Colaborador más activo:", document.getElementById('rep-eq-top-collab').innerText],
            []
        ];
    }

    const table = document.getElementById(tableId);
    
    const data = [
        [title],
        [`Fecha: ${dateInput}`],
        [],
        ...metricsData
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.sheet_add_dom(ws, table, {origin: -1});

    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, filename);
}
