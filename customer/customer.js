/**
 * AquaFlow - Customer & Public Application
 * Includes Auth, Landing Page, and Customer Portal logic.
 */

/**
 * Authentication Logic (Login / Signup)
 */
const AuthApp = {
  demoCredentials: {
    admin: { email: "admin@aquaflow.com", password: "admin123" },
    driver: { email: "driver@aquaflow.com", password: "driver123" },
    customer: { email: "customer@aquaflow.com", password: "customer123" },
  },

  roleRedirects: {
    customer: "customer/customer-portal.html",
    admin: "admin/admin-dashboard.html",
    driver: "driver/driver-dashboard.html",
  },

  dom: {},

  init() {
    console.log("AuthApp: Initializing...");
    this.cacheDOM();
    this.bindEvents();
    this.loadRememberedUser();
  },

  cacheDOM() {
    this.dom = {
      loginForm: document.getElementById("loginForm"),
      emailInput: document.getElementById("emailInput"),
      passwordInput: document.getElementById("passwordInput"),
      togglePassword: document.getElementById("togglePassword"),
      toggleIcon: document.getElementById("toggleIcon"),
      rememberMe: document.getElementById("rememberMe"),
      loginBtn: document.getElementById("loginBtn"),
      loginBtnText: document.getElementById("loginBtnText"),
      loginSpinner: document.getElementById("loginSpinner"),
      loginError: document.getElementById("loginError"),
      loginErrorMessage: document.getElementById("loginErrorMessage"),
      emailError: document.getElementById("emailError"),
      passwordError: document.getElementById("passwordError"),
      roleButtons: document.querySelectorAll(".role-btn, .role-btn-small"),
      demoBadges: document.querySelectorAll(".demo-badge"),
      demoSection: document.getElementById("demoSection"),
      signupForm: document.getElementById("signupForm"),
      signupPassword: document.getElementById("signupPassword"),
      toggleSignupPassword: document.getElementById("toggleSignupPassword"),
    };
  },

  bindEvents() {
    if (this.dom.loginForm) {
      this.dom.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
    if (this.dom.togglePassword) {
      this.dom.togglePassword.addEventListener("click", () => this.togglePasswordVisibility());
    }
    this.dom.roleButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const role = e.currentTarget.dataset.role;
        this.handleRoleRedirect(role, e);
      });
    });
    this.dom.demoBadges.forEach((badge) => {
      badge.addEventListener("click", (e) => {
        const demoType = e.currentTarget.dataset.demo;
        this.autofillDemo(demoType);
      });
    });
    if (this.dom.emailInput) {
      this.dom.emailInput.addEventListener("blur", () => this.validateEmail());
      this.dom.emailInput.addEventListener("input", () => {
        if (this.dom.emailInput.classList.contains("is-invalid")) this.validateEmail();
      });
    }
    if (this.dom.passwordInput) {
      this.dom.passwordInput.addEventListener("blur", () => this.validatePassword());
      this.dom.passwordInput.addEventListener("input", () => {
        if (this.dom.passwordInput.classList.contains("is-invalid")) this.validatePassword();
      });
    }
    if (this.dom.signupForm) {
      this.dom.signupForm.addEventListener("submit", (e) => this.handleSignup(e));
      if (this.dom.toggleSignupPassword) {
        this.setupPasswordToggle("signupPassword", "toggleSignupPassword");
      }
      this.setupPasswordStrength("signupPassword");
    }
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (this.dom.loginForm && document.activeElement.form === this.dom.loginForm) {
          this.dom.loginForm.dispatchEvent(new Event("submit"));
        }
      }
    });
  },

  loadRememberedUser() {
    const remembered = DB.getRememberedUser();
    if (remembered && this.dom.emailInput) {
      this.dom.emailInput.value = remembered.email;
      if (this.dom.rememberMe) this.dom.rememberMe.checked = true;
    }
  },

  togglePasswordVisibility() {
    const input = this.dom.passwordInput;
    const icon = this.dom.toggleIcon;
    const btn = this.dom.togglePassword;
    if (!input || !icon) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.classList.add("active");
    if (isPassword) { icon.classList.remove("bi-eye"); icon.classList.add("bi-eye-slash"); }
    else { icon.classList.remove("bi-eye-slash"); icon.classList.add("bi-eye"); }
    setTimeout(() => btn.classList.remove("active"), 200);
  },

  validateEmail() {
    const email = this.dom.emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.dom.emailInput.classList.add("is-invalid");
      this.dom.emailError.textContent = "Email is required.";
      return false;
    } else if (!emailRegex.test(email)) {
      this.dom.emailInput.classList.add("is-invalid");
      this.dom.emailError.textContent = "Please enter a valid email address.";
      return false;
    } else {
      this.dom.emailInput.classList.remove("is-invalid");
      this.dom.emailInput.classList.add("is-valid");
      return true;
    }
  },

  validatePassword() {
    const password = this.dom.passwordInput.value;
    if (!password) {
      this.dom.passwordInput.classList.add("is-invalid");
      this.dom.passwordError.textContent = "Password is required.";
      return false;
    } else {
      this.dom.passwordInput.classList.remove("is-invalid");
      this.dom.passwordInput.classList.add("is-valid");
      return true;
    }
  },

  handleLogin(e) {
    e.preventDefault();
    this.dom.loginError.classList.add("d-none");
    if (!this.validateEmail() || !this.validatePassword()) return;
    const email = this.dom.emailInput.value.trim().toLowerCase();
    const password = this.dom.passwordInput.value;
    const rememberMe = this.dom.rememberMe?.checked || false;
    this.setLoadingState(true);
    setTimeout(() => {
      let userRole = "customer";
      for (const [role, creds] of Object.entries(this.demoCredentials)) {
        if (email === creds.email && password === creds.password) { userRole = role; break; }
      }
      if (email.includes("admin")) userRole = "admin";
      else if (email.includes("driver")) userRole = "driver";

      const isValid = this.validateCredentials(email, password);
      if (!isValid) {
        this.setLoadingState(false);
        this.dom.loginError.classList.remove("d-none");
        this.dom.loginErrorMessage.textContent = "Invalid email or password. Please try again.";
        return;
      }

      if (rememberMe) DB.setRememberedUser(email); else DB.clearRememberedUser();
      DB.setSessionUser({ email, role: this.capitalizeFirst(userRole) });
      window.location.href = this.roleRedirects[userRole];
    }, 1500);
  },

  validateCredentials(email, password) {
      return true; // Simplified for prototype
  },

  setLoadingState(isLoading) {
    if (isLoading) {
      this.dom.loginBtn.disabled = true;
      this.dom.loginBtnText.classList.add("invisible");
      this.dom.loginSpinner.classList.remove("d-none");
    } else {
      this.dom.loginBtn.disabled = false;
      this.dom.loginBtnText.classList.remove("invisible");
      this.dom.loginSpinner.classList.add("d-none");
    }
  },

  autofillDemo(role) {
    const creds = this.demoCredentials[role];
    if (creds) {
      this.dom.emailInput.value = "";
      this.dom.passwordInput.value = "";
      let i = 0, j = 0;
      const typeEmail = setInterval(() => {
        if (i < creds.email.length) this.dom.emailInput.value += creds.email[i++];
        else {
          clearInterval(typeEmail);
          const typePass = setInterval(() => {
            if (j < creds.password.length) this.dom.passwordInput.value += creds.password[j++];
            else clearInterval(typePass);
          }, 30);
        }
      }, 30);
    }
  },

  handleRoleRedirect(role, e) {
    e.preventDefault();
    DB.setSessionUser({ email: this.demoCredentials[role].email, role: this.capitalizeFirst(role) });
    window.location.href = this.roleRedirects[role];
  },

  setupPasswordToggle(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (input && btn) {
      btn.addEventListener("click", () => {
        input.type = input.type === "password" ? "text" : "password";
        const icon = btn.querySelector("i");
        if (icon) {
          if (input.type === "text") { icon.classList.remove("bi-eye"); icon.classList.add("bi-eye-slash"); }
          else { icon.classList.remove("bi-eye-slash"); icon.classList.add("bi-eye"); }
        }
      });
    }
  },

  setupPasswordStrength(inputId) {
    const input = document.getElementById(inputId);
    const meterBar = document.getElementById("passwordStrengthBar");
    const meterText = document.getElementById("passwordStrengthText");
    if (input && meterBar) {
      input.addEventListener("input", (e) => {
        const val = e.target.value;
        let s = 0;
        if (val.length >= 6) s++;
        if (val.length >= 10) s++;
        if (/[A-Z]/.test(val)) s++;
        if (/[0-9]/.test(val)) s++;
        if (/[^A-Za-z0-9]/.test(val)) s++;
        meterBar.className = "password-meter-bar";
        if (val.length === 0) { meterBar.style.width = "0%"; if (meterText) meterText.textContent = "Strength: Weak"; }
        else if (s < 2) { meterBar.classList.add("strength-weak"); meterBar.style.width = "30%"; if (meterText) meterText.textContent = "Strength: Weak"; }
        else if (s < 4) { meterBar.classList.add("strength-medium"); meterBar.style.width = "60%"; if (meterText) meterText.textContent = "Strength: Medium"; }
        else { meterBar.classList.add("strength-strong"); meterBar.style.width = "100%"; if (meterText) meterText.textContent = "Strength: Strong"; }
      });
    }
  },

  handleSignup(e) {
    e.preventDefault();
    const inputs = {
      name: document.getElementById("fullName"),
      email: document.getElementById("signupEmail"),
      phone: document.getElementById("signupPhone"),
      address: document.getElementById("signupAddress"),
      pass: document.getElementById("signupPassword"),
      confirm: document.getElementById("confirmPassword"),
      terms: document.getElementById("termsCheck"),
    };
    let valid = true;
    Object.values(inputs).forEach(i => i?.classList.remove("is-invalid"));
    if (!inputs.name.value) { inputs.name.classList.add("is-invalid"); valid = false; }
    if (!inputs.email.value.includes("@")) { inputs.email.classList.add("is-invalid"); valid = false; }
    if (!inputs.phone.value || inputs.phone.value.length < 10) { inputs.phone.classList.add("is-invalid"); valid = false; }
    if (!inputs.address.value) { inputs.address.classList.add("is-invalid"); valid = false; }
    if (inputs.pass.value.length < 6) { inputs.pass.classList.add("is-invalid"); valid = false; }
    if (inputs.pass.value !== inputs.confirm.value) { inputs.confirm.classList.add("is-invalid"); valid = false; }
    if (!inputs.terms.checked) { inputs.terms.classList.add("is-invalid"); valid = false; }
    if (!valid) return;

    this.toggleLoading(document.getElementById("btnSignUp"), true);
    setTimeout(() => {
      DB.setSessionUser({ name: inputs.name.value, email: inputs.email.value, role: "Customer" });
      window.location.href = "customer/customer-portal.html";
    }, 1500);
  },

  toggleLoading(btn, isLoading) {
    if (!btn) return;
    const txt = btn.querySelector(".btn-text"), ldr = btn.querySelector(".btn-loader");
    if (isLoading) { btn.classList.add("disabled"); txt?.classList.add("invisible"); ldr?.classList.remove("d-none"); }
    else { btn.classList.remove("disabled"); txt?.classList.remove("invisible"); ldr?.classList.add("d-none"); }
  },

  capitalizeFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
};

