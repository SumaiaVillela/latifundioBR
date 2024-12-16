// ========= MANTER ESTAS VARIÁVEIS GLOBAIS EXISTENTES =========
const brasil = [-53.2, -10.3333333];
const centroRocinha = [-43.24402, -22.98863];
const centroVitoria = [-40.3037, -20.3196];
const UFS = ['AL', 'MG', 'MT', 'PB', 'PR', 'RJ'];

let mapLoaded = false;
let lastUserCenter = null;

// ========= NOVO: OBJETO PARA GERENCIAR CAMADAS =========
const camadasMapa = {
    fontes: {},
    camadas: {},

    inicializar() {
        if (!mapLoaded) return;

        // Hectare
        this.adicionarParCamadas('hectare', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.6
        });

        // Quadrado
        this.adicionarParCamadas('quadrado', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.6
        });

        //Imagens

        

        // Rocinha
        this.adicionarParCamadas('rocinha', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.3
        });

        // Vitoria
        this.adicionarParCamadas('vitoria', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.3
        });

        // Maior terra UF
        this.adicionarParCamadas('maior-terra-uf', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.3
        });

        // Maior terra BR
        this.adicionarParCamadas('maior-terra-br', {
            fonte: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            },
            cor: '#00796b',
            transparencia: 0.3
        });
    },

    adicionarParCamadas(nome, opcoes) {
        const idFonte = `${nome}-fonte`;
        this.fontes[idFonte] = opcoes.fonte;
        
        map.addSource(idFonte, opcoes.fonte);

        const idPreenchimento = `${nome}-preenchimento`;
        map.addLayer({
            id: idPreenchimento,
            type: 'fill',
            source: idFonte,
            paint: {
                'fill-color': opcoes.cor,
                'fill-opacity': ['*', opcoes.transparencia || 0.6, 0] // Começa invisível mas mantém transparência base
            }
        });
        this.camadas[idPreenchimento] = true;

        const idContorno = `${nome}-contorno`;
        map.addLayer({
            id: idContorno,
            type: 'line',
            source: idFonte,
            paint: {
                'line-color': '#004d40',
                'line-width': 2,
                'line-opacity': 0
            }
        });
        this.camadas[idContorno] = true;
    },

    mostrar(nome) {
        if (nome.includes('imagem')) {
            const idCamada = `${nome}-camada`;
            map.setPaintProperty(idCamada, 'raster-opacity', 1, {
                duration: 500
            });
            return;
        }
    
        const idPreenchimento = `${nome}-preenchimento`;
        const idContorno = `${nome}-contorno`;
    
        if (this.camadas[idPreenchimento]) {
            map.setPaintProperty(idPreenchimento, 'fill-opacity', 0.5, {
                duration: 500
            });
        }
        if (this.camadas[idContorno]) {
            map.setPaintProperty(idContorno, 'line-opacity', 1, {
                duration: 500
            });
        }
    },

    atualizarFonte(nome, dados) {
        const idFonte = `${nome}-fonte`;
        if (this.fontes[idFonte]) {
            map.getSource(idFonte).setData(dados);
        }
    },

    atualizarImagem(nome, url, coordenadas) {
        const idFonte = `${nome}-fonte`;
        if (map.getSource(idFonte)) {
            const fonte = map.getSource(idFonte);
            fonte.updateImage({
                url: url,
                coordinates: coordenadas
            });
        }
    },

    esconder(nome) {
        if (nome.includes('imagem')) {
            const idCamada = `${nome}-camada`;
            map.setPaintProperty(idCamada, 'raster-opacity', 0, {
                duration: 500
            });
            return;
        }

        const idPreenchimento = `${nome}-preenchimento`;
        const idContorno = `${nome}-contorno`;

        if (this.camadas[idPreenchimento]) {
            map.setPaintProperty(idPreenchimento, 'fill-opacity', 0, {
                duration: 500
            });
        }
        if (this.camadas[idContorno]) {
            map.setPaintProperty(idContorno, 'line-opacity', 0, {
                duration: 500
            });
        }
    }
};

