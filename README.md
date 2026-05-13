# FilterAnalyzer

> **Analog & Digital Filter Analysis and Design Web Application**
> A production-grade, fast, multi-panel web tool for computing, visualizing, and exporting normalized analog and IIR digital low-pass filter designs across four classical approximation methods.

---

## Table of Contents

- [FilterAnalyzer](#filteranalyzer)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. Live Demo](#2-live-demo)
  - [3. Feature Set](#3-feature-set)
    - [Core Filter Design](#core-filter-design)
    - [Computed Outputs (per design)](#computed-outputs-per-design)
    - [Workspace](#workspace)
    - [Save \& Load](#save--load)
    - [Exports](#exports)
  - [4. Theoretical Background](#4-theoretical-background)
    - [4.1 Filter Specification Parameters](#41-filter-specification-parameters)
    - [4.2 Approximation Functions](#42-approximation-functions)
    - [4.3 Analog-to-Digital Conversion (Bilinear Transform)](#43-analog-to-digital-conversion-bilinear-transform)
  - [5. Architecture](#5-architecture)
    - [5.1 Repository Structure](#51-repository-structure)
    - [5.2 Frontend (React + Vite)](#52-frontend-react--vite)
    - [5.3 Backend (FastAPI + Python)](#53-backend-fastapi--python)
    - [5.4 Math Engine](#54-math-engine)
    - [5.5 Data Flow](#55-data-flow)
  - [6. Tech Stack](#6-tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Infrastructure](#infrastructure)
  - [7. Getting Started](#7-getting-started)
    - [7.1 Prerequisites](#71-prerequisites)
    - [7.2 Clone the Repository](#72-clone-the-repository)
    - [7.3 Backend Setup](#73-backend-setup)
    - [7.4 Frontend Setup](#74-frontend-setup)
    - [7.5 Running Both Services](#75-running-both-services)
  - [8. Environment Variables](#8-environment-variables)
    - [Frontend (`frontend/.env.local`)](#frontend-frontendenvlocal)
    - [Backend (`backend/.env`)](#backend-backendenv)
  - [9. API Reference](#9-api-reference)
    - [9.1 POST /api/design](#91-post-apidesign)
    - [9.2 GET /api/health](#92-get-apihealth)
    - [9.3 Request Schema](#93-request-schema)
    - [9.4 Response Schema](#94-response-schema)
    - [9.5 Error Responses](#95-error-responses)
  - [10. UI/UX System](#10-uiux-system)
    - [10.0 Brand \& Logo](#100-brand--logo)
    - [10.1 Opening / Splash Screen](#101-opening--splash-screen)
    - [10.2 Loading States](#102-loading-states)
      - [A. App Shell Loading (initial JS bundle)](#a-app-shell-loading-initial-js-bundle)
      - [B. Filter Computation Loading (POST /api/design)](#b-filter-computation-loading-post-apidesign)
      - [C. Tab Switch Loading](#c-tab-switch-loading)
      - [D. File Load (.fcfg)](#d-file-load-fcfg)
      - [E. Export Loading (PDF)](#e-export-loading-pdf)
    - [10.3 Error States](#103-error-states)
    - [10.4 Micro-interactions \& Transitions](#104-micro-interactions--transitions)
    - [10.5 Responsive Behavior](#105-responsive-behavior)
    - [10.6 Color System \& CSS Variables](#106-color-system--css-variables)
    - [10.7 Typography](#107-typography)
    - [10.8 Plot Design Specification](#108-plot-design-specification)
  - [10. UI Reference](#10-ui-reference)
    - [10.1 Parameter Input Panel](#101-parameter-input-panel)
    - [10.2 Filter Selection](#102-filter-selection)
    - [10.3 Results Panel](#103-results-panel)
    - [10.4 Multi-tab Workspace](#104-multi-tab-workspace)
    - [10.5 Save \& Load Configurations](#105-save--load-configurations)
    - [10.6 Frequency Unit Toggle](#106-frequency-unit-toggle)
  - [11. Math Engine — Implementation Details](#11-math-engine--implementation-details)
    - [11.1 Butterworth](#111-butterworth)
    - [11.2 Chebyshev Type I](#112-chebyshev-type-i)
    - [11.3 Inverse Chebyshev (Type II)](#113-inverse-chebyshev-type-ii)
    - [11.4 Elliptic (Cauer)](#114-elliptic-cauer)
    - [11.5 Bilinear Transform (Analog → Digital IIR)](#115-bilinear-transform-analog--digital-iir)
    - [11.6 Complete Elliptic Integral (CEI) — Numerical Implementation](#116-complete-elliptic-integral-cei--numerical-implementation)
  - [12. MATLAB → Python Translation Reference](#12-matlab--python-translation-reference)
  - [13. Filter Configuration File Format (.fcfg)](#13-filter-configuration-file-format-fcfg)
  - [14. Outputs \& Exports](#14-outputs--exports)
    - [PNG Export](#png-export)
    - [CSV Export](#csv-export)
    - [PDF Report](#pdf-report)
  - [15. Deployment](#15-deployment)
    - [15.1 Docker (Recommended)](#151-docker-recommended)
    - [15.2 Manual Deployment](#152-manual-deployment)
    - [15.3 Vercel + Railway (Split Deployment)](#153-vercel--railway-split-deployment)
  - [16. Project Roadmap](#16-project-roadmap)
    - [v1.0 — MVP (current scope)](#v10--mvp-current-scope)
    - [v1.1](#v11)
    - [v1.2](#v12)
  - [17. Academic Reference](#17-academic-reference)
  - [18. License](#18-license)

---

## 1. Project Overview

**FilterAnalyzer** is a web application for the analysis and design of classical analog and IIR digital low-pass filters. It replaces the workflow of running MATLAB scripts manually — or using the existing Streamlit prototype at [filteranalyzer.streamlit.app](https://filteranalyzer.streamlit.app) — with a fast, multi-panel browser-based tool that is equally suited to engineering students, researchers, and practising DSP engineers.

The application implements four classical approximation functions from first principles, faithfully reproducing the mathematical framework described in:

> Zubair, A. R. & Olawale, A. J. (2022). *Active learning strategy: Computer aided numerical class project on pole-zero plot and transfer function of five low pass filter approximation functions.* Global Journal of Engineering and Technology Advances, 12(01), 038–063. https://doi.org/10.30574/gjeta.2022.12.1.0105

The math engine is a direct Python port of the MATLAB programs (`btw.m`, `cheb.m`, `chebinv.m`, `eff.m`, `CEI.m`, `CEIinv.m`, `odev.m`, `ffncexp.m`, `ffncexp1.m`, `pltfreq.m`, `pltfreq1.m`) developed for that paper.

**Why FilterAnalyzer over the Streamlit prototype?**

| Capability | filteranalyzer.streamlit.app | FilterAnalyzer |
|---|---|---|
| Approximation types | Butterworth, Chebyshev I, Chebyshev II | All four + Elliptic |
| Digital filter design (IIR via BLT) | ❌ | ✅ |
| Multiple designs open simultaneously | ❌ | ✅ (tabbed workspace) |
| Save / load filter configurations | ❌ | ✅ (.fcfg JSON) |
| Phase response plot | ❌ | ✅ |
| Group delay plot | ❌ | ✅ |
| Transfer function display (rendered) | ❌ | ✅ |
| Filter order display | ❌ | ✅ |
| Frequency unit toggle (rad/s ↔ Hz) | ❌ | ✅ |
| Export (PNG, CSV, PDF report) | ❌ | ✅ |
| Startup time | ~4–8 s (Streamlit cold start) | <1 s (Vite SPA) |

---

## 2. Live Demo

> *(To be populated after deployment)*

- **Frontend:** `https://filteranalyzer.vercel.app`
- **API:** `https://filteranalyzer-api.railway.app`

---

## 3. Feature Set

### Core Filter Design
- Design normalized analog LPF prototypes using four approximation functions: Butterworth, Chebyshev Type I, Inverse Chebyshev (Type II), and Elliptic (Cauer).
- Convert any analog design to a digital IIR filter via the Bilinear Transform (BLT) with pre-warping.
- Normalized mode on launch (wpass = 1 rad/s); user-adjustable thereafter.
- Frequency unit toggle: rad/s ↔ Hz (conversion handled transparently).

### Computed Outputs (per design)
- **Filter order n** — computed and displayed prominently.
- **Pole-zero plot** — interactive scatter on the s-plane (analog) or z-plane (digital), with conjugate pairs, locus ellipse/circle, and axes.
- **Magnitude response** — frequency response |H(jω)| in dB vs. frequency, with passband/stopband specification lines overlaid.
- **Phase response** — ∠H(jω) in degrees vs. frequency.
- **Group delay** — −d∠H(jω)/dω vs. frequency.
- **Transfer function** — rendered as a fraction of polynomials in s (analog) or z⁻¹ (digital), both factored and expanded forms.
- **Pole and zero coordinates** — tabulated with real and imaginary parts.

### Workspace
- **Multi-tab design workspace** — open up to 8 simultaneous filter designs, each independently computed. Each tab is named by the user or auto-named (e.g., `BTW-n5`, `ELL-n3`).
- **Compare mode** — overlay magnitude responses from two open tabs on a single chart.

### Save & Load
- Save any design configuration to a `.fcfg` file (JSON format, see §13).
- Load a `.fcfg` file to restore full parameter state and immediately trigger recomputation.
- Configurations are also auto-saved to browser `localStorage` per tab (persists on refresh).

### Exports
- **PNG** — any individual plot (pole-zero, magnitude, phase, group delay).
- **CSV** — raw frequency response data (frequency, magnitude dB, phase degrees, group delay).
- **PDF Report** — full design summary: parameters, filter order, all four plots, transfer function, pole-zero table.

---

## 4. Theoretical Background

### 4.1 Filter Specification Parameters

The user provides four parameters that define the performance envelope of the desired low-pass filter:

| Parameter | Symbol | Unit | Description |
|---|---|---|---|
| Passband edge frequency | wpass (ωp) | rad/s or Hz | Upper limit of the passband. All frequencies below this must pass with attenuation ≤ \|Apass\|. Normalized default: 1 rad/s. |
| Stopband edge frequency | wstop (ωs) | rad/s or Hz | Lower limit of the stopband. All frequencies above this must be attenuated by at least \|Astop\|. Must be > wpass. |
| Passband gain | Apass | dB | Maximum allowed attenuation in the passband. Typical values: 0 dB (ideal), −1 dB, −3 dB. Must satisfy Apass < 0. |
| Stopband gain | Astop | dB | Required minimum attenuation at wstop. Typical values: −20 dB, −40 dB, −60 dB, −107 dB. Must satisfy Astop << Apass. |

**Normalized mode:** wpass is fixed at 1 rad/s. The user controls the selectivity ratio `wstop/wpass`. A ratio of 1.5 or 2 is recommended as a practical starting point (see §4.2 for the trade-off).

**Denormalized mode:** The user may enter any wpass > 0. The system internally normalizes before computing and denormalizes the result for display.

**Selectivity trade-off:**
- Lower `wstop/wpass` → narrower transition band → better filter → higher order n → more complex, higher cost
- Higher `wstop/wpass` → wider transition band → poorer filter → lower order n → simpler, lower cost

**Passband deviation (εp) and stopband deviation (εs):**

```
Apass = 10·log₁₀(1 + ε²) = −20·log₁₀(1 − δp)      [Eq. 11]
Astop = −20·log₁₀(δs)                                 [Eq. 12]
```

**Passband ripple factor ε:**
```
ε = √(10^(−0.1·Apass) − 1)
```

### 4.2 Approximation Functions

All four functions approximate the ideal brick-wall low-pass filter response (infinite attenuation in stopband, unity gain in passband, zero transition band). The approximation introduces a transition band between wpass and wstop.

**Comparison summary (same specifications, ascending order complexity):**

| Property | Butterworth | Chebyshev I | Inv. Chebyshev (II) | Elliptic |
|---|---|---|---|---|
| Passband | Maximally flat | Equiripple | Flat | Equiripple |
| Stopband | Monotone | Monotone | Equiripple | Equiripple |
| Phase response | Good | Moderate | Better than Cheb I | Poor |
| Order required (same spec) | Highest | Same as Inv. Cheb | Same as Cheb I | Lowest |
| Transfer function | All-pole | All-pole | Poles + zeros | Poles + zeros |
| Complexity | Simplest | Moderate | Moderate | Most complex |

**When to choose what:**
- **Butterworth** — when flattest passband and smooth phase matter more than filter order.
- **Chebyshev I** — when steeper rolloff than Butterworth is needed with same order, and passband ripple is tolerable.
- **Inverse Chebyshev** — when flat passband is required but stopband ripple is acceptable; better phase than Chebyshev I.
- **Elliptic** — when the lowest possible filter order for a given set of specifications is the primary objective, despite equiripple in both bands and complex pole-zero structure.

### 4.3 Analog-to-Digital Conversion (Bilinear Transform)

When the user selects **Digital IIR** mode, FilterAnalyzer applies the **Bilinear Transform (BLT)** to map the analog prototype H(s) to a discrete-time transfer function H(z).

The BLT substitution is:

```
s = (2/T) · (z − 1)/(z + 1)
```

where T is the sampling period (T = 1/Fs, Fs = digital sampling frequency).

**Pre-warping:** The analog prototype frequencies are pre-warped before design to ensure that the critical frequencies (wpass, wstop) are preserved exactly in the digital domain after the BLT:

```
ω_analog = (2/T) · tan(ω_digital · T / 2)
```

The design procedure is:
1. User specifies digital frequencies (in rad/sample or Hz).
2. System pre-warps wpass and wstop to analog equivalents.
3. Analog prototype is designed using selected approximation function.
4. BLT is applied to convert H(s) → H(z).
5. Result is displayed in z-domain (poles/zeros on unit circle plot, difference equation coefficients).

---

## 5. Architecture

### 5.1 Repository Structure

```
filteranalyzer/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── frontend/                          # React + Vite SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx                   # App entry point
│       ├── App.tsx                    # Root component, tab manager
│       ├── index.css                  # Global styles, CSS variables
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.tsx         # App title, global actions
│       │   │   ├── TabBar.tsx         # Multi-tab workspace tabs
│       │   │   └── Sidebar.tsx        # Parameter input panel
│       │   │
│       │   ├── inputs/
│       │   │   ├── FilterTypeSelector.tsx   # Analog/Digital toggle
│       │   │   ├── ApproxSelector.tsx       # 4-way approximation picker
│       │   │   ├── ParameterInputs.tsx      # wpass, wstop, Apass, Astop fields
│       │   │   ├── FreqUnitToggle.tsx       # rad/s ↔ Hz
│       │   │   └── SamplingFreqInput.tsx    # Fs input (digital mode only)
│       │   │
│       │   ├── results/
│       │   │   ├── ResultsPanel.tsx         # Orchestrates all result sub-components
│       │   │   ├── OrderBadge.tsx           # Displays computed filter order n
│       │   │   ├── PoleZeroPlot.tsx         # Interactive pole-zero scatter (Recharts/D3)
│       │   │   ├── MagnitudeResponsePlot.tsx
│       │   │   ├── PhaseResponsePlot.tsx
│       │   │   ├── GroupDelayPlot.tsx
│       │   │   ├── TransferFunctionDisplay.tsx  # Rendered H(s) or H(z) fraction
│       │   │   └── PoleZeroTable.tsx        # Tabulated pole/zero coordinates
│       │   │
│       │   ├── workspace/
│       │   │   ├── CompareOverlay.tsx       # Two-tab magnitude overlay
│       │   │   ├── SaveLoadBar.tsx          # Save .fcfg / Load .fcfg buttons
│       │   │   └── ExportMenu.tsx           # PNG / CSV / PDF export
│       │   │
│       │   └── common/
│       │       ├── Tooltip.tsx
│       │       ├── Spinner.tsx
│       │       └── ErrorBanner.tsx
│       │
│       ├── hooks/
│       │   ├── useFilterDesign.ts     # API call + state management per tab
│       │   ├── useLocalStorage.ts     # Persist tab state to localStorage
│       │   └── useFreqUnit.ts         # rad/s ↔ Hz conversion logic
│       │
│       ├── store/
│       │   └── tabStore.ts            # Zustand store — all open tabs, active tab
│       │
│       ├── api/
│       │   └── filterApi.ts           # Typed fetch wrapper for backend API
│       │
│       ├── types/
│       │   └── filter.ts              # TypeScript types: FilterRequest, FilterResult, TabState
│       │
│       └── utils/
│           ├── freqConvert.ts         # rad/s ↔ Hz utilities
│           ├── exportUtils.ts         # PNG/CSV/PDF generation
│           └── fcfgUtils.ts           # .fcfg serialize / deserialize
│
└── backend/                           # FastAPI Python API
    ├── requirements.txt
    ├── Dockerfile
    ├── main.py                        # FastAPI app, route registration
    │
    ├── api/
    │   └── routes.py                  # Route definitions (/design, /health)
    │
    ├── models/
    │   └── schemas.py                 # Pydantic request/response models
    │
    └── engine/                        # Math engine — pure Python, no side effects
        ├── __init__.py
        ├── common.py                  # Shared utilities: odev(), epsilon(), freq_response()
        ├── butterworth.py             # btw.m port
        ├── chebyshev.py               # cheb.m port
        ├── inverse_chebyshev.py       # chebinv.m port
        ├── elliptic.py                # eff.m + CEI.m + CEIinv.m port
        ├── transfer_function.py       # ffncexp.m / ffncexp1.m port — poly expansion
        ├── frequency_response.py      # pltfreq.m / pltfreq1.m port
        ├── phase_response.py          # Phase computation from poles/zeros
        ├── group_delay.py             # Group delay computation
        └── bilinear.py                # Analog → Digital IIR via BLT
```

### 5.2 Frontend (React + Vite)

The frontend is a single-page application (SPA) built with **React 18** and **Vite**. It is entirely TypeScript. Key architectural decisions:

- **Zustand** for global state (tab management, active tab, compare mode).
- **TanStack Query (React Query)** for API request lifecycle (loading, error, caching).
- **Recharts** for all frequency response plots (magnitude, phase, group delay) — chosen for its React-native API and composable chart components.
- **D3.js** for the pole-zero plot — chosen because the s-plane/z-plane scatter requires precise SVG control, dynamic axes, and interactive hover that Recharts cannot handle at this level of precision.
- **KaTeX** (via `react-katex`) for rendering transfer function polynomials as proper LaTeX fractions in the browser.
- **jsPDF + html2canvas** for PDF report generation entirely on the client side.

No CSS framework. All styling via plain CSS with custom properties (CSS variables) — consistent with your established stack preference.

### 5.3 Backend (FastAPI + Python)

The backend is a lightweight **FastAPI** application that exposes a single primary endpoint (`POST /api/design`). It:

- Validates the incoming request with **Pydantic**.
- Dispatches to the appropriate math engine module based on `approximation` and `filter_type` fields.
- Returns a fully computed result object as JSON.
- Handles all numerical computation server-side (no math in the browser).

The backend is **stateless** — no database, no session. Every request is independent. Configuration persistence is handled entirely on the client via `.fcfg` files and `localStorage`.

**Why FastAPI over Node?**
The math engine is a direct port of MATLAB numerical code. NumPy/SciPy provide `cosh`, `acosh`, `asinh`, `ceil`, `roots`, `polymul` etc. natively and without external dependencies. A Node backend would require either a WASM port or a separate Python subprocess — adding latency and complexity. FastAPI starts in under 100ms and handles concurrent requests cleanly with async.

### 5.4 Math Engine

The math engine (`backend/engine/`) is the core of FilterAnalyzer. It is a pure Python port of the original MATLAB scripts, refactored into stateless functions that accept parameters and return data structures — no plotting, no global state, no `hold` commands.

Each module corresponds directly to a MATLAB script:

| Python module | MATLAB source | Responsibility |
|---|---|---|
| `common.py` | `odev.m` | Determine odd/even order (mode 1 or 2) |
| `butterworth.py` | `btw.m` | Compute ε, n, R, pole locations, DF matrix |
| `chebyshev.py` | `cheb.m` | Compute ε, n, D, pole locations, DF matrix |
| `inverse_chebyshev.py` | `chebinv.m` | Compute εᵢ, n, Dᵢ, Chebyshev + Inv. Cheb poles, zeros |
| `elliptic.py` | `eff.m` | Compute ε, rt, kn, CEI values, n, v₀, poles, zeros |
| `elliptic.py` | `CEI.m` | Forward numerical integration of Complete Elliptic Integral |
| `elliptic.py` | `CEIinv.m` | Reverse numerical integration (find φ given u and k) |
| `transfer_function.py` | `ffncexp.m`, `ffncexp1.m` | Polynomial expansion of DF/NF factor matrices into PolyDF, PolyNF |
| `frequency_response.py` | `pltfreq.m`, `pltfreq1.m` | Evaluate \|H(jω)\| in dB over frequency range |
| `phase_response.py` | *(new)* | Evaluate ∠H(jω) in degrees |
| `group_delay.py` | *(new)* | Evaluate group delay −d∠H/dω |
| `bilinear.py` | *(new)* | Apply BLT to analog poles/zeros → digital poles/zeros |

### 5.5 Data Flow

```
User fills inputs
       │
       ▼
[Frontend: ParameterInputs.tsx]
       │  Validates: wstop > wpass, Astop < Apass < 0, Fs present if digital
       ▼
[filterApi.ts] POST /api/design
       │
       ▼
[backend/api/routes.py]
       │  Pydantic validation
       ▼
[backend/engine/<approximation>.py]
       │  Compute: ε, n, poles, zeros, DF, NF matrices
       ▼
[transfer_function.py]
       │  Expand DF/NF → PolyDF, PolyNF coefficients
       ▼
[frequency_response.py]
       │  Evaluate |H(jω)| over ω ∈ [0, 5·wstop], 10,000 points
       ▼
[phase_response.py + group_delay.py]
       │
       ▼
[bilinear.py]  (if filter_type == "digital")
       │
       ▼
[routes.py]  Assemble FilterResult JSON
       │
       ▼
[Frontend: useFilterDesign.ts]
       │  React Query handles loading / error / success states
       ▼
[ResultsPanel.tsx]
       │
       ├── OrderBadge.tsx         ← n
       ├── PoleZeroPlot.tsx       ← poles, zeros
       ├── MagnitudeResponsePlot  ← freq, magnitude_db
       ├── PhaseResponsePlot      ← freq, phase_deg
       ├── GroupDelayPlot         ← freq, group_delay
       ├── TransferFunctionDisplay← poly_num, poly_den (KaTeX)
       └── PoleZeroTable          ← pole_list, zero_list
```

---

## 6. Tech Stack

### Frontend
| Tool | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool and dev server |
| TypeScript | 5.x | Type safety across all components |
| Zustand | 4.x | Lightweight global state (tab management) |
| TanStack Query | 5.x | API request lifecycle management |
| Recharts | 2.x | Magnitude, phase, group delay charts |
| D3.js | 7.x | Pole-zero plot (s-plane / z-plane) |
| react-katex + KaTeX | latest | Transfer function LaTeX rendering |
| jsPDF + html2canvas | latest | Client-side PDF report export |
| Plain CSS + CSS variables | — | Styling, no framework |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110+ | API framework |
| Uvicorn | 0.29+ | ASGI server |
| Pydantic | 2.x | Request/response validation |
| NumPy | 1.26+ | Array math, polynomial operations |
| SciPy | 1.12+ | `scipy.signal` for filter utilities (bilinear transform) |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Local and production container orchestration |
| Vercel | Frontend deployment |
| Railway | Backend + API deployment |
| GitHub Actions | CI/CD — lint, type-check, test on push |

---

## 7. Getting Started

### 7.1 Prerequisites

- **Node.js** >= 18.x (for frontend)
- **Python** >= 3.11 (for backend)
- **pip** or **uv** (Python package manager)
- **Git**
- **Docker** (optional, for containerized setup)

### 7.2 Clone the Repository

```bash
git clone https://github.com/thWebstr/filteranalyzer.git
cd filteranalyzer
```

### 7.3 Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate.bat     # Windows CMD
# venv\Scripts\Activate.ps1     # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs (Swagger UI) at `http://localhost:8000/docs`.

### 7.4 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
# Edit .env.local: set VITE_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 7.5 Running Both Services

From the project root, with Docker Compose:

```bash
docker-compose up --build
```

Or run both terminals manually (backend on 8000, frontend on 5173).

---

## 8. Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |
| `VITE_MAX_TABS` | `8` | Maximum number of simultaneous design tabs |

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins for CORS |
| `LOG_LEVEL` | `info` | Uvicorn log level (`debug`, `info`, `warning`, `error`) |
| `FREQ_RESPONSE_POINTS` | `10000` | Number of frequency points for response computation |
| `MAX_FILTER_ORDER` | `20` | Hard cap on computed filter order (prevents runaway computation) |

---

## 9. API Reference

### 9.1 POST /api/design

Compute a complete filter design from the given specifications.

**Request:** `application/json`  
**Response:** `application/json`

### 9.2 GET /api/health

Health check endpoint. Returns `{"status": "ok"}`.

### 9.3 Request Schema

```json
{
  "approximation": "butterworth",
  "filter_type": "analog",
  "w_pass": 1.0,
  "w_stop": 2.0,
  "a_pass": -1.0,
  "a_stop": -40.0,
  "freq_unit": "rad_s",
  "sampling_freq": null
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `approximation` | string | ✅ | One of: `"butterworth"`, `"chebyshev"`, `"inverse_chebyshev"`, `"elliptic"` |
| `filter_type` | string | ✅ | One of: `"analog"`, `"digital"` |
| `w_pass` | float | ✅ | Passband edge frequency. If `freq_unit` is `"hz"`, this is in Hz; backend converts to rad/s internally. |
| `w_stop` | float | ✅ | Stopband edge frequency. Same unit as `w_pass`. Must be > `w_pass`. |
| `a_pass` | float | ✅ | Passband gain in dB. Must be < 0. Typical: −1.0 or −3.0. |
| `a_stop` | float | ✅ | Stopband gain in dB. Must be < `a_pass`. Typical: −20 to −107. |
| `freq_unit` | string | ✅ | `"rad_s"` or `"hz"` |
| `sampling_freq` | float | Conditional | Required if `filter_type == "digital"`. Sampling frequency Fs in Hz. Must satisfy Fs > 2 · w_stop (Nyquist). |

**Validation rules enforced server-side:**
- `w_stop > w_pass > 0`
- `a_stop < a_pass < 0`
- `freq_unit in ["rad_s", "hz"]`
- If `filter_type == "digital"`: `sampling_freq` must be present and `sampling_freq > 2 * w_stop` (when w_stop is in Hz)
- Computed filter order `n` must not exceed `MAX_FILTER_ORDER`

### 9.4 Response Schema

```json
{
  "approximation": "butterworth",
  "filter_type": "analog",
  "order": 5,
  "epsilon": 0.5088,
  "poles": [
    {"real": -1.1447, "imag": 0.0},
    {"real": -0.3537, "imag": 1.0887},
    {"real": -0.3537, "imag": -1.0887},
    {"real": -0.9261, "imag": 0.6728},
    {"real": -0.9261, "imag": -0.6728}
  ],
  "zeros": [],
  "poly_num": [1.9652],
  "poly_den": [1.0, 3.7042, 6.8607, 7.8533, 5.5558, 1.9652],
  "freq_response": {
    "frequency": [0.0, 0.001, 0.002, "..."],
    "magnitude_db": [0.0, -0.0001, "..."],
    "phase_deg": [0.0, -0.057, "..."],
    "group_delay": [1.432, 1.433, "..."]
  },
  "locus_type": "circle",
  "locus_params": {"radius": 1.1447},
  "digital_coeffs": null,
  "warnings": []
}
```

| Field | Type | Description |
|---|---|---|
| `order` | int | Computed filter order n (after ceiling) |
| `epsilon` | float | Ripple factor ε |
| `poles` | array | All poles (including conjugates) as `{real, imag}` objects |
| `zeros` | array | All finite zeros as `{real, imag}` objects. Empty for Butterworth and Chebyshev I. |
| `poly_num` | array | Numerator polynomial coefficients, descending power. `[a_n, a_{n-1}, ..., a_0]` |
| `poly_den` | array | Denominator polynomial coefficients, descending power |
| `freq_response.frequency` | array | Frequency values (in same unit as request) |
| `freq_response.magnitude_db` | array | Gain in dB at each frequency |
| `freq_response.phase_deg` | array | Phase in degrees at each frequency |
| `freq_response.group_delay` | array | Group delay in seconds at each frequency |
| `locus_type` | string | `"circle"` (Butterworth), `"ellipse"` (Chebyshev, Inv. Cheb, Elliptic) |
| `locus_params` | object | Parameters to draw the pole locus on the s-plane |
| `digital_coeffs` | object or null | Present only if `filter_type == "digital"`. Contains `b` (numerator) and `a` (denominator) arrays for the digital filter H(z) difference equation |
| `warnings` | array | Non-fatal warnings (e.g., order capped, near-singular CEI) |

### 9.5 Error Responses

```json
{
  "detail": "w_stop must be greater than w_pass"
}
```

| HTTP Status | Condition |
|---|---|
| 422 Unprocessable Entity | Pydantic validation failed (type mismatch, missing field) |
| 400 Bad Request | Business logic validation failed (e.g., w_stop ≤ w_pass) |
| 500 Internal Server Error | Unexpected numerical failure (logged server-side) |

---

## 10. UI/UX System

FilterAnalyzer is a real-time web application. Every state transition — from first load to computation to error — has a deliberate visual treatment. This section documents the full UI/UX layer.

### 10.0 Brand & Logo

**Logomark:** A stylized frequency response curve — flat passband, steep rolloff, ripple in the stopband — rendered as a continuous SVG path inside a square or circular container. The curve is drawn in the brand accent color against a dark background. The mark is recognizable at 16×16 (favicon) and scales to full hero size.

**Logotype:** The wordmark "FilterAnalyzer" set in a technical/monospaced display font (e.g., Space Mono, JetBrains Mono, or IBM Plex Mono) alongside the logomark.

**Animated logo (splash screen):** On initial page load, the SVG path of the frequency curve is animated using CSS `stroke-dashoffset` — the line draws itself from left to right over ~800ms, as if being plotted in real time. This plays once per session. After the animation completes, the app fades in.

**Favicon:** The logomark curve alone, simplified to a 32×32 SVG path, exported as `favicon.svg`.

**Files:**
```
frontend/public/
├── favicon.svg
└── logo.svg          # Full logomark + logotype lockup

frontend/src/components/layout/
├── Logo.tsx          # Animated SVG logo component
└── SplashScreen.tsx  # Full-screen opening animation
```

---

### 10.1 Opening / Splash Screen

**Trigger:** Shown once on first page load (or hard refresh). Not shown on tab switches or soft navigation.

**Sequence:**
1. Full-screen dark overlay with logo centered.
2. Logo SVG path draws itself left-to-right (stroke animation, 800ms, ease-in-out).
3. Wordmark "FilterAnalyzer" fades in beneath the mark (200ms delay after stroke completes).
4. A one-line tagline fades in: *"Analog & Digital Filter Design"* (100ms delay after wordmark).
5. Entire splash fades out (300ms), revealing the main app underneath which has loaded in the background.

**Total duration:** ~1.5 seconds. Not skippable (too short to need it), but the fade-out begins as soon as the app shell is ready — so on fast connections it plays full; on very fast connections the logo draw is the only delay.

**Implementation:** `SplashScreen.tsx` is rendered above the app root in `App.tsx` and conditionally unmounted after the animation sequence using a `useEffect` timeout. A `sessionStorage` flag (`fa_splash_shown`) prevents replay on soft refreshes within the same session.

---

### 10.2 Loading States

Every asynchronous operation has a specific loading treatment. There are three categories:

#### A. App Shell Loading (initial JS bundle)
Handled by the HTML `index.html` — a minimal inline CSS skeleton of the app layout (sidebar + main panel outlines in muted color) is visible before React mounts. This prevents a blank white flash.

#### B. Filter Computation Loading (POST /api/design)
When the user clicks **Design Filter**, the results panel transitions immediately to a skeleton state. The compute button shows a spinner and is disabled. The sidebar inputs are locked (opacity 0.5, pointer-events none) to prevent mid-flight changes.

**Skeleton layout** (mirrors the real results panel exactly):

```
┌─────────────────────────────────────┐
│  ████████████  ← Order badge skeleton (w: 120px, h: 32px, pulse)
├─────────────────────────────────────┤
│  [Magnitude] [Phase] [Group Delay] [Pole-Zero]  ← Tab skeletons
├─────────────────────────────────────┤
│                                     │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │  ← Chart area skeleton
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │     (full chart dims, shimmer)
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                     │
├─────────────────────────────────────┤
│  ████  ← Transfer function skeleton (2 lines, different widths)
│  ████████████████
├─────────────────────────────────────┤
│  ████ ████ ████  ← Table row skeletons (3 rows)
│  ████ ████ ████
│  ████ ████ ████
└─────────────────────────────────────┘
```

**Skeleton animation:** CSS `@keyframes shimmer` — a diagonal light sweep from left to right on a muted background color. Period: 1.4s, infinite.

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton-base) 25%,
    var(--color-skeleton-highlight) 50%,
    var(--color-skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}
```

#### C. Tab Switch Loading
When switching to a tab that has no result yet, the results panel shows the skeleton immediately (no spinner). When switching to a tab with a cached result, transition is instant.

#### D. File Load (.fcfg)
When a `.fcfg` file is loaded, a small inline spinner appears next to the **Load Config** button label. Duration: the time for the recompute API call. The sidebar inputs populate instantly (before the API responds), so the user can see what was loaded while the computation runs.

#### E. Export Loading (PDF)
PDF generation is CPU-intensive (html2canvas renders each chart). A full-width progress bar appears at the bottom of the export menu: "Generating PDF... (3/4 plots captured)". The bar increments as each plot is captured.

---

### 10.3 Error States

Every error has a specific visual treatment — no generic "something went wrong."

| Error type | Display | Location |
|---|---|---|
| Invalid inputs (client-side) | Inline red border + message per field | Below each input |
| API validation error (400) | Red banner above results panel with specific message | Results panel top |
| Network error / timeout | Full results panel error state with retry button | Results panel |
| Filter order too high (computed n > MAX) | Warning banner with suggestion to relax Astop | Results panel top |
| CEI convergence failure (Elliptic edge case) | Specific error: "Elliptic design failed — try increasing wstop or relaxing Astop" | Results panel |
| .fcfg parse error | Toast notification bottom-right: "Invalid config file" | Toast |
| Export failure | Toast notification: "Export failed — try again" | Toast |

**Error banner component (`ErrorBanner.tsx`):** Dismissible, with an icon, message, and optional action button (e.g., "Retry"). Auto-dismisses after 8 seconds unless the user is hovering it.

**Toast notifications (`Toast.tsx`):** Slide in from bottom-right. Stack if multiple are present. Auto-dismiss after 4 seconds.

---

### 10.4 Micro-interactions & Transitions

| Element | Interaction |
|---|---|
| **Design Filter button** | Press: slight scale-down (0.97) + color shift. On loading: label swaps to spinner + "Computing…" |
| **Tab open (+)** | New tab slides in from right (translateX + opacity, 200ms) |
| **Tab close (×)** | Tab slides out and collapses width (200ms) |
| **Plot tab switch** | Chart area crossfades (opacity 0→1, 150ms) |
| **Results panel appear** | Staggered fade-in: order badge first, then chart, then transfer function, then table (each 80ms apart) |
| **Frequency unit toggle** | All frequency axis labels animate their numeric value (count-up/down effect via requestAnimationFrame) |
| **Pole-zero plot hover** | Hovered pole/zero enlarges (r: 4→7px, 100ms), tooltip appears with exact coordinates |
| **Compare mode activate** | Second dataset's line draws itself onto the existing chart (stroke animation, 400ms) |
| **Save config** | Button briefly shows checkmark + "Saved" (1.5s) before reverting |
| **Input field change** | Compute button pulses once (border glow, 300ms) to signal the result is stale |

---

### 10.5 Responsive Behavior

The app targets **desktop-first** (minimum useful width: 1024px). On narrower screens:

- Below 1024px: sidebar collapses to a drawer, toggled by a hamburger icon in the header.
- Below 768px: a banner warns "FilterAnalyzer is best used on a desktop or tablet."
- The app remains usable on tablet (768px+) with the drawer sidebar.
- Mobile (<768px) is functional but not optimized.

---

### 10.6 Color System & CSS Variables

```css
:root {
  /* Brand */
  --color-accent:          #00D4FF;   /* Cyan — primary interactive color */
  --color-accent-dim:      #0099BB;   /* Darker cyan for hover states */

  /* Backgrounds */
  --color-bg-base:         #0D0F14;   /* Near-black app background */
  --color-bg-panel:        #13161E;   /* Sidebar and results panel */
  --color-bg-card:         #1A1E2A;   /* Chart containers, input cards */
  --color-bg-elevated:     #20253A;   /* Dropdowns, tooltips */

  /* Text */
  --color-text-primary:    #E8EAF0;   /* Main readable text */
  --color-text-secondary:  #8B90A0;   /* Labels, captions */
  --color-text-muted:      #4A5068;   /* Placeholder text, disabled */

  /* Borders */
  --color-border:          #252A3A;   /* Panel borders */
  --color-border-focus:    #00D4FF;   /* Input focus ring */

  /* Semantic */
  --color-error:           #FF4D6A;
  --color-warning:         #FFB347;
  --color-success:         #4DFF9B;

  /* Skeleton */
  --color-skeleton-base:      #1A1E2A;
  --color-skeleton-highlight: #252A3A;

  /* Plots */
  --color-plot-magnitude:  #00D4FF;   /* Magnitude response line */
  --color-plot-phase:      #A78BFA;   /* Phase response line */
  --color-plot-group-delay:#4DFF9B;   /* Group delay line */
  --color-plot-spec-line:  #FF4D6A;   /* Wpass/Wstop/Apass/Astop spec markers */
  --color-pole:            #FF4D6A;   /* × markers on pole-zero plot */
  --color-zero:            #4DFF9B;   /* ○ markers on pole-zero plot */
  --color-locus:           #FFB347;   /* Ellipse/circle locus dashed line */
  --color-compare:         #FFB347;   /* Comparison overlay line */

  /* Typography */
  --font-display:   'IBM Plex Mono', monospace;   /* Logo, headings, order badge */
  --font-body:      'DM Sans', sans-serif;         /* UI text, labels */
  --font-mono:      'IBM Plex Mono', monospace;    /* Transfer function, coordinates */
}
```

---

### 10.7 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Logo wordmark | IBM Plex Mono | 700 | 20px |
| Section headings | DM Sans | 600 | 14px, uppercase, letter-spacing 0.08em |
| Body / labels | DM Sans | 400 | 13px |
| Input values | IBM Plex Mono | 400 | 14px |
| Order badge | IBM Plex Mono | 700 | 28px |
| Transfer function | KaTeX (auto) | — | 15px base |
| Pole/zero coordinates | IBM Plex Mono | 400 | 12px |
| Axis tick labels | DM Sans | 400 | 11px |
| Tooltip values | IBM Plex Mono | 400 | 12px |

---

### 10.8 Plot Design Specification

All plots share a consistent visual language:

- **Background:** `--color-bg-card` (no white backgrounds)
- **Grid lines:** Subtle, `--color-border`, 1px, dashed
- **Axes:** `--color-text-secondary`, 1px solid
- **Crosshair on hover:** Full-width + full-height hairlines in `--color-text-muted`, with a value tooltip
- **Specification overlay lines:** Vertical lines at wpass and wstop, horizontal lines at Apass and Astop, drawn in `--color-plot-spec-line` as dashed lines with small labels ("ωp", "ωs", "Apass", "Astop")
- **Responsive:** Charts use `ResponsiveContainer` (Recharts) or a resize observer (D3) to fill their container

**Pole-zero plot specific:**
- s-plane axes drawn through origin (σ and jω axes)
- Unit circle drawn as dashed ring (for reference, and as solid ring in digital/z-plane mode)
- Poles: × marker, `--color-pole`, size 8px, hover enlarges to 12px
- Zeros: ○ marker (open circle), `--color-zero`, size 8px
- Locus (circle for Butterworth, ellipse for others): dashed, `--color-locus`, 1px
- Conjugate pairs connected by faint dashed vertical line

## 10. UI Reference

### 10.1 Parameter Input Panel

The left sidebar contains all filter specification inputs. On first load, inputs are pre-populated with **normalized defaults**:

| Input | Default Value | Notes |
|---|---|---|
| wpass | 1.0 | Fixed at 1 in normalized mode; editable in denormalized mode |
| wstop | 2.0 | Range: > wpass. Recommended: 1.5 or 2.0 |
| Apass | −1.0 dB | Recommended range: −0.1 to −3.0 dB |
| Astop | −40.0 dB | Recommended range: −20 to −107 dB |

Each field has an inline hint explaining the trade-off (e.g., "Lower wstop → higher order → more complex filter").

Validation feedback appears inline (red border + message) before any API call is made.

### 10.2 Filter Selection

Two-level selection:

1. **Filter domain:** `Analog` | `Digital IIR`
2. **Approximation:** `Butterworth` | `Chebyshev` | `Inverse Chebyshev` | `Elliptic`

Selecting `Digital IIR` reveals an additional **Sampling Frequency (Fs)** input.

### 10.3 Results Panel

After clicking **Design Filter**, the results panel shows:

- A prominent **order badge**: "Order n = 5" with the approximation name.
- Four plot tabs: **Magnitude**, **Phase**, **Group Delay**, **Pole-Zero**.
- Below the plots: **Transfer Function** (rendered with KaTeX) and **Pole-Zero Table**.

All plots are responsive (resize with the browser window). Hovering any plot shows a crosshair with exact values at that frequency.

### 10.4 Multi-tab Workspace

The top tab bar allows up to 8 simultaneous designs.

- Click **+** to open a new tab. A new tab inherits the current input state as a starting point.
- Each tab maintains completely independent state (inputs, results, loading state).
- Tabs can be renamed by double-clicking the tab label.
- Auto-name format: `{APPROX_ABBR}-n{ORDER}` (e.g., `ELL-n5`, `BTW-n6`).
- Close a tab with the **×** button. Confirmation prompt if the design has unsaved changes.

### 10.5 Save & Load Configurations

**Save:** Click **Save Config** to download a `.fcfg` file. The file contains the full input state of the current tab. See §13 for the format.

**Load:** Click **Load Config** to open a file picker. Selecting a valid `.fcfg` file populates the current tab's inputs and triggers an immediate recompute.

**Auto-save:** Each tab's input state is written to `localStorage` on every change, keyed by tab ID. On page refresh, all tabs are restored.

### 10.6 Frequency Unit Toggle

A toggle in the parameter panel switches between **rad/s** and **Hz**.

- When switching to Hz: all displayed frequency values are divided by 2π.
- When switching to rad/s: all displayed frequency values are multiplied by 2π.
- The internal computation always uses rad/s. Conversion is purely display-layer.
- The toggle state is saved per tab.

---

## 11. Math Engine — Implementation Details

This section documents the Python implementation of each approximation function. Equation numbers reference the source paper (Zubair & Olawale, 2022).

### 11.1 Butterworth

**File:** `backend/engine/butterworth.py`  
**MATLAB source:** `btw.m`

**Step 1 — Compute ε, n, R:**
```
ε = √(10^(−0.1·Apass) − 1)                               [Eq. 14]
n = ⌈ log((10^(−0.1·Astop)−1)/(10^(−0.1·Apass)−1)) /
        (2·log(wstop/wpass)) ⌉                             [Eq. 15]
R = ε^(−1/n)                                               [Eq. 16]
```

**Step 2 — Determine odd/even order** (`odev.m` → `common.py`):
```
mode = 1 if n is odd
mode = 2 if n is even
```

**Step 3 — Compute pole angles:**
- Even: θₘ = π(2m + n + 1)/(2n), m = 0, 1, ..., n/2 − 1        [Eq. 17]
- Odd:  θₘ = π(2m + n + 1)/(2n), m = 0, 1, ..., (n−1)/2 − 1   [Eq. 18]
- If odd: real pole at σ = −R

**Step 4 — Compute pole coordinates:**
```
σₘ = R·cos(θₘ)          [Eq. 19]
ωₘ = R·sin(θₘ)          [Eq. 20]
```

**Step 5 — Build DF matrix (quadratic factors of denominator):**
```
B1m = −2·σₘ             [Eq. 23]
B2m = σₘ² + ωₘ²         [Eq. 24]
DF[m] = [1, B1m, B2m]
```

**Transfer function:**
- Even: H(s) = ∏B2m / ∏(s² + B1m·s + B2m)                      [Eq. 25]
- Odd:  H(s) = R·∏B2m / (s+R)·∏(s² + B1m·s + B2m)              [Eq. 26]

---

### 11.2 Chebyshev Type I

**File:** `backend/engine/chebyshev.py`  
**MATLAB source:** `cheb.m`

**Step 1 — Compute ε, n, D:**
```
ε = √(10^(−0.1·Apass) − 1)                               [Eq. 14]
n = ⌈ acosh(√((10^(−0.1·Astop)−1)/(10^(−0.1·Apass)−1)))
       / acosh(wstop/wpass) ⌉                              [Eq. 29]
D = asinh(ε⁻¹) / n                                        [Eq. 30]
```

**Step 2 — Pole angles (same formula as Butterworth but different index range):**
- Even: θₘ = π(2m+1)/(2n), m = 0, 1, ..., n/2 − 1              [Eq. 31]
- Odd:  θₘ = π(2m+1)/(2n), m = 0, 1, ..., (n−1)/2 − 1          [Eq. 32]
- If odd: real pole at σ = −sinh(D)

**Step 3 — Pole coordinates (on ellipse):**
```
σₘ = −sinh(D)·sin(θₘ)   [Eq. 33]
ωₘ = cosh(D)·cos(θₘ)    [Eq. 34]
```

**Step 4 — Build DF matrix:**  
Same as Butterworth: B1m = −2σₘ, B2m = σₘ² + ωₘ²

**Step 5 — Even-order gain constant:**
```
G = 10^(0.05·Apass)      [Eq. 39]   (even order only)
```

**Transfer function:**
- Even: H(s) = G·∏B2m / ∏(s² + B1m·s + B2m)                    [Eq. 40]
- Odd:  H(s) = sinh(D)·∏B2m / (s+sinh(D))·∏(s² + B1m·s + B2m)  [Eq. 41]

---

### 11.3 Inverse Chebyshev (Type II)

**File:** `backend/engine/inverse_chebyshev.py`  
**MATLAB source:** `chebinv.m`

**Step 1 — Compute εᵢ, n, Dᵢ:**
```
εᵢ = 1 / √(10^(−0.1·Astop) − 1)                          [Eq. 43]
n  = same formula as Chebyshev                             [Eq. 44]
Dᵢ = asinh(εᵢ⁻¹) / n                                     [Eq. 47]
```

**Step 2 — Compute Chebyshev poles (prime values) and invert:**
```
σ'ₘ = −sinh(Dᵢ)·sin(θₘ)                                  [Eq. 48]
ω'ₘ = cosh(Dᵢ)·cos(θₘ)                                   [Eq. 49]

σₘ = σ'ₘ / (σ'ₘ² + ω'ₘ²)                                 [Eq. 52]
ωₘ = −ω'ₘ / (σ'ₘ² + ω'ₘ²)                                [Eq. 53]
```

**Step 3 — Zeros on jω axis:**
```
σzₘ = 0                                                    [Eq. 54]
ωzₘ = sec(θₘ) = 1/cos(θₘ)                                 [Eq. 55]
```

**Step 4 — Build NF and DF matrices:**
```
A1m = 0                                                    [Eq. 60]
A2m = ωzₘ²                                                [Eq. 61]
NF[m] = [1, 0, A2m]

B1m = −2σₘ, B2m = σₘ² + ωₘ²
DF[m] = [1, B1m, B2m]
```

**Transfer function:**
- Even: H(s) = ∏B2m·∏(s²+A2m) / ∏A2m·∏(s²+B1m·s+B2m)          [Eq. 62]
- Odd:  includes first-order factor [sinh(Dᵢ)]⁻¹/(s+[sinh(Dᵢ)]⁻¹) [Eq. 63]

---

### 11.4 Elliptic (Cauer)

**File:** `backend/engine/elliptic.py`  
**MATLAB source:** `eff.m`, `CEI.m`, `CEIinv.m`

This is the most mathematically complex approximation. It uses the **Complete Elliptic Integral (CEI)** and **Jacobian elliptic functions** computed entirely by numerical integration — no closed-form formula exists.

**Step 1 — Compute ε, rt, kn:**
```
ε  = √(10^(−0.1·Apass) − 1)
rt = wpass / wstop                                         [Eq. 65]
kn = √(10^(−0.1·Apass)−1) / √(10^(−0.1·Astop)−1)        [Eq. 66]
```

**Step 2 — Compute CEI values and order n:**
```
n = ⌈ CEI(rt)·CEI(√(1−kn²)) / (CEI(√(1−rt²))·CEI(kn)) ⌉  [Eq. 64]
```

**Step 3 — Compute v₀:**
```
v₀ = CEI(rt) · sc⁻¹(ε⁻¹, kn) / (n · CEI(kn))            [Eq. 74]
```
where `sc⁻¹(u, k)` is computed via the reverse CEI integral (CEIinv).

**Step 4 — Pole locations:**
```
f(m) = CEI(rt)·(2m+1)/n or CEI(rt)·(2m+2)/n              [Eq. 77/78]

σₘ = −cn[f(m),rt]·dn[f(m),rt]·sn(v₀,√(1−rt²))·cn(v₀,√(1−rt²)) /
     (1 − dn²[f(m),rt]·sn²(v₀,√(1−rt²)))                 [Eq. 75]

ωₘ = sn[f(m),rt]·dn(v₀,√(1−rt²)) /
     (1 − dn²[f(m),rt]·sn²(v₀,√(1−rt²)))                 [Eq. 76]
```

**Step 5 — Zero locations (purely imaginary):**
```
σzₘ = 0                                                    [Eq. 80]
ωzₘ = 1 / (rt · sn[f(m), rt])                             [Eq. 81]
```

---

### 11.5 Bilinear Transform (Analog → Digital IIR)

**File:** `backend/engine/bilinear.py`

When `filter_type == "digital"`:

1. **Pre-warp** the analog critical frequencies:
   ```
   ω_a = (2·Fs) · tan(π·ω_d / Fs)
   ```
   where ω_d is the digital frequency in rad/s (= 2π·f for Hz input) and Fs is the sampling frequency.

2. **Design analog prototype** using the pre-warped frequencies (calling the selected approximation engine module).

3. **Apply BLT** to each analog pole pₖ:
   ```
   z_pole = (1 + pₖ/(2·Fs)) / (1 − pₖ/(2·Fs))
   ```
   Each finite zero of the analog filter is similarly transformed. Analog zeros at s=∞ map to z=−1.

4. **Reconstruct H(z)** from digital poles and zeros. Normalize gain to match passband.

5. **Return** digital poles, zeros, and the `b`, `a` coefficient arrays for the difference equation:
   ```
   H(z) = B(z)/A(z) = (b₀ + b₁z⁻¹ + ... + bₙz⁻ⁿ) / (1 + a₁z⁻¹ + ... + aₙz⁻ⁿ)
   ```

The digital frequency response is evaluated over ω ∈ [0, π] (i.e., 0 to Nyquist), and converted to Hz for display.

---

### 11.6 Complete Elliptic Integral (CEI) — Numerical Implementation

**MATLAB source:** `CEI.m` (forward), `CEIinv.m` (reverse)

**Forward CEI** (compute integral value given k and upper limit φ = π/2):
```python
def cei_forward(k: float) -> float:
    """Compute K(k) = ∫₀^(π/2) (1 - k²·sin²x)^(-0.5) dx"""
    phi = math.pi / 2
    n_steps = 1_000_000
    dx = phi / n_steps
    total = 0.0
    for x in np.linspace(0, phi, n_steps):
        total += (1 - k**2 * math.sin(x)**2) ** (-0.5) * dx
    return total
```

In practice this loop is vectorized with NumPy for performance:
```python
x = np.linspace(0, math.pi/2, 1_000_000)
integrand = (1 - k**2 * np.sin(x)**2) ** (-0.5)
return np.trapz(integrand, x)
```

**Reverse CEI** (find φ given integral value u and k):
```python
def cei_inverse(u: float, k: float) -> float:
    """Find φ such that ∫₀^φ (1-k²·sin²x)^(-0.5) dx = u"""
    # Numerical scan: accumulate integral until it reaches u
    dx = 1e-5
    total = 0.0
    x = 0.0
    while x <= 5 * math.pi:
        total += (1 - k**2 * math.sin(x)**2) ** (-0.5) * dx
        if total >= u:
            return x
        x += dx
    raise ValueError(f"CEI inverse did not converge for u={u}, k={k}")
```

**Performance note:** CEI forward with 1,000,000 points takes ~10ms on a modern CPU using NumPy vectorization. CEI inverse with dx=1e-5 takes ~30–80ms depending on the value of u. The Elliptic filter design calls CEI multiple times. Total backend response time for Elliptic is typically 100–400ms — acceptable for a design tool. CEI calls are not cached (each request is independent and stateless).

---

## 12. MATLAB → Python Translation Reference

This table maps every MATLAB construct used in the original scripts to its Python/NumPy equivalent.

| MATLAB | Python/NumPy | Notes |
|---|---|---|
| `ceil(n)` | `math.ceil(n)` | Round up to nearest integer |
| `n/2` (integer test) | `n % 2 == 0` | Check even/odd |
| `round(qq)` | `round(qq)` | Python built-in |
| `log10(x)` | `math.log10(x)` | |
| `log(x)` | `math.log(x)` | Natural log |
| `acosh(x)` | `math.acosh(x)` | |
| `asinh(x)` | `math.asinh(x)` | |
| `sinh(x)` | `math.sinh(x)` | |
| `cosh(x)` | `math.cosh(x)` | |
| `sin(x)` | `math.sin(x)` | |
| `cos(x)` | `math.cos(x)` | |
| `sec(x)` | `1 / math.cos(x)` | No direct equivalent |
| `tan(x)` | `math.tan(x)` | |
| `atan(x)` | `math.atan(x)` | |
| `sqrt(x)` | `math.sqrt(x)` | |
| `abs(x)` | `abs(x)` or `np.abs(x)` | |
| `j` (imaginary unit) | `1j` | Python complex literal |
| `x + j*y` | `complex(x, y)` | |
| `DF(ct,:) = [a b c]` | `DF.append([a, b, c])` | DF as Python list of lists |
| `[mm,mmm]=size(DF)` | `mm = len(DF)` | Row count |
| `zeros(1, n+1)` | `np.zeros(n+1)` | 1D array |
| `for m=0:N` | `for m in range(0, N+1)` | Inclusive upper bound in MATLAB |
| `mode==1` (odd) | `n % 2 != 0` | |
| `mode==2` (even) | `n % 2 == 0` | |
| `Bproduct = Bproduct * x` | Accumulated as Python float | |
| `polyexp2` (sub-script) | Custom `poly_expand()` function in `transfer_function.py` | Polynomial convolution |
| `PolyDF = poly` | Return value from `poly_expand()` | |
| `conv(a, b)` | `np.polymul(a, b)` | Polynomial multiplication |
| `roots(p)` | `np.roots(p)` | Roots of polynomial |

**Key structural difference:** MATLAB scripts share state via workspace variables (`DF`, `Bproduct`, `mode`, etc.) and call sub-scripts. The Python port refactors each script into a function that receives parameters and returns a data structure (dataclass or dict). No global state.

---

## 13. Filter Configuration File Format (.fcfg)

`.fcfg` files are UTF-8 JSON documents. The file extension is `.fcfg` (Filter ConFiGuration). They can be opened in any text editor.

**Full schema:**

```json
{
  "fcfg_version": "1.0",
  "created_at": "2025-10-14T11:23:00Z",
  "tab_name": "ELL-n5",
  "parameters": {
    "approximation": "elliptic",
    "filter_type": "analog",
    "w_pass": 1.0,
    "w_stop": 2.0,
    "a_pass": -1.0,
    "a_stop": -60.0,
    "freq_unit": "rad_s",
    "sampling_freq": null
  },
  "last_result": {
    "order": 5,
    "epsilon": 0.5088,
    "poles": [
      {"real": -0.2389, "imag": 0.0},
      {"real": -0.1782, "imag": 0.6336},
      {"real": -0.1782, "imag": -0.6336},
      {"real": -0.0599, "imag": 0.9784},
      {"real": -0.0599, "imag": -0.9784}
    ],
    "zeros": [
      {"real": 0.0, "imag": 3.2508},
      {"real": 0.0, "imag": -3.2508},
      {"real": 0.0, "imag": 2.0892},
      {"real": 0.0, "imag": -2.0892}
    ],
    "poly_num": [2.1549e-3, 0.0, 3.2149e-2, 0.0, 9.9531e-2],
    "poly_den": [1.0, 0.7151, 1.5506, 0.7376, 0.5105, 0.0994]
  }
}
```

**Notes:**
- `last_result` is optional. If present, it is displayed immediately when the file is loaded without requiring a recompute. If absent, the app computes on load.
- `fcfg_version` allows future format migrations.
- The `parameters` object maps directly to the API request schema (§9.3).

---

## 14. Outputs & Exports

### PNG Export
Each plot has an individual **Download PNG** button. The chart SVG is serialized and drawn to a canvas element, then saved via `<a download>`. Resolution: 2× device pixel ratio (retina-ready).

### CSV Export
Clicking **Export CSV** on the frequency response panel downloads a file with columns:

```
frequency,magnitude_db,phase_deg,group_delay
0.0,0.0,0.0,1.432
0.001,-0.0001,-0.057,1.433
...
```

Frequency unit matches the current toggle state (rad/s or Hz).

### PDF Report
Clicking **Export PDF** generates a multi-page PDF using jsPDF:

- **Page 1:** Title, filter specifications summary table, filter order and ε
- **Page 2:** Magnitude response plot + Phase response plot
- **Page 3:** Group delay plot + Pole-zero plot
- **Page 4:** Transfer function (rendered), pole-zero coordinate table

The PDF is generated entirely in the browser — no server call required.

---

## 15. Deployment

### 15.1 Docker (Recommended)

The `docker-compose.yml` at the project root defines two services:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - CORS_ORIGINS=http://localhost:5173

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
```

```bash
docker-compose up --build
```

The frontend Nginx serves the built Vite SPA. The backend Uvicorn serves the FastAPI app.

### 15.2 Manual Deployment

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build        # Output: frontend/dist/
# Serve dist/ with any static file server (Nginx, Caddy, etc.)
```

### 15.3 Vercel + Railway (Split Deployment)

This is the recommended production setup (same pattern as the Gridwatch monorepo):

**Frontend → Vercel:**
- Connect the `frontend/` directory to a Vercel project.
- Set environment variable: `VITE_API_URL=https://filteranalyzer-api.railway.app`
- Vercel auto-detects Vite; build command `npm run build`, output `dist`.

**Backend → Railway:**
- Connect the `backend/` directory to a Railway service.
- Railway auto-detects the `Dockerfile` in `backend/`.
- Set environment variable: `CORS_ORIGINS=https://filteranalyzer.vercel.app`

---

## 16. Project Roadmap

### v1.0 — MVP (current scope)
- [x] Documented architecture and math engine
- [ ] Backend: Butterworth, Chebyshev I, Inverse Chebyshev engines
- [ ] Backend: Elliptic engine (CEI/CEIinv)
- [ ] Backend: Bilinear transform (analog → digital)
- [ ] Backend: Phase response and group delay computation
- [ ] Backend: Transfer function polynomial expansion
- [ ] Frontend: Parameter input panel with validation
- [ ] Frontend: Magnitude, Phase, Group Delay plots (Recharts)
- [ ] Frontend: Pole-zero plot (D3, s-plane and z-plane)
- [ ] Frontend: Transfer function display (KaTeX)
- [ ] Frontend: Multi-tab workspace (Zustand)
- [ ] Frontend: Save/load .fcfg files
- [ ] Frontend: PNG + CSV + PDF export
- [ ] Frontend: Frequency unit toggle (rad/s ↔ Hz)
- [ ] Deployment: Vercel + Railway

### v1.1
- [ ] Compare mode — overlay magnitude responses from two tabs
- [ ] Band-pass and high-pass filter transformations (LP prototype → BP/HP)
- [ ] Bessel approximation (no specification-driven order formula; order entered directly)
- [ ] Dark/light theme toggle

### v1.2
- [ ] Filter coefficient export for embedded systems (C header file format)
- [ ] Step response plot
- [ ] Impulse response plot
- [ ] Filter sensitivity analysis

---

## 17. Academic Reference

The mathematical framework implemented in FilterAnalyzer is drawn directly from:

**Zubair, A. R. & Olawale, A. J. (2022).** Active learning strategy: Computer aided numerical class project on pole-zero plot and transfer function of five low pass filter approximation functions. *Global Journal of Engineering and Technology Advances*, 12(01), 038–063.  
DOI: [10.30574/gjeta.2022.12.1.0105](https://doi.org/10.30574/gjeta.2022.12.1.0105)

Additional references from that paper relevant to this implementation:

- Thede, L. (2004). *Practical Analog and Digital Filter Design.* Artech House. — Primary filter design reference.
- Orfanidis, S. J. (2010). *Introduction to Signal Processing.* Prentice Hall. — Passband/stopband deviation equations.
- Abramowitz, M. & Stegun, I. A. (1965). *Handbook of Mathematical Functions.* Dover. — Elliptic integral theory.
- Proakis, J. G. & Manolakis, D. G. (1996). *Digital Signal Processing.* Prentice-Hall. — Bilinear transform and digital filter design.

---

## 18. License

MIT License — see `LICENSE` file.

---

*FilterAnalyzer is built by [The Webstr](https://thwebstr.com). EEE background meets web engineering.*