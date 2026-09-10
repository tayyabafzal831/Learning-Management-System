document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/auth/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (response.ok) {
            message.textContent = "Registration successful!";
            message.style.color = "green";
        } else {
            message.textContent = data.detail || "Registration failed.";
        }

    } catch (error) {
        message.textContent = "Could not connect to server.";
        console.error(error);
    }
});