// ---- DASHBOARD GRAFICO ----
let inventoryChartInstance = null;

function renderDashboardChart() {
    const chartType = document.getElementById('chart-type-selector')?.value || 'radio';
    
    let disponibles = 0;
    let enUso = 0;
    let noDisponibles = 0;
    let devueltosHistorico = 0;

    let labels = [];
    let bgColors = [];
    let titleText = '';
    let subtitleText = '';
    let chartData = [];
    
    // Calcular métricas de inventario real
    if (chartType === 'radio' && dataCache.radios) {
        dataCache.radios.forEach(r => {
            const activeTx = dataCache.transactions?.find(t => t.type === 'radio' && t.equipmentId == r.id && !t.dateIn);
            if (activeTx) {
                enUso++;
            } else if (r.colaborador && r.colaborador !== '') {
                noDisponibles++;
            } else {
                disponibles++;
            }
        });
        if (dataCache.transactions) {
            dataCache.transactions.forEach(t => {
                if (t.type === 'radio' && t.dateIn) devueltosHistorico++;
            });
        }
        labels = ['Disponibles', 'En Uso (Temporal)', 'No Disponibles (Fijo)'];
        bgColors = ['#2ECC71', '#F07E26', '#E74C3C'];
        chartData = [disponibles, enUso, noDisponibles];
        titleText = 'Estado Actual de Inventario (Radios)';
        subtitleText = `Histórico de devoluciones completadas: ${devueltosHistorico}`;
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
    } else if (chartType === 'socio' && dataCache.member_access) {
        let dentroHoy = 0;
        let salioHoy = 0;
        const todayStr = new Date().toLocaleDateString();

        dataCache.member_access.forEach(a => {
            const entryDateStr = new Date(a.dateIn).toLocaleDateString();
            if (entryDateStr === todayStr) {
                if (!a.dateOut) dentroHoy++;
                else salioHoy++;
            }
        });

        labels = ['Dentro del Club (Aún no salen)', 'Ya Salieron'];
        bgColors = ['#F07E26', '#2ECC71'];
        chartData = [dentroHoy, salioHoy];
        titleText = 'Control de Ingreso de Socios (Hoy)';
        subtitleText = `Total de socios que ingresaron hoy: ${dentroHoy + salioHoy}`;
    }

    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;

    if (inventoryChartInstance) {
        inventoryChartInstance.destroy();
    }

    inventoryChartInstance = new Chart(ctx, {
        type: 'pie',
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
                        font: {
                            family: 'Inter',
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: titleText,
                    font: {
                        family: 'Inter',
                        size: 16
                    }
                },
                subtitle: {
                    display: true,
                    text: subtitleText,
                    font: {
                        family: 'Inter',
                        size: 13,
                        style: 'italic'
                    },
                    padding: { bottom: 10 }
                }
            }
        }
    });
}
