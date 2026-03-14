/**
 * GeoData Explorer — app.js
 * Öppet verktyg för att visualisera geodata i webbläsaren
 * Supports: GeoJSON, JSON, CSV, WMS, WMTS, ArcGIS REST, KML, GPX
 */

'use strict';

// ─── State ─────────────────────────────────────────────────────────────────
const state = {
  map: null,
  layers: [],
  activeId: null,
  currentStyle: { fillColor: '#2563eb', strokeColor: '#1e40af', opacity: 0.65, radius: 6 },
  nextId: 1
};

// ─── Basemaps ───────────────────────────────────────────────────────────────
const BASEMAPS = [
  {
    id: 'positron',
    name: 'Ljus',
    icon: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  },
  {
    id: 'voyager',
    name: 'Gatukarta',
    icon: '🗺',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  },
  {
    id: 'topo',
    name: 'Terrängkarta',
    icon: '⛰',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: 'abc'
  },
  {
    id: 'dark',
    name: 'Mörkt tema',
    icon: '🌑',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }
];

// ─── Example datasets — Sweden-focused, verified working ────────────────────
const EXAMPLES = [
  {
    name: 'Svenska städer',
    tag: 'csv',
    csv: true,
    data: `namn,lat,lon,befolkning,lan
Stockholm,59.3293,18.0686,975551,Stockholms län
Göteborg,57.7089,11.9746,583056,Västra Götalands län
Malmö,55.6050,13.0038,347949,Skåne län
Uppsala,59.8586,17.6389,233839,Uppsala län
Linköping,58.4108,15.6214,166354,Östergötlands län
Västerås,59.6099,16.5448,154049,Västmanlands län
Örebro,59.2741,15.2066,155050,Örebro län
Helsingborg,56.0465,12.6945,149342,Skåne län
Jönköping,57.7826,14.1618,143425,Jönköpings län
Norrköping,58.5877,16.1924,143966,Östergötlands län
Lund,55.7047,13.1910,94064,Skåne län
Umeå,63.8258,20.2630,130224,Västernorrlands län
Gävle,60.6749,17.1413,102819,Gävleborgs län
Borås,57.7210,12.9401,113606,Västra Götalands län
Södertälje,59.1955,17.6253,103816,Stockholms län
Eskilstuna,59.3666,16.5077,107694,Södermanlands län
Halmstad,56.6745,12.8578,102171,Hallands län
Växjö,56.8777,14.8091,95459,Kronobergs län
Karlstad,59.4022,13.5115,95526,Värmlands län
Sundsvall,62.3908,17.3069,99222,Västernorrlands län`
  },
  {
    name: 'Sveriges regioner',
    tag: 'geojson',
    url: 'https://raw.githubusercontent.com/okfse/sweden-geojson/master/swedish_regions.geojson'
  },
  {
    name: 'Riksdagens ledamöter (hemort)',
    tag: 'csv',
    csv: true,
    data: `namn,lat,lon,parti,valkrets
Nooshi Dadgostar,59.3293,18.0686,V,Stockholm
Ebba Busch,59.8586,17.6389,KD,Uppsala
Annie Lööf,57.7210,12.9401,C,Västra Götaland
Magdalena Andersson,55.6050,13.0038,S,Malmö
Jimmie Åkesson,57.1578,12.7634,SD,Halland
Johan Pehrson,59.3666,16.5077,L,Södermanland
Jakob Forssmed,59.3293,18.0686,KD,Stockholm
Carl Bildt,57.7089,11.9746,M,Göteborg`
  }
];

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initUI();
  checkUrlParams();
});

