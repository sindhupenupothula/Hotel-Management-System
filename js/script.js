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
function showOccupiedRooms() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "block";
    document.getElementById("totalBookingsSection").style.display = "none";
}
function showTotalBookings() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "block";
}
function showTodaysBookings() {

    // Hide other sections
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";

    // Show Total Bookings section
    document.getElementById("totalBookingsSection").style.display = "block";

    // Change heading
    document.querySelector("#totalBookingsSection .overview-header h2").innerText =
        "📅 Today's Bookings";

    // Get today's date
    const today = new Date();

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const todayDate =
        String(today.getDate()).padStart(2, "0") +
        "-" +
        months[today.getMonth()] +
        "-" +
        today.getFullYear();

    // Get booking rows
    const rows = document.querySelectorAll("#bookingsTableBody tr");

    // Show only today's bookings
    rows.forEach(function(row) {

        const checkInDate = row.cells[4].innerText.trim();

        if (checkInDate === todayDate) {
            row.style.display = "table-row";
        } else {
            row.style.display = "none";
        }

    });
}

function showConfirmedBookings() {

    // Hide other sections
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";

    // Show Total Bookings section
    document.getElementById("totalBookingsSection").style.display = "block";

    // Change heading
    document.querySelector("#totalBookingsSection .overview-header h2").innerText =
        "✅ Confirmed Bookings";

    // Get all booking rows
    const rows = document.querySelectorAll("#bookingsTableBody tr");

    // Show only confirmed bookings
    rows.forEach(function(row) {

        const status = row.cells[6].innerText.trim();

        if (status === "Confirmed") {
            row.style.display = "table-row";
        } else {
            row.style.display = "none";
        }

    });
}
function showCancelledBookings() {

    showTotalBookings();

    const rows = document.querySelectorAll("#bookingsTableBody tr");

    rows.forEach(function(row) {

        const status = row.cells[6].innerText.trim();

        if (status === "Cancelled") {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

    document.querySelector("#totalBookingsSection .overview-header h2").innerText =
        "❌ Cancelled Bookings";
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
function createAvailableRoomNumbers(id, start, end, occupiedRooms = []) {

    const container = document.getElementById(id);

    if (!container) return;

    for (let i = start; i <= end; i++) {

        if (occupiedRooms.includes(i)) {
         continue;
        }
        const room = document.createElement("span");
        room.className = "room-no available";
        room.innerText = i;
        container.appendChild(room);
    }
}

// Luxury
createAvailableRoomNumbers("luxuryFirst", 101, 120, [118,119,120]);
createAvailableRoomNumbers("luxurySecond", 201, 220, [218,219,220]);
createAvailableRoomNumbers("luxuryThird", 301, 320, [317,318,319,320]);

// Deluxe
createAvailableRoomNumbers("deluxeFirst", 121, 140, [134,135,136,137,138,139,140]);
createAvailableRoomNumbers("deluxeSecond", 221, 240, [234,235,236,237,238,239,240]);
createAvailableRoomNumbers("deluxeThird", 321, 340, [333,334,335,336,337,338,339,340]);

// Suite
createAvailableRoomNumbers("suiteFirst", 141, 160, [148,149,150,151,152,153,154,155]);
createAvailableRoomNumbers("suiteSecond", 241, 260, [248,249,250,251,252,253,254,255]);
createAvailableRoomNumbers("suiteThird", 341, 360, [346,347,348,349,350,351,352,353]);
function createOccupiedRoomNumbers(id, occupiedRooms = []) {

    const container = document.getElementById(id);

    if (!container) return;

    occupiedRooms.forEach(function(roomNumber) {

        const room = document.createElement("span");

        room.className = "room-no occupied";

        room.innerText = roomNumber;

        container.appendChild(room);
    });
}
// Luxury
createOccupiedRoomNumbers("occupiedLuxuryFirst", [118,119,120]);
createOccupiedRoomNumbers("occupiedLuxurySecond", [218,219,220]);
createOccupiedRoomNumbers("occupiedLuxuryThird", [317,318,319,320]);

// Deluxe
createOccupiedRoomNumbers("occupiedDeluxeFirst", [134,135,136,137,138,139,140]);
createOccupiedRoomNumbers("occupiedDeluxeSecond", [234,235,236,237,238,239,240]);
createOccupiedRoomNumbers("occupiedDeluxeThird", [333,334,335,336,337,338,339,340]);

// Suite
createOccupiedRoomNumbers("occupiedSuiteFirst", [148,149,150,151,152,153,154,155]);
createOccupiedRoomNumbers("occupiedSuiteSecond", [248,249,250,251,252,253,254,255]);
createOccupiedRoomNumbers("occupiedSuiteThird", [346,347,348,349,350,351,352,353]);