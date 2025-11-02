# Binary Hub Backend

Backend API server for Binary Hub built with Node.js, Express, MongoDB, and Passport.js.

## Features

- User authentication with Passport.js (Local Strategy)
- Session-based authentication
- MongoDB database integration
- RESTful API endpoints
- CORS enabled for frontend integration

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/binary_hub
PORT=5000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
FRONTEND_URL=http://localhost:5173,http://localhost:8080
```

**Note**: For production deployment on Render, see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) and [CORS_FIX.md](./CORS_FIX.md) for detailed environment variable setup.

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Sign out user

### Health Check

- `GET /api/health` - Server health check

## Database Schema

### User Model

```javascript
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required, hashed with bcrypt),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Passwords are hashed using bcryptjs (12 rounds)
- Session cookies configured with HttpOnly and Secure flags
- Express sessions for authentication state management
- CORS configured for secure cross-origin requests

## Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── passport.js          # Passport.js configuration
├── models/
│   └── User.js              # User schema and model
├── routes/
│   └── auth.js              # Authentication routes
├── middleware/
│   └── auth.js              # Authentication middleware
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md                # Documentation
```

## Development Notes

- Uses ES6 modules (`"type": "module"` in package.json)
- Session storage in production should use MongoDB Store or Redis
- For production deployments, update `SESSION_SECRET` to a strong random string

