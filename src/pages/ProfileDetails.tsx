import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Star, Globe, Phone, Mail, ExternalLink } from "lucide-react";
import PostsTab from "@/components/ProfileDetails/PostsTab";
import ReviewsTab from "@/components/ProfileDetails/ReviewsTab";
import InsightsTab from "@/components/ProfileDetails/InsightsTab";
import { useGoogleBusinessProfileContext } from "@/contexts/GoogleBusinessProfileContext";
import { BusinessLocation } from "@/lib/googleBusinessProfile";

interface BusinessProfile {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  description?: string;
  hours?: Record<string, string>;
}

const ProfileDetails = () => {
  const { profileId } = useParams();
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { accounts, isLoading: googleLoading } = useGoogleBusinessProfileContext();

  useEffect(() => {
    const findLocation = () => {
      console.log('ProfileDetails: Looking for profileId:', profileId);
      console.log('ProfileDetails: Available accounts:', accounts);
      
      if (!profileId || !accounts.length) {
        setLoading(false);
        return;
      }

      // Find the location across all accounts
      let foundLocation: BusinessLocation | null = null;
      
      for (const account of accounts) {
        const loc = account.locations.find(l => l.locationId === profileId);
        if (loc) {
          foundLocation = loc;
          break;
        }
      }

      console.log('ProfileDetails: Found location:', foundLocation);
      setLocation(foundLocation);
      setLoading(false);
    };

    if (!googleLoading) {
      findLocation();
    }
  }, [profileId, accounts, googleLoading]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-48 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Location Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested business location could not be found.</p>
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{location.displayName}</h1>
      </div>

      {/* Profile Overview */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-xl">Profile Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <span className="text-sm">
                  {location.address.addressLines.length > 0 
                    ? `${location.address.addressLines.join(', ')}, ${location.address.locality}`
                    : location.address.locality || 'No address available'
                  }
                </span>
              </div>
              
              {location.phoneNumbers && location.phoneNumbers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{location.phoneNumbers[0]}</span>
                </div>
              )}
              
              {location.websiteUri && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={location.websiteUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    {location.websiteUri}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {location.categories.map((category) => (
                  <Badge key={category.name} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Stats */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold">--</span>
                <span className="text-sm text-muted-foreground">
                  (Rating data available via Reviews API)
                </span>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Business Hours</h4>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Business hours data available via Google Business Profile API
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          <PostsTab profileId={location.locationId} />
        </TabsContent>
        
        <TabsContent value="reviews">
          <ReviewsTab profileId={location.locationId} />
        </TabsContent>
        
        <TabsContent value="insights">
          <InsightsTab profileId={location.locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileDetails;