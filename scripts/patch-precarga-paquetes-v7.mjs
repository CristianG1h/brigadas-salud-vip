import fs from 'node:fs';

const appPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* PRECARGA_PAQUETES_BIOFILE_V7 */')) {
  console.log('[Brigadas] Precarga de paquetes BIOFILE v7 ya instalada.');
  process.exit(0);
}
if (!html.includes('/* AUTOCOMPLETE_EMPRESAS_V6_SELF_SIMILAR */')) {
  throw new Error('Primero debe ejecutarse patch-autocomplete-empresas-v6.mjs.');
}

const marker = 'function enviarFormulario(){';
if (!html.includes(marker)) throw new Error('No se encontró enviarFormulario().');

const helper = [
  '/* PRECARGA_PAQUETES_BIOFILE_V7 */',
  "const URL_CATALOGO_BIOFILE_V7='https://biofile-render-endpoint.onrender.com/api/catalogo/precargar';",
  'function precargarPaquetesBiofileV7(){',
  "  if(origenPaciente!=='empresa')return;",
  "  var input=document.getElementById('nombreEmpresaOrigen');if(!input)return;",
  "  var empresa=String(input.dataset.acuerdoComercial||input.value||'').trim();",
  '  if(empresa.length<3)return;',
  "  fetch(URL_CATALOGO_BIOFILE_V7,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({empresa:empresa})}).catch(function(){ });",
  '}',
  ''
].join('\n');
html = html.replace(marker, helper + marker);

const anchor = "    document.getElementById('nombreFinal').textContent = objeto.nombre1 || '';";
if (!html.includes(anchor)) throw new Error('No se encontró la confirmación final del registro.');
html = html.replace(
  anchor,
  "    // El registro ya fue confirmado por Apps Script. La investigación del catálogo\\n" +
  "    // se dispara en segundo plano y nunca bloquea la pantalla final del paciente.\\n" +
  "    precargarPaquetesBiofileV7();\\n" +
  anchor
);

if (!html.includes('PRECARGA_PAQUETES_BIOFILE_V7') ||
    !html.includes('/api/catalogo/precargar') ||
    !html.includes('precargarPaquetesBiofileV7();')) {
  throw new Error('La precarga de paquetes v7 quedó incompleta.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Brigadas] v7: cada empresa registrada dispara la precarga del catálogo BIOFILE en segundo plano.');
