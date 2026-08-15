/*
 * Empaqueta la vista previa en un único archivo HTML que se puede abrir
 * o compartir sin servidor ni base de datos: el CSS, el JavaScript, las
 * imágenes y la tipografía quedan todos dentro.
 *
 *   npm run vista-previa
 *
 * Los datos salen de preview/main.jsx, que responde las consultas con
 * ejemplos desde el propio navegador.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist   = 'dist-preview/assets';
const activo = (ext) => join(dist, readdirSync(dist).find(f => f.endsWith(ext)));

const css    = readFileSync(activo('.css'), 'utf8');
const fuente = readFileSync('preview/fuente.css', 'utf8');
let   js     = readFileSync(activo('.js'), 'utf8');

// Las imágenes viven en public/ y el bundle las referencia por ruta absoluta.
const IMAGENES = ['montana.jpg', 'hcompartida.jpg', 'hdoble.jpg', 'Habitacion1.jpg', 'iglu.jpg'];
let incrustadas = 0;
for (const nombre of IMAGENES) {
  const uri = 'data:image/jpeg;base64,' + readFileSync(join('public', nombre)).toString('base64');
  for (const comilla of ['"', "'"]) {
    const literal = comilla + '/' + nombre + comilla;
    incrustadas += js.split(literal).length - 1;
    js = js.split(literal).join(comilla + uri + comilla);
  }
}

const html = `<title>Hostal Kütral</title>
<style>
${fuente}
${css}
/* El visor pinta el fondo según el tema del lector; esta página se
   compromete con el esquema claro, así que lo declara explícitamente. */
html, body { background: #ffffff; color-scheme: light; }
#aviso {
  position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 90;
  display: flex; align-items: center; gap: 8px; background: rgba(17,24,39,.92);
  color: #fff; border-radius: 999px; padding: 8px 16px; max-width: calc(100vw - 28px);
  font: 500 12.5px/1.3 'DM Sans', system-ui, sans-serif;
  box-shadow: 0 6px 24px rgba(0,0,0,.28);
}
#aviso button {
  background: none; border: 0; color: rgba(255,255,255,.55);
  font-size: 17px; line-height: 1; cursor: pointer; padding: 0 0 0 4px;
}
#aviso button:focus-visible { outline: 2px solid #FF6A2F; outline-offset: 2px; }
</style>

<div id="root"></div>

<div id="aviso">
  <span>Vista previa · datos de ejemplo</span>
  <button type="button" aria-label="Cerrar aviso" onclick="this.parentNode.remove()">×</button>
</div>

<script type="module">
${js}
</script>
`;

const salida = 'dist-preview/vista-previa.html';
writeFileSync(salida, html);
console.log(`${salida} · ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB · ${incrustadas} imágenes incrustadas`);
