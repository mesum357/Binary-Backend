# Backend Environment Variables

This document lists all environment variables required for the Binary Hub Backend.

## Required Environment Variables

### `MONGODB_URI`
- **Description**: MongoDB connection string
- **Format**: `mongodb://username:password@host:port/database` or MongoDB Atlas connection string
- **Example (Local)**: `mongodb://localhost:27017/binary_hub`
- **Example (Atlas)**: `mongodb+srv://username:password@cluster.mongodb.net/binary_hub?retryWrites=true&w=majority`
- **Required**: Yes

### `FRONTEND_URL`
- **Description**: Comma-separated list of allowed frontend origins for CORS
- **Format**: Comma-separated URLs (no trailing slashes)
- **Example (Local)**: `http://localhost:5173,http://localhost:8080`
- **Example (Production)**: `https://binary-nexus-studio.onrender.com,https://binary-nexus-admin-panel.onrender.com`
- **Required**: Yes (especially in production)
- **Note**: Must include both frontend and admin panel URLs

### `SESSION_SECRET`
- **Description**: Secret key for encrypting sessions
- **Format**: Any long, random string
- **Example**: `your-super-secret-session-key-change-this-in-production`
- **Required**: Yes
- **Security**: Use a strong, random secret in production

### `PORT`
- **Description**: Port number for the server
- **Format**: Number
- **Default**: `5000`
- **Required**: No (uses default if not set)
- **Note**: Render automatically sets this, so you usually don't need to set it

### `NODE_ENV`
- **Description**: Environment mode
- **Format**: `development` or `production`
- **Default**: `development`
- **Required**: No
- **Note**: Render automatically sets this to `production`

## Render Deployment Setup

### In Render Dashboard:

1. Go to your backend service settings
2. Click on **"Environment"** tab
3. Add the following environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | Your MongoDB connection string | Required |
| `FRONTEND_URL` | `https://binary-nexus-studio.onrender.com,https://binary-nexus-admin-panel.onrender.com` | Replace with your actual URLs |
| `SESSION_SECRET` | A strong random string | Generate a secure secret |
| `NODE_ENV` | `production` | Usually auto-set by Render |

### Example `.env` file for local development:

```env
MONGODB_URI=mongodb://localhost:27017/binary_hub
FRONTEND_URL=http://localhost:5173,http://localhost:8080
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### Example Render Environment Variables:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/binary_hub?retryWrites=true&w=majority
FRONTEND_URL=https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
SESSION_SECRET=generate-a-strong-random-secret-here
NODE_ENV=production
```

**Note**: Replace `ios-admin-forge.onrender.com` with your actual admin panel URL if different.

## Generating a Secure Session Secret

You can generate a secure session secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator: https://www.random.org/strings/

## Important Notes

1. **FRONTEND_URL Format**:
   - Use comma-separated list (no spaces or with spaces after comma)
   - NO trailing slashes
   - Use HTTPS for production URLs
   - Must include BOTH frontend and admin panel URLs

2. **Security**:
   - Never commit `.env` files to Git
   - Use strong, random secrets in production
   - Rotate secrets periodically

3. **CORS Configuration**:
   - The backend will allow requests only from URLs listed in `FRONTEND_URL`
   - Make sure both your frontend and admin panel URLs are included
   - Check backend logs if CORS errors occur

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` includes your frontend domain
- Check that URLs in `FRONTEND_URL` match exactly (including protocol https://)
- Ensure no trailing slashes in URLs
- Check backend logs for CORS warnings

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (if using Atlas)
- Ensure database user has proper permissions

### Session Issues
- Verify `SESSION_SECRET` is set and is a strong random string
- Check that cookies are being set properly
- Verify `credentials: true` in frontend API calls

