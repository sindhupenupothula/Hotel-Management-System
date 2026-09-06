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
    if (document.getElementById("dashboardHome")) document.getElementById("dashboardHome").style.display = "block";
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
    const tbody = document.getElementById("bookingsTableBody");
    if (!tbody) return;

    const appData = readAppData();
    if (appData.bookings.length) {
        renderSharedBookingsTable();
        return;
    }

    tbody.innerHTML = "";

    const names = [
        "Ravi Kumar", "Priya", "Ramesh", "Suresh", "Anjali",
        "Kiran", "Lakshmi", "Rahul", "Sneha", "Arjun",
        "Pooja", "Vijay", "Swathi", "Naveen", "Divya",
        "Sai Kumar", "Keerthi", "Manoj", "Harika", "Rohit"
    ];

    const roomTypes = ["Luxury", "Deluxe", "Suite"];

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

    for (let i = 1; i <= 85; i++) {
        let status;
        let checkIn;
        let checkOut;

        if (i <= 12) {
            status = "Confirmed";
            checkIn = formatDate(today);
            checkOut = formatDate(addDays(today, 2));
        } else if (i <= 65) {
            status = "Confirmed";
            const oldDate = addDays(today, -(i - 12));
            checkIn = formatDate(oldDate);
            checkOut = formatDate(addDays(oldDate, 2));
        } else if (i <= 73) {
            status = "Cancelled";
            const oldDate = addDays(today, -(i - 20));
            checkIn = formatDate(oldDate);
            checkOut = formatDate(addDays(oldDate, 2));
        } else {
            status = "Pending";
            const futureDate = addDays(today, i - 60);
            checkIn = formatDate(futureDate);
            checkOut = formatDate(addDays(futureDate, 2));
        }

        const name = names[(i - 1) % names.length];
        const roomType = roomTypes[(i - 1) % roomTypes.length];
        const roomNo = 101 + ((i - 1) % 248);
        const guests = 1 + ((i - 1) % 4);
        const priceMap = {
            Luxury: 12000,
            Deluxe: 8000,
            Suite: 16000
        };
        const amount = priceMap[roomType] * guests;
        const paymentStatus = i % 2 === 0 ? "Paid" : "Pending";
        const bookingId = `BK${String(26210 + i).padStart(6, "0")}`;

        const row = document.createElement("tr");
        row.dataset.bookingId = bookingId;
        row.innerHTML = `
            <td>${bookingId}</td>
            <td>${name}</td>
            <td>${roomNo}</td>
            <td>${roomType}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td>${guests}</td>
            <td>₹${Number(amount).toLocaleString("en-IN")}</td>
            <td>${status}</td>
            <td>${paymentStatus}</td>
            <td>
                <button type="button" class="edit-booking-btn">Edit</button>
                <button type="button" class="delete-booking-btn">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    }

    writeAppData({ bookings: [], customers: [], dashboard: { totalBookings: 0, totalCustomers: 0, totalRevenue: 0 } });
    setTimeout(() => {
        const fallbackBookings = Array.from(tbody.querySelectorAll("tr")).map((row) => ({
            bookingId: row.dataset.bookingId,
            customerName: row.cells[1]?.textContent.trim(),
            roomNo: row.cells[2]?.textContent.trim(),
            roomType: row.cells[3]?.textContent.trim(),
            checkIn: row.cells[4]?.textContent.trim(),
            checkOut: row.cells[5]?.textContent.trim(),
            guests: row.cells[6]?.textContent.trim(),
            amount: row.cells[7]?.textContent.replace(/[₹,]/g, "").trim(),
            bookingStatus: row.cells[8]?.textContent.trim(),
            paymentStatus: row.cells[9]?.textContent.trim()
        }));

        syncSharedBookingData(fallbackBookings[0]);
        if (fallbackBookings.length > 1) {
            fallbackBookings.slice(1).forEach((booking) => syncSharedBookingData(booking));
        }
    }, 0);
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