# File Search Application

A web-based application that allows users to search for files efficiently.

## Features

- **Backend**: Implemented using Python (Flask).
- **Frontend**: Developed with React, TypeScript, and Tailwind CSS.
- **Authentication**: Integrated with Clerk for OAuth (Google, Facebook, etc.) and JWT-based authentication.
- **Database**: Uses PostgreSQL or SQLite.
- **Search Functionality**: Indexes files from multiple sources (Google Drive, Gmail, OneDrive, Local Storage).

## Prerequisites

- **Python** (>= 3.8)
- **Node.js & npm** (>= 16.x)
- **PostgreSQL or SQLite** (if applicable)
- **Git** (to clone the repository)

---

## Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Servesh21/file_search1.git
cd file_search1
```

---

### 2️⃣ Backend Setup

1. **Navigate to the backend directory**  

   ```bash
   cd backend
   ```

2. **Create a virtual environment**  

   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```

3. **Install dependencies**  

   ```bash
   pip install -r requirements.txt
   ```

4. **Create and configure the `.env` file**  

   ```bash
   cp .env.example .env
   ```

   - Open `.env` and set values for:  
     - `DATABASE_URL` (e.g., `postgresql://user:password@localhost/dbname`)
     - `CLERK_SECRET_KEY` (for authentication)
     - `GOOGLE_DRIVE_API_KEY` (if integrated)

5. **Run database migrations**  

   ```bash
   flask db upgrade
   ```

6. **Start the backend server**  

   ```bash
   python app.py
   ```

---

### 3️⃣ Frontend Setup

1. **Navigate to the frontend directory**  

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**  

   ```bash
   npm install
   ```

3. **Create the `.env` file**  

   ```bash
   cp .env.example .env
   ```

   - Open `.env` and configure the API URL (`VITE_BACKEND_URL=http://localhost:5000`).  

4. **Start the development server**  

   ```bash
   npm run dev
   ```

---

## Usage

- Open `http://localhost:3000` in your browser.
- Sign in using OAuth or JWT authentication.
- Use the search bar to locate files from different sources.

---

## Database Migrations

If you make changes to the database models, run:

```bash
flask db migrate -m "Describe changes"
flask db upgrade
```

---

## Troubleshooting

- **Missing dependencies?** Run `pip install -r requirements.txt` or `npm install`.
- **Database issues?** Check your `.env` file and verify `DATABASE_URL`.
- **CORS errors?** Add frontend URL to Flask CORS config.

---

## Contributing

We welcome contributions! Fork the repo, make changes, and submit a pull request.

---



