const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Google Business Profile API
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
];

// Store user tokens (in production, use a database)
const userTokens = new Map();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GMP Profile Pulse Backend is running' });
});

// Generate Google OAuth URL
app.get('/auth/google/url', (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle OAuth callback (GET request from Google)
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}?error=${error}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens (in production, associate with user ID)
    const userId = 'default_user'; // In production, get from session/JWT
    userTokens.set(userId, tokens);
    
    console.log('OAuth successful, redirecting to frontend with tokens');
    
    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}?auth=success&access_token=${tokens.access_token}`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

// Handle OAuth callback (POST request for API calls)
app.post('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens (in production, associate with user ID)
    const userId = 'default_user'; // In production, get from session/JWT
    userTokens.set(userId, tokens);
    
    res.json({ 
      message: 'Authentication successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get business accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    // Use Google My Business API (legacy) or Business Profile API
    const response = await fetch('https://businessprofile.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get locations for an account
app.get('/api/accounts/:accountId/locations', async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    const response = await fetch(
      `https://businessprofile.googleapis.com/v1/accounts/${accountId}/locations?readMask=name,displayName,address,phoneNumbers,websiteUri,categories`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create a post for a location
app.post('/api/locations/:locationId/posts', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { summary, topicType = 'STANDARD', callToAction } = req.body;
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!summary) {
      return res.status(400).json({ error: 'Post summary is required' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    const postData = {
      summary,
      languageCode: 'en',
      topicType
    };
    
    if (callToAction) {
      postData.callToAction = callToAction;
    }
    
    const response = await fetch(
      `https://businessprofile.googleapis.com/v1/locations/${locationId}/localPosts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
});

// Get posts for a location
app.get('/api/locations/:locationId/posts', async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    const response = await fetch(
      `https://businessprofile.googleapis.com/v1/locations/${locationId}/localPosts`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get reviews for a location
app.get('/api/locations/:locationId/reviews', async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    const response = await fetch(
      `https://businessprofile.googleapis.com/v1/locations/${locationId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Reply to a review
app.put('/api/locations/:locationId/reviews/:reviewId/reply', async (req, res) => {
  try {
    const { locationId, reviewId } = req.params;
    const { comment } = req.body;
    const userId = 'default_user';
    const tokens = userTokens.get(userId);
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!comment) {
      return res.status(400).json({ error: 'Reply comment is required' });
    }
    
    oauth2Client.setCredentials(tokens);
    
    const response = await fetch(
      `https://businessprofile.googleapis.com/v1/locations/${locationId}/reviews/${reviewId}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ error: 'Failed to reply to review', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GMP Profile Pulse Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;
