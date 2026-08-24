# AluCalc OS ⚙️ 

![AluCalc OS Banner](https://www.alucalculator.com/icon.svg)

**AluCalc OS** is a highly advanced, browser-based engineering calculation suite and 3D design workstation. Built with modern web technologies, it bridges the gap between academic theory, mechanical design, and real-time visualization.

## 🚀 Key Features

- **Engineering Modules (FEA & Mechanics):** Live calculators for beam deflection, buckling, fasteners (VDI 2230), and bearings.
- **Interactive 3D Workspace:** Powered by `Three.js` and `React Three Fiber`, allowing users to visualize structural deformations, parametric CAD, and dynamic assemblies directly in the browser.
- **Performance First:** Engineered for extreme speed. The entire 3D engine is lazy-loaded (`next/dynamic`) to guarantee instant initial page loads and seamless routing.
- **Cross-Platform:** Ships as a highly optimized Progressive Web App (PWA) and is automatically bundled into native Android & Wear OS applications via Bubblewrap.
- **Secure & Modern:** 100% strict TypeScript codebase, utilizing the Next.js 16 App Router for robust static site generation (SSG) and top-tier SEO performance.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & Animations:** React 19, [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), Radix UI
- **3D Engine:** [Three.js](https://threejs.org/) & [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)
- **Mobile Deployment:** [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (TWA - Android/Wear OS)
- **Math & Physics:** `mathjs`, `nerdamer`, `decimal.js`

## 🚦 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Build & Deployment

To compile the application, generate all static pages via `generateStaticParams`, and create the Android APKs:

```bash
npm run build
```

This project statically exports over 250+ engineering routes and calculators. The 3D engines are completely decoupled from the initial server-side render, ensuring a Perfect Lighthouse score for time-to-interactive.

## 🛡 Security & Hygiene

AluCalc OS maintains a strict "Zero Critical Vulnerability" policy. All legacy dependencies (such as obsolete TypeORM instances) have been aggressively purged. Run `npm audit` periodically and only apply minor/patch updates automatically. Major architectural updates (e.g. Next.js, Three.js) require manual verification of the 3D rendering pipeline.

---
*Built for the engineers of tomorrow.*
