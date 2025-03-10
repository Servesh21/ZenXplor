# File Search Application

This is a universal file search application that indexes and searches for files across different locations, including local storage and cloud services.

## Features
- Index files in a user's `C:/Users` directory.
- Search files efficiently using Elasticsearch.
- Open file locations directly from the app.
- User authentication via JWT.

## Prerequisites
Before running the application, ensure you have the following installed:
- Python 3.8+
- Docker & Docker Compose
- Node.js (only for frontend development)
- Elasticsearch
- PostgreSQL

## Setup Instructions
### 1. Clone the Repository
```sh
git clone https://github.com/Servesh21/file_search1.git
cd file_search1
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add the following environment variables:
```
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/file_search_db

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200

# JWT Authentication
JWT_SECRET_KEY=your_jwt_secret_here
```
Modify the values as per your setup.

### 3. Start the Backend with Docker
To start the application along with Elasticsearch and PostgreSQL, run:
```sh
docker-compose up -d
```
This will launch the required services in the background.

### 4. Run Migrations
To initialize the database, run:
```sh
flask db upgrade
```

### 5. Start the Flask Server
```sh
flask run
```
By default, the server runs at `http://127.0.0.1:5000/`.

### 6. Frontend (Optional)
If you are working on the frontend, navigate to the `frontend` directory and run:
```sh
npm install
npm run dev
```
This starts the frontend development server at `http://localhost:5173/`.

## Usage
- Click **Reindex Files** to index files from the `C:/Users` directory.
- Use the search bar to find files.
- Click on a file to open its location.

## Troubleshooting
- If Elasticsearch is not running, restart it using:
  ```sh
  docker-compose restart elasticsearch
  ```
- If the database connection fails, ensure PostgreSQL is running and check `DATABASE_URL` in `.env`.
- For any other issues, check logs using:
  ```sh
  docker-compose logs -f
  
