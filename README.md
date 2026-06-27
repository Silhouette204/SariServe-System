# 📦 SariServe

An automated small business inventory monitoring system with a Digital Debt Listing capability. **SariServe** bridges the gap between traditional community stores (Sari-Sari Stores/Tech Shops) and modern management solutions, eliminating manual paper logging.

---

## 🚀 Overview

SariServe provides local micro-retailers with an all-in-one digital dashboard to track products, monitor low-stock warnings, and manage customer credits efficiently. Built primarily as a lightweight frontend application utilizing modern styling, it manages application state via browser storage before scaling to a fully relational backend infrastructure.

## ✨ Key Features

* **📊 Dynamic Sales Dashboard:** Real-time summary counters showing Daily Sales, Low Stock warnings, and Active Collectible Debts.
* **📦 Inventory Grid:** A complete product CRUD system equipped with category filters, dynamic search, and automatic threshold indicators for depleting stocks.
* **📒 Digital Debt Listing (Listahan ng Utang):** A streamlined ledger for store owners to track customer debts, record transaction dates, and toggle outstanding payment statuses (`Paid` / `Unpaid`).
* **💾 Local-First Persistence:** Leverages `localStorage` to ensure absolute persistence across page refreshes without immediate reliance on external server stacks.
* **📱 Responsive Dashboard Interface:** Styled with a dark-themed Tailwind CSS UI designed to remain highly performant on both desktops and mobile viewports.

---

## 🛠️ Tech Stack & Architecture

### Frontend Blueprint
* **HTML5** - Semantic markup structuring for multi-view page routing.
* **Tailwind CSS** - Utility-first styling framework for UI layout and elements.
* **Vanilla JavaScript (ES6+)** - Core logical layer handling DOM events and transaction states.

### Data Storage Strategy
```text
[Browser UI Layer] ──> [JavaScript Controllers] ──> [localStorage System]
                                                            │
                                        (Future Stage)      ▼
                                                    [Fetch API / PostgreSQL]
```bash

sariserve/
├── index.html          # Main Dashboard & Sales Counter
├── inventory.html      # Product Grid & Stock Management
├── debts.html          # Digital Debt Listing (Listahan ng Utang)
├── css/
│   └── output.css      # Compiled Tailwind styles
└── js/
    ├── app.js          # Shared utility logic & system controls
    ├── dashboard.js    # Metric computations & live log handlers
    ├── inventory.js    # Inventory CRUD operations
    └── debts.js        # Debt ledger accounting handlers

```





 📝 Roadmap & Development Phases
   
[x] Phase 1: Core UI Layouting and Repository Setup

[ ] Phase 2: Local Storage Implementation for Inventory Modules

[ ] Phase 3: Ledger Logic Integration for Debt Listings

[ ] Phase 4: Transition from Local Storage to Fetch API & PostgreSQL Relational Database







⚙️ Local Setup Instructions
```bash
git clone [https://github.com/YOUR_USERNAME/sariserve.git](https://github.com/YOUR_USERNAME/sariserve.git)

cd sariserve
```
