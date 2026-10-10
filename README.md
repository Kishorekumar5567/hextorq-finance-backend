# hextorq-finance-backend

Backend API service for the Revenue & Cost Tracker application built with Node.js, Express, and JSON persistence.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
A `.env` file is included with default configuration:
```env
PORT=8000
```

### 3. Run the Development Server
```bash
npm run dev
```

The API will start at:
```
http://localhost:8000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status and route guide |
| `GET` | `/tracks` | Fetch all revenue & cost records |
| `GET` | `/tracks?search=term` | Search records by description, remarks, or type |
| `GET` | `/tracks/:id` | Fetch a single record by ID |
| `POST` | `/tracks` | Create a new record |
| `PUT` | `/tracks/:id` | Update an existing record |
| `DELETE` | `/tracks/:id` | Delete a record and return updated list |
| `GET` | `/summary` | Get credit total, debit total, and net balance |

### Sample Track Object
```json
{
  "id": 1,
  "date": "2026-03-01",
  "description": "Client Project - Phase 1",
  "amount": 400000,
  "type": "Credit",
  "remarks": "Initial milestone payment"
}
```
