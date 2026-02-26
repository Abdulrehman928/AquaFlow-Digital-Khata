// ============================================
// FILE: admin.js
// SIMPLE JavaScript - Har function 30-50 lines
// ============================================

// Global variables (simple)
var currentUser = null;
var demoData = null;
var currentPage = 1;
var rowsPerPage = 5;

// ===== 1. INIT - Pehle yeh chalta hai =====
function initAdmin() {
    console.log("Admin Dashboard starting...");
    
    // Check login
    var user = DB.getSessionUser();
    if (!user) {
        window.location.href = "../login.html";
        return;
    }
    
    currentUser = user;
    
    // Load data
    loadData();
    
    // If data failed to load, don't proceed
    if (!demoData) {
        return;
    }
    
    // Show date
    var dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.innerText = new Date().toDateString();
    }
    
    // Setup events
    setupEvents();
    
    // FEATURE 10: Track session
    updateLastLogin();
    
    // Refresh all sections
    refreshAll();
}

// ===== 2. DATA LOAD KARO =====
function loadData() {
    var data = DB.getMainData();
    if (!data) {
        alert("No data found! Please check your database.js and localStorage.");
        return;
    }
    demoData = data;
}

// ===== 3. REFRESH SAB KUCH =====
function refreshAll() {
    // Step 1: Show the spinner
    showSpinner();
    
    // Step 2: Use setTimeout to "fake" a short delay 
    // This makes the app feel like it's doing real work
    setTimeout(function() {
        // Try to update everything, catch errors to make sure spinner HIDES
        try {
            updateKPIs();
            updateOrders();
            updateCustomers();
            updateInventory();
            updateBilling();
            updateCashMatch();
            updateFeedback();
            updateAuditLog();
            checkHealthAlerts();
            checkLowStockAlerts();
            updateSalesChart();
            updateBottleTracker();
        } catch (err) {
            console.error("Refresh error:", err);
        }
        
        // Step 3: Hide the spinner after work is done
        hideSpinner();
    }, 600); // 600ms gap
}

// ===== 4. KPI CARDS (Top row + Extra row) =====
function updateKPIs() {
    var orders = demoData.orders || [];
    var customers = demoData.customers || [];
    var inventory = demoData.inventory || [];
    var feedback = demoData.feedback || [];
    
    // 1. Calculations for top row
    var totalOrders = orders.length;
    var pendingOrders = 0;
    var totalRevenue = 0;
    
    for (var i = 0; i < orders.length; i++) {
        totalRevenue = totalRevenue + (orders[i].amount || 0);
        if (orders[i].status === "Pending") {
            pendingOrders++;
        }
    }
    
    // 2. Calculations for extra row (Feature 9)
    var totalBalance = 0;
    for (var j = 0; j < customers.length; j++) {
        totalBalance = totalBalance + (customers[j].balance || 0);
    }
    
    var lowStockCount = 0;
    for (var k = 0; k < inventory.length; k++) {
        if (inventory[k].stock <= 10) {
            lowStockCount++;
        }
    }
    
    var avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    var totalRating = 0;
    for (var m = 0; m < feedback.length; m++) {
        totalRating = totalRating + (feedback[m].rating || 0);
    }
    var avgRating = feedback.length > 0 ? (totalRating / feedback.length) : 0;
    
    // Update HTML for Top Row
    document.getElementById('kpiOrders').innerText = totalOrders;
    document.getElementById('kpiCustomers').innerText = customers.length;
    document.getElementById('kpiPending').innerText = pendingOrders;
    document.getElementById('kpiRevenue').innerText = "PKR " + totalRevenue;
    
    // Update HTML for Extra Row (Feature 9)
    document.getElementById('kpiLowStock').innerText = lowStockCount;
    document.getElementById('kpiBalance').innerText = "PKR " + totalBalance;
    document.getElementById('kpiAvgOrder').innerText = "PKR " + Math.round(avgOrderValue);
    document.getElementById('kpiRating').innerText = avgRating.toFixed(1) + " / 5";
}

// ===== 5. ORDERS TABLE =====
function updateOrders() {
    var tbody = document.getElementById('ordersTableBody');
    var dashboardBody = document.getElementById('dashboardTableBody');
    if (!tbody || !demoData) return;
    
    var ords = demoData.orders || [];
    
    // FEATURE 7: Check if empty
    if (checkEmpty(ords, 'ordersTableBody', 5, "No orders found")) {
        if (dashboardBody) dashboardBody.innerHTML = document.getElementById('ordersTableBody').innerHTML;
        return;
    }

    // Pagination logic
    var start = (currentPage - 1) * rowsPerPage;
    var end = start + rowsPerPage;
    var pageData = ords.slice(start, end);
    
    var html = "";
    for (var i = 0; i < pageData.length; i++) {
        var o = pageData[i];
        var customer = DB.findById(demoData.customers, o.customerId);
        var name = customer ? customer.name : "Unknown";
        
        // Status badge color
        var badgeClass = "bg-secondary";
        if (o.status === "Completed") badgeClass = "bg-success";
        if (o.status === "Pending") badgeClass = "bg-warning";
        if (o.status === "In Transit") badgeClass = "bg-info";
        if (o.status === "Cancelled") badgeClass = "bg-danger";
        
        html += "<tr>" +
            "<td>ORD-" + o.id + "</td>" +
            "<td>" + name + "</td>" +
            "<td>" + (o.item || "19L Bottle") + " x" + (o.qty || 1) + "</td>" +
            "<td><span class='badge " + badgeClass + "'>" + o.status + "</span></td>" +
            "<td>" +
                "<button class='btn btn-sm btn-outline-info' onclick='viewOrderDetails(" + o.id + ")'>Details</button>" +
                "<button class='btn btn-sm btn-outline-success ms-1' onclick='updateOrderStatus(" + o.id + ")'>Status</button>" +
            "</td>" +
            "</tr>";
    }
    
    tbody.innerHTML = html;
    if (dashboardBody) dashboardBody.innerHTML = html; // Dashboard shows same (first page)

    updatePaginationButtons();
}

