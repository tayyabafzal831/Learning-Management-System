const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "index.html";
}


// Get elements from dashboard.html
const usernameDisplay = document.getElementById("usernameDisplay");
const roleDisplay = document.getElementById("roleDisplay");

const courseContainer = document.getElementById("courseContainer");

const notificationSection =
    document.getElementById("notificationSection");

const notificationContainer =
    document.getElementById("notificationContainer");

const logoutBtn =
    document.getElementById("logoutBtn");


const userManagementSection =
    document.getElementById("userManagementSection");

const addUserForm =
    document.getElementById("addUserForm");

const addUserMessage =
    document.getElementById("addUserMessage");

let currentUser = null;


// ==============================
// LOGOUT
// ==============================

logoutBtn.addEventListener("click", function () {

    localStorage.removeItem("access_token");

    window.location.href = "index.html";

});


// ==============================
// GET CURRENT USER
// ==============================

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


        // Token is invalid or expired
        if (response.status === 401) {

            localStorage.removeItem("access_token");

            window.location.href = "index.html";

            return;
        }


        if (!response.ok) {

            throw new Error(
                "Could not get user information"
            );
        }


        currentUser = await response.json();

        if (currentUser.role === "admin") {
            //console.log(currentUser.role);
            document.getElementsByClassName("course-section")[1].style.display = "none";
        }
        // Show username
        usernameDisplay.textContent =
            currentUser.username;


        // Show role
        roleDisplay.textContent =
            currentUser.role;


    } catch (error) {

        console.error(
            "User error:",
            error
        );

        window.location.href = "index.html";
    }
}


// ==============================
// LOAD COURSES
// ==============================

async function loadCourses() {

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


        if (!response.ok) {

            courseContainer.innerHTML =
                `<p>${courses.detail || "Could not load courses."}</p>`;

            return;
        }


        // Clear loading message
        courseContainer.innerHTML = "";


        // If no courses exist
        if (courses.length === 0) {

            courseContainer.innerHTML =
                "<p>No courses available.</p>";

            return;
        }


        // Create a card for every course
        courses.forEach(function (course) {

            const card =
                document.createElement("div");

            card.className = "course-card";


            const courseAction = currentUser.role === "admin"
                ? "<p>Admins do not enroll in courses or view lectures.</p>"
                : `
                    <button
                        type="button"
                        onclick="viewCourse(${course.id})"
                    >
                        View Course
                    </button>
                `;

            card.innerHTML = `
                <h3>${course.title}</h3>

                <p>${course.description}</p>

                ${courseAction}
            `;


            courseContainer.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Course error:",
            error
        );

        courseContainer.innerHTML =
            "<p>Could not connect to server.</p>";
    }
}


// ==============================
// LOAD ADMIN NOTIFICATIONS
// ==============================

async function loadNotifications() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/notifications/",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        // Normal users cannot access this endpoint
        if (!response.ok) {

            return;
        }


        const notifications =
            await response.json();


        if (notifications.length === 0) {

            notificationContainer.innerHTML =
                "<p>No notifications yet.</p>";

            return;
        }


        notificationContainer.innerHTML = "";


        notifications.forEach(function (notification) {

            const notificationItem =
                document.createElement("div");

            notificationItem.className =
                `notification-item ${notification.type}`;


            let title = "Enrollment";

            if (notification.type === "completion") {

                title = "Course Completed";

            }


            notificationItem.innerHTML = `
                <strong>${title}</strong>

                <p>
                    ${notification.message}
                </p>
            `;


            notificationContainer.appendChild(
                notificationItem
            );

        });


    } catch (error) {

        console.error(
            "Notification error:",
            error
        );
    }
}


// ==============================
// OPEN COURSE
// ==============================

function viewCourse(courseId) {

    window.location.href =
        `course.html?id=${courseId}`;
}


// ==============================
// START DASHBOARD
// ==============================

async function startDashboard() {

    // First get logged-in user
    await getCurrentUser();


    // Stop if user information was not loaded
    if (!currentUser) {

        return;
    }


    // Load courses
    await loadCourses();


    // Only admin sees notifications
    if (currentUser.role === "admin") {

        notificationSection.style.display = "block";

        userManagementSection.style.display = "block";

        await loadUsers();

        await loadNotifications();
    }

}

async function addUser(event) {

    event.preventDefault();

    const formData = new FormData(addUserForm);
    const getField = name => String(formData.get(name) || "").trim();
    const userData = {
        username: getField("username"),
        password: String(formData.get("password") || ""),
        name: getField("name"),
        email: getField("email"),
        age: Number(getField("age")),
        role: getField("role")
    };



    const missingFields = Object.entries(userData)
        .filter(([field, value]) => !value || (field === "age" && Number.isNaN(value)))
        .map(([field]) => field);

    if (missingFields.length > 0) {
        addUserMessage.textContent =
            `Please complete: ${missingFields.join(", ")}`;
        addUserMessage.style.color = "red";
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/auth/users",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(userData)
            }
        );


        const data = await response.json();


        if (response.ok) {

            addUserMessage.textContent =
                "User added successfully!";

            addUserMessage.style.color = "green";

            addUserForm.reset();

        } else {

            if (Array.isArray(data.detail)) {

                addUserMessage.textContent =
                    data.detail
                        .map(error => `${error.loc?.at(-1) || "Field"}: ${error.msg}`)
                        .join(", ");

            } else {

                addUserMessage.textContent =
                    data.detail || "Could not add user.";
            }

            addUserMessage.style.color = "red";
        }


    } catch (error) {

        console.error("Add user error:", error);

        addUserMessage.textContent =
            "Could not connect to server.";

        addUserMessage.style.color = "red";
    }
}


addUserForm.addEventListener(
    "submit",
    addUser
);

async function loadUsers() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/auth/users",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const users = await response.json();

        const userListContainer =
            document.getElementById("userListContainer");

        if (!response.ok) {

            userListContainer.innerHTML =
                `<p>${users.detail || "Could not load users."}</p>`;

            return;
        }

        userListContainer.innerHTML = "";

        if (users.length === 0) {

            userListContainer.innerHTML =
                "<p>No users found.</p>";

            return;
        }

        users.forEach(function (user) {

            const userItem =
                document.createElement("div");

            userItem.className = "user-list-container";

            userItem.innerHTML = `
                <strong>${user.name}</strong>
                <p>Username: ${user.username}</p>
                <p>Email: ${user.email}</p>
                <p>Age: ${user.age}</p>
                <p>Role: ${user.role}</p>
            `;

            userListContainer.appendChild(userItem);

        });

    } catch (error) {

        console.error("Load users error:", error);

        document.getElementById("userListContainer").innerHTML =
            "<p>Could not connect to server.</p>";
    }
}


// Start dashboard
startDashboard();