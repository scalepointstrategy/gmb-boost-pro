import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Star, Calendar, ArrowRight, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useGoogleBusinessProfileContext } from "@/contexts/GoogleBusinessProfileContext";

interface BusinessProfile {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  lastSynced: string;
  categories: string[];
}

const Dashboard = () => {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    isConnected, 
    accounts, 
    selectedAccount, 
    selectedLocation,
    isLoading: googleLoading 
  } = useGoogleBusinessProfileContext();

  useEffect(() => {
    // Load profiles from Google Business Profile connection
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        console.log('Dashboard: isConnected =', isConnected);
        console.log('Dashboard: accounts =', accounts);
        console.log('Dashboard: googleLoading =', googleLoading);
        
        if (!isConnected || !accounts.length) {
          // No connection or no accounts - show empty state
          console.log('Dashboard: No connection or accounts, showing empty state');
          setProfiles([]);
          setLoading(false);
          return;
        }

        // Convert Google Business Profile data to dashboard format
        const dashboardProfiles: BusinessProfile[] = [];
        
        accounts.forEach((account, accountIndex) => {
          console.log(`Dashboard: Processing account ${accountIndex}:`, account);
          account.locations.forEach((location, locationIndex) => {
            console.log(`Dashboard: Processing location ${locationIndex}:`, location);
            dashboardProfiles.push({
              id: location.locationId,
              name: location.displayName,
              address: location.address.addressLines.length > 0 
                ? `${location.address.addressLines.join(', ')}, ${location.address.locality}`
                : location.address.locality || 'No address available',
              rating: 4.5, // TODO: Get actual rating from Google Business Profile API
              reviewCount: 0, // TODO: Get actual review count
              lastSynced: new Date().toISOString(),
              categories: location.categories.map(cat => cat.name)
            });
          });
        });

        console.log('Dashboard: Created profiles:', dashboardProfiles);
        setProfiles(dashboardProfiles);
        setLoading(false);
      } catch (error) {
        console.error("Dashboard: Error fetching profiles:", error);
        setLoading(false);
      }
    };

    if (!googleLoading) {
      fetchProfiles();
    }
  }, [isConnected, accounts, googleLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Debug logging for render
  console.log('Dashboard render: profiles =', profiles);
  console.log('Dashboard render: loading =', loading);
  console.log('Dashboard render: isConnected =', isConnected);
  console.log('Dashboard render: accounts.length =', accounts.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Google Business Profile listings
          </p>
        </div>
        <Link to="/dashboard/profiles/new">
          <Button className="bg-primary hover:bg-primary-hover shadow-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Profile
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Profiles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">Active business listings</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connection Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? "Connected" : "Not Connected"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Google Business Profile" : "Connect to get started"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accounts</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Business accounts</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? "Now" : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Real-time sync" : "Connect to sync"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="shadow-card border-0 animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : profiles.length === 0 ? (
          // Empty state - no profiles connected
          <div className="col-span-full">
            <Card className="shadow-card border-0">
              <CardContent className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {isConnected ? "No Business Locations Found" : "No Business Profiles Connected"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {isConnected 
                    ? `Your account "${accounts[0]?.accountName}" is connected but has no business locations. Add a business location to get started.`
                    : "Connect your Google Business Profile to start managing your business listings, posts, and reviews."
                  }
                </p>
                {isConnected ? (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => window.open('https://business.google.com/', '_blank')}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Business Location
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Add your business location in Google Business Profile Manager
                    </p>
                  </div>
                ) : (
                  <Link to="/dashboard/settings">
                    <Button className="gap-2">
                      <Settings className="h-4 w-4" />
                      Connect Google Business Profile
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          profiles.map((profile) => (
            <Card key={profile.id} className="shadow-card border-0 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <Link to={`/dashboard/profiles/${profile.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="group-hover:text-primary transition-colors">
                      {profile.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardTitle>
                  <CardDescription className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {profile.address}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{profile.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({profile.reviewCount} reviews)
                      </span>
                    </div>
                    
                    {/* Categories */}
                    <div className="flex flex-wrap gap-1">
                      {profile.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Last Synced */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Last synced: {formatDate(profile.lastSynced)}
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && profiles.length === 0 && (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Business Profiles</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your Google Business Account to start managing your profiles
            </p>
            <Link to="/dashboard/settings">
              <Button variant="outline">Connect Account</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;