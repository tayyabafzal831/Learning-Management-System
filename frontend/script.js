document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
        const url = new URL("http://127.0.0.1:8000/auth/login");

        url.searchParams.append("username", username);
        url.searchParams.append("password", password);

        const response = await fetch(url, {
            method: "POST"
        });

        const data = await response.json();

        console.log("Login response:", data);

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);

            message.textContent = "Login successful!";
            message.style.color = "green";

            window.location.href = "dashboard.html";

        } else {
            if (Array.isArray(data.detail)) {
                message.textContent = data.detail
                    .map(error => error.msg)
                    .join(", ");
            } else {
                message.textContent = data.detail || "Login failed";
            }
        }

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = "Could not connect to server.";
    }
});