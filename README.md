# SafeLinker | Smart Phishing Detection & Awareness Platform

**Identify suspicious URLs. Understand cyber threats. Browse more safely.**

SafeLinker is a web-based cybersecurity awareness platform designed to help users recognize potentially malicious URLs, understand common phishing indicators, and strengthen their online safety knowledge. By combining heuristic URL analysis, risk explanations, scan history, and interactive security quizzes, SafeLinker makes cybersecurity awareness more practical and accessible.

<p align="center">
  <img src="frontend/assets/logo.svg" alt="SafeLinker Logo" width="100" />
</p>

<p align="center">
  <strong>Detect · Understand · Learn · Stay Safe</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JavaScript-orange?style=for-the-badge" alt="Frontend technologies" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?style=for-the-badge" alt="Backend technologies" />
  <img src="https://img.shields.io/badge/Database-MySQL-blue?style=for-the-badge" alt="MySQL database" />
</p>

---

## Overview

Phishing attacks often use deceptive links, fake login pages, misleading domains, and urgent messages to trick users into revealing sensitive information. Many users struggle to distinguish legitimate websites from suspicious ones.

SafeLinker addresses this challenge by providing a centralized platform where users can:

- Analyze URLs for suspicious characteristics.
- Review risk scores and explanations.
- Track previous scans.
- Learn about phishing and online security.
- Evaluate their cybersecurity knowledge through quizzes.

**Project objective:** Combine practical URL risk analysis with interactive cybersecurity education in a single, easy-to-use web application.

## Key Features

### URL Risk Analysis
Submit a URL and analyze it for suspicious patterns using the application's configured detection rules.

### Explainable Scan Results
Display a risk classification, score, and reasons that help users understand why a URL may be suspicious.

### Threat Intelligence Integration
Support external threat intelligence checks when the relevant provider and API credentials are configured.

### Scan History
Review previous scans and access available results through the history interface.

### Interactive Security Quiz
Answer cybersecurity awareness questions and evaluate your understanding of phishing, suspicious links, and safe browsing practices.

### User Dashboard
Access account-related information and available activity statistics from a centralized dashboard.

### Administrator Tools
Provide administrative functionality to authorized users, with access controlled by backend authorization checks.

### Responsive Interface
Use a web interface built with HTML, CSS, and JavaScript for access through modern browsers.

## Application Workflow

1. **Authenticate:** Register an account or sign in.
2. **Submit:** Enter the URL you want to inspect.
3. **Analyze:** The backend evaluates the URL using the configured analysis rules and integrations.
4. **Understand:** Review the reported risk level, score, and detected indicators.
5. **Track:** View previous scan records in scan history.
6. **Learn:** Complete cybersecurity awareness quizzes to improve threat recognition.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| API communication | REST APIs, Fetch API |
| Security analysis | Heuristic URL analysis |
| Threat intelligence | Google Safe Browsing integration, when configured |
| Development tools | Visual Studio Code, npm |
| Version control | Git, GitHub |

## System Architecture

```text
                 ┌─────────────────────────┐
                 │         User            │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │     Frontend Layer      │
                 │      HTML / CSS / JS    │
                 └────────────┬────────────┘
                              │ REST API
                              ▼
                 ┌─────────────────────────┐
                 │     Express Backend     │
                 │ Authentication & Routes │
                 └────────────┬────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
          ┌───────────┐ ┌────────────┐ ┌──────────────┐
          │ URL       │ │ MySQL      │ │ Threat       │
          │ Analyzer  │ │ Database   │ │ Intelligence │
          └───────────┘ └────────────┘ └──────────────┘
```

## Project Structure

```text
SafeLinker/
├── backend/
│   ├── middleware/
│   │   ├── admin.js
│   │   └── auth.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── quizRoutes.js
│   │   └── scanRoutes.js
│   ├── services/
│   │   ├── threatIntel.js
│   │   └── urlAnalyzer.js
│   ├── utils/
│   │   └── validators.js
│   ├── database.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
├── database/
│   └── schema.sql
├── frontend/
│   ├── assets/
│   │   └── logo.svg
│   ├── pages/
│   │   ├── admin.html
│   │   ├── dashboard.html
│   │   ├── history.html
│   │   └── quiz.html
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore
└── README.md
```

## Getting Started

Follow these steps to run SafeLinker locally.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- [Visual Studio Code](https://code.visualstudio.com/)
- A modern web browser

### 1. Clone the repository

```bash
git clone https://github.com/RekkalaSireesha/SafeLinker.git
cd SafeLinker
```

### 2. Set up the database

1. Open MySQL Workbench or your MySQL command-line client.
2. Open `database/schema.sql`.
3. Execute the script to create the database and required tables.
4. Verify that the database and tables were created successfully.

Use the database name defined in your schema and backend configuration. The default project database name is `safelinker_db`.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` directory.

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=safelinker_db
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=1h
GOOGLE_SAFE_BROWSING_API_KEY=
```

Replace the placeholder values with your local configuration. Generate a strong, random JWT secret and provide a threat intelligence API key only if you use that integration.

**Security:** Never commit `.env` files, passwords, JWT secrets, or API keys to GitHub.

### 5. Start the backend server

From the `backend` directory, run:

```bash
npm start
```

The API should start at:

```text
http://localhost:5000
```

Check the health endpoint:

```text
http://localhost:5000/api/health
```

### 6. Start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npx http-server -p 5500
```

Open the local website at:

```text
http://localhost:5500
```

Keep both the frontend server and backend server running during local development. If your frontend uses a different API base URL, update it to match the running backend.



```markdown


## Security and Limitations

- Risk scores are indicators generated by the configured analysis logic, not proof that a URL is malicious or safe.
- Newly created phishing pages and sophisticated attacks may evade heuristic checks.
- External threat intelligence results depend on provider availability, configuration, and coverage.
- Passwords should be stored using an appropriate password-hashing algorithm.
- Authentication and administrator permissions must be enforced by the backend.
- Production deployments should use HTTPS, validated inputs, appropriate rate limits, secure secrets, and restricted database access.
- Do not enter real passwords or other sensitive information into suspicious websites for testing.

## Future Improvements

- Enhance URL analysis with additional detection rules and threat intelligence.
- Add richer analytics and scan-report exports.
- Expand the cybersecurity quiz and learning content.
- Improve automated testing and security monitoring.
- Deploy the frontend and backend with a production-ready database.
- Add a public demo and deployment documentation.

## Author

**Sireesha Rekkala**

GitHub: [RekkalaSireesha](https://github.com/RekkalaSireesha)

Project repository: [SafeLinker](https://github.com/RekkalaSireesha/SafeLinker)

## License

No license has been specified yet. Add a `LICENSE` file if you decide to distribute the project under an open-source license.

---

<p align="center">
  <strong>SafeLinker — Building safer browsing habits through awareness and analysis.</strong>
</p>