function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "admin" && password === "1234") {
        window.location.href = "home.html";
    } else {
        alert("Invalid Username or Password");
    }
}

function readAppData() {
    try {
        const saved = JSON.parse(localStorage.getItem("sayoraAppData")) || {};
        const bookings = Array.isArray(saved.bookings)
            ? saved.bookings
            : JSON.parse(localStorage.getItem("sayoraBookings") || "[]");
        const customers = Array.isArray(saved.customers)
            ? saved.customers
            : JSON.parse(localStorage.getItem("sayoraCustomers") || "[]");

        const normalized = {
            bookings: Array.isArray(bookings) ? bookings : [],
            customers: Array.isArray(customers) ? customers : [],
            dashboard: saved.dashboard || {
                totalBookings: Array.isArray(bookings) ? bookings.length : 0,
                totalCustomers: Array.isArray(customers) ? customers.length : 0,
                totalRevenue: Array.isArray(bookings)
                    ? bookings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                    : 0
            }
        };

        localStorage.setItem("sayoraAppData", JSON.stringify(normalized));
        return normalized;
    } catch (error) {
        const fallback = { bookings: [], customers: [], dashboard: { totalBookings: 0, totalCustomers: 0, totalRevenue: 0 } };
        localStorage.setItem("sayoraAppData", JSON.stringify(fallback));
        return fallback;
    }
}

function writeAppData(appData) {
    const normalized = {
        bookings: Array.isArray(appData?.bookings) ? appData.bookings : [],
        customers: Array.isArray(appData?.customers) ? appData.customers : [],
        dashboard: appData?.dashboard || {
            totalBookings: 0,
            totalCustomers: 0,
            totalRevenue: 0
        }
    };

    localStorage.setItem("sayoraAppData", JSON.stringify(normalized));
    localStorage.setItem("sayoraBookings", JSON.stringify(normalized.bookings));
    localStorage.setItem("sayoraCustomers", JSON.stringify(normalized.customers));
    return normalized;
}

function createBookingIdFromSeed(seedValue) {
    const numericSeed = Number(seedValue || Date.now()) || Date.now();
    return `BK${String(numericSeed).slice(-6).padStart(6, "0")}`;
}

function syncSharedBookingData(bookingEntry) {
    const appData = readAppData();
    const normalizedBooking = { ...bookingEntry };

    if (!normalizedBooking.bookingId) {
        normalizedBooking.bookingId = createBookingIdFromSeed(Date.now());
    }

    const guestSeed = normalizedBooking.customerName || normalizedBooking.phone || "Guest";
    const customerId = normalizedBooking.customerId || `C${String(guestSeed).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(Date.now()).slice(-4)}`;
    normalizedBooking.customerId = customerId;

    const mergedBookings = appData.bookings.filter(item => item.bookingId !== normalizedBooking.bookingId);
    mergedBookings.unshift(normalizedBooking);

    const customerRecord = {
        customerId,
        customerName: normalizedBooking.customerName,
        phone: normalizedBooking.phone || "9876543210",
        roomNo: normalizedBooking.roomNo,
        roomType: normalizedBooking.roomType,
        guests: normalizedBooking.guests,
        status: normalizedBooking.bookingStatus || "Confirmed",
        paymentStatus: normalizedBooking.paymentStatus || "Paid",
        bookingId: normalizedBooking.bookingId,
        checkIn: normalizedBooking.checkIn,
        checkOut: normalizedBooking.checkOut,
        amount: normalizedBooking.amount
    };

    const mergedCustomers = appData.customers.filter(item => item.bookingId !== normalizedBooking.bookingId && item.customerId !== customerId && item.customerName !== normalizedBooking.customerName);
    mergedCustomers.unshift(customerRecord);

    const dashboard = {
        totalBookings: mergedBookings.length,
        totalCustomers: mergedCustomers.length,
        totalRevenue: mergedBookings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    };

    const sharedData = {
        bookings: mergedBookings,
        customers: mergedCustomers,
        dashboard
    };

    writeAppData(sharedData);
    renderSharedBookingsTable();
    renderSharedCustomersTable();
    return sharedData;
}

function removeSharedBookingData(bookingId) {
    const appData = readAppData();
    const remainingBookings = appData.bookings.filter(item => item.bookingId !== bookingId);
    const remainingCustomers = appData.customers.filter(item => item.bookingId !== bookingId);

    const updatedData = {
        bookings: remainingBookings,
        customers: remainingCustomers,
        dashboard: {
            totalBookings: remainingBookings.length,
            totalCustomers: remainingCustomers.length,
            totalRevenue: remainingBookings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        }
    };

    writeAppData(updatedData);
    renderSharedBookingsTable();
    renderSharedCustomersTable();
    return updatedData;
}

function refreshAllDashboardDataAndViews() {
    renderSharedDashboardSummary();
    renderSharedBookingsTable();
    renderSharedCheckInsTable();
    renderSharedCheckedOutTable();
    renderSharedRevenueTable();
    renderSharedPendingPaymentsTable();
    renderSharedReviewsTable();
    renderSharedCustomersTable();
    renderRecentTablesOnDashboardHome();

    renderCustomersPageTable();
    renderCheckInPageTable();
    renderCheckOutPageTable();
    renderPaymentsPageTable();
    renderReviewsPageTable();
}

