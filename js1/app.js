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

const listaAdopcion = document.getElementById('lista-adopcion');

if (listaAdopcion) {
  db.collection('adopciones')
    .orderBy('fechaCreacion', 'desc')
    .get()
    .then(function (snapshot) {

      if (snapshot.empty) {
        listaAdopcion.innerHTML = '<p>Todavía no hay mascotas publicadas en adopción.</p>';
        return;
      }

      snapshot.forEach(function (doc) {
        const a = doc.data();

        const tarjeta = document.createElement('article');
        tarjeta.classList.add('reporte-card');

        tarjeta.innerHTML = `
          <span class="etiqueta encontrada">En adopción</span>
          <img src="https://placehold.co/300x200?text=Foto+mascota" alt="Foto de mascota">
          <h2>${a.nombreMascota || 'Sin nombre'}</h2>
          <p><strong>Tipo:</strong> ${a.tipoMascota} — ${a.edad}</p>
          <p><strong>Sector:</strong> ${a.sector}</p>
          <p>${a.descripcion || ''}</p>
          <p><strong>Contacto:</strong> ${a.nombreContacto} — ${a.telefono}</p>
        `;

        listaAdopcion.appendChild(tarjeta);
      });

    })
    .catch(function (error) {
      console.error('Error al cargar las adopciones: ', error);
      listaAdopcion.innerHTML = '<p>Hubo un error al cargar las publicaciones.</p>';
    });
}


const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const btnLogout = document.getElementById('btn-logout');

if (formLogin) {
  formLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value;
    const password = document.getElementById('login-password').value;
    const mensaje = document.getElementById('login-mensaje');

    firebase.auth().signInWithEmailAndPassword(correo, password)
      .then(function () {
        mensaje.textContent = '¡Bienvenido/a! Sesión iniciada correctamente.';
        mensaje.style.color = 'green';
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      })
      .catch(function () {
        mensaje.textContent = 'Correo o contraseña incorrectos.';
        mensaje.style.color = 'red';
      });
  });
}

if (formRegistro) {
  formRegistro.addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('registro-nombre').value;
    const correo = document.getElementById('registro-correo').value;
    const password = document.getElementById('registro-password').value;
    const documento = document.getElementById('registro-documento').value;
    const telefono = document.getElementById('registro-telefono').value;
    const pinSeguridad = document.getElementById('registro-pin').value;
    const mensaje = document.getElementById('registro-mensaje');

    let cuentaCreada = null;

    firebase.auth().createUserWithEmailAndPassword(correo, password)
      .then(function (cred) {
        cuentaCreada = cred.user;

        const batch = db.batch();

        batch.set(db.collection('usuarios').doc(cred.user.uid), {
          nombre, correo, documento, telefono, pinSeguridad,
          rol: 'usuario',
          fechaCreacion: new Date().toISOString()
        });

        batch.set(db.collection('documentos-registrados').doc(documento + '_usuario'), {
        uid: cred.user.uid, documento, rol: 'usuario'
        });

        return batch.commit();
      })
      .then(function () {
        mensaje.textContent = '¡Cuenta creada con éxito!';
        mensaje.style.color = 'green';
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      })
      .catch(function (error) {
        // Si la cuenta de acceso ya se creó pero el perfil falló
        // (ej. documento duplicado), la eliminamos para no dejar
        // una cuenta "fantasma" sin datos.
        if (cuentaCreada) {
          cuentaCreada.delete().catch(() => {});
        }
        if (error.code === 'permission-denied') {
          mensaje.textContent = 'Ese número de documento ya está registrado con otra cuenta.';
        } else {
          mensaje.textContent = 'Error al crear la cuenta: ' + error.message;
        }
        mensaje.style.color = 'red';
      });
  });
}
// ===== Solicitud pública de fundación (solicitud-fundacion.html) =====

const formSolicitudFundacion = document.getElementById('form-solicitud-fundacion');

