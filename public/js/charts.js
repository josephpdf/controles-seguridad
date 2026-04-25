/**
 * charts.js
 * 
 * Este archivo maneja la lógica para generar y actualizar los gráficos 
 * visuales del dashboard usando la librería Chart.js.
 */

// Referencia global a la instancia del gráfico para poder destruirla antes de crear una nueva
let inventoryChartInstance = null;

/**
 * Función principal que calcula los datos y renderiza el gráfico
 * en la sección principal del Dashboard.
 */
function renderDashboardChart() {
    // Obtener qué tipo de gráfico el usuario quiere ver
    const chartType = document.getElementById('chart-type-selector')?.value || 'radio';
    
    // Variables para contadores de estado
    let disponibles = 0;
    let enUso = 0;
    let noDisponibles = 0;
    let devueltosHistorico = 0;

    // Variables para la configuración del gráfico
    let labels = [];
    let bgColors = [];
    let titleText = '';
    let subtitleText = '';
    let chartData = [];
    
    // --- CÁLCULO DE MÉTRICAS PARA RADIOS ---
    if (chartType === 'radio' && dataCache.radios) {
        dataCache.radios.forEach(r => {
            // Verificar si el radio tiene una transacción activa (prestado y no devuelto)
            const activeTx = dataCache.transactions?.find(t => t.type === 'radio' && t.equipmentId == r.id && !t.dateIn);
            if (activeTx) {
                enUso++;
            } else if (r.colaborador && r.colaborador !== '') {
                // Si tiene colaborador asignado, no está disponible para préstamo temporal
                noDisponibles++;
            } else {
                disponibles++;
            }
        });
        
        // Contar el histórico de radios que han sido devueltos exitosamente
        if (dataCache.transactions) {
            dataCache.transactions.forEach(t => {
                if (t.type === 'radio' && t.dateIn) devueltosHistorico++;
            });
        }
        
        labels = ['Disponibles', 'En Uso (Temporal)', 'No Disponibles (Fijo)'];
        bgColors = ['#2ECC71', '#F07E26', '#E74C3C']; // Verde, Naranja, Rojo
        chartData = [disponibles, enUso, noDisponibles];
        titleText = 'Estado Actual de Inventario (Radios)';
        subtitleText = `Histórico de devoluciones completadas: ${devueltosHistorico}`;
        
    // --- CÁLCULO DE MÉTRICAS PARA LLAVES ---
    } else if (chartType === 'llave' && dataCache.keys) {
        dataCache.keys.forEach(k => {
            const activeTx = dataCache.transactions?.find(t => t.type === 'llave' && t.equipmentId == k.id && !t.dateIn);
            if (activeTx) {
                enUso++;
            } else if (k.colaborador && k.colaborador !== '') {
                noDisponibles++;
            } else {
                disponibles++;
            }
        });
        
        if (dataCache.transactions) {
            dataCache.transactions.forEach(t => {
                if (t.type === 'llave' && t.dateIn) devueltosHistorico++;
            });
        }
        
        labels = ['Disponibles', 'En Uso (Temporal)', 'No Disponibles (Fijo)'];
        bgColors = ['#2ECC71', '#F07E26', '#E74C3C'];
        chartData = [disponibles, enUso, noDisponibles];
        titleText = 'Estado Actual de Inventario (Llaves)';
        subtitleText = `Histórico de devoluciones completadas: ${devueltosHistorico}`;
        
    // --- CÁLCULO DE MÉTRICAS PARA SOCIOS ---
    } else if (chartType === 'socio' && dataCache.member_access) {
        let dentroHoy = 0;
        let salioHoy = 0;
        const todayStr = new Date().toLocaleDateString();

        dataCache.member_access.forEach(a => {
            // Solo contar los accesos de la fecha de hoy
            const entryDateStr = new Date(a.dateIn).toLocaleDateString();
            if (entryDateStr === todayStr) {
                if (!a.dateOut) dentroHoy++; // Aún no ha salido
                else salioHoy++; // Ya registró salida
            }
        });

        labels = ['Dentro del Club (Aún no salen)', 'Ya Salieron'];
        bgColors = ['#F07E26', '#2ECC71'];
        chartData = [dentroHoy, salioHoy];
        titleText = 'Control de Ingreso de Socios (Hoy)';
        subtitleText = `Total de socios que ingresaron hoy: ${dentroHoy + salioHoy}`;
    }

    // --- RENDERIZADO DEL GRÁFICO EN EL CANVAS ---
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;

    // Destruir instancia previa si existe para evitar superposiciones
    if (inventoryChartInstance) {
        inventoryChartInstance.destroy();
    }

    // Crear nueva instancia de Chart.js
    inventoryChartInstance = new Chart(ctx, {
        type: 'pie', // Gráfico circular
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: bgColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Inter', size: 14 }
                    }
                },
                title: {
                    display: true,
                    text: titleText,
                    font: { family: 'Inter', size: 16 }
                },
                subtitle: {
                    display: true,
                    text: subtitleText,
                    font: { family: 'Inter', size: 13, style: 'italic' },
                    padding: { bottom: 10 }
                }
            }
        }
    });
}
