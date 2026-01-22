// Konfigurasi Peta
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
    center: [112.7856, -7.3116], // Koordinat Rungkut (sesuaikan sedikit jika perlu)
    zoom: 13,
    pitch: 0 // Kita pakai 2D dulu biar analisisnya jelas terlihat
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// --- KONFIGURASI KATEGORI (BERDASARKAN SKOR) ---
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
        color: '#1a9850', // Hijau Tua (sesuai paint map)
        description: 'Area <strong>Sangat Ideal</strong>. Skor 7-9.' 
    },
    { 
        label: 'Cukup Ideal (Skor 4-6)', 
        value: 'cukup', 
        color: '#fee08b', // Kuning/Oranye
        description: 'Area <strong>Cukup Ideal</strong>. Skor 4-6.' 
    },
    { 
        label: 'Kurang Ideal (Skor 1-3)', 
        value: 'kurang', 
        color: '#d73027', // Merah
        description: 'Area <strong>Kurang Ideal</strong>. Skor 1-3.' 
    }
];

// Initialize UI
const legendContainer = document.getElementById('legend');
const descriptionBox = document.getElementById('description-box');

// --- GENERATE LEGEND UI ---
suitabilityCategories.forEach((category, index) => {
    const item = document.createElement('div');
    item.className = `legend-item ${index === 0 ? 'active' : ''}`;
    
    // Saat item diklik, panggil fungsi filter
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

// --- FUNGSI FILTER UTAMA ---
function filterMap(category, element) {
    // 1. Update UI
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    descriptionBox.innerHTML = category.description;

    // 2. Siapkan Logika Filter (SKALA 1-9)
    let filterLogic = null;
    
    // Pakai to-number biar aman kalau data aslinya string
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

    // 3. TERAPKAN FILTER KE LAYER YANG BENAR
    // Nama layer harus sama persis dengan 'id' di map.addLayer
    const targetLayer = 'layer-kesesuaian'; 

    if (map.getLayer(targetLayer)) {
        map.setFilter(targetLayer, filterLogic);
        console.log(`Filter ${category.value} diterapkan ke layer ${targetLayer}`);
    } else {
        console.error(`Layer '${targetLayer}' tidak ditemukan!`);
    }
}

map.on('load', () => {
    map.addSource('analisis-padel', {
        'type': 'geojson',
        'data': 'data/hasil_analisis.geojson'
    });

    // Layer ID disamakan dengan fungsi filter di atas
    map.addLayer({
        'id': 'layer-kesesuaian', 
        'type': 'fill',
        'source': 'analisis-padel',
        'paint': {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['to-number', ['get', 'score']], // Pastikan dibaca angka
                3, '#d73027', 
                6, '#fee08b', 
                9, '#1a9850'    
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': 'rgba(0,0,0,0.2)'
        }
    });

    // Klik Popup (Logika 1-9)
    map.on('click', 'layer-kesesuaian', (e) => {
        const rawScore = e.features[0].properties.score;
        const score = Number(rawScore); // Konversi ke angka JS
        
        let keterangan = "Kurang Ideal";
        let warnaStatus = "red";

        // Logic 1-9
        if (score >= 7) {
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

    // Hover effect
    map.on('mouseenter', 'layer-kesesuaian', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'layer-kesesuaian', () => map.getCanvas().style.cursor = '');
});