if (formSolicitudFundacion) {
  formSolicitudFundacion.addEventListener('submit', function (e) {
    e.preventDefault();

    const solicitud = {
      nombreFundacion: document.getElementById('sf-nombre-fundacion').value,
      nit: document.getElementById('sf-nit').value,
      representante: document.getElementById('sf-representante').value,
      documento: document.getElementById('sf-documento').value,
      telefono: document.getElementById('sf-telefono').value,
      correo: document.getElementById('sf-correo').value,
      pinSeguridad: document.getElementById('sf-pin').value,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString()
    };

    const mensaje = document.getElementById('sf-mensaje');

    db.collection('solicitudes-fundacion').add(solicitud)
      .then(function () {
        mensaje.textContent = '¡Solicitud enviada! Un moderador la revisará pronto.';
        mensaje.style.color = 'green';
        formSolicitudFundacion.reset();
      })
      .catch(function (error) {
        mensaje.textContent = 'Error al enviar la solicitud: ' + error.message;
        mensaje.style.color = 'red';
      });
  });
}
// ===== Panel de Moderador (moderador.html) =====

const mensajeAcceso = document.getElementById('mod-mensaje-acceso');
const listaSolicitudesMod = document.getElementById('mod-lista-solicitudes');

if (listaSolicitudesMod) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      mensajeAcceso.textContent = 'Debes iniciar sesión para ver esta página.';
      return;
    }
    db.collection('usuarios').doc(user.uid).get().then(function (doc) {
      if (!doc.exists || doc.data().rol !== 'moderador') {
        mensajeAcceso.textContent = 'No tienes permiso para ver esta página.';
        return;
      }
      mensajeAcceso.textContent = '';
      cargarSolicitudesPendientes(user);
    });
  });
}

function cargarSolicitudesPendientes(usuarioModerador) {
  db.collection('solicitudes-fundacion').where('estado', '==', 'pendiente').get()
    .then(function (snapshot) {
      listaSolicitudesMod.innerHTML = '';
      if (snapshot.empty) {
        listaSolicitudesMod.innerHTML = '<p>No hay solicitudes pendientes.</p>';
        return;
      }
      snapshot.forEach(function (doc) {
        const s = doc.data();
        const tarjeta = document.createElement('article');
        tarjeta.classList.add('reporte-card');
        tarjeta.innerHTML = `
          <h2>${s.nombreFundacion}</h2>
          <p><strong>NIT:</strong> ${s.nit}</p>
          <p><strong>Representante:</strong> ${s.representante}</p>
          <p><strong>Documento:</strong> ${s.documento}</p>
          <p><strong>Correo:</strong> ${s.correo}</p>
          <p><strong>Teléfono:</strong> ${s.telefono}</p>
          <button class="btn-aprobar">Aprobar</button>
          <button class="btn-rechazar">Rechazar</button>
        `;
        tarjeta.querySelector('.btn-aprobar').addEventListener('click', () => procesarSolicitud(usuarioModerador, doc.id, 'aprobar'));
        tarjeta.querySelector('.btn-rechazar').addEventListener('click', () => procesarSolicitud(usuarioModerador, doc.id, 'rechazar'));
        listaSolicitudesMod.appendChild(tarjeta);
      });
    });
}

function procesarSolicitud(usuarioModerador, solicitudId, accion) {
  usuarioModerador.getIdToken().then(function (idToken) {
    fetch('https://pata-conecta-backend.vercel.app/api/aprobar-fundacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
      body: JSON.stringify({ solicitudId, accion })
    })
    .then(r => r.json())
    .then(function (data) {
      alert(data.mensaje || data.error);
      cargarSolicitudesPendientes(usuarioModerador);
    });
  });
}
// ===== Menú dinámico según sesión (todas las páginas) =====
firebase.auth().onAuthStateChanged(function (user) {
  const navAuthLink = document.getElementById('nav-auth-link');
  if (!navAuthLink) return;

  if (user) {
    navAuthLink.textContent = 'Mi cuenta';
    navAuthLink.setAttribute('href', 'cuenta.html');
  } else {
    navAuthLink.textContent = 'Iniciar sesión';
    navAuthLink.setAttribute('href', 'login.html');
  }
});
// ===== Mi Cuenta (cuenta.html) =====

const cuentaNombreEl = document.getElementById('cuenta-nombre');

