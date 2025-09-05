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
        <div className="flex items-center justify-center relative px-4">
          <img 
            src="/Upgrade plan banner.svg" 
            alt="Upgrade Plan Banner" 
            className="w-full max-w-4xl h-auto"
          />
          {/* Interactive button overlay positioned over the banner button */}
          <Link 
            to="/dashboard/settings" 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 sm:left-auto sm:transform-none"
            style={{
              left: 'clamp(20px, 10%, 110px)',
              bottom: '10%',
              width: 'clamp(140px, 20%, 180px)',
              height: 'clamp(35px, 8%, 45px)'
            }}
          >
            <Button 
              className="w-full h-full bg-white hover:bg-gray-100 font-medium text-xs sm:text-sm rounded-lg border-0 shadow-lg transition-all duration-200"
              style={{
                color: '#1B29CB'
              }}
            >
              <span className="hidden sm:inline">Connect Your GBP</span>
              <span className="sm:hidden">Connect GBP</span>
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
        
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
        <div className="flex items-center justify-center relative px-4">
          <img 
            src="/Upgrade plan banner.svg" 
            alt="Upgrade Plan Banner" 
            className="w-full max-w-4xl h-auto"
          />
          {/* Interactive button overlay positioned over the banner button */}
          <Link 
            to="/dashboard/settings" 
            className="absolute"
            style={{
              left: 'clamp(20px, 10%, 110px)',
              top: '60%',
              transform: 'translateY(-50%)',
              width: 'clamp(140px, 20%, 180px)',
              height: 'clamp(35px, 8%, 45px)'
            }}
          >
            <Button 
              className="w-full h-full bg-white hover:bg-gray-100 font-medium text-xs sm:text-sm rounded-lg border-0 shadow-lg transition-all duration-200"
              style={{
                color: '#1B29CB'
              }}
            >
              <span className="hidden sm:inline">Connect Your GBP</span>
              <span className="sm:hidden">Connect GBP</span>
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

      {/* Header with Manage Profiles text and Create Post button */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex justify-start">
          <h2 className="text-base sm:text-lg font-semibold truncate" style={{ fontFamily: 'Onest' }}>
            Manage Profiles
          </h2>
        </div>
        <div className="flex justify-end flex-shrink-0">
          <Link to="/dashboard/posts">
            <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">Post</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold truncate">Your Business Profiles</h2>
          <Link to="/dashboard/settings" className="flex-shrink-0">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
              <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Manage Connections</span>
              <span className="sm:hidden">Manage</span>
            </Button>
          </Link>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profiles.map((profile: any, index: number) => {
                // Get the first location since each profile now has exactly one location
                const location = profile.locations[0];
                const locationId = location.locationId || location.name?.split('/').pop() || index;
                
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full">
                    {/* Content area that grows */}
                    <div className="flex-1">
                      {/* Header with name and verification badge */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 
                          className="text-sm sm:text-base font-semibold text-black truncate flex-1 mr-2" 
                          style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontFamily: 'Onest' }}
                          title={profile.accountName}
                        >
                          {profile.accountName}
                        </h3>
                        {profile.state === 'VERIFIED' && (
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            <img 
                              src="/Vector.svg" 
                              alt="Verified" 
                              className="w-4 h-4"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center mb-3">
                        <MapPin className="h-4 w-4 text-black mr-2" />
                        <span className="text-xs sm:text-sm text-black truncate" style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontFamily: 'Onest' }}>
                          {location.address?.locality || 'Location'} {location.address?.administrativeArea && `, ${location.address.administrativeArea}`}
                        </span>
                      </div>
                      
                      {/* Categories */}
                      {location.categories && location.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {location.categories.slice(0, 2).map((category: any, catIndex: number) => (
                            <span 
                              key={catIndex} 
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100"
                              style={{ fontFamily: 'Onest' }}
                            >
                              {category.name}
                            </span>
                          ))}
                          {location.categories.length > 2 && (
                            <span 
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100"
                              style={{ fontFamily: 'Onest' }}
                            >
                              +{location.categories.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Manage Profile Button - Fixed at bottom */}
                    <div className="mt-4">
                      <Link to={`/dashboard/profiles/${locationId}`} className="block">
                        <button 
                          className="w-full py-2 px-3 sm:px-4 rounded-lg text-white font-medium transition-colors"
                          style={{ 
                            backgroundColor: '#1E2DCD',
                            fontSize: 'clamp(12px, 2vw, 14px)',
                            fontFamily: 'Onest'
                          }}
                        >
                          Manage Profile
                        </button>
                      </Link>
                    </div>
                  </div>
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