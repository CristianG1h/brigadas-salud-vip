import fs from 'node:fs';

const appPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('AUTOCOMPLETE_EMPRESAS_V1')) {
  console.log('[Netlify] Autocomplete empresas v1 ya instalado.');
  process.exit(0);
}

const inputOriginal = '<input type="text" id="nombreEmpresaOrigen" placeholder="Ejemplo: Constructora ABC S.A.S." maxlength="120">';
const inputNuevo = `<div class="empresa-autocomplete" id="empresaAutocompleteWrap">
            <input type="text" id="nombreEmpresaOrigen" placeholder="Ejemplo: Constructora ABC S.A.S." maxlength="120" autocomplete="off" aria-autocomplete="list" aria-controls="sugerenciasEmpresa" aria-expanded="false">
            <div id="sugerenciasEmpresa" class="sugerencias-empresa oculto" role="listbox" aria-label="Sugerencias de empresas"></div>
          </div>
          <div class="ayuda empresa-autocomplete-ayuda">Puede elegir una sugerencia o escribir una empresa nueva si todavía no aparece en nuestra lista.</div>`;

if (!html.includes(inputOriginal)) {
  throw new Error('No se encontró el campo nombreEmpresaOrigen esperado.');
}
html = html.replace(inputOriginal, inputNuevo);

const css = `
  /* AUTOCOMPLETE_EMPRESAS_V1 */
  .empresa-autocomplete{position:relative;}
  .sugerencias-empresa{
    margin-top:7px;
    border:1.5px solid #CFC4E5;
    border-radius:10px;
    background:#fff;
    overflow:hidden;
    box-shadow:0 8px 22px rgba(47,31,76,.14);
    max-height:280px;
    overflow-y:auto;
  }
  .sugerencia-empresa{
    width:100%;
    border:0;
    border-bottom:1px solid #ECE7F4;
    background:#fff;
    color:var(--gris-txt);
    text-align:left;
    padding:11px 12px;
    cursor:pointer;
    display:block;
  }
  .sugerencia-empresa:last-child{border-bottom:0;}
  .sugerencia-empresa:hover,
  .sugerencia-empresa.activa{background:var(--morado-claro);}
  .sugerencia-empresa-nombre{
    display:block;
    font-size:13px;
    font-weight:800;
    line-height:1.3;
    color:#3F2F62;
  }
  .sugerencia-empresa-meta{
    display:block;
    margin-top:3px;
    font-size:11px;
    color:var(--gris-suave);
    line-height:1.3;
  }
  .sugerencia-empresa-tipo{
    display:inline-block;
    margin-right:5px;
    padding:2px 6px;
    border-radius:99px;
    background:#EEE7F8;
    color:#563D83;
    font-weight:800;
    font-size:10px;
  }
  .sugerencias-empresa-estado{
    padding:10px 12px;
    font-size:12px;
    color:var(--gris-suave);
    background:#FBFAFD;
  }
  .empresa-autocomplete-ayuda{margin-top:7px;line-height:1.35;}
`;

const styleEnd = html.indexOf('</style>');
if (styleEnd < 0) throw new Error('No se encontró </style> para instalar estilos del autocomplete.');
html = html.slice(0, styleEnd) + css + html.slice(styleEnd);

