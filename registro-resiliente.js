/* Borrador por pestaña: no se comparte entre pacientes ni se envía al servidor. */
(() => {
  const KEY = 'vip-brigada-borrador-v1';
  const TTL = 12 * 60 * 60 * 1000;
  const form = document.getElementById('formBrigada');
  let restaurando = true;
  let terminado = false;
  let timer;
  let firmaPendiente = '';
  const aviso = document.createElement('p');
  aviso.setAttribute('role', 'status');
  aviso.textContent = 'El borrador se conserva al recargar esta pestaña durante 12 horas.';
  const borrar = document.createElement('button');
  borrar.type = 'button';
  borrar.textContent = 'Borrar borrador y empezar de nuevo';
  borrar.className = 'btn btn-gris';
  form.before(aviso, borrar);
  const campos = () => [...form.querySelectorAll('input[id],select[id],textarea[id]')]
    .filter(el => !['file', 'password', 'button', 'submit', 'hidden'].includes(el.type)
      && !el.id.endsWith('-busqueda'));

  function guardar() {
    clearTimeout(timer);
    if(restaurando || terminado) return;
    const valores = Object.fromEntries(campos().map(el => [el.id,
      ['checkbox', 'radio'].includes(el.type) ? el.checked : el.value]));
    try {
      sessionStorage.setItem(KEY, JSON.stringify({version:1, fecha:Date.now(), valores,
        empresa:{...document.getElementById('nombreEmpresaOrigen').dataset},
        paso:pasoActual, tipoCita, origenPaciente, comoSeEntero,
        foto:fotoTomada ? fotoBase64 : '',
        firma:firmaPendiente || (firmaHecha ? firmaCanvas.toDataURL('image/png') : '')}));
      aviso.textContent = 'Borrador guardado en esta pestaña. Se elimina al enviar o después de 12 horas sin cambios.';
    } catch {
      // No dejar un borrador viejo que parezca contener los últimos cambios.
      try { sessionStorage.removeItem(KEY); } catch {}
      aviso.textContent = 'Este navegador no pudo guardar el borrador. No cierre ni recargue la página.';
    }
  }
  function programar() { clearTimeout(timer); timer = setTimeout(guardar, 200); }
  function eliminar() {
    terminado = true;
    clearTimeout(timer);
    try { sessionStorage.removeItem(KEY); } catch {}
  }
  borrar.addEventListener('click', () => {
    if(!confirm('¿Borrar los datos, la foto y la firma de este borrador?')) return;
    eliminar(); location.reload();
  });
  window.addEventListener('brigada:enviado', () => {
    eliminar(); aviso.remove(); borrar.remove();
  });
  for(const evento of ['input','change','click']) form.addEventListener(evento, programar);
  window.addEventListener('brigada:cambio', programar);
  window.addEventListener('pagehide', guardar);
  document.addEventListener('visibilitychange', () => { if(document.hidden) guardar(); });

  function mostrarFoto(data) {
    fotoBase64 = data; fotoTomada = true;
    fotoResultado.src = data; fotoResultado.style.display = 'block';
    detenerCamara(); video.style.display = 'none';
    document.querySelector('.foto-box').classList.remove('camara-activa');
    btnCapturar.classList.add('oculto');
    btnRepetirFoto.classList.remove('oculto');
    document.getElementById('errorFoto').style.display = 'none';
  }
  document.getElementById('adjuntarFoto').addEventListener('change', async event => {
    const file = event.target.files[0];
    if(!file || procesandoCaptura) return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) {
      alert('Seleccione una imagen JPG, PNG o WebP de hasta 10 MB.'); event.target.value=''; return;
    }
    procesandoCaptura = true;
    procesandoFoto.classList.remove('oculto');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      if(!img.naturalWidth || !img.naturalHeight) throw new Error('Imagen vacía');
      const escala = Math.min(1, 1000/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(img.naturalWidth*escala));
      canvas.height = Math.max(1,Math.round(img.naturalHeight*escala));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      mostrarFoto(canvas.toDataURL('image/jpeg',.86));
      guardar();
    } catch { alert('No se pudo leer esta imagen. Seleccione otra foto.'); }
    finally {
      URL.revokeObjectURL(url); event.target.value='';
      procesandoCaptura = false; procesandoFoto.classList.add('oculto');
    }
  });

  // Mantener la firma pendiente hasta que el paso sea visible y el canvas tenga tamaño.
  const ajustarOriginal = ajustarCanvasFirma;
  ajustarCanvasFirma = function() {
    ajustarOriginal();
    if(!canvasFirmaListo || !firmaPendiente) return;
    const data = firmaPendiente;
    const img = new Image();
    img.onload = () => {
      if(firmaPendiente !== data) return;
      ctxFirma.save(); ctxFirma.setTransform(1,0,0,1,0,0);
      ctxFirma.drawImage(img,0,0,firmaCanvas.width,firmaCanvas.height);
      ctxFirma.restore(); firmaPendiente=''; firmaHecha=true;
    };
    img.src = data;
  };
  document.getElementById('btnBorrarFirma').addEventListener('click', () => { firmaPendiente=''; guardar(); });

  async function restaurar() {
    try {
      const d = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if(!d) return;
      if(d.version !== 1 || !Number.isFinite(d.fecha) || Date.now()-d.fecha > TTL || !d.valores) {
        sessionStorage.removeItem(KEY); return;
      }
      form.inert = true;
      const poner = el => {
        if(!Object.hasOwn(d.valores, el.id)) return;
        if(['checkbox','radio'].includes(el.type)) el.checked = d.valores[el.id] === true;
        else el.value = String(d.valores[el.id]);
      };
      // Primero los padres; después reconstruir las opciones de los hijos.
      campos().forEach(poner);
      cambiarTipoPais(); cargarMunicipios(); actualizarDiasNacimiento();
      campos().forEach(poner);
      if(d.tipoCita === 'hoy') btnCitaHoy.click();
      if(d.tipoCita === 'brigada') btnCitaBrigada.click();
      if(d.origenPaciente === 'empresa') btnOrigenEmpresa.click();
      if(d.origenPaciente === 'particular') btnOrigenParticular.click();
      const chip = [...document.querySelectorAll('.chip-opcion')].find(el => el.dataset.valor === d.comoSeEntero);
      chip?.click();
      if(esBogotaResidencia() && localidadBogota.value) {
        await cargarBarriosBogota();
        const barrio = d.valores.barrioBogota;
        if(barrio && ![...barrioBogota.options].some(op => op.value === barrio)) {
          barrioBogota.add(new Option(barrio,barrio));
        }
      }
      campos().forEach(poner);
      cambiarMunicipioResidencia();
      if(d.empresa && typeof d.empresa==='object') {
        const empresa=document.getElementById('nombreEmpresaOrigen');
        for(const clave of ['sugerenciaEmpresa','acuerdoComercial','empresaMision']) {
          if(typeof d.empresa[clave]==='string') empresa.dataset[clave]=d.empresa[clave];
        }
        if(empresa.dataset.acuerdoComercial && typeof mostrarRelacionEmpresaSeleccionada==='function') {
          mostrarRelacionEmpresaSeleccionada(empresa.dataset.acuerdoComercial,empresa.dataset.empresaMision);
        }
      }
      barrioBogota.dispatchEvent(new Event('change'));
      for(const prefijo of ['eps','afp','arl']) document.getElementById(`${prefijo}Opcion`).dispatchEvent(new Event('change'));
      actualizarLugarNacimientoFinal(); actualizarEdadMostrada(); actualizarReglasDocumento();
      form.querySelectorAll('select').forEach(el => selectoresBuscables.get(el)?.refrescar());
      if(/^data:image\/jpeg;base64,/.test(d.foto || '')) mostrarFoto(d.foto);
      if(/^data:image\/png;base64,/.test(d.firma || '')) { firmaPendiente=d.firma; firmaHecha=false; }
      // Restaurar la firma en el paso visible antes de permitir el envío.
      pasoActual = Math.max(1,Math.min(8,Number(d.paso)||1));
      mostrarPaso(pasoActual);
      aviso.textContent = 'Recuperamos su borrador. Puede continuar o borrarlo para registrar otra persona.';
    } catch {
      aviso.textContent = 'No se pudo recuperar el borrador. Revise los datos antes de continuar.';
    } finally { restaurando=false; form.inert=false; }
  }
  restaurar();
})();
