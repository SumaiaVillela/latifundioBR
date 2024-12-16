// Inicia a instância do scrollama
const scroller = scrollama();
const camadas = document.querySelectorAll('#camadas img');
window.enderecoSelecionado = null;
let timeoutBusca;

// Mapeamento de estados para siglas
const ESTADOS = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
    'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
    'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
    'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
    'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
    'Sergipe': 'SE', 'Tocantins': 'TO'
};

// --------------------------------FORMULÁRIO-------------------------------

// Função para limpar e formatar o endereço
function formatarEndereco(displayName) {
    const partes = displayName.split(', ');
    const partesRelevantes = [];
    
    const padroesRemover = [
        'Região Geográfica Imediata',
        'Região Integrada de Desenvolvimento',
        'Região Geográfica Intermediária',
        'Região Centro-Oeste',
        'Região',
    ];

    for (const parte of partes) {
        if (!padroesRemover.some(padrao => parte.includes(padrao))) {
            partesRelevantes.push(parte);
        }
    }

    return partesRelevantes.join(', ');
}

// Função para extrair o estado do endereço retornado
function extrairEstado(displayName) {
    const partes = displayName.split(', ');
    for (let i = partes.length - 2; i >= 0; i--) {
        const parte = partes[i].trim();
        if (ESTADOS[parte]) {
            return parte;
        }
    }
    return null;
}

