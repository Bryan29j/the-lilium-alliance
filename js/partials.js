// Función para cargar un partial en el elemento con el id dado
window.loadPartial = async function (id, url) {
    const container = document.getElementById(id);
    if (!container) {
        console.warn(`Elemento con id "${id}" no encontrado para cargar ${url}`);
        return;
    }
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Partial no encontrado (${res.status})`);
        container.innerHTML = await res.text();

        // después de inyectar, instalar comportamiento correcto de anclas y home link
        attachFragmentBehavior(container);
        adjustHomeLink(container);
    } catch (e) {
        console.warn(`Error al cargar el partial: ${url}`, e);
        container.innerHTML = `<div class="text-red-400 text-center">Error al cargar ${url}</div>`;
    }
};

/*
  Nuevo: manejar el comportamiento de los enlaces que empiezan con '#'
  - Si la página actual es index (o equivalente), permitir scroll nativo / suave.
  - Si la página actual NO es index (ej. /members/member.html), interceptar el click
    y redirigir a index.html#fragment usando un repoBase calculado (funciona en GitHub Pages).
*/
function attachFragmentBehavior(root) {
    try {
        const anchors = root.querySelectorAll('a[href^="#"]');
        if (!anchors.length) return;

        const path = location.pathname || '';
        const isIndex = path.endsWith('index.html') || path === '/' || path === '' || path.endsWith('/');

        // determinar repo base: si estamos en /user/repo/... tomar '/user/repo/' como base
        const segments = path.split('/').filter(Boolean);
        let repoBase = '/';
        if (segments.length >= 2) {
            repoBase = '/' + segments[0] + '/' + segments[1] + '/';
        }

        anchors.forEach(a => {
            // eliminar handlers previos por seguridad
            a.removeEventListener('__partial_fragment_click__', a.__partial_fragment_fn__);
            const frag = a.getAttribute('href') || '#';

            const handler = function (ev) {
                // Si ya estamos en index, dejar que el enlace haga su trabajo (usamos scroll suave)
                if (isIndex) {
                    // comportamiento: evitar salto brusco si queremos smooth
                    ev.preventDefault();
                    try {
                        const target = document.querySelector(frag);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        else location.hash = frag; // fallback
                    } catch (e) {
                        location.hash = frag;
                    }
                } else {
                    // Si no estamos en index, navegar a index.html#fragment (repoBase cubre GitHub Pages)
                    ev.preventDefault();
                    // construir destino: repoBase + 'index.html' + fragment
                    const dest = repoBase + 'index.html' + frag;
                    // usar location.href para redirigir
                    window.location.href = dest;
                }
            };

            // guardar referencia para poder removerla después si es necesario
            a.__partial_fragment_fn__ = handler;
            // no usamos capture; añadir listener
            a.addEventListener('click', handler);
            // también escuche keydown Enter para accesibilidad
            a.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') handler(ev);
            });
        });
    } catch (e) {
        console.warn('Error al preparar comportamiento de fragmentos:', e);
    }
}

// Ajusta el enlace "home" (logo) dentro del partial para evitar rutas incorrectas
function adjustHomeLink(root) {
    try {
        const home = root.querySelector('[data-home-link]');
        if (!home) return;

        const path = location.pathname || '';
        const segments = path.split('/').filter(Boolean);
        let repoBase = '/';
        if (segments.length >= 2) {
            repoBase = '/' + segments[0] + '/' + segments[1] + '/';
        }

        const isIndex = path.endsWith('index.html') || path === '/' || path === '' || path.endsWith('/');
        if (isIndex) {
            home.setAttribute('href', 'index.html');
        } else {
            home.setAttribute('href', repoBase + 'index.html');
        }
    } catch (e) {
        console.warn('Error al ajustar enlace de home:', e);
    }
}

// Auto-cargar todos los elementos que tengan el atributo data-include
document.addEventListener('DOMContentLoaded', () => {
    const includes = document.querySelectorAll('[data-include]');
    includes.forEach(async el => {
        const path = el.getAttribute('data-include');
        if (!path) return;
        try {
            const res = await fetch(path);
            if (!res.ok) {
                console.warn('Partial no encontrado:', path);
                return;
            }
            el.innerHTML = await res.text();
            // instalar comportamiento tras insertar el partial
            attachFragmentBehavior(el);
            adjustHomeLink(el);
        } catch (e) {
            console.warn('Error al cargar el partial:', path, e);
            el.innerHTML = `<div class="text-red-400 text-center">Error al cargar ${path}</div>`;
        }
    });
});
