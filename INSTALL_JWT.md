# Install JWT Package

## Important: Install jsonwebtoken Package

After deploying these changes, you **must** install the `jsonwebtoken` package in the backend:

1. **If deploying to Render:**
   - Render will automatically run `npm install` during deployment
   - The `package.json` has been updated to include `jsonwebtoken`

2. **If testing locally:**
   ```bash
   cd backend
   npm install jsonwebtoken
   ```

3. **Verify installation:**
   - Check that `node_modules/jsonwebtoken` exists
   - The package should be automatically installed by Render

## Environment Variable

The JWT secret uses `JWT_SECRET` or falls back to `SESSION_SECRET`. 

You can optionally add `JWT_SECRET` to your backend environment variables in Render, or it will use `SESSION_SECRET` (which should already be set).

