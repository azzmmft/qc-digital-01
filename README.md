# QC Digital — Digital Quality Control Reporting System

A web-based application designed to digitize daily Quality Control (QC) inspection forms in a manufacturing environment. QC Digital replaces manual paper-based reporting with a centralized digital workflow, allowing operators to record inspection results, continue reports across production shifts, and generate PDF documentation.

## Overview

Traditional QC reporting often relies on handwritten forms, which can make data entry, report continuity between shifts, and documentation less efficient.

QC Digital provides a digital alternative for recording Open Torque inspection data. The application supports multiple production lines, different product types, sequential data entry, role-based access, and shift-based editing restrictions.

## Key Features

- **Digital QC Forms** — Record daily quality inspection results through a web interface.
- **Multi-Shift Workflow** — Allow operators to continue the same production report across Shift 1, Shift 2, and Shift 3.
- **Shift-Based Access Control** — Restrict form editing to the designated shift schedule:
  - Shift 1: 06:00–14:00
  - Shift 2: 14:00–22:00
  - Shift 3: 22:00–06:00
- **Production-Date Validation** — Lock forms that are outside the permitted production date and shift window.
- **Remaining-Time Indicator** — Display the time remaining before the current shift closes.
- **View-Only Mode** — Keep reports accessible outside their editing window while preventing unauthorized changes.
- **Sequential Row Validation** — Require operators to complete inspection rows in order before proceeding to the next row.
- **Product-Specific Validation** — Apply different required fields and measurement standards for TPH and LM products.
- **Retest Support** — Provide additional retest fields for applicable TPH measurements when initial results fall outside the specified standards.
- **PDF Export** — Generate downloadable QC reports for documentation.
- **User Authentication** — Protect application routes with session-based authentication and hashed passwords.
- **Role-Based Access** — Separate administrator functionality from operator access.
- **User Management** — Allow administrators to manage application users.
- **Activity Logging** — Record relevant user activities for traceability.
- **Automatic Google Sheets Setup** — Create missing report sheets using a predefined template.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework and HTTP routing |
| EJS | Server-rendered HTML templates |
| Tailwind CSS | Responsive user interface styling |
| MySQL | User accounts, authentication data, and activity logs |
| Google Sheets API | QC report storage and spreadsheet operations |
| Google Service Account | Server-to-server authentication for Google Sheets access |
| bcrypt | Password hashing |
| Session-based authentication | Maintain authenticated user sessions |
| PDF generation library | Generate downloadable QC reports |
| Railway | Application hosting and deployment |

## System Architecture

QC Digital separates application authentication data from QC inspection records.

```text
                 Operator / Admin
                         |
                         v
                Web Browser (EJS)
                         |
                         v
                Node.js + Express
                  /           \
                 /             \
                v               v
          MySQL Database    Google Sheets API
           /         \           |
          v           v          v
       Users     Activity Logs  QC Reports
                               - Inspection data
                               - Shift records
                               - Production dates
                               - Report sheets
```

### Data Storage

**MySQL** stores application-level data, including:

- User accounts and password hashes
- User roles
- Activity logs

**Google Sheets** stores the QC inspection records. The application communicates with Google Sheets through its API to retrieve data, create report sheets from a template, and save inspection results.

This separation allows authentication and audit-related data to be managed independently from the QC reporting records.

## QC Workflow

1. The user signs in with their account.
2. The user selects a production report based on the relevant production date, production line, product type, and shift.
3. The application checks the shift schedule and determines whether the report can be edited.
4. If the shift is active, the operator enters inspection results in the QC form.
5. The application validates required fields, measurement standards, and sequential row completion.
6. The operator saves the inspection data to Google Sheets.
7. The next shift continues the same report when permitted by the workflow.
8. The report can be exported as a PDF for documentation.

### Shift Schedule

| Shift | Start | End |
|---|---|---|
| Shift 1 | 06:00 | 14:00 |
| Shift 2 | 14:00 | 22:00 |
| Shift 3 | 22:00 | 06:00 (next day) |

Shift 3 follows the original production date even when its operating period crosses midnight. For example, Shift 3 for 17 September runs from 22:00 on 17 September until 06:00 on 18 September.

The application checks editing permissions on the server as well as in the interface, so client-side changes alone cannot bypass the shift restriction.

## Product Validation

QC Digital supports two product types with different inspection requirements.

**TPH**
- AA and OT are the primary required measurements.
- AA* and OT* are additional retest fields when applicable.
- Retest fields do not replace the completion requirements for the primary measurements.

**LM**
- AA, OT, BBT, and N2 are required measurements.

The application also uses sequential row validation to help ensure inspection records are entered in the intended order.

## User Roles

### Administrator
- Access QC reporting functionality.
- Manage user accounts.
- Review activity logs.

### Pengisi (QC Operator)
- Access QC reporting functionality.
- Enter and save inspection results when the selected shift is editable.
- View reports when editing is locked.

Access to shifts is governed by the schedule rather than a separate shift-specific user role.

## Installation and Setup

### Prerequisites

- Node.js and npm
- MySQL
- A Google Cloud project with the Google Sheets API enabled
- A Google service account with access to the target spreadsheet

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using the variables expected by the application.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=qc_digital

SESSION_SECRET=your_secure_session_secret
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

Configure the Google service account credentials using the method implemented in the application. Share the target spreadsheet with the service account's email address.

**Important:** The example above is for local configuration. Production deployments should use the hosting provider's environment-variable settings.

### 4. Set up the database

Create the `qc_digital` database and configure the required tables for user accounts and activity logs according to the application's database schema.

Ensure that administrator and operator accounts are created securely before making the application available to users.

### 5. Run the application

Use the development command defined in `package.json`, for example:

```bash
npm run dev
```

If the project does not define a development script, use its configured start command instead.

## Deployment

The application has been deployed using Railway, with a MySQL database service and environment-based configuration.

When deploying your own instance:

1. Configure the application service and MySQL connection variables.
2. Configure the Google Sheets API credentials and spreadsheet ID.
3. Create the required database tables and initial user accounts.
4. Verify that the application can access the target spreadsheet.
5. Test authentication, QC data saving, PDF export, and shift restrictions.

## Security Considerations

Before deploying or publishing this project:

- Never commit `.env` files, Google service account JSON keys, or production secrets.
- Keep passwords hashed rather than storing them as plain text.
- Use strong session secrets and appropriate session-cookie settings.
- Restrict access to the Google spreadsheet and service account.
- Avoid publishing real production QC data, personal information, or private client details.
- Use environment variables for sensitive configuration.

## Project Highlights

This project demonstrates practical experience in:

- Full-stack web application development
- RESTful routing and server-side rendering
- Relational database integration
- Third-party API integration
- Authentication and role-based authorization
- Business-rule implementation and time-based access control
- Form validation and multi-shift workflows
- PDF report generation
- Cloud deployment and environment configuration

## Author

**Azam**  
Full-Stack Web Development Project

Built to support the digitalization of quality control reporting in a manufacturing workflow.

---

*This project was developed for a specific QC reporting workflow. Configuration, inspection standards, database initialization, and Google Sheets templates may need to be adapted before using it in another environment.*