function initMap() {
  state.map = L.map('map', {
    center: [62, 16],
    zoom: 5,
    zoomControl: true
  });

  setBasemap('voyager');

  state.map.on('mousemove', e => {
    document.getElementById('coords-display').textContent =
      `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
  });
  state.map.on('mouseout', () => {
    document.getElementById('coords-display').textContent = '';
  });
}

function initUI() {
  renderBasemaps();
  renderExamples();

  document.getElementById('load-btn').addEventListener('click', handleLoad);
  document.getElementById('url-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleLoad();
  });
  document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('url-input').value = '';
  });
  document.getElementById('clear-all-btn').addEventListener('click', clearAll);

  const dz = document.getElementById('drop-zone');
  dz.addEventListener('click', () => document.getElementById('file-input').click());
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  document.getElementById('file-input').addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  document.getElementById('opacity-slider').addEventListener('input', e => {
    document.getElementById('opacity-val').textContent = e.target.value + '%';
  });
  document.getElementById('radius-slider').addEventListener('input', e => {
    document.getElementById('radius-val').textContent = e.target.value + 'px';
  });
  document.getElementById('apply-style-btn').addEventListener('click', applyStyle);

  document.getElementById('zoom-extent-btn').addEventListener('click', zoomAll);
  document.getElementById('locate-btn').addEventListener('click', () => {
    state.map.locate({ setView: true, maxZoom: 14 });
    state.map.once('locationfound', () => toast('Position hittad', 'success'));
    state.map.once('locationerror', () => toast('Kunde inte hämta position', 'error'));
  });

  document.getElementById('info-panel-close').addEventListener('click', () => {
    document.getElementById('info-panel').style.display = 'none';
  });

  document.getElementById('export-geojson-btn').addEventListener('click', exportGeoJSON);
  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
  document.getElementById('copy-link-btn').addEventListener('click', copyLink);

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const s = document.getElementById('sidebar');
    s.classList.toggle('collapsed');
    const svg = document.getElementById('toggle-svg');
    svg.style.transform = s.classList.contains('collapsed') ? 'rotate(180deg)' : '';
    setTimeout(() => state.map.invalidateSize(), 280);
  });
}

// ─── Load input ──────────────────────────────────────────────────────────────
async function handleLoad() {
  const raw = document.getElementById('url-input').value.trim();
  if (!raw) { toast('Ange en URL eller klistra in GeoJSON', 'warning'); return; }

  // Raw JSON pasted directly
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      await loadGeoJSONObj(JSON.parse(raw), 'Inklistrad data');
      return;
    } catch { /* fall through */ }
  }

  // Raw CSV pasted
  if (!raw.startsWith('http') && raw.includes(',') && raw.includes('\n')) {
    loadCSVStr(raw, 'Inklistrad CSV');
    return;
  }

  const lo = raw.toLowerCase();
  if (lo.includes('service=wms') || (lo.includes('/wms') && !lo.includes('wmts'))) {
    loadWMS(raw);
  } else if (lo.includes('wmts') || lo.includes('/wmts')) {
    loadWMTS(raw);
  } else if (lo.includes('/arcgis/rest') || lo.includes('/featureserver') || lo.includes('/mapserver')) {
    loadArcGIS(raw);
  } else if (lo.endsWith('.csv') || lo.includes('format=csv')) {
    await loadCSVUrl(raw);
  } else {
    await loadGeoJSONUrl(raw);
  }
}

// ─── GeoJSON ─────────────────────────────────────────────────────────────────
async function loadGeoJSONUrl(url) {
  showLoading(true, 'Hämtar GeoJSON…');
  setStatus('Hämtar data…');
  try {
    const res = await fetchCORS(url);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('Kunde inte parsa som JSON. Kontrollera URL.'); }
    await loadGeoJSONObj(data, nameFrom(url));
  } catch (err) {
    toast(err.message, 'error');
    setStatus('Fel vid inläsning');
  } finally {
    showLoading(false);
  }
}

async function loadGeoJSONObj(data, name = 'GeoJSON') {
  showLoading(true, 'Bearbetar…');
  try {
    const geojson = toGeoJSON(data);
    if (!geojson) throw new Error('Kunde inte konvertera till GeoJSON');
    const n = (geojson.features || []).length;
    const color = pickColor();

    const lyr = L.geoJSON(geojson, {
      style: () => vectorStyle(color),
      pointToLayer: (f, ll) => L.circleMarker(ll, pointStyle(color)),
      onEachFeature: (feature, layer) => {
        layer.on('click', ev => {
          L.DomEvent.stopPropagation(ev);
          showInfo(feature, name);
        });
      }
    }).addTo(state.map);

    const id = state.nextId++;
    state.layers.push({ id, name, type: 'vector', leafletLayer: lyr, color, visible: true, meta: n + ' objekt', geojson });
    state.activeId = id;
    updateLayers();
    fitLayer(lyr);
    setStatus(`✓ ${n} objekt laddade — ${name}`);
    toast(`${name} — ${n} objekt`, 'success');
  } catch (err) {
    toast(err.message, 'error');
    setStatus('Fel');
  } finally {
    showLoading(false);
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
async function loadCSVUrl(url) {
  showLoading(true, 'Hämtar CSV…');
  try {
    const res = await fetchCORS(url);
    loadCSVStr(await res.text(), nameFrom(url));
  } catch (err) {
    toast(err.message, 'error');
    showLoading(false);
  }
}

function loadCSVStr(text, name = 'CSV') {
  showLoading(true, 'Läser CSV…');
  try {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    const rows = result.data;
    if (!rows.length) throw new Error('CSV-filen är tom');

    const keys = Object.keys(rows[0]);
    const latCol = findCol(keys, ['lat','latitude','latitud','y','north','northing','wgs84_lat']);
    const lonCol = findCol(keys, ['lon','lng','long','longitude','longitud','x','east','easting','wgs84_lon']);

    if (!latCol || !lonCol) {
      toast(`CSV: ${rows.length} rader — lägg till lat/lon-kolumner för kartvisning`, 'warning');
      setStatus(`CSV inläst: ${rows.length} rader (ingen geometri hittad)`);
      showLoading(false);
      return;
    }

    const features = rows
      .filter(r => r[latCol] != null && r[lonCol] != null && !isNaN(r[latCol]) && !isNaN(r[lonCol]))
      .map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [+r[lonCol], +r[latCol]] },
        properties: r
      }));

    loadGeoJSONObj({ type: 'FeatureCollection', features }, name);
  } catch (err) {
    toast(err.message, 'error');
    showLoading(false);
  }
}

// ─── WMS ─────────────────────────────────────────────────────────────────────
function loadWMS(url) {
  try {
    const u = new URL(url);
    const base = u.origin + u.pathname;
    const layers = u.searchParams.get('LAYERS') || u.searchParams.get('layers') || '';

    if (layers) {
      // LAYERS already in URL — add directly
      addWMSLayer(base, layers);
    } else {
      // Show inline layer name prompt
      showWMSPrompt(base);
    }
  } catch (err) {
    toast('Ogiltig URL: ' + err.message, 'error');
  }
}

function showWMSPrompt(baseUrl) {
  // Remove any existing prompt
  document.getElementById('wms-prompt')?.remove();

  const el = document.createElement('div');
  el.id = 'wms-prompt';
  el.className = 'wms-prompt';
  el.innerHTML = `
    <div class="wms-prompt-label">WMS-lagernamn (LAYERS)</div>
    <div class="wms-prompt-hint">Finns i GetCapabilities under &lt;Layer&gt;&lt;Name&gt;</div>
    <div class="wms-prompt-row">
      <input id="wms-layers-input" class="wms-input" type="text" placeholder="t.ex. topowebbkartan_nedtonad" autocomplete="off" />
      <button class="btn btn-primary" id="wms-add-btn">Lägg till</button>
      <button class="btn btn-ghost" id="wms-cancel-btn">✕</button>
    </div>
  `;

  // Insert after the load button row
  const loadBtn = document.getElementById('load-btn').closest('.btn-row');
  loadBtn.insertAdjacentElement('afterend', el);

  const input = document.getElementById('wms-layers-input');
  input.focus();

  document.getElementById('wms-add-btn').addEventListener('click', () => {
    const layers = input.value.trim();
    if (!layers) { input.focus(); return; }
    el.remove();
    addWMSLayer(baseUrl, layers);
  });

  document.getElementById('wms-cancel-btn').addEventListener('click', () => el.remove());

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('wms-add-btn').click();
    if (e.key === 'Escape') el.remove();
  });
}

function addWMSLayer(baseUrl, layers) {
  try {
    const lyr = L.tileLayer.wms(baseUrl, {
      layers,
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: 'WMS: ' + baseUrl
    }).addTo(state.map);

    const id = state.nextId++;
    state.layers.push({ id, name: 'WMS: ' + layers, type: 'wms', leafletLayer: lyr, color: '#3b82f6', visible: true, meta: 'WMS' });
    updateLayers();
    toast('WMS-lager tillagt: ' + layers, 'success');
    setStatus('✓ WMS: ' + layers);
  } catch (err) {
    toast('WMS-fel: ' + err.message, 'error');
  }
}

function loadWMTS(url) {
  try {
    const lyr = L.tileLayer(url, { attribution: 'WMTS', maxZoom: 18 }).addTo(state.map);
    const id = state.nextId++;
    const name = 'WMTS: ' + nameFrom(url);
    state.layers.push({ id, name, type: 'wmts', leafletLayer: lyr, color: '#8b5cf6', visible: true, meta: 'WMTS' });
    updateLayers();
    toast(name + ' tillagt', 'success');
  } catch (err) {
    toast('WMTS-fel: ' + err.message, 'error');
  }
}

// ─── ArcGIS REST ──────────────────────────────────────────────────────────────
async function loadArcGIS(url) {
  showLoading(true, 'Hämtar från ArcGIS REST…');
  try {
    let q = url.replace(/\/$/, '');
    if (!q.toLowerCase().includes('/query')) q += '/query';
    const sep = q.includes('?') ? '&' : '?';
    const fullUrl = q + sep + 'where=1%3D1&outFields=*&f=geojson&resultRecordCount=2000';
    const res = await fetchCORS(fullUrl);
    const data = await res.json();
    await loadGeoJSONObj(data, 'ArcGIS: ' + nameFrom(url));
  } catch (err) {
    toast('ArcGIS-fel: ' + err.message, 'error');
    showLoading(false);
  }
}

// ─── File handler ─────────────────────────────────────────────────────────────
function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const name = file.name.replace(/\.[^.]+$/, '');
  const reader = new FileReader();
  reader.onload = async e => {
    const text = e.target.result;
    if (ext === 'csv') {
      loadCSVStr(text, name);
    } else if (ext === 'geojson' || ext === 'json') {
      try { await loadGeoJSONObj(JSON.parse(text), name); }
      catch { toast('Ogiltig JSON/GeoJSON', 'error'); }
    } else if (ext === 'kml') {
      loadKML(text, name);
    } else if (ext === 'gpx') {
      loadGPX(text, name);
    } else if (ext === 'topojson') {
      try { await loadGeoJSONObj(JSON.parse(text), name); }
      catch { toast('Ogiltig TopoJSON', 'error'); }
    } else {
      toast('Format stöds ej: .' + ext, 'warning');
    }
  };
  reader.readAsText(file);
}

function loadKML(text, name) {
  try {
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const placemarks = xml.querySelectorAll('Placemark');
    const features = [];
    placemarks.forEach(pm => {
      const nameEl = pm.querySelector('name');
      const descEl = pm.querySelector('description');
      const ptEl = pm.querySelector('Point coordinates');
      if (ptEl) {
        const [lon, lat] = ptEl.textContent.trim().split(',').map(Number);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: { name: nameEl?.textContent || '', description: descEl?.textContent || '' }
        });
      }
    });
    if (!features.length) { toast('Inga punkter hittades i KML', 'warning'); return; }
    loadGeoJSONObj({ type: 'FeatureCollection', features }, name);
  } catch { toast('Kunde inte läsa KML', 'error'); }
}

function loadGPX(text, name) {
  try {
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const wpts = xml.querySelectorAll('wpt');
    const trkpts = xml.querySelectorAll('trkpt');
    const all = [...wpts, ...trkpts];
    const features = all.map(pt => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [+pt.getAttribute('lon'), +pt.getAttribute('lat')] },
      properties: { name: pt.querySelector('name')?.textContent || '' }
    }));
    if (!features.length) { toast('Inga punkter hittades i GPX', 'warning'); return; }
    loadGeoJSONObj({ type: 'FeatureCollection', features }, name);
  } catch { toast('Kunde inte läsa GPX', 'error'); }
}

// ─── Example loader ──────────────────────────────────────────────────────────
async function loadExample(ex) {
  if (ex.csv) {
    loadCSVStr(ex.data, ex.name);
    return;
  }
  document.getElementById('url-input').value = ex.url;
  await loadGeoJSONUrl(ex.url);
}

// ─── JSON → GeoJSON normalizer ────────────────────────────────────────────────
function toGeoJSON(data) {
  if (!data) return null;

  // Already GeoJSON
  if (data.type === 'FeatureCollection') return data;
  if (data.type === 'Feature') return { type: 'FeatureCollection', features: [data] };
  const geoTypes = ['Point','LineString','Polygon','MultiPoint','MultiLineString','MultiPolygon','GeometryCollection'];
  if (geoTypes.includes(data.type)) {
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: data, properties: {} }] };
  }

  // Array of objects
  if (Array.isArray(data)) {
    const features = data.map(item => {
      const props = { ...item };
      let geometry = null;
      if (item.geometry) { geometry = item.geometry; delete props.geometry; }
      else if (item.geom) { geometry = item.geom; delete props.geom; }
      else if (item.lat && item.lon) geometry = { type: 'Point', coordinates: [+item.lon, +item.lat] };
      else if (item.latitude && item.longitude) geometry = { type: 'Point', coordinates: [+item.longitude, +item.latitude] };
      return geometry ? { type: 'Feature', geometry, properties: props } : null;
    }).filter(Boolean);
    if (features.length) return { type: 'FeatureCollection', features };
  }

  // Wrapped: { features: [...] } etc.
  for (const k of ['features','results','data','items','records','value']) {
    if (Array.isArray(data[k])) {
      const nested = toGeoJSON(data[k]);
      if (nested) return nested;
    }
  }

  return null;
}

// ─── Styling ─────────────────────────────────────────────────────────────────
function vectorStyle(color) {
  return {
    color: state.currentStyle.strokeColor,
    fillColor: color || state.currentStyle.fillColor,
    weight: 1.5, opacity: 1,
    fillOpacity: state.currentStyle.opacity
  };
}
function pointStyle(color) {
  return {
    radius: state.currentStyle.radius,
    fillColor: color || state.currentStyle.fillColor,
    color: state.currentStyle.strokeColor,
    weight: 1.5, opacity: 1,
    fillOpacity: state.currentStyle.opacity
  };
}

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#0d9488'];
let colorIdx = 0;
function pickColor() { return COLORS[colorIdx++ % COLORS.length]; }

function applyStyle() {
  const layer = state.layers.find(l => l.id === state.activeId);
  if (!layer || layer.type === 'wms' || layer.type === 'wmts') {
    toast('Välj ett vektorlager i lagerlistan', 'warning'); return;
  }
  state.currentStyle.fillColor = document.getElementById('fill-color').value;
  state.currentStyle.strokeColor = document.getElementById('stroke-color').value;
  state.currentStyle.opacity = parseInt(document.getElementById('opacity-slider').value) / 100;
  state.currentStyle.radius = parseInt(document.getElementById('radius-slider').value);
  layer.color = state.currentStyle.fillColor;

  layer.leafletLayer.setStyle(vectorStyle(layer.color));
  layer.leafletLayer.eachLayer(l => {
    if (l instanceof L.CircleMarker) {
      l.setStyle(pointStyle(layer.color));
      l.setRadius(state.currentStyle.radius);
    }
  });
  updateLayers();
  toast('Stil tillämpad', 'success');
}

// ─── Layer UI ─────────────────────────────────────────────────────────────────
function updateLayers() {
  const list = document.getElementById('layer-list');
  const n = state.layers.length;
  document.getElementById('layer-count').textContent = n;

  if (!n) {
    list.innerHTML = '<div class="empty-msg">Inga lager laddade</div>';
    return;
  }

  list.innerHTML = '';
  [...state.layers].reverse().forEach(lyr => {
    const el = document.createElement('div');
    el.className = 'layer-item' + (lyr.id === state.activeId ? ' active' : '');
    el.innerHTML = `
      <div class="layer-dot" style="background:${lyr.color}" title="Klicka för att välja"></div>
      <div class="layer-info">
        <div class="layer-name" title="${lyr.name}">${lyr.name}</div>
        <div class="layer-meta">${lyr.meta || lyr.type}</div>
      </div>
      <div class="layer-btns">
        <button class="layer-btn ${lyr.visible ? 'active' : ''}" data-action="toggle" data-id="${lyr.id}" title="${lyr.visible ? 'Dölj' : 'Visa'}">${lyr.visible ? '◉' : '○'}</button>
        <button class="layer-btn" data-action="zoom" data-id="${lyr.id}" title="Zooma">⊙</button>
        <button class="layer-btn del" data-action="delete" data-id="${lyr.id}" title="Ta bort">✕</button>
      </div>
    `;
    el.querySelector('.layer-dot').addEventListener('click', () => {
      state.activeId = lyr.id;
      updateLayers();
    });
    el.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        const numId = +id;
        if (action === 'toggle') toggleLayer(numId);
        else if (action === 'zoom') { const l = state.layers.find(x => x.id === numId); if (l) fitLayer(l.leafletLayer); }
        else if (action === 'delete') deleteLayer(numId);
      });
    });
    list.appendChild(el);
  });
}

function toggleLayer(id) {
  const l = state.layers.find(x => x.id === id);
  if (!l) return;
  l.visible = !l.visible;
  l.visible ? l.leafletLayer.addTo(state.map) : state.map.removeLayer(l.leafletLayer);
  updateLayers();
}
function deleteLayer(id) {
  const i = state.layers.findIndex(x => x.id === id);
  if (i < 0) return;
  state.map.removeLayer(state.layers[i].leafletLayer);
  state.layers.splice(i, 1);
  if (state.activeId === id) state.activeId = state.layers.length ? state.layers.at(-1).id : null;
  updateLayers();
  setStatus('Lager borttaget');
}
function clearAll() {
  state.layers.forEach(l => state.map.removeLayer(l.leafletLayer));
  state.layers = [];
  state.activeId = null;
  updateLayers();
  setStatus('Alla lager borttagna');
}

function fitLayer(lyr) {
  try {
    const b = lyr.getBounds ? lyr.getBounds() : null;
    if (b && b.isValid()) state.map.fitBounds(b, { padding: [40, 40], maxZoom: 16 });
  } catch {}
}
function zoomAll() {
  if (!state.layers.length) return;
  const bounds = L.latLngBounds();
  state.layers.forEach(l => {
    try { if (l.leafletLayer.getBounds) { const b = l.leafletLayer.getBounds(); if (b.isValid()) bounds.extend(b); } } catch {}
  });
  if (bounds.isValid()) state.map.fitBounds(bounds, { padding: [40, 40] });
}

// ─── Basemaps ─────────────────────────────────────────────────────────────────
let basemapLayer = null;
let activeBM = 'voyager';

function setBasemap(id) {
  const bm = BASEMAPS.find(b => b.id === id);
  if (!bm) return;
  if (basemapLayer) state.map.removeLayer(basemapLayer);
  const opts = {
    attribution: bm.attr,
    maxZoom: bm.maxZoom || 19
  };
  // Only pass subdomains if explicitly defined, otherwise let Leaflet default
  if (bm.subdomains !== undefined) opts.subdomains = bm.subdomains;
  basemapLayer = L.tileLayer(bm.url, opts).addTo(state.map);
  basemapLayer.bringToBack();
  activeBM = id;
  document.querySelectorAll('.bm-btn').forEach(b => b.classList.toggle('active', b.dataset.id === id));
}

function renderBasemaps() {
  const grid = document.getElementById('basemap-grid');
  grid.innerHTML = '';
  BASEMAPS.forEach(bm => {
    const btn = document.createElement('button');
    btn.className = 'bm-btn' + (bm.id === activeBM ? ' active' : '');
    btn.dataset.id = bm.id;
    btn.innerHTML = `<span class="bm-icon">${bm.icon}</span><span class="bm-name">${bm.name}</span>`;
    btn.addEventListener('click', () => setBasemap(bm.id));
    grid.appendChild(btn);
  });
}

// ─── Examples UI ──────────────────────────────────────────────────────────────
function renderExamples() {
  const list = document.getElementById('examples-list');
  list.innerHTML = '';
  EXAMPLES.forEach(ex => {
    const btn = document.createElement('button');
    btn.className = 'ex-item';
    btn.innerHTML = `<span class="ex-tag tag-${ex.tag}">${ex.tag}</span><span class="ex-name">${ex.name}</span>`;
    btn.addEventListener('click', () => loadExample(ex));
    list.appendChild(btn);
  });
}

// ─── Feature info ──────────────────────────────────────────────────────────────
function showInfo(feature, layerName) {
  const props = feature.properties || {};
  const keys = Object.keys(props);
  const body = document.getElementById('info-panel-body');

  if (!keys.length) {
    body.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--gray-400);font-style:italic">Inga attribut</div>';
  } else {
    body.innerHTML = keys.map(k => {
      const v = props[k];
      let display;
      if (v === null || v === undefined || v === '') {
        display = '<span class="prop-null">—</span>';
      } else if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))) {
        display = `<a href="${v}" target="_blank" rel="noopener">${v.length > 45 ? v.slice(0,45)+'…' : v}</a>`;
      } else {
        display = String(v);
      }
      return `<div class="prop-row"><span class="prop-key">${k}</span><span class="prop-val">${display}</span></div>`;
    }).join('');
  }

  document.getElementById('info-panel').style.display = 'block';
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportGeoJSON() {
  const l = state.layers.find(x => x.id === state.activeId);
  if (!l || l.type === 'wms' || l.type === 'wmts') { toast('Välj ett vektorlager', 'warning'); return; }
  const gj = l.geojson || (l.leafletLayer.toGeoJSON ? l.leafletLayer.toGeoJSON() : null);
  if (!gj) { toast('Kan inte exportera', 'error'); return; }
  download(JSON.stringify(gj, null, 2), l.name + '.geojson', 'application/json');
  toast('GeoJSON exporterad', 'success');
}

function exportCSV() {
  const l = state.layers.find(x => x.id === state.activeId);
  if (!l || l.type === 'wms' || l.type === 'wmts') { toast('Välj ett vektorlager', 'warning'); return; }
  const gj = l.geojson || (l.leafletLayer.toGeoJSON ? l.leafletLayer.toGeoJSON() : null);
  if (!gj || !gj.features?.length) { toast('Inga objekt', 'warning'); return; }

  const allKeys = [...new Set(gj.features.flatMap(f => Object.keys(f.properties || {})))];
  const rows = [
    ['lon','lat',...allKeys].join(','),
    ...gj.features.map(f => {
      const c = f.geometry?.type === 'Point' ? f.geometry.coordinates : ['',''];
      const vals = allKeys.map(k => {
        const v = String((f.properties || {})[k] ?? '');
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g,'""')}"` : v;
      });
      return [c[0],c[1],...vals].join(',');
    })
  ];
  download(rows.join('\n'), l.name + '.csv', 'text/csv');
  toast('CSV exporterad', 'success');
}