// Função para buscar sugestões de endereço
async function buscarSugestoes(texto) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${texto}&countrycodes=br&limit=5`
        );
        const data = await response.json();
        return data.map(item => ({
            display: formatarEndereco(item.display_name),
            original: item.display_name,
            lat: item.lat,
            lon: item.lon,
            estado: extrairEstado(item.display_name)
        }));
    } catch (erro) {
        console.error('Erro ao buscar sugestões:', erro);
        return [];
    }
}

// Criar e adicionar a lista de sugestões
const listaSugestoes = document.createElement('ul');
listaSugestoes.className = 'sugestoes-endereco';
document.getElementById('campoEndereco').parentNode.appendChild(listaSugestoes);

// Adicionar evento de input para buscar sugestões
document.getElementById('campoEndereco').addEventListener('input', function(e) {
    const texto = e.target.value;
    
    clearTimeout(timeoutBusca);
    
    if (!texto) {
        listaSugestoes.style.display = 'none';
        return;
    }
    
    timeoutBusca = setTimeout(async () => {
        const sugestoes = await buscarSugestoes(texto);
        
        listaSugestoes.innerHTML = '';
        if (sugestoes.length > 0) {
            sugestoes.forEach(sugestao => {
                const li = document.createElement('li');
                li.textContent = sugestao.display;
                li.addEventListener('click', () => {
                    document.getElementById('campoEndereco').value = sugestao.display;
                    window.enderecoSelecionado = {
                        texto: sugestao.display,
                        latitude: sugestao.lat,
                        longitude: sugestao.lon,
                        estado: sugestao.estado
                    };
                    listaSugestoes.style.display = 'none';
                });
                listaSugestoes.appendChild(li);
            });
            listaSugestoes.style.display = 'block';
        } else {
            listaSugestoes.style.display = 'none';
        }
    }, 300);
});

// Esconder sugestões quando clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.campo-form')) {
        listaSugestoes.style.display = 'none';
    }
});

// Manipula o envio do formulário
document.getElementById('formularioLocalizacao').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const endereco = document.getElementById('campoEndereco').value;
    const mensagemErro = document.getElementById('mensagemErro');
    const mensagemSucesso = document.getElementById('mensagemSucesso');
    
    if (!endereco) {
        mensagemErro.textContent = 'Por favor, preencha o endereço';
        mensagemErro.style.display = 'block';
        return;
    }

    if (enderecoSelecionado) {
        mensagemErro.style.display = 'none';
        mensagemSucesso.textContent = 'Endereço localizado. Agora vamos começar';
        mensagemSucesso.style.display = 'block';
        console.log('Endereço selecionado:', enderecoSelecionado);
    } else {
        mensagemErro.textContent = 'Por favor, selecione um endereço da lista de sugestões.';
        mensagemErro.style.display = 'block';
    }
});

// ----------------------------SCROLLY-----------------------------------

// Função para processar as callbacks do capítulo atual
function processChapterCallbacks(callbacks) {
    if (!callbacks) return;
    callbacks.forEach(callback => {
        if (typeof callback.callback === 'function') {
            callback.callback();
        }
    });
}

// Função para encontrar o capítulo atual
function findChapter(id) {
    return config.chapters.find(chapter => chapter.id === id);
}

// Setup do scrollama
function handleStepEnter(response) {
    const secao = response.element.dataset.secao;
    console.log('Entrando na seção:', secao);
    
    // Esconde todas as camadas existentes
    ['hectare', 'quadrado', 'rocinha', 'vitoria', 'maior-terra-uf', 'maior-terra-br'].forEach(camada => {
        camadasMapa.esconder(camada);
    });
    ['piscina', 'onibus'].forEach(imagem => {
        camadasMapa.esconder(`imagem-${imagem}`);
    });

    // Lógica específica para cada seção
    switch(secao) {
        case '1hec':
            loadRandomHectarePolygon().then(result => {
                if (result) {
                    const center = turf.center(result.feature).geometry.coordinates;
                    map.flyTo({
                        center: center,
                        zoom: 16,
                        duration: 2000
                    });
                }
            });
            break;
            
        case 'quadrado':
            const centroPadrao = map.getCenter().toArray();
            const poligonoQuadrado = quadrado(centroPadrao, 100);
            camadasMapa.atualizarFonte('quadrado', poligonoQuadrado);
            camadasMapa.mostrar('quadrado');
            break;
            
        case 'endereco':
            if (window.enderecoSelecionado) {
                const centro = [
                    parseFloat(enderecoSelecionado.longitude), 
                    parseFloat(enderecoSelecionado.latitude)
                ];
                lastUserCenter = centro;
                mostrarQuadradoInicial(centro);
                map.flyTo({
                    center: centro,
                    zoom: 16,
                    duration: 2000
                });
            }
            break;
            
        case 'piscina':
            const centroPiscina = lastUserCenter || map.getCenter().toArray();
            mostrarQuadradoInicial(centroPiscina);
            adicionarImagem(centroPiscina, 'static/img/camada1.png', 'piscina');
            map.flyTo({
                center: centroPiscina,
                zoom: 18,
                duration: 2000
            });
            break;

        case 'onibus':
            const centroOnibus = lastUserCenter || map.getCenter().toArray();
            mostrarQuadradoInicial(centroOnibus);
            adicionarImagem(centroOnibus, 'static/img/camada2.png', 'onibus');
            map.flyTo({
                center: centroOnibus,
                zoom: 18,
                duration: 2000
            });
            break;
            
        case 'rocinha':
            mostrarQuadradoRocinha();
            map.flyTo({
                center: centroRocinha,
                zoom: 15,
                duration: 2000
            });
            break;
            
        case 'grafico1':
            mostrarQuadradoRocinha();
            adicionarImagemGrafico('grafico1');
            map.flyTo({
                center: centroRocinha,
                zoom: 16,
                duration: 2000
            });
            break;

        case 'grafico2':
            mostrarQuadradoRocinha();
            if (!map.getLayer('imagem-grafico1-camada')) {
                adicionarImagemGrafico('grafico1');
            }
            adicionarFiltroPreto();
            adicionarImagemGrafico('grafico2', 'esquerda');
            map.flyTo({
                center: centroRocinha,
                zoom: 16,
                duration: 2000
            });
            break;

        case 'grafico3':
            mostrarQuadradoRocinha();
            const entrando = response.direction === 'down';
            
            // Se entrando pela primeira vez, adiciona grafico1
            if (!map.getLayer('imagem-grafico1-camada')) {
                adicionarImagemGrafico('grafico1');
            }
            
            // Sempre garante que o filtro preto está presente
            if (!map.getLayer('filtro-preto-camada')) {
                adicionarFiltroPreto();
            }
            
            // Remove grafico2 se estiver presente
            removerImagem('grafico2');
            
            // Adiciona grafico3
            adicionarImagemGrafico('grafico3', 'direita');
            
            map.flyTo({
                center: centroRocinha,
                zoom: 16,
                duration: 2000
            });
            break;
            
        case 'vitoria':
            carregarEPlotarGeoJSON('geojson/vitoria.geojson', 'vitoria').then(data => {
                if (data) {
                    const bounds = turf.bbox(data);
                    map.fitBounds(bounds, {
                        padding: 100,
                        duration: 2000
                    });
                }
            });
            break;
            
        case 'maior-terra-uf':
            if (window.enderecoSelecionado) {
                const estado = window.enderecoSelecionado.estado;
                const arquivo = `geojson/maiores/maior_${estado}.geojson`;
                const novoCentro = [
                    parseFloat(enderecoSelecionado.longitude), 
                    parseFloat(enderecoSelecionado.latitude)
                ];
                
                carregarETransladarGeoJSON(arquivo, novoCentro, 'maior-terra-uf').then(data => {
                    if (data && data.features && data.features[0]) {
                        const bounds = turf.bbox(data);
                        map.fitBounds(bounds, {
                            padding: 50,
                            duration: 2000
                        });

                        const propriedade = data.features[0].properties;
                        const area = Math.floor(propriedade.num_area).toLocaleString('pt-BR');
                        const municipio = propriedade.municipio;
                        
                        const elementoTexto = document.querySelector('[data-secao="maior-terra-uf"] .text-box p');
                        if (elementoTexto) {
                            elementoTexto.textContent = `Essa é maior propriedade rural do seu estado. Tem ${area} hectares e fica em ${municipio}. E a escala está precisa. Você consegue notar qual parte da sua cidade foi "engolida" por essa terra?`;
                        }

                        map.scrollZoom.enable();
                        map.addControl(zoomControl);
                    }
                });
            }
            break;
            
        case 'maior-terra-BR':
            if (window.enderecoSelecionado) {
                const novoCentro = [
                    parseFloat(enderecoSelecionado.longitude), 
                    parseFloat(enderecoSelecionado.latitude)
                ];
                
                carregarETransladarGeoJSON('geojson/maiores/maior_Pará.geojson', novoCentro, 'maior-terra-br').then(data => {
                    if (data && data.features && data.features[0]) {
                        const bounds = turf.bbox(data);
                        map.fitBounds(bounds, {
                            padding: 50,
                            duration: 2000
                        });

                        const propriedade = data.features[0].properties;
                        const area = Math.floor(propriedade.num_area).toLocaleString('pt-BR');
                        const municipio = propriedade.municipio;
                        
                        const elementoTexto = document.querySelector('[data-secao="maior-terra-BR"] .text-box p');
                        if (elementoTexto) {
                            elementoTexto.textContent = `Já essa propriedade é a maior do Brasil. Ela fica no Pará, no município de ${municipio}, e tem ${area} hectares.`;
                        }

                        map.scrollZoom.enable();
                        map.addControl(zoomControl);
                    }
                });
            }
            break;
    }
}

scroller
    .setup({
        step: ".step",
        offset: 0.5,
        debug: false
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(response => {
        const secao = response.element.dataset.secao;
        const direcao = response.direction;
        const proximaSecao = response.element[direcao === 'up' ? 'previousElementSibling' : 'nextElementSibling']?.dataset.secao;
    
        // Gerenciamento existente de zoom e controles
        if (secao === 'maior-terra-uf' || secao === 'maior-terra-BR') {
            map.scrollZoom.disable();
            map.removeControl(zoomControl);
        }
    
        // Gerenciamento existente de imagens
        if (secao === 'piscina') {
            removerImagem('piscina');
        }
        if (secao === 'onibus') {
            removerImagem('onibus');
        }
    
        // Gerenciamento dos gráficos
        if (secao === 'grafico1') {
            if (proximaSecao !== 'grafico2' && proximaSecao !== 'grafico3') {
                removerImagem('grafico1');
            }
        }
        
        if (secao === 'grafico2') {
            removerImagem('grafico2');
            if (direcao === 'up' && proximaSecao === 'grafico1') {
                removerFiltroPreto();
            }
            if (direcao === 'down' && proximaSecao !== 'grafico3') {
                removerFiltroPreto();
                removerImagem('grafico1');
            }
        }
        
        if (secao === 'grafico3') {
            if (proximaSecao !== 'grafico2' && proximaSecao !== 'grafico1') {
                // Remove tudo apenas se sairmos da sequência de gráficos
                removerImagem('grafico3');
                removerImagem('grafico1');
                removerFiltroPreto();
            } else {
                // Remove apenas grafico3 ao voltar para grafico2
                // mas mantém o filtro preto e grafico1
                removerImagem('grafico3');
            }
        }
    });