function renderSharedBookingsTable() {
    const tbody = document.getElementById("bookingsTableBody");
    if (!tbody) return;

    const appData = readAppData();
    tbody.innerHTML = "";

    appData.bookings.forEach((booking) => {
        const row = document.createElement("tr");
        row.dataset.bookingId = booking.bookingId;
        row.innerHTML = `
            <td>${booking.bookingId}</td>
            <td>${booking.customerName || "Guest"}</td>
            <td>${booking.roomNo || "-"}</td>
            <td>${booking.roomType || "-"}</td>
            <td>${booking.checkIn || "-"}</td>
            <td>${booking.checkOut || "-"}</td>
            <td>${booking.guests || 1}</td>
            <td>₹${Number(booking.amount || 0).toLocaleString("en-IN")}</td>
            <td><span class="status-pill ${booking.bookingStatus === 'Cancelled' ? 'status-red' : 'status-green'}">${booking.bookingStatus || "Confirmed"}</span></td>
            <td><span class="status-pill ${booking.paymentStatus === 'Pending' ? 'status-orange' : 'status-green'}">${booking.paymentStatus || "Paid"}</span></td>
            <td>
                <button type="button" class="edit-booking-btn" onclick="openEditModal('${booking.bookingId}')">Edit</button>
                <button type="button" class="delete-booking-btn" onclick="deleteBooking('${booking.bookingId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderSharedCustomersTable() {
    const tbody = document.querySelector("#totalCustomersSection tbody");
    if (!tbody) return;

    const appData = readAppData();
    tbody.innerHTML = "";

    appData.customers.forEach((customer) => {
        const row = document.createElement("tr");
        row.id = customer.customerId || `C${customer.customerName?.replace(/\s+/g, "") || "guest"}`;
        row.innerHTML = `
            <td>${customer.customerId || "-"}</td>
            <td>${customer.customerName || "Guest"}</td>
            <td>${customer.phone || "9876543210"}</td>
            <td>${customer.roomType || "-"}</td>
            <td>${customer.roomNo || "-"}</td>
            <td>${customer.status || "Active"}</td>
        `;
        tbody.appendChild(row);
    });
}

function getDefaultRoomCatalog() {
    const roomCatalog = [];
    const ranges = [
        { type: "Luxury", floor: "1st Floor", start: 101, end: 117 },
        { type: "Deluxe", floor: "1st Floor", start: 118, end: 134 },
        { type: "Suite", floor: "1st Floor", start: 135, end: 150 },
        { type: "Luxury", floor: "2nd Floor", start: 201, end: 217 },
        { type: "Deluxe", floor: "2nd Floor", start: 218, end: 234 },
        { type: "Suite", floor: "2nd Floor", start: 235, end: 250 },
        { type: "Luxury", floor: "3rd Floor", start: 301, end: 316 },
        { type: "Deluxe", floor: "3rd Floor", start: 317, end: 332 },
        { type: "Suite", floor: "3rd Floor", start: 333, end: 350 }
    ];

    ranges.forEach(({ type, floor, start, end }) => {
        for (let roomNo = start; roomNo <= end; roomNo++) {
            roomCatalog.push({
                roomNo,
                roomType: type,
                floor,
                price: type === "Luxury" ? 10000 : type === "Deluxe" ? 7000 : 15000,
                status: "Available"
            });
        }
    });

    return roomCatalog;
}

function getRoomList() {
    try {
        const savedRooms = JSON.parse(localStorage.getItem("sayoraRooms")) || [];
        if (!Array.isArray(savedRooms) || savedRooms.length === 0) {
            const seededRooms = getDefaultRoomCatalog();
            localStorage.setItem("sayoraRooms", JSON.stringify(seededRooms));
            return seededRooms;
        }
        return savedRooms;
    } catch (error) {
        const seededRooms = getDefaultRoomCatalog();
        localStorage.setItem("sayoraRooms", JSON.stringify(seededRooms));
        return seededRooms;
    }
}

function syncRoomOccupancyWithBookings() {
    const rooms = getRoomList();
    const bookings = JSON.parse(localStorage.getItem("sayoraBookings") || "[]");
    const bookedRoomNumbers = new Set(
        bookings
            .filter(booking => booking && booking.roomNo && String(booking.bookingStatus || "Confirmed").toLowerCase() !== "cancelled")
            .map(booking => String(booking.roomNo))
    );

    const updatedRooms = rooms.map(room => {
        const roomNo = String(room.roomNo);
        if (room.status === "Maintenance") {
            return room;
        }
        return {
            ...room,
            status: bookedRoomNumbers.has(roomNo) ? "Occupied" : "Available"
        };
    });

    localStorage.setItem("sayoraRooms", JSON.stringify(updatedRooms));
    return updatedRooms;
}

function updateRoomAvailabilitySummary() {
    const rooms = syncRoomOccupancyWithBookings();

    const totalAvailable = rooms.filter(room => room.status !== "Occupied" && room.status !== "Maintenance").length;
    const totalOccupied = rooms.filter(room => room.status === "Occupied").length;

    const availableTotal = document.querySelector("#availableRoomsSection .total-card h2");
    if (availableTotal) availableTotal.textContent = totalAvailable;

    const occupiedTotal = document.querySelector("#occupiedRoomsSection .total-card h2");
    if (occupiedTotal) occupiedTotal.textContent = totalOccupied;

    const roomTypeSummary = {
        Luxury: rooms.filter(room => room.roomType === "Luxury"),
        Deluxe: rooms.filter(room => room.roomType === "Deluxe"),
        Suite: rooms.filter(room => room.roomType === "Suite")
    };

    const setTypeSummary = (selector, type, state) => {
        const node = document.querySelector(selector);
        if (node) {
            node.textContent = roomTypeSummary[type].filter(room => state === "Available" ? room.status !== "Occupied" && room.status !== "Maintenance" : room.status === state).length;
        }
    };

    setTypeSummary("#availableRoomsSection .room-card:nth-of-type(2) h2", "Luxury", "Available");
    setTypeSummary("#availableRoomsSection .room-card:nth-of-type(3) h2", "Deluxe", "Available");
    setTypeSummary("#availableRoomsSection .room-card:nth-of-type(4) h2", "Suite", "Available");
    setTypeSummary("#occupiedRoomsSection .room-card:nth-of-type(2) h2", "Luxury", "Occupied");
    setTypeSummary("#occupiedRoomsSection .room-card:nth-of-type(3) h2", "Deluxe", "Occupied");
    setTypeSummary("#occupiedRoomsSection .room-card:nth-of-type(4) h2", "Suite", "Occupied");

    const renderFloorCells = (containerId, roomType, targetStatus) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const floorName = containerId.includes("First") ? "1st Floor" : containerId.includes("Second") ? "2nd Floor" : "3rd Floor";
        const matchedRooms = rooms.filter(room => room.roomType === roomType && room.floor === floorName && (targetStatus === "Available" ? room.status !== "Occupied" && room.status !== "Maintenance" : room.status === targetStatus));
        container.innerHTML = matchedRooms.map(room => `<span class="room-no ${targetStatus === "Available" ? "available" : "occupied"}">${room.roomNo}</span>`).join("");
    };

    ["Luxury", "Deluxe", "Suite"].forEach(type => {
        renderFloorCells(`${type.toLowerCase()}First`, type, "Available");
        renderFloorCells(`${type.toLowerCase()}Second`, type, "Available");
        renderFloorCells(`${type.toLowerCase()}Third`, type, "Available");
        renderFloorCells(`occupied${type}First`, type, "Occupied");
        renderFloorCells(`occupied${type}Second`, type, "Occupied");
        renderFloorCells(`occupied${type}Third`, type, "Occupied");
    });
}

function renderSharedDashboardSummary() {
    const appData = readAppData();
    const bookings = Array.isArray(appData.bookings) && appData.bookings.length ? appData.bookings : JSON.parse(localStorage.getItem("sayoraBookings") || "[]");
    const customers = Array.isArray(appData.customers) && appData.customers.length ? appData.customers : JSON.parse(localStorage.getItem("sayoraCustomers") || "[]");
    const rooms = getRoomList();

    const dashboard = {
        totalBookings: bookings.length,
        totalCustomers: customers.length,
        totalRevenue: bookings.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        totalRooms: rooms.length,
        availableRooms: rooms.filter(room => room.status !== "Occupied" && room.status !== "Maintenance").length,
        occupiedRooms: rooms.filter(room => room.status === "Occupied").length
    };

    const totalBookingsValue = document.querySelector("#totalBookingsSection .total-card h2");
    if (totalBookingsValue) totalBookingsValue.textContent = dashboard.totalBookings;

    const totalCustomersValue = document.querySelector("#totalCustomersSection .total-card h2");
    if (totalCustomersValue) totalCustomersValue.textContent = dashboard.totalCustomers;

    const totalRevenueValue = document.querySelector("#totalRevenueSection .total-card h2");
    if (totalRevenueValue) totalRevenueValue.textContent = `₹${Number(dashboard.totalRevenue).toLocaleString("en-IN")}`;

    const totalRoomsValue = document.querySelector("#totalRoomsSection .total-card h2");
    if (totalRoomsValue) totalRoomsValue.textContent = dashboard.totalRooms;

    updateRoomAvailabilitySummary();
    return dashboard;
}

function initializeSharedDataViews() {
    if (typeof document === "undefined") return;

    const rooms = getRoomList();
    if (!rooms.length) {
        localStorage.setItem("sayoraRooms", JSON.stringify(getDefaultRoomCatalog()));
    }

    if (document.getElementById("bookingsTableBody")) {
        renderSharedBookingsTable();
    }

    if (document.querySelector("#totalCustomersSection tbody")) {
        renderSharedCustomersTable();
    }

    updateRoomAvailabilitySummary();
    renderSharedDashboardSummary();
}

function hideAllDashboardSections() {
    const ids = [
        "dashboardHome",
        "totalRoomsSection",
        "availableRoomsSection",
        "occupiedRoomsSection",
        "totalBookingsSection",
        "totalCustomersSection",
        "totalRevenueSection",
        "checkedOutSection",
        "pendingPaymentsSection",
        "totalReviewsSection"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

function showDashboardHome() {
    hideAllDashboardSections();
    const el = document.getElementById("dashboardHome");
    if (el) el.style.display = "block";
}

function showTotalRooms() {
    hideAllDashboardSections();
    const el = document.getElementById("totalRoomsSection");
    if (el) el.style.display = "block";
}

function showAvailableRooms() {
    hideAllDashboardSections();
    const el = document.getElementById("availableRoomsSection");
    if (el) el.style.display = "block";
}

function showOccupiedRooms() {
    hideAllDashboardSections();
    const el = document.getElementById("occupiedRoomsSection");
    if (el) el.style.display = "block";
    renderSharedCheckInsTable();
}

function showTotalBookings() {
    hideAllDashboardSections();
    const el = document.getElementById("totalBookingsSection");
    if (el) el.style.display = "block";
    renderSharedBookingsTable();
}

function showTotalCustomers() {
    hideAllDashboardSections();
    const el = document.getElementById("totalCustomersSection");
    if (el) el.style.display = "block";
    renderSharedCustomersTable();
}

function showCheckedOutRooms() {
    hideAllDashboardSections();
    const el = document.getElementById("checkedOutSection");
    if (el) el.style.display = "block";
    renderSharedCheckedOutTable();
}

function showTotalRevenue() {
    hideAllDashboardSections();
    const el = document.getElementById("totalRevenueSection");
    if (el) el.style.display = "block";
    renderSharedRevenueTable();
}

function showPendingPayments() {
    hideAllDashboardSections();
    const el = document.getElementById("pendingPaymentsSection");
    if (el) el.style.display = "block";
    renderSharedPendingPaymentsTable();
}

function showTotalReviews() {
    hideAllDashboardSections();
    const el = document.getElementById("totalReviewsSection");
    if (el) el.style.display = "block";
    renderSharedReviewsTable();
}
function renderRecentTablesOnDashboardHome() {
    const appData = readAppData();
    const bookings = appData.bookings || [];

    const recentBookingsBody = document.getElementById("recentBookingsBody");
    if (recentBookingsBody) {
        recentBookingsBody.innerHTML = "";
        const top3Bookings = bookings.slice(0, 3);
        top3Bookings.forEach(b => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${b.bookingId}</td>
                <td>${b.customerName || "Guest"}</td>
                <td>${b.roomNo || "-"}</td>
                <td>${b.checkIn || "-"}</td>
                <td><span class="status-pill status-green">${b.bookingStatus || "Confirmed"}</span></td>
            `;
            recentBookingsBody.appendChild(tr);
        });
    }

    const recentCheckInsBody = document.getElementById("recentCheckInsBody");
    if (recentCheckInsBody) {
        recentCheckInsBody.innerHTML = "";
        const top3CheckIns = bookings.filter(b => (b.bookingStatus || "Confirmed") !== "Checked Out" && (b.bookingStatus || "Confirmed") !== "Cancelled").slice(0, 3);
        top3CheckIns.forEach((c, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.checkInId || 'CI' + String(idx + 1).padStart(3, '0')}</td>
                <td>${c.customerName || "Guest"}</td>
                <td>${c.roomNo || "-"}</td>
                <td>${c.checkIn || "-"}</td>
                <td><span class="status-pill status-green">Checked In</span></td>
            `;
            recentCheckInsBody.appendChild(tr);
        });
    }
}

function renderSharedCheckInsTable() {
    const tbody = document.getElementById("checkInsTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const checkIns = (appData.bookings || []).filter(b => (b.bookingStatus || "Confirmed") !== "Checked Out" && (b.bookingStatus || "Confirmed") !== "Cancelled");
    tbody.innerHTML = "";

    checkIns.forEach((item, index) => {
        const checkInId = item.checkInId || `CI${String(index + 1).padStart(3, "0")}`;
        const row = document.createElement("tr");
        row.dataset.bookingId = item.bookingId;
        row.innerHTML = `
            <td>${checkInId}</td>
            <td>${item.customerName || "Guest"}</td>
            <td>${item.roomNo || "101"}</td>
            <td>${item.roomType || "Luxury"}</td>
            <td>${item.checkIn || "29-Aug-2026"}</td>
            <td>${item.checkOut || "31-Aug-2026"}</td>
            <td>${item.guests || 1}</td>
            <td>₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
            <td><span class="status-pill status-green">Checked In</span></td>
            <td><span class="status-pill ${item.paymentStatus === 'Pending' ? 'status-orange' : 'status-green'}">${item.paymentStatus || "Paid"}</span></td>
            <td>
                <button type="button" class="edit-booking-btn" onclick="openEditModal('${item.bookingId}')">Edit</button>
                <button type="button" class="delete-booking-btn" onclick="checkoutBooking('${item.bookingId}')">Checkout</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderSharedCheckedOutTable() {
    const tbody = document.getElementById("checkedOutTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const checkedOutList = (appData.bookings || []).filter(b => b.bookingStatus === "Checked Out");
    tbody.innerHTML = "";

    if (checkedOutList.length === 0) {
        const defaultCheckedOut = [
            { bookingId: "CO001", customerName: "Anjali", roomNo: "108", roomType: "Deluxe", checkIn: "25-Aug-2026", checkOut: "28-Aug-2026", guests: 2, amount: 24000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
            { bookingId: "CO002", customerName: "Suresh", roomNo: "112", roomType: "Luxury", checkIn: "26-Aug-2026", checkOut: "29-Aug-2026", guests: 1, amount: 36000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
            { bookingId: "CO003", customerName: "Vikram", roomNo: "204", roomType: "Suite", checkIn: "27-Aug-2026", checkOut: "30-Aug-2026", guests: 3, amount: 48000, bookingStatus: "Checked Out", paymentStatus: "Paid" }
        ];
        defaultCheckedOut.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.bookingId}</td>
                <td>${item.customerName}</td>
                <td>${item.roomNo}</td>
                <td>${item.roomType}</td>
                <td>${item.checkIn}</td>
                <td>${item.checkOut}</td>
                <td>${item.guests}</td>
                <td>₹${Number(item.amount).toLocaleString("en-IN")}</td>
                <td><span class="status-pill" style="background:#fee2e2; color:#b91c1c;">Checked Out</span></td>
                <td><span class="status-pill status-green">${item.paymentStatus}</span></td>
                <td><button type="button" class="edit-booking-btn" onclick="openViewModal('${item.bookingId}')">View Details</button></td>
            `;
            tbody.appendChild(row);
        });
        return;
    }

    checkedOutList.forEach((item, index) => {
        const coId = `CO${String(index + 1).padStart(3, "0")}`;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${coId}</td>
            <td>${item.customerName || "Guest"}</td>
            <td>${item.roomNo || "-"}</td>
            <td>${item.roomType || "-"}</td>
            <td>${item.checkIn || "-"}</td>
            <td>${item.checkOut || "-"}</td>
            <td>${item.guests || 1}</td>
            <td>₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
            <td><span class="status-pill" style="background:#fee2e2; color:#b91c1c;">Checked Out</span></td>
            <td><span class="status-pill status-green">${item.paymentStatus || "Paid"}</span></td>
            <td><button type="button" class="edit-booking-btn" onclick="openViewModal('${item.bookingId}')">View Details</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderSharedRevenueTable() {
    const tbody = document.getElementById("revenueTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const paidBookings = (appData.bookings || []).filter(b => (b.paymentStatus || "Paid") === "Paid");
    tbody.innerHTML = "";

    paidBookings.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.bookingId}</td>
            <td>${item.customerName || "Guest"}</td>
            <td>${item.roomNo || "-"}</td>
            <td>${item.roomType || "-"}</td>
            <td>${item.checkIn || "-"}</td>
            <td>${item.checkOut || "-"}</td>
            <td>₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
            <td><span class="status-pill status-green">Paid</span></td>
            <td><button type="button" class="edit-booking-btn" onclick="openInvoiceModal('${item.bookingId}')">Invoice</button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderSharedPendingPaymentsTable() {
    const tbody = document.getElementById("pendingPaymentsTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const pendingList = (appData.bookings || []).filter(b => b.paymentStatus === "Pending");
    tbody.innerHTML = "";

    if (pendingList.length === 0) {
        const defaultPending = [
            { bookingId: "BK489732", customerName: "Nagamani", roomNo: "222", roomType: "Deluxe", checkIn: "29-Aug-2026", checkOut: "31-Aug-2026", amount: 8000 },
            { bookingId: "BK489735", customerName: "Lokesh", roomNo: "115", roomType: "Luxury", checkIn: "30-Aug-2026", checkOut: "02-Sep-2026", amount: 24000 },
            { bookingId: "BK489740", customerName: "Keerthana", roomNo: "210", roomType: "Suite", checkIn: "31-Aug-2026", checkOut: "03-Sep-2026", amount: 32000 }
        ];
        defaultPending.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.bookingId}</td>
                <td>${item.customerName}</td>
                <td>${item.roomNo}</td>
                <td>${item.roomType}</td>
                <td>${item.checkIn}</td>
                <td>${item.checkOut}</td>
                <td>₹${Number(item.amount).toLocaleString("en-IN")}</td>
                <td><span class="status-pill" style="background:#fef3c7; color:#d97706;">Pending</span></td>
                <td><button type="button" class="edit-booking-btn" onclick="openCollectPaymentModal('${item.bookingId}')">Collect Payment</button></td>
            `;
            tbody.appendChild(row);
        });
        return;
    }

    pendingList.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.bookingId}</td>
            <td>${item.customerName || "Guest"}</td>
            <td>${item.roomNo || "-"}</td>
            <td>${item.roomType || "-"}</td>
            <td>${item.checkIn || "-"}</td>
            <td>${item.checkOut || "-"}</td>
            <td>₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
            <td><span class="status-pill" style="background:#fef3c7; color:#d97706;">Pending</span></td>
            <td><button type="button" class="edit-booking-btn" onclick="openCollectPaymentModal('${item.bookingId}')">Collect Payment</button></td>
        `;
        tbody.appendChild(row);
    });
}

function getStoredReviews() {
    try {
        const saved = JSON.parse(localStorage.getItem("sayoraReviews")) || [];
        if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch(e){}
    const defaultReviews = [
        { id: "REV001", name: "Sindhu Priya", roomType: "Luxury", rating: "★★★★★ (5.0)", comment: "Excellent stay! Clean rooms and friendly staff.", date: "31-Aug-2026", reply: "" },
        { id: "REV002", name: "Ravi Kumar", roomType: "Deluxe", rating: "★★★★★ (5.0)", comment: "Very good service and delicious food.", date: "31-Aug-2026", reply: "" },
        { id: "REV003", name: "Priya Sharma", roomType: "Suite", rating: "★★★★★ (5.0)", comment: "Clean rooms and great ambience!", date: "31-Aug-2026", reply: "" }
    ];
    localStorage.setItem("sayoraReviews", JSON.stringify(defaultReviews));
    return defaultReviews;
}

function renderSharedReviewsTable() {
    const tbody = document.getElementById("reviewsTableBody");
    if (!tbody) return;

    const reviews = getStoredReviews();
    tbody.innerHTML = "";

    reviews.forEach(review => {
        const row = document.createElement("tr");
        let replyHtml = review.reply ? `<div style="margin-top:4px; font-size:12px; color:#2563eb;"><strong>Reply:</strong> ${review.reply}</div>` : '';
        row.innerHTML = `
            <td>${review.id}</td>
            <td>${review.name}</td>
            <td>${review.roomType}</td>
            <td><span style="color:#f59e0b;">${review.rating}</span></td>
            <td>${review.comment}${replyHtml}</td>
            <td>${review.date}</td>
            <td><button type="button" class="edit-booking-btn" onclick="openReplyModal('${review.id}')">${review.reply ? 'Edit Reply' : 'Reply'}</button></td>
        `;
        tbody.appendChild(row);
    });
}

function showOccupiedRooms() {
    renderSharedCheckInsTable();
    hideAllDashboardSections();
    if (document.getElementById("occupiedRoomsSection")) document.getElementById("occupiedRoomsSection").style.display = "block";
    const header = document.querySelector("#occupiedRoomsSection .overview-header h2");
    if (header) header.innerText = "🔑 Total Checked-In List";
}

function showCheckedOutRooms() {
    hideAllDashboardSections();
    if (document.getElementById("checkedOutSection")) document.getElementById("checkedOutSection").style.display = "block";
    const header = document.querySelector("#checkedOutSection .overview-header h2");
    if (header) header.innerText = "🚪 Total Checked-Out List";
}

function showPendingPayments() {
    hideAllDashboardSections();
    if (document.getElementById("pendingPaymentsSection")) document.getElementById("pendingPaymentsSection").style.display = "block";
    const header = document.querySelector("#pendingPaymentsSection .overview-header h2");
    if (header) header.innerText = "💳 Pending Payments List";
}

function showTotalReviews() {
    hideAllDashboardSections();
    if (document.getElementById("totalReviewsSection")) document.getElementById("totalReviewsSection").style.display = "block";
    const header = document.querySelector("#totalReviewsSection .overview-header h2");
    if (header) header.innerText = "⭐ Total Reviews List";
}
function showTotalCustomers() {
    renderSharedCustomersTable();
    renderSharedDashboardSummary();
    const rows = document.querySelectorAll("#totalCustomersSection tbody tr");
    rows.forEach(function(row) {
        row.style.display = "";
    });
    document.getElementById("dashboardHome").style.display = "none";
    document.getElementById("totalRoomsSection").style.display = "none";
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("occupiedRoomsSection").style.display = "none";
    document.getElementById("totalBookingsSection").style.display = "none";
    document.getElementById("totalCustomersSection").style.display = "block";
    document.querySelector("#totalCustomersSection .overview-header h2").innerText = "👥 Customers Overview";
}
function addMoreCustomers() {
    const tbody = document.querySelector("#totalCustomersSection tbody");
    if (!tbody) return;

    const appData = readAppData();
    if (appData.customers.length) {
        renderSharedCustomersTable();
        return;
    }

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
            <td>${names[i - 22]}</td>
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
    renderSharedBookingsTable();
    renderSharedDashboardSummary();
    hideAllDashboardSections();
    if (document.getElementById("totalBookingsSection")) document.getElementById("totalBookingsSection").style.display = "block";
    const header = document.querySelector("#totalBookingsSection .overview-header h2");
    if (header) header.innerText = "📋 Total Bookings List";
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
    const appData = readAppData();
    if (appData.bookings && appData.bookings.length === 25) {
        return;
    }

    const sampleBookings = [
        { bookingId: "BK557860", customerName: "Sindhu Priya", roomNo: "105", roomType: "Luxury", checkIn: "29-Aug-2026", checkOut: "31-Aug-2026", guests: 2, amount: 24000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557861", customerName: "Ravi Kumar", roomNo: "101", roomType: "Deluxe", checkIn: "29-Aug-2026", checkOut: "31-Aug-2026", guests: 1, amount: 14000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557862", customerName: "Priya Sharma", roomNo: "102", roomType: "Suite", checkIn: "29-Aug-2026", checkOut: "01-Sep-2026", guests: 2, amount: 32000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557863", customerName: "Anjali Mehta", roomNo: "201", roomType: "Luxury", checkIn: "30-Aug-2026", checkOut: "01-Sep-2026", guests: 1, amount: 22000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557864", customerName: "Mohan Reddy", roomNo: "221", roomType: "Deluxe", checkIn: "30-Aug-2026", checkOut: "01-Sep-2026", guests: 3, amount: 18000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557865", customerName: "Karthik Raja", roomNo: "106", roomType: "Luxury", checkIn: "31-Aug-2026", checkOut: "02-Sep-2026", guests: 2, amount: 20000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557866", customerName: "Deepika Padukone", roomNo: "107", roomType: "Deluxe", checkIn: "31-Aug-2026", checkOut: "02-Sep-2026", guests: 1, amount: 14000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557867", customerName: "Arjun Verma", roomNo: "202", roomType: "Suite", checkIn: "01-Sep-2026", checkOut: "03-Sep-2026", guests: 2, amount: 30000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557868", customerName: "Sneha Kapoor", roomNo: "203", roomType: "Luxury", checkIn: "01-Sep-2026", checkOut: "03-Sep-2026", guests: 1, amount: 22000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557869", customerName: "Rahul Dravid", roomNo: "108", roomType: "Deluxe", checkIn: "02-Sep-2026", checkOut: "04-Sep-2026", guests: 2, amount: 16000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557870", customerName: "Pooja Hegde", roomNo: "109", roomType: "Luxury", checkIn: "02-Sep-2026", checkOut: "04-Sep-2026", guests: 1, amount: 20000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        { bookingId: "BK557871", customerName: "Vijay Kumar", roomNo: "205", roomType: "Suite", checkIn: "03-Sep-2026", checkOut: "05-Sep-2026", guests: 2, amount: 32000, bookingStatus: "Checked In", paymentStatus: "Paid" },
        
        // 8 Checked Out Bookings
        { bookingId: "BK557872", customerName: "Swathi Reddy", roomNo: "110", roomType: "Deluxe", checkIn: "20-Aug-2026", checkOut: "22-Aug-2026", guests: 2, amount: 14000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557873", customerName: "Naveen Babu", roomNo: "111", roomType: "Luxury", checkIn: "21-Aug-2026", checkOut: "23-Aug-2026", guests: 1, amount: 20000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557874", customerName: "Divya Teja", roomNo: "112", roomType: "Suite", checkIn: "22-Aug-2026", checkOut: "25-Aug-2026", guests: 3, amount: 45000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557875", customerName: "Sai Krishna", roomNo: "113", roomType: "Luxury", checkIn: "23-Aug-2026", checkOut: "25-Aug-2026", guests: 2, amount: 22000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557876", customerName: "Keerthi Suresh", roomNo: "114", roomType: "Deluxe", checkIn: "24-Aug-2026", checkOut: "26-Aug-2026", guests: 1, amount: 14000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557877", customerName: "Manoj Kumar", roomNo: "115", roomType: "Luxury", checkIn: "25-Aug-2026", checkOut: "28-Aug-2026", guests: 2, amount: 30000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557878", customerName: "Harika Roy", roomNo: "116", roomType: "Suite", checkIn: "26-Aug-2026", checkOut: "29-Aug-2026", guests: 3, amount: 48000, bookingStatus: "Checked Out", paymentStatus: "Paid" },
        { bookingId: "BK557879", customerName: "Rohit Sharma", roomNo: "117", roomType: "Deluxe", checkIn: "27-Aug-2026", checkOut: "30-Aug-2026", guests: 1, amount: 16000, bookingStatus: "Checked Out", paymentStatus: "Paid" },

        // 5 Pending / Confirmed Bookings
        { bookingId: "BK557880", customerName: "Nagamani", roomNo: "222", roomType: "Deluxe", checkIn: "04-Sep-2026", checkOut: "06-Sep-2026", guests: 2, amount: 8000, bookingStatus: "Pending", paymentStatus: "Pending" },
        { bookingId: "BK557881", customerName: "Lokesh Chandra", roomNo: "215", roomType: "Luxury", checkIn: "05-Sep-2026", checkOut: "07-Sep-2026", guests: 1, amount: 24000, bookingStatus: "Pending", paymentStatus: "Pending" },
        { bookingId: "BK557882", customerName: "Keerthana Roy", roomNo: "210", roomType: "Suite", checkIn: "06-Sep-2026", checkOut: "08-Sep-2026", guests: 3, amount: 32000, bookingStatus: "Pending", paymentStatus: "Pending" },
        { bookingId: "BK557883", customerName: "Abhishek Varma", roomNo: "211", roomType: "Luxury", checkIn: "07-Sep-2026", checkOut: "09-Sep-2026", guests: 2, amount: 20000, bookingStatus: "Pending", paymentStatus: "Pending" },
        { bookingId: "BK557884", customerName: "Mounika S", roomNo: "212", roomType: "Deluxe", checkIn: "08-Sep-2026", checkOut: "10-Sep-2026", guests: 1, amount: 12000, bookingStatus: "Pending", paymentStatus: "Pending" }
    ];

    const customers = sampleBookings.map((b, idx) => ({
        customerId: `CUS${String(idx + 1).padStart(3, "0")}`,
        customerName: b.customerName,
        phone: `9876543${String(idx + 10).padStart(3, "0")}`,
        email: `${b.customerName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
        roomType: b.roomType,
        roomNo: b.roomNo,
        type: idx % 3 === 0 ? "VIP" : "Regular",
        totalBookings: 1 + (idx % 3),
        lastBooking: b.checkIn,
        status: idx === 4 ? "Inactive" : "Active",
        bookingId: b.bookingId
    }));

    writeAppData({
        bookings: sampleBookings,
        customers: customers,
        dashboard: {
            totalBookings: 25,
            totalCustomers: 25,
            totalRevenue: 245000
        }
    });
}

