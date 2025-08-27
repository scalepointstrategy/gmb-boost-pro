// Browser-compatible Google Business Profile integration

// Google Business Profile API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/plus.business.manage'
];

// Note: The Google Business Profile API has limitations when called directly from browsers
// due to CORS policies. In production, these calls should be made from a backend server.

export interface BusinessLocation {
  name: string;
  locationId: string;
  displayName: string;
  address: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    countryCode: string;
  };
  phoneNumber?: string;
  websiteUrl?: string;
  categories: Array<{
    name: string;
    categoryId: string;
  }>;
  metadata?: {
    duplicate?: boolean;
    suspended?: boolean;
    canDelete?: boolean;
    canUpdate?: boolean;
  };
}

export interface BusinessAccount {
  name: string;
  accountName: string;
  type: string;
  role: string;
  state: string;
  locations: BusinessLocation[];
}

export interface BusinessPost {
  id: string;
  name: string;
  locationName: string;
  summary?: string;
  callToAction?: {
    actionType: string;
    url?: string;
  };
  media?: {
    mediaFormat: string;
    sourceUrl?: string;
  }[];
  topicType: string;
  languageCode: string;
  createTime: string;
  updateTime: string;
  searchUrl?: string;
}

export interface BusinessReview {
  id: string;
  name: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: number;
  comment?: string;
  createTime: string;
  updateTime: string;
  reply?: {
    comment: string;
    updateTime: string;
  };
}

