import fs from 'node:fs';

const appPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(appPath, 'utf8');

if (html.includes('/* AUTOCOMPLETE_EMPRESAS_V6_SELF_SIMILAR */')) {
  console.log('[Brigadas] Autocomplete empresas v6 ya instalado.');
  process.exit(0);
}
if (!html.includes('/* AUTOCOMPLETE_EMPRESAS_V5_MISION_CANONICA */')) {
  throw new Error('Primero debe ejecutarse patch-autocomplete-empresas-v5.mjs.');
}

const viejo = `function misionCanonicaParaAcuerdo(acuerdo){
  var objetivo=empresaNorm(acuerdo),item=(empresasAutocomplete||[]).find(function(e){return empresaNorm(e.valor)===objetivo});
  if(!item)return'';
  var misiones=[...new Set((item.misiones||[]).map(function(m){return String(m||'').trim()}).filter(Boolean))];
  var self=misiones.find(function(m){return empresaNorm(m)===objetivo});
  if(self)return self;
  if(misiones.length===1)return misiones[0];
  return'';
}`;

const nuevo = `/* AUTOCOMPLETE_EMPRESAS_V6_SELF_SIMILAR */
function empresaComparable(v){return empresaNorm(v).replace(/\\b(SAS|SA|LTDA|EU)\\b/g,' ').replace(/\\s+/g,'')}
function distanciaEmpresaV6(a,b){
  a=String(a||'');b=String(b||'');if(a===b)return 0;if(!a)return b.length;if(!b)return a.length;
  var prev=Array.from({length:b.length+1},function(_,i){return i});
  for(var i=1;i<=a.length;i++){var cur=[i];for(var j=1;j<=b.length;j++){var c=a[i-1]===b[j-1]?0:1;cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+c)}prev=cur}return prev[b.length];
}
function mismoNombreEmpresaV6(a,b){
  var x=empresaComparable(a),y=empresaComparable(b);if(!x||!y)return false;if(x===y)return true;
  var max=Math.max(x.length,y.length);if(max<8)return false;var limite=Math.max(1,Math.min(2,Math.floor(max*.08)));
  return distanciaEmpresaV6(x,y)<=limite;
}
function misionCanonicaParaAcuerdo(acuerdo){
  var objetivo=empresaNorm(acuerdo),item=(empresasAutocomplete||[]).find(function(e){return empresaNorm(e.valor)===objetivo});
  if(!item)return'';
  var misiones=[...new Set((item.misiones||[]).map(function(m){return String(m||'').trim()}).filter(Boolean))];
  var self=misiones.find(function(m){return empresaNorm(m)===objetivo});
  if(self)return self;
  if(misiones.length===1){
    // Si el Excel trae una única misión prácticamente idéntica al acuerdo pero con un typo,
    // mostramos y guardamos el nombre canónico del Acuerdo en ambos campos.
    if(mismoNombreEmpresaV6(acuerdo,misiones[0]))return String(acuerdo||'').trim();
    return misiones[0];
  }
  return'';
}`;

if (!html.includes(viejo)) throw new Error('No se encontró misionCanonicaParaAcuerdo de v5.');
html = html.replace(viejo, nuevo);

if (!html.includes('AUTOCOMPLETE_EMPRESAS_V6_SELF_SIMILAR') || !html.includes('mismoNombreEmpresaV6')) {
  throw new Error('Autocomplete empresas v6 quedó incompleto.');
}

fs.writeFileSync(appPath, html, 'utf8');
console.log('[Brigadas] v6: misiones únicas casi idénticas al acuerdo usan el nombre canónico del Acuerdo en ambos campos.');
