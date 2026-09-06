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
const filtroTipo = document.getElementById('filtro-tipo');
const filtroSector = document.getElementById('filtro-sector');

let todosLosReportes = []; // aquí guardamos los reportes ya traídos de Firestore

const coordenadasSector = {
  'kennedy-central': [4.6318, -74.1469],
  'patio-bonito': [4.6270, -74.1670],
  'corabastos': [4.6195, -74.1750],
  'timiza': [4.6120, -74.1520],
  'castilla': [4.6395, -74.1270],
  'tintal': [4.6460, -74.1830],
  'britalia': [4.6280, -74.1370],
  'otro': [4.6318, -74.1469]
};

function renderReportes() {
  listaReportes.innerHTML = '';

  if (capaMarcadores) {
    capaMarcadores.clearLayers(); // borra los pines anteriores antes de dibujar los nuevos
  }

  const tipoSeleccionado = filtroTipo.value;
  const sectorSeleccionado = filtroSector.value;

  const reportesFiltrados = todosLosReportes.filter(function (r) {
    const coincideTipo = tipoSeleccionado === 'todos' || r.tipoReporte === tipoSeleccionado;
    const coincideSector = sectorSeleccionado === 'todos' || r.sector === sectorSeleccionado;
    return coincideTipo && coincideSector;
  });

  if (reportesFiltrados.length === 0) {
    listaReportes.innerHTML = '<p>No hay reportes que coincidan con este filtro.</p>';
    return;
  }

  reportesFiltrados.forEach(function (r) {
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

    // ===== Agregar el pin correspondiente en el mapa =====
    if (capaMarcadores && coordenadasSector[r.sector]) {
      const marcador = L.marker(coordenadasSector[r.sector]).bindPopup(`
        <strong>${r.nombreMascota || 'Sin nombre'}</strong><br>
        ${r.tipoReporte === 'perdida' ? '🔴 Perdida' : '🟢 Encontrada'}<br>
        ${r.sector}
      `);
      capaMarcadores.addLayer(marcador);
    }
  });
}

if (listaReportes) {
  db.collection('reportes')
    .orderBy('fechaCreacion', 'desc')
    .get()
    .then(function (snapshot) {
      todosLosReportes = snapshot.docs.map(function (doc) {
        return doc.data();
      });
      renderReportes();
    })
    .catch(function (error) {
      console.error('Error al cargar los reportes: ', error);
      listaReportes.innerHTML = '<p>Hubo un error al cargar los reportes.</p>';
    });

  filtroTipo.addEventListener('change', renderReportes);
  filtroSector.addEventListener('change', renderReportes);
}

const contenedorMapa = document.getElementById('mapa');
let mapa;
let capaMarcadores;

if (contenedorMapa) {
  mapa = L.map('mapa').setView([4.6318, -74.1469], 13); // Kennedy, Bogotá

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapa);

  capaMarcadores = L.layerGroup().addTo(mapa);
}

const formAdopcion = document.getElementById('form-adopcion');

if (formAdopcion) {
  formAdopcion.addEventListener('submit', function (e) {
    e.preventDefault();

    const nuevaAdopcion = {
      nombreMascota: document.getElementById('nombre-mascota-adopcion').value,
      tipoMascota: document.getElementById('tipo-mascota-adopcion').value,
      edad: document.getElementById('edad-mascota').value,
      sector: document.getElementById('sector-adopcion').value,
      descripcion: document.getElementById('descripcion-adopcion').value,
      nombreContacto: document.getElementById('nombre-contacto-adopcion').value,
      telefono: document.getElementById('telefono-adopcion').value,
      fechaCreacion: new Date().toISOString()
    };

    db.collection('adopciones').add(nuevaAdopcion)
      .then(function () {
        alert('¡Mascota publicada en adopción con éxito!');
        formAdopcion.reset();
      })
      .catch(function (error) {
        console.error('Error al guardar la publicación: ', error);
        alert('Hubo un error al publicar. Intenta de nuevo.');
      });
  });
}