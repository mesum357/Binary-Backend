# Cookie Debugging Guide

## Issue: Cookies Not Being Set After Sign-In

If you see empty cookies after sign-in (`[SIGNIN DEBUG] Cookies after request: `), this guide will help debug.

## Important Note: httpOnly Cookies

**`document.cookie` will NOT show httpOnly cookies!**

The session cookie is set with `httpOnly: true`, which means:
- ✅ The cookie IS being set by the server
- ✅ The cookie IS stored by the browser
- ❌ The cookie is NOT visible in `document.cookie` (by design for security)
- ✅ The cookie WILL be sent automatically with requests that have `credentials: 'include'`

## How to Verify Cookies Are Working

### Method 1: Check Network Tab

1. Open Chrome DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Sign in
4. Look for `/api/admin/auth/signin` request:
   - **Response Headers** → Look for `Set-Cookie` header
   - Should see: `Set-Cookie: connect.sid=...; Path=/; HttpOnly; Secure; SameSite=None`

5. After sign-in, look for `/api/enrollments` request:
   - **Request Headers** → Look for `Cookie` header
   - Should see: `Cookie: connect.sid=...`

If you see the cookie in Request Headers of subsequent requests, cookies ARE working!

### Method 2: Check Application Tab

1. Open Chrome DevTools → Application tab
2. Go to **Cookies** → `https://ios-admin-forge.onrender.com`
3. After sign-in, you should see:
   - Name: `connect.sid`
   - Domain: `.onrender.com` or similar
   - Path: `/`
   - HttpOnly: ✓
   - Secure: ✓
   - SameSite: None

### Method 3: Backend Logs

Check backend logs on Render for:
```
[AUTH BACKEND] Admin logged in: { sessionId: '...', ... }
[AUTH MIDDLEWARE] isAdminAuthenticated check: { isAuthenticated: true, ... }
```

If `isAuthenticated: true` in subsequent requests, cookies ARE working!

## Common Issues

### Issue 1: Cookie Not in Network Request Headers

**Symptoms:**
- No `Cookie` header in `/api/enrollments` request
- Backend logs show `cookie: undefined`

**Causes:**
1. **SameSite Restrictions**: Browser blocks cookies with `SameSite: Strict` or `Lax` for cross-origin
   - **Fix**: Ensure `sameSite: 'none'` and `secure: true` in production

2. **Secure Cookie on HTTP**: Cookie requires HTTPS but site is HTTP
   - **Fix**: Ensure both frontend and backend use HTTPS (Render does this automatically)

3. **Domain Mismatch**: Cookie domain doesn't match request domain
   - **Fix**: Don't set `domain` option (let browser handle it)

### Issue 2: Cookie Not in Response Headers

**Symptoms:**
- No `Set-Cookie` header in sign-in response
- Backend logs show no `Set-Cookie` header

**Causes:**
1. **CORS Not Exposing Header**: Browser can't see `Set-Cookie` header
   - **Fix**: Already added `exposedHeaders: ['Set-Cookie']` in CORS config

2. **Session Not Saved**: Session wasn't saved before response sent
   - **Fix**: Already added explicit `req.session.save()` before sending response

### Issue 3: Cookie Blocked by Browser

**Symptoms:**
- `Set-Cookie` in response but not stored in Application tab
- Browser console warnings about cookie

**Causes:**
1. **Third-Party Cookie Blocking**: Browser blocks third-party cookies
   - **Fix**: User needs to allow third-party cookies in browser settings
   - **Note**: This is a browser privacy feature that may block cross-origin cookies

2. **SameSite=None Without Secure**: Cookie requires `secure: true` with `sameSite: 'none'`
   - **Fix**: Ensure `secure: true` in production

## Testing Steps

1. **Sign In**:
   - Open Network tab
   - Sign in
   - Check `/api/admin/auth/signin` response for `Set-Cookie` header

2. **Check Cookie Storage**:
   - Open Application tab → Cookies
   - Verify `connect.sid` exists

3. **Make Authenticated Request**:
   - Open Network tab
   - Navigate to dashboard (triggers `/api/enrollments`)
   - Check request headers for `Cookie` header

4. **Check Backend Logs**:
   - Look for `[AUTH MIDDLEWARE] isAdminAuthenticated check:`
   - Should show `isAuthenticated: true` if cookie is working

## Expected Behavior

### Success Indicators:
- ✅ `Set-Cookie` header in sign-in response
- ✅ Cookie appears in Application → Cookies tab
- ✅ `Cookie` header in subsequent API requests
- ✅ Backend logs show `isAuthenticated: true`
- ✅ API requests return 200 (not 401)

### Failure Indicators:
- ❌ No `Set-Cookie` header in sign-in response
- ❌ Cookie not in Application → Cookies tab
- ❌ No `Cookie` header in subsequent requests
- ❌ Backend logs show `isAuthenticated: false`
- ❌ API requests return 401 Unauthorized

## Browser Settings (If Needed)

If cookies are still blocked, users may need to:

### Chrome:
1. Settings → Privacy and Security → Cookies and other site data
2. Select "Allow all cookies" or "Block third-party cookies in Incognito"
3. For specific sites: Add `https://binary-backend.onrender.com` to allowed sites

### Firefox:
1. Settings → Privacy & Security → Cookies and Site Data
2. Select "Accept cookies from websites"
3. Uncheck "Delete cookies and site data when Firefox is closed"

### Safari:
1. Preferences → Privacy
2. Uncheck "Prevent cross-site tracking"
3. Select "Allow all cookies"

## Quick Verification Command

After sign-in, in browser console, run:
```javascript
// This won't show httpOnly cookies, but will show if ANY cookies exist
console.log('All cookies:', document.cookie);

// Check in Application tab instead
// DevTools → Application → Cookies → https://ios-admin-forge.onrender.com
```