const js = String.raw`
/* AUTOCOMPLETE_EMPRESAS_V1 */
const EMPRESAS_CATALOGO_VERSION='v1-20260818-relaciones67';
const EMPRESAS_CACHE_KEY='vip_empresas_sugerencias_'+EMPRESAS_CATALOGO_VERSION;
const EMPRESAS_CACHE_MS=24*60*60*1000;
const EMPRESAS_BASE_URL='https://raw.githubusercontent.com/CristianG1h/panel-gestion-biofile-vip/main/data/empresas-mision-v27/';
const EMPRESAS_RELACIONES_URLS=Array.from({length:6},function(_,i){return EMPRESAS_BASE_URL+'relaciones-v67/parte-'+String(i+1).padStart(2,'0')+'.json'});
const EMPRESAS_MANIFEST_URL=EMPRESAS_BASE_URL+'relaciones-acuerdo-mision-v67.json';
let catalogoEmpresas=[];
let promesaCatalogoEmpresas=null;
let resultadosEmpresaActuales=[];
let indiceEmpresaActivo=-1;

function normalizarEmpresaAutocomplete(valor){
  return String(valor||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase()
    .replace(/&/g,' Y ')
    .replace(/\bSOCIEDAD\s+POR\s+ACCIONES\s+SIMPLIFICADA\b/g,' SAS ')
    .replace(/[^A-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function compactoEmpresaAutocomplete(valor){return normalizarEmpresaAutocomplete(valor).replace(/\s+/g,'')}
function tokensEmpresaAutocomplete(valor){return normalizarEmpresaAutocomplete(valor).split(' ').filter(Boolean)}
function ngramasEmpresaAutocomplete(valor){
  var s=compactoEmpresaAutocomplete(valor);if(!s)return[];
  if(s.length<=3)return[s];
  var out=[];for(var i=0;i<=s.length-3;i++)out.push(s.slice(i,i+3));return out;
}
function similitudNgramEmpresaAutocomplete(a,b){
  var aa=ngramasEmpresaAutocomplete(a),bb=ngramasEmpresaAutocomplete(b);if(!aa.length||!bb.length)return 0;
  var conteo=new Map();aa.forEach(function(x){conteo.set(x,(conteo.get(x)||0)+1)});
  var inter=0;bb.forEach(function(x){var n=conteo.get(x)||0;if(n){inter++;conteo.set(x,n-1)}});
  return (2*inter)/(aa.length+bb.length);
}
function crearCatalogoEmpresas(relaciones,manifest){
  var mapa=new Map();
  function agregar(valor,tipo,principal,aliasBusqueda){
    valor=String(valor||'').trim().replace(/\s+/g,' ');if(!valor||/^NO REFIERE$/i.test(valor)||/^ERROR REVISAR$/i.test(valor))return;
    var key=normalizarEmpresaAutocomplete(valor);if(!key)return;
    var item=mapa.get(key);
    if(!item){item={valor:valor,tipo:tipo,principal:principal||'',aliases:[]};mapa.set(key,item)}
    if(tipo==='Acuerdo comercial')item.tipo=tipo;
    if(principal&&!item.principal)item.principal=principal;
    if(aliasBusqueda){var a=String(aliasBusqueda).trim();if(a&&!item.aliases.includes(a))item.aliases.push(a)}
  }
  (relaciones||[]).forEach(function(par){
    if(!Array.isArray(par)||par.length<2)return;
    var principal=String(par[0]||'').trim(),mision=String(par[1]||'').trim();
    agregar(principal,'Acuerdo comercial',principal);
    agregar(mision,'Empresa en misión',principal);
  });
  Object.entries((manifest&&manifest.shortNames)||{}).forEach(function(par){
    var legal=par[0],corto=par[1];
    agregar(legal,'Acuerdo comercial',legal,corto);
    var item=mapa.get(normalizarEmpresaAutocomplete(legal));if(item&&corto&&!item.aliases.includes(corto))item.aliases.push(corto);
  });
  Object.entries((manifest&&manifest.specialAliases)||{}).forEach(function(par){
    var alias=par[0],info=par[1]||{},principal=String(info.principal||'').trim(),mision=String(info.mision||'').trim();
    var objetivo=mision&&normalizarEmpresaAutocomplete(mision)!=='NO REFIERE'?mision:principal;
    if(objetivo)agregar(objetivo,objetivo===principal?'Acuerdo comercial':'Empresa en misión',principal,alias);
    if(principal)agregar(principal,'Acuerdo comercial',principal,alias);
  });
  return Array.from(mapa.values()).map(function(x){
    var busqueda=[x.valor,x.principal].concat(x.aliases||[]).filter(Boolean).join(' ');
    return Object.assign(x,{norm:normalizarEmpresaAutocomplete(busqueda),compact:compactoEmpresaAutocomplete(busqueda),tokens:tokensEmpresaAutocomplete(busqueda)});
  });
}
function leerCacheEmpresas(){
  try{
    var raw=localStorage.getItem(EMPRESAS_CACHE_KEY);if(!raw)return null;
    var obj=JSON.parse(raw);if(!obj||!Array.isArray(obj.items))return null;
    return obj;
  }catch(_){return null}
}
function guardarCacheEmpresas(items){
  try{localStorage.setItem(EMPRESAS_CACHE_KEY,JSON.stringify({guardado:Date.now(),items:items.map(function(x){return{valor:x.valor,tipo:x.tipo,principal:x.principal,aliases:x.aliases}})}))}catch(_){}
}
function hidratarCacheEmpresas(items){
  return (items||[]).map(function(x){var busqueda=[x.valor,x.principal].concat(x.aliases||[]).filter(Boolean).join(' ');return Object.assign(x,{norm:normalizarEmpresaAutocomplete(busqueda),compact:compactoEmpresaAutocomplete(busqueda),tokens:tokensEmpresaAutocomplete(busqueda)})});
}
async function cargarCatalogoEmpresas(){
  if(catalogoEmpresas.length)return catalogoEmpresas;
  if(promesaCatalogoEmpresas)return promesaCatalogoEmpresas;
  var cache=leerCacheEmpresas();
  if(cache&&Array.isArray(cache.items)&&cache.items.length){catalogoEmpresas=hidratarCacheEmpresas(cache.items)}
  if(cache&&Date.now()-Number(cache.guardado||0)<EMPRESAS_CACHE_MS)return catalogoEmpresas;
  promesaCatalogoEmpresas=(async function(){
    try{
      var respuestas=await Promise.all(EMPRESAS_RELACIONES_URLS.concat([EMPRESAS_MANIFEST_URL]).map(function(url){return fetch(url,{cache:'force-cache',credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}));
      var manifest=respuestas.pop();
      var relaciones=[];respuestas.forEach(function(p){if(p&&Array.isArray(p.relaciones))relaciones=relaciones.concat(p.relaciones)});
      var nuevo=crearCatalogoEmpresas(relaciones,manifest);
      if(nuevo.length){catalogoEmpresas=nuevo;guardarCacheEmpresas(nuevo)}
    }catch(e){
      console.warn('[Empresas] No se pudo actualizar el catálogo; se conserva entrada libre.',e);
    }finally{promesaCatalogoEmpresas=null}
    return catalogoEmpresas;
  })();
  return promesaCatalogoEmpresas;
}
function puntuarEmpresaAutocomplete(item,consulta){
  var q=normalizarEmpresaAutocomplete(consulta),qc=compactoEmpresaAutocomplete(consulta);if(!q||!qc)return 0;
  var nombre=normalizarEmpresaAutocomplete(item.valor),nc=compactoEmpresaAutocomplete(item.valor);
  var score=0;
  if(nc===qc)score=2000;
  else if(nc.startsWith(qc))score=1600-Math.min(200,nc.length-qc.length);
  else if(nc.includes(qc))score=1350-Math.min(200,nc.indexOf(qc)*5);
  else if(item.compact.startsWith(qc))score=1250;
  else if(item.compact.includes(qc))score=1120;
  var qt=tokensEmpresaAutocomplete(q),it=tokensEmpresaAutocomplete(item.norm);
  if(qt.length){
    var cubiertos=qt.filter(function(t){return it.some(function(u){return u.startsWith(t)||t.startsWith(u)})}).length;
    score=Math.max(score,700+Math.round(350*(cubiertos/qt.length)));
  }
  if(qc.length>=4){
    var sim=similitudNgramEmpresaAutocomplete(qc,item.compact);
    score=Math.max(score,Math.round(900*sim));
  }
  if(item.tipo==='Acuerdo comercial')score+=8;
  return score;
}
function buscarEmpresasAutocomplete(consulta){
  var q=normalizarEmpresaAutocomplete(consulta);if(q.length<2)return[];
  return catalogoEmpresas.map(function(item){return{item:item,score:puntuarEmpresaAutocomplete(item,q)}})
    .filter(function(x){return x.score>=300})
    .sort(function(a,b){return b.score-a.score||a.item.valor.localeCompare(b.item.valor,'es',{sensitivity:'base'})})
    .slice(0,6)
    .map(function(x){return x.item});
}
function cerrarSugerenciasEmpresa(){
  var box=document.getElementById('sugerenciasEmpresa'),input=document.getElementById('nombreEmpresaOrigen');if(!box||!input)return;
  box.classList.add('oculto');box.innerHTML='';input.setAttribute('aria-expanded','false');resultadosEmpresaActuales=[];indiceEmpresaActivo=-1;
}
function seleccionarSugerenciaEmpresa(item){
  var input=document.getElementById('nombreEmpresaOrigen');if(!input||!item)return;
  input.value=item.valor;input.dataset.sugerenciaSeleccionada=item.valor;input.dispatchEvent(new Event('input',{bubbles:true}));cerrarSugerenciasEmpresa();input.focus();
}
function pintarSugerenciasEmpresa(items,mensaje){
  var box=document.getElementById('sugerenciasEmpresa'),input=document.getElementById('nombreEmpresaOrigen');if(!box||!input)return;
  resultadosEmpresaActuales=items||[];indiceEmpresaActivo=-1;box.innerHTML='';
  if(mensaje){var estado=document.createElement('div');estado.className='sugerencias-empresa-estado';estado.textContent=mensaje;box.appendChild(estado)}
  resultadosEmpresaActuales.forEach(function(item,idx){
    var b=document.createElement('button');b.type='button';b.className='sugerencia-empresa';b.setAttribute('role','option');b.dataset.indice=String(idx);
    var nombre=document.createElement('span');nombre.className='sugerencia-empresa-nombre';nombre.textContent=item.valor;b.appendChild(nombre);
    var meta=document.createElement('span');meta.className='sugerencia-empresa-meta';
    var tipo=document.createElement('span');tipo.className='sugerencia-empresa-tipo';tipo.textContent=item.tipo;meta.appendChild(tipo);
    if(item.tipo==='Empresa en misión'&&item.principal){meta.appendChild(document.createTextNode('Acuerdo: '+item.principal))}
    else if(item.tipo==='Acuerdo comercial'){meta.appendChild(document.createTextNode('Nombre registrado en acuerdos comerciales'))}
    b.appendChild(meta);
    b.addEventListener('pointerdown',function(ev){ev.preventDefault();seleccionarSugerenciaEmpresa(item)});box.appendChild(b);
  });
  if(!mensaje&&!resultadosEmpresaActuales.length){var libre=document.createElement('div');libre.className='sugerencias-empresa-estado';libre.textContent='No encontramos una coincidencia clara. Puede continuar escribiendo este nombre como una empresa nueva.';box.appendChild(libre)}
  box.classList.remove('oculto');input.setAttribute('aria-expanded','true');
}
async function actualizarSugerenciasEmpresa(){
  var input=document.getElementById('nombreEmpresaOrigen');if(!input)return;
  var consulta=input.value.trim();delete input.dataset.sugerenciaSeleccionada;
  if(normalizarEmpresaAutocomplete(consulta).length<2){cerrarSugerenciasEmpresa();return}
  if(!catalogoEmpresas.length){pintarSugerenciasEmpresa([],'Buscando coincidencias…');await cargarCatalogoEmpresas();if(input.value.trim()!==consulta)return}
  pintarSugerenciasEmpresa(buscarEmpresasAutocomplete(consulta));
}
(function iniciarAutocompleteEmpresas(){
  var input=document.getElementById('nombreEmpresaOrigen');if(!input)return;
  var timer=null;
  input.addEventListener('focus',function(){cargarCatalogoEmpresas();if(input.value.trim().length>=2)actualizarSugerenciasEmpresa()});
  input.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(actualizarSugerenciasEmpresa,80)});
  input.addEventListener('keydown',function(e){
    var box=document.getElementById('sugerenciasEmpresa');if(!box||box.classList.contains('oculto')||!resultadosEmpresaActuales.length){if(e.key==='Escape')cerrarSugerenciasEmpresa();return}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();indiceEmpresaActivo+=e.key==='ArrowDown'?1:-1;if(indiceEmpresaActivo<0)indiceEmpresaActivo=resultadosEmpresaActuales.length-1;if(indiceEmpresaActivo>=resultadosEmpresaActuales.length)indiceEmpresaActivo=0;
      box.querySelectorAll('.sugerencia-empresa').forEach(function(b,i){b.classList.toggle('activa',i===indiceEmpresaActivo);if(i===indiceEmpresaActivo)b.scrollIntoView({block:'nearest'})});
    }else if(e.key==='Enter'&&indiceEmpresaActivo>=0){e.preventDefault();seleccionarSugerenciaEmpresa(resultadosEmpresaActuales[indiceEmpresaActivo])}
    else if(e.key==='Escape'){e.preventDefault();cerrarSugerenciasEmpresa()}
  });
  input.addEventListener('blur',function(){setTimeout(cerrarSugerenciasEmpresa,120)});
  var boton=document.getElementById('btnOrigenEmpresa');if(boton)boton.addEventListener('click',function(){cargarCatalogoEmpresas()});
})();
`;

const jsAnchor = 'restaurar();';
const jsIndex = html.lastIndexOf(jsAnchor);
if (jsIndex < 0) throw new Error('No se encontró restaurar(); para instalar autocomplete de empresas.');
html = html.slice(0, jsIndex) + js + '\n' + html.slice(jsIndex);

if (!html.includes('AUTOCOMPLETE_EMPRESAS_V1') || !html.includes('sugerenciasEmpresa') || !html.includes('EMPRESAS_RELACIONES_URLS')) {
  throw new Error('No se instaló correctamente el autocomplete de empresas.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Netlify] Autocomplete empresas v1 instalado: Acuerdos Comerciales + Empresas en Misión + entrada libre.');