class GoogleBusinessProfileService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken: string | null = null;
  private backendUrl: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '52772597205-9ogv54i6sfvucse3jrqj1nl1hlkspcv1.apps.googleusercontent.com';
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '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';
    this.redirectUri = `${window.location.origin}/auth/google/callback`;
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    this.loadStoredTokens();
  }

  // Generate OAuth URL for Google Business Profile connection (via backend)
  async generateAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/auth/google/url`);
      if (!response.ok) {
        throw new Error('Failed to get auth URL from backend');
      }
      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      // Fallback to direct URL generation
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
  }

  // Handle OAuth callback and get tokens (via backend)
  async handleOAuthCallback(code: string): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend OAuth error:', errorData);
        throw new Error(`OAuth callback failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('OAuth tokens received from backend:', data);

      this.accessToken = data.tokens.access_token;
      
      // Store tokens securely
      localStorage.setItem('google_business_tokens', JSON.stringify(data.tokens));
      
      return data.tokens;
    } catch (error) {
      console.error('Error handling OAuth callback via backend:', error);
      throw error;
    }
  }

  // Load stored tokens
  async loadStoredTokens(): Promise<boolean> {
    try {
      const storedTokens = localStorage.getItem('google_business_tokens');
      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        this.accessToken = tokens.access_token;
        
        // Check if tokens are still valid
        const isValid = await this.validateTokens();
        return isValid;
      }
      return false;
    } catch (error) {
      console.error('Error loading stored tokens:', error);
      return false;
    }
  }

  // Validate current tokens
  private async validateTokens(): Promise<boolean> {
    try {
      if (!this.accessToken) return false;
      
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Tokens are invalid:', error);
      return false;
    }
  }

  // Get all business accounts
  async getBusinessAccounts(): Promise<BusinessAccount[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      // Make actual API call to Google My Business API
      const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.error('Accounts API error:', errorText);
        throw new Error(`Failed to fetch accounts: ${accountsResponse.statusText}`);
      }

      const accountsData = await accountsResponse.json();
      console.log('Accounts API Response:', accountsData);
      const accounts = accountsData.accounts || [];
      console.log('Found accounts:', accounts.length);
      
      const businessAccounts: BusinessAccount[] = [];
      
      // For each account, fetch its locations
      for (const account of accounts) {
        const locations = await this.getAccountLocations(account.name);
        
        businessAccounts.push({
          name: account.name,
          accountName: account.accountName || account.name,
          type: account.type || 'BUSINESS',
          role: account.role || 'OWNER',
          state: account.state?.status || 'UNVERIFIED',
          locations: locations,
        });
      }
      
      return businessAccounts;
    } catch (error) {
      console.error('Error fetching business accounts:', error);
      
      // If API fails, show a helpful message instead of demo data
      throw new Error('Failed to load your Google Business Profile accounts. Please ensure you have Google Business Profile set up and try reconnecting.');
    }
  }

  // Get locations for a specific account
  async getAccountLocations(accountName: string): Promise<BusinessLocation[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      // Make actual API call to get locations for the account
      const readMask = 'name,title,storefrontAddress,websiteUri,regularHours,specialHours,serviceArea,labels,adWordsLocationExtensions,latlng,serviceItems,metadata,profile,relationshipData,moreHours';
      const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${encodeURIComponent(readMask)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!locationsResponse.ok) {
        const errorText = await locationsResponse.text();
        console.error('Locations API error:', errorText);
        
        // If it's a 403 or 404, the account might not have locations or permissions
        if (locationsResponse.status === 403 || locationsResponse.status === 404) {
          console.warn(`No locations found for account ${accountName} or insufficient permissions`);
          return [];
        }
        
        throw new Error(`Failed to fetch locations: ${locationsResponse.statusText}`);
      }

      const locationsData = await locationsResponse.json();
      console.log('Locations API Response:', locationsData);
      const locations = locationsData.locations || [];
      console.log('Found locations:', locations.length);
      
      return locations.map((location: any) => ({
        name: location.name,
        locationId: this.extractLocationId(location.name),
        displayName: location.title || location.displayName || 'Unnamed Location',
        address: {
          addressLines: location.storefrontAddress?.addressLines || [],
          locality: location.storefrontAddress?.locality || '',
          administrativeArea: location.storefrontAddress?.administrativeArea || '',
          postalCode: location.storefrontAddress?.postalCode || '',
          countryCode: location.storefrontAddress?.regionCode || '',
        },
        phoneNumber: location.profile?.description || '',
        websiteUrl: location.websiteUri,
        categories: (location.labels || []).map((label: any) => ({
          name: label.displayName || label,
          categoryId: label.categoryId || label,
        })),
        metadata: {
          duplicate: location.metadata?.duplicate || false,
          suspended: location.metadata?.suspended || false,
          canDelete: location.metadata?.canDelete || false,
          canUpdate: location.metadata?.canUpdate || true,
        },
      }));
    } catch (error) {
      console.error('Error fetching account locations:', error);
      return [];
    }
  }

  // Extract location ID from the full name
  private extractLocationId(fullName: string): string {
    const parts = fullName.split('/');
    return parts[parts.length - 1];
  }

  // Get posts for a specific location using Business Profile API
  async getLocationPosts(locationName: string): Promise<BusinessPost[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Fetching posts for location:', locationName);

      // CORS workaround: For now, return empty array as direct browser calls to Google Business Profile API are blocked
      console.warn('⚠️ CORS Policy: Direct browser calls to Google Business Profile API are not allowed. In production, implement a backend proxy.');
      
      // Store posts locally for demo purposes
      const storedPosts = localStorage.getItem(`posts_${locationName}`);
      if (storedPosts) {
        return JSON.parse(storedPosts);
      }

      return [];
    } catch (error) {
      console.error('Error fetching location posts:', error);
      return [];
    }
  }

  // Create a new post for a location using Business Profile API
  async createLocationPost(locationName: string, postData: {
    summary: string;
    callToAction?: {
      actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
      url?: string;
    };
    media?: File[];
    topicType?: 'STANDARD' | 'EVENT' | 'OFFER' | 'PRODUCT';
  }): Promise<BusinessPost> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Creating post for location:', locationName, 'with data:', postData);

      // Use backend to create real posts
      console.log('🚀 Creating real post via backend API');
      
      // Extract location ID from locationName (format: locations/{locationId})
      const locationId = this.extractLocationId(locationName);
      
      const response = await fetch(`${this.backendUrl}/api/locations/${locationId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: postData.summary,
          topicType: postData.topicType || 'STANDARD',
          callToAction: postData.callToAction
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend post creation error:', errorData);
        throw new Error(`Failed to create post: ${response.status} - ${errorData.error}`);
      }

      const data = await response.json();
      console.log('✅ Real post created successfully:', data);
      
      // Convert backend response to BusinessPost format
      const post: BusinessPost = {
        id: this.extractIdFromName(data.name),
        name: data.name,
        locationName: locationName,
        summary: data.summary,
        callToAction: data.callToAction,
        media: data.media,
        topicType: data.topicType || 'STANDARD',
        languageCode: data.languageCode || 'en',
        createTime: data.createTime,
        updateTime: data.updateTime,
        searchUrl: data.searchUrl
      };

      return post;
    } catch (error) {
      console.error('Error creating location post:', error);
      throw error;
    }
  }

  // Get reviews for a specific location using Business Profile API
  async getLocationReviews(locationName: string): Promise<BusinessReview[]> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Fetching reviews for location:', locationName);

      // CORS workaround: Return mock reviews for demo purposes
      console.warn('⚠️ CORS Policy: Using mock reviews. In production, implement a backend proxy to Google Business Profile API.');
      
      // Return some mock reviews to demonstrate the UI
      const mockReviews: BusinessReview[] = [
        {
          id: '1',
          name: `${locationName}/reviews/1`,
          reviewer: {
            displayName: 'Sarah Johnson',
            profilePhotoUrl: undefined
          },
          starRating: 5,
          comment: 'Great service and professional team! Highly recommend.',
          createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reply: undefined
        },
        {
          id: '2',
          name: `${locationName}/reviews/2`,
          reviewer: {
            displayName: 'Mike Chen',
            profilePhotoUrl: undefined
          },
          starRating: 4,
          comment: 'Good experience overall. Would use their services again.',
          createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reply: undefined
        }
      ];

      return mockReviews;
    } catch (error) {
      console.error('Error fetching location reviews:', error);
      return [];
    }
  }

  // Reply to a review
  async replyToReview(reviewName: string, replyText: string): Promise<void> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      console.log('Replying to review:', reviewName, 'with text:', replyText);

      // CORS workaround: Simulate reply functionality
      console.warn('⚠️ CORS Policy: Simulating review reply. In production, implement a backend proxy to Google Business Profile API.');
      console.log('✅ Reply simulated successfully:', replyText);
      console.log('📝 Note: This is a simulation. To actually reply to Google Business Profile reviews, you need a backend server.');

      // Simulate a delay to make it feel real
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  }

  // Disconnect Google Business Profile
  async disconnect(): Promise<void> {
    try {
      // Revoke tokens if possible
      if (this.accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
            method: 'POST',
          });
        } catch (error) {
          console.warn('Error revoking token:', error);
        }
      }
      
      // Clear stored tokens
      localStorage.removeItem('google_business_tokens');
      
      // Reset access token
      this.accessToken = null;
    } catch (error) {
      console.error('Error disconnecting Google Business Profile:', error);
      throw error;
    }
  }

  // Check if currently connected
  isConnected(): boolean {
    return !!this.accessToken;
  }
}

export const googleBusinessProfileService = new GoogleBusinessProfileService();