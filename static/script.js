// Função para preencher as contagens
function preencherContagens(contagens) {
    if (contagens) {
        atualizarContagem('pedidosEntregar', contagens.pedidos_entregar);
        atualizarContagem('transportadorasAtrasadas', contagens.transportadoras_atrasadas);
        atualizarContagem('pedidosRetirar', contagens.pedidos_retirar);
        atualizarContagem('transportadorasTotal', contagens.transportadoras_total);
    }
}

// Função para atualizar a contagem e aplicar o estilo
function atualizarContagem(id, valor) {
    const elemento = document.getElementById(id);
    elemento.textContent = valor;
    
    const containerElemento = elemento.closest('p');
    
    if (id === 'pedidosEntregar' && valor !== 0) {
        containerElemento.classList.add('vermelho');
    } else {
        containerElemento.classList.remove('vermelho');
    }
}

// Função para preencher a tabela de pedidos
function preencherTabelaPedidos(pedidos) {
    if (pedidos && pedidos.length > 0) {
        const tbody = document.querySelector('#tabelaPedidos tbody');
        tbody.innerHTML = '';
        pedidos.forEach(pedido => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pedido.numero}</td>
                <td>${pedido.cliente}</td>
                <td>${pedido.data}</td>
                <td>${pedido.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Função para preencher a tabela de transportadoras atrasadas
function preencherTabelaTransportadoras(transportadoras) {
    if (transportadoras && transportadoras.length > 0) {
        const tbody = document.querySelector('#tabelaTransportadoras tbody');
        tbody.innerHTML = '';
        transportadoras.forEach(transportadora => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transportadora.nome}</td>
                <td>${transportadora.cliente}</td>
                <td>${transportadora.data_prevista}</td>
                <td>${transportadora.dias_atraso}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Função para preencher a tabela de pedidos LALAMOVE
function preencherTabelaLalamove(pedidos) {
    if (pedidos && pedidos.length > 0) {
        const tbody = document.querySelector('#tabelaLalamove tbody');
        tbody.innerHTML = '';
        pedidos.forEach(pedido => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pedido.numero}</td>
                <td>${pedido.cliente}</td>
                <td>${pedido.data}</td>
                <td>${pedido.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Função para atualizar os dados
function atualizarDados() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';

    function fetchData(retryCount = 0) {
        fetch('/get_updated_data')
            .then(response => response.json())
            .then(data => {
                preencherContagens(data.contagens);
                preencherTabelaPedidos(data.pedidos_entregar);
                preencherTabelaTransportadoras(data.transportadoras_atrasadas);
                preencherTabelaLalamove(data.pedidos_lalamove);
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('Erro ao atualizar dados:', error);
                if (retryCount < 3) {
                    setTimeout(() => fetchData(retryCount + 1), 5000);
                } else {
                    loadingIndicator.style.display = 'none';
                    alert('Não foi possível atualizar os dados. Por favor, recarregue a página.');
                }
            });
    }

    fetchData();
}

    // Recarregar a página a cada 30 segundos
    setInterval(() => {
        location.reload();
    }, 30 * 1000);
    
    // Chama a função de atualização imediatamente
document.addEventListener('DOMContentLoaded', function() {
    // Chama a função de atualização imediatamente
    atualizarDados();

    // Configura a atualização automática a cada 30 segundos
    setInterval(atualizarDados, 30 * 1000);
});