function updatePaginationButtons() {
    var totalPages = Math.ceil((demoData.orders || []).length / rowsPerPage);
    var paginationHtml = '<div class="pagination-btns">';
    
    for (var i = 1; i <= totalPages; i++) {
        var activeClass = (i === currentPage ? 'active' : '');
        paginationHtml += '<button class="page-btn ' + activeClass + '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    paginationHtml += '</div>';
    
    var pagContainer = document.getElementById('pagination');
    if (pagContainer) pagContainer.innerHTML = paginationHtml;
}

function goToPage(page) {
    currentPage = page;
    updateOrders();
}

// ============================================
// CUSTOMER MANAGEMENT - COMPLETE FIXED CODE
// ============================================

// Global variables for pagination
var customerCurrentPage = 1;
var customerRowsPerPage = 5;
var filteredCustomers = [];

// ===== TOGGLE ADD CUSTOMER FORM =====
function toggleCustomerForm() {
  var form = document.getElementById('addCustomerForm');
  if (!form) return;
  
  if (form.style.display === 'none' || form.style.display === '') {
    form.style.display = 'block';
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    form.style.display = 'none';
    // Clear form
    document.getElementById('newCustName').value = '';
    document.getElementById('newCustPhone').value = '';
    document.getElementById('newCustArea').value = 'Gulshan';
  }
}

// ===== ADD CUSTOMER =====
function addCustomer() {
  // Get values
  var name = document.getElementById('newCustName').value.trim();
  var phone = document.getElementById('newCustPhone').value.trim();
  var area = document.getElementById('newCustArea').value;
  
  // Validation
  if (!name) {
    alert('Please enter customer name');
    document.getElementById('newCustName').focus();
    return;
  }
  
  if (!phone) {
    alert('Please enter phone number');
    document.getElementById('newCustPhone').focus();
    return;
  }
  
  // Simple phone validation
  if (phone.length < 10) {
    alert('Please enter a valid phone number');
    return;
  }
  
  // Generate new ID
  var newId = DB.nextId(demoData.customers);
  
  // Create customer object
  var newCustomer = {
    id: newId,
    name: name,
    phone: phone,
    area: area || 'General',
    balance: 0,
    status: 'Active',
    lastOrder: new Date().toISOString().split('T')[0],
    email: '',
    totalOrders: 0
  };
  
  // Add to data
  demoData.customers.push(newCustomer);
  
  // Save to database
  DB.saveMainData(demoData);
  
  // Refresh table
  filterCustomers(); // Reset filters
  customerCurrentPage = 1;
  updateCustomers();
  
  // Hide form and show success
  toggleCustomerForm();
  
  // Show success message
  showToast('Customer added successfully!', 'success');
}

// ===== UPDATE CUSTOMERS TABLE =====
function updateCustomers() {
  var tbody = document.getElementById('customersTableBody');
  if (!tbody || !demoData) return;
  
  // Get data to display (filtered or all)
  var customersToShow = filteredCustomers.length > 0 ? filteredCustomers : demoData.customers;
  var totalCustomers = customersToShow.length;
  
  // Update total count
  document.getElementById('totalCount').innerText = totalCustomers;
  
  // Check if empty
  if (checkEmpty(customersToShow, 'customersTableBody', 6, 'No customers found')) {
    document.getElementById('startCount').innerText = '0';
    document.getElementById('endCount').innerText = '0';
    document.getElementById('customerPagination').innerHTML = '';
    return;
  }
  
  // Pagination logic
  var start = (customerCurrentPage - 1) * customerRowsPerPage;
  var end = Math.min(start + customerRowsPerPage, totalCustomers);
  var pageData = customersToShow.slice(start, end);
  
  // Update showing counts
  document.getElementById('startCount').innerText = totalCustomers > 0 ? start + 1 : 0;
  document.getElementById('endCount').innerText = end;
  
  // Generate table HTML
  var html = '';
  for (var i = 0; i < pageData.length; i++) {
    var c = pageData[i];
    var rowNum = start + i + 1;
    
    // Status badge
    var statusClass = c.status === 'Active' ? 'bg-success' : 'bg-secondary';
    
    // Format phone
    var phone = c.phone || 'No phone';
    
    // Format balance with color
    var balanceClass = c.balance > 5000 ? 'text-danger fw-bold' : (c.balance > 0 ? 'text-warning' : 'text-muted');
    
    html += '<tr>' +
      '<td class="ps-4">' + rowNum + '</td>' +
      '<td>' +
        '<div><strong>' + c.name + '</strong></div>' +
        '<div class="small text-muted"><i class="bi bi-telephone me-1"></i>' + phone + '</div>' +
        (c.email ? '<div class="small text-muted"><i class="bi bi-envelope me-1"></i>' + c.email + '</div>' : '') +
      '</td>' +
      '<td>' +
        '<div><span class="badge ' + statusClass + '">' + (c.status || 'Active') + '</span></div>' +
        '<div class="small text-muted mt-1">' + (c.area || 'N/A') + '</div>' +
      '</td>' +
      '<td class="' + balanceClass + '"><strong>PKR ' + (c.balance || 0).toLocaleString() + '</strong></td>' +
      '<td>' + (c.lastOrder || 'N/A') + '</td>' +
      '<td class="text-end pe-4">' +
        '<button class="btn btn-sm btn-outline-primary me-1" onclick="viewCustomerBill(' + c.id + ')" title="View Bill">' +
          '<i class="bi bi-receipt"></i>' +
        '</button>' +
        '<button class="btn btn-sm btn-outline-success me-1" onclick="editCustomer(' + c.id + ')" title="Edit">' +
          '<i class="bi bi-pencil"></i>' +
        '</button>' +
        '<button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(' + c.id + ')" title="Delete">' +
          '<i class="bi bi-trash"></i>' +
        '</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
  
  // Update pagination buttons
  updateCustomerPagination(totalCustomers);
}

// ===== UPDATE PAGINATION BUTTONS =====
function updateCustomerPagination(totalItems) {
  var totalPages = Math.ceil(totalItems / customerRowsPerPage);
  var pagContainer = document.getElementById('customerPagination');
  
  if (totalPages <= 1) {
    pagContainer.innerHTML = '';
    return;
  }
  
  var pagHtml = '';
  
  // Previous button
  pagHtml += '<button class="page-btn' + (customerCurrentPage === 1 ? ' disabled' : '') + '" ' +
            (customerCurrentPage > 1 ? 'onclick="goToCustomerPage(' + (customerCurrentPage - 1) + ')"' : 'disabled') + '>' +
            '<i class="bi bi-chevron-left"></i></button>';
  
  // Page numbers
  for (var i = 1; i <= totalPages; i++) {
    pagHtml += '<button class="page-btn' + (i === customerCurrentPage ? ' active' : '') + '" ' +
              'onclick="goToCustomerPage(' + i + ')">' + i + '</button>';
  }
  
  // Next button
  pagHtml += '<button class="page-btn' + (customerCurrentPage === totalPages ? ' disabled' : '') + '" ' +
            (customerCurrentPage < totalPages ? 'onclick="goToCustomerPage(' + (customerCurrentPage + 1) + ')"' : 'disabled') + '>' +
            '<i class="bi bi-chevron-right"></i></button>';
  
  pagContainer.innerHTML = pagHtml;
}

// ===== GO TO PAGE =====
function goToCustomerPage(page) {
  customerCurrentPage = page;
  updateCustomers();
}

// ===== SEARCH CUSTOMERS =====
function searchCustomers() {
  var searchText = document.getElementById('searchCustomers').value.toLowerCase().trim();
  
  if (searchText === '') {
    // If search empty, just apply filters
    filterCustomers();
    return;
  }
  
  var allCustomers = demoData.customers || [];
  filteredCustomers = [];
  
  for (var i = 0; i < allCustomers.length; i++) {
    var c = allCustomers[i];
    var nameMatch = c.name.toLowerCase().includes(searchText);
    var phoneMatch = c.phone ? c.phone.includes(searchText) : false;
    
    if (nameMatch || phoneMatch) {
      filteredCustomers.push(c);
    }
  }
  
  // Apply status/area filters on top of search
  applyAdditionalFilters();
  
  customerCurrentPage = 1;
  updateCustomers();
}

// ===== FILTER CUSTOMERS =====
function filterCustomers() {
  var statusFilter = document.getElementById('statusFilter').value;
  var areaFilter = document.getElementById('areaFilter').value;
  var searchText = document.getElementById('searchCustomers').value.toLowerCase().trim();
  
  var allCustomers = demoData.customers || [];
  filteredCustomers = [];
  
  for (var i = 0; i < allCustomers.length; i++) {
    var c = allCustomers[i];
    
    // Status filter
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      continue;
    }
    
    // Area filter
    if (areaFilter !== 'all' && c.area !== areaFilter) {
      continue;
    }
    
    // Search filter (if any)
    if (searchText !== '') {
      var nameMatch = c.name.toLowerCase().includes(searchText);
      var phoneMatch = c.phone ? c.phone.includes(searchText) : false;
      if (!nameMatch && !phoneMatch) {
        continue;
      }
    }
    
    filteredCustomers.push(c);
  }
  
  customerCurrentPage = 1;
  updateCustomers();
}

// ===== APPLY ADDITIONAL FILTERS (helper) =====
function applyAdditionalFilters() {
  var statusFilter = document.getElementById('statusFilter').value;
  var areaFilter = document.getElementById('areaFilter').value;
  
  if (statusFilter === 'all' && areaFilter === 'all') {
    return; // No additional filters
  }
  
  var tempFiltered = [];
  for (var i = 0; i < filteredCustomers.length; i++) {
    var c = filteredCustomers[i];
    
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      continue;
    }
    
    if (areaFilter !== 'all' && c.area !== areaFilter) {
      continue;
    }
    
    tempFiltered.push(c);
  }
  
  filteredCustomers = tempFiltered;
}

