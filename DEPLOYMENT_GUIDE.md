# 🚀 AluCalc OS – Deployment & Handover Guide (v5.0.0 Beta)

## 📜 The Engineering OS Manifesto
**AluCalc OS is not a standard web tool.** It is a modular **Engineering Operating System** designed for high-density simulation and assembly-level modeling. Its power lies in:
- **Modular Plugin Architecture**: Decoupled engineering engines (Gears, Shafts, Bearings).
- **Engineering Data Bus**: The `$ref` system that links independent calculations into a single physical assembly.
- **Interactive Truth Ledger**: A visual dependency graph that maps the flow of engineering data.

---

## 🛠️ 1. Production Hosting (Vercel / Render)

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`

### Environment Variables (MANDATORY)
You MUST configure the following secrets in your hosting dashboard:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase/Neon) | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Used to encrypt JWT and Session cookies | `generate-a-long-random-string` |
| `NEXTAUTH_URL` | The canonical URL of your production app | `https://alucalc.com` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console | `...-apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret from Google Cloud Console | `...` |

---

## 🛡️ 2. Database & Identity Setup

### PostgreSQL Configuration
AluCalc OS uses a single PostgreSQL instance (e.g., Supabase, Neon, or RDS) to store project state and identity.

1.  **Initialize Tables**: Run the SQL script found in `src/lib/schema.sql` against your production database. This will create:
    - `users`, `accounts`, `sessions`: NextAuth standard tables.
    - `projects`: Project repository ledger.
    - `calculations`: The engineering data store (includes `input_json` and `result_json`).
2.  **NextAuth Adapter**: The system is pre-configured to use `@auth/pg-adapter`. It will automatically synchronize Google logins with your `users` table upon the first login.

---

## 🚀 3. Post-Deployment Verification

Once deployed, follow this sequence to verify system integrity:
1.  **Identity Verification**: Log in via Google to ensure the `users` table is populated.
2.  **Project Initialization**: Create a new project via the **"Initialize Project Alpha"** onboarding surface.
3.  **Data Bus Stress Test**:
    - Run a **Gears** calculation.
    - Create a **Shafts** calculation.
    - Use the **Assembly Connector** to link the Shaft load to the Gear output using `{calc_id}.force`.
4.  **Graph Integrity**: Switch to the **"Assembly Flow"** tab on the Dashboard to verify the visual dependency edge is drawn correctly.

---

## 🏁 Mission Status
**AluCalc OS v5.0.0 development and Auth integration are successfully completed.** The core architecture is locked, verified, and ready for public beta launch. The system is awaiting Vercel/Supabase connection strings for live deployment.

*Developed by Antigravity — 2026*
