File Search Application
Overview
The File Search Application is a powerful tool that allows users to index and search for files within their system. Built with Flask for the backend and React for the frontend, it integrates with Elasticsearch to provide fast and efficient search capabilities.
Features

Index User Directory (C:/Users)
Search Files with Elasticsearch
View File Paths
Open Files in File Explorer
JWT-based Authentication

Tech Stack
Backend:

Flask
Flask-JWT-Extended (for authentication)
SQLAlchemy (for database operations)
Elasticsearch (for search indexing)
Docker (for containerization)

Frontend:

React (Vite-based setup)
Axios (for API calls)
Tailwind CSS (for styling)

Installation & Setup
Prerequisites:

Docker & Docker Compose
Python 3.x
Node.js (if making frontend changes)

Clone the Repository
git clone https://github.com/Servesh21/file_search1.git
cd file_search1

Backend Setup (Flask API)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
flask run

Frontend Setup (React App)
cd frontend
npm install
npm run dev

Running with Docker
To start both the backend and Elasticsearch using Docker:
docker-compose up -d

To stop the containers:
docker-compose down

API Endpoints
Index Files
POST /search/index-files
Headers: Authorization: Bearer <token>

Check Indexing Status
GET /search/index-status
Headers: Authorization: Bearer <token>

Search Files
GET /search/search-files?q=<query>
Headers: Authorization: Bearer <token>

Open File Location
POST /search/open-file
Headers: Authorization: Bearer <token>
Body: { "filepath": "C:/path/to/file" }

Contributing
Feel free to contribute by submitting issues or pull requests. Make sure to follow best coding practices!
License
This project is open-source and available under the MIT License.
