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

let player = null;
let currentLectureId = null;
let youtubeReady = false;

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
                () => watchLecture(
                    lecture.id,
                    lecture.video_url,
                    lecture.title
                )
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
function watchLecture(lectureId, videoUrl, title) {

    if (!youtubeReady) {
        console.log("YouTube API is not ready yet.");
        return;
    }

    const videoId = getYouTubeVideoId(videoUrl);

    console.log("Video URL:", videoUrl);
    console.log("Video ID:", videoId);

    currentLectureId = lectureId;

    videoTitle.textContent = title || "Lecture video";
    videoPanel.hidden = false;

    if (!videoId) {
        console.error("Could not find YouTube video ID.");
        return;
    }

    if (player) {

        player.loadVideoById(videoId);

    } else {

        console.log("Creating YouTube player...");
        console.log("YT.Player type:", typeof YT.Player);
        const newPlayer = new YT.Player("lectureVideo", {

            videoId: videoId,

            events: {
                onReady: function (event) {
                    console.log("YouTube player is ready!");
                },

                onError: function (event) {
                    console.log("YouTube player error:", event.data);
                },

                onStateChange: onPlayerStateChange
            },

        });
        console.log("New player object:", newPlayer);
        console.log("stopVideo type:", typeof newPlayer.stopVideo);

        player = newPlayer;

        console.log("Iframe src:", lectureVideo.src);
    }
}

function onPlayerStateChange(event) {

    if (event.data === YT.PlayerState.ENDED) {

        console.log("Lecture finished!");

        completeLecture(currentLectureId);
    }
}

async function completeLecture(lectureId) {

    if (!lectureId) {
        console.error("Lecture ID is missing.");
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:8000/progress/lecture/${lectureId}/complete`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {

            console.log("Lecture completed:", data);

        } else {

            console.error(
                "Could not complete lecture:",
                data
            );
        }

    } catch (error) {

        console.error(
            "Lecture completion error:",
            error
        );
    }
}

window.onYouTubeIframeAPIReady = function () {

    youtubeReady = true;
    console.log("YouTube API is ready.");
};

function getYouTubeVideoId(videoUrl) {

    try {

        const url = new URL(videoUrl);

        let videoId = url.searchParams.get("v");

        if (url.hostname === "youtu.be") {

            videoId = url.pathname.slice(1);

        } else if (url.pathname.startsWith("/embed/")) {

            videoId = url.pathname.split("/")[2];

        }

        return videoId;

    } catch (error) {

        console.error("Invalid YouTube URL:", error);

        return null;
    }
}


// Go back to dashboard
function goBack() {

    window.location.href = "dashboard.html";
}


closeVideoBtn.addEventListener("click", function () {

    if (player) {
        player.stopVideo();
    }

    videoPanel.hidden = true;
});


// Start page
loadCourse();
checkEnrollment();