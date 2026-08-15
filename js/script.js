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
function showTotalCustomers() {
addMoreCustomers();
const rows =
document.querySelectorAll("#totalCustomersSection tbody tr");
 rows.forEach(function(row) {
    row.style.display = "";
 });
    // Hide all dashboard sections
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";

    // Show Total Customers section
    document.getElementById("totalCustomersSection").style.display = "block";
    document.querySelector("#totalCustomersSection .overview-header h2").innerText="👥 Customers Overview";
}
function addMoreCustomers() {
    const tbody = document.querySelector("#totalCustomersSection tbody");

    if (!tbody) return;

    // Already added ayithe malli add cheyyakudadhu
    if (document.getElementById("C085")) return;
     const names = [
    "Arun", "Bhavani", "Charan", "Deepika", "Eswar",
    "Harini", "Jeevan", "Kavya", "Lokesh", "Manisha",
    "Naveen", "Pooja", "Rahul", "Sneha", "Tarun",
    "Uma", "Varun", "Swathi", "Vikram", "Keerthi",
    "Rakesh", "Anusha", "Karthik", "Divya", "Srinivas",
    "Lavanya", "Praveen", "Meghana", "Sai", "Nandini",
    "Rohit", "Priyanka", "Vamsi", "Aishwarya", "Surya",
    "Tejas", "Bhavana", "Manoj", "Shravani", "Akshay",
    "Pallavi", "Sandeep", "Ramya", "Harsha", "Deepak",
    "Anjali", "Ravi", "Swetha", "Abhishek", "Kiran",
    "Mounika", "Rajesh", "Sowmya", "Nikhil", "Keerthana",
    "Ajay", "Sindhu", "Prasad", "Divya", "Sai Kumar",
    "Varsha", "Chaitanya", "Sravani", "Ramesh"
];
    for (let i = 22; i <= 85; i++) {
        const row = document.createElement("tr");

        row.id = "C" + String(i).padStart(3, "0");

        row.innerHTML = `
            <td>C${String(i).padStart(3, "0")}</td>
            <td>${names[i-22]}</td>
            <td>9876543${String(i).padStart(3, "0")}</td>
            <td>${i % 3 === 0 ? "Suite" : i % 2 === 0 ? "Deluxe" : "Luxury"}</td>
            <td>${100 + i}</td>
            <td>Active</td>
        `;

        tbody.appendChild(row);
    }
}
function showNewCustomers() {
//Make sure all customer rows exit//
addMoreCustomers();

    // Show Total Customers section
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "block";

    // Get customer table rows
    const rows = document.querySelectorAll("#totalCustomersSection tbody tr");

    rows.forEach((row) => {
        const customerId = row.cells[0].innerText.trim();
        const customerNumber = parseInt(customerId.substring(1));
        if (customerNumber <= 20) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });

    // Change heading
    document.querySelector("#totalCustomersSection .overview-header h2").innerText =
        "🆕 New Customers";
}
function showReturningCustomers() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "block";

    const rows = document.querySelectorAll("#totalCustomersSection tbody tr");

    rows.forEach(function(row) {
        const customerId = row.cells[0].innerText.trim();
        const customerNumber = parseInt(customerId.substring(1));

        if (customerNumber >= 21 && customerNumber <= 70) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });

    document.querySelector(
        "#totalCustomersSection .overview-header h2"
    ).innerText = "🔄 Returning Customers";
}
function showVIPCustomers() {

    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "block";

    const rows = document.querySelectorAll("#totalCustomersSection tbody tr");

    rows.forEach(function(row) {

        const customerId = row.cells[0].innerText.trim();
        const customerNumber = parseInt(customerId.substring(1));

        if (customerNumber >= 71 && customerNumber <= 85) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

    document.querySelector(
        "#totalCustomersSection .overview-header h2"
    ).innerText = "⭐ VIP Customers";
}
function showTotalBookings() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "block";
    document.querySelector("#totalBookingsSection .overview-header h2").innerText = "📋 Total Bookings";
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
function generateBookingData() {

    const tbody = document.getElementById("bookingsTableBody");
    if (!tbody)return;
    tbody.innerHTML = "";

    const names = [
        "Ravi Kumar", "Priya", "Ramesh", "Suresh", "Anjali",
        "Kiran", "Lakshmi", "Rahul", "Sneha", "Arjun",
        "Pooja", "Vijay", "Swathi", "Naveen", "Divya",
        "Sai Kumar", "Keerthi", "Manoj", "Harika", "Rohit"
    ];

    const roomTypes = ["Luxury", "Deluxe", "Suite"];

    // Today's date
    const today = new Date();

    function formatDate(date) {
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        return String(date.getDate()).padStart(2, "0") +
            "-" +
            months[date.getMonth()] +
            "-" +
            date.getFullYear();
    }

    function addDays(date, days) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    // Create 85 bookings
    for (let i = 1; i <= 85; i++) {

        let status;
        let checkIn;
        let checkOut;

        // First 12 = Today's bookings + Confirmed
        if (i <= 12) {

            status = "Confirmed";
            checkIn = formatDate(today);
            checkOut = formatDate(addDays(today, 2));

        // Next 53 = Confirmed
        } else if (i <= 65) {

            status = "Confirmed";

            const oldDate = addDays(today, -(i - 12));
            checkIn = formatDate(oldDate);
            checkOut = formatDate(addDays(oldDate, 2));

        // Next 8 = Cancelled
        } else if (i <= 73) {

            status = "Cancelled";

            const oldDate = addDays(today, -(i - 20));
            checkIn = formatDate(oldDate);
            checkOut = formatDate(addDays(oldDate, 2));

        // Last 12 = Pending
        } else {

            status = "Pending";

            const futureDate = addDays(today, i - 60);
            checkIn = formatDate(futureDate);
            checkOut = formatDate(addDays(futureDate, 2));
        }

        const name = names[(i - 1) % names.length];
        const roomType = roomTypes[(i - 1) % roomTypes.length];
        const roomNo = 101 + ((i - 1) % 248);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>B${String(i).padStart(3, "0")}</td>
            <td>${name}</td>
            <td>${roomType}</td>
            <td>${roomNo}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td>${status}</td>
        `;

        tbody.appendChild(row);
    }
}
generateBookingData();
function updateDateTime() {
    const now = new Date();
const currentDate = document.getElementById("currentDate");
const currentTime = document.getElementById("currentTime");

if (currentDate) {
    currentDate.innerHTML = now.toLocaleDateString();
}

if (currentTime) {
    currentTime.innerHTML = now.toLocaleTimeString();
}
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

function showTotalRevenue() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "none";

    document.getElementById("totalRevenueSection").style.display = "block";
    document.querySelector("#totalRevenueSection .overview-header h2").innerText = "💰 Revenue Overview";
}
function showTodaysRevenue() {

    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "none";
    document.getElementById("totalRevenueSection").style.display = "block";

    document.querySelector("#totalRevenueSection .overview-header h2").innerText =
        "📅 Today's Revenue";

    document.querySelector("#totalRevenueSection tbody").innerHTML = `
        <tr>
            <td>B001</td>
            <td>Ravi Kumar</td>
            <td>Luxury</td>
            <td>105</td>
            <td>₹15,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B002</td>
            <td>Priya</td>
            <td>Deluxe</td>
            <td>125</td>
            <td>₹10,000</td>
            <td>Paid</td>
        </tr>
    `;
}
function showThisMonthRevenue() {

    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "none";
    document.getElementById("totalRevenueSection").style.display = "block";

    document.querySelector("#totalRevenueSection .overview-header h2").innerText =
        "📆 This Month Revenue";

    document.querySelector("#totalRevenueSection tbody").innerHTML = `
        <tr>
            <td>B001</td>
            <td>Ravi Kumar</td>
            <td>Luxury</td>
            <td>105</td>
            <td>₹25,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B002</td>
            <td>Priya</td>
            <td>Deluxe</td>
            <td>125</td>
            <td>₹20,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B003</td>
            <td>Ramesh</td>
            <td>Suite</td>
            <td>205</td>
            <td>₹30,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B004</td>
            <td>Suresh</td>
            <td>Luxury</td>
            <td>110</td>
            <td>₹15,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B005</td>
            <td>Anjali</td>
            <td>Deluxe</td>
            <td>130</td>
            <td>₹28,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B006</td>
            <td>Kavya</td>
            <td>Suite</td>
            <td>210</td>
            <td>₹22,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B007</td>
            <td>Lakshmi</td>
            <td>Luxury</td>
            <td>115</td>
            <td>₹35,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B008</td>
            <td>Arjun</td>
            <td>Deluxe</td>
            <td>135</td>
            <td>₹18,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B009</td>
            <td>Swathi</td>
            <td>Suite</td>
            <td>220</td>
            <td>₹27,000</td>
            <td>Paid</td>
        </tr>

        <tr>
            <td>B010</td>
            <td>Rahul</td>
            <td>Luxury</td>
            <td>120</td>
            <td>₹30,000</td>
            <td>Paid</td>
        </tr>
    `;
}
function showAverageRevenue() {
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "none";
    document.getElementById("totalRevenueSection").style.display = "block";

    document.querySelector("#totalRevenueSection .overview-header h2").innerText =
        "📊 Average Revenue";
}
// ===============================
// VIEW ROOM DETAILS
// ===============================

function viewRoom(roomNumber) {

    const rows = document.querySelectorAll("#roomTableBody tr");

    let selectedRoom = null;

    rows.forEach(function(row) {

        const roomNo = row.cells[0].innerText.trim();

        if (roomNo === String(roomNumber)) {
            selectedRoom = row;
        }

    });

    if (!selectedRoom) return;

    const roomNo = selectedRoom.cells[0].innerText.trim();
    const roomType = selectedRoom.cells[1].innerText.trim();
    const floor = selectedRoom.cells[2].innerText.trim();
    const price = selectedRoom.cells[3].innerText.trim();
    const status = selectedRoom.cells[4].innerText.trim();

    document.getElementById("viewRoomNo").innerText = roomNo;
    document.getElementById("viewRoomType").innerText = roomType;
    document.getElementById("viewRoomFloor").innerText = floor;
    document.getElementById("viewRoomPrice").innerText = price;
    document.getElementById("viewRoomStatus").innerText = status;

    document.getElementById("viewRoomDescription").innerText =
        "Spacious " + roomType.toLowerCase() + " room with king size bed.";

    document.getElementById("viewRoomFeatures").innerText =
        "Wi-Fi, AC, TV, Mini Bar";

    document.getElementById("viewRoomCleaned").innerText =
        "13-Aug-2026";

    document.getElementById("viewRoomModal").style.display = "flex";
}


function closeViewRoom() {

    document.getElementById("viewRoomModal").style.display = "none";

}
// ===============================
// EDIT ROOM
// ===============================

let editingRoomRow = null;

function editRoom(roomNumber) {

    const rows = document.querySelectorAll("#roomTableBody tr");

    editingRoomRow = null;

    rows.forEach(function(row) {

        if (row.cells[0].innerText.trim() === String(roomNumber)) {
            editingRoomRow = row;
        }

    });

    if (!editingRoomRow) return;

    document.getElementById("editRoomNo").value =
        editingRoomRow.cells[0].innerText.trim();

    document.getElementById("editRoomType").value =
        editingRoomRow.cells[1].innerText.trim();

    document.getElementById("editFloor").value =
        editingRoomRow.cells[2].innerText.trim();

    document.getElementById("editPrice").value =
        editingRoomRow.cells[3].innerText
            .replace("₹", "")
            .replace(/,/g, "")
            .trim();

    document.getElementById("editStatus").value =
        editingRoomRow.cells[4].innerText.trim();

    document.getElementById("editDescription").value =
        "Spacious " +
        editingRoomRow.cells[1].innerText.trim().toLowerCase() +
        " room with king size bed.";

    document.getElementById("editFeatures").value =
        "Wi-Fi, AC, TV, Mini Bar";

    document.getElementById("editRoomModal").style.display = "flex";
}


function closeEditRoom() {

    document.getElementById("editRoomModal").style.display = "none";

    editingRoomRow = null;
}


function updateRoom() {

    if (!editingRoomRow) return;

    const roomNo =
        document.getElementById("editRoomNo").value.trim();

    const roomType =
        document.getElementById("editRoomType").value;

    const floor =
        document.getElementById("editFloor").value;

    const price =
        document.getElementById("editPrice").value.trim();

    const status =
        document.getElementById("editStatus").value;

    if (!roomNo || !roomType || !floor || !price || !status) {

        alert("Please fill all required fields.");

        return;
    }

    editingRoomRow.cells[0].innerText = roomNo;
    editingRoomRow.cells[1].innerText = roomType;
    editingRoomRow.cells[2].innerText = floor;
    editingRoomRow.cells[3].innerText =
        "₹" + Number(price).toLocaleString("en-IN");

    editingRoomRow.cells[4].innerHTML =
        `<span class="status ${status.toLowerCase()}">${status}</span>`;

    closeEditRoom();

    alert("Room updated successfully!");
}
// ===============================
// ADD NEW ROOM
// ===============================

function openAddRoom() {
    document.getElementById("addRoomModal").style.display = "flex";
}

function closeAddRoom() {
    document.getElementById("addRoomModal").style.display = "none";
}

function addRoom() {

    const roomNo = document.getElementById("addRoomNo").value.trim();
    const roomType = document.getElementById("addRoomType").value;
    const floor = document.getElementById("addFloor").value;
    const price = document.getElementById("addPrice").value.trim();
    const status = document.getElementById("addStatus").value;
    const description = document.getElementById("addDescription").value.trim();
    const features = document.getElementById("addFeatures").value.trim();

    if (!roomNo || !roomType || !floor || !price || !status) {
        alert("Please fill all required fields.");
        return;
    }

    const tbody = document.getElementById("roomTableBody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${roomNo}</td>
        <td>${roomType}</td>
        <td>${floor}</td>
        <td>₹${Number(price).toLocaleString("en-IN")}</td>
        <td>
            <span class="status ${status.toLowerCase()}">${status}</span>
        </td>
        <td>
            <button class="view-btn" onclick="viewRoom('${roomNo}')">👁</button>
            <button class="edit-btn" onclick="editRoom('${roomNo}')">✎</button>
            <button class="delete-btn" onclick="deleteRoom('${roomNo}')">🗑</button>
        </td>
    `;

    tbody.appendChild(row);
    setupRoomPagination();
    closeAddRoom();

    alert("Room added successfully!");
}
function setupRoomPagination() {
    const tbody = document.getElementById("roomTableBody");
    const pagination = document.getElementById("roomPagination");

    if (!tbody || !pagination) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    const rowsPerPage = 5;
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    let currentPage = 1;

    function showPage(page) {
        currentPage = page;

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display =
                index >= start && index < end ? "" : "none";
        });

        pagination.innerHTML = "";

        // Previous button
        const prev = document.createElement("button");
        prev.innerHTML = "‹";
        prev.disabled = currentPage === 1;
        prev.onclick = () => showPage(currentPage - 1);
        pagination.appendChild(prev);

        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.innerText = i;

            if (i === currentPage) {
                button.classList.add("active");
            }

            button.onclick = () => showPage(i);
            pagination.appendChild(button);
        }

        // Next button
        const next = document.createElement("button");
        next.innerHTML = "›";
        next.disabled = currentPage === totalPages;
        next.onclick = () => showPage(currentPage + 1);
        pagination.appendChild(next);
    }

    showPage(1);
}
// ===============================
// DELETE ROOM
// ===============================

