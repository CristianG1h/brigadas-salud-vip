import fs from 'node:fs';

const archivo=new URL('../index.html',import.meta.url);
let html=fs.readFileSync(archivo,'utf8');
if(!html.includes('/* PAISES_NACIMIENTO_V5 */')){
  const selectInicio='<select id="tipoPaisNacimiento" required>';
  const a=html.indexOf(selectInicio);
  const b=html.indexOf('</select>',a);
  if(a<0||b<0)throw new Error('No se encontró el selector País de nacimiento.');
  html=html.slice(0,a)+`<select id="tipoPaisNacimiento" required>\n        <option value="">Toque para elegir</option>\n      </select>`+html.slice(b+'</select>'.length);

  const bloqueViejo=`<div id="nacimientoExterior" class="bloque-condicional oculto">
        <label for="paisNacimientoOtro">¿En qué país nació? <span class="req">*</span></label>
        <input type="text" id="paisNacimientoOtro" class="solo-letras" placeholder="Ejemplo: Venezuela" maxlength="60">
        <label for="ciudadNacimientoOtro">Ciudad o pueblo donde nació <span class="req">*</span></label>
        <input type="text" id="ciudadNacimientoOtro" class="solo-letras" placeholder="Ejemplo: Caracas" maxlength="80">
      </div>`;
  const bloqueNuevo=`<div id="nacimientoExterior" class="bloque-condicional oculto">
        <label for="paisNacimientoOtro">País seleccionado</label>
        <input type="text" id="paisNacimientoOtro" readonly tabindex="-1">
        <label for="ciudadNacimientoOtro">Ciudad o pueblo donde nació <span class="req">*</span></label>
        <input type="text" id="ciudadNacimientoOtro" class="solo-letras" placeholder="Ejemplo: Caracas" maxlength="80">
        <div class="ayuda">Si BIOFILE no encuentra esta ciudad, el robot intentará automáticamente la capital del país.</div>
      </div>`;
  if(!html.includes(bloqueViejo))throw new Error('No se encontró bloque de nacimiento exterior.');
  html=html.replace(bloqueViejo,bloqueNuevo);

  const inicio=html.indexOf('/* ===================== PAÍS, DEPARTAMENTO Y MUNICIPIO ===================== */');
  const fin=html.indexOf('/* ===================== CORREO ===================== */',inicio);
  if(inicio<0||fin<0)throw new Error('No se encontró lógica de país/departamento/municipio.');
  const nuevo=`/* ===================== PAÍS, DEPARTAMENTO Y MUNICIPIO ===================== */
/* PAISES_NACIMIENTO_V5 */
const tipoPaisNacimiento=document.getElementById('tipoPaisNacimiento');
const bloqueColombia=document.getElementById('nacimientoColombia');
const bloqueExterior=document.getElementById('nacimientoExterior');
const departamentoNacimiento=document.getElementById('departamentoNacimiento');
const municipioNacimiento=document.getElementById('municipioNacimiento');
const paisNacimientoOtro=document.getElementById('paisNacimientoOtro');
const ciudadNacimientoOtro=document.getElementById('ciudadNacimientoOtro');

const CODIGOS_PAISES='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const PRIORIDAD_PAISES=['CO','VE','EC','PE','BR','PA','US','ES','MX','AR','CL','BO','DO','CR','GT','HN','NI','SV','CU'];
function poblarPaisesNacimiento(){
  let nombres;
  try{nombres=new Intl.DisplayNames(['es'],{type:'region'});}catch{nombres=null;}
  const fallback={CO:'Colombia',VE:'Venezuela',EC:'Ecuador',PE:'Perú',BR:'Brasil',PA:'Panamá',US:'Estados Unidos',ES:'España',MX:'México',AR:'Argentina',CL:'Chile',BO:'Bolivia',DO:'República Dominicana',CR:'Costa Rica'};
  const items=CODIGOS_PAISES.map(c=>({codigo:c,nombre:(nombres?.of(c)||fallback[c]||c)})).filter(x=>x.nombre&&x.nombre!==x.codigo);
  items.sort((a,b)=>{
    const ia=PRIORIDAD_PAISES.indexOf(a.codigo),ib=PRIORIDAD_PAISES.indexOf(b.codigo);
    if(ia>=0||ib>=0)return (ia<0?999:ia)-(ib<0?999:ib);
    return a.nombre.localeCompare(b.nombre,'es',{sensitivity:'base'});
  });
  const vistos=new Set();
  items.forEach(({codigo,nombre})=>{const valor=nombre.toLocaleUpperCase('es-CO');if(vistos.has(valor))return;vistos.add(valor);const op=document.createElement('option');op.value=valor;op.textContent=nombre;op.dataset.codigo=codigo;tipoPaisNacimiento.appendChild(op);});
}
poblarPaisesNacimiento();
Object.keys(MUNICIPIOS_POR_DEPARTAMENTO).forEach(dep=>{const op=document.createElement('option');op.value=dep;op.textContent=dep;departamentoNacimiento.appendChild(op);});
function cambiarTipoPais(){
  const pais=tipoPaisNacimiento.value;
  const esCO=pais==='COLOMBIA';const esExterior=Boolean(pais&&!esCO);
  bloqueColombia.classList.toggle('oculto',!esCO);bloqueExterior.classList.toggle('oculto',!esExterior);
  departamentoNacimiento.disabled=!esCO;municipioNacimiento.disabled=!esCO||!departamentoNacimiento.value;
  paisNacimientoOtro.value=esExterior?pais:'';paisNacimientoOtro.disabled=!esExterior;ciudadNacimientoOtro.disabled=!esExterior;
  if(esCO){ciudadNacimientoOtro.value='';paisNacimientoOtro.value='';}
  actualizarLugarNacimientoFinal();
}
function cargarMunicipios(){
  const dep=departamentoNacimiento.value;municipioNacimiento.innerHTML='<option value="">Toque para elegir</option>';
  (MUNICIPIOS_POR_DEPARTAMENTO[dep]||[]).forEach(m=>{const op=document.createElement('option');op.value=m;op.textContent=m;municipioNacimiento.appendChild(op);});
  municipioNacimiento.disabled=!dep;actualizarLugarNacimientoFinal();
}
function actualizarLugarNacimientoFinal(){
  let final='';const pais=tipoPaisNacimiento.value;
  if(pais==='COLOMBIA'&&departamentoNacimiento.value&&municipioNacimiento.value)final=\`${'${municipioNacimiento.value}'} (${'${departamentoNacimiento.value}'}, COLOMBIA)\`;
  if(pais&&pais!=='COLOMBIA'){const ciudad=ciudadNacimientoOtro.value.trim();if(ciudad)final=\`${'${ciudad.toUpperCase()}'} (${'${pais}'})\`;}
  document.getElementById('ciudadNacimientoFinal').value=final;
  const vista=document.getElementById('vistaLugarNacimiento');vista.textContent=final?\`Se guardará como: ${'${final}'}\`:'';vista.classList.toggle('oculto',!final);
  return Boolean(final);
}
tipoPaisNacimiento.addEventListener('change',cambiarTipoPais);departamentoNacimiento.addEventListener('change',cargarMunicipios);municipioNacimiento.addEventListener('change',actualizarLugarNacimientoFinal);ciudadNacimientoOtro.addEventListener('input',actualizarLugarNacimientoFinal);

`;
  html=html.slice(0,inicio)+nuevo+html.slice(fin);
  fs.writeFileSync(archivo,html,'utf8');
}
console.log('[Brigadas] Lista completa de países y nacimiento exterior v5 habilitados.');
