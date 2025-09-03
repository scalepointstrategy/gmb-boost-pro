import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, Bot, Calendar, Search, Filter, RefreshCw, ArrowUpDown, ArrowDown, ArrowUp, Download, Edit2, Send, X, Heart, Frown, Meh } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGoogleBusinessProfile } from "@/hooks/useGoogleBusinessProfile";
import { googleBusinessProfileService } from "@/lib/googleBusinessProfile";

interface Review {
  id: string;
  profileId: string;
  profileName: string;
  fullReviewName?: string; // Full review name from Google API
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface ReviewFilters {
  search: string;
  rating: string;
  reply: string;
  location: string;
  dateRange: string;
  sentiment: string;
}

interface SortConfig {
  field: 'date' | 'rating' | 'author';
  direction: 'asc' | 'desc';
}

const REPLY_TEMPLATES = [
  {
    id: 'positive',
    name: 'Positive Review',
    content: 'Thank you so much for your wonderful review! We\'re thrilled to hear about your positive experience. Your feedback means the world to us and motivates our team to continue providing excellent service. We look forward to serving you again soon!'
  },
  {
    id: 'negative', 
    name: 'Negative Review',
    content: 'Thank you for taking the time to share your feedback. We sincerely apologize for not meeting your expectations. Your concerns are important to us, and we would appreciate the opportunity to discuss this further and make things right. Please contact us directly so we can address your concerns properly.'
  },
  {
    id: 'neutral',
    name: 'Neutral Review', 
    content: 'Thank you for your review and feedback. We appreciate you taking the time to share your experience with us. We\'re always working to improve our services and your input helps us do that. We hope to have the opportunity to serve you again and provide an even better experience.'
  },
  {
    id: 'general',
    name: 'General Response',
    content: 'Thank you for your review! We appreciate your feedback and look forward to serving you better in the future.'
  }
];

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ReviewFilters>({
    search: '',
    rating: 'all',
    reply: 'all', 
    location: 'all',
    dateRange: 'all',
    sentiment: 'all'
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [customReply, setCustomReply] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [replyLoading, setReplyLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Get real-time Google Business Profile data
  const { 
    accounts, 
    isConnected, 
    isLoading: googleLoading 
  } = useGoogleBusinessProfile();

  // Analyze review sentiment
  const analyzeSentiment = (rating: number, content: string): 'positive' | 'neutral' | 'negative' => {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    
    // For 3-star reviews, analyze content for sentiment keywords
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'poor'];
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect'];
    
    const lowerContent = content.toLowerCase();
    const hasNegative = negativeWords.some(word => lowerContent.includes(word));
    const hasPositive = positiveWords.some(word => lowerContent.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  };

  // Fetch reviews with enhanced data
  const fetchReviews = async (isRefresh = false) => {
    if (googleLoading || !isConnected || !accounts.length) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Reviews: Fetching reviews across all profiles');
      
      const allReviews: Review[] = [];
      
      // Fetch reviews for each location
      for (const account of accounts) {
        for (const location of account.locations) {
          try {
            console.log(`📍 Frontend: Processing location - Name: "${location.displayName}", ID: "${location.locationId}", Full Name: "${location.name}"`);
            
            const locationReviews = await googleBusinessProfileService.getLocationReviews(location.name);
            
            console.log(`📍 Frontend: Received ${locationReviews.length} reviews for ${location.displayName}`);
            
            // Convert BusinessReview to Review format with sentiment analysis
            const convertedReviews: Review[] = locationReviews.map(review => {
              const reviewData = {
                id: review.id,
                profileId: location.locationId,
                profileName: location.displayName,
                fullReviewName: review.name, // Store the full review name for API calls
                author: review.reviewer.displayName,
                rating: review.starRating,
                content: review.comment || '',
                createdAt: review.createTime,
                replied: !!review.reply,
                replyContent: review.reply?.comment,
                repliedAt: review.reply?.updateTime,
                sentiment: analyzeSentiment(review.starRating, review.comment || '')
              };
              console.log(`📍 Frontend: Created review with profileName: "${reviewData.profileName}", fullReviewName: "${reviewData.fullReviewName}"`);
              return reviewData;
            });
            
            allReviews.push(...convertedReviews);
          } catch (error) {
            console.error(`Error fetching reviews for ${location.displayName}:`, error);
          }
        }
      }
      
      console.log('Reviews: Loaded', allReviews.length, 'reviews');
      setReviews(allReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [accounts, isConnected, googleLoading]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && accounts.length) {
        fetchReviews(true);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, accounts]);

  const handleAutoReply = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    // Auto-select template based on sentiment
    const template = REPLY_TEMPLATES.find(t => t.id === review.sentiment) || REPLY_TEMPLATES.find(t => t.id === 'general');
    if (template) {
      setSelectedTemplate(template.id);
      setCustomReply(template.content);
    }
    
    setSelectedReview(review);
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedReview || !customReply.trim()) return;
    
    setReplyLoading(true);
    try {
      console.log("Sending reply to review:", selectedReview.id);
      
      // Reply to the review using Google Business Profile API
      // Use the full review name if available, otherwise construct it  
      const fullReviewName = selectedReview.fullReviewName || `accounts/106433552101751461082/locations/${selectedReview.profileId}/reviews/${selectedReview.id}`;
      
      console.log('Reviews: Sending reply with full review name:', fullReviewName);
      await googleBusinessProfileService.replyToReview(fullReviewName, customReply);
      
      // Update the review state to show it's been replied to
      setReviews(prev => prev.map(r => 
        r.id === selectedReview.id 
          ? { 
              ...r, 
              replied: true, 
              replyContent: customReply,
              repliedAt: new Date().toISOString()
            }
          : r
      ));
      
      // Close dialog and reset state
      setReplyDialogOpen(false);
      setSelectedReview(null);
      setCustomReply('');
      setSelectedTemplate('');
      
      console.log('Reply sent successfully!');
    } catch (error) {
      console.error('Error replying to review:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = REPLY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setCustomReply(template.content);
    }
  };

  // Generate AI-powered reply suggestions
  const generateAISuggestions = async (review: Review) => {
    if (!review) return;
    
    setLoadingSuggestions(true);
    try {
      // Simulate AI suggestions based on review content and sentiment
      const suggestions = generateSmartReplies(review);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Smart reply generation based on review analysis
  const generateSmartReplies = (review: Review): string[] => {
    const suggestions: string[] = [];
    const businessName = review.profileName;
    const rating = review.rating;
    const content = review.content.toLowerCase();
    
    // Analyze keywords for personalized responses
    const hasService = content.includes('service');
    const hasStaff = content.includes('staff') || content.includes('team');
    const hasQuality = content.includes('quality');
    const hasPrice = content.includes('price') || content.includes('cost');
    const hasWait = content.includes('wait') || content.includes('time');
    const hasCleanliness = content.includes('clean');
    const hasFood = content.includes('food') || content.includes('meal');
    const hasAtmosphere = content.includes('atmosphere') || content.includes('ambiance');
    
    if (rating >= 4) {
      // Positive reviews
      suggestions.push(`Thank you so much for your wonderful ${rating}-star review! We're thrilled to hear about your positive experience at ${businessName}. Your feedback means the world to us and motivates our team to continue providing excellent service.`);
      
      if (hasService) {
        suggestions.push(`We're so glad you were happy with our service! Our team works hard to ensure every customer has a great experience. Thank you for taking the time to share your review.`);
      }
      
      if (hasStaff) {
        suggestions.push(`Our team will be delighted to hear your kind words! We'll make sure to share your feedback with them. Thank you for recognizing their hard work.`);
      }
      
      suggestions.push(`Your recommendation means everything to us! We look forward to welcoming you back to ${businessName} soon.`);
    } else if (rating === 3) {
      // Neutral reviews
      suggestions.push(`Thank you for your honest feedback about your experience at ${businessName}. We appreciate you taking the time to share your thoughts and we're always looking for ways to improve.`);
      
      suggestions.push(`We value your feedback and would love to discuss how we can enhance your experience. Please feel free to contact us directly so we can address any concerns.`);
      
      if (hasService) {
        suggestions.push(`We appreciate your feedback about our service. We're committed to continuous improvement and your input helps us identify areas where we can do better. Thank you for giving us the opportunity to serve you.`);
      }
    } else {
      // Negative reviews
      suggestions.push(`We sincerely apologize that your experience at ${businessName} didn't meet your expectations. Your feedback is important to us, and we take all concerns seriously. We'd appreciate the opportunity to discuss this with you directly to make things right.`);
      
      if (hasWait) {
        suggestions.push(`We're sorry about the wait time you experienced. We're working on improving our efficiency to serve our customers better. Please give us another chance to provide you with the quality service you deserve.`);
      }
      
      if (hasService) {
        suggestions.push(`We apologize for falling short in our service. This is not the standard we strive for at ${businessName}. We would welcome the opportunity to speak with you about your experience and show you the level of service we're known for.`);
      }
      
      suggestions.push(`Thank you for bringing this to our attention. We're committed to making improvements and would like to invite you back to experience the better service we're working towards.`);
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
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

  // Enhanced filtering logic
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews.filter(review => {
      const matchesSearch = review.content.toLowerCase().includes(filters.search.toLowerCase()) ||
                           review.author.toLowerCase().includes(filters.search.toLowerCase()) ||
                           review.profileName.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRating = filters.rating === "all" || review.rating.toString() === filters.rating;
      
      const matchesReply = filters.reply === "all" || 
                          (filters.reply === "replied" && review.replied) ||
                          (filters.reply === "not-replied" && !review.replied);
      
      const matchesLocation = filters.location === "all" || review.profileName === filters.location;
      
      const matchesSentiment = filters.sentiment === "all" || review.sentiment === filters.sentiment;
      
      // Date range filtering
      let matchesDate = true;
      if (filters.dateRange !== "all") {
        const reviewDate = new Date(review.createdAt);
        const now = new Date();
        const daysDiff = (now.getTime() - reviewDate.getTime()) / (1000 * 3600 * 24);
        
        switch (filters.dateRange) {
          case "7d":
            matchesDate = daysDiff <= 7;
            break;
          case "30d":
            matchesDate = daysDiff <= 30;
            break;
          case "90d":
            matchesDate = daysDiff <= 90;
            break;
          case "1y":
            matchesDate = daysDiff <= 365;
            break;
        }
      }
      
      return matchesSearch && matchesRating && matchesReply && matchesLocation && matchesSentiment && matchesDate;
    });

    // Sorting
    filtered.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.field) {
        case 'date':
          return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'rating':
          return direction * (a.rating - b.rating);
        case 'author':
          return direction * a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, filters, sortConfig]);

  // Enhanced statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter(r => r.replied).length;
    const needReply = total - replied;
    
    const ratingCounts = {
      all: total,
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };
    
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    
    const sentimentCounts = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
    };
    
    const locations = Array.from(new Set(reviews.map(r => r.profileName)));
    
    return {
      total,
      replied,
      needReply,
      ratingCounts,
      avgRating,
      sentimentCounts,
      locations
    };
  }, [reviews]);

  // Utility functions
  const handleRefresh = () => {
    fetchReviews(true);
  };

  const handleSort = (field: SortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const updateFilter = (key: keyof ReviewFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Heart className="h-3 w-3 text-green-500" />;
      case 'negative': return <Frown className="h-3 w-3 text-red-500" />;
      default: return <Meh className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  // Export functionality
  const exportReviews = (format: 'csv' | 'json') => {
    const dataToExport = filteredAndSortedReviews.map(review => ({
      Author: review.author,
      Rating: review.rating,
      Review: review.content,
      Location: review.profileName,
      Date: formatDate(review.createdAt),
      Replied: review.replied ? 'Yes' : 'No',
      Reply: review.replyContent || '',
      Sentiment: review.sentiment || 'neutral'
    }));

    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reviews_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reviews_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            </div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            <p className="text-xs text-muted-foreground">Replied</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.needReply}</div>
            <p className="text-xs text-muted-foreground">Need Reply</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-1">
              {getSentimentIcon('positive')}
              <div className="text-2xl font-bold">{stats.sentimentCounts.positive}</div>
            </div>
            <p className="text-xs text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Actions */}
      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search, Refresh, and Export */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews by content, author, or location..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Reviews</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Export Dropdown */}
              <Select onValueChange={(value) => value && exportReviews(value as 'csv' | 'json')}>
                <SelectTrigger className="w-36">
                  <Download className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export CSV</SelectItem>
                  <SelectItem value="json">Export JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
                <SelectTrigger className="w-36">
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
              
              <Select value={filters.reply} onValueChange={(value) => updateFilter('reply', value)}>
                <SelectTrigger className="w-40">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Reply Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="not-replied">Need Reply</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {stats.locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.sentiment} onValueChange={(value) => updateFilter('sentiment', value)}>
                <SelectTrigger className="w-36">
                  <Heart className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="w-36">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by:</span>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7", sortConfig.field === 'date' && "bg-muted")}
                onClick={() => handleSort('date')}
              >
                Date
                {sortConfig.field === 'date' && (
                  sortConfig.direction === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUp className="ml-1 h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7", sortConfig.field === 'rating' && "bg-muted")}
                onClick={() => handleSort('rating')}
              >
                Rating
                {sortConfig.field === 'rating' && (
                  sortConfig.direction === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUp className="ml-1 h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7", sortConfig.field === 'author' && "bg-muted")}
                onClick={() => handleSort('author')}
              >
                Author
                {sortConfig.field === 'author' && (
                  sortConfig.direction === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> : <ArrowUp className="ml-1 h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="shadow-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Reviews ({filteredAndSortedReviews.length})</CardTitle>
          <div className="flex items-center gap-2">
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
            {filteredAndSortedReviews.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Showing {filteredAndSortedReviews.length} of {stats.total} reviews
              </Badge>
            )}
          </div>
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
          ) : filteredAndSortedReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {Object.values(filters).some(f => f !== 'all' && f !== '') ? "No reviews found" : "No reviews yet"}
              </h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some(f => f !== 'all' && f !== '') 
                  ? "Try adjusting your search or filters"
                  : "Customer reviews will appear here once you receive them"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedReviews.map((review, index) => (
                <div key={review.id} className={cn(
                  "pb-6",
                  index < filteredAndSortedReviews.length - 1 && "border-b border-border"
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{review.author}</h4>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {review.profileName}
                            </Badge>
                            {review.sentiment && (
                              <Badge variant="outline" className={cn("text-xs", getSentimentColor(review.sentiment))}>
                                <div className="flex items-center gap-1">
                                  {getSentimentIcon(review.sentiment)}
                                  {review.sentiment}
                                </div>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {review.replied && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReview(review);
                                      setCustomReply(review.replyContent || '');
                                      setReplyDialogOpen(true);
                                    }}
                                    className="gap-2 h-8"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Reply</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {!review.replied && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoReply(review.id)}
                              className="gap-2"
                            >
                              <Bot className="h-3 w-3" />
                              Reply
                            </Button>
                          )}
                        </div>
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

      {/* Custom Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              {selectedReview && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedReview.author}</span>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedReview.rating)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedReview.profileName}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{selectedReview.content}"</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reply Template (Optional)
                </label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Reply</SelectItem>
                    {REPLY_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  AI Suggestions
                </label>
                <Button
                  variant="outline"
                  onClick={() => selectedReview && generateAISuggestions(selectedReview)}
                  disabled={loadingSuggestions}
                  className="w-full justify-start"
                >
                  {loadingSuggestions ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="mr-2 h-4 w-4" />
                  )}
                  Generate Smart Replies
                </Button>
              </div>
            </div>
            
            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  AI-Generated Suggestions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setCustomReply(suggestion)}
                    >
                      <p className="text-sm line-clamp-3">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Reply
              </label>
              <Textarea
                placeholder="Write your reply to this review or select an AI suggestion above..."
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  {customReply.length}/4000 characters
                </p>
                {customReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomReply('')}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplyDialogOpen(false);
                setSelectedReview(null);
                setCustomReply('');
                setSelectedTemplate('');
                setAiSuggestions([]);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={!customReply.trim() || replyLoading}
              className="gap-2"
            >
              {replyLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {selectedReview?.replied ? 'Update Reply' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reviews;