// ===== EDIT CUSTOMER =====
function editCustomer(customerId) {
  var customer = DB.findById(demoData.customers, customerId);
  if (!customer) {
    alert('Customer not found!');
    return;
  }
  
  // Fill form
  document.getElementById('editCustId').value = customer.id;
  document.getElementById('editCustName').value = customer.name;
  document.getElementById('editCustPhone').value = customer.phone;
  document.getElementById('editCustArea').value = customer.area || '';
  document.getElementById('editCustStatus').value = customer.status || 'Active';
  document.getElementById('editCustEmail').value = customer.email || '';
  
  // Show modal
  var modalEl = document.getElementById('editCustomerModal');
  var modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// ===== SAVE CUSTOMER EDIT =====
function saveCustomerEdit() {
  var id = parseInt(document.getElementById('editCustId').value);
  var name = document.getElementById('editCustName').value.trim();
  var phone = document.getElementById('editCustPhone').value.trim();
  var area = document.getElementById('editCustArea').value;
  var status = document.getElementById('editCustStatus').value;
  var email = document.getElementById('editCustEmail').value.trim();
  
  if (!name || !phone) {
    alert('Name and Phone are required!');
    return;
  }
  
  // Find and update
  for (var i = 0; i < demoData.customers.length; i++) {
    if (demoData.customers[i].id === id) {
      demoData.customers[i].name = name;
      demoData.customers[i].phone = phone;
      demoData.customers[i].area = area;
      demoData.customers[i].status = status;
      demoData.customers[i].email = email;
      break;
    }
  }
  
  // Save
  DB.saveMainData(demoData);
  
  // Refresh
  filterCustomers(); // Reset filters to show updated data
  updateCustomers();
  
  // Hide modal
  var modalEl = document.getElementById('editCustomerModal');
  var modal = bootstrap.Modal.getInstance(modalEl);
  modal.hide();
  
  showToast('Customer updated successfully!', 'success');
}

// ===== DELETE CUSTOMER =====
function deleteCustomer(customerId) {
  // Show confirmation with details
  var customer = DB.findById(demoData.customers, customerId);
  if (!customer) return;
  
  var confirmMsg = 'Are you sure you want to delete "' + customer.name + '"?\n';
  confirmMsg += 'This action cannot be undone!';
  
  if (!confirm(confirmMsg)) return;
  
  // Find and remove
  for (var i = 0; i < demoData.customers.length; i++) {
    if (demoData.customers[i].id === customerId) {
      demoData.customers.splice(i, 1);
      break;
    }
  }
  
  // Save
  DB.saveMainData(demoData);
  
  // Refresh
  filterCustomers();
  updateCustomers();
  
  showToast('Customer deleted successfully!', 'warning');
}

// ===== VIEW CUSTOMER BILL =====
function viewCustomerBill(customerId) {
  viewInvoice(customerId); // Reuse existing function
}

// ===== REFRESH CUSTOMERS =====
function refreshCustomers() {
  // Reset all filters
  document.getElementById('searchCustomers').value = '';
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('areaFilter').value = 'all';
  
  filteredCustomers = [];
  customerCurrentPage = 1;
  
  updateCustomers();
  
  showToast('Customer list refreshed', 'info');
}

// ===== SHOW TOAST MESSAGE =====
function showToast(message, type) {
  // Simple alert for now (you can enhance this later)
  alert(message);
}

// ===== EXPORT CUSTOMERS =====
function exportCustomers() {
  var customersToExport = filteredCustomers.length > 0 ? filteredCustomers : demoData.customers;
  
  if (customersToExport.length === 0) {
    alert('No customers to export!');
    return;
  }
  
  // Create CSV content
  var csv = 'ID,Name,Phone,Email,Area,Status,Balance,Last Order,Total Orders\n';
  
  for (var i = 0; i < customersToExport.length; i++) {
    var c = customersToExport[i];
    csv += c.id + ',' +
           '"' + c.name + '",' +
           '"' + (c.phone || '') + '",' +
           '"' + (c.email || '') + '",' +
           '"' + (c.area || '') + '",' +
           (c.status || 'Active') + ',' +
           (c.balance || 0) + ',' +
           (c.lastOrder || '') + ',' +
           (c.totalOrders || 0) + '\n';
  }
  
  // Download
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'customers-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// ===== 16. SWITCH SECTIONS =====
function switchSection(sectionId) {
    // Hide all
    var sections = document.querySelectorAll('.admin-section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.add('d-none');
    }
    
    // Show selected
    var target = document.getElementById(sectionId);
    if (target) target.classList.remove('d-none');
    
    // Update nav
    var navs = document.querySelectorAll('.nav-link');
    for (var j = 0; j < navs.length; j++) {
        if (navs[j].getAttribute('data-section') === sectionId) {
            navs[j].classList.add('active');
        } else {
            navs[j].classList.remove('active');
        }
    }
}

// ===== 17. SETUP EVENTS =====
function setupEvents() {
    // Nav clicks
    var navBtns = document.querySelectorAll('.nav-link[data-section]');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].onclick = function() {
            var id = this.getAttribute('data-section');
            switchSection(id);
        };
    }
    
    // Search
    var inputOrders = document.getElementById('searchOrders');
    if (inputOrders) {
        inputOrders.onkeyup = function() {
            searchOrders();
        };
    }
    
    var inputCust = document.getElementById('searchCustomers');
    if (inputCust) {
        inputCust.onkeyup = function() {
            searchCustomers();
        };
    }

    var statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.onchange = function() {
            searchOrders();
        };
    }
}

// ===== 18. LOGOUT =====
function logout() {
    DB.clearSession();
    window.location.href = "../login.html";
}


// ===== FEATURE 2: DELETE CUSTOMER =====
// SIMPLE function with lots of comments
function deleteCustomer(customerId) {
    // Step 1: Confirm with the user
    var confirmed = confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;
    
    // Step 2: Loop through data to find the customer
    for (var i = 0; i < demoData.customers.length; i++) {
        var c = demoData.customers[i];
        
        // Step 3: Check if this is the one we want to delete
        if (c.id === customerId) {
            // Remove from array (delete 1 item at index i)
            demoData.customers.splice(i, 1);
            break; // Stop the loop
        }
    }
    
    // Step 4: Save data back to database
    DB.saveMainData(demoData);
    
    // Step 5: Refresh the table and health alerts
    updateCustomers();
    checkHealthAlerts();
    
    alert("Customer deleted successfully!");
}

// ===== FEATURE 3: LOW STOCK ALERTS =====
// SIMPLE function to show alerts for products with low stock
function checkLowStockAlerts() {
    var tbody = document.getElementById('lowStockList');
    if (!tbody) return;
    
    var html = "";
    var inventory = demoData.inventory || [];
    var count = 0;
    
    // Step 1: Loop through inventory
    for (var i = 0; i < inventory.length; i++) {
        var item = inventory[i];
        
        // Step 2: Check if stock is low (10 or less)
        if (item.stock <= 10) {
            count++;
            html += "<tr>" +
                "<td><i class='bi bi-box-seam me-2'></i>" + item.item + "</td>" +
                "<td><span class='badge bg-danger'>" + item.stock + " units</span></td>" +
                "</tr>";
        }
    }
    
    // Step 3: If no low stock items
    if (count === 0) {
        html = "<tr><td colspan='2' class='text-center text-success'>✅ All stock levels normal</td></tr>";
    }
    
    // Step 4: Update the table
    tbody.innerHTML = html;
}

// ===== FEATURE 4: SALES CHART (SIMPLE) =====
// SIMPLE function to count sales and show a bar chart
function updateSalesChart() {
    var container = document.getElementById('salesChartContainer');
    if (!container) return;
    
    var orders = demoData.orders || [];
    var salesMap = {}; // Simple object to store counts: { "Item Name": count }
    var maxSales = 0;
    
    // Step 1: Count sales for each item
    for (var i = 0; i < orders.length; i++) {
        var item = orders[i].item;
        if (salesMap[item]) {
            salesMap[item]++;
        } else {
            salesMap[item] = 1;
        }
        
        // Track the highest number to make percentages
        if (salesMap[item] > maxSales) {
            maxSales = salesMap[item];
        }
    }
    
    // Step 2: Generate HTML for the bars
    var html = "";
    for (var itemName in salesMap) {
        var count = salesMap[itemName];
        // Calculate percentage width (max is 100%)
        var widthPct = (count / maxSales) * 100;
        
        html += "<div class='mb-3'>" +
            "<div class='d-flex justify-content-between small mb-1'>" +
            "<span>" + itemName + "</span>" +
            "<span class='fw-bold'>" + count + " orders</span>" +
            "</div>" +
            "<div class='progress' style='height: 10px;'>" +
            "<div class='progress-bar bg-primary' style='width: " + widthPct + "%'></div>" +
            "</div>" +
            "</div>";
    }
    
    // Step 3: Update the container
    if (html === "") {
        html = "<p class='text-muted text-center'>No sales data available</p>";
    }
    container.innerHTML = html;
}

