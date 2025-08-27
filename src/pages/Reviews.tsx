import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Bot, Calendar, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGoogleBusinessProfileContext } from "@/contexts/GoogleBusinessProfileContext";
import { googleBusinessProfileService } from "@/lib/googleBusinessProfile";

interface Review {
  id: string;
  profileId: string;
  profileName: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<string>("all");
  
  // Get real-time Google Business Profile data
  const { 
    accounts, 
    isConnected, 
    isLoading: googleLoading 
  } = useGoogleBusinessProfileContext();

  useEffect(() => {
    // Real-time reviews from Google Business Profile API
    const fetchReviews = async () => {
      if (googleLoading || !isConnected || !accounts.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Reviews: Fetching reviews across all profiles');
        
        const allReviews: Review[] = [];
        
        // Fetch reviews for each location
        for (const account of accounts) {
          for (const location of account.locations) {
            try {
              const locationReviews = await googleBusinessProfileService.getLocationReviews(location.name);
              
              // Convert BusinessReview to Review format
              const convertedReviews: Review[] = locationReviews.map(review => ({
                id: review.id,
                profileId: location.locationId,
                profileName: location.displayName,
                author: review.reviewer.displayName,
                rating: review.starRating,
                content: review.comment || '',
                createdAt: review.createTime,
                replied: !!review.reply,
                replyContent: review.reply?.comment,
                repliedAt: review.reply?.updateTime
              }));
              
              allReviews.push(...convertedReviews);
            } catch (error) {
              console.error(`Error fetching reviews for ${location.displayName}:`, error);
            }
          }
        }
        
        console.log('Reviews: Loaded', allReviews.length, 'reviews');
        setReviews(allReviews);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [accounts, isConnected, googleLoading]);

  const handleAutoReply = async (reviewId: string) => {
    try {
      console.log("Auto-replying to review:", reviewId);
      
      // Find the review to get the profile information
      const review = reviews.find(r => r.id === reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
      
      const replyText = "Thank you for your review! We appreciate your feedback and look forward to serving you better.";
      
      // Reply to the review using Google Business Profile API
      await googleBusinessProfileService.replyToReview(`locations/${review.profileId}/reviews/${reviewId}`, replyText);
      
      // Update the review state to show it's been replied to
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { 
              ...r, 
              replied: true, 
              replyContent: replyText,
              repliedAt: new Date().toISOString()
            }
          : r
      ));
      
      console.log('Reply sent successfully!');
    } catch (error) {
      console.error('Error replying to review:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star 
        key={index} 
        className={cn(
          "h-4 w-4",
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )} 
      />
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.profileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter;
    const matchesReply = replyFilter === "all" || 
                        (replyFilter === "replied" && review.replied) ||
                        (replyFilter === "not-replied" && !review.replied);
    return matchesSearch && matchesRating && matchesReply;
  });

  const getRatingCounts = () => {
    return {
      all: reviews.length,
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };
  };

  const getReplyStats = () => {
    const replied = reviews.filter(r => r.replied).length;
    const needReply = reviews.length - replied;
    return { replied, needReply };
  };

  const ratingCounts = getRatingCounts();
  const replyStats = getReplyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer reviews across all your business profiles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ratingCounts.all}</div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <div className="text-2xl font-bold">--</div>
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{replyStats.replied}</div>
            <p className="text-xs text-muted-foreground">Replied</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{replyStats.needReply}</div>
            <p className="text-xs text-muted-foreground">Need Reply</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
            <Select value={replyFilter} onValueChange={setReplyFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Reply Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="not-replied">Need Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border-b border-border pb-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || ratingFilter !== "all" || replyFilter !== "all" ? "No reviews found" : "No reviews yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || ratingFilter !== "all" || replyFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Customer reviews will appear here once you receive them"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review, index) => (
                <div key={review.id} className={cn(
                  "pb-6",
                  index < filteredReviews.length - 1 && "border-b border-border"
                )}>
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(review.author)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{review.author}</h4>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {review.profileName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                        
                        {!review.replied && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAutoReply(review.id)}
                            className="gap-2"
                          >
                            <Bot className="h-3 w-3" />
                            Auto Reply
                          </Button>
                        )}
                      </div>
                      
                      {/* Review Content */}
                      <p className="text-sm leading-relaxed">{review.content}</p>
                      
                      {/* Reply */}
                      {review.replied && review.replyContent && (
                        <div className="bg-muted/50 rounded-lg p-3 ml-4 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3 w-3 text-primary" />
                            <span className="text-xs font-medium text-primary">Your Reply</span>
                            {review.repliedAt && (
                              <span className="text-xs text-muted-foreground">
                                • {formatDate(review.repliedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{review.replyContent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reviews;