// ===== Menú por perfil — PataConecta =====
// La página de inicio (index.html) solo muestra tres perfiles: Usuario, Moderador y Fundación.
// Este archivo dibuja el menú de cada página según:
//   1. el rol real guardado en Firestore, si hay sesión iniciada (siempre manda el rol);
//   2. el perfil que eligió el visitante en el inicio, si no hay sesión.
// Los colaboradores (rol "empleado") entran por el perfil Fundación.
// Debe cargarse después de firebase-config.js y antes de app.js.

const PataMenu = (function () {
  const CLAVE_PERFIL = 'pc_perfil'; // perfil elegido en el inicio
  const CLAVE_ROL = 'pc_rol';       // último rol conocido (solo para pintar el menú sin parpadeo)

  const PERFILES = ['usuario', 'moderador', 'fundacion'];

  const INICIO_POR_ROL = {
    usuario: 'usuario.html',
    moderador: 'moderador.html',
    fundacion: 'panel-fundacion.html',
    empleado: 'panel-empleado.html'
  };

  // Qué roles pueden entrar por cada perfil del inicio
  const ROLES_POR_PERFIL = {
    usuario: ['usuario'],
    moderador: ['moderador'],
    fundacion: ['fundacion', 'empleado']
  };

  const NOMBRE_ROL = {
    usuario: 'Usuario',
    moderador: 'Moderador',
    fundacion: 'Fundación',
    empleado: 'Colaborador'
  };

  const MENUS = {
    usuario: {
      // Sin sesión no se puede reportar: la opción no aparece
      invitado: [
        ['usuario.html', 'Inicio'],
        ['listado.html', 'Ver reportes'],
        ['adopcion.html', 'Adopción'],
        ['contacto.html', 'Contacto'],
        ['login.html?perfil=usuario', 'Iniciar sesión / Registrarse']
      ],
      sesion: [
        ['usuario.html', 'Inicio'],
        ['reportar.html', 'Reportar mascota'],
        ['listado.html', 'Ver reportes'],
        ['mis-reportes.html', 'Mis reportes'],
        ['adopcion.html', 'Adopción'],
        ['mis-aplicaciones.html', 'Mis aplicaciones'],
        ['contacto.html', 'Contacto'],
        ['cuenta.html', 'Mi cuenta']
      ]
    },
    moderador: {
      invitado: [
        ['login.html?perfil=moderador', 'Iniciar sesión']
      ],
      sesion: [
        ['moderador.html', 'Panel de moderación'],
        ['listado.html', 'Ver reportes'],
        ['adopcion.html', 'Adopciones'],
        ['cuenta.html', 'Mi cuenta']
      ]
    },
    fundacion: {
      invitado: [
        ['login.html?perfil=fundacion', 'Iniciar sesión'],
        ['solicitud-fundacion.html', 'Solicitar registro'],
        ['adopcion.html', 'Ver adopciones']
      ],
      sesion: [
        ['panel-fundacion.html', 'Mi panel'],
        ['adopcion.html', 'Adopciones publicadas'],
        ['cuenta.html', 'Mi cuenta']
      ]
    },
    empleado: {
      sesion: [
        ['panel-empleado.html', 'Mi panel'],
        ['adopcion.html', 'Adopciones publicadas'],
        ['cuenta.html', 'Mi cuenta']
      ]
    }
  };

  // ---------- almacenamiento (puede fallar en modo privado) ----------
  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try {
      if (valor) localStorage.setItem(clave, valor);
      else localStorage.removeItem(clave);
    } catch (e) { /* sin almacenamiento: el menú igual funciona */ }
  }

  // ---------- perfil elegido ----------
  function perfilElegido() {
    // 1. La página misma puede pertenecer a un perfil (data-perfil en <body>)
    const dePagina = document.body.dataset.perfil;
    if (PERFILES.includes(dePagina)) { guardar(CLAVE_PERFIL, dePagina); return dePagina; }

    // 2. login.html?perfil=...
    const deUrl = new URLSearchParams(window.location.search).get('perfil');
    if (PERFILES.includes(deUrl)) { guardar(CLAVE_PERFIL, deUrl); return deUrl; }

    // 3. Lo que eligió antes en el inicio
    const guardado = leer(CLAVE_PERFIL);
    if (PERFILES.includes(guardado)) return guardado;

    return 'usuario';
  }

  function guardarPerfil(perfil) {
    if (PERFILES.includes(perfil)) guardar(CLAVE_PERFIL, perfil);
  }

  function rolValido(rol) {
    return Object.prototype.hasOwnProperty.call(INICIO_POR_ROL, rol) ? rol : null;
  }

  function recordarRol(rol) {
    guardar(CLAVE_ROL, rolValido(rol));
  }

  function rolPermitido(perfil, rol) {
    return (ROLES_POR_PERFIL[perfil] || []).includes(rol);
  }

  function obtenerRol(uid) {
    return db.collection('usuarios').doc(uid).get().then(function (doc) {
      return doc.exists ? rolValido(doc.data().rol) : null;
    });
  }

  function cerrarSesion() {
    return firebase.auth().signOut().then(function () {
      recordarRol(null);
      window.location.href = 'index.html';
    });
  }

  // ---------- dibujo del menú ----------
  let conSesion = false;
  let rolActual = rolValido(leer(CLAVE_ROL)); // pista mientras Firebase responde
  if (rolActual) conSesion = true;

  function paginaActual() {
    const nombre = window.location.pathname.split('/').pop();
    return nombre || 'index.html';
  }

  function crearEnlace(href, texto) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = texto;
    if (href.split('?')[0] === paginaActual()) a.setAttribute('aria-current', 'page');
    li.appendChild(a);
    return li;
  }

  // Elementos de la página que solo se muestran a un rol con sesión.
  // Uso: <a ... data-requiere-rol="usuario" hidden> (empiezan ocultos para no parpadear)
  function aplicarVisibilidadPorRol() {
    const rol = conSesion ? rolActual : null;
    document.querySelectorAll('[data-requiere-rol]').forEach(function (el) {
      el.hidden = el.dataset.requiereRol !== rol;
    });
    document.querySelectorAll('[data-oculto-para-rol]').forEach(function (el) {
      el.hidden = el.dataset.ocultoParaRol === rol;
    });
  }

  function render() {
    aplicarVisibilidadPorRol();
    const header = document.getElementById('menu-principal');
    if (!header) return;

    const esSelector = document.body.dataset.pagina === 'selector';
    const rol = conSesion ? rolActual : null;
    const perfil = perfilElegido();

    header.innerHTML = '';

    // Marca + perfil activo
    const marca = document.createElement('div');
    marca.className = 'marca';
    const logo = document.createElement('a');
    logo.className = 'logo';
    logo.textContent = '🐾 PataConecta';
    logo.href = rol ? INICIO_POR_ROL[rol] : (perfil === 'usuario' ? 'usuario.html' : 'index.html');
    if (esSelector) logo.href = 'index.html';
    marca.appendChild(logo);

    if (!esSelector) {
      const chip = document.createElement('span');
      chip.className = 'perfil-chip';
      chip.textContent = NOMBRE_ROL[rol || perfil];
      chip.title = rol ? 'Sesión iniciada como ' + NOMBRE_ROL[rol] : 'Perfil elegido';
      marca.appendChild(chip);
    }
    header.appendChild(marca);

    // En el selector de perfil solo va el logo
    if (esSelector) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'menu-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'menu-nav');
    toggle.textContent = '☰ Menú';
    toggle.addEventListener('click', function () {
      const abierto = header.classList.toggle('abierto');
      toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    header.appendChild(toggle);

    const nav = document.createElement('nav');
    nav.id = 'menu-nav';
    nav.setAttribute('aria-label', 'Menú principal');
    const ul = document.createElement('ul');

    const items = rol ? MENUS[rol].sesion : MENUS[perfil].invitado;
    items.forEach(function (item) { ul.appendChild(crearEnlace(item[0], item[1])); });

    if (conSesion) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-accion';
      btn.textContent = 'Cerrar sesión';
      btn.addEventListener('click', cerrarSesion);
      li.appendChild(btn);
      ul.appendChild(li);
    } else {
      const cambiar = crearEnlace('index.html', 'Cambiar perfil');
      cambiar.classList.add('nav-secundario');
      ul.appendChild(cambiar);
    }

    nav.appendChild(ul);
    header.appendChild(nav);
  }

  // Elección de perfil en el inicio (tarjetas con data-elegir-perfil)
  document.addEventListener('click', function (e) {
    const opcion = e.target.closest('[data-elegir-perfil]');
    if (opcion) guardarPerfil(opcion.dataset.elegirPerfil);
  });

  render();

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      conSesion = false;
      rolActual = null;
      recordarRol(null);
      render();
      return;
    }

    obtenerRol(user.uid)
      .catch(function () { return null; })
      .then(function (rol) {
        conSesion = true;
        rolActual = rol;
        recordarRol(rol);
        render();

        // Si ya hay sesión y abre el inicio, lo llevamos directo a su página
        if (rol && document.body.dataset.pagina === 'selector') {
          window.location.replace(INICIO_POR_ROL[rol]);
        }
      });
  });

  return {
    INICIO_POR_ROL: INICIO_POR_ROL,
    NOMBRE_ROL: NOMBRE_ROL,
    perfilElegido: perfilElegido,
    guardarPerfil: guardarPerfil,
    recordarRol: recordarRol,
    rolPermitido: rolPermitido,
    obtenerRol: obtenerRol,
    cerrarSesion: cerrarSesion
  };
})();
