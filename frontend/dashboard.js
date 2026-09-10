const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "index.html";
}

const tableBody = document.getElementById("studentTableBody");
const message = document.getElementById("message");
const userTableBody = document.getElementById("userTableBody");
const userListContainer = document.getElementById("userListContainer");
const notificationContainer = document.getElementById("notificationContainer");
let currentUser = null

async function loadStudents(url = "http://127.0.0.1:8000/students/") {

    try {

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "index.html";
            return;
        }

        const students = await response.json();

        tableBody.innerHTML = "";

        students.forEach(student => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.age}</td>
                <td>${student.course}</td>
                <td>
    ${currentUser.role === "admin"
                    ? `
            <button onclick="editStudent(${student.id})">
                Edit
            </button>

            <button onclick="deleteStudent(${student.id})">
                Delete
            </button>
            `
                    : ""
                }
            </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        message.textContent = "Could not connect to server.";
        console.error(error);

    }
}


document.getElementById("searchBtn").addEventListener("click", function () {

    const search = document.getElementById("searchInput").value;

    if (search.trim() === "") {
        loadStudents();
        return;
    }

    loadStudents(
        `http://127.0.0.1:8000/students/?search=${encodeURIComponent(search)}`
    );

});


document.getElementById("showAllBtn").addEventListener("click", function () {

    document.getElementById("searchInput").value = "";

    loadStudents();

});


document.getElementById("logoutBtn").addEventListener("click", function () {

    localStorage.removeItem("access_token");

    window.location.href = "index.html";

});


const studentFormContainer = document.getElementById("studentFormContainer");
const studentForm = document.getElementById("studentForm");
const cancelBtn = document.getElementById("cancelBtn");
const userFormContainer = document.getElementById("userFormContainer");
const userForm = document.getElementById("userForm");

document.getElementById("addUserBtn").addEventListener("click", function () {
    userFormContainer.style.display = "block";
});

document.getElementById("cancelUserBtn").addEventListener("click", function () {
    userFormContainer.style.display = "none";
    userForm.reset();
});

document.getElementById("addStudentBtn").addEventListener("click", function () {
    studentFormContainer.style.display = "block";
});


cancelBtn.addEventListener("click", function () {
    studentFormContainer.style.display = "none";
    studentForm.reset();
});


userForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value;

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/auth/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            message.textContent = `User ${data.username} created successfully.`;
            message.style.color = "green";
            userForm.reset();
            userFormContainer.style.display = "none";
        } else {
            message.textContent = data.detail || "Could not create user.";
            message.style.color = "red";
        }
    } catch (error) {
        console.error(error);
        message.textContent = "Could not connect to server.";
        message.style.color = "red";
    }
});


async function loadUsers() {
    try {
        const response = await fetch("http://127.0.0.1:8000/auth/users", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            return;
        }

        const users = await response.json();
        userTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.role}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error(error);
    }
}


async function loadNotifications() {
    try {
        const response = await fetch("http://127.0.0.1:8000/notifications/", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            return;
        }

        const notifications = await response.json();
        notificationContainer.innerHTML = notifications.length
            ? notifications.map(notification => `
                <div class="notification-item ${notification.type}">
                    <strong>${notification.type === "completion" ? "Course completed" : "Course enrolled"}</strong>
                    <p>${notification.message}</p>
                </div>
            `).join("")
            : "<p>No notifications yet.</p>";
    } catch (error) {
        console.error(error);
    }
}


async function deleteStudent(id) {

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/students/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {

            message.textContent = "Student deleted successfully!";
            message.style.color = "green"; setTimeout(() => {
                location.reload();
            }, 1000);

        } else {

            message.textContent = data.detail || "Delete failed.";

        }

    } catch (error) {

        console.error(error);
        message.textContent = "Could not connect to server.";

    }
}


let editingStudentId = null;

async function editStudent(id) {

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/students/${id}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const student = await response.json();

        if (!response.ok) {
            message.textContent = student.detail || "Could not load student.";
            message.style.color = "red";
            return;
        }

        editingStudentId = id;

        document.getElementById("editName").value = student.name;
        document.getElementById("editEmail").value = student.email;
        document.getElementById("editAge").value = student.age;
        document.getElementById("editCourse").value = student.course;

        document.getElementById("editFormContainer").style.display = "block";

    } catch (error) {

        console.error(error);

        message.textContent = "Could not connect to server.";
        message.style.color = "red";

    }
}

async function getCurrentUser() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/auth/me",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not get user information");
        }

        currentUser = await response.json();

        console.log("Current user:", currentUser);

    } catch (error) {

        console.error(error);

    }
}


studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value;
    const email = document.getElementById("studentEmail").value;
    const age = document.getElementById("studentAge").value;
    const course = document.getElementById("studentCourse").value;

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/students/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    age: Number(age),
                    course: course
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            message.textContent = "Student added successfully!";
            message.style.color = "green";
            setTimeout(() => {
                location.reload();
            }, 1000);

        } else {
            message.textContent = data.detail || "Could not add student.";
            message.style.color = "red";
        }

    } catch (error) {
        console.error(error);
        message.textContent = "Could not connect to server.";
        message.style.color = "red";
    }
});

document.getElementById("editForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("editName").value;
    const email = document.getElementById("editEmail").value;
    const age = document.getElementById("editAge").value;
    const course = document.getElementById("editCourse").value;

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/students/${editingStudentId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    age: Number(age),
                    course: course
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            console.log("UPDATE SUCCESS");

            message.textContent = "Student updated successfully!";
            message.style.color = "green";

            setTimeout(function () {
                console.log("REFRESHING PAGE");
                window.location.reload();
            }, 1000);

        } else {
            console.log("UPDATE FAILED:", data);

            message.textContent = data.detail || "Update failed.";
            message.style.color = "red";
        }
    } catch (error) {
        console.error(error);
        message.textContent = "Could not connect to server.";
        message.style.color = "red";
    }
});


async function loadCourses() {
    const courseContainer = document.getElementById("courseContainer");

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/courses/",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "index.html";
            return;
        }

        const courses = await response.json();

        courseContainer.innerHTML = "";

        courses.forEach(course => {
            const card = document.createElement("div");

            card.className = "course-card";

            card.innerHTML = `
                <h3>${course.title}</h3>
                <p>${course.description}</p>

                <button onclick="viewCourse(${course.id})">
                    View Course
                </button>
            `;

            courseContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);

        courseContainer.innerHTML =
            "<p>Could not load courses.</p>";
    }
}

function viewCourse(courseId) {
    window.location.href = `course.html?id=${courseId}`;
}


async function startDashboard() {

    await getCurrentUser();

    if (!currentUser) {
        return;
    }

    document.getElementById("usernameDisplay").textContent =
        currentUser.username;

    document.getElementById("roleDisplay").textContent =
        currentUser.role;

    if (currentUser.role !== "admin") {
        document.getElementById("addStudentBtn").style.display = "none";
        document.getElementById("addUserBtn").style.display = "none";
    } else {
        userListContainer.style.display = "block";
        document.querySelector(".notification-section").style.display = "block";
        loadUsers();
        loadNotifications();
    }

    loadStudents();
    loadCourses();
}

startDashboard();
document.getElementById("cancelEditBtn").addEventListener("click", function () {
    document.getElementById("editForm").reset();

    document.getElementById("editFormContainer").style.display = "none";

    editingStudentId = null;
});