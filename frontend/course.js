const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "index.html";
}

// Get course ID from URL
const params = new URLSearchParams(window.location.search);
const courseId = params.get("id");

const courseTitle = document.getElementById("courseTitle");
const courseDescription = document.getElementById("courseDescription");
const enrollmentMessage = document.getElementById("enrollmentMessage");
const enrollBtn = document.getElementById("enrollBtn");
const lectureContainer = document.getElementById("lectureContainer");
const videoPanel = document.getElementById("videoPanel");
const lectureVideo = document.getElementById("lectureVideo");
const videoTitle = document.getElementById("videoTitle");
const closeVideoBtn = document.getElementById("closeVideoBtn");


// Load course information
async function loadCourse() {

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/courses/${courseId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const course = await response.json();

        if (!response.ok) {
            enrollmentMessage.textContent =
                course.detail || "Could not load course.";

            return;
        }

        courseTitle.textContent = course.title;
        courseDescription.textContent = course.description;

    } catch (error) {
        console.error(error);

        enrollmentMessage.textContent =
            "Could not connect to server.";
    }
}


// Check whether user is already enrolled
async function checkEnrollment() {

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/enrollments/my-courses",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const enrollments = await response.json();

        const enrollment = enrollments.find(
            item => item.course_id == courseId
        );

        if (enrollment) {

            enrollBtn.style.display = "none";

            enrollmentMessage.textContent =
                "You are enrolled in this course.";

            loadLectures();

        } else {

            enrollmentMessage.textContent =
                "You are not enrolled yet.";

            lectureContainer.innerHTML =
                "<p>Please enroll in the course to view lectures.</p>";
        }

    } catch (error) {
        console.error(error);
    }
}


// Enroll in course
enrollBtn.addEventListener("click", async function () {

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/enrollments/course/${courseId}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {

            enrollmentMessage.textContent =
                "Successfully enrolled in this course!";

            enrollmentMessage.style.color = "green";

            enrollBtn.style.display = "none";

            loadLectures();

        } else {

            enrollmentMessage.textContent =
                data.detail || "Enrollment failed.";

            enrollmentMessage.style.color = "red";
        }

    } catch (error) {

        console.error(error);

        enrollmentMessage.textContent =
            "Could not connect to server.";
    }
});


// Load lectures
async function loadLectures() {

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/lectures/course/${courseId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const lectures = await response.json();

        if (!response.ok) {

            lectureContainer.innerHTML =
                `<p>${lectures.detail || "Could not load lectures."}</p>`;

            return;
        }

        lectureContainer.innerHTML = "";

        lectures.forEach(lecture => {

            const lectureCard = document.createElement("div");

            lectureCard.className = "course-card";

            lectureCard.innerHTML = `
                <h3>
                    Lecture ${lecture.lecture_number}
                </h3>

                <p>
                    ${lecture.title}
                </p>

                <button class="watch-lecture-btn" type="button">
                    Watch Lecture
                </button>
            `;

            lectureCard.querySelector(".watch-lecture-btn").addEventListener(
                "click",
                () => watchLecture(lecture.video_url, lecture.title)
            );

            lectureContainer.appendChild(lectureCard);

        });

    } catch (error) {

        console.error(error);

        lectureContainer.innerHTML =
            "<p>Could not connect to server.</p>";
    }
}


// Show the lecture without leaving the course page.
function watchLecture(videoUrl, title) {

    lectureVideo.src = getEmbedUrl(videoUrl);
    videoTitle.textContent = title || "Lecture video";
    videoPanel.hidden = false;
}


function getEmbedUrl(videoUrl) {

    try {
        const url = new URL(videoUrl);
        let videoId = url.searchParams.get("v");

        if (url.hostname === "youtu.be") {
            videoId = url.pathname.slice(1);
        } else if (url.pathname.startsWith("/embed/")) {
            videoId = url.pathname.split("/")[2];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (error) {
        console.error("Invalid lecture video URL", error);
    }

    return videoUrl;
}


// Go back to dashboard
function goBack() {

    window.location.href = "dashboard.html";
}


closeVideoBtn.addEventListener("click", function () {
    lectureVideo.src = "";
    videoPanel.hidden = true;
});


// Start page
loadCourse();
checkEnrollment();