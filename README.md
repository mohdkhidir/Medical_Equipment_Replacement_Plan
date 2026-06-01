# Medical Equipment Planner

## Overview

**BEMS Equipment Planner** is a web-based decision support tool for medical equipment annual replacement planning. It combines equipment lifecycle analytics, regulatory compliance tracking, and data-driven scoring to help healthcare facilities make informed equipment replacement decisions aligned with ASHE, ECRI, and FDA guidelines.

## Key Features

### 🎯 Intelligent Scoring System
- **Total Replacement Score (TRS)**: Weighted composite scoring (0–100) based on six factors:
  - **Age** (25%): Years in service vs. ASHE expected lifespan
  - **Maintenance Cost** (20%): Benchmarked against annual utilization and ECRI PM standards
  - **Reliability** (20%): Mean Time Between Failures and failure frequency
  - **Technology Gap** (15%): Generation age vs. current standard
  - **Materials Condition** (10%): Corrosion, wear, material degradation
  - **Safety** (10%): FDA recalls, alerts, JCAHO compliance violations

- **Safety Override Logic**: Immediate replacement flag if:
  - Active FDA recalls or drug alerts
  - ISO & MDA non-compliance analysis
  - Product safety bulletins

### 📋 Equipment Registry
- Comprehensive equipment database with 8 categories:
  - Imaging (CT, MRI, X-ray, Ultrasound)
  - Patient Monitoring (ECG, Pulse Oximetry, BP monitors)
  - Life Support (Ventilators, ECMO, Defibrillators)
  - Surgical Equipment (OR tables, lights, surgical towers)
  - Laboratory (Analyzers, centrifuges, incubators)
  - Infusion & Pumps (Syringe pumps, IV pumps, feeding pumps)
  - Rehabilitation Equipment (Treadmills, therapy devices)
  - Sterilization (Autoclaves, high-level disinfectants)

- Compile equipment tracking with:
  - Serial numbers and acquisition dates
  - Manufacturer and model information
  - Maintenance history and cost tracking
  - Annual utilization hours
  - Location and department assignment
  - Custom notes and alerts

### 📊 Technology Gap Analysis
- Generational comparison against current standards
- Market trend analysis for each equipment category
- Visual analytics with interactive charts
- Recommendations for modernization

### 📈 Annual Replacement Report
- Prioritized equipment lists (Immediate → Continue)
- Budget forecasting by priority level
- Compliance readiness assessment
- Multi-year replacement roadmap
- Export-ready summary tables

## Installation

### Prerequisites
- **Node.js**: v18.17+ (LTS recommended)
- **npm**: v10+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (with PWA support on Android Chrome, Firefox, Samsung Internet)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mohdkhidir/advancetechuniversal-test.git
   cd advancetechuniversal-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   - App opens at `http://localhost:5173`
   - Server exposes on LAN (`http://<your-ip>:5173`) for mobile device testing

4. **Build for production**
   ```bash
   npm run build
   ```
   - Outputs to `dist/` with service worker and web manifest
   - Run `npm run preview` to test production build locally

### Install as PWA

**On Android (Chrome, Firefox, Samsung Internet):**
1. Open app in browser
2. Tap install banner at bottom ("Install App") or menu → "Install app"
3. App appears on home screen; opens in standalone mode

**On iOS (Safari):**
1. Open app in Safari
2. Tap Share → "Add to Home Screen"
3. App appears on home screen with custom icon and name

**Offline Support:**
- First visit loads and caches all essential files
- Subsequent visits work fully offline (equipment data synced locally via localStorage + IndexedDB)
- Service worker auto-updates in background

## Usage Guide

### Dashboard
- **Quick Metrics**: Total equipment count, average age, compliance status
- **Priority Cards**: Visual distribution of equipment by replacement priority (Immediate/Plan/Monitor/Continue)
- **Recent Activity**: Latest added or modified equipment

### Equipment Registry
1. **Add Equipment**: Click "Add Equipment" → fill form with details → save
2. **View Details**: Click equipment row → view full record with attachments and scoring breakdown
3. **Edit Equipment**: Click "Edit" → modify fields → save changes
4. **Delete Equipment**: Use detail view delete button (requires confirmation)

### Attachment Management
1. **Upload Files**:
   - Drag-and-drop zone or click "Add Files"
   - Select attachment category (Image, Supporting Document, Birth Certificate, Authority Registration)
   - Add optional caption
   - Submit
2. **Preview**:
   - **Images**: Click thumbnail for lightbox view
   - **Videos**: Click play icon for full-screen player
   - **PDFs**: Click icon to view in browser
   - **Office/CSV**: Click download icon
