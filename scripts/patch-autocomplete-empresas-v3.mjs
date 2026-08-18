import fs from 'node:fs';

const appPath=new URL('../index.html',import.meta.url);
let html=fs.readFileSync(appPath,'utf8');

if(html.includes('/* AUTOCOMPLETE_EMPRESAS_V3 */')){
  console.log('[Brigadas] Autocomplete empresas v3 ya instalado.');
  process.exit(0);
}

const input='<input type="text" id="nombreEmpresaOrigen" placeholder="Ejemplo: Constructora ABC S.A.S." maxlength="120">';
if(!html.includes(input))throw new Error('No se encontró nombreEmpresaOrigen.');
html=html.replace(input,`<div class="empresa-autocomplete">
          <input type="text" id="nombreEmpresaOrigen" placeholder="Ejemplo: Constructora ABC S.A.S." maxlength="120" autocomplete="off" aria-autocomplete="list" aria-controls="sugerenciasEmpresa" aria-expanded="false">
          <div id="sugerenciasEmpresa" class="sugerencias-empresa oculto" role="listbox" aria-label="Sugerencias de empresas"></div>
        </div>
        <div class="ayuda empresa-autocomplete-ayuda">Puede elegir una sugerencia o escribir una empresa nueva si todavía no aparece en nuestra lista.</div>`);

const css=`
/* AUTOCOMPLETE_EMPRESAS_V3 */
.empresa-autocomplete{position:relative}
.sugerencias-empresa{margin-top:7px;border:1.5px solid #CFC4E5;border-radius:10px;background:#fff;box-shadow:0 8px 22px rgba(47,31,76,.14);max-height:280px;overflow-y:auto}
.sugerencia-empresa{width:100%;border:0;border-bottom:1px solid #ECE7F4;background:#fff;color:var(--gris-txt);text-align:left;padding:11px 12px;cursor:pointer;display:block}
.sugerencia-empresa:last-child{border-bottom:0}.sugerencia-empresa:hover,.sugerencia-empresa.activa{background:var(--morado-claro)}
.sugerencia-empresa-nombre{display:block;font-size:13px;font-weight:800;line-height:1.3;color:#3F2F62}
.sugerencia-empresa-meta{display:block;margin-top:3px;font-size:11px;color:var(--gris-suave);line-height:1.35}
.sugerencia-empresa-tipo{display:inline-block;margin-right:5px;padding:2px 6px;border-radius:99px;background:#EEE7F8;color:#563D83;font-weight:800;font-size:10px}
.sugerencias-empresa-estado{padding:10px 12px;font-size:12px;color:var(--gris-suave);background:#FBFAFD}
.empresa-autocomplete-ayuda{margin-top:7px;line-height:1.35}
`;
const styleEnd=html.indexOf('</style>');
if(styleEnd<0)throw new Error('No se encontró </style>.');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);