// ========= MANTER ESTAS FUNÇÕES AUXILIARES =========
function adicionarImagem(centro, urlImagem, tipo) {
    // Remove fonte e camada existentes se houverem
    if (map.getLayer(`imagem-${tipo}-camada`)) {
        map.removeLayer(`imagem-${tipo}-camada`);
    }
    if (map.getSource(`imagem-${tipo}-fonte`)) {
        map.removeSource(`imagem-${tipo}-fonte`);
    }

    // Calcula as coordenadas
    const lado = 99;
    const metade = lado / 2;
    const diagonal = metade * Math.sqrt(2);

    const noroeste = turf.destination(centro, diagonal, -135, { units: "meters" }).geometry.coordinates;
    const nordeste = turf.destination(centro, diagonal, -45, { units: "meters" }).geometry.coordinates;
    const sudeste = turf.destination(centro, diagonal, 45, { units: "meters" }).geometry.coordinates;
    const sudoeste = turf.destination(centro, diagonal, 135, { units: "meters" }).geometry.coordinates;

    // Adiciona nova fonte e camada
    map.addSource(`imagem-${tipo}-fonte`, {
        type: 'image',
        url: urlImagem,
        coordinates: [
            noroeste,
            nordeste,
            sudeste,
            sudoeste
        ]
    });

    map.addLayer({
        id: `imagem-${tipo}-camada`,
        type: 'raster',
        source: `imagem-${tipo}-fonte`,
        paint: {
            'raster-opacity': 1
        }
    });
}

function adicionarImagemGrafico(tipo, alinhamento = 'centro') {
    if (map.getLayer(`imagem-${tipo}-camada`)) {
        map.removeLayer(`imagem-${tipo}-camada`);
    }
    if (map.getSource(`imagem-${tipo}-fonte`)) {
        map.removeSource(`imagem-${tipo}-fonte`);
    }

    const img = new Image();
    img.onload = function() {
        // Altura fixa baseada no quadrado da Rocinha
        const alturaFixa = 707.1068;
        // Calcula largura mantendo a proporção da imagem
        const proporcao = this.width / this.height;
        const largura = tipo === 'grafico1' ? alturaFixa : alturaFixa * proporcao;

        // Calcula coordenadas do grafico1 como referência
        const metade = alturaFixa / 2;
        const grafico1Noroeste = turf.destination(centroRocinha, metade, -90, { units: "meters" }).geometry.coordinates;
        grafico1Noroeste[1] = turf.destination([grafico1Noroeste[0], centroRocinha[1]], metade, 0, { units: "meters" }).geometry.coordinates[1];
        
        const grafico1Nordeste = turf.destination(centroRocinha, metade, 90, { units: "meters" }).geometry.coordinates;
        grafico1Nordeste[1] = grafico1Noroeste[1];
        
        let noroeste, nordeste, sudeste, sudoeste;
        
        if (alinhamento === 'esquerda') {
            // Usa exatamente a mesma coordenada X do canto esquerdo do grafico1
            noroeste = [...grafico1Noroeste];
            nordeste = [...noroeste];
            nordeste[0] = noroeste[0] + (largura / 111111);
        } else if (alinhamento === 'direita') {
            // Usa exatamente a mesma coordenada X do canto direito do grafico1
            nordeste = [...grafico1Nordeste];
            noroeste = [...nordeste];
            noroeste[0] = nordeste[0] - (largura / 111111);
        } else {
            // Centralizado (para grafico1)
            noroeste = grafico1Noroeste;
            nordeste = grafico1Nordeste;
        }

        // Calcula coordenadas Y (altura) que serão as mesmas para todas as imagens
        const sulY = turf.destination([noroeste[0], centroRocinha[1]], metade, 180, { units: "meters" }).geometry.coordinates[1];
        
        sudeste = [...nordeste];
        sudeste[1] = sulY;
        
        sudoeste = [...noroeste];
        sudoeste[1] = sulY;

        map.addSource(`imagem-${tipo}-fonte`, {
            type: 'image',
            url: `static/img/${tipo}.png`,
            coordinates: [
                noroeste,
                nordeste,
                sudeste,
                sudoeste
            ]
        });

        map.addLayer({
            id: `imagem-${tipo}-camada`,
            type: 'raster',
            source: `imagem-${tipo}-fonte`,
            paint: {
                'raster-opacity': 1
            }
        });
    };
    
    img.src = `static/img/${tipo}.png`;
}

function adicionarFiltroPreto() {
    if (map.getLayer('filtro-preto-camada')) {
        map.removeLayer('filtro-preto-camada');
    }
    if (map.getSource('filtro-preto-fonte')) {
        map.removeSource('filtro-preto-fonte');
    }

    const poligonoQuadrado = quadrado500k(centroRocinha);
    
    map.addSource('filtro-preto-fonte', {
        type: 'geojson',
        data: poligonoQuadrado
    });

    map.addLayer({
        id: 'filtro-preto-camada',
        type: 'fill',
        source: 'filtro-preto-fonte',
        paint: {
            'fill-color': '#000000',
            'fill-opacity': 0.9
        }
    });
}

function removerFiltroPreto() {
    if (map.getLayer('filtro-preto-camada')) {
        map.removeLayer('filtro-preto-camada');
    }
    if (map.getSource('filtro-preto-fonte')) {
        map.removeSource('filtro-preto-fonte');
    }
}

