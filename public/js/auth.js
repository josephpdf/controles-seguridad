document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Redirigir si ya está logueado
    if (localStorage.getItem('user')) {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('loginError');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = data.message || 'Credenciales inválidas';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            errorMsg.textContent = 'Error de conexión con el servidor.';
            errorMsg.style.display = 'block';
        }
    });
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
