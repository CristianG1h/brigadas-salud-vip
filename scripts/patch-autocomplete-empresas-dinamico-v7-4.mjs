import fs from 'node:fs';

const appPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');
const MARCA = '/* AUTOCOMPLETE_EMPRESAS_BIOFILE_V74 */';

if (html.includes(MARCA)) {
  console.log('[Brigadas] Autocomplete BIOFILE v7.4 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* AUTOCOMPLETE_EMPRESAS_V6_SELF_SIMILAR */')) {
  throw new Error('Primero debe ejecutarse patch-autocomplete-empresas-v6.mjs.');
}

const oldFn = "async function actualizarEmpresasAutocomplete(){var i=document.getElementById('nombreEmpresaOrigen');if(!i)return;var q=i.value.trim();delete i.dataset.sugerenciaEmpresa;if(empresaNorm(q).length<2){cerrarEmpresasAutocomplete();return}if(!empresasAutocomplete.length){pintarEmpresasAutocomplete([],'Buscando coincidencias…');await cargarEmpresasAutocomplete();if(i.value.trim()!==q)return}pintarEmpresasAutocomplete(buscarEmpresasAutocomplete(q))}";
if (!html.includes(oldFn)) throw new Error('No se encontró actualizarEmpresasAutocomplete de v3.');

const nuevo = `${MARCA}
const DIRECTORIO_EMPRESAS_BIOFILE_V74='https://biofile-render-endpoint.onrender.com/api/directorio/empresas';
const DIRECTORIO_EMPRESAS_CACHE_V74=new Map();
function empresaRemotaAV74(x){
  var acuerdo=String(x&&x.acuerdo||'').trim(),cliente=String(x&&x.cliente||'').trim();if(!acuerdo)return null;
  var match=cliente&&empresaNorm(cliente)!==empresaNorm(acuerdo)?{valor:cliente,norm:empresaNorm(cliente),compact:empresaCompact(cliente),esMision:false}:null;
  return{valor:acuerdo,match:match,score:10000,remoto:true}
}
async function buscarDirectorioEmpresasV74(q){
  var k=empresaNorm(q);if(k.length<2)return[];
  var cache=DIRECTORIO_EMPRESAS_CACHE_V74.get(k);if(cache&&Date.now()-cache.fecha<10*60*1000)return cache.items;
  try{
    var u=DIRECTORIO_EMPRESAS_BIOFILE_V74+'?q='+encodeURIComponent(q)+'&limit=8&_='+Date.now();
    var r=await fetch(u,{cache:'no-store',credentials:'omit'});if(!r.ok)throw new Error('HTTP '+r.status);
    var d=await r.json(),items=(Array.isArray(d.empresas)?d.empresas:[]).map(empresaRemotaAV74).filter(Boolean);
    DIRECTORIO_EMPRESAS_CACHE_V74.set(k,{fecha:Date.now(),items:items});return items
  }catch(e){console.warn('[Empresas] Directorio BIOFILE no disponible; usando catálogo local.',e);return[]}
}
function combinarEmpresasV74(remotas,locales){
  var mapa=new Map(),out=[];function add(x){if(!x||!x.valor)return;var k=empresaNorm(x.valor);if(!k||mapa.has(k))return;mapa.set(k,1);out.push(x)}
  (remotas||[]).forEach(add);(locales||[]).forEach(add);return out.slice(0,8)
}
async function actualizarEmpresasAutocomplete(){
  var i=document.getElementById('nombreEmpresaOrigen');if(!i)return;var q=i.value.trim();delete i.dataset.sugerenciaEmpresa;
  if(empresaNorm(q).length<2){cerrarEmpresasAutocomplete();return}
  pintarEmpresasAutocomplete([],'Buscando en BIOFILE…');
  var pLocal=empresasAutocomplete.length?Promise.resolve(empresasAutocomplete):cargarEmpresasAutocomplete();
  var rs=await Promise.all([buscarDirectorioEmpresasV74(q),pLocal.catch(function(){return[]})]);
  if(i.value.trim()!==q)return;
  var locales=buscarEmpresasAutocomplete(q),items=combinarEmpresasV74(rs[0],locales);
  pintarEmpresasAutocomplete(items)
}`;
html = html.replace(oldFn, nuevo);

const ayuda = '<div class="ayuda empresa-autocomplete-ayuda">Puede elegir una sugerencia o escribir una empresa nueva si todavía no aparece en nuestra lista.</div>';
if (html.includes(ayuda)) {
  html = html.replace(ayuda, ayuda.replace('</div>', ' El catálogo consulta también el directorio actualizado diariamente desde BIOFILE.</div>'));
}

if (!html.includes('AUTOCOMPLETE_EMPRESAS_BIOFILE_V74') ||
    !html.includes('/api/directorio/empresas') ||
    !html.includes('buscarDirectorioEmpresasV74')) {
  throw new Error('Autocomplete BIOFILE v7.4 quedó incompleto.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Brigadas] v7.4: el campo Empresa consulta el directorio diario de BIOFILE y conserva fallback local/escritura libre.');