function removerImagem(tipo) {
    if (map.getLayer(`imagem-${tipo}-camada`)) {
        map.removeLayer(`imagem-${tipo}-camada`);
    }
    if (map.getSource(`imagem-${tipo}-fonte`)) {
        map.removeSource(`imagem-${tipo}-fonte`);
    }
}

function quadrado(centro, lado) {
    const metade = lado / 2;
    const diagonal = metade * Math.sqrt(2);

    const topLeft = turf.destination(centro, diagonal, -135, { units: "meters" });
    const topRight = turf.destination(centro, diagonal, -45, { units: "meters" });
    const bottomRight = turf.destination(centro, diagonal, 45, { units: "meters" });
    const bottomLeft = turf.destination(centro, diagonal, 135, { units: "meters" });

    return turf.polygon([
        [
            topLeft.geometry.coordinates,
            topRight.geometry.coordinates,
            bottomRight.geometry.coordinates,
            bottomLeft.geometry.coordinates,
            topLeft.geometry.coordinates,
        ],
    ]);
}

function quadrado500k(centro) {
    return quadrado(centro, 707.1068);
}

function getRandomUF() {
    return UFS[Math.floor(Math.random() * UFS.length)];
}

// ========= SUBSTITUIR: INICIALIZAÇÃO DO MAPA =========
// Define token de acesso do Mapbox
mapboxgl.accessToken = "pk.eyJ1Ijoic3VtYWlhdmlsbGVsYSIsImEiOiJjbTBlaTRmamwwcDZ6MmpvOTNvcTAydjN5In0.h_MFiNdtYcgHN5ZforR4mw";

// Cria mapa
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/sumaiavillela/cm4lwynvr003r01ry9ckb8b29",
    center: brasil,
    zoom: 3,
});

// disable map zoom when using scroll
map.scrollZoom.disable();

let zoomControl = new mapboxgl.NavigationControl({
    showCompass: false
});

map.on('load', () => {
    mapLoaded = true;
    camadasMapa.inicializar();
});

// ========= SUBSTITUIR: FUNÇÕES DE MANIPULAÇÃO DE CAMADAS =========
async function loadRandomHectarePolygon() {
    try {
        const uf = getRandomUF();
        const response = await fetch(`geojson/1hec/1hec_${uf}.geojson`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const randomFeatureIndex = Math.floor(Math.random() * data.features.length);
        const randomFeature = data.features[randomFeatureIndex];
        
        camadasMapa.atualizarFonte('hectare', {
            type: 'FeatureCollection',
            features: [randomFeature]
        });
        
        camadasMapa.mostrar('hectare');
        
        return {
            feature: randomFeature,
            metadata: {
                area: randomFeature.properties.num_area,
                municipio: randomFeature.properties.municipio,
                estado: randomFeature.properties.cod_estado
            }
        };
    } catch (error) {
        console.error('Erro ao carregar polígono:', error);
        return null;
    }
}

function mostrarQuadradoInicial(centro) {
    if (!mapLoaded) return;
    const poligonoQuadrado = quadrado(centro, 100);
    camadasMapa.atualizarFonte('quadrado', poligonoQuadrado);
    camadasMapa.mostrar('quadrado');
}

function mostrarQuadradoRocinha() {
    if (!mapLoaded) return;
    const poligonoQuadrado = quadrado500k(centroRocinha);
    camadasMapa.atualizarFonte('rocinha', poligonoQuadrado);
    camadasMapa.mostrar('rocinha');
    
    map.flyTo({
        center: centroRocinha,
        zoom: 15,
        duration: 2000,
        essential: true
    });
}

async function carregarEPlotarGeoJSON(arquivo, nome) {
    try {
        const response = await fetch(arquivo);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        camadasMapa.atualizarFonte(nome, data);
        camadasMapa.mostrar(nome);
        
        return data;
    } catch (error) {
        console.error('Erro ao carregar GeoJSON:', error);
        return null;
    }
}

async function carregarETransladarGeoJSON(arquivo, novoCentro, nome) {
    try {
        const response = await fetch(arquivo);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const centroOriginal = turf.centroid(data).geometry.coordinates;
        
        data.features = data.features.map(feature => {
            const dx = novoCentro[0] - centroOriginal[0];
            const dy = novoCentro[1] - centroOriginal[1];
            
            const coords = feature.geometry.coordinates[0].map(coord => [
                coord[0] + dx,
                coord[1] + dy
            ]);
            
            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates: [coords]
                }
            };
        });
        
        camadasMapa.atualizarFonte(nome, data);
        camadasMapa.mostrar(nome);
        
        return data;
    } catch (error) {
        console.error('Erro ao carregar e transladar GeoJSON:', error);
        return null;
    }
}