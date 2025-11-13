// Simulación de autenticación local
const isLoggedIn = localStorage.getItem("loggedIn");

// Redirige a login si se intenta acceder a home sin sesión
if (window.location.pathname.includes("home.html") && !isLoggedIn) {
    window.location.href = "index.html";
}

// Login
document.getElementById("loginForm")?.addEventListener("submit", e => {
    e.preventDefault();
    localStorage.setItem("loggedIn", "true");
    window.location.href = "home.html";
});

// Simulación del registro
document.getElementById("registerForm")?.addEventListener("submit", e => {
    e.preventDefault();
    alert("Registro exitoso. Ahora puedes inicia sesión ^-^");
    window.location.href = "index.html";
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    window.location.href = "index.html";
});
