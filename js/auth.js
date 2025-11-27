/* ============================================
   CONFIG GENERAL
===============================================*/
const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
let editingProjectId = null;

/* ============================================
   HELPER PARA FETCH
===============================================*/
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
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


/* ============================================
   REGISTRO
===============================================*/
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const itsonId = document.getElementById("itsonId").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        await apiFetch(`/auth/register`, {
            method: "POST",
            body: { name, email, itsonId, password }
        });

        alert("Registro exitoso. Ahora inicia sesión.");
        window.location.href = "index.html";

    } catch (err) {
        alert("Error: " + err.message);
    }
}

/* ============================================
   LOGIN
===============================================*/
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
        const data = await apiFetch(`/auth/login`, {
            method: "POST",
            body: { email, password }
        });

        console.log("LOGIN:", data);

        // === GUARDAR DATOS CORRECTAMENTE ===
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.userPublicData));
        localStorage.setItem("userId", data.userPublicData.id);

        window.location.href = "home.html";

    } catch (err) {
        alert("Error: " + err.message);
    }
}


/* ============================================
   PROTEGER HOME
===============================================*/
async function protectHome() {
    if (!localStorage.getItem("authToken")) {
        window.location.href = "index.html";
        return;
    }
    loadProjects();
}

/* ============================================
   CERRAR SESIÓN
===============================================*/
function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("itsonId");
    window.location.href = "index.html";
}

/* ============================================
   OBTENER PROYECTOS DEL USUARIO
===============================================*/
async function loadProjects() {
    try {
        const projects = await apiFetch(`/projects`);
        renderProjects(projects);
    } catch (err) {
        alert("Error al cargar proyectos: " + err.message);
    }
}

/* ============================================
   RENDER DE PROYECTOS
===============================================*/
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
            <p><strong>Imágenes:</strong> ${p.images.join(", ")}</p>

            <div class="project-actions">
                <button onclick="editProject('${p._id}')">Editar</button>
                <button onclick="deleteProject('${p._id}')">Eliminar</button>
            </div>
        `;

        container.appendChild(card);
    });
}

/* ============================================
   CREAR O EDITAR PROYECTO
===============================================*/
async function handleProject(e) {
    e.preventDefault();

    const title = document.getElementById("projTitle").value.trim();
    const description = document.getElementById("projDescription").value.trim();
    const technologies = document.getElementById("projTech").value.trim().split(",").map(t => t.trim());
    const repository = document.getElementById("projRepo").value.trim();
    const images = document.getElementById("projImages").value.trim().split(",").map(i => i.trim());

    const userId = localStorage.getItem("userId");

    const projectData = { title, description, technologies, repository, images, userId };

    try {
        if (editingProjectId) {
            await apiFetch(`/projects/${editingProjectId}`, {
                method: "PUT",
                body: projectData
            });

            editingProjectId = null;
            document.getElementById("projectCancel").style.display = "none";
        } else {
            await apiFetch(`/projects`, {
                method: "POST",
                body: projectData
            });
        }

        document.getElementById("projectForm").reset();
        loadProjects();

    } catch (err) {
        alert("Error: " + err.message);
    }
}

/* ============================================
   EDITAR
===============================================*/
async function editProject(id) {
    try {
        const p = await apiFetch(`/projects/${id}`);

        editingProjectId = id;

        document.getElementById("projTitle").value = p.title;
        document.getElementById("projDescription").value = p.description;
        document.getElementById("projTech").value = p.technologies.join(", ");
        document.getElementById("projRepo").value = p.repository || "";
        document.getElementById("projImages").value = p.images.join(", ");

        document.getElementById("projectCancel").style.display = "inline-block";

    } catch (err) {
        alert("Error: " + err.message);
    }
}

/* ============================================
   CANCELAR EDICIÓN
===============================================*/
function cancelEdit() {
    editingProjectId = null;
    document.getElementById("projectForm").reset();
    document.getElementById("projectCancel").style.display = "none";
}

/* ============================================
   BORRAR PROYECTO
===============================================*/
async function deleteProject(id) {
    if (!confirm("¿Seguro que deseas eliminar este proyecto?")) return;

    try {
        await apiFetch(`/projects/${id}`, { method: "DELETE" });
        loadProjects();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

const auth = {
    login: handleLogin,
    register: handleRegister,
    logout: logout
};
