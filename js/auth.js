const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
let editingProjectId = null;

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "auth-token": token } : {})
  };

  const config = {
    method: options.method || "GET",
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error en la solicitud");
  }

  return data;
}

function showError(message) {
  let errorBox = document.getElementById("errorBox");
  if (!errorBox) {
    errorBox = document.createElement("div");
    errorBox.id = "errorBox";
    errorBox.className = "error-box";
    document.body.prepend(errorBox);
  }
  errorBox.textContent = message;
  errorBox.style.display = "block";
  setTimeout(() => { errorBox.style.display = "none"; }, 4000);
}

function showMessage(message) {
  let msgBox = document.getElementById("msgBox");
  if (!msgBox) {
    msgBox = document.createElement("div");
    msgBox.id = "msgBox";
    msgBox.className = "msg-box";
    document.body.prepend(msgBox);
  }
  msgBox.textContent = message;
  msgBox.style.display = "block";
  setTimeout(() => { msgBox.style.display = "none"; }, 3000);
}

async function handleRegister(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Registrando...";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const itsonId = document.getElementById("itsonId").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await apiFetch(`/auth/register`, {
      method: "POST",
      body: { name, email, itsonId, password }
    });

    showMessage("Registro exitoso. Ahora inicia sesión.");
    window.location.href = "index.html";

  } catch (err) {
    showError("Error al registrar: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Crear cuenta";
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Ingresando...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const data = await apiFetch(`/auth/login`, {
      method: "POST",
      body: { email, password }
    });

    localStorage.setItem("authToken", data.token);

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      const uid = data.user.id || data.user._id;
      if (uid) localStorage.setItem("userId", uid);
    } else if (data.userPublicData) {
      localStorage.setItem("user", JSON.stringify(data.userPublicData));
      const uid = data.userPublicData.id || data.userPublicData._id;
      if (uid) localStorage.setItem("userId", uid);
    } else {
      throw new Error("La respuesta del servidor no contiene datos de usuario");
    }

    showMessage("¡Inicio de sesión exitoso!");
    window.location.href = "home.html";

  } catch (err) {
    showError("Error al iniciar sesión: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Ingresar";
  }
}

async function protectHome() {
  if (!localStorage.getItem("authToken")) {
    window.location.href = "index.html";
    return;
  }
  loadProjects();
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
}

async function loadProjects() {
  try {
    const projects = await apiFetch(`/projects`);
    renderProjects(projects);
  } catch (err) {
    showError("Error al cargar proyectos: " + err.message);
  }
}

function renderProjects(projects) {
  const container = document.getElementById("projectsList");
  container.innerHTML = "";

  projects.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <p><strong>Tecnologías:</strong> ${p.technologies.join(", ")}</p>
      <p><strong>Repositorio:</strong> ${p.repository || "Sin repo"}</p>
      <div class="images">
        ${Array.isArray(p.images) && p.images.length
          ? p.images.map(url => `<img src="${url}" alt="imagen de ${p.title}" class="proj-img">`).join("")
          : "<em>Sin imágenes</em>"
        }
      </div>
      <div class="project-actions">
        <button onclick="editProject('${p._id}')">Editar</button>
        <button onclick="deleteProject('${p._id}')">Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function handleProject(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("projectSubmit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando...";

  const userId = localStorage.getItem("userId");
  const title = document.getElementById("projTitle").value.trim();
  const description = document.getElementById("projDescription").value.trim();
  const technologies = document.getElementById("projTech").value.trim()
    .split(",").map(t => t.trim()).filter(Boolean);
  const repository = document.getElementById("projRepo").value.trim();
  const images = document.getElementById("projImages").value.trim()
    ? document.getElementById("projImages").value.trim().split(",").map(i => i.trim()).filter(Boolean)
    : [];

  if (!title || !description || !technologies.length) {
    showError("Completa título, descripción y al menos una tecnología.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar";
    return;
  }
  if (!userId) {
    showError("Sesión inválida. Vuelve a iniciar sesión.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar";
    return;
  }

  const projectData = { title, description, technologies, repository, images };

  try {
    if (editingProjectId) {
      await apiFetch(`/projects/${editingProjectId}`, { method: "PUT", body: projectData });
      editingProjectId = null;
      document.getElementById("projectCancel").style.display = "none";
      showMessage("Proyecto actualizado.");
    } else {
      await apiFetch(`/projects`, { method: "POST", body: projectData });
      showMessage("Proyecto creado.");
    }

    document.getElementById("projectForm").reset();
    document.getElementById("projectModalBg").style.display = "none";
    loadProjects();

  } catch (err) {
    showError("No se pudo guardar el proyecto: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar";
  }
}

function openProjectModal() {
  editingProjectId = null;
  document.getElementById("projectForm").reset();
  document.getElementById("projectModalTitle").textContent = "Nuevo Proyecto";
  document.getElementById("projectCancel").style.display = "none";
  document.getElementById("projectModalBg").style.display = "block";
}

function cancelEdit() {
  editingProjectId = null;
  document.getElementById("projectForm").reset();
  document.getElementById("projectCancel").style.display = "none";
  document.getElementById("projectModalBg").style.display = "none";
}

async function editProject(id) {
  try {
    const p = await apiFetch(`/projects/${id}`);

    editingProjectId = id;

    document.getElementById("projectModalTitle").textContent = "Editar Proyecto";
    document.getElementById("projectModalBg").style.display = "block";

    document.getElementById("projTitle").value = p.title || "";
    document.getElementById("projDescription").value = p.description || "";
    document.getElementById("projTech").value = Array.isArray(p.technologies) ? p.technologies.join(", ") : "";
    document.getElementById("projRepo").value = p.repository || "";
    document.getElementById("projImages").value = Array.isArray(p.images) ? p.images.join(", ") : "";

    document.getElementById("projectCancel").style.display = "inline-block";
  } catch (err) {
    showError("Error al cargar el proyecto: " + err.message);
  }
}

async function deleteProject(id) {
  if (!confirm("¿Seguro que deseas eliminar este proyecto?")) return;

  const gridBtn = document.querySelector(`button[onclick="deleteProject('${id}')"]`);
  if (gridBtn) {
    gridBtn.disabled = true;
    gridBtn.textContent = "Eliminando...";
  }

  try {
    await apiFetch(`/projects/${id}`, { method: "DELETE" });
    showMessage("Proyecto eliminado.");
    loadProjects();
  } catch (err) {
    showError("Error al eliminar proyecto: " + err.message);
  } finally {
    if (gridBtn) {
      gridBtn.disabled = false;
      gridBtn.textContent = "Eliminar";
    }
  }
}

const auth = {
  login: handleLogin,
  register: handleRegister,
  logout: logout
};