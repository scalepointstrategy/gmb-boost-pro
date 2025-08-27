import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useGoogleBusinessProfile } from '@/hooks/useGoogleBusinessProfile';

const GoogleOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useGoogleBusinessProfile();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const authSuccess = searchParams.get('auth');
      const accessToken = searchParams.get('access_token');
      const error = searchParams.get('error');
      const code = searchParams.get('code');

      if (error) {
        setStatus('error');
        setErrorMessage(error === 'access_denied' ? 'Access denied by user' : `Error: ${error}`);
        return;
      }

      // Handle backend redirect with tokens
      if (authSuccess === 'success' && accessToken) {
        try {
          // Store the token from the backend callback
          localStorage.setItem('google_business_tokens', JSON.stringify({
            access_token: accessToken,
            token_type: 'Bearer'
          }));
          
          console.log('OAuth successful, tokens stored from backend');
          setStatus('success');
          
          // Redirect to settings
          setTimeout(() => {
            navigate('/dashboard/settings');
          }, 2000);
          return;
        } catch (error) {
          setStatus('error');
          setErrorMessage('Failed to store authentication tokens');
          return;
        }
      }

      // Fallback: handle direct code exchange (for backwards compatibility)
      if (code) {
        try {
          await handleOAuthCallback(code);
          setStatus('success');
          
          // Close popup if this is running in a popup
          if (window.opener) {
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            // Redirect to settings if not in popup
            setTimeout(() => {
              navigate('/dashboard/settings');
            }, 2000);
          }
        } catch (error) {
          setStatus('error');
          setErrorMessage('Failed to complete authentication');
        }
        return;
      }

      // No valid parameters
      setStatus('error');
      setErrorMessage('No valid authentication parameters received');
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  const handleRetry = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/dashboard/settings');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <RefreshCw className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            
            {status === 'processing' && 'Connecting...'}
            {status === 'success' && 'Connected Successfully!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          
          <CardDescription>
            {status === 'processing' && 'Setting up your Google Business Profile connection...'}
            {status === 'success' && 'Your Google Business Profile has been connected successfully.'}
            {status === 'error' && 'There was an issue connecting your Google Business Profile.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="animate-pulse bg-primary/20 h-2 w-32 rounded"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please wait while we complete the setup...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  Your Google Business Profile is now connected! You can now manage your business listings, posts, and reviews.
                </p>
              </div>
              {window.opener ? (
                <p className="text-sm text-muted-foreground">
                  This window will close automatically...
                </p>
              ) : (
                <Button onClick={() => navigate('/dashboard/settings')}>
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  {errorMessage}
                </p>
              </div>
              <Button onClick={handleRetry} variant="outline">
                {window.opener ? 'Close Window' : 'Back to Settings'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthCallback;