/**
 * Landing Page Logic
 */
const HomeApp = {
  init() {
    console.log("HomeApp: Initializing...");
    this.bindEvents();
    this.initAnimations();
  },
  bindEvents() {
    const nav = document.querySelector(".navbar-glass");
    if (nav) { window.addEventListener("scroll", () => { if (window.scrollY > 50) nav.classList.add("scrolled"); else nav.classList.remove("scrolled"); }); }
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener("click", function(e) {
        const tid = this.getAttribute("href");
        if (tid === "#" || !tid.startsWith("#")) return;
        const target = document.querySelector(tid);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });
  },
  initAnimations() {
    const obs = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll(".fade-in, .slide-up").forEach(el => {
      el.style.opacity = "0"; el.style.transform = "translateY(20px)"; el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
      obs.observe(el);
    });
  }
};

/**
 * Customer Portal Application
 */
const CustomerPortalApp = {
  state: { vacationMode: false, bottleCount: 5, maxBottles: 10, currentSection: "home", feedbackEntries: [], ledgerData: [], invoiceData: [], selectedRating: 0 },
  dom: {},

  init() {
    if (!this.checkRole()) return;
    console.log("CustomerPortalApp: Initializing...");
    this.cacheDOM();
    this.generateMockData();
    this.bindEvents();
    this.render();
    this.updateBottleCount(this.state.bottleCount);
  },

  checkRole() {
     const user = DB.getSessionUser();
     if(user) {
         if(user.role !== 'Customer') {
             alert("Access Denied: Customers Only");
             window.location.href = '../index.html';
             return false;
         }
     }
     return true;
  },

  cacheDOM() {
    this.dom = {
      desktopNavLinks: document.querySelectorAll(".customer-nav .nav-link"),
      mobileNavItems: document.querySelectorAll(".mobile-nav-item"),
      sections: document.querySelectorAll(".customer-section"),
      logoutBtn: document.getElementById("logoutBtn"),
      customerName: document.getElementById("customerName"),
      vacationToggle: document.getElementById("vacationToggle"),
      bottleCountDisplay: document.getElementById("bottleCountDisplay"),
      bottleProgressBar: document.getElementById("bottleProgressBar"),
      bottleWarning: document.getElementById("bottleWarning"),
      requestDeliveryCard: document.getElementById("requestDeliveryCard"),
      viewInvoiceCard: document.getElementById("viewInvoiceCard"),
      contactSupportCard: document.getElementById("contactSupportCard"),
      trackOrderBtn: document.getElementById("trackOrderBtn"),
      viewInvoicesAction: document.getElementById("viewInvoicesAction"),
      ledgerMonthFilter: document.getElementById("ledgerMonthFilter"),
      ledgerTableBody: document.getElementById("ledgerTableBody"),
      invoicesTableBody: document.getElementById("invoicesTableBody"),
      invoiceModal: new bootstrap.Modal(document.getElementById("invoiceModal")),
      modalInvoiceId: document.getElementById("modalInvoiceId"),
      modalAmount: document.getElementById("modalAmount"),
      modalStatus: document.getElementById("modalStatus"),
      modalMonth: document.getElementById("modalMonth"),
      modalBottles: document.getElementById("modalBottles"),
      feedbackForm: document.getElementById("feedbackForm"),
      starRating: document.getElementById("starRating"),
      starIcons: document.querySelectorAll(".star-icon"),
      ratingValue: document.getElementById("ratingValue"),
      ratingError: document.getElementById("ratingError"),
      driverBehavior: document.getElementById("driverBehavior"),
      feedbackComment: document.getElementById("feedbackComment"),
      submitFeedbackBtn: document.getElementById("submitFeedbackBtn"),
      recentFeedbackList: document.getElementById("recentFeedbackList"),
    };
  },

  showToast(message, type = "info") {
    let container = document.querySelector('.toast-container');
    if(!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
    toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 4000);
  },

  generateMockData() {
    const months = ["2026-01", "2025-12", "2025-11"];
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const month = months[Math.floor(Math.random() * months.length)];
      const date = `${month}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, "0")}`;
      dates.push({ date: date, delivered: Math.floor(Math.random() * 5) + 1, returned: Math.floor(Math.random() * 4), amount: (Math.floor(Math.random() * 3) + 1) * 900, status: Math.random() > 0.3 ? "Paid" : "Unpaid" });
    }
    this.state.ledgerData = dates.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.state.invoiceData = [
      { id: "#INV-2026-001", month: "January 2026", amount: 4500, status: "Unpaid", bottles: 15 },
      { id: "#INV-2025-012", month: "December 2025", amount: 3600, status: "Paid", bottles: 12 },
    ];
    this.state.feedbackEntries = [
      { id: 1, rating: 5, driverBehavior: "excellent", comment: "Great service!", date: "2026-01-28" },
    ];
  },

  bindEvents() {
    this.dom.desktopNavLinks.forEach(l => l.addEventListener("click", (e) => this.switchSection(e.currentTarget.dataset.section)));
    this.dom.mobileNavItems.forEach(i => i.addEventListener("click", (e) => this.switchSection(e.currentTarget.dataset.section)));
    this.dom.logoutBtn?.addEventListener("click", () => this.handleLogout());
    this.dom.vacationToggle?.addEventListener("change", (e) => this.handleVacationToggle(e.target.checked));
    this.dom.requestDeliveryCard?.addEventListener("click", () => this.requestDelivery());
    this.dom.viewInvoiceCard?.addEventListener("click", () => this.switchSection("invoices"));
    this.dom.contactSupportCard?.addEventListener("click", () => this.showToast("Opening WhatsApp Support...", "info"));
    this.dom.trackOrderBtn?.addEventListener("click", () => this.showToast("Your next delivery is scheduled for tomorrow.", "info"));
    this.dom.viewInvoicesAction?.addEventListener("click", () => this.switchSection("invoices"));
    this.dom.invoicesTableBody?.addEventListener("click", (e) => { const btn = e.target.closest(".view-invoice-btn"); if (btn) this.openInvoiceModal(btn.dataset.id); });
    this.dom.ledgerMonthFilter?.addEventListener("change", (e) => this.renderLedger(e.target.value));
    this.dom.starIcons.forEach(s => s.addEventListener("click", () => this.setRating(parseInt(s.dataset.rating))));
    this.dom.feedbackForm?.addEventListener("submit", (e) => { e.preventDefault(); this.submitFeedback(); });
  },

  render() { this.renderLedger(); this.renderInvoices(); this.renderFeedback(); },

  renderInvoices() {
    if (!this.dom.invoicesTableBody) return;
    this.dom.invoicesTableBody.innerHTML = this.state.invoiceData.map(inv => `
            <tr>
                <td class="ps-4 fw-medium text-dark">${inv.id}</td>
                <td>${inv.month}</td>
                <td class="fw-bold text-dark">PKR ${inv.amount.toLocaleString()}</td>
                <td><span class="badge rounded-pill ${inv.status === "Paid" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"} border">${inv.status}</span></td>
                <td class="text-end pe-4"><button class="btn btn-sm btn-outline-primary rounded-pill view-invoice-btn" data-id="${inv.id}">Details</button></td>
            </tr>
        `).join("");
  },

  openInvoiceModal(id) {
    const inv = this.state.invoiceData.find(i => i.id === id);
    if (!inv) return;
    this.dom.modalInvoiceId.textContent = inv.id;
    this.dom.modalMonth.textContent = inv.month;
    this.dom.modalBottles.textContent = inv.bottles;
    this.dom.modalAmount.textContent = `PKR ${inv.amount.toLocaleString()}`;
    this.dom.modalStatus.textContent = inv.status;
    this.dom.modalStatus.className = `badge rounded-pill mt-2 border ${inv.status === "Paid" ? "bg-success-subtle text-success border-success-subtle" : "bg-warning-subtle text-warning border-warning-subtle"}`;
    this.dom.invoiceModal.show();
  },

  switchSection(id) {
    this.state.currentSection = id;
    this.dom.sections.forEach(s => s.classList.toggle("active", s.id === id));
    this.dom.desktopNavLinks.forEach(l => l.classList.toggle("active", l.dataset.section === id));
    this.dom.mobileNavItems.forEach(i => i.classList.toggle("active", i.dataset.section === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  handleLogout() { if (confirm("Log out?")) { DB.clearRememberedUser(); window.location.href = "../login.html"; } },

  handleVacationToggle(isEnabled) {
    this.state.vacationMode = isEnabled;
    const data = DB.getMainData();
    if(data && data.customers) {
        const userId = 'CUST-001'; // Mock
        const cust = data.customers.find(c => c.id === userId);
        if(cust) { cust.status = isEnabled ? 'Vacation' : 'Active'; DB.saveData('customers', data.customers); }
    }
    this.showToast(isEnabled ? "Vacation mode enabled." : "Vacation mode disabled.", isEnabled ? "warning" : "success");
  },

  updateBottleCount(count) {
    this.state.bottleCount = count;
    if (this.dom.bottleCountDisplay) this.dom.bottleCountDisplay.textContent = count;
    if (this.dom.bottleProgressBar) { this.dom.bottleProgressBar.style.width = `${(count / this.state.maxBottles) * 100}%`; }
    if (this.dom.bottleWarning) this.dom.bottleWarning.classList.toggle("d-none", count < 8);
  },

  requestDelivery() {
    if(this.state.vacationMode) { this.showToast("Cannot request delivery in Vacation Mode.", "error"); return; }
    this.showToast("Delivery request submitted!", "success");
  },

  renderLedger(filter = "all") {
    if (!this.dom.ledgerTableBody) return;
    let data = this.state.ledgerData;
    if (filter !== "all") data = data.filter(e => e.date.startsWith(filter));
    let bal = 2500;
    this.dom.ledgerTableBody.innerHTML = data.map(e => {
        const isPaid = e.status === 'Paid';
        bal = isPaid ? bal - e.amount : bal + e.amount;
        return `<tr><td>${new Date(e.date).toLocaleDateString()}</td><td class="text-center">${e.delivered}</td><td class="text-end text-success">${isPaid ? '+'+e.amount.toLocaleString() : '-'}</td><td class="text-end text-danger">${!isPaid ? e.amount.toLocaleString() : '-'}</td><td class="text-end fw-bold">PKR ${Math.abs(bal).toLocaleString()}</td></tr>`;
    }).join("");
  },

  setRating(r) {
    this.state.selectedRating = r;
    this.dom.ratingValue.value = r;
    this.dom.starIcons.forEach((s, i) => { s.classList.toggle("bi-star-fill", i < r); s.classList.toggle("active", i < r); s.classList.toggle("bi-star", i >= r); });
  },

  submitFeedback() {
    if (this.state.selectedRating === 0) { this.dom.ratingError.textContent = "Please select a rating"; return; }
    if (!this.dom.feedbackForm.checkValidity()) { this.dom.feedbackForm.classList.add("was-validated"); return; }
    this.state.feedbackEntries.unshift({ id: Date.now(), rating: this.state.selectedRating, driverBehavior: this.dom.driverBehavior.value, comment: this.dom.feedbackComment.value, date: new Date().toISOString().split("T")[0] });
    this.renderFeedback();
    this.dom.feedbackForm.reset();
    this.setRating(0);
    this.showToast("Thank you for your feedback!", "success");
  },

  renderFeedback() {
    if (!this.dom.recentFeedbackList) return;
    this.dom.recentFeedbackList.innerHTML = this.state.feedbackEntries.map(e => `
            <div class="feedback-entry">
                <div class="d-flex justify-content-between mb-2"><div>${this.renderStars(e.rating)}</div><small>${new Date(e.date).toLocaleDateString()}</small></div>
                <div class="mb-2"><small>Driver:</small> <span class="badge bg-primary">${e.driverBehavior}</span></div>
                ${e.comment ? `<p class="small mb-0">${e.comment}</p>` : ""}
            </div>
        `).join("");
  },

  renderStars(r) { return Array.from({length: 5}, (_, i) => `<i class="bi bi-star${i < r ? '-fill' : ''}"></i>`).join(""); }
};

/**
 * Global Boot Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm') || document.getElementById('signupForm')) AuthApp.init();
    else if (document.body.classList.contains('customer-portal-body') || document.querySelector('.customer-nav')) CustomerPortalApp.init();
    else if (document.querySelector('.hero-section')) HomeApp.init();
});
