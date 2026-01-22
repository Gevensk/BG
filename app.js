const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
    center: [112.7856, -7.3116], // Koordinat Rungkut 
    zoom: 13,
    pitch: 0
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

const suitabilityCategories = [
    {
        label: 'Tampilkan Semua',
        value: 'all',
        color: '#333333',
        description: 'Menampilkan seluruh hasil analisis.'
    },
    {
        label: 'Sangat Ideal (Skor 7-9)',
        value: 'sangat',
        color: '#1a9850',
        description: 'Area <strong>Sangat Ideal</strong>. Skor 7-9.'
    },
    {
        label: 'Cukup Ideal (Skor 4-6)',
        value: 'cukup',
        color: '#fee08b',
        description: 'Area <strong>Cukup Ideal</strong>. Skor 4-6.'
    },
    {
        label: 'Kurang Ideal (Skor 1-3)',
        value: 'kurang',
        color: '#d73027',
        description: 'Area <strong>Kurang Ideal</strong>. Skor 1-3.'
    }
];

const legendContainer = document.getElementById('legend');
const descriptionBox = document.getElementById('description-box');

suitabilityCategories.forEach((category, index) => {
    const item = document.createElement('div');
    item.className = `legend-item ${index === 0 ? 'active' : ''}`;

    item.onclick = () => filterMap(category, item);

    const colorBox = document.createElement('span');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = category.value === 'all' ? 'transparent' : category.color;
    if (category.value === 'all') colorBox.style.border = '1px solid #ccc';

    const label = document.createElement('span');
    label.innerText = category.label;

    item.appendChild(colorBox);
    item.appendChild(label);
    legendContainer.appendChild(item);
});


function filterMap(category, element) {
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    descriptionBox.innerHTML = category.description;
    let filterLogic = null;
    const scoreGet = ['to-number', ['get', 'score']];

    if (category.value === 'all') {
        filterLogic = null;
    } else if (category.value === 'sangat') {

        // Skor >= 7 (Berarti 7, 8, 9)
        filterLogic = ['>=', scoreGet, 7];
    } else if (category.value === 'cukup') {
        // Skor >= 4 DAN Skor < 7 (Berarti 4, 5, 6)
        filterLogic = ['all',
            ['>=', scoreGet, 4],
            ['<', scoreGet, 7]
        ];
    } else if (category.value === 'kurang') {
        // Skor < 4 (Berarti 1, 2, 3)
        filterLogic = ['<', scoreGet, 4];
    }


    const targetLayer = 'layer-kesesuaian';

    if (map.getLayer(targetLayer)) {
        map.setFilter(targetLayer, filterLogic);
        console.log(`Filter ${category.value} diterapkan ke layer ${targetLayer}`);
    } else {
        console.error(`Layer '${targetLayer}' tidak ditemukan!`);
    }
}

map.on('load', () => {
    map.addSource('zoning', {
        type: 'raster',
        tiles: [
            'tiles/zoning/{z}/{x}/{y}.png'
        ],
        tileSize: 256
    });

    map.addSource('analisis-padel', {
        'type': 'geojson',
        'data': 'data/hasil_analisis.geojson'
    });

    map.addSource('jalan-utama', {
        type: 'geojson',
        data: 'data/LN_JalanUtama.geojson'
    });

    map.addSource('fasilitas', {
        type: 'geojson',
        data: 'data/PT_Fasilitas.geojson'
    });

    map.addSource('lap-padel', {
        type: 'geojson',
        data: 'data/PT_Lap_Padel.geojson'
    });

    map.addSource('sekolah', {
        type: 'geojson',
        data: 'data/sekolah_rungkut.geojson'
    });

    map.addLayer({
        'id': 'layer-kesesuaian',
        'type': 'fill',
        'source': 'analisis-padel',
        'paint': {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['to-number', ['get', 'score']],
                3, '#d73027',
                6, '#fee08b',
                9, '#1a9850'
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': 'rgba(0,0,0,0.2)'
        }
    });

    map.addLayer({
        id: 'sekolah-layer',
        type: 'fill',
        source: 'sekolah',
        paint: {
            'fill-color': '#13e4e0',
        }
    });

    map.addLayer({
        id: 'jalan-utama-layer',
        type: 'line',
        source: 'jalan-utama',
        paint: {
            'line-color': '#4a4a4a',
            'line-width': 2
        }
    });

    map.addLayer({
        id: 'fasilitas-layer',
        type: 'circle',
        source: 'fasilitas',
        paint: {
            'circle-radius': 8,
            'circle-color': '#c83dca',
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 1.5
        }
    });

    map.addLayer({
        id: 'lap-padel-layer',
        type: 'circle',
        source: 'lap-padel',
        paint: {
            'circle-radius': 8,
            'circle-color': '#33a02c',
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 1.5
        }
    });

    const layerConfigs = [
        { id: 'sekolah-layer', label: 'Sekolah', checked: true },
        { id: 'jalan-utama-layer', label: 'Jalan Utama', checked: true },
        { id: 'fasilitas-layer', label: 'Fasilitas Umum', checked: true },
        { id: 'lap-padel-layer', label: 'Lapangan Padel', checked: true }
    ];

    const layerList = document.getElementById('layer-list');

    layerConfigs.forEach(layer => {
        if (!map.getLayer(layer.id)) return;

        const item = document.createElement('div');
        item.className = 'layer-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = layer.checked;

        checkbox.onchange = () => {
            map.setLayoutProperty(
                layer.id,
                'visibility',
                checkbox.checked ? 'visible' : 'none'
            );
        };

        const label = document.createElement('label');
        label.innerText = layer.label;

        item.appendChild(checkbox);
        item.appendChild(label);
        layerList.appendChild(item);
    });

    map.on('click', 'layer-kesesuaian', (e) => {
        const rawScore = e.features[0].properties.score;
        const score = Number(rawScore);

        let keterangan = "Kurang Ideal";
        let warnaStatus = "red";

        if (score >= 7) {
            keterangan = "Sangat Ideal";
            warnaStatus = "green";
        } else if (score >= 4) {
            keterangan = "Cukup Ideal";
            warnaStatus = "orange";
        }

        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <div style="font-family: sans-serif; padding: 5px;">
                    <h3 style="margin:0 0 8px 0; border-bottom: 1px solid #ccc;">Analisis Lokasi</h3>
                    <p><strong>Skor:</strong> ${score}</p>
                    <p><strong>Status:</strong> <span style="color:${warnaStatus}; font-weight:bold;">${keterangan}</span></p>
                </div>
            `)
            .addTo(map);
    });

    map.on('mouseenter', 'layer-kesesuaian', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'layer-kesesuaian', () => map.getCanvas().style.cursor = '');
});