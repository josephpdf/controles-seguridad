/**
 * auth.js
 * 
 * Este archivo maneja la lógica de autenticación del frontend.
 * Se encarga de verificar si el usuario ya ha iniciado sesión,
 * procesar el envío del formulario de login y manejar el cierre de sesión.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Obtener la referencia al formulario de login en index.html
    const loginForm = document.getElementById('loginForm');
    
    // Si no estamos en la página de login, no ejecutar este script
    if (!loginForm) return;

    // --- PROTECCIÓN DE RUTAS ---
    // Si ya existe un usuario guardado en sessionStorage, redirigir automáticamente al dashboard
    if (sessionStorage.getItem('user')) {
        window.location.href = 'dashboard.html';
    }

    // --- MANEJO DEL EVENTO DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        // Prevenir el comportamiento por defecto de recargar la página
        e.preventDefault();
        
        // Obtener los valores ingresados por el usuario
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const area = document.getElementById('login-area')?.value || 'Parqueo';
        const errorMsg = document.getElementById('loginError');

        try {
            // Realizar petición POST al backend para verificar credenciales
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // Convertir la respuesta a JSON
            const data = await response.json();

            if (data.success) {
                // Si el login es exitoso, guardar datos del usuario y área en sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('selectedArea', area);
                // Redirigir al dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Si las credenciales son incorrectas, mostrar mensaje de error
                errorMsg.textContent = data.message || 'Credenciales inválidas';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            // Manejar errores de red o del servidor
            console.error('Error:', error);
            errorMsg.textContent = 'Error de conexión con el servidor.';
            errorMsg.style.display = 'block';
        }
    });
});

/**
 * Función para cerrar la sesión del usuario actual
 * Elimina la información almacenada y redirige al index.html
 */
function logout() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('selectedArea');
    window.location.href = 'index.html';
}
