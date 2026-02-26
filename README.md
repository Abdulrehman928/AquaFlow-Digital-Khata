# 💧 Aqua Flow - Water ERP System

A professional, responsive multi-user Water ERP system for managing water delivery operations.

![Water Blue Theme](https://img.shields.io/badge/Theme-Water%20Blue-0891b2)
![Responsive](https://img.shields.io/badge/Design-Responsive-06b6d4)
![Frontend](https://img.shields.io/badge/Type-Frontend%20Prototype-22d3ee)

## 🌟 Overview

Aqua Flow is a comprehensive water delivery management system designed for three user types:

- **Admin** - Business analytics, alerts, and management
- **Driver** - Mobile-optimized delivery tracking with QR scanning
- **Customer** - Order management and vacation mode

## ✨ Key Features

### 🎨 Design

- **Water Blue Theme** - Professional cyan color palette
- **Glassmorphism** - Modern translucent card effects
- **Responsive Layout** - Mobile-first for Driver/Customer, Desktop-first for Admin
- **Smooth Animations** - Hover effects, transitions, and micro-interactions

### 🔐 Authentication

- Role-based login system
- Quick demo login buttons for testing
- Password strength indicator
- Form validation

### 📊 Admin Dashboard

- Business health alerts (color-coded)
- Key performance metrics with progress bars
- Searchable delivery table
- Responsive sidebar navigation

### 🚚 Driver Portal

- QR code gate verification
- Delivery cards with maps integration
- Call customer directly
- Bottom navigation (mobile-optimized)

### 👤 Customer Portal

- Vacation mode toggle
- Account balance display
- WhatsApp notifications
- Order history

### 🔧 Advanced Features

- **QR Scanner** - Camera-based gate verification
- **Offline Support** - Network detection with auto-sync
- **WhatsApp Integration** - One-click messaging
- **Toast Notifications** - User feedback system

## 📁 Project Structure

```
Project Prototype/
├── css/
│   └── style.css              # Complete design system
├── js/
│   ├── app.js                 # Main application logic
│   ├── qr-logic.js            # QR scanner
│   └── offline-support.js     # Offline support
├── index.html                 # Homepage
├── login.html                 # Login page
├── signup.html                # Signup page
├── admin-dashboard.html       # Admin dashboard
├── driver-portal.html         # Driver portal
└── customer-portal.html       # Customer portal
```

## 🚀 Quick Start

### Option 1: Direct File Opening

1. Navigate to the project folder
2. Double-click `index.html`
3. Browser will open the homepage

### Option 2: Local Server (Recommended)

```powershell
# Using Python
cd "C:\Users\Cd Inn\Desktop\Project Prototype"
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option 3: Live Server (VS Code)

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## 🎯 Testing the System

### Quick Demo Login

The login page includes quick demo buttons:

- **Login as Admin** → Access admin dashboard
- **Login as Driver** → Access driver portal
- **Login as Customer** → Access customer portal

### Test QR Scanner (Driver Portal)

1. Login as Driver
2. Click the floating QR button (bottom right)
3. Allow camera permissions
4. Point camera at any QR code
5. See success animation and status update

### Test Vacation Mode (Customer Portal)

1. Login as Customer
2. Toggle the vacation mode switch
3. See toast notification
4. Refresh page - state persists

### Test Offline Support

1. Login to any dashboard
2. Open DevTools (F12) → Network tab
3. Select "Offline" mode
4. See offline notification bar
5. Switch back to "Online"
6. See sync notification

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 576px
- **Tablet**: 768px - 992px
- **Desktop**: > 992px

### Layout Behavior

- **Admin**: Sidebar collapses to hamburger menu on mobile
- **Driver/Customer**: Bottom navigation for mobile-first experience
- **Cards**: Stack vertically on smaller screens
- **Tables**: Horizontal scroll on mobile

## 🎨 Color Palette

```css
Primary:        #0891b2  /* Cyan 600 */
Primary Light:  #06b6d4  /* Cyan 500 */
Accent:         #22d3ee  /* Cyan 400 */
Success:        #10b981  /* Green */
Warning:        #f59e0b  /* Amber */
Danger:         #ef4444  /* Red */
```

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **JavaScript (ES6)** - Modern syntax
- **Bootstrap 5.3** - UI framework
- **Bootstrap Icons** - Icon library
- **html5-qrcode** - QR scanner library
- **Google Fonts (Inter)** - Typography

## 📦 Dependencies (CDN)

All dependencies are loaded via CDN - no installation required:

- Bootstrap 5.3.0
- Bootstrap Icons 1.11.0
- html5-qrcode 2.3.8

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 📊 Project Statistics

- **Total Files**: 9
- **HTML Pages**: 6
- **CSS Lines**: ~800
- **JavaScript Lines**: ~600
- **Total Code**: ~2,500 lines

## 🎬 Demo Workflow

1. **Homepage** → View features and branding
2. **Login** → Use quick demo buttons
3. **Admin** → Check alerts, search table
4. **Driver** → Scan QR code, complete delivery
5. **Customer** → Toggle vacation mode, WhatsApp
6. **Offline** → Test network detection

## 📸 Screenshots

### Homepage

- Hero section with Water Blue gradient
- Features showcase
- Call-to-action sections

### Admin Dashboard

- Business health alerts
- Performance metrics
- Searchable delivery table

### Driver Portal

- Delivery cards
- QR scanner modal
- Bottom navigation

### Customer Portal

- Vacation mode toggle
- Account balance
- WhatsApp integration

## 🔐 Demo Credentials

**Admin:**

- Email: `admin@aquaflow.com`
- Access: Business metrics, alerts, tables

**Driver:**

- Email: `driver@aquaflow.com`
- Access: Deliveries, QR scanner, maps

**Customer:**

- Email: `customer@aquaflow.com`
- Access: Orders, vacation mode, WhatsApp

## 💡 Features Implemented

- ✅ Multi-user role system
- ✅ Responsive design
- ✅ QR code scanning
- ✅ Offline support
- ✅ WhatsApp integration
- ✅ Vacation mode
- ✅ Table search/filter
- ✅ Toast notifications
- ✅ Form validation
- ✅ Business alerts
- ✅ Progress tracking
- ✅ Glassmorphism UI

## 🚧 Future Enhancements

Potential additions for production:

- Backend API integration
- Database connectivity
- Payment gateway
- SMS notifications
- Route optimization
- Analytics dashboard
- PWA features
- Dark mode

## 📝 License

This is a frontend prototype for demonstration purposes.

## 📞 Contact

- Email: support@aquaflow.com
- Phone: +92 300 1234567
- WhatsApp: +92 300 1234567

---

**Built with ❤️ using HTML5, CSS3, JavaScript, Bootstrap 5, and html5-qrcode**

🌊 Aqua Flow - Smart Water Delivery & Management
