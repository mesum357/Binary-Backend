# CORS Fix for Render Deployment

## Problem

You're seeing CORS errors like:
```
Access to fetch at 'https://binary-backend.onrender.com/api/auth/me' 
from origin 'https://binary-nexus-studio.onrender.com' has been blocked 
by CORS policy
```

This happens because the backend doesn't know it should allow requests from your frontend domain.

## Solution

### Step 1: Set Environment Variable in Render

1. Go to your **backend service** in Render Dashboard (not the frontend)
2. Navigate to **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add the following:

**Variable Name**: `FRONTEND_URL`

**Variable Value**: 
```
https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
```

⚠️ **Important**: 
- Replace `binary-nexus-studio.onrender.com` with your actual frontend URL
- Replace `ios-admin-forge.onrender.com` with your actual admin panel URL (currently: `https://ios-admin-forge.onrender.com`)
- Use comma-separated list (no spaces after comma)
- NO trailing slashes
- Both URLs must use HTTPS

### Step 2: Redeploy Backend

After adding the environment variable:

1. Click **"Save Changes"**
2. Render will automatically trigger a redeploy
3. Wait for the deployment to complete

### Step 3: Verify

Once redeployed:
1. Refresh your frontend
2. Try logging in again
3. Check browser console - CORS errors should be gone

## Example Configuration

Based on your current deployment:
- Frontend: `https://binary-nexus-studio.onrender.com`
- Admin Panel: `https://ios-admin-forge.onrender.com`

Then `FRONTEND_URL` should be:
```
https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
```

**Copy this exact value** into the Render environment variable:
```
https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
```

## Troubleshooting

### Still Getting CORS Errors?

1. **Check Backend Logs**:
   - Go to Render Dashboard → Your Backend Service → "Logs"
   - Look for: `Allowed CORS origins: [array]`
   - Verify your frontend URL is in the list

2. **Verify Environment Variable**:
   - Go to backend Environment tab
   - Ensure `FRONTEND_URL` is exactly as shown above
   - No extra spaces or trailing slashes

3. **Check URLs Match Exactly**:
   - Your frontend URL in `FRONTEND_URL` must match exactly what's in the browser
   - Including `https://` protocol
   - No trailing slashes

4. **Clear Browser Cache**:
   - Sometimes cached responses cause issues
   - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Quick Test

To test if CORS is working, open browser console and run:

```javascript
fetch('https://binary-backend.onrender.com/api/health', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

If you see `{success: true, message: "Server is running"}`, CORS is working!

## Additional Notes

- The backend now logs blocked origins for easier debugging
- Check backend logs if you continue to have issues
- Make sure both frontend AND admin panel URLs are in the list
- Backend automatically redeploys when environment variables change