// ===== FEATURE 5: EDIT CUSTOMER =====
// Step 1: Open the modal and fill it with customer data
function editCustomer(customerId) {
    if (!demoData) return;
    // Find the customer
    var customer = null;
    var custs = demoData.customers || [];
    for (var i = 0; i < custs.length; i++) {
        if (custs[i].id == customerId) {
            customer = custs[i];
            break;
        }
    }
    
    if (!customer) return;
    
    // Fill the form fields
    if (document.getElementById('editCustId')) document.getElementById('editCustId').value = customer.id;
    if (document.getElementById('editCustName')) document.getElementById('editCustName').value = customer.name;
    if (document.getElementById('editCustPhone')) document.getElementById('editCustPhone').value = customer.phone;
    if (document.getElementById('editCustArea')) document.getElementById('editCustArea').value = customer.area || "";
    
    // Show the modal
    var modalEl = document.getElementById('editCustomerModal');
    if (modalEl) {
        var modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// Step 2: Save the edited data
function saveCustomerEdit() {
    var id = parseInt(document.getElementById('editCustId').value);
    var name = document.getElementById('editCustName').value;
    var phone = document.getElementById('editCustPhone').value;
    var area = document.getElementById('editCustArea').value;
    
    if (!name || !phone) {
        alert("Name and Phone are required!");
        return;
    }
    
    // Find and update the customer in our data
    for (var i = 0; i < demoData.customers.length; i++) {
        if (demoData.customers[i].id === id) {
            demoData.customers[i].name = name;
            demoData.customers[i].phone = phone;
            demoData.customers[i].area = area;
            break;
        }
    }
    
    // Save to database
    DB.saveMainData(demoData);
    
    // Update the UI
    updateCustomers();
    
    // Hide the modal
    var modalEl = document.getElementById('editCustomerModal');
    var modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    alert("Customer updated successfully!");
}

// ===== FEATURE 6: LOADING SPINNER =====
// SIMPLE functions to show and hide the overlay
function showSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex'; // Use flex to center the content
    }
}

function hideSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// ===== FEATURE 7: EMPTY STATES =====
// Helper function to show a nice message when there is no data
function checkEmpty(dataArray, tbodyId, colCount, message) {
    if (!dataArray || dataArray.length === 0) {
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return true;
        
        tbody.innerHTML = '<tr>' +
            '<td colspan="' + colCount + '" class="empty-state-row">' +
            '<i class="bi bi-inbox fs-2 d-block mb-2"></i>' +
            message +
            '</td>' +
            '</tr>';
        return true; // Yes, it is empty
    }
    return false; // No, it has data
}

// ===== FEATURE 8: EXPORT TO CSV =====
// Helper function to convert data to CSV and download it
function exportToCSV(dataArray, filename, headers) {
    if (dataArray.length === 0) {
        alert("No data to export!");
        return;
    }

    // Step 1: Start with headers
    var csvContent = headers.join(",") + "\n";

    // Step 2: Loop through data rows
    for (var i = 0; i < dataArray.length; i++) {
        var item = dataArray[i];
        var row = [];
        
        // Loop through headers to get corresponding values
        for (var j = 0; j < headers.length; j++) {
            var val = item[headers[j].toLowerCase()] || "";
            // Remove commas from data to avoid breaking CSV format
            val = String(val).replace(/,/g, " ");
            row.push(val);
        }
        csvContent += row.join(",") + "\n";
    }

    // Step 3: Create a download link and click it
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Wrapper for Customers
function exportCustomers() {
    if (!demoData) return;
    var headers = ["ID", "Name", "Phone", "Status", "Balance", "Area"];
    exportToCSV(demoData.customers || [], "customers.csv", headers);
}

// Wrapper for Orders
function exportOrders() {
    if (!demoData) return;
    var orders = demoData.orders || [];
    var dataToExport = [];
    
    for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var customer = DB.findById(demoData.customers, o.customerId);
        dataToExport.push({
            id: o.id,
            customer: customer ? customer.name : "Unknown",
            item: o.item,
            quantity: o.qty,
            amount: o.amount,
            status: o.status,
            date: o.date
        });
    }
    
    var headers = ["ID", "Customer", "Item", "Quantity", "Amount", "Status", "Date"];
    exportToCSV(dataToExport, "orders.csv", headers);
}

// ===== FEATURE 10: LAST LOGIN TIME =====
// SIMPLE function to remember and show when the admin last used the app
function updateLastLogin() {
    var display = document.getElementById('lastLoginDisplay');
    if (!display) return;
    
    // Step 1: Get the old time from local storage
    var lastLogin = localStorage.getItem('aquaLastLogin');
    
    // Step 2: If found, show it!
    if (lastLogin) {
        display.innerText = lastLogin;
    } else {
        display.innerText = "First time entry";
    }
    
    // Step 3: Save the CURRENT time for the next visit
    var now = new Date();
    var timeString = now.toLocaleDateString() + ", " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('aquaLastLogin', timeString);
}

// ===== 18. STUB FUNCTIONS FOR NEW BUTTONS =====
function viewOrderDetails(orderId) {
    alert("Viewing details for Order #" + orderId + " (Feature coming soon)");
    console.log("Details for Order:", orderId);
}

function updateOrderStatus(orderId) {
    alert("Updating status for Order #" + orderId + " (Feature coming soon)");
    console.log("Status update for Order:", orderId);
}

// ============================================
// INVENTORY MANAGEMENT - COMPLETE FIXED CODE
// ============================================

// Global variables for inventory
var invCurrentPage = 1;
var invRowsPerPage = 5;
var filteredInventory = [];

// ===== UPDATE INVENTORY TABLE =====
function updateInventory() {
  var tbody = document.getElementById('inventoryTableBody');
  if (!tbody || !demoData) return;
  
  // Get inventory data
  var inventory = demoData.inventory || [];
  var itemsToShow = filteredInventory.length > 0 ? filteredInventory : inventory;
  var totalItems = itemsToShow.length;
  
  // Update total count
  document.getElementById('invTotalCount').innerText = totalItems;
  
  // Check if empty
  if (checkEmpty(itemsToShow, 'inventoryTableBody', 6, 'No inventory items found')) {
    document.getElementById('invStartCount').innerText = '0';
    document.getElementById('invEndCount').innerText = '0';
    document.getElementById('inventoryPagination').innerHTML = '';
    return;
  }
  
  // Pagination logic
  var start = (invCurrentPage - 1) * invRowsPerPage;
  var end = Math.min(start + invRowsPerPage, totalItems);
  var pageData = itemsToShow.slice(start, end);
  
  // Update showing counts
  document.getElementById('invStartCount').innerText = totalItems > 0 ? start + 1 : 0;
  document.getElementById('invEndCount').innerText = end;
  
  // Generate table HTML
  var html = '';
  for (var i = 0; i < pageData.length; i++) {
    var item = pageData[i];
    
    // Format item ID
    var itemId = 'ITM-' + String(item.id).padStart(3, '0');
    
    // Determine stock status and color
    var stockPercentage = (item.stock / 200) * 100; // Assuming 200 is max
    var stockBarColor = 'bg-success';
    var statusText = 'In Stock';
    var statusClass = 'bg-success';
    
    if (item.stock <= item.minStock) {
      statusText = 'Low Stock';
      statusClass = 'bg-danger';
      stockBarColor = 'bg-danger';
    } else if (item.stock <= item.minStock * 2) {
      statusText = 'Medium Stock';
      statusClass = 'bg-warning';
      stockBarColor = 'bg-warning';
    }
    
    // Format price
    var price = item.price ? 'PKR ' + item.price.toLocaleString() : 'N/A';
    
    html += '<tr>' +
      '<td class="ps-4"><code>' + itemId + '</code></td>' +
      '<td>' +
        '<div><strong>' + item.item + '</strong></div>' +
        '<div class="small text-muted">' + price + '</div>' +
      '</td>' +
      '<td><span class="badge bg-secondary bg-opacity-10 text-dark">' + (item.category || 'General') + '</span></td>' +
      '<td>' +
        '<div class="d-flex align-items-center gap-2">' +
          '<span class="fw-bold ' + (item.stock <= item.minStock ? 'text-danger' : '') + '">' + 
            item.stock + ' units' +
          '</span>' +
          '<div class="progress flex-grow-1" style="height: 6px;">' +
            '<div class="progress-bar ' + stockBarColor + '" style="width: ' + stockPercentage + '%"></div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td class="text-end pe-4">' +
        '<button class="btn btn-sm btn-outline-primary me-1" onclick="editInventoryItem(' + item.id + ')" title="Edit">' +
          '<i class="bi bi-pencil"></i>' +
        '</button>' +
        '<button class="btn btn-sm btn-outline-success me-1" onclick="restockItem(' + item.id + ')" title="Restock">' +
          '<i class="bi bi-plus-circle"></i>' +
        '</button>' +
        '<button class="btn btn-sm btn-outline-danger" onclick="deleteInventoryItem(' + item.id + ')" title="Delete">' +
          '<i class="bi bi-trash"></i>' +
        '</button>' +
      '</td>' +
      '</tr>';
  }
  
  tbody.innerHTML = html;
  
  // Update pagination
  updateInventoryPagination(totalItems);
  
  // Update low stock summary
  updateLowStockSummary();
  
  // Update recent restocks
  updateRecentRestocks();
}