function copyLink() {
  const url = document.getElementById('url-input').value.trim();
  if (!url) { toast('Ange en URL att dela', 'warning'); return; }
  const link = location.origin + location.pathname + '?url=' + encodeURIComponent(url);
  navigator.clipboard.writeText(link)
    .then(() => toast('Länk kopierad!', 'success'))
    .catch(() => toast('Kunde inte kopiera: ' + link, 'warning'));
}

function checkUrlParams() {
  const url = new URLSearchParams(location.search).get('url');
  if (url) {
    document.getElementById('url-input').value = url;
    setTimeout(handleLoad, 800);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
async function fetchCORS(url) {
  // Try direct first (works for CORS-enabled APIs)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return res;
  } catch {}
  // Fallback to CORS proxy
  const proxied = 'https://corsproxy.io/?' + encodeURIComponent(url);
  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`HTTP ${res.status} — kontrollera URL`);
  return res;
}

function nameFrom(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return (parts.at(-1) || new URL(url).hostname).replace(/\.[^.]+$/, '').slice(0, 50);
  } catch { return 'Dataset'; }
}

function findCol(headers, candidates) {
  return headers.find(h => candidates.some(c => h.toLowerCase().trim() === c.toLowerCase())) || null;
}

function download(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function setStatus(msg) { document.getElementById('status-text').textContent = msg; }

function showLoading(show, text = 'Laddar…') {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
  if (show) document.getElementById('loading-text').textContent = text;
}

function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.2s ease forwards';
    setTimeout(() => el.remove(), 200);
  }, 3500);
}