3. **Manage**:
   - Edit caption: Click edit button
   - Delete: Click delete button (requires confirmation)

### Technology Gap Analysis
- View equipment by generation age
- Compare against current standards per category
- Identify outdated models for strategic upgrades

### Annual Report
- Export prioritized replacement plan by fiscal year
- Budget estimates based on typical acquisition costs
- Compliance gaps and remediation timeline
- Print or save as reference document

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.6.3 |
| **Build Tool** | Vite | 5.4.10 |
| **Styling** | Tailwind CSS | 3.4.14 |
| **Charts** | Recharts | 2.13.0 |
| **Icons** | Lucide React | 0.454.0 |
| **PWA Plugin** | vite-plugin-pwa | 1.3.0 |
| **Storage** | localStorage (metadata) + IndexedDB (files) | — |

## Project Structure

```
advancetechuniversal-test/
├── public/                          # Static assets
│   ├── favicon.ico
│   ├── logo.svg                     # Custom medical app logo
│   ├── apple-touch-icon-180x180.png # iOS home screen icon
│   ├── pwa-64x64.png
│   ├── pwa-192x192.png              # Android launcher icon
│   ├── pwa-512x512.png
│   └── maskable-icon-512x512.png    # Adaptive icon for Android 8+
│
├── src/
│   ├── components/                  # React components
│   │   ├── App.tsx                  # Root app with view routing
│   │   ├── Header.tsx               # Navigation (desktop + mobile hamburger menu)
│   │   ├── Dashboard.tsx            # Summary metrics & priority cards
│   │   ├── EquipmentList.tsx        # Table of all equipment
│   │   ├── EquipmentDetail.tsx      # Full equipment view + attachment manager
│   │   ├── EquipmentForm.tsx        # Add/edit equipment form
│   │   ├── TechGapAnalysis.tsx      # Technology generation analysis charts
│   │   ├── ReportView.tsx           # Annual replacement planning report
│   │   ├── AttachmentManager.tsx    # File upload/preview/management with categories
│   │   └── InstallBanner.tsx        # PWA install prompt (Android Chrome)
│   │
│   ├── types/
│   │   └── equipment.ts             # TypeScript interfaces (Equipment, Attachment, etc.)
│   │
│   ├── utils/
│   │   ├── scoringEngine.ts         # TRS calculation & priority classification
│   │   └── attachmentStore.ts       # IndexedDB wrapper for file binary storage
│   │
│   ├── data/
│   │   ├── sampleData.ts            # 12 pre-loaded equipment examples
│   │   └── benchmarks.ts            # ASHE/ECRI lifecycle & maintenance benchmarks
│   │
│   ├── styles/
│   │   └── index.css                # Global Tailwind imports & custom styles
│   │
│   ├── main.tsx                     # React DOM render entry point
│   └── vite-env.d.ts                # Vite environment type definitions
│
├── index.html                       # HTML entry point with PWA meta tags
├── vite.config.ts                   # Vite config with PWA plugin & LAN server
├── tsconfig.json                    # TypeScript strict mode config
├── tailwind.config.js               # Tailwind CSS color & extension config
├── postcss.config.js                # PostCSS & Autoprefixer config
├── package.json                     # Dependencies & build scripts
├── package-lock.json                # Locked dependency versions
└── README.md                        # This file
```

## Scoring Methodology

### Total Replacement Score (TRS) Calculation

The TRS combines six weighted factors into a single 0–100 score:

```
TRS = (Age × 0.25) + (Maintenance × 0.20) + (Reliability × 0.20) 
    + (TechGap × 0.15) + (Materials × 0.10) + (Safety × 0.10)
```

Each factor is normalized to 0–100 before weighting.

### Factor Details

#### Age (25%)
- **Input**: Years in service (calculated from acquisition date)
- **Benchmark**: ASHE expected lifespan for category
- **Score**: `(years_in_service / expected_lifespan) × 100`, capped at 100
- **Example**: 8-year CT scanner (expected 10 years) = 80 points

#### Maintenance Cost (20%)
- **Input**: Annual maintenance cost, annual utilization hours
- **Benchmark**: ECRI maintenance cost thresholds
- **Score**: 0–100 based on cost vs. annual utilization and benchmark percentage
- **Example**: $15,000/year on 500-hour ventilator (high cost ratio) = 85 points

#### Reliability (20%)
- **Input**: Mean Time Between Failures (MTBF) and failure count
- **Benchmark**: ECRI reliability standards
- **Score**: Based on actual failures vs. expected reliability
- **Example**: 3+ failures in 2 years = 90+ points

