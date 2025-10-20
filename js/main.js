// Cargar miembros desde el archivo JSON
const ITEMS_PER_PAGE = 12;
let membersCache = [];

// Obtener página actual desde query param ?page=
function getCurrentPageFromUrl() {
  const p = Number(new URLSearchParams(window.location.search).get('page') || 1);
  return isNaN(p) || p < 1 ? 1 : Math.floor(p);
}
function setPageToUrl(page) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  history.pushState({}, '', url);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

async function fetchMembers() {
  const res = await fetch('data/members.json');
  if (!res.ok) throw new Error(`members.json no encontrado (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.members || []);
}

function openMember(encodedNickname) {
  try {
    const nickname = decodeURIComponent(String(encodedNickname || ''));
    // Redirigir a la página que ya procesa ?nickname=
    window.location.href = 'members/member.html?nickname=' + encodeURIComponent(nickname);
  } catch (e) {
    // fallback simple: redirigir por slug si algo falla
    const slug = String(encodedNickname || '').replace(/[^\w-]/g, '-').toLowerCase();
    window.location.href = 'members/member.html?nickname=' + encodeURIComponent(slug);
  }
}

function renderMemberCard(m) {
  const nickname = m.nickname || m.nick || m.name || '—';
  const gremio = m.gremio || m.guild || '—';
  const rango = m.rango || m.rank || '—';
  const nivel = (m.nivel !== undefined && m.nivel !== null) ? m.nivel : (m.level !== undefined ? m.level : '—');
  const avatar = m.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nickname)}`;
  const id = m.id || nickname.replace(/\s+/g, '-').toLowerCase();

  // NOTA: pasamos el nickname codificado para evitar problemas con comillas/caracteres.
  return `
    <div class="member-card bg-gray-700 p-4 rounded-xl shadow-lg cursor-pointer" onclick="openMember('${encodeURIComponent(nickname)}')">
      <img src="${escapeHtml(avatar)}" alt="${escapeHtml(nickname)}" class="w-24 h-24 mx-auto rounded-full mb-3 border-2 border-emerald-500">
      <h4 class="text-xl font-bold text-center text-emerald-300">${escapeHtml(nickname)}</h4>
      <p class="text-center text-sm text-gray-300">${escapeHtml(gremio)}</p>
      <p class="text-center text-sm text-gray-300">Rango: <span class="font-medium">${escapeHtml(rango)}</span></p>
      <p class="text-center text-sm text-gray-300">Nivel: <span class="font-medium">${escapeHtml(String(nivel))}</span></p>
    </div>
  `;
}

function renderPaginationControls(totalPages, currentPage) {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const buttons = [];

  // Prev
  buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Anterior</button>`);

  // Page numbers (simple: mostrar todas; si muchas, se puede mejorar)
  for (let i = 1; i <= totalPages; i++) {
    buttons.push(`<button data-page="${i}" class="px-3 py-1 rounded text-sm ${i === currentPage ? 'bg-emerald-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}">${i}</button>`);
  }

  // Next
  buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" class="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">Siguiente</button>`);

  container.innerHTML = buttons.join('');
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = Number(btn.getAttribute('data-page'));
      goToPage(p);
    });
  });
}

function renderPage(page) {
  const list = document.getElementById('member-list');
  if (!list) return;
  const total = membersCache.length;
  if (total === 0) {
    list.innerHTML = '<p class="text-center text-gray-400">No hay miembros para mostrar.</p>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = membersCache.slice(start, end);

  list.innerHTML = pageItems.map(renderMemberCard).join('');
  renderPaginationControls(totalPages, current);
}

function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(membersCache.length / ITEMS_PER_PAGE));
  const p = Math.min(Math.max(1, page), totalPages);
  setPageToUrl(p);
  renderPage(p);
}

window.addEventListener('popstate', () => {
  renderPage(getCurrentPageFromUrl());
});

// Inicializar
(async function init() {
  try {
    membersCache = await fetchMembers();
    const initialPage = getCurrentPageFromUrl();
    renderPage(initialPage);
  } catch (err) {
    console.warn('No se pudo cargar members.json:', err);
    const list = document.getElementById('member-list');
    if (list) list.innerHTML = '<p class="text-center text-red-400">Error al cargar la lista de miembros.</p>';
  }
})();