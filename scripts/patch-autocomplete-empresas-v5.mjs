import fs from 'node:fs';

const appPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* AUTOCOMPLETE_EMPRESAS_V5_MISION_CANONICA */')) {
  console.log('[Brigadas] Autocomplete empresas v5 ya instalado.');
  process.exit(0);
}

if (!html.includes('/* AUTOCOMPLETE_EMPRESAS_V4_RELACION */')) {
  throw new Error('Primero debe ejecutarse patch-autocomplete-empresas-v4.mjs.');
}

const elegirV4 = `function elegirEmpresaAutocomplete(x){
  var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;
  var acuerdo=String(x.valor||'').trim();
  var mision=x.match&&x.match.esMision?String(x.match.valor||'').trim():'';
  i.value=acuerdo;i.dataset.sugerenciaEmpresa='1';i.dataset.acuerdoComercial=acuerdo;
  if(mision)i.dataset.empresaMision=mision;else delete i.dataset.empresaMision;
  mostrarRelacionEmpresaSeleccionada(acuerdo,mision);cerrarEmpresasAutocomplete();i.focus();
}`;

const elegirV5 = `/* AUTOCOMPLETE_EMPRESAS_V5_MISION_CANONICA */
function misionCanonicaParaAcuerdo(acuerdo){
  var objetivo=empresaNorm(acuerdo),item=(empresasAutocomplete||[]).find(function(e){return empresaNorm(e.valor)===objetivo});
  if(!item)return'';
  var misiones=[...new Set((item.misiones||[]).map(function(m){return String(m||'').trim()}).filter(Boolean))];
  var self=misiones.find(function(m){return empresaNorm(m)===objetivo});
  if(self)return self;
  if(misiones.length===1)return misiones[0];
  return'';
}
function elegirEmpresaAutocomplete(x){
  var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;
  var acuerdo=String(x.valor||'').trim();
  var mision=x.match&&x.match.esMision?String(x.match.valor||'').trim():'';
  // Si la búsqueda llegó directamente por el Acuerdo Comercial, completar la misión
  // solamente cuando el catálogo permite hacerlo sin ambigüedad: relación consigo mismo
  // o exactamente una única Empresa en Misión.
  if(!mision)mision=misionCanonicaParaAcuerdo(acuerdo);
  i.value=acuerdo;i.dataset.sugerenciaEmpresa='1';i.dataset.acuerdoComercial=acuerdo;
  if(mision)i.dataset.empresaMision=mision;else delete i.dataset.empresaMision;
  mostrarRelacionEmpresaSeleccionada(acuerdo,mision);cerrarEmpresasAutocomplete();i.focus();
}`;

if (!html.includes(elegirV4)) {
  throw new Error('No se encontró elegirEmpresaAutocomplete de v4.');
}
html = html.replace(elegirV4, elegirV5);

if (!html.includes('AUTOCOMPLETE_EMPRESAS_V5_MISION_CANONICA') ||
    !html.includes('misionCanonicaParaAcuerdo') ||
    !html.includes('misiones.length===1')) {
  throw new Error('Autocomplete empresas v5 quedó incompleto.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Brigadas] v5: Acuerdo Comercial conserva/infere Empresa en Misión canónica solo cuando la relación es segura.');
