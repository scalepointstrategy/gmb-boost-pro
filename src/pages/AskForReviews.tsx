import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus, ExternalLink, Star, QrCode, ArrowRight } from "lucide-react";
import { useGoogleBusinessProfile } from "@/hooks/useGoogleBusinessProfile";

const AskForReviews = () => {
  const { accounts, isConnected, isLoading } = useGoogleBusinessProfile();

  const handleGenerateQR = () => {
    window.open('https://demo.scalepointstrategy.com/qr', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Ask for Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Generate QR codes to make it easy for customers to leave reviews
        </p>
      </div>

      {/* Main Generate QR Box */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl shadow-lg border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              
              {/* Content */}
              <div className="relative z-10 p-12 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6">
                      <QrCode className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold text-white mb-4">
                  Generate Your QR
                </h2>
                
                <p className="text-white/90 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                  Create QR codes that make it incredibly easy for your customers to find and review your business on Google.
                </p>
                
                <Button
                  onClick={handleGenerateQR}
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg px-8 py-6 rounded-xl font-semibold"
                >
                  <MessageSquarePlus className="mr-3 h-6 w-6" />
                  Generate QR Code
                  <ArrowRight className="ml-3 h-5 w-5" />
                  <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </div>
              
              {/* Floating elements for animation */}
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-bounce" />
              <div className="absolute bottom-8 left-8 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
              <div className="absolute top-1/3 left-12 w-1 h-1 bg-white/40 rounded-full animate-ping" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Profiles Info */}
      {isConnected && !isLoading && accounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Your Connected Business Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.flatMap(account => 
              account.locations.map(location => (
                <Card key={location.locationId} className="shadow-card border-0 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{location.displayName}</h4>
                    <p className="text-muted-foreground text-sm mb-4">{account.accountName}</p>
                    <Button
                      onClick={handleGenerateQR}
                      variant="outline"
                      size="sm"
                      className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR
                      <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state if no profiles */}
      {isConnected && !isLoading && accounts.length === 0 && (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center">
            <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Business Profiles Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your Google Business Profile to generate QR codes for your locations.
            </p>
            <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
              Connect Business Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="shadow-card border-0">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-8 w-8 bg-muted rounded-full mx-auto mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto mb-4" />
                    <div className="h-8 bg-muted rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AskForReviews;