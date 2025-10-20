// Ejecuta la carga y renderizado cuando el DOM esté listo.
document.addEventListener('DOMContentLoaded', () => {
    renderProfile();
});

async function renderProfile() {
    const profileContainer = document.getElementById('profile');
    if (!profileContainer) return;

    // Obtener el nickname de la URL
    const params = new URLSearchParams(window.location.search);
    const nickname = params.get('nickname');
    if (!nickname) {
        profileContainer.innerHTML = '<p class="text-red-400">No se especificó ningún miembro.</p>';
        return;
    }

    try {
        // Cargar miembros
        const res = await fetch('../data/members.json');
        if (!res.ok) throw new Error(`members.json no encontrado (${res.status})`);
        const members = await res.json();

        // Buscar miembro (case-insensitive)
        const member = Array.isArray(members)
            ? members.find(m => (m.nickname || '').toLowerCase() === nickname.toLowerCase())
            : (members.members || []).find(m => (m.nickname || '').toLowerCase() === nickname.toLowerCase());

        if (!member) {
            profileContainer.innerHTML = '<p class="text-red-400">Miembro no encontrado.</p>';
            return;
        }

        // Renderizar tarjeta (usar escapeHtml para proteger)
        profileContainer.innerHTML = `
      <div class="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">
        <div class="md:w-1/2 w-full flex justify-center">
          <a href="../${escapeHtml(member.profile || '')}" target="_blank" rel="noopener">
            <img src="../${escapeHtml(member.profile || '')}" alt="${escapeHtml(member.nickname || '')}"
              class="w-full max-w-md aspect-video rounded-2xl border-4 border-emerald-500 object-cover shadow-lg hover:scale-105 transition cursor-pointer">
          </a>
        </div>
        <div class="md:w-1/2 w-full flex flex-col justify-center">
          <h2 class="text-3xl font-extrabold mb-2 text-emerald-300 tracking-wide">${escapeHtml(member.nickname || '')}</h2>
          <h3 class="text-lg text-gray-400 mb-4 font-semibold">${escapeHtml(member.gremio || '')}</h3>
          <ul class="text-left text-base text-gray-200 space-y-2 mb-4">
            <li class="flex items-center">
              <b class="text-emerald-400 mr-2">UID:</b>
              <span id="uid-value" class="font-mono bg-gray-900 px-2 py-1 rounded">${escapeHtml(member.uid || '')}</span>
              <button onclick="navigator.clipboard.writeText('${escapeHtml(member.uid || '')}')" class="ml-2 px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition text-xs" title="Copiar UID">Copiar</button>
            </li>
            <li><b class="text-emerald-400">Rango:</b> <span>${escapeHtml(member.rango || '')}</span></li>
            <li><b class="text-emerald-400">Nivel:</b> <span>${escapeHtml(String(member.nivel ?? ''))}</span></li>
            <li><b class="text-emerald-400">Fecha de nacimiento:</b> <span>${escapeHtml(member.fecha_nacimiento || '')}</span></li>
            <li><b class="text-emerald-400">WhatsApp:</b> <span>${escapeHtml(member.whatsapp || '')}</span></li>
            <li><b class="text-emerald-400">Alias WA:</b> <span>${escapeHtml(member.alias_wa || '')}</span></li>
            <!--<li><b class="text-emerald-400">Número:</b> <span>${escapeHtml(member.numero || '')}</span></li>-->
            <li><b class="text-emerald-400">País:</b> <span>${escapeHtml(member.pais || '')}</span></li>
            <li><b class="text-emerald-400">Discord:</b> <span>${escapeHtml(member.discord || '')}</span></li>
            <li><b class="text-emerald-400">Alias DC:</b> <span>${escapeHtml(member.alias_dc || '')}</span></li>
          </ul>
          <div class="text-center">
            <a href="../index.html" class="inline-block mt-4 px-6 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow hover:bg-emerald-600 transition">Volver</a>
          </div>
        </div>
      </div>
    `;
    } catch (err) {
        console.warn('Error al cargar members.json:', err);
        profileContainer.innerHTML = '<p class="text-red-400">Error al cargar los datos del miembro.</p>';
    }
}

// Helper para escapar HTML
function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}
