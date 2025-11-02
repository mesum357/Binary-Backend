# Quick CORS Fix - Current Deployment

## Your Current URLs:
- **Frontend**: `https://binary-nexus-studio.onrender.com`
- **Admin Panel**: `https://ios-admin-forge.onrender.com`
- **Backend**: `https://binary-backend.onrender.com`

## Fix Steps (2 minutes):

### 1. Go to Render Dashboard
   - Navigate to your **backend service** (`binary-backend`)
   - Click on **"Environment"** tab

### 2. Add/Update Environment Variable
   - Look for `FRONTEND_URL` variable
   - If it exists, click **Edit**
   - If it doesn't exist, click **"Add Environment Variable"**

### 3. Set the Value
   - **Key**: `FRONTEND_URL`
   - **Value** (copy this exactly):
     ```
     https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
     ```

### 4. Save and Wait
   - Click **"Save Changes"**
   - Render will automatically redeploy
   - Wait 2-3 minutes for deployment to complete

### 5. Test
   - Go to `https://ios-admin-forge.onrender.com`
   - Try to sign in
   - CORS errors should be gone!

## Verification

After deployment, check backend logs:
1. Go to backend service → **"Logs"** tab
2. Look for: `Allowed CORS origins: [...]`
3. You should see both URLs in the list:
   - `https://binary-nexus-studio.onrender.com`
   - `https://ios-admin-forge.onrender.com`

If you see both URLs, CORS is configured correctly!

## Troubleshooting

### Still Getting CORS Errors?

1. **Verify the Environment Variable**:
   - Go back to Environment tab
   - Make sure `FRONTEND_URL` value is exactly:
     ```
     https://binary-nexus-studio.onrender.com,https://ios-admin-forge.onrender.com
     ```
   - No extra spaces
   - No trailing slashes
   - Both URLs use `https://`

2. **Check Deployment Completed**:
   - Wait for backend to finish deploying (green checkmark)
   - Check logs for any errors

3. **Clear Browser Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache in browser settings

4. **Check Backend Logs**:
   - Look for "Allowed CORS origins" message
   - Verify both URLs are listed
   - Look for any CORS warnings

## Need Help?

If still not working after following these steps:
1. Check backend logs for errors
2. Verify environment variable is saved correctly
3. Ensure backend deployment completed successfully
4. Try the test endpoint: `https://binary-backend.onrender.com/api/health`

