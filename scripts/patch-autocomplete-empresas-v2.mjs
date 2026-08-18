import fs from 'node:fs';

const appPath=new URL('../index.html',import.meta.url);
let html=fs.readFileSync(appPath,'utf8');

if(html.includes('/* AUTOCOMPLETE_EMPRESAS_V2 */')){
  console.log('[Brigadas] Autocomplete empresas v2 ya instalado.');
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
/* AUTOCOMPLETE_EMPRESAS_V2 */
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
/* AUTOCOMPLETE_EMPRESAS_V2 */
const EMPRESA_AUTOCOMPLETE_VERSION='20260818-v2';
const EMPRESA_AUTOCOMPLETE_CACHE='vip_empresa_autocomplete_'+EMPRESA_AUTOCOMPLETE_VERSION;
const EMPRESA_AUTOCOMPLETE_TTL=24*60*60*1000;
const EMPRESA_AUTOCOMPLETE_BASE='https://raw.githubusercontent.com/CristianG1h/panel-gestion-biofile-vip/main/data/empresas-mision-v27/';
const EMPRESA_AUTOCOMPLETE_PARTES=Array.from({length:6},function(_,i){return EMPRESA_AUTOCOMPLETE_BASE+'relaciones-v67/parte-'+String(i+1).padStart(2,'0')+'.json'});
const EMPRESA_AUTOCOMPLETE_MANIFEST=EMPRESA_AUTOCOMPLETE_BASE+'relaciones-acuerdo-mision-v67.json';
let empresasAutocomplete=[];
let empresasAutocompleteCarga=null;
let empresasAutocompleteResultados=[];
let empresasAutocompleteActivo=-1;

function empresaNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/&/g,' Y ').replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function empresaCompact(v){return empresaNorm(v).replace(/\s+/g,'')}
function distanciaEmpresa(a,b){
  a=String(a||'');b=String(b||'');if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
  var prev=Array.from({length:b.length+1},function(_,i){return i});
  for(var i=1;i<=a.length;i++){var cur=[i];for(var j=1;j<=b.length;j++){var c=a[i-1]===b[j-1]?0:1;cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+c)}prev=cur}return prev[b.length];
}
function construirEmpresasAutocomplete(relaciones,manifest){
  var mapa=new Map();
  function add(valor,tipo,principal,alias){
    valor=String(valor||'').trim().replace(/\s+/g,' ');principal=String(principal||'').trim();
    if(!valor||['NO REFIERE','ERROR REVISAR','PENDIENTE'].includes(empresaNorm(valor)))return;
    var k=empresaNorm(valor),x=mapa.get(k);
    if(!x){x={valor:valor,tipo:tipo,principales:[],aliases:[]};mapa.set(k,x)}
    if(tipo==='Acuerdo comercial')x.tipo='Acuerdo comercial';
    if(principal&&!x.principales.includes(principal))x.principales.push(principal);
    if(alias&&!x.aliases.includes(alias))x.aliases.push(alias);
  }
  (relaciones||[]).forEach(function(r){if(!Array.isArray(r)||r.length<2)return;add(r[0],'Acuerdo comercial',r[0]);add(r[1],'Empresa en misión',r[0])});
  Object.entries((manifest&&manifest.shortNames)||{}).forEach(function(p){add(p[0],'Acuerdo comercial',p[0],p[1])});
  Object.entries((manifest&&manifest.specialAliases)||{}).forEach(function(p){var a=p[0],x=p[1]||{},pr=x.principal||'',mi=x.mision||'';add(pr,'Acuerdo comercial',pr,a);if(mi&&empresaNorm(mi)!=='NO REFIERE')add(mi,'Empresa en misión',pr,a)});
  return Array.from(mapa.values()).map(function(x){var texto=[x.valor].concat(x.principales,x.aliases).join(' ');x.norm=empresaNorm(texto);x.compact=empresaCompact(texto);return x});
}
function leerEmpresasAutocompleteCache(){try{var x=JSON.parse(localStorage.getItem(EMPRESA_AUTOCOMPLETE_CACHE)||'null');return x&&Array.isArray(x.items)?x:null}catch(_){return null}}
function hidratarEmpresasAutocomplete(items){return (items||[]).map(function(x){var texto=[x.valor].concat(x.principales||[],x.aliases||[]).join(' ');return Object.assign(x,{norm:empresaNorm(texto),compact:empresaCompact(texto)})})}
function guardarEmpresasAutocompleteCache(items){try{localStorage.setItem(EMPRESA_AUTOCOMPLETE_CACHE,JSON.stringify({fecha:Date.now(),items:items.map(function(x){return{valor:x.valor,tipo:x.tipo,principales:x.principales,aliases:x.aliases}})}))}catch(_){}}
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
function puntajeEmpresaAutocomplete(item,consulta){
  var q=empresaNorm(consulta),qc=empresaCompact(consulta),v=empresaNorm(item.valor),vc=empresaCompact(item.valor);if(!qc)return 0;
  var s=0;if(vc===qc)s=3000;else if(vc.startsWith(qc))s=2400-Math.min(300,vc.length-qc.length);else if(vc.includes(qc))s=2000-Math.min(300,vc.indexOf(qc)*8);else if(item.compact.startsWith(qc))s=1850;else if(item.compact.includes(qc))s=1650;
  var qt=q.split(' ').filter(Boolean),it=item.norm.split(' ').filter(Boolean);if(qt.length){var hit=qt.filter(function(t){return it.some(function(u){return u.startsWith(t)||t.startsWith(u)})}).length;s=Math.max(s,900+Math.round(600*hit/qt.length))}
  if(qc.length>=4){var base=vc.length>qc.length+12?item.compact:vc;var d=distanciaEmpresa(qc,base.slice(0,Math.max(qc.length,Math.min(base.length,qc.length+4))));var sim=1-d/Math.max(qc.length,Math.min(base.length,qc.length+4));s=Math.max(s,Math.round(1200*Math.max(0,sim)))}
  if(item.tipo==='Acuerdo comercial')s+=10;return s;
}
function buscarEmpresasAutocomplete(q){if(empresaNorm(q).length<2)return[];return empresasAutocomplete.map(function(x){return{x:x,s:puntajeEmpresaAutocomplete(x,q)}}).filter(function(x){return x.s>=450}).sort(function(a,b){return b.s-a.s||a.x.valor.localeCompare(b.x.valor,'es',{sensitivity:'base'})}).slice(0,6).map(function(x){return x.x})}
function cerrarEmpresasAutocomplete(){var b=document.getElementById('sugerenciasEmpresa'),i=document.getElementById('nombreEmpresaOrigen');if(!b||!i)return;b.classList.add('oculto');b.innerHTML='';i.setAttribute('aria-expanded','false');empresasAutocompleteResultados=[];empresasAutocompleteActivo=-1}
function elegirEmpresaAutocomplete(x){var i=document.getElementById('nombreEmpresaOrigen');if(!i||!x)return;i.value=x.valor;i.dataset.sugerenciaEmpresa='1';cerrarEmpresasAutocomplete();i.focus()}
function pintarEmpresasAutocomplete(items,mensaje){
  var b=document.getElementById('sugerenciasEmpresa'),i=document.getElementById('nombreEmpresaOrigen');if(!b||!i)return;b.innerHTML='';empresasAutocompleteResultados=items||[];empresasAutocompleteActivo=-1;
  if(mensaje){var e=document.createElement('div');e.className='sugerencias-empresa-estado';e.textContent=mensaje;b.appendChild(e)}
  empresasAutocompleteResultados.forEach(function(x,n){var bt=document.createElement('button');bt.type='button';bt.className='sugerencia-empresa';bt.setAttribute('role','option');var nm=document.createElement('span');nm.className='sugerencia-empresa-nombre';nm.textContent=x.valor;bt.appendChild(nm);var meta=document.createElement('span');meta.className='sugerencia-empresa-meta';var tipo=document.createElement('span');tipo.className='sugerencia-empresa-tipo';tipo.textContent=x.tipo;meta.appendChild(tipo);if(x.tipo==='Empresa en misión'&&x.principales.length===1)meta.appendChild(document.createTextNode('Acuerdo: '+x.principales[0]));else if(x.tipo==='Empresa en misión'&&x.principales.length>1)meta.appendChild(document.createTextNode('Relacionado con varios acuerdos comerciales'));else meta.appendChild(document.createTextNode('Nombre registrado en acuerdos comerciales'));bt.appendChild(meta);bt.addEventListener('pointerdown',function(ev){ev.preventDefault();elegirEmpresaAutocomplete(x)});b.appendChild(bt)});
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

if(!html.includes('AUTOCOMPLETE_EMPRESAS_V2')||!html.includes('sugerenciasEmpresa')||!html.includes('EMPRESA_AUTOCOMPLETE_PARTES'))throw new Error('Autocomplete empresas v2 incompleto.');
fs.writeFileSync(appPath,html,'utf8');
console.log('[Brigadas] Autocomplete empresas v2 habilitado: acuerdos + empresas en misión + entrada libre.');
