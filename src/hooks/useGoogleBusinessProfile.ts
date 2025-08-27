import { useState, useEffect, useCallback } from 'react';
import { googleBusinessProfileService, BusinessAccount, BusinessLocation } from '@/lib/googleBusinessProfile';
import { useToast } from '@/hooks/use-toast';

interface UseGoogleBusinessProfileReturn {
  isConnected: boolean;
  isLoading: boolean;
  accounts: BusinessAccount[];
  selectedAccount: BusinessAccount | null;
  selectedLocation: BusinessLocation | null;
  error: string | null;
  connectGoogleBusiness: () => void;
  disconnectGoogleBusiness: () => Promise<void>;
  selectAccount: (account: BusinessAccount) => void;
  selectLocation: (location: BusinessLocation) => void;
  refreshAccounts: () => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;
}

export const useGoogleBusinessProfile = (): UseGoogleBusinessProfileReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BusinessAccount | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<BusinessLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize and check existing connection
  useEffect(() => {
    const initializeConnection = async () => {
      setIsLoading(true);
      try {
        const hasValidTokens = await googleBusinessProfileService.loadStoredTokens();
        setIsConnected(hasValidTokens);
        
        if (hasValidTokens) {
          await loadBusinessAccounts();
        }
      } catch (error) {
        console.error('Error initializing Google Business Profile connection:', error);
        setError('Failed to initialize connection');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();
  }, []);

  // Load business accounts
  const loadBusinessAccounts = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      setIsLoading(true);
      const businessAccounts = await googleBusinessProfileService.getBusinessAccounts();
      setAccounts(businessAccounts);
      
      // Auto-select first account if only one exists
      if (businessAccounts.length === 1) {
        setSelectedAccount(businessAccounts[0]);
        
        // Auto-select first location if only one exists
        if (businessAccounts[0].locations.length === 1) {
          setSelectedLocation(businessAccounts[0].locations[0]);
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading business accounts:', error);
      setError('Failed to load business accounts');
      toast({
        title: "Error loading accounts",
        description: "Failed to load your Google Business Profile accounts. Please try reconnecting.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  // Connect to Google Business Profile
  const connectGoogleBusiness = useCallback(async () => {
    try {
      const authUrl = await googleBusinessProfileService.generateAuthUrl();
      
      // Redirect to auth URL instead of popup (since backend handles the callback)
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error connecting to Google Business Profile:', error);
      setError('Failed to connect');
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Business Profile. Please try again.",
        variant: "destructive",
      });
    }
  }, [loadBusinessAccounts, toast]);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      await googleBusinessProfileService.handleOAuthCallback(code);
      setIsConnected(true);
      await loadBusinessAccounts();
      
      toast({
        title: "Connected successfully!",
        description: "Your Google Business Profile has been connected.",
      });
      
      // Close the popup window if it exists
      if (window.opener) {
        window.close();
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      setError('Failed to complete connection');
      toast({
        title: "Connection failed",
        description: "Failed to complete the connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadBusinessAccounts, toast]);

  // Disconnect from Google Business Profile
  const disconnectGoogleBusiness = useCallback(async () => {
    try {
      setIsLoading(true);
      await googleBusinessProfileService.disconnect();
      setIsConnected(false);
      setAccounts([]);
      setSelectedAccount(null);
      setSelectedLocation(null);
      setError(null);
      
      toast({
        title: "Disconnected",
        description: "Your Google Business Profile has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting Google Business Profile:', error);
      toast({
        title: "Disconnection failed",
        description: "Failed to disconnect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Select an account
  const selectAccount = useCallback((account: BusinessAccount) => {
    setSelectedAccount(account);
    setSelectedLocation(null); // Reset location selection
  }, []);

  // Select a location
  const selectLocation = useCallback((location: BusinessLocation) => {
    setSelectedLocation(location);
  }, []);

  // Refresh accounts
  const refreshAccounts = useCallback(async () => {
    if (isConnected) {
      await loadBusinessAccounts();
    }
  }, [isConnected, loadBusinessAccounts]);

  return {
    isConnected,
    isLoading,
    accounts,
    selectedAccount,
    selectedLocation,
    error,
    connectGoogleBusiness,
    disconnectGoogleBusiness,
    selectAccount,
    selectLocation,
    refreshAccounts,
    handleOAuthCallback,
  };
};

