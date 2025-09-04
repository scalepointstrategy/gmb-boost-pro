import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Star, Calendar, ArrowRight, Settings, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useGoogleBusinessProfile } from "@/hooks/useGoogleBusinessProfile";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Dashboard = () => {
  const { isConnected, accounts: profiles, isLoading } = useGoogleBusinessProfile();

  console.log('Dashboard: isConnected =', isConnected);
  console.log('Dashboard: profiles =', profiles);
  console.log('Dashboard: isLoading =', isLoading);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center relative">
          <img 
            src="/Upgrade plan banner.svg" 
            alt="Upgrade Plan Banner" 
            style={{ width: '1100px', height: 'auto' }}
            className="max-w-full"
          />
          {/* Interactive button overlay positioned over the banner button */}
          <Link 
            to="/dashboard/settings" 
            className="absolute"
            style={{
              left: '110px', // Position button slightly to the right
              top: '100%',
              transform: 'translateY(0%)', // Button positioned below banner edge
              width: '180px',
              height: '45px'
            }}
          >
            <Button 
              className="w-full h-full bg-white hover:bg-gray-100 font-medium text-sm rounded-lg border-0 shadow-lg transition-all duration-200"
              style={{
                color: '#1B29CB'
              }}
            >
              Connect Your GBP
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <LoadingSpinner size="xl" variant="primary" />
          <div className="text-center space-y-2">
            <h3 className="font-medium text-xl">Loading Business Profiles...</h3>
            <p className="text-sm text-muted-foreground">Connecting to Google Business Profile and fetching your locations</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center relative">
          <img 
            src="/Upgrade plan banner.svg" 
            alt="Upgrade Plan Banner" 
            style={{ width: '1100px', height: 'auto' }}
            className="max-w-full"
          />
          {/* Interactive button overlay positioned over the banner button */}
          <Link 
            to="/dashboard/settings" 
            className="absolute"
            style={{
              left: '110px', // Position button slightly to the right
              top: '60%',
              transform: 'translateY(0%)', // Button positioned below banner edge
              width: '180px',
              height: '45px'
            }}
          >
            <Button 
              className="w-full h-full bg-white hover:bg-gray-100 font-medium text-sm rounded-lg border-0 shadow-lg transition-all duration-200"
              style={{
                color: '#1B29CB'
              }}
            >
              Connect Your GBP
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Business Profiles Connected</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your Google Business Profile to start managing your business listings, posts, and reviews.
          </p>
          <Link to="/dashboard/settings">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Connect Google Business Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show stats when connected
  const totalProfiles = profiles?.length || 0;
  // Since each profile now represents one location, totalLocations = totalProfiles
  const totalLocations = totalProfiles;

  return (
    <div className="space-y-6">

      {/* Action Button */}
      <div className="flex justify-end">
        <Link to="/dashboard/posts">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles}</div>
            <p className="text-xs text-muted-foreground">Connected business accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground">Business locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Now</div>
            <p className="text-xs text-muted-foreground">Real-time updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Profiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Business Profiles</h2>
          <Link to="/dashboard/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Connections
            </Button>
          </Link>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profiles.map((profile: any, index: number) => {
                // Get the first location since each profile now has exactly one location
                const location = profile.locations[0];
                const locationId = location.locationId || location.name?.split('/').pop() || index;
                
                return (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">{profile.accountName}</CardTitle>
                        <Badge variant={profile.state === 'VERIFIED' ? 'default' : 'secondary'}>
                          {profile.state}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Location Info */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {location.address?.locality || 'Location'} {location.address?.administrativeArea && `, ${location.address.administrativeArea}`}
                          </p>
                        </div>
                        
                        {location.phoneNumber && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">📞</span>
                            <p className="text-sm text-muted-foreground">{location.phoneNumber}</p>
                          </div>
                        )}
                        
                        {location.categories && location.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {location.categories.slice(0, 2).map((category: any, catIndex: number) => (
                              <Badge key={catIndex} variant="outline" className="text-xs">
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
                      
                      {/* Manage Button */}
                      <div className="pt-2 border-t">
                        <Link to={`/dashboard/profiles/${locationId}`} className="block">
                          <Button variant="ghost" size="sm" className="w-full justify-between">
                            <span>Manage Profile</span>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Info note for demo data */}
            {profiles[0]?.name?.includes('demo') && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">
                      <strong>Demo Mode:</strong> Showing sample data because Google API calls are CORS-blocked in frontend-only mode. 
                      A backend would be needed for real Google Business Profile data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No profiles loaded</h3>
              <p className="text-muted-foreground text-center mb-4">
                Your Google Business Profiles will appear here once loaded.
              </p>
              <Link to="/dashboard/settings">
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Check Connection
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;