// ===== UPDATE BOTTLE TRACKER =====
function updateBottleTracker() {
  var tracking = demoData.bottleTracking || {
    totalBottles: 500,
    warehouseStock: 150,
    withCustomers: 320,
    inTransit: 25,
    missing: 5
  };
  
  // Update cards
  document.getElementById('totalSystemBottles').innerText = tracking.totalBottles;
  document.getElementById('warehouseStock').innerText = tracking.warehouseStock;
  document.getElementById('customerStock').innerText = tracking.withCustomers;
  document.getElementById('inTransitStock').innerText = tracking.inTransit;
  
  // Check for missing bottles
  if (tracking.missing > 0) {
    document.getElementById('missingBottlesAlert').style.display = 'block';
    document.getElementById('missingBottlesCount').innerText = tracking.missing;
  } else {
    document.getElementById('missingBottlesAlert').style.display = 'none';
  }
}

// ===== UPDATE PAGINATION =====
function updateInventoryPagination(totalItems) {
  var totalPages = Math.ceil(totalItems / invRowsPerPage);
  var pagContainer = document.getElementById('inventoryPagination');
  
  if (totalPages <= 1) {
    pagContainer.innerHTML = '';
    return;
  }
  
  var pagHtml = '';
  
  // Previous button
  pagHtml += '<button class="page-btn' + (invCurrentPage === 1 ? ' disabled' : '') + '" ' +
            (invCurrentPage > 1 ? 'onclick="goToInventoryPage(' + (invCurrentPage - 1) + ')"' : 'disabled') + '>' +
            '<i class="bi bi-chevron-left"></i></button>';
  
  // Page numbers (show max 5 pages)
  var startPage = Math.max(1, invCurrentPage - 2);
  var endPage = Math.min(totalPages, startPage + 4);
  
  for (var i = startPage; i <= endPage; i++) {
    pagHtml += '<button class="page-btn' + (i === invCurrentPage ? ' active' : '') + '" ' +
              'onclick="goToInventoryPage(' + i + ')">' + i + '</button>';
  }
  
  // Next button
  pagHtml += '<button class="page-btn' + (invCurrentPage === totalPages ? ' disabled' : '') + '" ' +
            (invCurrentPage < totalPages ? 'onclick="goToInventoryPage(' + (invCurrentPage + 1) + ')"' : 'disabled') + '>' +
            '<i class="bi bi-chevron-right"></i></button>';
  
  pagContainer.innerHTML = pagHtml;
}

// ===== GO TO PAGE =====
function goToInventoryPage(page) {
  invCurrentPage = page;
  updateInventory();
}

// ===== SEARCH INVENTORY =====
function searchInventory() {
  var searchText = document.getElementById('searchInventory').value.toLowerCase().trim();
  
  if (searchText === '') {
    filterInventory(); // Just apply category/stock filters
    return;
  }
  
  var allItems = demoData.inventory || [];
  filteredInventory = [];
  
  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];
    var nameMatch = item.item.toLowerCase().includes(searchText);
    var categoryMatch = (item.category || '').toLowerCase().includes(searchText);
    var idMatch = String(item.id).includes(searchText);
    
    if (nameMatch || categoryMatch || idMatch) {
      filteredInventory.push(item);
    }
  }
  
  // Apply additional filters
  applyInventoryFilters();
  
  invCurrentPage = 1;
  updateInventory();
}

// ===== FILTER INVENTORY =====
function filterInventory() {
  var categoryFilter = document.getElementById('categoryFilter').value;
  var stockFilter = document.getElementById('stockFilter').value;
  var searchText = document.getElementById('searchInventory').value.toLowerCase().trim();
  
  var allItems = demoData.inventory || [];
  filteredInventory = [];
  
  for (var i = 0; i < allItems.length; i++) {
    var item = allItems[i];
    
    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      continue;
    }
    
    // Stock filter
    if (stockFilter === 'low' && item.stock > item.minStock) {
      continue;
    }
    if (stockFilter === 'normal' && item.stock <= item.minStock) {
      continue;
    }
    
    // Search filter (if any)
    if (searchText !== '') {
      var nameMatch = item.item.toLowerCase().includes(searchText);
      var categoryMatch = (item.category || '').toLowerCase().includes(searchText);
      if (!nameMatch && !categoryMatch) {
        continue;
      }
    }
    
    filteredInventory.push(item);
  }
  
  invCurrentPage = 1;
  updateInventory();
}

// ===== APPLY INVENTORY FILTERS =====
function applyInventoryFilters() {
  var categoryFilter = document.getElementById('categoryFilter').value;
  var stockFilter = document.getElementById('stockFilter').value;
  
  if (categoryFilter === 'all' && stockFilter === 'all') {
    return;
  }
  
  var tempFiltered = [];
  for (var i = 0; i < filteredInventory.length; i++) {
    var item = filteredInventory[i];
    
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      continue;
    }
    
    if (stockFilter === 'low' && item.stock > item.minStock) {
      continue;
    }
    if (stockFilter === 'normal' && item.stock <= item.minStock) {
      continue;
    }
    
    tempFiltered.push(item);
  }
  
  filteredInventory = tempFiltered;
}

// ===== REFRESH INVENTORY =====
function refreshInventory() {
  // Reset filters
  document.getElementById('searchInventory').value = '';
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('stockFilter').value = 'all';
  
  filteredInventory = [];
  invCurrentPage = 1;
  
  // Refresh data from database
  demoData = DB.getMainData();
  updateBottleTracker();
  updateInventory();
  
  showToast('Inventory refreshed', 'info');
}

// ===== UPDATE LOW STOCK SUMMARY =====
function updateLowStockSummary() {
  var container = document.getElementById('lowStockSummary');
  if (!container) return;
  var inventory = demoData.inventory || [];
  var lowStockItems = [];
  
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].stock <= inventory[i].minStock) {
      lowStockItems.push(inventory[i]);
    }
  }
  
  if (lowStockItems.length === 0) {
    container.innerHTML = '<p class="text-success mb-0"><i class="bi bi-check-circle me-2"></i>All items are well stocked!</p>';
    return;
  }
  
  var html = '<ul class="list-unstyled mb-0">';
  for (var j = 0; j < lowStockItems.length; j++) {
    var item = lowStockItems[j];
    html += '<li class="mb-2"><i class="bi bi-exclamation-triangle text-warning me-2"></i>' +
            '<strong>' + item.item + '</strong> - Only ' + item.stock + ' left (Min: ' + item.minStock + ')' +
            '<button class="btn btn-sm btn-link text-primary float-end" onclick="restockItem(' + item.id + ')">Restock</button>' +
            '</li>';
  }
  html += '</ul>';
  
  container.innerHTML = html;
}

// ===== UPDATE RECENT RESTOCKS =====
function updateRecentRestocks() {
  var container = document.getElementById('recentRestocks');
  if (!container) return;
  var inventory = demoData.inventory || [];
  
  // Sort by last restocked date
  var sorted = [...inventory].sort(function(a, b) {
    return new Date(b.lastRestocked) - new Date(a.lastRestocked);
  });
  
  var recent = sorted.slice(0, 3);
  
  var html = '<ul class="list-unstyled mb-0">';
  for (var i = 0; i < recent.length; i++) {
    var item = recent[i];
    html += '<li class="mb-2"><i class="bi bi-calendar-check text-success me-2"></i>' +
            '<strong>' + item.item + '</strong> - ' + item.lastRestocked +
            '<span class="float-end text-muted">+' + item.stock + '</span>' +
            '</li>';
  }
  html += '</ul>';
  
  container.innerHTML = html;
}

