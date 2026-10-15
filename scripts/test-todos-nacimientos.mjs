import {chromium} from '../../biofile-render-endpoint/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {BiofileClient} from '../../biofile-render-endpoint/src/biofile.js';
import {resolverNacimiento,claveCiudad} from '../../biofile-render-endpoint/src/nacimiento-selector.js';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const catalogo=JSON.parse(html.match(/const MUNICIPIOS_POR_DEPARTAMENTO = (\{[^\n]+\});/)[1]);
const fuente=await fs.readFile(new URL('../../biofile-render-endpoint/src/lugares-nacimiento.js',import.meta.url),'utf8');
const paises=Object.keys(vm.runInNewContext('('+fuente.match(/const CAPITAL_PAIS = (\{[\s\S]*?\n\});/)[1]+')'));
const opciones=Object.entries(catalogo).flatMap(([dep,municipios])=>municipios.map(m=>`${m} (${dep}, COLOMBIA)`));
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const name=new URL(route.request().url()).pathname.slice(1)||'index.html';
  if(!route.request().url().startsWith('https://brigada.test/')) return route.abort();
  try{return route.fulfill({body:await fs.readFile(new URL('../'+name,import.meta.url)),contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html':'image/png'});}catch{return route.abort();}
 });
 await page.goto('https://brigada.test/');
 const generados=await page.evaluate(()=>{
  tipoPaisNacimiento.value='COLOMBIA';cambiarTipoPais();const salida=[];
  for(const dep of Object.keys(MUNICIPIOS_POR_DEPARTAMENTO)) {
   departamentoNacimiento.value=dep;cargarMunicipios();
   for(const municipio of MUNICIPIOS_POR_DEPARTAMENTO[dep]) {
    municipioNacimiento.value=municipio;
    if(!actualizarLugarNacimientoFinal()) throw Error(dep+' / '+municipio);
    salida.push(document.getElementById('ciudadNacimientoFinal').value);
   }
  } return salida;
 });
 assert.deepEqual(generados,opciones);
 for(const solicitado of generados) assert.equal(resolverNacimiento(opciones,solicitado),solicitado);
 const extranjeros=await page.evaluate(()=>{
  const paises=[...tipoPaisNacimiento.options].map(op=>op.value).filter(p=>p&&p!=='COLOMBIA');
  return paises.map(pais=>{
   tipoPaisNacimiento.value=pais;cambiarTipoPais();
   document.getElementById('ciudadNacimientoOtro').value='Ciudad de prueba';
   actualizarLugarNacimientoFinal();return document.getElementById('ciudadNacimientoFinal').value;
  });
 });
 for(const solicitado of extranjeros) assert.equal(resolverNacimiento([solicitado,'OTRA CIUDAD (OTRO PAIS)'],solicitado),solicitado);
 console.log(`PASS formulario y resolución: ${opciones.length} lugares colombianos en ${Object.keys(catalogo).length} departamentos/distrito y ${extranjeros.length} países/territorios extranjeros del selector construido`);
 assert.deepEqual(errors,[]);
 // Probar el selector productivo con DOM y código oculto, sin servicio externo.
 // Se omiten solo las pausas/animación de escritura para recorrer el catálogo completo.
 await page.unroute('**/*');
 await page.setContent('<input id="TxtCiudadNacimiento"><input id="HdfCiudadNacimiento" type="hidden"><ul id="sugerencias"></ul>');
 const robotPage=new Proxy(page,{get(target,key){if(key==='waitForTimeout')return async()=>{};if(key==='locator')return selector=>{const loc=target.locator(selector);return new Proxy(loc,{get(t,k){if(k==='click')return ()=>t.click({force:true});const v=t[k];return typeof v==='function'?v.bind(t):v;}});};const v=target[key];return typeof v==='function'?v.bind(target):v;}});
 const client=new BiofileClient({page:robotPage,config:{},logger:null});
 const input=page.locator('#TxtCiudadNacimiento');
 const consultas=[];
 const locator=new Proxy(input,{get(target,key){if(key==='pressSequentially')return value=>{consultas.push(value);return target.fill(value);};const v=target[key];return typeof v==='function'?v.bind(target):v;}});
 let total=0;
 for(const solicitado of [...opciones,...extranjeros]) {
  await page.evaluate(({solicitado,total})=>{
   const ul=document.getElementById('sugerencias');ul.replaceChildren();
   for(const texto of ['OTRA CIUDAD (OTRO PAIS)',solicitado]) {
    const li=document.createElement('li');li.className='ItemLista';li.textContent=texto;
    li.onclick=()=>{document.getElementById('TxtCiudadNacimiento').value=texto;document.getElementById('HdfCiudadNacimiento').value=String(total+1);};ul.append(li);
   }
  },{solicitado,total});
  await client.seleccionarCiudadNacimiento(locator,solicitado);
  assert.equal(await input.inputValue(),solicitado);
  assert.equal(await page.locator('#HdfCiudadNacimiento').inputValue(),String(total+1));total++;
 }
 console.log(`PASS selector productivo en Chromium: ${total} selecciones con código oculto confirmado`);
 for(const [pedido,incorrecto] of [['SAN PEDRO (ANTIOQUIA, COLOMBIA)','SAN PEDRO DE URABA (ANTIOQUIA, COLOMBIA)'],['SAN PEDRO (SANTANDER, COLOMBIA)','SAN PEDRO (NORTE DE SANTANDER, COLOMBIA)'],['MARACAIBO (VENEZUELA)','CARACAS (VENEZUELA)']]) {
  await page.evaluate(texto=>{document.getElementById('sugerencias').innerHTML='';const li=document.createElement('li');li.textContent=texto;document.getElementById('sugerencias').append(li);},incorrecto);
  await assert.rejects(client.seleccionarCiudadNacimiento(locator,pedido,'Ciudad de Nacimiento',false),/No se encontró una opción única/);
 }
 console.log('PASS selector: rechaza prefijos, departamento incorrecto y sustitución por capital');
 const respaldo='BOGOTÁ (BOGOTÁ D.C., COLOMBIA)';
 await page.evaluate(texto=>{const ul=document.getElementById('sugerencias');ul.replaceChildren();const li=document.createElement('li');li.textContent=texto;li.onclick=()=>{document.getElementById('TxtCiudadNacimiento').value=texto;document.getElementById('HdfCiudadNacimiento').value='11001';};ul.append(li);},respaldo);
 await client.seleccionarCiudadNacimiento(locator,'CIUDAD NO ENCONTRADA (VENEZUELA)');
 assert.equal(await input.inputValue(),respaldo);
 assert.equal(client.ajustesNacimiento[0].original,'CIUDAD NO ENCONTRADA (VENEZUELA)');
 assert.equal(client.ajustesNacimiento[0].aplicado,respaldo);
 assert.equal(consultas.at(-1),'bogota');
 assert.ok(client.ajustesNacimiento[0].motivo);
 console.log('PASS respaldo solicitado: selecciona Bogotá y registra original, aplicado y motivo');
} finally {await browser.close();}
