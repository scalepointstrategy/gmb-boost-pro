import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Bot, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { googleBusinessProfileService } from "@/lib/googleBusinessProfile";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
}

interface ReviewsTabProps {
  profileId: string;
}

const ReviewsTab = ({ profileId }: ReviewsTabProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time reviews from Google Business Profile API
    const fetchReviews = async () => {
      if (!profileId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('ReviewsTab: Fetching reviews for profileId:', profileId);
        
        // Fetch reviews using the Google Business Profile API
        const locationReviews = await googleBusinessProfileService.getLocationReviews(`locations/${profileId}`);
        
        // Convert BusinessReview to Review format
        const convertedReviews: Review[] = locationReviews.map(review => ({
          id: review.id,
          author: review.reviewer.displayName,
          rating: review.starRating,
          content: review.comment || '',
          createdAt: review.createTime,
          replied: !!review.reply,
          replyContent: review.reply?.comment,
          repliedAt: review.reply?.updateTime
        }));
        
        console.log('ReviewsTab: Loaded', convertedReviews.length, 'reviews');
        setReviews(convertedReviews);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [profileId]);

  const handleAutoReply = async (reviewId: string) => {
    try {
      console.log("Auto-replying to review:", reviewId);
      
      const replyText = "Thank you for your review! We appreciate your feedback and look forward to serving you better.";
      
      // Reply to the review using Google Business Profile API
      await googleBusinessProfileService.replyToReview(`locations/${profileId}/reviews/${reviewId}`, replyText);
      
      // Update the review state to show it's been replied to
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              replied: true, 
              replyContent: replyText,
              repliedAt: new Date().toISOString()
            }
          : review
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

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Reviews</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {reviews.length} Total Reviews
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
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
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">Customer reviews will appear here once you receive them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id} className={cn(
                "pb-6",
                index < reviews.length - 1 && "border-b border-border"
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
  );
};

export default ReviewsTab;