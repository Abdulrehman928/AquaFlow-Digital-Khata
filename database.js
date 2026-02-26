/**
 * AquaFlow - Centralized Database & Storage Logic
 * Single source of truth for localStorage and sessionStorage interactions.
 */

const DB = {
  // --- Configuration Keys ---
  keys: {
    MAIN: "aquaFlowData",
    AUTH: "aquaFlowUser",
    SESSION_USER: "currentUser",
  },

  // --- Core Methods ---

  /**
   * Initialize the database with demo data if empty.
   */
  init() {
    console.log(
      "%c DB: Initializing AquaFlow System... ",
      "background: #222; color: #bada55; font-weight: bold;",
    );
    const existingData = this.getMainData();
    if (!existingData) {
      console.warn(
        "DB: No existing data found. Loading professional demo dataset.",
      );
      this.loadDemoData();
    } else {
      console.log("DB: Main data loaded successfully.");
    }
  },

  /**
   * Generic save method for main application data.
   */
  saveData(key, data) {
    // We strictly use keys.MAIN to keep a single source of truth for all modules
    const currentData = this.getMainData() || {};
    currentData[key] = data;
    localStorage.setItem(this.keys.MAIN, JSON.stringify(currentData));
    console.log(`DB: Data saved for [${key}]`);
  },

  /**
   * Generic get method for main application data.
   */
  getData(key) {
    const data = this.getMainData();
    return data ? data[key] : null;
  },

  /**
   * Internal helper to fetch the entire main data object.
   */
  getMainData() {
    const stored = localStorage.getItem(this.keys.MAIN);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("DB: Error parsing main data", e);
      return null;
    }
  },

  /**
   * Universal save method for the entire data object.
   * Required for compliance with project technical rules.
   */
  saveMainData(data) {
    localStorage.setItem(this.keys.MAIN, JSON.stringify(data));
    console.log("DB: Main data committed to LocalStorage.");
  },

  // --- Session Management ---

  getSessionUser() {
    const userJson = sessionStorage.getItem(this.keys.SESSION_USER);
    return userJson ? JSON.parse(userJson) : null;
  },

  setSessionUser(user) {
    sessionStorage.setItem(this.keys.SESSION_USER, JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem(this.keys.SESSION_USER);
    console.log("DB: Session cleared.");
  },

  // --- Helper: Find a record by ID from any array ---
  // Usage: DB.findById(data.customers, 2)  => returns customer with id 2
  findById(array, id) {
    if (!Array.isArray(array)) return null;
    for (var i = 0; i < array.length; i++) {
      if (array[i].id === id) return array[i];
    }
    return null;
  },

  // --- Helper: Generate next sequential ID for any array ---
  // Usage: DB.nextId(data.orders)  => returns last id + 1
  nextId(array) {
    if (!Array.isArray(array) || array.length === 0) return 1;
    var maxId = 0;
    for (var i = 0; i < array.length; i++) {
      if (array[i].id > maxId) maxId = array[i].id;
    }
    return maxId + 1;
  },

  // --- Helper: Get current ISO timestamp ---
  now() {
    return new Date().toISOString();
  },

  // --- Demo Data ---

  loadDemoData() {
    const demoData = {
      // ── Business Rules Config ────────────────────────────────
      // Change values here to adjust system behaviour globally
      config: {
        highBalanceThreshold: 5000, // PKR — triggers health alert
        inactiveDaysThreshold: 30, // days — triggers inactivity alert
        lowStockThreshold: 20, // units — triggers low-stock alert
        missingBottleAlertThreshold: 5, // bottles — triggers reconciliation alert
        pricePerBottle: 200, // PKR per 19L bottle
        cashMismatchTolerance: 50, // PKR — differences smaller than this are ignored
      },

      // ── Customers ───────────────────────────────────────────
      customers: [
        { 
          id: 1, 
          name: "Cafe One", 
          phone: "0300-1234567", 
          balance: 5000, 
          status: "Active", 
          area: "Gulshan", 
          lastOrder: "2026-02-20",
          email: "cafeone@email.com",
          totalOrders: 12
        },
        { 
          id: 2, 
          name: "John Smith", 
          phone: "0321-7654321", 
          balance: 2500, 
          status: "Active", 
          area: "DHA", 
          lastOrder: "2026-02-22",
          email: "john@email.com",
          totalOrders: 8
        },
        { 
          id: 3, 
          name: "Hotel Luxe", 
          phone: "0345-1122334", 
          balance: 8000, 
          status: "Active", 
          area: "Clifton", 
          lastOrder: "2026-02-18",
          email: "hotel@email.com",
          totalOrders: 15
        },
        { 
          id: 4, 
          name: "Gym Pro", 
          phone: "0324-667505", 
          balance: 3500, 
          status: "Inactive", 
          area: "Gulshan", 
          lastOrder: "2026-02-04",
          email: "gym@email.com",
          totalOrders: 5
        },
        { 
          id: 5, 
          name: "Jane", 
          phone: "0328-125505", 
          balance: 1200, 
          status: "Active", 
          area: "DHA", 
          lastOrder: "2026-01-16",
          email: "jane@email.com",
          totalOrders: 3
        },
        { 
          id: 6, 
          name: "John", 
          phone: "0313-380971", 
          balance: 0, 
          status: "Active", 
          area: "Clifton", 
          lastOrder: "2026-01-13",
          email: "john.d@email.com",
          totalOrders: 2
        }
      ],

      // ── Drivers ─────────────────────────────────────────────
      // Foreign key: orders.driverId → drivers.id
      drivers: [
        {
          id: 1,
          name: "Zubair",
          phone: "0345-5556667",
          status: "Active",
          area: "Gulshan",
        },
        {
          id: 2,
          name: "Hassan",
          phone: "0312-8889990",
          status: "On Trip",
          area: "DHA",
        },
      ],

      // ── Inventory ───────────────────────────────────────────
      inventory: [
        { 
          id: 1, 
          item: "19L Bottle", 
          stock: 150, 
          price: 200,
          minStock: 20,
          category: "Bottles",
          lastRestocked: "2026-02-20",
          supplier: "Pure Water Co"
        },
        { 
          id: 2, 
          item: "Dispenser", 
          stock: 12, 
          price: 8500,
          minStock: 5,
          category: "Equipment",
          lastRestocked: "2026-02-15",
          supplier: "Tech Supplies"
        },
        { 
          id: 3, 
          item: "Water Cooler", 
          stock: 5, 
          price: 15000,
          minStock: 3,
          category: "Equipment",
          lastRestocked: "2026-02-10",
          supplier: "Cooling Systems"
        },
        { 
          id: 4, 
          item: "5L Bottle", 
          stock: 75, 
          price: 80,
          minStock: 15,
          category: "Bottles",
          lastRestocked: "2026-02-22",
          supplier: "Pure Water Co"
        },
        { 
          id: 5, 
          item: "Cups (Pack of 100)", 
          stock: 200, 
          price: 150,
          minStock: 30,
          category: "Accessories",
          lastRestocked: "2026-02-18",
          supplier: "Disposables Ltd"
        },
        { 
          id: 6, 
          item: "Water Filter", 
          stock: 8, 
          price: 1200,
          minStock: 5,
          category: "Parts",
          lastRestocked: "2026-02-05",
          supplier: "Filter Corp"
        }
      ],
      
      // Bottle tracking data
      bottleTracking: {
        totalBottles: 500,        // Total bottles owned by company
        warehouseStock: 150,       // Currently in warehouse
        withCustomers: 320,        // Currently with customers
        inTransit: 25,            // Being delivered
        missing: 5,               // Lost/damaged
        lastAudit: "2026-02-24"
      },

      // ── Orders ──────────────────────────────────────────────
      orders: [
        {
          id: 8000,
          customerId: 1,
          item: "19L Bottle",
          qty: 5,
          amount: 1000,
          status: "Completed",
          date: "2026-02-20",
        },
        {
          id: 8001,
          customerId: 2,
          item: "Dispenser",
          qty: 1,
          amount: 8500,
          status: "In Transit",
          date: "2026-02-21",
        },
        {
          id: 8002,
          customerId: 3,
          item: "19L Bottle",
          qty: 10,
          amount: 2000,
          status: "Pending",
          date: "2026-02-22",
        },
      ],

      // ── Invoices ─────────────────────────────────────────────
      // First-class entity — generated from orders, not derived on the fly
      invoices: [
        { 
          id: 1001, 
          invoiceNo: "INV-2026-001",
          customerId: 1, 
          customerName: "Cafe One",
          amount: 2000, 
          status: "Paid", 
          date: "2026-02-20",
          dueDate: "2026-03-05",
          paymentMethod: "Cash",
          paidDate: "2026-02-20",
          items: [
            { description: "19L Bottle x5", qty: 5, price: 200, total: 1000 },
            { description: "Delivery Charges", qty: 1, price: 100, total: 100 }
          ]
        },
        { 
          id: 1002, 
          invoiceNo: "INV-2026-002",
          customerId: 2, 
          customerName: "John Smith",
          amount: 1947, 
          status: "Unpaid", 
          date: "2026-02-21",
          dueDate: "2026-03-06",
          paymentMethod: "Pending",
          paidDate: null,
          items: [
            { description: "Dispenser", qty: 1, price: 8500, total: 8500 },
            { description: "19L Bottle x2", qty: 2, price: 200, total: 400 }
          ]
        },
        { 
          id: 1003, 
          invoiceNo: "INV-2026-003",
          customerId: 3, 
          customerName: "Hotel Luxe",
          amount: 550, 
          status: "Paid", 
          date: "2026-02-22",
          dueDate: "2026-03-07",
          paymentMethod: "Bank Transfer",
          paidDate: "2026-02-22",
          items: [
            { description: "19L Bottle x2", qty: 2, price: 200, total: 400 },
            { description: "5L Bottle x1", qty: 1, price: 80, total: 80 },
            { description: "Delivery", qty: 1, price: 70, total: 70 }
          ]
        },
        { 
          id: 1004, 
          invoiceNo: "INV-2026-004",
          customerId: 1, 
          customerName: "Cafe One",
          amount: 1047, 
          status: "Unpaid", 
          date: "2026-02-23",
          dueDate: "2026-03-08",
          paymentMethod: "Pending",
          paidDate: null,
          items: [
            { description: "19L Bottle x4", qty: 4, price: 200, total: 800 },
            { description: "Water Filter", qty: 1, price: 200, total: 200 },
            { description: "Delivery", qty: 1, price: 47, total: 47 }
          ]
        },
        { 
          id: 1005, 
          invoiceNo: "INV-2026-005",
          customerId: 2, 
          customerName: "John Smith",
          amount: 1007, 
          status: "Paid", 
          date: "2026-02-24",
          dueDate: "2026-03-09",
          paymentMethod: "Cash",
          paidDate: "2026-02-24",
          items: [
            { description: "19L Bottle x3", qty: 3, price: 200, total: 600 },
            { description: "Cups Pack", qty: 2, price: 150, total: 300 },
            { description: "Delivery", qty: 1, price: 107, total: 107 }
          ]
        },
        { 
          id: 1006, 
          invoiceNo: "INV-2026-006",
          customerId: 3, 
          customerName: "Hotel Luxe",
          amount: 1677, 
          status: "Unpaid", 
          date: "2026-02-25",
          dueDate: "2026-03-10",
          paymentMethod: "Pending",
          paidDate: null,
          items: [
            { description: "19L Bottle x6", qty: 6, price: 200, total: 1200 },
            { description: "Water Cooler Service", qty: 1, price: 400, total: 400 },
            { description: "Delivery", qty: 1, price: 77, total: 77 }
          ]
        }
      ],

      // ── Cash Submissions ─────────────────────────────────────
      // driverId replaces driver name string
      cashSubmissions: [
        { 
          id: 1, 
          driverId: 1, 
          driverName: "Zubair", 
          systemCash: 5000, 
          driverCash: 4950, 
          date: "2026-02-24", 
          diff: -50,
          status: "Short",
          verifiedBy: "Admin",
          verifiedAt: "2026-02-24 18:30"
        },
        { 
          id: 2, 
          driverId: 2, 
          driverName: "Hassan", 
          systemCash: 7200, 
          driverCash: 7200, 
          date: "2026-02-24", 
          diff: 0,
          status: "Matched",
          verifiedBy: "Admin",
          verifiedAt: "2026-02-24 19:15"
        },
        { 
          id: 3, 
          driverId: 1, 
          driverName: "Zubair", 
          systemCash: 4500, 
          driverCash: 4500, 
          date: "2026-02-25", 
          diff: 0,
          status: "Matched",
          verifiedBy: "System",
          verifiedAt: "2026-02-25 17:45"
        },
        { 
          id: 4, 
          driverId: 2, 
          driverName: "Hassan", 
          systemCash: 6800, 
          driverCash: 6750, 
          date: "2026-02-25", 
          diff: -50,
          status: "Short",
          verifiedBy: "Admin",
          verifiedAt: "2026-02-25 18:20"
        },
        { 
          id: 5, 
          driverId: 1, 
          driverName: "Zubair", 
          systemCash: 8200, 
          driverCash: 8300, 
          date: "2026-02-26", 
          diff: 100,
          status: "Excess",
          verifiedBy: "Pending",
          verifiedAt: null
        }
      ],

      // ── Feedback ─────────────────────────────────────────────
      // customerId replaces customer name string
      feedback: [
        { 
          id: 1, 
          customerId: 1, 
          customerName: "Cafe One", 
          rating: 5, 
          message: "Great service! Driver was very polite and on time. The water quality is excellent and my customers love it.", 
          date: "2026-02-24",
          status: "Replied",
          reply: "Thank you so much for your kind words! We're delighted to serve you.",
          repliedBy: "Admin",
          repliedAt: "2026-02-24 15:30"
        },
        { 
          id: 2, 
          customerId: 2, 
          customerName: "John Smith", 
          rating: 4, 
          message: "Good service but delivery was 30 minutes late. Please improve timing. Otherwise water quality is good.", 
          date: "2026-02-23",
          status: "Replied",
          reply: "Apologies for the delay. We'll ensure better timing next time. Thank you for your feedback!",
          repliedBy: "Admin",
          repliedAt: "2026-02-23 17:45"
        },
        { 
          id: 3, 
          customerId: 3, 
          customerName: "Hotel Luxe", 
          rating: 5, 
          message: "Excellent water quality! Very happy with the service. The new dispenser works great. Highly recommended.", 
          date: "2026-02-22",
          status: "Replied",
          reply: "Thank you for your feedback! We appreciate your business.",
          repliedBy: "Admin",
          repliedAt: "2026-02-22 11:20"
        },
        { 
          id: 4, 
          customerId: 1, 
          customerName: "Cafe One", 
          rating: 3, 
          message: "Bottle was leaking. Please check quality control. This happened twice this month.", 
          date: "2026-02-21",
          status: "New",
          reply: "",
          repliedBy: null,
          repliedAt: null
        },
        { 
          id: 5, 
          customerId: 4, 
          customerName: "Gym Pro", 
          rating: 5, 
          message: "Perfect for our gym! We order 10 bottles every week and never had any issues. Great service!", 
          date: "2026-02-20",
          status: "Replied",
          reply: "Thank you for being a loyal customer! We appreciate your trust.",
          repliedBy: "Admin",
          repliedAt: "2026-02-20 09:15"
        },
        { 
          id: 6, 
          customerId: 5, 
          customerName: "Jane", 
          rating: 4, 
          message: "Good water, fair price. Delivery guy is friendly. Would recommend.", 
          date: "2026-02-19",
          status: "New",
          reply: "",
          repliedBy: null,
          repliedAt: null
        },
        { 
          id: 7, 
          customerId: 6, 
          customerName: "John", 
          rating: 2, 
          message: "Very disappointed. Order was late and bottle was dirty. Need better quality control.", 
          date: "2026-02-18",
          status: "New",
          reply: "",
          repliedBy: null,
          repliedAt: null
        }
      ],

      // ── Area Zones ───────────────────────────────────────────
      // Tracks demand per area for optimization
      areaZones: [
        {
          id: 1,
          name: "Gulshan",
          activeCustomers: 1,
          avgMonthlyOrders: 8,
          assignedDriverId: 1,
        },
        {
          id: 2,
          name: "DHA",
          activeCustomers: 1,
          avgMonthlyOrders: 5,
          assignedDriverId: 2,
        },
        {
          id: 3,
          name: "Clifton",
          activeCustomers: 1,
          avgMonthlyOrders: 12,
          assignedDriverId: 1,
        },
      ],

      // ── Audit Log ────────────────────────────────────────────
      // Written to on every critical admin action
      auditLog: [
        { 
          id: 1, 
          timestamp: "2026-02-25 08:00:00", 
          action: "LOGIN", 
          entity: "User", 
          entityId: "admin",
          details: "Admin logged in from 192.168.1.100",
          user: "Admin"
        },
        { 
          id: 2, 
          timestamp: "2026-02-25 09:15:23", 
          action: "CREATE", 
          entity: "Order", 
          entityId: "8003",
          details: "New order created for Cafe One - 5 bottles",
          user: "Admin"
        },
        { 
          id: 3, 
          timestamp: "2026-02-25 10:30:45", 
          action: "UPDATE", 
          entity: "Customer", 
          entityId: "2",
          details: "Updated John Smith's phone number",
          user: "Admin"
        },
        { 
          id: 4, 
          timestamp: "2026-02-25 11:20:12", 
          action: "DELETE", 
          entity: "Feedback", 
          entityId: "8",
          details: "Deleted spam feedback",
          user: "Admin"
        },
        { 
          id: 5, 
          timestamp: "2026-02-25 12:05:33", 
          action: "PAYMENT", 
          entity: "Invoice", 
          entityId: "1002",
          details: "Marked invoice as paid - PKR 1,947",
          user: "Admin"
        },
        { 
          id: 6, 
          timestamp: "2026-02-25 13:42:18", 
          action: "EXPORT", 
          entity: "Customers", 
          entityId: null,
          details: "Exported customer list to CSV",
          user: "Admin"
        },
        { 
          id: 7, 
          timestamp: "2026-02-25 14:15:00", 
          action: "VERIFY", 
          entity: "Cash Match", 
          entityId: null,
          details: "Verified daily cash - Difference: PKR 50",
          user: "Admin"
        },
        { 
          id: 8, 
          timestamp: "2026-02-25 15:30:22", 
          action: "REPLY", 
          entity: "Feedback", 
          entityId: "4",
          details: "Replied to customer feedback",
          user: "Admin"
        },
        { 
          id: 9, 
          timestamp: "2026-02-25 16:45:10", 
          action: "UPDATE", 
          entity: "Inventory", 
          entityId: "1",
          details: "Updated stock level for 19L Bottle: +50",
          user: "Admin"
        },
        { 
          id: 10, 
          timestamp: "2026-02-25 17:20:05", 
          action: "LOGOUT", 
          entity: "User", 
          entityId: "admin",
          details: "Admin logged out",
          user: "Admin"
        }
      ],

      // ── Health Alerts (NEW) ──────────────────────────────────
      healthAlerts: [
        { id: 1, customerId: 1, customerName: "Cafe One", alertType: "High Balance", amount: 5000, date: "2026-02-25" },
        { id: 2, customerId: 3, customerName: "Hotel Luxe", alertType: "High Balance", amount: 8000, date: "2026-02-25" },
        { id: 3, customerId: 2, customerName: "John Smith", alertType: "Inactive 15 days", amount: 0, date: "2026-02-25" }
      ],
    };

    localStorage.setItem(this.keys.MAIN, JSON.stringify(demoData));
    console.log(
      "%c DB: Enterprise schema initialized. ",
      "background:#0d6efd;color:#fff;font-weight:bold;",
    );
  },
};

// Auto-init on script load
DB.init();
