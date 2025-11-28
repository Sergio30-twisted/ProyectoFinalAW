const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
const ITSON_ID = "252037"; // Reemplaza por el id

const grid = document.getElementById("projectsGrid");
const loader = document.getElementById("loader");
const msgBox = document.getElementById("msgBox");
const errorBox = document.getElementById("errorBox");
const searchInput = document.getElementById("search");
const techFilter = document.getElementById("techFilter");

let projects = [];
let filtered = [];

function show(el) { el.style.display = "flex"; }
function hide(el) { el.style.display = "none"; }
function setMsg(text) { msgBox.textContent = text; msgBox.style.display = "block"; setTimeout(()=>msgBox.style.display="none", 3000); }
function setError(text) { errorBox.textContent = text; errorBox.style.display = "block"; setTimeout(()=>errorBox.style.display="none", 4000); }
function isValidUrl(url) { try { new URL(url); return true; } catch { return false; } }

async function loadProjects() {
  show(loader);
  hide(msgBox); hide(errorBox);

  try {
    const res = await fetch(`${API_BASE}/publicProjects/${ITSON_ID}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error al cargar proyectos públicos");

    projects = Array.isArray(data) ? data : (data.projects || []);
    filtered = projects.slice();

    hydrateTechFilter(projects);
    renderProjects(filtered);

    setMsg(`Se cargaron ${filtered.length} PokéProyectos.`);
  } catch (err) {
    setError(err.message);
  } finally {
    hide(loader);
  }
}

function hydrateTechFilter(items) {
  const techSet = new Set();
  items.forEach(p => (Array.isArray(p.technologies) ? p.technologies : []).forEach(t => techSet.add(t)));
  techFilter.innerHTML = '<option value="">Todas las tecnologías</option>';
  [...techSet].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    techFilter.appendChild(opt);
  });
}

function renderProjects(items) {
  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `<div class="card">
      <div class="card-body"><p class="card-text">No hay PokéProyectos aún.</p></div>
    </div>`;
    return;
  }

  items.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card animate__animated animate__fadeInUp";
    card.setAttribute("aria-label", `Proyecto ${p.title}`);

    const firstImage = Array.isArray(p.images) && p.images.length ? p.images[0] : "assets/placeholder.png";
    const safeImage = isValidUrl(firstImage) ? firstImage : "assets/placeholder.png";

    const repoUrl = p.repository && isValidUrl(p.repository) ? p.repository : null;

    card.innerHTML = `
      <div class="card-header">
        <h4 class="card-title">${p.title || "Proyecto sin título"}</h4>
        <span class="card-id">#${String(idx + 1).padStart(3, "0")}</span>
      </div>

      <img class="card-img" src="${safeImage}" alt="Imagen del proyecto ${p.title || ""}" loading="lazy" />

      <div class="card-body">
        <p class="card-text">${p.description || "Sin descripción"}</p>

        <div class="badges">
          ${(Array.isArray(p.technologies) ? p.technologies : []).map(t => `<span class="badge">${t}</span>`).join("")}
        </div>

        <div class="card-actions">
          ${repoUrl ? `<a class="btn btn-repo" href="${repoUrl}" target="_blank" rel="noopener">Repositorio</a>` : `<button class="btn btn-repo" disabled>Sin repo</button>`}
          <a class="btn btn-preview" href="#" onclick="event.preventDefault(); previewProject('${p._id}');">Detalles</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function previewProject(id) {
  const p = projects.find(x => String(x._id) === String(id));
  if (!p) return;
  setMsg(`Viendo detalles: ${p.title}`);
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const tech = techFilter.value;

  filtered = projects.filter(p => {
    const inText = (p.title || "").toLowerCase().includes(q) ||
                   (p.description || "").toLowerCase().includes(q) ||
                   (Array.isArray(p.technologies) ? p.technologies.join(" ").toLowerCase() : "").includes(q);
    const inTech = tech ? (Array.isArray(p.technologies) && p.technologies.includes(tech)) : true;
    return inText && inTech;
  });

  renderProjects(filtered);
}

searchInput.addEventListener("input", applyFilters);
techFilter.addEventListener("change", applyFilters);

loadProjects();