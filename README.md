# 3D Zoning WebGIS
A front-end WebGIS application using MapLibre GL JS.

## Project Structure

- `index.html`: Main entry point.
- `style.css`: Styles.
- `app.js`: Map logic.
- `data/`: Contains sample GeoJSON data.

## How to Run Locally

You need a local web server to serve the files because of CORS restrictions with loading local files directly in the browser.

### Option 1: Python (Easiest)
If you have Python installed:
```bash
python3 -m http.server
```
Then open `http://localhost:8000` in your browser.

### Option 2: Node.js (Serve)
If you have Node.js installed:
```bash
npx serve .
```

## Customization

### 1. Replace Data
Replace the files in the `data/` folder with your own GeoJSON files:
- `data/zoning.geojson`
- `data/buildings.geojson`

Ensure your data has the required attributes:
- **Zoning**: `zone_name`, `zone_category`, `zone_code`, `info_url` (optional).
- **Buildings**: `height`, `landuse` (optional for color).

### 2. Switch to PMTiles
1. Open `app.js`.
2. Uncomment the PMTiles protocol registration at the top.
3. In `map.on('load')`, comment out the GeoJSON source for zoning and uncomment the PMTiles source example.
4. Update the `url` to point to your PMTiles file (e.g., `pmtiles://https://example.com/data.pmtiles`).
5. Update the layer definition to use the new source and specify the `source-layer`.

### 3. Deploy
Upload all files (`index.html`, `style.css`, `app.js`, `data/`) to any static hosting provider:
- **Vercel / Netlify / Cloudflare Pages**: Drag and drop the folder or connect your Git repository.
- **GitHub Pages**: Push to a GitHub repository and enable Pages.