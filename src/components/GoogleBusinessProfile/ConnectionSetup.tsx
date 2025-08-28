import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Unlink
} from 'lucide-react';
import { useGoogleBusinessProfile } from '@/hooks/useGoogleBusinessProfile';
import { BusinessAccount, BusinessLocation } from '@/lib/googleBusinessProfile';

const ConnectionSetup: React.FC = () => {
  const {
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
  } = useGoogleBusinessProfile();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading Google Business Profile...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Connect Google Business Profile
          </CardTitle>
          <CardDescription>
            Connect your Google Business Profile to manage your business listings, posts, and reviews automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Automatic profile synchronization</li>
              <li>• Real-time post management</li>
              <li>• Review monitoring and responses</li>
              <li>• Multi-location support</li>
              <li>• Analytics and insights</li>
            </ul>
          </div>
          
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => {
              console.log('🔴 DEBUGGING: Connect button clicked!');
              connectGoogleBusiness();
            }}
            className="w-full"
            size="lg"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Connect Google Business Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Google Business Profile</CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAccounts}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectGoogleBusiness}
                disabled={isLoading}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
          <CardDescription>
            Your Google Business Profile is connected and syncing automatically.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* No Accounts Found */}
      {isConnected && accounts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Business Profiles Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any Google Business Profiles associated with your account.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-left">
              <h4 className="font-medium text-blue-900 mb-2">To get started:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Create a Google Business Profile at <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline">business.google.com</a></li>
                <li>• Verify your business location</li>
                <li>• Make sure you're signed in with the correct Google account</li>
                <li>• Ensure you have owner or manager permissions</li>
              </ul>
            </div>
            <Button 
              onClick={refreshAccounts}
              className="mt-4"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Account Selection */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Account</CardTitle>
            <CardDescription>
              Select the Google Business account you want to manage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAccount?.name === account.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => selectAccount(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{account.accountName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.locations.length} location{account.locations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={account.state === 'VERIFIED' ? 'default' : 'secondary'}>
                    {account.role}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Location Selection */}
      {selectedAccount && selectedAccount.locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Location</CardTitle>
            <CardDescription>
              Select the business location you want to manage from {selectedAccount.accountName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedAccount.locations.map((location) => (
              <div
                key={location.name}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLocation?.name === location.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => selectLocation(location)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{location.displayName}</h4>
                      
                      {/* Address */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {location.address.addressLines.join(', ')}, {location.address.locality}
                        </span>
                      </div>
                      
                      {/* Phone */}
                      {location.phoneNumber && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{location.phoneNumber}</span>
                        </div>
                      )}
                      
                      {/* Website */}
                      {location.websiteUrl && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-xs">{location.websiteUrl}</span>
                        </div>
                      )}
                      
                      {/* Categories */}
                      {location.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {location.categories.slice(0, 2).map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                          {location.categories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{location.categories.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {location.metadata?.suspended && (
                      <Badge variant="destructive" className="text-xs">
                        Suspended
                      </Badge>
                    )}
                    {location.metadata?.duplicate && (
                      <Badge variant="secondary" className="text-xs">
                        Duplicate
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Location Summary */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Location Selected
            </CardTitle>
            <CardDescription>
              You're now managing {selectedLocation.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Ready to manage your business!</span>
              </div>
              <p className="text-sm text-green-700">
                Your Google Business Profile is now connected and ready for automated management. 
                You can now create posts, monitor reviews, and track analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConnectionSetup;
