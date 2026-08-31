# DevPulse — AI-Powered Code Intelligence Platform

> **See the Code. Find the Pulse.**
>
> DevPulse is a comprehensive, client-first developer intelligence platform providing static analysis, complexity breakdown, code smell detection, dependency graphs, architectural call maps, interactive test intelligence, and agentic code remediation.

---

## 🚀 Quick Start & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 📦 Production Builds & Deployment Options

### Option A: Static Web Hosting (GitHub Pages, Vercel, Netlify)
DevPulse features a rich client-side engine (lexical tokenizers, structural AST analyzers, pattern matchers, complexity engines, and memory services) that run entirely in the browser without requiring a server backend.

```bash
# Build the static distribution
npm run build:pages

# Preview the static build locally
npm run preview
```

#### GitHub Pages Automated Deployment
An automated GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.
To deploy automatically:
1. Push this repository to GitHub on `main` or `master`.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build and deploy the live site.

---

### Option B: Full-Stack Container / Cloud Run Deployment
For production deployments utilizing server-side Gemini AI endpoints and PostgreSQL Cloud SQL synchronization:

```bash
# Full build (client SPA + compiled Node.js backend server)
npm run build

# Start production server
npm start
```

---

## 🔑 Environment Variables

| Variable | Required For | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-Side Pulse AI | Gemini API key for real-time generative intelligence endpoints. |
| `APP_URL` | Self-Referential Links | Base hosting URL for callback routes and self-referencing. |
| `DATABASE_URL` | Cloud SQL Persistence | Optional PostgreSQL connection string for team account sync. |

*Note: On static-only deployments like GitHub Pages, client-side static analyzers, code metrics, smell detection, complexity heatmaps, and pattern engines function seamlessly with built-in client fallbacks.*
