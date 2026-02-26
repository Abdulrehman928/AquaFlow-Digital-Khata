/**
 * Aqua Flow - Driver Portal Application
 * Optimized for operational delivery management
 */

const DriverApp = {
  state: {
    currentDriver: { name: "Mike", route: "Route #42", area: "Downtown" },
    deliveries: [],
    stats: {
      totalDeliveries: 0,
      completedDeliveries: 0,
      bottlesDelivered: 0,
      bottlesCollected: 0,
      bottlesPending: 0,
      earningsToday: 0,
      earningsWeek: 0,
      earningsMonth: 0,
    },
    activeNav: "run",
    gateAccess: false,
  },

  config: {
    earningsPerDelivery: 150,
  },

  dom: {},
  qrScanner: null,

  init() {
    this.checkRole();
    this.cacheDOM();
    this.loadData();
    this.bindEvents();
    this.checkGateAccess();
    this.render();
  },

  checkRole() {
     const user = DB.getSessionUser();
     if(user) {
         if(user.role !== 'Driver' && user.role !== 'Admin') {
             alert("Access Denied: Drivers Only");
             window.location.href = '../index.html';
         }
     }
  },

  checkGateAccess() {
      if(sessionStorage.getItem('gateAccess') === 'true') {
          this.state.gateAccess = true;
      }
  },

  cacheDOM() {
    this.dom = {
      progressPercentage: document.getElementById("progressPercentage"),
      completedCount: document.getElementById("completedCount"),
      progressStatus: document.getElementById("progressStatus"),
      progressBar: document.getElementById("progressBar"),
      bottlesDelivered: document.getElementById("bottlesDelivered"),
      bottlesCollected: document.getElementById("bottlesCollected"),
      bottlesPending: document.getElementById("bottlesPending"),
      pendingIndicator: document.getElementById("pendingIndicator"),
      earningsToday: document.getElementById("earningsToday"),
      earningsWeek: document.getElementById("earningsWeek"),
      earningsMonth: document.getElementById("earningsMonth"),
      deliveryList: document.getElementById("deliveryList"),
      issueForm: document.getElementById("issueForm"),
      issueDescription: document.getElementById("issueDescription"),
      navItems: document.querySelectorAll(".mobile-nav-item"),
      qrModal: document.getElementById("qrScanModal"),
      scanResult: document.getElementById("scanResult"),
      scanTriggerBtn: document.getElementById("scanTriggerBtn") 
    };
  },
  
  loadData() {
    console.log("DriverApp: Syncing with Central Database...");
    
    // Fetch orders from central DB (Single Source of Truth)
    const allOrders = DB.getData('orders');
    
    if (allOrders) {
      // Filter orders assigned to this driver (Demo uses Zubair or Hassan)
      // For demo purposes, we show all pending/in-transit orders to simulate a "Run"
      this.state.deliveries = allOrders.filter(o => o.status !== "Completed" && o.status !== "Cancelled");
      console.log(`DriverApp: Loaded ${this.state.deliveries.length} active orders.`);
    } else {
      console.warn("DriverApp: No orders found in central DB.");
      this.state.deliveries = [];
    }

    this.calculateStats();
  },

  calculateStats() {
    const allOrders = DB.getData('orders') || [];
    const myOrders = allOrders; // In a real app, filter by driver ID

    this.state.stats.totalDeliveries = myOrders.length;
    this.state.stats.completedDeliveries = myOrders.filter(o => o.status === "Delivered" || o.status === "Completed").length;

    // Simulate bottle counts based on order quantities
    this.state.stats.bottlesDelivered = myOrders
      .filter(o => o.status === "Delivered" || o.status === "Completed")
      .reduce((sum, o) => sum + (o.qty || 0), 0);
      
    this.state.stats.bottlesPending = myOrders
      .filter(o => o.status === "Pending" || o.status === "In Transit")
      .reduce((sum, o) => sum + (o.qty || 0), 0);

    this.state.stats.earningsToday = this.state.stats.completedDeliveries * this.config.earningsPerDelivery;
    this.state.stats.earningsWeek = this.state.stats.earningsToday * 5.5;
    this.state.stats.earningsMonth = this.state.stats.earningsWeek * 4.2;
  },

  saveData() {
    // We don't save a separate "driverData" anymore. 
    // We update the central "orders" in the main database.
    const allOrders = DB.getData('orders') || [];
    
    // Sync local changes back to the master list
    this.state.deliveries.forEach(localOrder => {
        const index = allOrders.findIndex(o => o.id === localOrder.id);
        if (index !== -1) {
            allOrders[index] = localOrder;
        }
    });

    DB.saveData('orders', allOrders);
    console.log("DriverApp: Orders synced to Central Database.");
  },

  bindEvents() {
    this.dom.navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const nav = e.currentTarget.dataset.nav;
        if (nav) {
          this.navigate(nav, e);
        }
      });
    });

    if (this.dom.qrModal) {
      this.dom.qrModal.addEventListener("shown.bs.modal", () => {
        this.startQRScanner();
      });
      this.dom.qrModal.addEventListener("hidden.bs.modal", () => {
        this.stopQRScanner();
      });
    }

    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  },

  handleConnectionChange(isOnline) {
      if(isOnline) {
          this.utils.showToast("Back online. Syncing data...", "success");
          this.syncData();
      } else {
          this.utils.showToast("You are offline. Changes will be saved locally.", "warning");
      }
  },

  syncData() {
      const queue = DB.getOfflineQueue();
      if(queue.length === 0) return;

      setTimeout(() => {
          this.utils.showToast(`Synced ${queue.length} offline actions to server.`, "success");
          DB.clearOfflineQueue();
      }, 2000);
  },

  completeDelivery(deliveryId) {
    const delivery = this.state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery || delivery.completed) return;

    delivery.completed = true;
    delivery.status = "Delivered";

    const oldStats = { ...this.state.stats };
    this.calculateStats();
    
    if(!navigator.onLine) {
        const queue = DB.getOfflineQueue();
        queue.push({
            action: 'COMPLETE_DELIVERY',
            id: deliveryId,
            timestamp: Date.now()
        });
        DB.saveOfflineQueue(queue);
        this.utils.showToast("Saved offline. Will sync when online.", "warning");
    } else {
        this.saveData();
        this.utils.showToast(`Delivery ${deliveryId} marked as completed!`, "success");
    }

    this.updateSingleCard(deliveryId);
    this.updateCountersSmooth(oldStats);
  },

  render() {
    this.renderProgress();
    this.renderBottles();
    this.renderEarnings();
    this.renderDeliveries();
  },

  renderProgress() {
    const { totalDeliveries, completedDeliveries } = this.state.stats;
    const percentage = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;
    const currentPercentage = parseInt(this.dom.progressPercentage?.textContent || "0");

    if (this.dom.progressPercentage) {
      this.utils.animateValue(this.dom.progressPercentage, currentPercentage, percentage, 600, "%");
    }
    if (this.dom.completedCount) {
      this.dom.completedCount.textContent = `${completedDeliveries}/${totalDeliveries}`;
    }
    if (this.dom.progressBar) {
      this.dom.progressBar.style.transition = "width 0.6s ease";
      this.dom.progressBar.style.width = `${percentage}%`;
    }
    if (this.dom.progressStatus) {
      if (percentage >= 80) {
        this.dom.progressStatus.textContent = "Excellent!";
        this.dom.progressStatus.className = "text-success fw-medium";
      } else if (percentage >= 50) {
        this.dom.progressStatus.textContent = "On Track";
        this.dom.progressStatus.className = "text-success fw-medium";
      } else {
        this.dom.progressStatus.textContent = "Keep Going";
        this.dom.progressStatus.className = "text-warning fw-medium";
      }
    }
  },

  renderBottles() {
    const currentDelivered = parseInt(this.dom.bottlesDelivered?.textContent || "0");
    const currentCollected = parseInt(this.dom.bottlesCollected?.textContent || "0");
    const currentPending = parseInt(this.dom.bottlesPending?.textContent || "0");

    if (this.dom.bottlesDelivered) {
      this.utils.animateValue(this.dom.bottlesDelivered, currentDelivered, this.state.stats.bottlesDelivered, 500);
    }
    if (this.dom.bottlesCollected) {
      this.utils.animateValue(this.dom.bottlesCollected, currentCollected, this.state.stats.bottlesCollected, 500);
    }
    if (this.dom.bottlesPending) {
      this.utils.animateValue(this.dom.bottlesPending, currentPending, this.state.stats.bottlesPending, 500);
    }
    if (this.dom.pendingIndicator) {
      this.dom.pendingIndicator.style.display = this.state.stats.bottlesPending > 0 ? "block" : "none";
    }
  },

  renderEarnings() {
    if (this.dom.earningsToday) {
      this.dom.earningsToday.textContent = this.utils.formatCurrency(this.state.stats.earningsToday);
    }
    if (this.dom.earningsWeek) {
      this.dom.earningsWeek.textContent = this.utils.formatCurrency(this.state.stats.earningsWeek);
    }
    if (this.dom.earningsMonth) {
      this.dom.earningsMonth.textContent = this.utils.formatCurrency(this.state.stats.earningsMonth);
    }
  },

  renderDeliveries() {
    if (!this.dom.deliveryList) return;
    
    if(!this.state.gateAccess) {
        this.dom.deliveryList.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-3">
                    <span class="bg-light p-4 rounded-circle d-inline-block">
                        <i class="bi bi-qr-code-scan fs-1 text-primary"></i>
                    </span>
                </div>
                <h4 class="fw-bold text-dark">Route Locked</h4>
                <p class="text-muted mb-4">You must scan the security QR code at the gate to start your run.</p>
                <button class="btn btn-primary-custom px-5 rounded-pill" data-bs-toggle="modal" data-bs-target="#qrScanModal">
                    <i class="bi bi-upc-scan me-2"></i> Scan Gate QR
                </button>
            </div>
        `;
        return;
    }

    const html = this.state.deliveries.map((delivery) => `
            <div class="glass-card p-3 delivery-card" data-id="${delivery.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="fw-bold m-0 text-dark">${delivery.customer}</h6>
                        <small class="text-muted d-block mt-1">
                            <i class="bi bi-geo-alt"></i> ${delivery.address}
                        </small>
                    </div>
                    ${delivery.priority === "High" ? '<span class="badge bg-danger-subtle text-danger">High Priority</span>' : ""}
                </div>
                <div class="row g-2 my-3">
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-box-seam text-primary"></i>
                            <div>
                                <small class="text-muted d-block" style="font-size: 0.7rem;">To Deliver</small>
                                <strong>${delivery.bottlesToDeliver} bottles</strong>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-arrow-repeat text-success"></i>
                            <div>
                                <small class="text-muted d-block" style="font-size: 0.7rem;">To Collect</small>
                                <strong>${delivery.bottlesToCollect} empties</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-pin-map text-info"></i>
                        <small class="text-muted">${delivery.distance}</small>
                    </div>
                    ${this.renderStatusBadge(delivery.status)}
                </div>
                <div class="d-flex gap-2">
                    ${delivery.completed
                        ? `<button class="btn btn-sm btn-outline-secondary flex-grow-1" disabled><i class="bi bi-check-circle"></i> Completed</button>`
                        : `<button class="btn btn-sm btn-primary-custom flex-grow-1" onclick="DriverApp.completeDelivery('${delivery.id}')"><i class="bi bi-check-circle"></i> Mark as Delivered</button>`
                    }
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}" target="_blank" class="btn btn-sm btn-white-glass" aria-label="Navigate to address"><i class="bi bi-navigation"></i></a>
                    <a href="tel:${delivery.phone}" class="btn btn-sm btn-white-glass" aria-label="Call customer"><i class="bi bi-telephone"></i></a>
                </div>
            </div>
        `).join("");

    this.dom.deliveryList.innerHTML = html;
  },

  renderStatusBadge(status) {
    const badgeClass = status === "Delivered" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning";
    return `<span class="badge ${badgeClass}">${status}</span>`;
  },

  updateSingleCard(deliveryId) {
    const card = document.querySelector(`[data-id="${deliveryId}"]`);
    if (!card) return;
    const delivery = this.state.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return;
    const buttonContainer = card.querySelector(".d-flex.gap-2");
    if (buttonContainer) {
      const newButton = `<button class="btn btn-sm btn-outline-secondary flex-grow-1" disabled><i class="bi bi-check-circle"></i> Completed</button>`;
      const firstButton = buttonContainer.querySelector("button, a");
      if (firstButton && firstButton.tagName === "BUTTON") firstButton.outerHTML = newButton;
    }
    const statusBadge = card.querySelector(".badge");
    if (statusBadge) {
      statusBadge.className = "badge bg-success-subtle text-success";
      statusBadge.textContent = "Delivered";
    }
    card.style.transition = "all 0.3s ease";
    card.style.opacity = "0.7";
    setTimeout(() => { card.style.opacity = "1"; }, 150);
  },

  updateCountersSmooth(oldStats) {
    const newStats = this.state.stats;
    const oldPercentage = oldStats.totalDeliveries > 0 ? Math.round((oldStats.completedDeliveries / oldStats.totalDeliveries) * 100) : 0;
    const newPercentage = newStats.totalDeliveries > 0 ? Math.round((newStats.completedDeliveries / newStats.totalDeliveries) * 100) : 0;

    if (this.dom.progressPercentage) {
      this.utils.animateValue(this.dom.progressPercentage, oldPercentage, newPercentage, 600, "%");
    }
    if (this.dom.completedCount) this.dom.completedCount.textContent = `${newStats.completedDeliveries}/${newStats.totalDeliveries}`;
    if (this.dom.progressBar) {
      this.dom.progressBar.style.transition = "width 0.6s ease";
      this.dom.progressBar.style.width = `${newPercentage}%`;
    }
    if (this.dom.bottlesDelivered) this.utils.animateValue(this.dom.bottlesDelivered, oldStats.bottlesDelivered, newStats.bottlesDelivered, 500);
    if (this.dom.bottlesCollected) this.utils.animateValue(this.dom.bottlesCollected, oldStats.bottlesCollected, newStats.bottlesCollected, 500);
    if (this.dom.bottlesPending) this.utils.animateValue(this.dom.bottlesPending, oldStats.bottlesPending, newStats.bottlesPending, 500);
    if (this.dom.earningsToday) this.dom.earningsToday.textContent = this.utils.formatCurrency(newStats.earningsToday);
    if (this.dom.earningsWeek) this.dom.earningsWeek.textContent = this.utils.formatCurrency(newStats.earningsWeek);
    if (this.dom.earningsMonth) this.dom.earningsMonth.textContent = this.utils.formatCurrency(newStats.earningsMonth);
    if (this.dom.progressStatus) {
      if (newPercentage >= 80) {
        this.dom.progressStatus.textContent = "Excellent!";
        this.dom.progressStatus.className = "text-success fw-medium";
      } else if (newPercentage >= 50) {
        this.dom.progressStatus.textContent = "On Track";
        this.dom.progressStatus.className = "text-success fw-medium";
      } else {
        this.dom.progressStatus.textContent = "Keep Going";
        this.dom.progressStatus.className = "text-warning fw-medium";
      }
    }
    if (this.dom.pendingIndicator) this.dom.pendingIndicator.style.display = newStats.bottlesPending > 0 ? "block" : "none";
  },

  submitIssue() {
    const form = this.dom.issueForm;
    if (!form) return;
    const issueType = form.querySelector('input[name="issueType"]:checked');
    const description = this.dom.issueDescription;
    if (!issueType) {
      this.utils.showToast("Please select an issue type", "warning");
      return;
    }
    if (!description || description.value.trim().length < 10) {
      this.utils.showToast("Please provide a detailed description (min 10 characters)", "warning");
      return;
    }
    this.utils.showToast("Issue reported successfully. Operations team will review it.", "success");
    form.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById("issueModal"));
    if (modal) modal.hide();
  },

  startQRScanner() {
    if (this.qrScanner) return;
    const reader = document.getElementById("reader");
    if (!reader) return;
    if (typeof Html5Qrcode === "undefined") {
      this.utils.showToast("QR Scanner library not loaded", "danger");
      return;
    }
    this.qrScanner = new Html5Qrcode("reader");
    this.qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (this.dom.scanResult) {
            this.dom.scanResult.textContent = `Gate Access: ${decodedText}`;
            this.dom.scanResult.className = "mt-2 fw-bold text-success";
          }
          this.utils.showToast("QR Code verified! Route unlocked.", "success");
          this.state.gateAccess = true;
          sessionStorage.setItem('gateAccess', 'true');
          this.render();
          setTimeout(() => {
            this.stopQRScanner();
            const modal = bootstrap.Modal.getInstance(this.dom.qrModal);
            if (modal) modal.hide();
          }, 1500);
        }
      ).catch((err) => {
        if (this.dom.scanResult) {
          this.dom.scanResult.textContent = "Camera access denied or unavailable";
          this.dom.scanResult.className = "mt-2 fw-bold text-danger";
        }
      });
  },

  stopQRScanner() {
    if (this.qrScanner) {
      this.qrScanner.stop().then(() => {
          this.qrScanner = null;
          if (this.dom.scanResult) this.dom.scanResult.textContent = "";
      }).catch(() => { this.qrScanner = null; });
    }
  },

  navigate(section, event) {
    if (event) event.preventDefault();
    this.dom.navItems.forEach((item) => {
      if (item.dataset.nav === section) item.classList.add("active");
      else item.classList.remove("active");
    });
    this.state.activeNav = section;
    const targetElement = event?.currentTarget?.getAttribute("href");
    if (targetElement && targetElement !== "#") {
      const target = document.querySelector(targetElement);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  utils: {
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(amount);
    },
    animateValue: (element, start, end, duration, suffix = "") => {
      if (!element) return;
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    },
    showToast(message, type = "info") {
      let container = document.querySelector(".toast-container");
      if (!container) {
        container = document.createElement("div");
        container.className = "toast-container position-fixed bottom-0 end-0 p-3";
        document.body.appendChild(container);
      }
      const toastEl = document.createElement("div");
      toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
      toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
      container.appendChild(toastEl);
      setTimeout(() => toastEl.remove(), 4000);
    },
  },
};

document.addEventListener("DOMContentLoaded", () => {
  DriverApp.init();
});
