import fs from 'node:fs';

const appPath=new URL('../index.html',import.meta.url);
let html=fs.readFileSync(appPath,'utf8');

if(html.includes('/* AUTOCOMPLETE_EMPRESAS_V4_RELACION */')){
  console.log('[Brigadas] Relación Acuerdo/Empresa en Misión v4 ya instalada.');
  process.exit(0);
}
if(!html.includes('/* AUTOCOMPLETE_EMPRESAS_V3 */')){
  throw new Error('Primero debe ejecutarse patch-autocomplete-empresas-v3.mjs.');
}

const ayuda='<div class="ayuda empresa-autocomplete-ayuda">Puede elegir una sugerencia o escribir una empresa nueva si todavía no aparece en nuestra lista.</div>';
const ayudaNueva=`${ayuda}
        <div id="empresaRelacionSeleccionada" class="empresa-relacion-seleccionada oculto" aria-live="polite"></div>`;
if(!html.includes(ayuda))throw new Error('No se encontró la ayuda del autocomplete v3.');
html=html.replace(ayuda,ayudaNueva);

const css=`
/* AUTOCOMPLETE_EMPRESAS_V4_RELACION */
.empresa-relacion-seleccionada{margin-top:10px;padding:11px 12px;border:1.5px solid #CFC4E5;border-radius:10px;background:#FBF9FE;font-size:12px;line-height:1.45;color:var(--gris-txt)}
.empresa-relacion-seleccionada .relacion-titulo{font-size:11px;font-weight:900;color:#563D83;text-transform:uppercase;letter-spacing:.35px;margin-bottom:5px}
.empresa-relacion-seleccionada .relacion-fila{display:grid;grid-template-columns:110px 1fr;gap:7px;margin-top:3px}
.empresa-relacion-seleccionada .relacion-et{font-weight:800;color:#5E5174}
.empresa-relacion-seleccionada .relacion-val{font-weight:700;word-break:break-word}
@media(max-width:420px){.empresa-relacion-seleccionada .relacion-fila{grid-template-columns:1fr;gap:1px}}
`;
const styleEnd=html.indexOf('</style>');
if(styleEnd<0)throw new Error('No se encontró </style>.');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);

const elegirViejo="function elegirEmpresaAutocomplete(x){var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;i.value=x.valor;i.dataset.sugerenciaEmpresa='1';cerrarEmpresasAutocomplete();i.focus()}";
const elegirNuevo=`function limpiarRelacionEmpresaSeleccionada(){
  var i=document.getElementById('nombreEmpresaOrigen'),box=document.getElementById('empresaRelacionSeleccionada');
  if(i){delete i.dataset.sugerenciaEmpresa;delete i.dataset.acuerdoComercial;delete i.dataset.empresaMision;}
  if(box){box.innerHTML='';box.classList.add('oculto')}
}
function mostrarRelacionEmpresaSeleccionada(acuerdo,mision){
  var box=document.getElementById('empresaRelacionSeleccionada');if(!box)return;
  acuerdo=String(acuerdo||'').trim();mision=String(mision||'').trim();
  var htmlRel='<div class="relacion-titulo">Selección confirmada</div>'+
    '<div class="relacion-fila"><div class="relacion-et">Acuerdo comercial</div><div class="relacion-val">'+acuerdo.replace(/[&<>\"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])})+'</div></div>';
  if(mision)htmlRel+='<div class="relacion-fila"><div class="relacion-et">Empresa en misión</div><div class="relacion-val">'+mision.replace(/[&<>\"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])})+'</div></div>';
  box.innerHTML=htmlRel;box.classList.remove('oculto');
}
function elegirEmpresaAutocomplete(x){
  var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;
  var acuerdo=String(x.valor||'').trim();
  var mision=x.match&&x.match.esMision?String(x.match.valor||'').trim():'';
  i.value=acuerdo;i.dataset.sugerenciaEmpresa='1';i.dataset.acuerdoComercial=acuerdo;
  if(mision)i.dataset.empresaMision=mision;else delete i.dataset.empresaMision;
  mostrarRelacionEmpresaSeleccionada(acuerdo,mision);cerrarEmpresasAutocomplete();i.focus();
}`;
if(!html.includes(elegirViejo))throw new Error('No se encontró elegirEmpresaAutocomplete de v3.');
html=html.replace(elegirViejo,elegirNuevo);

const listenerViejo="i.addEventListener('input',function(){clearTimeout(t);t=setTimeout(actualizarEmpresasAutocomplete,70)});";
const listenerNuevo="i.addEventListener('input',function(){limpiarRelacionEmpresaSeleccionada();clearTimeout(t);t=setTimeout(actualizarEmpresasAutocomplete,70)});";
if(!html.includes(listenerViejo))throw new Error('No se encontró listener input del autocomplete v3.');
html=html.replace(listenerViejo,listenerNuevo);

const nombreViejo="const nombreEmpresaOrigen = document.getElementById('nombreEmpresaOrigen').value.trim();";
const nombreNuevo=`const inputEmpresaOrigen = document.getElementById('nombreEmpresaOrigen');
  const nombreEmpresaOrigen = inputEmpresaOrigen.value.trim();
  const acuerdoComercialOrigen = (inputEmpresaOrigen.dataset.acuerdoComercial || '').trim();
  const empresaMisionOrigen = (inputEmpresaOrigen.dataset.empresaMision || '').trim();
  // La columna histórica \"Empresa en misión\" debe conservar la empresa en misión real cuando fue identificada.
  // Si el usuario eligió/escribió solo un acuerdo o una empresa nueva, se conserva el texto visible como antes.
  const empresaParaRegistro = empresaMisionOrigen || nombreEmpresaOrigen || '';`;
if(!html.includes(nombreViejo))throw new Error('No se encontró nombreEmpresaOrigen en el envío del formulario.');
html=html.replace(nombreViejo,nombreNuevo);

const empresaVieja='    empresa:          nombreEmpresaOrigen || "",';
const empresaNueva=`    empresa:          empresaParaRegistro,
    acuerdoComercial: acuerdoComercialOrigen,
    empresaMision:    empresaMisionOrigen,`;
if(!html.includes(empresaVieja))throw new Error('No se encontró la propiedad empresa del payload.');
html=html.replace(empresaVieja,empresaNueva);

if(!html.includes('AUTOCOMPLETE_EMPRESAS_V4_RELACION')||!html.includes('empresaRelacionSeleccionada')||!html.includes('acuerdoComercialOrigen')||!html.includes('empresaMisionOrigen')){
  throw new Error('La relación Acuerdo/Empresa en Misión v4 quedó incompleta.');
}

fs.writeFileSync(appPath,html,'utf8');
console.log('[Brigadas] v4: al seleccionar una coincidencia se conservan Acuerdo Comercial y Empresa en Misión; el registro mantiene la empresa en misión real para BIOFILE/panel.');