generateBookingData();
function updateDateTime() {
    const now = new Date();
    const currentDate = document.getElementById("currentDate");
    const currentTime = document.getElementById("currentTime");

    if (currentDate) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayName = days[now.getDay()];
        const day = String(now.getDate()).padStart(2, "0");
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        currentDate.innerHTML = `${dayName}, ${day} ${month} ${year}`;
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
    renderSharedDashboardSummary();
    hideAllDashboardSections();
    if (document.getElementById("totalRevenueSection")) document.getElementById("totalRevenueSection").style.display = "block";
    const header = document.querySelector("#totalRevenueSection .overview-header h2");
    if (header) header.innerText = "💰 Total Revenue List";
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
function autoFillRoomDetails() {

    const roomNo = document.getElementById("addRoomNo").value.trim();
    const roomType = document.getElementById("addRoomType");
    const floor = document.getElementById("addFloor");
    const price = document.getElementById("addPrice");

    if (!roomNo) {
        roomType.value = "";
        floor.value = "";
        price.value = "";
        return;
    }

    const roomNumber = Number(roomNo);

    if (!Number.isInteger(roomNumber)) {
        roomType.value = "";
        floor.value = "";
        price.value = "";
        return;
    }

    if (roomNumber >= 101 && roomNumber <= 117) {

        roomType.value = "Luxury";
        floor.value = "1st Floor";
        price.value = 10000;

    } else if (roomNumber >= 118 && roomNumber <= 134) {

        roomType.value = "Deluxe";
        floor.value = "1st Floor";
        price.value = 7000;

    } else if (roomNumber >= 135 && roomNumber <= 150) {

        roomType.value = "Suite";
        floor.value = "1st Floor";
        price.value = 15000;

    } else if (roomNumber >= 201 && roomNumber <= 217) {

        roomType.value = "Luxury";
        floor.value = "2nd Floor";
        price.value = 11000;

    } else if (roomNumber >= 218 && roomNumber <= 234) {

        roomType.value = "Deluxe";
        floor.value = "2nd Floor";
        price.value = 8000;

    } else if (roomNumber >= 235 && roomNumber <= 250) {

        roomType.value = "Suite";
        floor.value = "2nd Floor";
        price.value = 16000;

    } else if (roomNumber >= 301 && roomNumber <= 316) {

        roomType.value = "Luxury";
        floor.value = "3rd Floor";
        price.value = 12000;

    } else if (roomNumber >= 317 && roomNumber <= 332) {

        roomType.value = "Deluxe";
        floor.value = "3rd Floor";
        price.value = 9000;

    } else if (roomNumber >= 333 && roomNumber <= 350) {

        roomType.value = "Suite";
        floor.value = "3rd Floor";
        price.value = 17000;

    } else {

        roomType.value = "";
        floor.value = "";
        price.value = "";
    }
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
     const roomNumber = Number(roomNo);

if (!Number.isInteger(roomNumber)) {
    alert("Please enter a valid room number.");
    return;
}

let validRoom = false;

if (roomNumber >= 101 && roomNumber <= 117 && roomType === "Luxury" && floor === "1st Floor") {
    validRoom = true;
} else if (roomNumber >= 118 && roomNumber <= 134 && roomType === "Deluxe" && floor === "1st Floor") {
    validRoom = true;
} else if (roomNumber >= 135 && roomNumber <= 150 && roomType === "Suite" && floor === "1st Floor") {
    validRoom = true;
} else if (roomNumber >= 201 && roomNumber <= 217 && roomType === "Luxury" && floor === "2nd Floor") {
    validRoom = true;
} else if (roomNumber >= 218 && roomNumber <= 234 && roomType === "Deluxe" && floor === "2nd Floor") {
    validRoom = true;
} else if (roomNumber >= 235 && roomNumber <= 250 && roomType === "Suite" && floor === "2nd Floor") {
    validRoom = true;
} else if (roomNumber >= 301 && roomNumber <= 316 && roomType === "Luxury" && floor === "3rd Floor") {
    validRoom = true;
} else if (roomNumber >= 317 && roomNumber <= 332 && roomType === "Deluxe" && floor === "3rd Floor") {
    validRoom = true;
} else if (roomNumber >= 333 && roomNumber <= 350 && roomType === "Suite" && floor === "3rd Floor") {
    validRoom = true;
}

if (!validRoom) {
    alert("Invalid room number, room type or floor. Please use the room ranges defined in Dashboard.");
    return;
}
const existingRooms = document.querySelectorAll("#roomTableBody tr");

for (const row of existingRooms) {
    const existingRoomNo = row.cells[0]?.innerText.trim();

    if (existingRoomNo === roomNo) {
        alert("Room number " + roomNo + " already exists.");
        return;
    }
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
    const savedRooms = JSON.parse(localStorage.getItem("sayoraRooms")) || [];

savedRooms.push({
    roomNo: roomNo,
    roomType: roomType,
    floor: floor,
    price: price,
    status: status
});

localStorage.setItem("sayoraRooms", JSON.stringify(savedRooms));
    renderRoomPagination();
    closeAddRoom();

    alert("Room added successfully!");
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

let savedRooms =
    JSON.parse(localStorage.getItem("sayoraRooms")) || [];

savedRooms = savedRooms.filter(function(room) {
    return String(room.roomNo) !== String(roomNumber);
});

localStorage.setItem("sayoraRooms", JSON.stringify(savedRooms));
// Remember deleted room
let deletedRooms =
    JSON.parse(localStorage.getItem("deletedRooms")) || [];

if (!deletedRooms.includes(String(roomNumber))) {
    deletedRooms.push(String(roomNumber));
}

localStorage.setItem(
    "deletedRooms",
    JSON.stringify(deletedRooms)
);
renderRoomPagination();

alert("Room deleted successfully!");
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

function applyFilters() {
    const searchRoom = document.getElementById("searchRoom").value.trim().toLowerCase();
    const roomType = document.getElementById("roomTypeFilter").value;
    const floor = document.getElementById("floorFilter").value;
    const status = document.getElementById("statusFilter").value;

    const rows = document.querySelectorAll("#roomTableBody tr");

    rows.forEach(function(row) {
        const roomNo = row.cells[0]?.innerText.trim().toLowerCase();
        const type = row.cells[1]?.innerText.trim();
        const roomFloor = row.cells[2]?.innerText.trim();
        const roomStatus = row.cells[4]?.innerText.trim();

        const matchesSearch =
            !searchRoom || roomNo.includes(searchRoom);

        const matchesType =
            !roomType || type === roomType;

        const matchesFloor =
            !floor || roomFloor === floor;

        const matchesStatus =
            !status || roomStatus === status;

        if (
            matchesSearch &&
            matchesType &&
            matchesFloor &&
            matchesStatus
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}


function resetFilters() {
    document.getElementById("searchRoom").value = "";
    document.getElementById("roomTypeFilter").value = "";
    document.getElementById("floorFilter").value = "";
    document.getElementById("statusFilter").value = "";

    const rows = document.querySelectorAll("#roomTableBody tr");

    rows.forEach(function(row) {
        row.style.display = "";
    });
}
const addRoomInput = document.getElementById("addRoomNo");
if (addRoomInput) {
    addRoomInput.addEventListener("input", autoFillRoomDetails);
}

function loadSavedRooms() {

    const savedRooms =
        JSON.parse(localStorage.getItem("sayoraRooms")) || [];

    const tbody = document.getElementById("roomTableBody");

    if (!tbody) return;
    const deletedRooms =
    JSON.parse(localStorage.getItem("deletedRooms")) || [];

const existingRows = tbody.querySelectorAll("tr");

existingRows.forEach(function(row) {

    const roomNo = row.cells[0]?.innerText.trim();

    if (deletedRooms.includes(String(roomNo))) {
        row.remove();
    }
});
    savedRooms.forEach(function(room) {

        // Avoid duplicate rooms
        const existingRows = tbody.querySelectorAll("tr");

        for (const row of existingRows) {
            if (row.cells[0]?.innerText.trim() === room.roomNo) {
                return;
            }
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${room.roomNo}</td>
            <td>${room.roomType}</td>
            <td>${room.floor}</td>
            <td>₹${Number(room.price).toLocaleString("en-IN")}</td>
            <td>
                <span class="status ${room.status.toLowerCase()}">
                    ${room.status}
                </span>
            </td>
            <td>
                <button class="view-btn" onclick="viewRoom('${room.roomNo}')">👁</button>
                <button class="edit-btn" onclick="editRoom('${room.roomNo}')">✎</button>
                <button class="delete-btn" onclick="deleteRoom('${room.roomNo}')">🗑</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    renderRoomPagination();
}

loadSavedRooms();
initializeSharedDataViews();
// ===============================
// BOOKING ROOM AUTO FILL
// ===============================

function autoFillBookingRoomDetails() {

    const roomNoInput = document.getElementById("bookingRoomNo");
    const roomTypeInput = document.getElementById("bookingRoomType");
    const amountInput = document.getElementById("bookingAmount");

    if (!roomNoInput || !roomTypeInput || !amountInput) {
        return;
    }

    const roomNo = Number(roomNoInput.value.trim());

    if (!roomNo) {
        roomTypeInput.value = "";
        amountInput.value = "";
        return;
    }

    let roomType = "";
    let price = "";

    // 1st Floor
    if (roomNo >= 101 && roomNo <= 117) {
        roomType = "Luxury";
        price = 10000;
    }
    else if (roomNo >= 118 && roomNo <= 134) {
        roomType = "Deluxe";
        price = 7000;
    }
    else if (roomNo >= 135 && roomNo <= 150) {
        roomType = "Suite";
        price = 15000;
    }

    // 2nd Floor
    else if (roomNo >= 201 && roomNo <= 217) {
        roomType = "Luxury";
        price = 11000;
    }
    else if (roomNo >= 218 && roomNo <= 234) {
        roomType = "Deluxe";
        price = 8000;
    }
    else if (roomNo >= 235 && roomNo <= 250) {
        roomType = "Suite";
        price = 16000;
    }

    // 3rd Floor
    else if (roomNo >= 301 && roomNo <= 316) {
        roomType = "Luxury";
        price = 12000;
    }
    else if (roomNo >= 317 && roomNo <= 332) {
        roomType = "Deluxe";
        price = 9000;
    }
    else if (roomNo >= 333 && roomNo <= 350) {
        roomType = "Suite";
        price = 17000;
    }

    if (roomType) {
        roomTypeInput.value = roomType;
        amountInput.value = price;
    }
    else {
        roomTypeInput.value = "";
        amountInput.value = "";
    }
}


// Room number type chesinappudu automatic ga fill avvali
document.addEventListener("DOMContentLoaded", function () {

    const roomNoInput = document.getElementById("bookingRoomNo");

    if (roomNoInput) {
        roomNoInput.addEventListener(
            "input",
            autoFillBookingRoomDetails
        );
    }

});
function applyBookingFilters() {

    const searchBooking =
        document.getElementById("searchBooking").value.trim().toLowerCase();

    const bookingDate =
        document.getElementById("bookingDate").value;

    const status =
        document.getElementById("bookingStatusFilter").value;

    const paymentStatus =
        document.getElementById("paymentStatusFilter").value;

    const guests =
        document.getElementById("guestFilter").value;

    const rows =
        document.querySelectorAll("#bookingsTableBody tr");

    rows.forEach(function(row) {

        const bookingId =
            row.cells[0]?.innerText.trim().toLowerCase();

        const rowBookingDate =
            row.cells[4]?.innerText.trim();

        const rowGuests =
            parseInt(row.cells[6]?.innerText.trim()) || 0;

        const rowStatus =
            row.cells[8]?.innerText.trim();

        const rowPayment =
            row.cells[9]?.innerText.trim();


        // Search Booking
        const matchesBooking =
            !searchBooking ||
            bookingId.includes(searchBooking);


        // Booking Date
        let matchesDate = true;

        if (bookingDate) {

            const parts = bookingDate.split("-");

            const year = parts[0];
            const month = parts[1];
            const day = parts[2];

            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];

            const formattedDate =
                `${day}-${months[parseInt(month) - 1]}-${year}`;

            matchesDate =
                rowBookingDate === formattedDate ||
                rowBookingDate === bookingDate;
        }


        // Status
        const matchesStatus =
            !status ||
            rowStatus === status;


        // Payment
        const matchesPayment =
            !paymentStatus ||
            rowPayment === paymentStatus;


        // Guests
        let matchesGuests = true;

        if (guests === "1") {
            matchesGuests = rowGuests === 1;
        }
        else if (guests === "2") {
            matchesGuests = rowGuests === 2;
        }
        else if (guests === "3") {
            matchesGuests = rowGuests === 3;
        }
        else if (guests === "4") {
            matchesGuests = rowGuests >= 4;
        }


        // Show / Hide
        if (
            matchesBooking &&
            matchesDate &&
            matchesStatus &&
            matchesPayment &&
            matchesGuests
        ) {
            row.style.display = "table-row";
        }
        else {
            row.style.display = "none";
        }

    });
}


function resetBookingFilters() {

    document.getElementById("searchBooking").value = "";

    document.getElementById("bookingDate").value = "";

    document.getElementById("bookingStatusFilter").value = "";

    document.getElementById("paymentStatusFilter").value = "";

    document.getElementById("guestFilter").value = "";


    const rows =
        document.querySelectorAll("#bookingsTableBody tr");

    rows.forEach(function(row) {
        row.style.display = "table-row";
    });
}

/* ===== Modal Interactive Handlers ===== */
function openEditModal(bookingId) {
    const appData = readAppData();
    const booking = (appData.bookings || []).find(b => b.bookingId === bookingId) || {
        bookingId: bookingId,
        customerName: "Guest",
        roomNo: "101",
        roomType: "Luxury",
        checkIn: "29-Aug-2026",
        checkOut: "31-Aug-2026",
        amount: 10000,
        bookingStatus: "Confirmed",
        paymentStatus: "Paid"
    };

    document.getElementById("editItemKey").value = bookingId;
    document.getElementById("editBookingId").value = booking.bookingId;
    document.getElementById("editGuestName").value = booking.customerName || "Guest";
    document.getElementById("editRoomNo").value = booking.roomNo || "101";
    document.getElementById("editRoomType").value = booking.roomType || "Luxury";
    document.getElementById("editCheckIn").value = booking.checkIn || "29-Aug-2026";
    document.getElementById("editCheckOut").value = booking.checkOut || "31-Aug-2026";
    document.getElementById("editAmount").value = booking.amount || 10000;
    document.getElementById("editBookingStatus").value = booking.bookingStatus || "Confirmed";
    document.getElementById("editPaymentStatus").value = booking.paymentStatus || "Paid";

    document.getElementById("editModalOverlay").style.display = "flex";
}

function closeEditModal() {
    const el = document.getElementById("editModalOverlay");
    if (el) el.style.display = "none";
}

function saveEditBooking() {
    const bookingId = document.getElementById("editBookingId").value;
    const appData = readAppData();
    let index = appData.bookings.findIndex(b => b.bookingId === bookingId);

    const updatedBooking = {
        bookingId: bookingId,
        customerName: document.getElementById("editGuestName").value.trim(),
        roomNo: document.getElementById("editRoomNo").value.trim(),
        roomType: document.getElementById("editRoomType").value,
        checkIn: document.getElementById("editCheckIn").value.trim(),
        checkOut: document.getElementById("editCheckOut").value.trim(),
        amount: Number(document.getElementById("editAmount").value),
        bookingStatus: document.getElementById("editBookingStatus").value,
        paymentStatus: document.getElementById("editPaymentStatus").value,
        guests: 2
    };

    if (index !== -1) {
        appData.bookings[index] = updatedBooking;
    } else {
        appData.bookings.push(updatedBooking);
    }

    writeAppData(appData);
    refreshAllDashboardDataAndViews();
    closeEditModal();
    alert("Booking " + bookingId + " saved successfully!");
}

function deleteBooking(bookingId) {
    if (confirm("Are you sure you want to delete booking " + bookingId + "?")) {
        removeSharedBookingData(bookingId);
        refreshAllDashboardDataAndViews();
        alert("Booking " + bookingId + " deleted successfully!");
    }
}

function checkoutBooking(bookingId) {
    if (confirm("Check out guest for booking " + bookingId + "?")) {
        const appData = readAppData();
        const booking = appData.bookings.find(b => b.bookingId === bookingId);
        if (booking) {
            booking.bookingStatus = "Checked Out";
            writeAppData(appData);

            const rooms = getRoomList();
            const targetRoom = rooms.find(r => String(r.roomNo) === String(booking.roomNo));
            if (targetRoom) {
                targetRoom.status = "Available";
                localStorage.setItem("sayoraRooms", JSON.stringify(rooms));
            }

            refreshAllDashboardDataAndViews();
            alert("Guest checked out successfully! Room " + booking.roomNo + " is now available.");
        }
    }
}

function openViewModal(bookingId) {
    const appData = readAppData();
    const booking = appData.bookings.find(b => b.bookingId === bookingId) || {
        bookingId: bookingId || "BK557860",
        customerName: "Sindhu Priya",
        roomNo: "105",
        roomType: "Luxury",
        checkIn: "29-Aug-2026",
        checkOut: "31-Aug-2026",
        guests: 2,
        amount: 24000,
        bookingStatus: "Checked Out",
        paymentStatus: "Paid"
    };

    const container = document.getElementById("viewDetailsBody");
    if (container) {
        container.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:14px; text-align:left;">
                <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
                <p><strong>Customer Name:</strong> ${booking.customerName || "Guest"}</p>
                <p><strong>Room No:</strong> ${booking.roomNo || "-"}</p>
                <p><strong>Room Type:</strong> ${booking.roomType || "-"}</p>
                <p><strong>Check-In Date:</strong> ${booking.checkIn || "-"}</p>
                <p><strong>Check-Out Date:</strong> ${booking.checkOut || "-"}</p>
                <p><strong>Guests Count:</strong> ${booking.guests || 1}</p>
                <p><strong>Total Amount:</strong> ₹${Number(booking.amount || 0).toLocaleString("en-IN")}</p>
                <p><strong>Stay Status:</strong> <span class="status-pill status-green">${booking.bookingStatus || "Confirmed"}</span></p>
                <p><strong>Payment Status:</strong> <span class="status-pill status-green">${booking.paymentStatus || "Paid"}</span></p>
            </div>
        `;
    }
    const modal = document.getElementById("viewModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeViewModal() {
    const modal = document.getElementById("viewModalOverlay");
    if (modal) modal.style.display = "none";
}

function openInvoiceModal(bookingId) {
    const appData = readAppData();
    const booking = appData.bookings.find(b => b.bookingId === bookingId) || {
        bookingId: bookingId || "B001",
        customerName: "Ravi Kumar",
        roomNo: "105",
        roomType: "Luxury",
        checkIn: "29-Aug-2026",
        checkOut: "31-Aug-2026",
        amount: 25000,
        paymentStatus: "Paid"
    };

    const tax = Math.round(Number(booking.amount || 0) * 0.12);
    const grandTotal = Number(booking.amount || 0) + tax;

    const container = document.getElementById("printableInvoiceContent");
    if (container) {
        container.innerHTML = `
            <div style="font-family: Arial, sans-serif; color: #1e293b;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #2563eb; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <h2 style="margin:0; color:#2563eb;">SAYORA HOTELS</h2>
                        <p style="margin:2px 0 0 0; font-size:12px; color:#64748b;">Official Tax Invoice</p>
                    </div>
                    <div style="text-align:right;">
                        <p style="margin:0; font-weight:bold;">Invoice #: INV-${booking.bookingId}</p>
                        <p style="margin:2px 0 0 0; font-size:12px;">Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; font-size:13px; text-align:left;">
                    <div>
                        <p style="margin:0 0 4px 0;"><strong>Billed To:</strong> ${booking.customerName || 'Guest'}</p>
                        <p style="margin:0 0 4px 0;"><strong>Room No:</strong> ${booking.roomNo || '-'}</p>
                        <p style="margin:0;"><strong>Room Type:</strong> ${booking.roomType || '-'}</p>
                    </div>
                    <div>
                        <p style="margin:0 0 4px 0;"><strong>Check-In:</strong> ${booking.checkIn || '-'}</p>
                        <p style="margin:0 0 4px 0;"><strong>Check-Out:</strong> ${booking.checkOut || '-'}</p>
                        <p style="margin:0;"><strong>Payment Status:</strong> <span style="color:#16a34a; font-weight:bold;">${booking.paymentStatus || 'Paid'}</span></p>
                    </div>
                </div>
                <table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:13px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">Description</th>
                            <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:8px; border:1px solid #cbd5e1;">Room Accommodation Charges</td>
                            <td style="padding:8px; border:1px solid #cbd5e1; text-align:right;">₹${Number(booking.amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px; border:1px solid #cbd5e1;">GST / Taxes (12%)</td>
                            <td style="padding:8px; border:1px solid #cbd5e1; text-align:right;">₹${tax.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="font-weight:bold; background:#e2e8f0;">
                            <td style="padding:8px; border:1px solid #cbd5e1;">Total Payable</td>
                            <td style="padding:8px; border:1px solid #cbd5e1; text-align:right; color:#2563eb;">₹${grandTotal.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    const modal = document.getElementById("invoiceModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeInvoiceModal() {
    const modal = document.getElementById("invoiceModalOverlay");
    if (modal) modal.style.display = "none";
}

function openCollectPaymentModal(bookingId) {
    const appData = readAppData();
    const booking = appData.bookings.find(b => b.bookingId === bookingId) || {
        bookingId: bookingId || "BK489732",
        customerName: "Nagamani",
        amount: 8000
    };

    document.getElementById("collectBookingId").value = booking.bookingId;
    document.getElementById("collectGuestName").value = booking.customerName || "Guest";
    document.getElementById("collectAmountDue").value = `₹${Number(booking.amount || 8000).toLocaleString("en-IN")}`;
    document.getElementById("collectPaymentModalOverlay").style.display = "flex";
}

function closeCollectPaymentModal() {
    const modal = document.getElementById("collectPaymentModalOverlay");
    if (modal) modal.style.display = "none";
}

function confirmCollectPayment() {
    const bookingId = document.getElementById("collectBookingId").value;
    const mode = document.getElementById("collectPaymentMode").value;
    const appData = readAppData();
    const booking = appData.bookings.find(b => b.bookingId === bookingId);

    if (booking) {
        booking.paymentStatus = "Paid";
        writeAppData(appData);
    }

    refreshAllDashboardDataAndViews();
    closeCollectPaymentModal();
    alert(`Payment collected successfully via ${mode}!`);
}

function openReplyModal(reviewId) {
    const reviews = getStoredReviews();
    const review = reviews.find(r => r.id === reviewId) || { id: reviewId, name: "Guest", comment: "Good service", reply: "" };

    document.getElementById("replyReviewId").value = review.id;
    document.getElementById("replyReviewerName").value = review.name;
    document.getElementById("replyReviewComment").value = review.comment;
    document.getElementById("replyText").value = review.reply || "";
    document.getElementById("replyModalOverlay").style.display = "flex";
}

function closeReplyModal() {
    const modal = document.getElementById("replyModalOverlay");
    if (modal) modal.style.display = "none";
}

function confirmReplyReview() {
    const reviewId = document.getElementById("replyReviewId").value;
    const replyMsg = document.getElementById("replyText").value.trim();

    const reviews = getStoredReviews();
    const target = reviews.find(r => r.id === reviewId);

    if (target) {
        target.reply = replyMsg;
        localStorage.setItem("sayoraReviews", JSON.stringify(reviews));
        renderSharedReviewsTable();
        closeReplyModal();
        alert("Reply posted successfully!");
    }
}

/* Revenue Chart Dropdown Selector Listener */
document.addEventListener("change", function(e) {
    if (e.target && e.target.classList.contains("widget-select-dropdown")) {
        const value = e.target.value;
        const bars = document.querySelectorAll(".chart-bars-area .bar-column");
        if (bars.length >= 4) {
            if (value === "This Week") {
                bars[0].querySelector(".bar-fill").style.height = "60%";
                bars[0].querySelector(".bar-label").innerText = "Mon";
                bars[1].querySelector(".bar-fill").style.height = "85%";
                bars[1].querySelector(".bar-label").innerText = "Wed";
                bars[2].querySelector(".bar-fill").style.height = "70%";
                bars[2].querySelector(".bar-label").innerText = "Fri";
                bars[3].querySelector(".bar-fill").style.height = "95%";
                bars[3].querySelector(".bar-label").innerText = "Sun";
            } else if (value === "This Year") {
                bars[0].querySelector(".bar-fill").style.height = "50%";
                bars[0].querySelector(".bar-label").innerText = "Q1";
                bars[1].querySelector(".bar-fill").style.height = "70%";
                bars[1].querySelector(".bar-label").innerText = "Q2";
                bars[2].querySelector(".bar-fill").style.height = "85%";
                bars[2].querySelector(".bar-label").innerText = "Q3";
                bars[3].querySelector(".bar-fill").style.height = "100%";
                bars[3].querySelector(".bar-label").innerText = "Q4";
            } else {
                bars[0].querySelector(".bar-fill").style.height = "35%";
                bars[0].querySelector(".bar-label").innerText = "Week 1";
                bars[1].querySelector(".bar-fill").style.height = "55%";
                bars[1].querySelector(".bar-label").innerText = "Week 2";
                bars[2].querySelector(".bar-fill").style.height = "70%";
                bars[2].querySelector(".bar-label").innerText = "Week 3";
                bars[3].querySelector(".bar-fill").style.height = "90%";
                bars[3].querySelector(".bar-label").innerText = "Week 4";
            }
        }
    }
});

/* Master Initialization */
document.addEventListener("DOMContentLoaded", function() {
    refreshAllDashboardDataAndViews();
});

/* ==========================================================================
   PAGE-SPECIFIC RENDERERS, FILTERS AND ACTIONS FOR NEW 5 PAGES
   ========================================================================== */

/* Dynamic Modal Injector for Cross-Page View / Edit Overlays */
function ensureGlobalModalsExist() {
    if (!document.getElementById("viewModalOverlay")) {
        const viewModalDiv = document.createElement("div");
        viewModalDiv.id = "viewModalOverlay";
        viewModalDiv.className = "app-modal-overlay";
        viewModalDiv.innerHTML = `
            <div class="app-modal-card">
                <div class="app-modal-header">
                    <h3><i class="fa-solid fa-circle-info"></i> Details View</h3>
                    <button class="app-modal-close-btn" onclick="closeViewModal()">&times;</button>
                </div>
                <div id="viewDetailsBody" class="app-modal-body" style="padding: 16px;"></div>
                <div class="app-modal-footer">
                    <button type="button" class="btn-primary-action" onclick="closeViewModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(viewModalDiv);
    }

    if (!document.getElementById("editModalOverlay")) {
        const editModalDiv = document.createElement("div");
        editModalDiv.id = "editModalOverlay";
        editModalDiv.className = "app-modal-overlay";
        editModalDiv.innerHTML = `
            <div class="app-modal-card">
                <div class="app-modal-header">
                    <h3><i class="fa-solid fa-pen-to-square"></i> Edit Details</h3>
                    <button class="app-modal-close-btn" onclick="closeEditModal()">&times;</button>
                </div>
                <form class="app-modal-form" onsubmit="event.preventDefault(); saveEditBooking();">
                    <input type="hidden" id="editItemKey">
                    <input type="hidden" id="editBookingId">
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="editGuestName" required>
                        </div>
                        <div class="form-group">
                            <label>Room No.</label>
                            <input type="text" id="editRoomNo" required>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label>Room Type</label>
                            <select id="editRoomType">
                                <option value="Luxury">Luxury</option>
                                <option value="Deluxe">Deluxe</option>
                                <option value="Suite">Suite</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount (₹)</label>
                            <input type="number" id="editAmount" required>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label>Check-In Date</label>
                            <input type="text" id="editCheckIn" required>
                        </div>
                        <div class="form-group">
                            <label>Check-Out Date</label>
                            <input type="text" id="editCheckOut" required>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label>Stay Status</label>
                            <select id="editBookingStatus">
                                <option value="Confirmed">Confirmed</option>
                                <option value="Checked In">Checked In</option>
                                <option value="Checked Out">Checked Out</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Payment Status</label>
                            <select id="editPaymentStatus">
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                    </div>
                    <div class="app-modal-footer">
                        <button type="button" class="btn-secondary-action" onclick="closeEditModal()">Cancel</button>
                        <button type="submit" class="btn-primary-action">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(editModalDiv);
    }
}

/* Universal Table Pagination Helper */
const paginationStateMap = {};

function setupTablePagination(tbodyId, paginationId, rowsPerPage = 5) {
    const tbody = document.getElementById(tbodyId);
    const paginationContainer = document.getElementById(paginationId);
    if (!tbody || !paginationContainer) return;

    const allRows = Array.from(tbody.querySelectorAll("tr"));
    const visibleRows = allRows.filter(row => row.getAttribute("data-filtered-out") !== "true");

    if (visibleRows.length === 0) {
        paginationContainer.innerHTML = "";
        return;
    }

    let currentPage = paginationStateMap[tbodyId] || 1;
    const totalPages = Math.ceil(visibleRows.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    paginationStateMap[tbodyId] = currentPage;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    visibleRows.forEach((row, idx) => {
        if (idx >= start && idx < end) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });

    allRows.forEach(row => {
        if (row.getAttribute("data-filtered-out") === "true") {
            row.style.display = "none";
        }
    });

    paginationContainer.innerHTML = "";

    // Prev button
    const prevBtn = document.createElement("button");
    prevBtn.className = "page-num-btn";
    prevBtn.innerHTML = "&lt;";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            paginationStateMap[tbodyId] = currentPage - 1;
            setupTablePagination(tbodyId, paginationId, rowsPerPage);
        }
    };
    paginationContainer.appendChild(prevBtn);

    // Numbered buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = `page-num-btn ${i === currentPage ? "active" : ""}`;
        pageBtn.innerText = i;
        pageBtn.onclick = () => {
            paginationStateMap[tbodyId] = i;
            setupTablePagination(tbodyId, paginationId, rowsPerPage);
        };
        paginationContainer.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.className = "page-num-btn";
    nextBtn.innerHTML = "&gt;";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            paginationStateMap[tbodyId] = currentPage + 1;
            setupTablePagination(tbodyId, paginationId, rowsPerPage);
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// 1. CUSTOMERS PAGE
function renderCustomersPageTable() {
    ensureGlobalModalsExist();
    const tbody = document.getElementById("customersPageTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const customers = appData.customers || [];
    
    tbody.innerHTML = "";
    
    customers.forEach((c, idx) => {
        const row = document.createElement("tr");
        const cId = c.customerId || `CUS${String(idx + 1).padStart(3, "0")}`;
        const bookingId = c.bookingId || `BK557${860 + idx}`;

        row.innerHTML = `
            <td>${cId}</td>
            <td><strong>${c.customerName || "Guest"}</strong></td>
            <td>${c.phone || "9876543210"}</td>
            <td>${c.email || (c.customerName ? c.customerName.toLowerCase().replace(/\s+/g, "") + "@gmail.com" : "guest@gmail.com")}</td>
            <td><span class="status-pill status-blue">${c.type || "Regular"}</span></td>
            <td>${c.totalBookings || 1}</td>
            <td>${c.lastBooking || "29-Aug-2026"}</td>
            <td><span class="status-pill ${c.status === 'Inactive' ? 'status-orange' : 'status-green'}">${c.status || "Active"}</span></td>
            <td>
                <button type="button" class="action-btn btn-view" onclick="openViewModal('${bookingId}')">View</button>
                <button type="button" class="action-btn btn-edit" onclick="openEditModal('${bookingId}')">Edit</button>
                <button type="button" class="action-btn btn-delete" onclick="deleteBooking('${bookingId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupTablePagination("customersPageTableBody", "customersPagination", 5);
}

function filterCustomers() {
    const searchVal = (document.getElementById("searchCustomer")?.value || document.getElementById("searchCustomerInput")?.value || "").toLowerCase().trim();
    const typeVal = document.getElementById("customerTypeFilter")?.value || "";
    const rows = document.querySelectorAll("#customersPageTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const typeCell = row.cells[4]?.innerText.trim() || "";
        
        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesType = !typeVal || typeCell === typeVal;

        if (matchesSearch && matchesType) {
            row.removeAttribute("data-filtered-out");
        } else {
            row.setAttribute("data-filtered-out", "true");
        }
    });

    setupTablePagination("customersPageTableBody", "customersPagination", 5);
}

function openAddCustomerModal() {
    ensureGlobalModalsExist();
    const modal = document.getElementById("addCustomerModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeAddCustomerModal() {
    const modal = document.getElementById("addCustomerModalOverlay");
    if (modal) modal.style.display = "none";
}

function saveNewCustomer() {
    const name = document.getElementById("addCustName")?.value.trim();
    const phone = document.getElementById("addCustPhone")?.value.trim();
    const email = document.getElementById("addCustEmail")?.value.trim();
    const type = document.getElementById("addCustType")?.value || "Regular";

    if (!name || !phone) {
        alert("Please enter Customer Name and Phone Number.");
        return;
    }

    const appData = readAppData();
    const newCust = {
        customerId: `CUS${String(appData.customers.length + 1).padStart(3, "0")}`,
        customerName: name,
        phone: phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
        type: type,
        totalBookings: 1,
        lastBooking: "06-Sep-2026",
        status: "Active",
        bookingId: `BK${String(Math.floor(100000 + Math.random() * 900000))}`
    };

    appData.customers.unshift(newCust);
    writeAppData(appData);
    refreshAllDashboardDataAndViews();
    closeAddCustomerModal();
    alert("Customer added successfully!");
}

// 2. CHECK-IN PAGE
function renderCheckInPageTable() {
    ensureGlobalModalsExist();
    const tbody = document.getElementById("checkInPageTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const checkIns = (appData.bookings || []).filter(b => b.bookingStatus === "Checked In" || b.bookingStatus === "Confirmed");
    
    tbody.innerHTML = "";

    checkIns.forEach((item, index) => {
        const chkId = item.checkInId || `CHK${String(index + 1).padStart(3, "0")}`;
        const isCheckedIn = item.bookingStatus === "Checked In";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${chkId}</td>
            <td>${item.bookingId}</td>
            <td><strong>${item.customerName || "Guest"}</strong></td>
            <td>${item.roomNo || "101"}</td>
            <td>${item.roomType || "Luxury"}</td>
            <td>${item.checkIn || "29-Aug-2026"}</td>
            <td>${item.checkOut || "31-Aug-2026"}</td>
            <td>${item.guests || 1}</td>
            <td><span class="status-pill ${isCheckedIn ? 'status-green' : 'status-orange'}">${item.bookingStatus || "Confirmed"}</span></td>
            <td>
                ${isCheckedIn 
                    ? `<button type="button" class="action-btn btn-view" onclick="openViewModal('${item.bookingId}')">View</button>`
                    : `<button type="button" class="action-btn btn-checkin" onclick="confirmCheckInAction('${item.bookingId}')">Check-In</button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });

    setupTablePagination("checkInPageTableBody", "checkInPagination", 5);
}

function confirmCheckInAction(bookingId) {
    const appData = readAppData();
    const booking = appData.bookings.find(b => b.bookingId === bookingId);
    if (booking) {
        booking.bookingStatus = "Checked In";
        writeAppData(appData);
        refreshAllDashboardDataAndViews();
        alert(`Guest checked in successfully for Booking ${bookingId}!`);
    }
}

function filterCheckInsPage() {
    const searchVal = (document.getElementById("searchCheckIn")?.value || document.getElementById("searchCheckInInput")?.value || "").toLowerCase().trim();
    const dateVal = document.getElementById("checkInDateFilter")?.value || "";
    const rows = document.querySelectorAll("#checkInPageTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const checkInDate = row.cells[5]?.innerText.trim() || "";

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesDate = !dateVal || checkInDate === dateVal;

        if (matchesSearch && matchesDate) {
            row.removeAttribute("data-filtered-out");
        } else {
            row.setAttribute("data-filtered-out", "true");
        }
    });

    setupTablePagination("checkInPageTableBody", "checkInPagination", 5);
}

function openAddCheckInModal() {
    openNewCheckInModal();
}

function closeAddCheckInModal() {
    closeNewCheckInModal();
}

function openNewCheckInModal() {
    ensureGlobalModalsExist();
    const modal = document.getElementById("newCheckInModalOverlay") || document.getElementById("addCheckInModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeNewCheckInModal() {
    const modal1 = document.getElementById("newCheckInModalOverlay");
    const modal2 = document.getElementById("addCheckInModalOverlay");
    if (modal1) modal1.style.display = "none";
    if (modal2) modal2.style.display = "none";
}

function saveNewCheckIn() {
    const name = (document.getElementById("ciGuestName")?.value || document.getElementById("addChkName")?.value || "").trim();
    const roomNo = (document.getElementById("ciRoomNo")?.value || document.getElementById("addChkRoomNo")?.value || "").trim();
    const roomType = document.getElementById("ciRoomType")?.value || document.getElementById("addChkRoomType")?.value || "Luxury";
    const checkInDate = (document.getElementById("ciCheckInDate")?.value || document.getElementById("addChkDate")?.value || "31-Aug-2026").trim();
    const checkOutDate = (document.getElementById("ciCheckOutDate")?.value || document.getElementById("addChkOutDate")?.value || "02-Sep-2026").trim();
    const guests = Number(document.getElementById("ciGuests")?.value || document.getElementById("addChkGuests")?.value || 2);

    if (!name || !roomNo) {
        alert("Please enter Guest Name and Room Number.");
        return;
    }

    const bookingId = `BK${String(Math.floor(100000 + Math.random() * 900000))}`;
    const newBooking = {
        bookingId: bookingId,
        customerName: name,
        roomNo: roomNo,
        roomType: roomType,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests,
        amount: roomType === "Suite" ? 15000 : roomType === "Luxury" ? 10000 : 7000,
        bookingStatus: "Checked In",
        paymentStatus: "Paid"
    };

    syncSharedBookingData(newBooking);
    refreshAllDashboardDataAndViews();
    closeNewCheckInModal();
    alert(`Check-in recorded successfully for ${name} (Booking ${bookingId})!`);
}

// 3. CHECK-OUT PAGE
function renderCheckOutPageTable() {
    ensureGlobalModalsExist();
    const tbody = document.getElementById("checkOutPageTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const checkOuts = appData.bookings || [];

    tbody.innerHTML = "";

    checkOuts.forEach((item, index) => {
        const coutId = `COT${String(index + 1).padStart(3, "0")}`;
        const isCheckedOut = item.bookingStatus === "Checked Out";
        const roomAmt = Number(item.amount || 10000);
        const extraCharges = Math.round(roomAmt * 0.1);
        const totalAmt = roomAmt + extraCharges;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${coutId}</td>
            <td>${item.bookingId}</td>
            <td><strong>${item.customerName || "Guest"}</strong></td>
            <td>${item.roomNo || "101"}</td>
            <td>${item.roomType || "Luxury"}</td>
            <td>${item.checkOut || "31-Aug-2026"}</td>
            <td>${item.guests || 1}</td>
            <td>₹${roomAmt.toLocaleString("en-IN")}</td>
            <td>₹${totalAmt.toLocaleString("en-IN")}</td>
            <td><span class="status-pill ${isCheckedOut ? 'status-green' : 'status-orange'}">${isCheckedOut ? 'Checked-Out' : 'Pending'}</span></td>
            <td>
                ${isCheckedOut 
                    ? `<button type="button" class="action-btn btn-view" onclick="openViewModal('${item.bookingId}')">View</button>`
                    : `<button type="button" class="action-btn btn-checkout" onclick="checkoutBooking('${item.bookingId}')">Check-Out</button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });

    setupTablePagination("checkOutPageTableBody", "checkOutPagination", 5);
}

function filterCheckOutsPage() {
    const searchVal = (document.getElementById("searchCheckOut")?.value || document.getElementById("searchCheckOutInput")?.value || "").toLowerCase().trim();
    const dateVal = document.getElementById("checkOutDateFilter")?.value || "";
    const rows = document.querySelectorAll("#checkOutPageTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const checkOutDate = row.cells[5]?.innerText.trim() || "";

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesDate = !dateVal || checkOutDate === dateVal;

        if (matchesSearch && matchesDate) {
            row.removeAttribute("data-filtered-out");
        } else {
            row.setAttribute("data-filtered-out", "true");
        }
    });

    setupTablePagination("checkOutPageTableBody", "checkOutPagination", 5);
}

function openAddCheckOutModal() {
    openNewCheckOutModal();
}

function closeAddCheckOutModal() {
    closeNewCheckOutModal();
}

function openNewCheckOutModal() {
    ensureGlobalModalsExist();
    const modal = document.getElementById("newCheckOutModalOverlay") || document.getElementById("addCheckOutModalOverlay");
    const select = document.getElementById("coSelectBooking");

    if (select) {
        const appData = readAppData();
        const activeGuests = (appData.bookings || []).filter(b => b.bookingStatus !== "Checked Out" && b.bookingStatus !== "Cancelled");
        select.innerHTML = activeGuests.length
            ? activeGuests.map(b => `<option value="${b.bookingId}">${b.customerName || 'Guest'} (${b.bookingId} - Room ${b.roomNo || '101'})</option>`).join("")
            : `<option value="">No Active Checked-In Guests</option>`;
        populateCheckOutModalFields();
    }

    if (modal) modal.style.display = "flex";
}

function closeNewCheckOutModal() {
    const modal1 = document.getElementById("newCheckOutModalOverlay");
    const modal2 = document.getElementById("addCheckOutModalOverlay");
    if (modal1) modal1.style.display = "none";
    if (modal2) modal2.style.display = "none";
}

function populateCheckOutModalFields() {
    const select = document.getElementById("coSelectBooking");
    const roomAmtInput = document.getElementById("coRoomAmt");
    if (!select || !roomAmtInput) return;

    const bookingId = select.value;
    const appData = readAppData();
    const b = (appData.bookings || []).find(x => x.bookingId === bookingId);

    const amt = b ? Number(b.amount || 10000) : 10000;
    roomAmtInput.value = amt;
    calculateCheckOutTotal();
}

function calculateCheckOutTotal() {
    const roomAmt = Number(document.getElementById("coRoomAmt")?.value || 10000);
    const extra = Number(document.getElementById("coExtraCharges")?.value || 0);
    const discount = Number(document.getElementById("coDiscount")?.value || 0);
    const totalInput = document.getElementById("coTotalBill");
    if (totalInput) {
        totalInput.value = Math.max(0, roomAmt + extra - discount);
    }
}

function saveNewCheckOut() {
    const bookingId = document.getElementById("coSelectBooking")?.value || document.getElementById("addCoutBookingId")?.value.trim();
    if (!bookingId) {
        alert("Please select a valid Booking ID.");
        return;
    }

    checkoutBooking(bookingId);
    closeNewCheckOutModal();
}

// 4. PAYMENTS PAGE
function renderPaymentsPageTable() {
    ensureGlobalModalsExist();
    const tbody = document.getElementById("paymentsPageTableBody");
    if (!tbody) return;

    const appData = readAppData();
    const bookings = appData.bookings || [];

    tbody.innerHTML = "";

    bookings.forEach((item, index) => {
        const payId = `PAY${String(index + 1).padStart(3, "0")}`;
        const roomAmt = Number(item.amount || 10000);
        const extraCharges = Math.round(roomAmt * 0.1);
        const discount = 0;
        const totalAmt = roomAmt + extraCharges - discount;
        const method = index % 3 === 0 ? "Card" : index % 3 === 1 ? "UPI" : "Cash";
        const isPaid = item.paymentStatus === "Paid";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${payId}</td>
            <td>${item.bookingId}</td>
            <td><strong>${item.customerName || "Guest"}</strong></td>
            <td>${item.checkOut || "31-Aug-2026"}</td>
            <td>₹${roomAmt.toLocaleString("en-IN")}</td>
            <td>₹${extraCharges.toLocaleString("en-IN")}</td>
            <td>₹${discount}</td>
            <td><strong>₹${totalAmt.toLocaleString("en-IN")}</strong></td>
            <td>${method}</td>
            <td><span class="status-pill ${isPaid ? 'status-green' : 'status-orange'}">${isPaid ? 'Paid' : 'Pending'}</span></td>
            <td>
                <button type="button" class="action-btn btn-view" onclick="openInvoiceModal('${item.bookingId}')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupTablePagination("paymentsPageTableBody", "paymentsPagination", 5);
}

function filterPaymentsPage() {
    const searchVal = (document.getElementById("searchPayment")?.value || document.getElementById("searchPaymentInput")?.value || "").toLowerCase().trim();
    const dateVal = document.getElementById("paymentDateFilter")?.value || "";
    const rows = document.querySelectorAll("#paymentsPageTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const payDate = row.cells[3]?.innerText.trim() || "";

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesDate = !dateVal || payDate === dateVal;

        if (matchesSearch && matchesDate) {
            row.removeAttribute("data-filtered-out");
        } else {
            row.setAttribute("data-filtered-out", "true");
        }
    });

    setupTablePagination("paymentsPageTableBody", "paymentsPagination", 5);
}

function openAddPaymentModal() {
    ensureGlobalModalsExist();
    const modal = document.getElementById("addPaymentModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeAddPaymentModal() {
    const modal = document.getElementById("addPaymentModalOverlay");
    if (modal) modal.style.display = "none";
}

function saveNewPayment() {
    const name = (document.getElementById("pmtCustName")?.value || "").trim();
    const bookingId = (document.getElementById("pmtBookingId")?.value || document.getElementById("addPayBookingId")?.value || "").trim();
    const roomAmt = Number(document.getElementById("pmtRoomAmt")?.value || document.getElementById("addPayAmount")?.value || 12000);
    const extra = Number(document.getElementById("pmtExtra")?.value || 1500);
    const discount = Number(document.getElementById("pmtDiscount")?.value || 0);
    const method = document.getElementById("pmtMethod")?.value || document.getElementById("addPayMethod")?.value || "Card";

    if (!bookingId) {
        alert("Please enter Booking ID.");
        return;
    }

    const appData = readAppData();
    let booking = appData.bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
        booking = {
            bookingId: bookingId,
            customerName: name || "Guest",
            roomNo: "105",
            roomType: "Luxury",
            checkIn: "29-Aug-2026",
            checkOut: "31-Aug-2026",
            amount: roomAmt,
            bookingStatus: "Checked Out",
            paymentStatus: "Paid"
        };
        appData.bookings.unshift(booking);
    } else {
        booking.paymentStatus = "Paid";
    }

    writeAppData(appData);
    refreshAllDashboardDataAndViews();
    closeAddPaymentModal();
    alert(`Payment recorded successfully via ${method}!`);
}

// 5. REVIEWS PAGE
function getStoredReviews() {
    try {
        const saved = JSON.parse(localStorage.getItem("sayoraReviews")) || [];
        if (Array.isArray(saved) && saved.length > 0) return saved;

        const defaultReviews = [
            { id: "REV001", name: "Sindhu", bookingId: "BK557680", roomNo: "105", rating: 5, review: "Excellent stay and wonderful hospitality!", date: "31-Aug-2026", status: "Published" },
            { id: "REV002", name: "Ravi Kumar", bookingId: "BK557879", roomNo: "101", rating: 5, review: "Very good service and quick check-in.", date: "31-Aug-2026", status: "Published" },
            { id: "REV003", name: "Priya Sharma", bookingId: "BK557878", roomNo: "102", rating: 4, review: "Clean rooms and nice room service.", date: "31-Aug-2026", status: "Published" },
            { id: "REV004", name: "Anjali Mehta", bookingId: "BK557877", roomNo: "201", rating: 5, review: "Amazing experience, will visit again!", date: "01-Sep-2026", status: "Published" },
            { id: "REV005", name: "Mohan Reddy", bookingId: "BK557876", roomNo: "221", rating: 3, review: "Average food quality, room was good.", date: "01-Sep-2026", status: "Pending" }
        ];
        localStorage.setItem("sayoraReviews", JSON.stringify(defaultReviews));
        return defaultReviews;
    } catch(e) {
        return [];
    }
}

function renderReviewsPageTable() {
    ensureGlobalModalsExist();
    const tbody = document.getElementById("reviewsPageTableBody");
    if (!tbody) return;

    const reviews = getStoredReviews();
    tbody.innerHTML = "";

    reviews.forEach((r) => {
        const count = typeof r.rating === 'number' ? r.rating : (String(r.rating || '').match(/★/g) || []).length || 5;
        let starsHtml = "";
        for (let i = 0; i < 5; i++) {
            if (i < count) {
                starsHtml += `<i class="fa-solid fa-star" style="color: #f59e0b; font-size: 15px; margin-right: 2px;"></i>`;
            } else {
                starsHtml += `<i class="fa-regular fa-star" style="color: #cbd5e1; font-size: 15px; margin-right: 2px;"></i>`;
            }
        }
        const isPublished = r.status === "Published";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${r.id}</td>
            <td><strong>${r.name || "Guest"}</strong></td>
            <td>${r.bookingId || "BK557860"}</td>
            <td>${r.roomNo || "105"}</td>
            <td style="white-space: nowrap;">${starsHtml}</td>
            <td>${r.review || "Great experience"}</td>
            <td>${r.date || "31-Aug-2026"}</td>
            <td><span class="status-pill ${isPublished ? 'status-green' : 'status-orange'}">${r.status || 'Published'}</span></td>
            <td>
                <button type="button" class="action-btn btn-view" onclick="openReplyModal('${r.id}')">Reply</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupTablePagination("reviewsPageTableBody", "reviewsPagination", 5);
}

function filterReviewsPage() {
    const searchVal = (document.getElementById("searchReview")?.value || document.getElementById("searchReviewInput")?.value || "").toLowerCase().trim();
    const ratingVal = document.getElementById("ratingFilter")?.value || "";
    const rows = document.querySelectorAll("#reviewsPageTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const starIcons = row.querySelectorAll(".fa-star.fa-solid").length;

        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesRating = !ratingVal || String(starIcons) === ratingVal;

        if (matchesSearch && matchesRating) {
            row.removeAttribute("data-filtered-out");
        } else {
            row.setAttribute("data-filtered-out", "true");
        }
    });

    setupTablePagination("reviewsPageTableBody", "reviewsPagination", 5);
}

function openAddReviewModal() {
    ensureGlobalModalsExist();
    const modal = document.getElementById("addReviewModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeAddReviewModal() {
    const modal = document.getElementById("addReviewModalOverlay");
    if (modal) modal.style.display = "none";
}

function saveNewReview() {
    const name = (document.getElementById("revCustName")?.value || document.getElementById("addRevName")?.value || "").trim();
    const bookingId = (document.getElementById("revBookingId")?.value || document.getElementById("addRevBookingId")?.value || "BK557860").trim();
    const roomNo = (document.getElementById("revRoomNo")?.value || document.getElementById("addRevRoomNo")?.value || "105").trim();
    const ratingStr = document.getElementById("revRating")?.value || "5";
    const ratingNum = ratingStr.includes("★") ? (ratingStr.match(/★/g) || []).length : Number(ratingStr) || 5;
    const comment = (document.getElementById("revComment")?.value || document.getElementById("addRevComment")?.value || "").trim();

    if (!name || !comment) {
        alert("Please enter Name and Review comment.");
        return;
    }

    const reviews = getStoredReviews();
    const newRev = {
        id: `REV${String(reviews.length + 1).padStart(3, "0")}`,
        name: name,
        bookingId: bookingId,
        roomNo: roomNo,
        rating: ratingNum,
        review: comment,
        date: "06-Sep-2026",
        status: "Published"
    };

    reviews.unshift(newRev);
    localStorage.setItem("sayoraReviews", JSON.stringify(reviews));
    renderReviewsPageTable();
    closeAddReviewModal();
    alert("Review submitted successfully!");
}