#### Technology Gap (15%)
- **Input**: Equipment generation age vs. current market standard
- **Score**: 0–100 based on generational distance
- **Example**: 5-year-old ultrasound (current generation is 2 years old) = 60 points

#### Materials (10%)
- **Input**: Visual condition, corrosion, wear reports
- **Score**: 0–100 based on condition assessment
- **Example**: Heavy corrosion, cracked tubing = 85 points

#### Safety (10%)
- **Input**: FDA recalls, JCAHO violations, safety bulletins
- **Score**: 0–50 base + 50 point override if recalls/violations exist
- **Override**: If any safety flag = automatic 90+ score

### Priority Classification

| Priority | Score Range | Action |
|----------|-------------|--------|
| **Immediate** | ≥80 | Replace within 6 months; escalate budget |
| **Plan** | 60–79 | Schedule replacement in 1–2 years; budget planning |
| **Monitor** | 40–59 | Track closely; plan preventive maintenance; review annually |
| **Continue** | <40 | Maintain current service; revisit in 2–3 years |

## Data Storage

### Equipment Metadata (localStorage)
- Stored in `localStorage` under key `advancetech-equipment-v2`
- JSON array of equipment objects
- Automatically synced on every state change
- Migrates from v1 format on first load (adds empty `attachments` array if missing)

### File Attachments (IndexedDB)
- Database: `advancetech-files-v1`
- Object store: `files` (indexed by `equipmentId`)
- Binary data stored separately from metadata (optimized for large files)
- Lazy-loaded on demand when viewing attachments
- Metadata includes: file name, MIME type, size, upload date, category

## Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally: `npm run dev`
3. Build and verify: `npm run build`
4. Commit with descriptive message: `git commit -m "Add: brief description"`
5. Push to GitHub: `git push origin feature/your-feature`
6. Create Pull Request with summary of changes

### Code Standards
- **TypeScript**: Strict mode enabled; no implicit `any`
- **Formatting**: Use Prettier (configured in repo)
- **Testing**: Manual testing required (unit test framework not yet configured)
- **Accessibility**: WCAG 2.1 AA target; test with screen readers on detail views

### Reporting Issues
Use GitHub Issues with:
- Clear title and description
- Steps to reproduce (if bug)
- Expected vs. actual behavior
- Browser and device info (especially for mobile)
- Attachments (screenshots/videos helpful)

## Deployment

### Vercel (Recommended)
1. Push code to GitHub branch
2. Go to [vercel.com](https://vercel.com) and import repository
3. Select framework: Vite
4. Default settings work; no env vars needed
5. Deploy → app live at `yourdomain.vercel.app`

**Auto-deployment**: Every push to `main` triggers production build

### Manual Deployment (any static host)
1. Build locally: `npm run build`
2. Upload `dist/` folder to your server (Netlify, GitHub Pages, AWS S3, etc.)
3. Ensure HTTPS (PWA requires secure context)
4. Test PWA installation on mobile

## Performance Optimizations

- **Code Splitting**: Vite's automatic dynamic imports for routes
- **Precaching**: Service worker caches all JS/CSS/fonts on first visit
- **Lazy Loading**: Attachment previews (lightbox) and PDF viewer load on demand
- **Workbox**: Google Fonts cached for 365 days after first request
- **LAN Dev Server**: Configured with `host: true` for mobile testing without HTTPS proxies

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full PWA support (install banner, offline) |
| Firefox | 88+ | PWA support on Android; desktop version works offline |
| Safari | 14+ | iOS: add to home screen; desktop: offline support |
| Edge | 90+ | Full Chrome-based support |
| Samsung Internet | 14+ | Excellent PWA support on Galaxy S24 Ultra |

**Mobile**: Android devices get best PWA experience; iOS limited to Safari's installed app scope.

## License

This project is licensed under the MIT License — see LICENSE file for details.

## Support & Documentation

- **Issue Tracker**: [GitHub Issues](https://github.com/mohdkhidir/advancetechuniversal-test/issues)
- **Discussions**: Use GitHub Discussions for feature requests and questions
- **ASHE Guidelines**: [Association for the Advancement of Medical Instrumentation](https://www.aami.org/)
- **ECRI Institute**: [Equipment Lifecycle & Reliability Data](https://www.ecri.org/)
- **FDA Safety**: [Medical Device Recalls & Alerts](https://www.fda.gov/medical-devices/device-recall-system)

---

**Built with React, TypeScript, Tailwind CSS, and Vite — optimized for healthcare IT professionals and clinical engineering teams.**
