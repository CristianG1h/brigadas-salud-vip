import { chromium } from '../../biofile-render-endpoint/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { aplicarDatosRegistroBiofile } from '../../biofile-render-endpoint/src/aplicar-datos-registro.js';
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext();
 const errors=[]; let requests=0; let respuestaRegistro='error';
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='brigada.test') {
   const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
   try { return await route.fulfill({body:await fs.readFile(new URL(`../${file}`,import.meta.url)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':'image/png'}); }
   catch {return route.fulfill({status:404,body:''});}
  }
  if(url.hostname==='gis.transmilenio.gov.co') {
   requests++;
   const santa=url.searchParams.get('where').includes("'03'");
   await new Promise(r=>setTimeout(r,santa?250:10));
   return route.fulfill({json:{features:[{attributes:{nombre_barrio_planeacion:santa?'LAS NIEVES':'CHICO'}}]}});
  }
  if(url.hostname==='script.google.com' && route.request().method()==='POST') {
    return respuestaRegistro==='error'
      ? route.fulfill({json:{ok:false,error:'Error simulado del receptor'}})
      : route.fulfill({json:{ok:true}});
  }
  return route.abort();
 });
 const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.goto('https://brigada.test/');
 await page.evaluate(async()=>{
   localidadBogota.value='SANTA FE';const a=cargarBarriosBogota();
   localidadBogota.value='CHAPINERO';const b=cargarBarriosBogota();await Promise.all([a,b]);
 });
 assert.match(await page.locator('#barrioBogota').textContent(),/CHICO/);
 assert.doesNotMatch(await page.locator('#barrioBogota').textContent(),/LAS NIEVES/);
 const before=requests;await page.evaluate(()=>cargarBarriosBogota());assert.equal(requests,before);
 console.log('PASS barrios: respuesta antigua descartada y caché reutilizada');
 await page.evaluate(async()=>{
  btnCitaBrigada.click();btnOrigenEmpresa.click();
  document.getElementById('nombreEmpresaOrigen').value='EMPRESA DE PRUEBA';
  document.getElementById('nombreEmpresaOrigen').dataset.acuerdoComercial='ACUERDO PRUEBA';
  document.getElementById('nombreEmpresaOrigen').dataset.empresaMision='MISION PRUEBA';
  tipoDocumento.value='CC';numeroDocumento.value='123456789';
  tipoPaisNacimiento.value='COLOMBIA';departamentoNacimiento.value='ANTIOQUIA';cargarMunicipios();municipioNacimiento.value='MEDELLIN';
  selAnio.value='1990';selMes.value='02';actualizarDiasNacimiento();selDia.value='28';
  localidadBogota.value='SANTA FE';await cargarBarriosBogota();barrioBogota.value='LAS NIEVES';
  pasoActual=8;mostrarPaso(8);ajustarCanvasFirma();
  ctxFirma.fillStyle='#123456';ctxFirma.fillRect(10,10,60,25);firmaHecha=true;
 });
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=100;c.height=100;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,100,100);return c.toDataURL().split(',')[1];});
 await page.locator('#adjuntarFoto').setInputFiles({name:'rostro-prueba.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>fotoTomada);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 const signature=await page.evaluate(()=>firmaCanvas.toDataURL());
 await page.reload();await page.waitForFunction(()=>fotoTomada&&firmaHecha);
 assert.equal(await page.locator('#nombreEmpresaOrigen').inputValue(),'EMPRESA DE PRUEBA');
 assert.equal(await page.locator('#nombreEmpresaOrigen').getAttribute('data-acuerdo-comercial'),'ACUERDO PRUEBA');
 assert.equal(await page.locator('#nombreEmpresaOrigen').getAttribute('data-empresa-mision'),'MISION PRUEBA');
 assert.equal(await page.locator('#municipioNacimiento').inputValue(),'MEDELLIN');
 assert.equal(await page.locator('#fnDia').inputValue(),'28');
 assert.equal(await page.locator('#barrioBogota').inputValue(),'LAS NIEVES');
 assert.deepEqual(await page.evaluate(()=>Array.from(ctxFirma.getImageData(30,30,1,1).data)),[18,52,86,255]);
 assert.equal(await page.evaluate(()=>tipoCita),'brigada');
 assert.equal(await page.evaluate(()=>pasoActual),8);
 console.log('PASS recarga: campos dependientes, barrio, paso, foto y firma intactos');
 // Cámara sin dispositivo/permisos: adjuntar sigue disponible.
 await page.evaluate(async()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{throw Error('Permiso denegado');}},configurable:true});await abrirCamara();});
 assert.equal(await page.locator('#adjuntarFoto').isVisible(),true);
 await page.locator('#adjuntarFoto').setInputFiles({name:'foto.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(()=>fotoTomada);
 console.log('PASS cámara denegada: permite adjuntar foto');
 await page.evaluate(()=>enviarFormulario());
 await page.waitForFunction(()=>!document.getElementById('btnEnviar').disabled);
 assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('vip-brigada-borrador-v1')),null);
 assert.equal(await page.locator('#pantallaFinal').isVisible(),false);
 console.log('PASS error del receptor: no muestra éxito ni borra borrador');
 respuestaRegistro='ok';
 await page.evaluate(()=>enviarFormulario());
 await page.waitForFunction(()=>!document.getElementById('pantallaFinal').classList.contains('oculto'));
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('vip-brigada-borrador-v1')),null);
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('vip-brigada-borrador-v1')),null);
 console.log('PASS envío confirmado: borra borrador sin recrearlo al salir');
 await page.reload();
 await page.evaluate(()=>{window.dispatchEvent(new Event('brigada:enviado'));sessionStorage.setItem('vip-brigada-borrador-v1',JSON.stringify({version:1,fecha:Date.now()-13*3600000,valores:{numeroDocumento:'111222333'}}));});
 await page.reload();
 assert.equal(await page.locator('#numeroDocumento').inputValue(),'');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('vip-brigada-borrador-v1')),null);
 console.log('PASS borrador vencido: no recupera datos de otro paciente');
 assert.deepEqual(errors,[]);
 const html=await fs.readFile(new URL('../../biofile-render-endpoint/tests/fixtures/localidades-biofile.html',import.meta.url),'utf8');
 const select=html.match(/<select[^>]*id="CbLocalidad"[\s\S]*?<\/select>/)[0];
 await page.setContent(select);
 await aplicarDatosRegistroBiofile({page,config:{selectors:{localidad:'#CbLocalidad'}},registro:{localidad:'SANTA FE'},defaults:{}});
 assert.equal(await page.locator('#CbLocalidad').inputValue(),'3');
 console.log('PASS HTML real adjunto: SANTA FE selecciona SANTAFÉ (3) en Chromium');
} finally {await browser.close();}