// ===== RESTOCK ITEM =====
function restockItem(itemId) {
  var item = DB.findById(demoData.inventory, itemId);
  if (!item) return;
  
  var qty = prompt('Enter quantity to add:', '10');
  if (!qty) return;
  
  qty = parseInt(qty);
  if (isNaN(qty) || qty <= 0) {
    alert('Please enter a valid quantity');
    return;
  }
  
  // Update stock
  item.stock += qty;
  item.lastRestocked = new Date().toISOString().split('T')[0];
  
  // Save
  DB.saveMainData(demoData);
  
  // Refresh
  updateInventory();
  showToast('Stock updated successfully!', 'success');
}

// ===== EDIT INVENTORY ITEM =====
function editInventoryItem(itemId) {
  var item = DB.findById(demoData.inventory, itemId);
  if (!item) return;
  
  // Simple prompt for now (can be enhanced with modal)
  var newName = prompt('Edit item name:', item.item);
  if (newName && newName.trim()) {
    item.item = newName.trim();
  }
  
  var newPrice = prompt('Edit price:', item.price);
  if (newPrice && !isNaN(parseInt(newPrice))) {
    item.price = parseInt(newPrice);
  }
  
  var newMinStock = prompt('Edit minimum stock level:', item.minStock);
  if (newMinStock && !isNaN(parseInt(newMinStock))) {
    item.minStock = parseInt(newMinStock);
  }
  
  DB.saveMainData(demoData);
  updateInventory();
  showToast('Item updated', 'success');
}

// ===== DELETE INVENTORY ITEM =====
function deleteInventoryItem(itemId) {
  var item = DB.findById(demoData.inventory, itemId);
  if (!item) return;
  
  if (!confirm('Are you sure you want to delete "' + item.item + '"?')) return;
  
  for (var i = 0; i < demoData.inventory.length; i++) {
    if (demoData.inventory[i].id === itemId) {
      demoData.inventory.splice(i, 1);
      break;
    }
  }
  
  DB.saveMainData(demoData);
  filterInventory(); // Refresh filters
  showToast('Item deleted', 'warning');
}

// ===== EXPORT INVENTORY =====
function exportInventory() {
  var items = demoData.inventory || [];
  if (items.length === 0) {
    alert('No inventory to export!');
    return;
  }
  
  var csv = 'ID,Item Name,Category,Stock,Price,Min Stock,Last Restocked\n';
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    csv += item.id + ',' +
           '"' + item.item + '",' +
           '"' + (item.category || 'General') + '",' +
           item.stock + ',' +
           (item.price || 0) + ',' +
           (item.minStock || 0) + ',' +
           (item.lastRestocked || '') + '\n';
  }
  
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'inventory-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// ===== SHOW ADD ITEM FORM =====
function showAddItemForm() {
  var name = prompt('Enter item name:');
  if (!name) return;
  
  var category = prompt('Enter category (Bottles/Equipment/Accessories/Parts):', 'Bottles');
  if (!category) return;
  
  var stock = prompt('Enter initial stock:', '0');
  if (stock && isNaN(parseInt(stock))) {
    alert('Please enter a valid number');
    return;
  }
  
  var price = prompt('Enter price:', '0');
  if (price && isNaN(parseInt(price))) {
    alert('Please enter a valid price');
    return;
  }
  
  var newId = DB.nextId(demoData.inventory);
  
  var newItem = {
    id: newId,
    item: name,
    category: category,
    stock: parseInt(stock) || 0,
    price: parseInt(price) || 0,
    minStock: 10,
    lastRestocked: new Date().toISOString().split('T')[0]
  };
  
  if (!demoData.inventory) demoData.inventory = [];
  demoData.inventory.push(newItem);
  DB.saveMainData(demoData);
  
  refreshInventory();
  showToast('Item added successfully!', 'success');
}

// ===== START AUDIT =====
function startAudit() {
  if (confirm('Start bottle audit? This will reset tracking data.')) {
    var tracking = demoData.bottleTracking || {};
    tracking.missing = 0;
    tracking.lastAudit = new Date().toISOString().split('T')[0];
    demoData.bottleTracking = tracking;
    
    DB.saveMainData(demoData);
    updateBottleTracker();
    showToast('Audit completed. Missing bottles reset.', 'success');
  }
}

// ============================================
// BILLING & INVOICE MANAGEMENT
// ============================================

var currentInvoiceId = null;

function updateBilling() {
    var tbody = document.getElementById('billingTableBody');
    if (!tbody || !demoData) return;
    
    var invoices = demoData.invoices || [];
    
    // Sort by date (newest first)
    invoices.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var html = "";
    var totalAmount = 0;
    var paidCount = 0;
    var unpaidCount = 0;

    for (var i = 0; i < invoices.length; i++) {
        var inv = invoices[i];
        totalAmount += inv.amount;
        
        if (inv.status === "Paid") paidCount++;
        else unpaidCount++;

        var badgeClass = inv.status === "Paid" ? "bg-success" : "bg-warning";
        
        html += "<tr onclick='viewInvoiceDetails(" + inv.id + ")' style='cursor:pointer'>" +
            "<td class='ps-4 fw-bold text-primary'>" + inv.invoiceNo + "</td>" +
            "<td>" + inv.date + "</td>" +
            "<td>" + (inv.customerName || "Customer #" + inv.customerId) + "</td>" +
            "<td><span class='badge " + badgeClass + "'>" + inv.status + "</span></td>" +
            "<td class='text-end'>PKR " + inv.amount.toLocaleString() + "</td>" +
            "<td class='text-end pe-4'>" +
                "<button class='btn btn-sm btn-outline-primary me-1' onclick='event.stopPropagation(); printInvoice(" + inv.id + ")'><i class='bi bi-printer'></i></button>" +
                (inv.status === "Unpaid" ? "<button class='btn btn-sm btn-success' onclick='event.stopPropagation(); markAsPaid(" + inv.id + ")'><i class='bi bi-check-lg'></i></button>" : "") +
            "</td>" +
            "</tr>";
    }

    tbody.innerHTML = html || "<tr><td colspan='6' class='text-center'>No invoices found</td></tr>";
    
    // Update Summaries
    if (document.getElementById('totalInvoices')) document.getElementById('totalInvoices').innerText = invoices.length;
    if (document.getElementById('paidInvoices')) document.getElementById('paidInvoices').innerText = paidCount;
    if (document.getElementById('unpaidInvoices')) document.getElementById('unpaidInvoices').innerText = unpaidCount;
    if (document.getElementById('totalAmount')) document.getElementById('totalAmount').innerText = "PKR " + totalAmount.toLocaleString();
    
    updateCashMatch();
    updateRecentPayments();
}

function viewInvoiceDetails(id) {
    var invoices = demoData.invoices || [];
    var inv = null;
    for (var i = 0; i < invoices.length; i++) {
        if (invoices[i].id === id) {
            inv = invoices[i];
            break;
        }
    }
    if (!inv) return;

    currentInvoiceId = id;
    
    document.getElementById('detailInvoiceNo').innerText = inv.invoiceNo;
    document.getElementById('detailStatus').innerText = inv.status;
    document.getElementById('detailStatus').className = "badge fs-6 " + (inv.status === "Paid" ? "bg-success" : "bg-warning");
    document.getElementById('detailCustomer').innerText = inv.customerName;
    document.getElementById('detailDate').innerText = inv.date;
    document.getElementById('detailDueDate').innerText = inv.dueDate || "N/A";
    document.getElementById('detailPaymentMethod').innerText = inv.paymentMethod || "N/A";
    document.getElementById('detailPaidDate').innerText = inv.paidDate || "Not Paid";
    
    // Populate items
    var itemsHtml = "";
    var subtotal = 0;
    var items = inv.items || [];
    for (var j = 0; j < items.length; j++) {
        var item = items[j];
        subtotal += item.total;
        itemsHtml += "<tr>" +
            "<td>" + item.description + "</td>" +
            "<td class='text-center'>" + item.qty + "</td>" +
            "<td class='text-end'>PKR " + item.price + "</td>" +
            "<td class='text-end'>PKR " + item.total + "</td>" +
            "</tr>";
    }
    document.getElementById('detailItems').innerHTML = itemsHtml;
    
    var tax = Math.round(subtotal * 0.05);
    var delivery = 100;
    var grandTotal = subtotal + tax + delivery;

    document.getElementById('detailSubtotal').innerText = "PKR " + subtotal.toLocaleString();
    document.getElementById('detailTax').innerText = "PKR " + tax.toLocaleString();
    document.getElementById('detailDelivery').innerText = "PKR " + delivery.toLocaleString();
    document.getElementById('detailTotal').innerText = "PKR " + grandTotal.toLocaleString();

    // Show/Hide buttons
    var btn = document.getElementById('markPaidModalBtn');
    if (btn) btn.style.display = inv.status === "Paid" ? "none" : "block";

    var modal = new bootstrap.Modal(document.getElementById('invoiceDetailsModal'));
    modal.show();
}

