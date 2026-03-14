# ⬡ GeoData Explorer

**Förhandsgranska öppen geodata direkt i webbläsaren — ingen installation, ingen backend, ingen inloggning.**

Ett enkelt och återanvändbart verktyg för att snabbt visualisera öppna dataset på karta. Byggt som ett komplement till [dataportal.se](https://www.dataportal.se).

🔗 **[Öppna live-demo](https://melissaskywalkz.github.io/geodata-explorer)**

---

## Vad kan det?

Klistra in en URL eller rå data direkt i fältet — verktyget identifierar format och ritar ut det på kartan.

| Format | Hur |
|---|---|
| GeoJSON | URL eller inklistrad JSON |
| JSON | Auto-konverteras till GeoJSON om möjligt |
| CSV | URL eller inklistrad text — kolumner som `lat`, `lon`, `latitude`, `longitude`, `x`, `y` känns igen automatiskt |
| WMS | Ange URL med `LAYERS`-parameter |
| WMTS | Tile-URL med `{z}/{x}/{y}` |
| ArcGIS REST | FeatureServer eller MapServer — hämtas som GeoJSON |
| KML / GPX | Via drag & drop eller filväljare |

**Mer:**
- Klicka på ett objekt i kartan för att se alla attribut
- Hantera flera lager — visa/dölj, zooma till, ta bort
- Justera färg, opacitet och punktstorlek per lager
- Exportera aktivt lager som GeoJSON eller CSV
- Dela ett dataset via länk: `?url=https://...`
- Dra och släpp lokala filer direkt på kartan

---

## Bakgrundskartor

- ☀️ Ljus (CartoDB Positron)
- 🗺 Gatukarta (CartoDB Voyager)
- ⛰ Terrängkarta (OpenTopoMap)
- 🌑 Mörkt tema (CartoDB Dark Matter)

---

## Kom igång på GitHub Pages

1. Forka detta repo
2. Gå till **Settings → Pages**
3. Välj `main`-branchen, rotkatalogen
4. Din sida är tillgänglig på `https://ditt-namn.github.io/geodata-explorer`

Eller kör lokalt utan installation:

```bash
git clone https://github.com/MelissaSkywalkz/geodata-explorer.git
cd geodata-explorer
python3 -m http.server 8000
```

---

## Struktur

```
geodata-explorer/
├── index.html   — layout och markup
├── style.css    — ljust professionellt tema med CSS-variabler
├── app.js       — all logik: inläsning, konvertering, karta
└── README.md
```

Inga byggsteg, inga ramverk. Tre filer — klart.

**Beroenden via CDN:**
- [Leaflet 1.9](https://leafletjs.com/) — kartbibliotek
- [PapaParse](https://www.papaparse.com/) — CSV-parsning
- [corsproxy.io](https://corsproxy.io/) — CORS-proxy för externa URL:er

---

## Anpassa för ditt eget projekt

### Byt eller lägg till bakgrundskarta

Redigera `BASEMAPS`-arrayen i `app.js`:

```js
{
  id: 'min-karta',
  name: 'Min karta',
  icon: '🗺',
  url: 'https://tile.example.com/{z}/{x}/{y}.png',
  attr: '© Källa',
  maxZoom: 18
}
```

### Lägg till exempeldataset

Redigera `EXAMPLES`-arrayen i `app.js`:

```js
{
  name: 'Mina data',
  tag: 'geojson',
  url: 'https://example.com/data.geojson'
}
```

### Byt CORS-proxy

```js
// I fetchCORS()-funktionen i app.js:
const proxied = 'https://din-proxy.example.com/?url=' + encodeURIComponent(url);
```

---

## Öppna datakällor att prova

- [dataportal.se](https://www.dataportal.se) — Sveriges samlade öppna dataportal
- [Lantmäteriet öppna geodata](https://www.lantmateriet.se/sv/geodata/vara-produkter/produktlista/oppna-data/)
- [Trafikverket öppet API](https://api.trafikinfo.trafikverket.se/)
- [Naturvårdsverket geodata](https://www.naturvardsverket.se/vagledning-och-stod/miljodata/oppna-geodata/)
- [SCB geodata](https://www.scb.se/vara-tjanster/oppna-data/)
- [Boverket öppna data](https://www.boverket.se/sv/PBL-kunskapsbanken/Allmant-om-PBL/termen-plan--och-bygglagen/oppna-data/)

---

## Licens

MIT — använd, modifiera och dela fritt.
