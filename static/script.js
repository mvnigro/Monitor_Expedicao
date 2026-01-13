// =============================================
// EXPEDITION MONITOR - Modern JavaScript
// =============================================

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    const timeString = now.toLocaleDateString('pt-BR', options);
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Animate number counting
function animateValue(element, start, end, duration) {
    if (start === end) return;
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (range * easeProgress));
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Update stat card with animation
function atualizarContagem(id, valor) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    
    const currentValue = parseInt(elemento.textContent) || 0;
    const newValue = parseInt(valor) || 0;
    
    animateValue(elemento, currentValue, newValue, 500);
    
    // Handle alert state for "pedidosEntregar"
    const cardEntregar = document.getElementById('cardEntregar');
    if (id === 'pedidosEntregar' && cardEntregar) {
        if (newValue > 0) {
            cardEntregar.classList.add('alert');
        } else {
            cardEntregar.classList.remove('alert');
        }
    }
}

// Fill all stat counters
function preencherContagens(contagens) {
    if (contagens) {
        atualizarContagem('pedidosEntregar', contagens.pedidos_entregar);
        atualizarContagem('transportadorasAtrasadas', contagens.transportadoras_atrasadas);
        atualizarContagem('pedidosRetirar', contagens.pedidos_retirar);
        atualizarContagem('transportadorasTotal', contagens.transportadoras_total);
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    if (!status) return '<span class="status-badge info"><span class="status-dot"></span>Pendente</span>';
    
    const statusLower = status.toLowerCase();
    let type = 'info';
    
    if (statusLower.includes('autorizado') || statusLower.includes('saida')) {
        type = 'success';
    } else if (statusLower.includes('impress')) {
        type = 'warning';
    } else if (statusLower.includes('baixado')) {
        type = 'success';
    }
    
    return `<span class="status-badge ${type}"><span class="status-dot"></span>${status}</span>`;
}

// Get days badge HTML
function getDaysBadge(days) {
    const daysNum = parseInt(days) || 0;
    let type = 'normal';
    
    if (daysNum >= 5) {
        type = 'critical';
    } else if (daysNum >= 3) {
        type = 'warning';
    }
    
    return `<span class="days-badge ${type}">${daysNum} dias</span>`;
}

// Fill orders table
function preencherTabelaPedidos(pedidos, tableId) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    
    const newTbody = document.createElement('tbody');
    
    if (pedidos && pedidos.length > 0) {
        pedidos.forEach(pedido => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${pedido.numero}</strong></td>
                <td>${pedido.cliente}</td>
                <td>${pedido.data}</td>
                <td>${getStatusBadge(pedido.status)}</td>
            `;
            newTbody.appendChild(tr);
        });
        
        // Update badge
        const badgeId = tableId === 'tabelaPedidos' ? 'entregasBadge' : 'lalamoveBadge';
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.textContent = `${pedidos.length} pedido${pedidos.length !== 1 ? 's' : ''}`;
        }
    } else {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="4">
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>Nenhum pedido encontrado</p>
                </div>
            </td>
        `;
        newTbody.appendChild(tr);
    }
    
    tbody.parentNode.replaceChild(newTbody, tbody);
}

// Fill carriers table
function preencherTabelaTransportadoras(transportadoras) {
    const tbody = document.querySelector('#tabelaTransportadoras tbody');
    if (!tbody) return;
    
    const newTbody = document.createElement('tbody');
    
    if (transportadoras && transportadoras.length > 0) {
        transportadoras.forEach(transportadora => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${transportadora.nome}</strong></td>
                <td>${transportadora.cliente}</td>
                <td>${transportadora.data_prevista}</td>
                <td>${getDaysBadge(transportadora.dias_atraso)}</td>
            `;
            newTbody.appendChild(tr);
        });
        
        // Update badge
        const badge = document.getElementById('atrasadasBadge');
        if (badge) {
            badge.textContent = `${transportadoras.length} registro${transportadoras.length !== 1 ? 's' : ''}`;
        }
    } else {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="4">
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <p>Nenhum atraso registrado</p>
                </div>
            </td>
        `;
        newTbody.appendChild(tr);
    }
    
    tbody.parentNode.replaceChild(newTbody, tbody);
}

// Fetch and update data
function atualizarDados() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    function fetchData(retryCount = 0) {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        fetch('/get_updated_data')
            .then(response => response.json())
            .then(data => {
                preencherContagens(data.contagens);
                preencherTabelaPedidos(data.pedidos_entregar, 'tabelaPedidos');
                preencherTabelaTransportadoras(data.transportadoras_atrasadas);
                preencherTabelaPedidos(data.pedidos_lalamove, 'tabelaLalamove');
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Erro ao atualizar dados:', error);
                if (retryCount < 3) {
                    setTimeout(() => fetchData(retryCount + 1), 5000);
                } else {
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                }
            });
    }

    fetchData();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Update time immediately and every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Fetch data immediately
    atualizarDados();

    // Auto-refresh data every 30 seconds
    setInterval(atualizarDados, 30 * 1000);
});