if (cuentaNombreEl) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    db.collection('usuarios').doc(user.uid).get().then(function (doc) {
      const perfil = doc.data();
      cuentaNombreEl.textContent = perfil.nombre;
      document.getElementById('cuenta-correo').textContent = perfil.correo;
      document.getElementById('cuenta-rol').textContent = perfil.rol;
      document.getElementById('cuenta-telefono-input').value = perfil.telefono || '';
      document.getElementById('cuenta-pin-input').value = perfil.pinSeguridad || '';
      if (perfil.rol === 'fundacion') {
      document.querySelector('main').insertAdjacentHTML('afterbegin', '<p><a href="panel-fundacion.html">Ir a mi panel de fundación →</a></p>');
      } else if (perfil.rol === 'empleado') {
      document.querySelector('main').insertAdjacentHTML('afterbegin', '<p><a href="panel-empleado.html">Ir a mi panel de empleado →</a></p>');
      } else if (perfil.rol === 'moderador') {
      document.querySelector('main').insertAdjacentHTML('afterbegin', '<p><a href="moderador.html">Ir a mi panel de moderador →</a></p>');
      }
    });

    document.getElementById('form-cuenta-telefono').addEventListener('submit', function (e) {
      e.preventDefault();
      const nuevoTelefono = document.getElementById('cuenta-telefono-input').value;
      const msg = document.getElementById('cuenta-telefono-mensaje');
      db.collection('usuarios').doc(user.uid).update({ telefono: nuevoTelefono })
        .then(() => { msg.textContent = 'Teléfono actualizado.'; msg.style.color = 'green'; })
        .catch((err) => { msg.textContent = 'Error: ' + err.message; msg.style.color = 'red'; });
    });

    document.getElementById('form-cuenta-pin').addEventListener('submit', function (e) {
      e.preventDefault();
      const nuevoPin = document.getElementById('cuenta-pin-input').value;
      const msg = document.getElementById('cuenta-pin-mensaje');
      db.collection('usuarios').doc(user.uid).update({ pinSeguridad: nuevoPin })
        .then(() => { msg.textContent = 'PIN actualizado.'; msg.style.color = 'green'; })
        .catch((err) => { msg.textContent = 'Error: ' + err.message; msg.style.color = 'red'; });
    });

    document.getElementById('form-cuenta-password').addEventListener('submit', function (e) {
      e.preventDefault();
      const actual = document.getElementById('cuenta-password-actual').value;
      const nueva = document.getElementById('cuenta-password-nueva').value;
      const msg = document.getElementById('cuenta-password-mensaje');
      const credencial = firebase.auth.EmailAuthProvider.credential(user.email, actual);

      user.reauthenticateWithCredential(credencial)
        .then(() => user.updatePassword(nueva))
        .then(() => { msg.textContent = 'Contraseña actualizada.'; msg.style.color = 'green'; })
        .catch((err) => { msg.textContent = 'Error: contraseña actual incorrecta u otro problema.'; msg.style.color = 'red'; });
    });

    document.getElementById('form-cuenta-correo').addEventListener('submit', function (e) {
      e.preventDefault();
      const actual = document.getElementById('cuenta-correo-password').value;
      const nuevoCorreo = document.getElementById('cuenta-correo-nuevo').value;
      const msg = document.getElementById('cuenta-correo-mensaje');
      const credencial = firebase.auth.EmailAuthProvider.credential(user.email, actual);

      user.reauthenticateWithCredential(credencial)
        .then(() => user.updateEmail(nuevoCorreo))
        .then(() => db.collection('usuarios').doc(user.uid).update({ correo: nuevoCorreo }))
        .then(() => {
          msg.textContent = 'Correo actualizado. Vuelve a iniciar sesión con el correo nuevo.';
          msg.style.color = 'green';
        })
        .catch((err) => { msg.textContent = 'Error: contraseña incorrecta o correo inválido.'; msg.style.color = 'red'; });
    });
  });
}
if (btnLogout) {
  btnLogout.addEventListener('click', function () {
    firebase.auth().signOut().then(function () {
      alert('Sesión cerrada.');
      window.location.href = 'index.html';
    });
  });
}
// ===== Recuperar contraseña (recuperar-password.html) =====

const formRecuperarPassword = document.getElementById('form-recuperar-password');

if (formRecuperarPassword) {
  formRecuperarPassword.addEventListener('submit', function (e) {
    e.preventDefault();

    const datos = {
      correo: document.getElementById('rec-correo').value,
      documento: document.getElementById('rec-documento').value,
      telefono: document.getElementById('rec-telefono').value,
      pinSeguridad: document.getElementById('rec-pin').value,
      nuevaPassword: document.getElementById('rec-password-nueva').value
    };
    const mensaje = document.getElementById('rec-mensaje');

    fetch('https://pata-conecta-backend.vercel.app/api/recuperar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(function (data) {
      if (data.mensaje) {
        mensaje.textContent = data.mensaje + ' Ya puedes iniciar sesión.';
        mensaje.style.color = 'green';
        formRecuperarPassword.reset();
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      } else {
        mensaje.textContent = data.error;
        mensaje.style.color = 'red';
      }
    })
    .catch(function () {
      mensaje.textContent = 'Error de conexión. Intenta de nuevo.';
      mensaje.style.color = 'red';
    });
  });
}
// ===== Panel de Fundación (panel-fundacion.html) =====

