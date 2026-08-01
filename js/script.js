function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "admin" && password === "1234") {
        window.location.href = "pages/dashboard.html";
    } else {
        alert("Invalid Username or Password");
    }
}
function updateDateTime() {
    const now = new Date();

    document.getElementById("current-date").innerHTML =
        now.toLocaleDateString();

    document.getElementById("current-time").innerHTML =
        now.toLocaleTimeString();
}

setInterval(updateDateTime, 1000);
updateDateTime();
function showTotalRooms(){
    document.querySelector(".info-card").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "block";
}