function markAsPaid(id) {
    var invoices = demoData.invoices || [];
    for (var i = 0; i < invoices.length; i++) {
        if (invoices[i].id === id) {
            invoices[i].status = "Paid";
            invoices[i].paidDate = new Date().toISOString().split('T')[0];
            invoices[i].paymentMethod = "Cash/Manual";
            break;
        }
    }
    DB.saveMainData(demoData);
    updateBilling();
    addAuditEntry("PAYMENT", "Invoice", id, "Marked invoice as paid manually");
}

function markCurrentAsPaid() {
    if (currentInvoiceId) {
        markAsPaid(currentInvoiceId);
        bootstrap.Modal.getInstance(document.getElementById('invoiceDetailsModal')).hide();
    }
}

function updateCashMatch() {
    var tbody = document.getElementById('cashMatchList');
    if (!tbody) return;

    var data = demoData.cashSubmissions || [];
    var html = "";
    var sysTotal = 0;
    var drvTotal = 0;

    for (var i = 0; i < data.length; i++) {
        var c = data[i];
        sysTotal += c.systemCash;
        drvTotal += c.driverCash;

        var diffClass = "text-success";
        if (c.diff < 0) diffClass = "text-danger";
        else if (c.diff > 0) diffClass = "text-warning";

        html += "<tr>" +
            "<td>" + c.date.substring(5) + "</td>" +
            "<td>" + c.driverName + "</td>" +
            "<td class='text-end'>" + c.systemCash + "</td>" +
            "<td class='text-end'>" + c.driverCash + "</td>" +
            "<td class='text-end " + diffClass + "'>" + (c.diff > 0 ? "+" : "") + c.diff + "</td>" +
            "</tr>";
    }
    tbody.innerHTML = html;
    
    if (document.getElementById('totalSystemCash')) document.getElementById('totalSystemCash').innerText = "PKR " + sysTotal.toLocaleString();
    if (document.getElementById('totalDriverCash')) document.getElementById('totalDriverCash').innerText = "PKR " + drvTotal.toLocaleString();
}

function updateRecentPayments() {
    var container = document.getElementById('recentPaymentsList');
    if (!container) return;

    var invoices = demoData.invoices || [];
    var paidInvoices = invoices.filter(function(i) { return i.status === "Paid"; });
    paidInvoices.sort(function(a, b) { return new Date(b.paidDate) - new Date(a.paidDate); });

    var html = "";
    var count = Math.min(paidInvoices.length, 3);
    for (var i = 0; i < count; i++) {
        var inv = paidInvoices[i];
        html += "<div class='d-flex justify-content-between align-items-center mb-2 border-bottom pb-2'>" +
            "<div><div class='fw-bold'>" + inv.customerName + "</div><small class='text-muted'>" + inv.invoiceNo + "</small></div>" +
            "<div class='text-success fw-bold'>PKR " + inv.amount + "</div>" +
            "</div>";
    }
    container.innerHTML = html || "<div class='text-muted small'>No recent payments</div>";
}

function printInvoice(id) {
    var inv = null;
    var invoices = demoData.invoices || [];
    for (var i = 0; i < invoices.length; i++) {
        if (invoices[i].id === id) {
            inv = invoices[i];
            break;
        }
    }
    if (!inv) return;

    var subtotal = 0;
    var itemsHtml = "";
    var items = inv.items || [];
    for (var j = 0; j < items.length; j++) {
        var itm = items[j];
        subtotal += itm.total;
        itemsHtml += "<tr><td>" + itm.description + "</td><td>" + itm.qty + "</td><td>PKR " + itm.price + "</td><td>PKR " + itm.total + "</td></tr>";
    }

    var tax = Math.round(subtotal * 0.05);
    var delivery = 100;
    var total = subtotal + tax + delivery;

    var printWindow = window.open('', '_blank');
    printWindow.document.write("<html><head><title>Print Invoice</title>");
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write("<style>body{padding:20px;} .header{background:#0077b6; color:white; padding:15px; border-radius:10px; margin-bottom:20px;}</style></head><body>");
    printWindow.document.write("<div class='container'><div class='header'><h1>AquaFlow</h1><p>Pure Hydration, Pure Trust</p></div>");
    printWindow.document.write("<div class='row'><div class='col-6'><h4>To:</h4><p>" + inv.customerName + "</p></div><div class='col-6 text-end'><h4>Invoice:</h4><p>" + inv.invoiceNo + "<br>" + inv.date + "</p></div></div>");
    printWindow.document.write("<table class='table table-bordered mt-3'><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>" + itemsHtml + "</tbody></table>");
    printWindow.document.write("<div class='row'><div class='col-6 offset-6'><table class='table'><tr><td>Subtotal</td><td class='text-end'>PKR " + subtotal + "</td></tr><tr><td>Tax (5%)</td><td class='text-end'>PKR " + tax + "</td></tr><tr><td>Delivery</td><td class='text-end'>PKR " + delivery + "</td></tr><tr class='fw-bold text-primary'><td>Grand Total</td><td class='text-end'>PKR " + total + "</td></tr></table></div></div>");
    printWindow.document.write("<div class='text-center mt-4 no-print'><button class='btn btn-primary' onclick='window.print()'>Print Now</button></div></div>");
    printWindow.document.write("</body></html>");
    printWindow.document.close();
}

// ============================================
// CUSTOMER FEEDBACK MANAGEMENT
// ============================================

var currentFeedbackId = null;

function updateFeedback() {
    var tbody = document.getElementById('feedbackInboxBody');
    if (!tbody || !demoData) return;

    var feedback = demoData.feedback || [];
    
    // Sort by date (newest first)
    var sorted = [...feedback].sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var html = "";
    var totalRating = 0;
    var counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    var unreplied = 0;

    for (var i = 0; i < sorted.length; i++) {
        var f = sorted[i];
        totalRating += f.rating;
        counts[f.rating]++;
        if (f.status === "New") unreplied++;

        var badgeClass = f.status === "Replied" ? "bg-success" : "bg-warning";
        
        // Star HTML
        var stars = "";
        for (var s = 1; s <= 5; s++) {
            stars += "<i class='bi bi-star" + (s <= f.rating ? "-fill text-warning" : " text-muted") + "'></i>";
        }

        html += "<tr>" +
            "<td class='ps-4'>" + f.date + "</td>" +
            "<td>" + f.customerName + "</td>" +
            "<td><div class='text-truncate' style='max-width:250px' title='" + f.message + "'>" + f.message + "</div></td>" +
            "<td>" + stars + "</td>" +
            "<td><span class='badge " + badgeClass + "'>" + f.status + "</span></td>" +
            "<td class='text-end pe-4'>" +
                "<button class='btn btn-sm btn-outline-info me-1' onclick='viewFeedback(" + f.id + ")'><i class='bi bi-eye'></i></button>" +
                (f.status === "New" ? "<button class='btn btn-sm btn-primary' onclick='replyToFeedback(" + f.id + ")'><i class='bi bi-reply'></i></button>" : "") +
            "</td>" +
            "</tr>";
    }

    tbody.innerHTML = html || "<tr><td colspan='6' class='text-center'>No feedback found</td></tr>";
    
    // Update Stats
    var avg = feedback.length > 0 ? (totalRating / feedback.length).toFixed(1) : "0.0";
    if (document.getElementById('avgRatingDisplay')) document.getElementById('avgRatingDisplay').innerText = avg;
    if (document.getElementById('bigAvgRating')) document.getElementById('bigAvgRating').innerText = avg;
    if (document.getElementById('totalFeedbackCount')) document.getElementById('totalFeedbackCount').innerText = feedback.length;
    if (document.getElementById('unrepliedCount')) document.getElementById('unrepliedCount').innerText = unreplied;
    
    // Update progress bars
    for (var r = 1; r <= 5; r++) {
        var pct = feedback.length > 0 ? (counts[r] / feedback.length) * 100 : 0;
        if (document.getElementById('star' + r + 'Count')) document.getElementById('star' + r + 'Count').innerText = counts[r];
        if (document.getElementById('star' + r + 'Bar')) document.getElementById('star' + r + 'Bar').style.width = pct + "%";
    }

    updateRecentReplies();
}