const js=String.raw`
/* AUTOCOMPLETE_EMPRESAS_V3 */
const EMPRESA_AUTOCOMPLETE_VERSION='20260818-v3-acuerdos-unificados';
const EMPRESA_AUTOCOMPLETE_CACHE='vip_empresa_autocomplete_'+EMPRESA_AUTOCOMPLETE_VERSION;
const EMPRESA_AUTOCOMPLETE_TTL=24*60*60*1000;
const EMPRESA_AUTOCOMPLETE_BASE='https://raw.githubusercontent.com/CristianG1h/panel-gestion-biofile-vip/main/data/empresas-mision-v27/';
const EMPRESA_AUTOCOMPLETE_PARTES=Array.from({length:6},function(_,i){return EMPRESA_AUTOCOMPLETE_BASE+'relaciones-v67/parte-'+String(i+1).padStart(2,'0')+'.json'});
const EMPRESA_AUTOCOMPLETE_MANIFEST=EMPRESA_AUTOCOMPLETE_BASE+'relaciones-acuerdo-mision-v67.json';
let empresasAutocomplete=[];
let empresasAutocompleteCarga=null;
let empresasAutocompleteResultados=[];
let empresasAutocompleteActivo=-1;

function empresaNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/&/g,' Y ').replace(/\bSOCIEDAD\s+POR\s+ACCIONES\s+SIMPLIFICADA\b/g,' SAS ').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function empresaCompact(v){return empresaNorm(v).replace(/\s+/g,'')}
function empresaValida(v){var n=empresaNorm(v);return !!n&&!['NO REFIERE','ERROR REVISAR','PENDIENTE'].includes(n)&&!/^[0-9]+$/.test(n)}
function distanciaEmpresa(a,b){
  a=String(a||'');b=String(b||'');if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
  var prev=Array.from({length:b.length+1},function(_,i){return i});
  for(var i=1;i<=a.length;i++){var cur=[i];for(var j=1;j<=b.length;j++){var c=a[i-1]===b[j-1]?0:1;cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+c)}prev=cur}return prev[b.length];
}
function construirEmpresasAutocomplete(relaciones,manifest){
  /* Una sola sugerencia por Acuerdo Comercial. Las Empresas en Misión son alias de búsqueda del acuerdo. */
  var mapa=new Map();
  function asegurar(principal){
    principal=String(principal||'').trim().replace(/\s+/g,' ');if(!empresaValida(principal))return null;
    var k=empresaNorm(principal),x=mapa.get(k);if(!x){x={valor:principal,aliases:[],misiones:[]};mapa.set(k,x)}return x;
  }
  function alias(principal,valor,esMision){
    var x=asegurar(principal);valor=String(valor||'').trim().replace(/\s+/g,' ');if(!x||!empresaValida(valor))return;
    if(empresaNorm(valor)!==empresaNorm(x.valor)&&!x.aliases.includes(valor))x.aliases.push(valor);
    if(esMision&&empresaNorm(valor)!==empresaNorm(x.valor)&&!x.misiones.includes(valor))x.misiones.push(valor);
  }
  (relaciones||[]).forEach(function(r){
    if(!Array.isArray(r)||r.length<2)return;var principal=String(r[0]||'').trim(),mision=String(r[1]||'').trim();
    asegurar(principal);alias(principal,mision,true);
  });
  Object.entries((manifest&&manifest.shortNames)||{}).forEach(function(p){asegurar(p[0]);alias(p[0],p[1],false)});
  Object.entries((manifest&&manifest.specialAliases)||{}).forEach(function(p){var a=p[0],x=p[1]||{},pr=String(x.principal||'').trim(),mi=String(x.mision||'').trim();if(!pr)return;asegurar(pr);alias(pr,a,false);if(empresaValida(mi))alias(pr,mi,true)});
  return Array.from(mapa.values()).map(function(x){
    x.valorNorm=empresaNorm(x.valor);x.valorCompact=empresaCompact(x.valor);
    x.aliasData=x.aliases.map(function(a){return{valor:a,norm:empresaNorm(a),compact:empresaCompact(a),esMision:x.misiones.includes(a)}});
    return x;
  });
}
function leerEmpresasAutocompleteCache(){try{var x=JSON.parse(localStorage.getItem(EMPRESA_AUTOCOMPLETE_CACHE)||'null');return x&&Array.isArray(x.items)?x:null}catch(_){return null}}
function hidratarEmpresasAutocomplete(items){return (items||[]).map(function(x){x.aliases=x.aliases||[];x.misiones=x.misiones||[];x.valorNorm=empresaNorm(x.valor);x.valorCompact=empresaCompact(x.valor);x.aliasData=x.aliases.map(function(a){return{valor:a,norm:empresaNorm(a),compact:empresaCompact(a),esMision:x.misiones.includes(a)}});return x})}
function guardarEmpresasAutocompleteCache(items){try{localStorage.setItem(EMPRESA_AUTOCOMPLETE_CACHE,JSON.stringify({fecha:Date.now(),items:items.map(function(x){return{valor:x.valor,aliases:x.aliases,misiones:x.misiones}})}))}catch(_){}}
async function cargarEmpresasAutocomplete(){
  if(empresasAutocompleteCarga)return empresasAutocompleteCarga;
  var cache=leerEmpresasAutocompleteCache();
  if(!empresasAutocomplete.length&&cache)empresasAutocomplete=hidratarEmpresasAutocomplete(cache.items);
  if(cache&&Date.now()-Number(cache.fecha||0)<EMPRESA_AUTOCOMPLETE_TTL)return empresasAutocomplete;
  empresasAutocompleteCarga=(async function(){
    try{
      var rs=await Promise.all(EMPRESA_AUTOCOMPLETE_PARTES.concat([EMPRESA_AUTOCOMPLETE_MANIFEST]).map(function(url){return fetch(url,{cache:'force-cache',credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}));
      var manifest=rs.pop(),rel=[];rs.forEach(function(p){if(p&&Array.isArray(p.relaciones))rel=rel.concat(p.relaciones)});
      var nuevo=construirEmpresasAutocomplete(rel,manifest);if(nuevo.length){empresasAutocomplete=nuevo;guardarEmpresasAutocompleteCache(nuevo)}
    }catch(e){console.warn('[Empresas] Catálogo no disponible; se mantiene escritura libre.',e)}
    empresasAutocompleteCarga=null;return empresasAutocomplete;
  })();
  return empresasAutocompleteCarga;
}
function puntuarTextoEmpresa(candidatoNorm,candidatoCompact,consultaNorm,consultaCompact){
  if(!candidatoCompact||!consultaCompact)return 0;
  var s=0;
  if(candidatoCompact===consultaCompact)s=5000;
  else if(candidatoCompact.startsWith(consultaCompact))s=4200-Math.min(350,candidatoCompact.length-consultaCompact.length);
  else if(candidatoCompact.includes(consultaCompact))s=3450-Math.min(450,candidatoCompact.indexOf(consultaCompact)*10);
  var qt=consultaNorm.split(' ').filter(Boolean),ct=candidatoNorm.split(' ').filter(Boolean);
  if(qt.length){var hit=qt.filter(function(t){return ct.some(function(u){return u.startsWith(t)||t.startsWith(u)})}).length;if(hit)s=Math.max(s,1700+Math.round(1150*hit/qt.length))}
  if(consultaCompact.length>=4){
    var tramo=candidatoCompact.slice(0,Math.max(consultaCompact.length,Math.min(candidatoCompact.length,consultaCompact.length+4)));
    var d=distanciaEmpresa(consultaCompact,tramo),sim=1-d/Math.max(consultaCompact.length,tramo.length||1);
    s=Math.max(s,Math.round(2300*Math.max(0,sim)));
  }
  return s;
}
function puntajeEmpresaAutocomplete(item,consulta){
  var q=empresaNorm(consulta),qc=empresaCompact(consulta);if(!qc)return{score:0,match:null};
  var mejor={score:puntuarTextoEmpresa(item.valorNorm,item.valorCompact,q,qc),match:null};
  item.aliasData.forEach(function(a){var s=puntuarTextoEmpresa(a.norm,a.compact,q,qc);if(s>mejor.score)mejor={score:s,match:a}});
  return mejor;
}
function buscarEmpresasAutocomplete(q){
  if(empresaNorm(q).length<2)return[];
  var lista=empresasAutocomplete.map(function(x){var p=puntajeEmpresaAutocomplete(x,q);return{x:x,s:p.score,match:p.match}})
    .filter(function(z){return z.s>=900})
    .sort(function(a,b){return b.s-a.s||a.x.valor.localeCompare(b.x.valor,'es',{sensitivity:'base'})});
  if(!lista.length)return[];
  var top=lista[0].s,segundo=lista[1]?lista[1].s:0;
  /* Si hay una coincidencia clara, no ensuciar la lista con opciones lejanas. */
  if(top>=4000&&(segundo===0||top-segundo>=300))lista=lista.slice(0,1);
  else{
    var corte=top>=3300?Math.max(1700,top-500):Math.max(1100,Math.round(top*.78));
    lista=lista.filter(function(z){return z.s>=corte}).slice(0,5);
  }
  return lista.map(function(z){return{valor:z.x.valor,match:z.match,score:z.s}});
}
function cerrarEmpresasAutocomplete(){var b=document.getElementById('sugerenciasEmpresa'),i=document.getElementById('nombreEmpresaOrigen');if(!b||!i)return;b.classList.add('oculto');b.innerHTML='';i.setAttribute('aria-expanded','false');empresasAutocompleteResultados=[];empresasAutocompleteActivo=-1}
function elegirEmpresaAutocomplete(x){var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;i.value=x.valor;i.dataset.sugerenciaEmpresa='1';cerrarEmpresasAutocomplete();i.focus()}
function pintarEmpresasAutocomplete(items,mensaje){
  var b=document.getElementById('sugerenciasEmpresa'),i=document.getElementById('nombreEmpresaOrigen');if(!b||!i)return;b.innerHTML='';empresasAutocompleteResultados=items||[];empresasAutocompleteActivo=-1;
  if(mensaje){var e=document.createElement('div');e.className='sugerencias-empresa-estado';e.textContent=mensaje;b.appendChild(e)}
  empresasAutocompleteResultados.forEach(function(x){
    var bt=document.createElement('button');bt.type='button';bt.className='sugerencia-empresa';bt.setAttribute('role','option');
    var nm=document.createElement('span');nm.className='sugerencia-empresa-nombre';nm.textContent=x.valor;bt.appendChild(nm);
    var meta=document.createElement('span');meta.className='sugerencia-empresa-meta';var tipo=document.createElement('span');tipo.className='sugerencia-empresa-tipo';tipo.textContent='Acuerdo comercial';meta.appendChild(tipo);
    if(x.match&&x.match.esMision)meta.appendChild(document.createTextNode('Coincide con empresa en misión: '+x.match.valor));
    else if(x.match)meta.appendChild(document.createTextNode('Coincide también con: '+x.match.valor));
    else meta.appendChild(document.createTextNode('Nombre registrado en acuerdos comerciales'));
    bt.appendChild(meta);bt.addEventListener('pointerdown',function(ev){ev.preventDefault();elegirEmpresaAutocomplete(x)});b.appendChild(bt);
  });
  if(!mensaje&&!empresasAutocompleteResultados.length){var l=document.createElement('div');l.className='sugerencias-empresa-estado';l.textContent='No encontramos una coincidencia clara. Puede continuar con este nombre como empresa nueva.';b.appendChild(l)}
  b.classList.remove('oculto');i.setAttribute('aria-expanded','true');
}
async function actualizarEmpresasAutocomplete(){var i=document.getElementById('nombreEmpresaOrigen');if(!i)return;var q=i.value.trim();delete i.dataset.sugerenciaEmpresa;if(empresaNorm(q).length<2){cerrarEmpresasAutocomplete();return}if(!empresasAutocomplete.length){pintarEmpresasAutocomplete([],'Buscando coincidencias…');await cargarEmpresasAutocomplete();if(i.value.trim()!==q)return}pintarEmpresasAutocomplete(buscarEmpresasAutocomplete(q))}
(function(){
  var i=document.getElementById('nombreEmpresaOrigen');if(!i)return;var t=null;
  i.addEventListener('focus',function(){cargarEmpresasAutocomplete();if(i.value.trim().length>=2)actualizarEmpresasAutocomplete()});
  i.addEventListener('input',function(){clearTimeout(t);t=setTimeout(actualizarEmpresasAutocomplete,70)});
  i.addEventListener('keydown',function(e){var b=document.getElementById('sugerenciasEmpresa');if(!b||b.classList.contains('oculto')||!empresasAutocompleteResultados.length){if(e.key==='Escape')cerrarEmpresasAutocomplete();return}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();empresasAutocompleteActivo+=e.key==='ArrowDown'?1:-1;if(empresasAutocompleteActivo<0)empresasAutocompleteActivo=empresasAutocompleteResultados.length-1;if(empresasAutocompleteActivo>=empresasAutocompleteResultados.length)empresasAutocompleteActivo=0;b.querySelectorAll('.sugerencia-empresa').forEach(function(x,n){x.classList.toggle('activa',n===empresasAutocompleteActivo);if(n===empresasAutocompleteActivo)x.scrollIntoView({block:'nearest'})})}else if(e.key==='Enter'&&empresasAutocompleteActivo>=0){e.preventDefault();elegirEmpresaAutocomplete(empresasAutocompleteResultados[empresasAutocompleteActivo])}else if(e.key==='Escape'){e.preventDefault();cerrarEmpresasAutocomplete()}});
  i.addEventListener('blur',function(){setTimeout(cerrarEmpresasAutocomplete,120)});
  var btn=document.getElementById('btnOrigenEmpresa');if(btn)btn.addEventListener('click',cargarEmpresasAutocomplete);
})();
`;

const scriptEnd=html.lastIndexOf('</script>');
if(scriptEnd<0)throw new Error('No se encontró </script>.');
html=html.slice(0,scriptEnd)+js+'\n'+html.slice(scriptEnd);

if(!html.includes('AUTOCOMPLETE_EMPRESAS_V3')||!html.includes('Una sola sugerencia por Acuerdo Comercial')||!html.includes('Coincide con empresa en misión'))throw new Error('Autocomplete empresas v3 incompleto.');
fs.writeFileSync(appPath,html,'utf8');
console.log('[Brigadas] Autocomplete empresas v3 habilitado: una sugerencia por Acuerdo Comercial, Empresas en Misión como alias y entrada libre.');
