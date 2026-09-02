const formReporte = document.getElementById('form-reporte');

if (formReporte) {
  formReporte.addEventListener('submit', function (e) {
    e.preventDefault(); 

    const nuevoReporte = {
      tipoReporte: formReporte['tipo-reporte'].value, 
      tipoMascota: document.getElementById('tipo-mascota').value,
      nombreMascota: document.getElementById('nombre-mascota').value,
      raza: document.getElementById('raza').value,
      sector: document.getElementById('sector').value,
      fecha: document.getElementById('fecha').value,
      descripcion: document.getElementById('descripcion').value,
      nombreContacto: document.getElementById('nombre-contacto').value,
      telefono: document.getElementById('telefono').value,
      fechaCreacion: new Date().toISOString()
    };

    db.collection('reportes').add(nuevoReporte)
      .then(function () {
        alert('¡Reporte enviado con éxito! Gracias por ayudar a reencontrar mascotas en Kennedy.');
        formReporte.reset();
      })
      .catch(function (error) {
        console.error('Error al guardar el reporte: ', error);
        alert('Hubo un error al enviar tu reporte. Intenta de nuevo.');
      });
  });
}

// ===== Mostrar reportes desde Firestore (listado.html) =====

const listaReportes = document.getElementById('lista-reportes');

if (listaReportes) {
  db.collection('reportes')
    .orderBy('fechaCreacion', 'desc')
    .get()
    .then(function (snapshot) {

      if (snapshot.empty) {
        listaReportes.innerHTML = '<p>Todavía no hay reportes registrados.</p>';
        return;
      }

      snapshot.forEach(function (doc) {
        const r = doc.data();

        const tarjeta = document.createElement('article');
        tarjeta.classList.add('reporte-card');

        tarjeta.innerHTML = `
          <span class="etiqueta ${r.tipoReporte}">${r.tipoReporte === 'perdida' ? 'Perdida' : 'Encontrada'}</span>
          <img src="https://placehold.co/300x200?text=Foto+mascota" alt="Foto de mascota">
          <h2>${r.nombreMascota || 'Sin nombre'}</h2>
          <p><strong>Sector:</strong> ${r.sector}</p>
          <p><strong>Fecha:</strong> ${r.fecha}</p>
          <p>${r.raza} — ${r.descripcion || ''}</p>
          <p><strong>Contacto:</strong> ${r.nombreContacto} — ${r.telefono}</p>
        `;

        listaReportes.appendChild(tarjeta);
      });

    })
    .catch(function (error) {
      console.error('Error al cargar los reportes: ', error);
      listaReportes.innerHTML = '<p>Hubo un error al cargar los reportes.</p>';
    });
}