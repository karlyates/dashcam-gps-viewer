// import { parseDatText } from './parser.js';

// State
let trackLine = null;
let marker = null;
let points = [];
let playTimer = null;
let map = null;

// DOM Elements
const els = {
    openBtn: document.getElementById('openBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    fileInput: document.getElementById('fileInput'),
    fileName: document.getElementById('fileName'),
    status: document.getElementById('status'),
    slider: document.getElementById('timeSlider'),
    dropOverlay: document.getElementById('dropOverlay'),
    meta: {
        time: document.getElementById('meta-time'),
        lat: document.getElementById('meta-lat'),
        lng: document.getElementById('meta-lng'),
        speed: document.getElementById('meta-speed'),
        alt: document.getElementById('meta-alt')
    }
};

function initMap() {
    map = L.map('map', {
        zoomControl: false // Move zoom control if needed, or keep default
    }).setView([0, 0], 2);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);
}

function setStatus(msg) {
    els.status.textContent = msg || '';
}

function enableControls(enabled) {
    els.slider.disabled = !enabled;
    els.playBtn.disabled = !enabled;
    els.pauseBtn.disabled = !enabled;

    if (!enabled) {
        els.slider.value = 0;
    }
}

function updateMetaDisplay(p, idx) {
    els.meta.time.textContent = p ? p.time : '-';
    els.meta.lat.textContent = p ? p.lat.toFixed(6) : '-';
    els.meta.lng.textContent = p ? p.lng.toFixed(6) : '-';
    els.meta.speed.textContent = (p && p.speed != null) ? p.speed.toFixed(1) + ' km/h' : '-'; // Assuming km/h
    els.meta.alt.textContent = (p && p.alt != null) ? p.alt.toFixed(1) + ' m' : '-';
}

function updateMarker(idx) {
    if (!points.length || idx < 0 || idx >= points.length) return;

    const p = points[idx];
    marker.setLatLng([p.lat, p.lng]);
    updateMetaDisplay(p, idx);
}

function loadTrack(text, filename) {
    setStatus('Parsing...');
    try {
        const newPoints = parseDatText(text);
        if (!newPoints.length) {
            throw new Error('No valid points found');
        }

        points = newPoints;
        els.fileName.textContent = filename;

        // Clear old layers
        if (trackLine) map.removeLayer(trackLine);
        if (marker) map.removeLayer(marker);

        // Draw new
        const latlngs = points.map(p => [p.lat, p.lng]);
        trackLine = L.polyline(latlngs, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);
        map.fitBounds(trackLine.getBounds(), { padding: [50, 50] });

        marker = L.circleMarker(latlngs[0], {
            radius: 6,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 1
        }).addTo(map);

        // Setup slider
        els.slider.max = points.length - 1;
        els.slider.value = 0;

        enableControls(true);
        updateMarker(0);
        setStatus(`Loaded ${points.length} points`);

    } catch (err) {
        console.error(err);
        setStatus('Error: ' + err.message);
        enableControls(false);
    }
}

function handleFileSelect(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => loadTrack(e.target.result, file.name);
    reader.onerror = () => setStatus('Error reading file');
    reader.readAsText(file);
}

// Event Listeners
els.openBtn.addEventListener('click', () => {
    els.fileInput.value = '';
    els.fileInput.click();
});

els.fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
});

els.slider.addEventListener('input', (e) => {
    pause(); // Parse on scrub
    const idx = parseInt(e.target.value, 10);
    updateMarker(idx);
});

// Playback
function play() {
    if (!points.length || playTimer) return;

    els.playBtn.style.display = 'none';
    els.pauseBtn.style.display = 'inline-flex'; // Assuming flex for buttons

    playTimer = setInterval(() => {
        let idx = parseInt(els.slider.value, 10);
        if (idx >= points.length - 1) {
            pause();
            return;
        }
        idx++;
        els.slider.value = idx;
        updateMarker(idx);
    }, 100);
}

function pause() {
    if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
    }
    els.playBtn.style.display = 'inline-flex';
    els.pauseBtn.style.display = 'none';
}

els.playBtn.addEventListener('click', play);
els.pauseBtn.addEventListener('click', pause);

// Drag & Drop
let dragCount = 0;

window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCount++;
    els.dropOverlay.classList.add('visible');
});

window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCount--;
    if (dragCount === 0) els.dropOverlay.classList.remove('visible');
});

window.addEventListener('dragover', e => e.preventDefault());

window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCount = 0;
    els.dropOverlay.classList.remove('visible');

    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

// Init
initMap();
els.pauseBtn.style.display = 'none'; // Hide pause initially
enableControls(false);