const pfMensajeAcceso = document.getElementById('pf-mensaje-acceso');

if (pfMensajeAcceso) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      pfMensajeAcceso.textContent = 'Debes iniciar sesión para ver esta página.';
      return;
    }
    db.collection('usuarios').doc(user.uid).get().then(function (doc) {
      if (!doc.exists || doc.data().rol !== 'fundacion') {
        pfMensajeAcceso.textContent = 'No tienes permiso para ver esta página.';
        return;
      }
      const perfil = doc.data();
      pfMensajeAcceso.textContent = '';
      document.getElementById('pf-info').style.display = 'block';
      document.getElementById('pf-form-container').style.display = 'block';
      document.getElementById('pf-nombre-fundacion').textContent = perfil.nombreFundacion;
      document.getElementById('pf-nit').textContent = perfil.nit;

      cargarEmpleados(user);

      document.getElementById('form-crear-empleado').addEventListener('submit', function (e) {
        e.preventDefault();
        const datos = {
          nombre: document.getElementById('emp-nombre').value,
          correo: document.getElementById('emp-correo').value,
          documento: document.getElementById('emp-documento').value,
          telefono: document.getElementById('emp-telefono').value,
          pinSeguridad: document.getElementById('emp-pin').value
        };
        const mensaje = document.getElementById('emp-mensaje');

        user.getIdToken().then(function (idToken) {
          fetch('https://pata-conecta-backend.vercel.app/api/crear-empleado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + idToken },
            body: JSON.stringify(datos)
          })
          .then(r => r.json())
          .then(function (data) {
            mensaje.textContent = data.mensaje || data.error;
            mensaje.style.color = data.mensaje ? 'green' : 'red';
            if (data.mensaje) {
              document.getElementById('form-crear-empleado').reset();
              cargarEmpleados(user);
            }
          });
        });
      });
    });
  });
}

function cargarEmpleados(usuarioFundacion) {
  db.collection('usuarios')
      .where('fundacionId', '==', usuarioFundacion.uid)
      .where('rol', '==', 'empleado')
      .get()
    .then(function (snapshot) {
      const lista = document.getElementById('pf-lista-empleados');
      lista.innerHTML = '<h2 style="width:100%;">Empleados registrados</h2>';

      const nombresEmpleados = {};
      snapshot.forEach(function (doc) {
        nombresEmpleados[doc.id] = doc.data().nombre;
      });

      if (snapshot.empty) {
        lista.innerHTML += '<p>Todavía no has creado empleados.</p>';
      } else {
        snapshot.forEach(function (doc) {
          const e = doc.data();
          const tarjeta = document.createElement('article');
          tarjeta.classList.add('reporte-card');
          tarjeta.innerHTML = `
            <h2>${e.nombre}</h2>
            <p><strong>Correo:</strong> ${e.correo}</p>
            <p><strong>Teléfono:</strong> ${e.telefono}</p>
          `;
          lista.appendChild(tarjeta);
        });
      }

      cargarAdopcionesFundacion(usuarioFundacion.uid, nombresEmpleados);
    });
}

function cargarAdopcionesFundacion(fundacionId, nombresEmpleados) {
  db.collection('adopciones').where('fundacionId', '==', fundacionId).get()
    .then(function (snapshot) {
      const lista = document.getElementById('pf-lista-adopciones');
      lista.innerHTML = `<h2 style="width:100%;">Mascotas publicadas (${snapshot.size})</h2>`;
      if (snapshot.empty) {
        lista.innerHTML += '<p>Todavía no se ha publicado ninguna mascota.</p>';
        return;
      }
      snapshot.forEach(function (doc) {
        const a = doc.data();
        const tarjeta = document.createElement('article');
        tarjeta.classList.add('reporte-card');
        tarjeta.innerHTML = `
          <span class="etiqueta ${a.estado === 'adoptada' ? 'perdida' : 'encontrada'}">${etiquetaEstado(a.estado)}</span>
          <h2>${a.nombreMascota}</h2>
          <p><strong>Publicado por:</strong> ${nombresEmpleados[a.empleadoId] || 'Desconocido'}</p>
          <p><strong>Sector:</strong> ${a.sector}</p>
        `;
        lista.appendChild(tarjeta);
      });
    });
}
// ===== Panel de Empleado (panel-empleado.html) =====

