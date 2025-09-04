# SyncUp Troubleshooting Guide

## Issues Fixed

### 1. Like State Persistence Between Matches
**Problem**: When liking one match, the like state was being reflected on the next match.

**Solution**: 
- Updated ProfileCard key to include like state: `profile-${currentProfile.id}-${currentMatchIndex}-${currentProfileLikeState}-${currentProfileConnectionState}`
- Added computed state variables to force re-renders when like state changes
- Each match now maintains its own independent like/connection state

### 2. Homepage Not Loading
**Problem**: Homepage wasn't loading properly.

**Solution**:
- Added `/login` route as an alias for the homepage
- Added backend connectivity check before OAuth redirects
- Added proper error handling for backend connection issues

### 3. LinkedIn Login Issues
**Problem**: LinkedIn login wasn't working properly.

**Solution**:
- Added debugging logs to LinkedIn OAuth flow
- Added backend connectivity check
- Created startup scripts for backend server

## How to Start the Application

### 1. Start Backend Server
**Option A - Using PowerShell:**
```powershell
.\start-backend.ps1
```

**Option B - Using Command Prompt:**
```cmd
start-backend.bat
```

**Option C - Manual:**
```bash
cd backend
npm install
npm start
```

### 2. Start Frontend
```bash
npm install
npm run dev
```

## Backend API Endpoints

- **Health Check**: `http://localhost:3001/health`
- **API Status**: `http://localhost:3001/`
- **GitHub OAuth**: `http://localhost:3001/auth/github`
- **Google OAuth**: `http://localhost:3001/auth/google`
- **LinkedIn OAuth**: `http://localhost:3001/auth/linkedin`

## LinkedIn OAuth Configuration

The LinkedIn OAuth is configured with test credentials. For production:

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Update the credentials in `backend/config/passport.js`:
   ```javascript
   clientID: 'YOUR_LINKEDIN_CLIENT_ID',
   clientSecret: 'YOUR_LINKEDIN_CLIENT_SECRET',
   ```
4. Set the redirect URL to: `http://localhost:3001/auth/linkedin/callback`

## Testing the Fixes

1. **Like State Test**:
   - Like match 1
   - Press Next
   - Verify match 2 shows "Like" button (not "Liked!")
   - Like match 2
   - Go back to match 1 - should still show "Liked!"
   - Go to match 2 - should show "Liked!"

2. **Homepage Test**:
   - Visit `http://localhost:5173/`
   - Should show login screen
   - All login buttons should be properly aligned

3. **LinkedIn Test**:
   - Click "Sign in with LinkedIn"
   - Should redirect to LinkedIn OAuth
   - After authorization, should redirect back to dashboard

## Common Issues

### Backend Not Running
**Error**: "Backend server is not running"
**Solution**: Start the backend server using one of the methods above

### CORS Issues
**Error**: CORS errors in browser console
**Solution**: Backend is configured to allow localhost:5173, 5174, 5175

### LinkedIn OAuth Fails
**Error**: LinkedIn redirect fails
**Solution**: 
- Check LinkedIn app configuration
- Verify redirect URL matches exactly
- Check browser console for detailed error messages

## Debug Information

The application now includes:
- Backend connectivity checks
- OAuth flow debugging logs
- Health check endpoints
- Better error messages

Check the browser console and backend terminal for detailed logs.