function searchFeedback() { updateFeedback(); }
function filterFeedback() { updateFeedback(); }
function refreshFeedback() { showToast("Feedback refreshed", "info"); updateFeedback(); }

function exportFeedback() {
    var feedback = demoData.feedback || [];
    var csv = "Date,Customer,Message,Rating,Status\n";
    for (var i = 0; i < feedback.length; i++) {
        var f = feedback[i];
        csv += f.date + "," + f.customerName + ",\"" + f.message.replace(/"/g, '""') + "\"," + f.rating + "," + f.status + "\n";
    }
    downloadCSV(csv, "feedback.csv");
}

function viewFeedback(id) {
    var feedback = demoData.feedback || [];
    var f = null;
    for(var i=0; i<feedback.length; i++) {
        if(feedback[i].id === id) { f = feedback[i]; break; }
    }
    if (!f) return;

    currentFeedbackId = id;
    document.getElementById('viewCustomerName').innerText = f.customerName;
    document.getElementById('viewDate').innerText = f.date;
    document.getElementById('viewMessage').innerText = f.message;
    
    var stars = "";
    for (var s = 1; s <= 5; s++) { stars += "<i class='bi bi-star" + (s <= f.rating ? "-fill" : "") + "'></i> "; }
    document.getElementById('viewRating').innerHTML = stars;

    var replySection = document.getElementById('viewReplySection');
    var replyBtn = document.getElementById('viewReplyBtn');
    
    if (f.status === "Replied") {
        replySection.style.display = "block";
        document.getElementById('viewReply').innerText = f.reply;
        document.getElementById('viewRepliedAt').innerText = "Replied by " + f.repliedBy + " on " + f.repliedAt;
        replyBtn.style.display = "none";
    } else {
        replySection.style.display = "none";
        replyBtn.style.display = "block";
    }

    new bootstrap.Modal(document.getElementById('viewFeedbackModal')).show();
}

function replyToFeedback(id) {
    var feedback = demoData.feedback || [];
    var f = null;
    for(var i=0; i<feedback.length; i++) {
        if(feedback[i].id === id) { f = feedback[i]; break; }
    }
    if (!f) return;

    currentFeedbackId = id;
    document.getElementById('replyCustomerName').innerText = f.customerName;
    document.getElementById('replyCustomerRating').innerText = f.rating + " Stars";
    document.getElementById('replyCustomerMessage').innerText = f.message;
    document.getElementById('replyText').value = "";

    new bootstrap.Modal(document.getElementById('replyFeedbackModal')).show();
}

function saveFeedbackReply() {
    var reply = document.getElementById('replyText').value.trim();
    if (!reply) return alert("Please enter a reply");

    var feedback = demoData.feedback || [];
    for (var i = 0; i < feedback.length; i++) {
        if (feedback[i].id === currentFeedbackId) {
            feedback[i].status = "Replied";
            feedback[i].reply = reply;
            feedback[i].repliedBy = "Admin";
            feedback[i].repliedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
            break;
        }
    }

    DB.saveMainData(demoData);
    updateFeedback();
    addAuditEntry("REPLY", "Feedback", currentFeedbackId, "Replied to customer feedback");
    
    bootstrap.Modal.getInstance(document.getElementById('replyFeedbackModal')).hide();
    alert("Reply sent successfully!");
}

function updateRecentReplies() {
    var container = document.getElementById('recentRepliesList');
    if (!container) return;

    var feedback = demoData.feedback || [];
    var replied = feedback.filter(function(f) { return f.status === "Replied"; });
    replied.sort(function(a, b) { return new Date(b.repliedAt) - new Date(a.repliedAt); });

    var html = "";
    var count = Math.min(replied.length, 3);
    for (var i = 0; i < count; i++) {
        var f = replied[i];
        html += "<div class='small mb-2 p-2 bg-light rounded'>" +
            "<div class='fw-bold'>" + f.customerName + "</div>" +
            "<div class='text-truncate text-muted'>" + f.reply + "</div>" +
            "</div>";
    }
    container.innerHTML = html || "<div class='text-muted small'>No recent replies</div>";
}

// ============================================
// AUDIT LOG MANAGEMENT
// ============================================

function updateAuditLog() {
    var tbody = document.getElementById('auditLogBody');
    if (!tbody || !demoData) return;

    var logs = demoData.auditLog || [];
    var sortedLogs = [...logs].reverse();

    var html = "";
    var todayCount = 0;
    var updateCount = 0;
    var todayStr = new Date().toISOString().split('T')[0];

    for (var i = 0; i < sortedLogs.length; i++) {
        var log = sortedLogs[i];
        if (log.timestamp.includes(todayStr)) todayCount++;
        if (log.action === "UPDATE") updateCount++;

        var actionBadge = "bg-secondary";
        if (log.action === "CREATE") actionBadge = "bg-success";
        if (log.action === "UPDATE") actionBadge = "bg-warning text-dark";
        if (log.action === "DELETE") actionBadge = "bg-danger";
        if (log.action === "LOGIN") actionBadge = "bg-info";

        html += "<tr>" +
            "<td class='ps-4 small'>" + log.timestamp + "</td>" +
            "<td><span class='badge " + actionBadge + "'>" + log.action + "</span></td>" +
            "<td>" + log.entity + "</td>" +
            "<td>" + (log.entityId || "-") + "</td>" +
            "<td class='small'>" + log.details + "</td>" +
            "<td class='text-end pe-4 fw-bold'>" + log.user + "</td>" +
            "</tr>";
    }

    tbody.innerHTML = html || "<tr><td colspan='6' class='text-center'>No audit events recorded</td></tr>";
    
    if (document.getElementById('auditTotal')) document.getElementById('auditTotal').innerText = logs.length;
    if (document.getElementById('auditToday')) document.getElementById('auditToday').innerText = todayCount;
    if (document.getElementById('auditUpdates')) document.getElementById('auditUpdates').innerText = updateCount;
}

function searchAudit() { updateAuditLog(); }
function filterAudit() { updateAuditLog(); }
function refreshAudit() { showToast("Audit log refreshed", "info"); updateAuditLog(); }

function exportAuditLog() {
    var logs = demoData.auditLog || [];
    var csv = "Timestamp,Action,Entity,ID,Details,User\n";
    for (var i = 0; i < logs.length; i++) {
        var l = logs[i];
        csv += l.timestamp + "," + l.action + "," + l.entity + "," + (l.entityId || "") + ",\"" + l.details.replace(/"/g, '""') + "\"," + l.user + "\n";
    }
    downloadCSV(csv, "audit_log.csv");
}

function downloadCSV(csv, filename) {
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addAuditEntry(action, entity, entityId, details) {
    if (!demoData.auditLog) demoData.auditLog = [];
    var newLog = {
        id: demoData.auditLog.length + 1,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: action,
        entity: entity,
        entityId: entityId,
        details: details,
        user: "Admin"
    };
    demoData.auditLog.push(newLog);
    DB.saveMainData(demoData);
    
    // Refresh only if current section is audit log
    var section = document.getElementById('auditlog');
    if (section && !section.classList.contains('d-none')) {
        updateAuditLog();
    }
}

function clearAuditLog() {
    if (confirm("Are you sure? This will delete all history.")) {
        demoData.auditLog = [];
        DB.saveMainData(demoData);
        updateAuditLog();
        addAuditEntry("CLEAR", "Audit Log", null, "Log cleared");
    }
}

// Start everything
document.addEventListener('DOMContentLoaded', initAdmin);