const peMensajeAcceso = document.getElementById('pe-mensaje-acceso');

if (peMensajeAcceso) {
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      peMensajeAcceso.textContent = 'Debes iniciar sesión para ver esta página.';
      return;
    }
    db.collection('usuarios').doc(user.uid).get().then(function (doc) {
      if (!doc.exists || doc.data().rol !== 'empleado') {
        peMensajeAcceso.textContent = 'No tienes permiso para ver esta página.';
        return;
      }
      const perfil = doc.data();
      peMensajeAcceso.textContent = '';
      document.getElementById('pe-form-container').style.display = 'block';

      cargarAdopcionesEmpleado(user, perfil.fundacionId);

      document.getElementById('form-publicar-adopcion').addEventListener('submit', function (e) {
        e.preventDefault();
        const nuevaAdopcion = {
          nombreMascota: document.getElementById('pe-nombre-mascota').value,
          tipoMascota: document.getElementById('pe-tipo-mascota').value,
          edad: document.getElementById('pe-edad').value,
          sector: document.getElementById('pe-sector').value,
          descripcion: document.getElementById('pe-descripcion').value,
          nombreContacto: document.getElementById('pe-contacto-nombre').value,
          telefono: document.getElementById('pe-contacto-telefono').value,
          fundacionId: perfil.fundacionId,
          empleadoId: user.uid,
          estado: 'publicada',
          fechaCreacion: new Date().toISOString()
        };
        const msg = document.getElementById('pe-mensaje-publicar');

        db.collection('adopciones').add(nuevaAdopcion)
          .then(function () {
            msg.textContent = '¡Mascota publicada con éxito!';
            msg.style.color = 'green';
            document.getElementById('form-publicar-adopcion').reset();
            cargarAdopcionesEmpleado(user, perfil.fundacionId);
          })
          .catch(function (error) {
            msg.textContent = 'Error: ' + error.message;
            msg.style.color = 'red';
          });
      });
    });
  });
}

function etiquetaEstado(estado) {
  if (estado === 'publicada') return 'Publicada';
  if (estado === 'en_proceso') return 'En proceso de adopción';
  if (estado === 'adoptada') return 'Adoptada';
  return estado;
}

function cargarAdopcionesEmpleado(user, fundacionId) {
  db.collection('adopciones').where('fundacionId', '==', fundacionId).get()
    .then(function (snapshot) {
      const lista = document.getElementById('pe-lista-adopciones');
      lista.innerHTML = '<h2 style="width:100%;">Mascotas publicadas por tu fundación</h2>';
      if (snapshot.empty) {
        lista.innerHTML += '<p>Todavía no hay publicaciones.</p>';
        return;
      }
      snapshot.forEach(function (doc) {
        const a = doc.data();
        const tarjeta = document.createElement('article');
        tarjeta.classList.add('reporte-card');
        tarjeta.innerHTML = `
          <span class="etiqueta ${a.estado === 'adoptada' ? 'perdida' : 'encontrada'}">${etiquetaEstado(a.estado)}</span>
          <h2>${a.nombreMascota}</h2>
          <p><strong>Tipo:</strong> ${a.tipoMascota} — ${a.edad}</p>
          <p><strong>Sector:</strong> ${a.sector}</p>
          <p>${a.descripcion || ''}</p>
        `;
        if (a.estado !== 'adoptada') {
          const btnAvanzar = document.createElement('button');
          btnAvanzar.setAttribute('type', 'button');
          btnAvanzar.textContent = a.estado === 'publicada' ? 'Marcar "En proceso"' : 'Marcar "Adoptada"';
          btnAvanzar.addEventListener('click', function () {
            const nuevoEstado = a.estado === 'publicada' ? 'en_proceso' : 'adoptada';
            db.collection('adopciones').doc(doc.id).update({ estado: nuevoEstado })
              .then(() => cargarAdopcionesEmpleado(user, fundacionId));
          });
          tarjeta.appendChild(btnAvanzar);
        }
        lista.appendChild(tarjeta);
      });
    });
}
