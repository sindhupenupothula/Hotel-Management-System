function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "admin" && password === "1234") {
        window.location.href = "home.html";
    } else {
        alert("Invalid Username or Password");
    }
}
function showTotalRooms() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "block";
    document.getElementById("availableRoomsSection").style.display = "none";
}
function showAvailableRooms() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "block";
}
function updateDateTime() {
    const now = new Date();

    document.getElementById("currentDate").innerHTML =
        now.toLocaleDateString();

    document.getElementById("currentTime").innerHTML =
        now.toLocaleTimeString();
}

updateDateTime();
setInterval(updateDateTime, 1000);