function deleteRoom(roomNumber) {

    const rows = document.querySelectorAll("#roomTableBody tr");

    let selectedRoom = null;

    rows.forEach(function(row) {

        if (row.cells[0].innerText.trim() === String(roomNumber)) {
            selectedRoom = row;
        }

    });

    if (!selectedRoom) return;

    const confirmDelete = confirm(
        "Are you sure you want to delete Room " + roomNumber + "?"
    );

    if (!confirmDelete) return;

    selectedRoom.remove();

    alert("Room deleted successfully!");
}
// ===============================
// ROOM PAGINATION
// ===============================

let currentRoomPage = 1;
const roomsPerPage = 5;

function renderRoomPagination() {

    const tbody = document.getElementById("roomTableBody");
    const pagination = document.getElementById("roomPagination");

    if (!tbody || !pagination) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));

    const totalPages = Math.ceil(rows.length / roomsPerPage);

    if (currentRoomPage > totalPages) {
        currentRoomPage = totalPages || 1;
    }

    rows.forEach(function(row, index) {

        const start = (currentRoomPage - 1) * roomsPerPage;
        const end = start + roomsPerPage;

        row.style.display =
            index >= start && index < end ? "table-row" : "none";
    });

    pagination.innerHTML = "";

    // Previous button
    const previousButton = document.createElement("button");
    previousButton.innerText = "‹";
    previousButton.disabled = currentRoomPage === 1;

    previousButton.onclick = function() {
        if (currentRoomPage > 1) {
            currentRoomPage--;
            renderRoomPagination();
        }
    };

    pagination.appendChild(previousButton);

    // Page buttons
    for (let page = 1; page <= totalPages; page++) {

        const pageButton = document.createElement("button");

        pageButton.innerText = page;

        if (page === currentRoomPage) {
            pageButton.classList.add("active");
        }

        pageButton.onclick = function() {
            currentRoomPage = page;
            renderRoomPagination();
        };

        pagination.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.innerText = "›";
    nextButton.disabled = currentRoomPage === totalPages;

    nextButton.onclick = function() {
        if (currentRoomPage < totalPages) {
            currentRoomPage++;
            renderRoomPagination();
        }
    };

    pagination.appendChild(nextButton);
}

// Initial pagination
renderRoomPagination();
setupRoomPagination();