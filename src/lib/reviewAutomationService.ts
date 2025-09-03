import { openaiService } from './openaiService';
import { googleBusinessProfileService } from './googleBusinessProfile';
import { toast } from '@/hooks/use-toast';

// Import notification context type (we'll need to pass this from the component)
interface NotificationService {
  addNotification: (notification: {
    type: 'review' | 'post' | 'system' | 'reply';
    title: string;
    message: string;
    actionUrl?: string;
  }) => void;
}

interface ReviewReplyConfig {
  locationId: string;
  businessName: string;
  enabled: boolean;
  autoReplyEnabled: boolean;
  replyTemplate?: string;
  minRating?: number; // Only reply to reviews below this rating (1-5)
  maxRating?: number; // Only reply to reviews above this rating (1-5)
  lastChecked?: string;
}

interface ProcessedReview {
  reviewId: string;
  locationId: string;
  processed: boolean;
  processedAt: string;
}

class ReviewAutomationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 60000; // Check every 60 seconds for new reviews
  private processedReviews: Map<string, ProcessedReview> = new Map();
  private notificationService: NotificationService | null = null;

  constructor() {
    this.loadProcessedReviews();
    this.start();
  }

  // Set the notification service to enable notifications
  setNotificationService(notificationService: NotificationService): void {
    this.notificationService = notificationService;
    console.log('🔔 Notification service connected to review automation');
  }

  start(): void {
    if (this.isRunning) return;
    
    console.log('🔄 Starting review automation service...');
    this.isRunning = true;
    
    // Run initial check
    this.checkAndProcessReviews();
    
    // Set up interval for regular checks
    this.intervalId = setInterval(() => {
      this.checkAndProcessReviews();
    }, this.checkInterval);
  }

  stop(): void {
    if (!this.isRunning) return;
    
    console.log('⏹️ Stopping review automation service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkAndProcessReviews(): Promise<void> {
    try {
      const enabledConfigs = this.getEnabledConfigurations();
      
      console.log(`🔍 Checking ${enabledConfigs.length} enabled review configurations`);
      
      for (const config of enabledConfigs) {
        await this.processLocationReviews(config);
      }
    } catch (error) {
      console.error('🚨 Error in review automation service check:', error);
    }
  }

  private async processLocationReviews(config: ReviewReplyConfig): Promise<void> {
    try {
      console.log(`📝 Processing reviews for ${config.businessName}...`);
      
      // Get access token
      const accessToken = googleBusinessProfileService.getAccessToken();
      if (!accessToken) {
        console.warn(`⚠️ No access token available for ${config.businessName}`);
        return;
      }

      // Fetch reviews for this location
      const reviews = await this.fetchLocationReviews(config.locationId);
      
      // Check for new reviews and notify
      const newReviews = reviews.filter(review => {
        const reviewKey = `${config.locationId}_${review.id}`;
        return !this.processedReviews.has(reviewKey);
      });

      if (newReviews.length > 0 && this.notificationService) {
        for (const review of newReviews) {
          this.notificationService.addNotification({
            type: 'review',
            title: 'New Review Received!',
            message: `${review.starRating}⭐ review from ${review.reviewer?.displayName || 'Customer'} for ${config.businessName}`,
            actionUrl: '/reviews'
          });
        }
      }
      
      // Process each review that hasn't been handled yet
      for (const review of reviews) {
        await this.processIndividualReview(config, review);
      }
      
    } catch (error) {
      console.error(`🚨 Error processing reviews for ${config.businessName}:`, error);
    }
  }

  private async fetchLocationReviews(locationId: string) {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
      const accessToken = googleBusinessProfileService.getAccessToken();
      
      const response = await fetch(`${backendUrl}/api/locations/${locationId}/reviews`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle temporary API issues gracefully
        if (response.status === 503 || response.status === 502 || response.status === 500) {
          console.warn(`⚠️ Google API temporarily unavailable (${response.status}). Will retry on next check.`);
          return []; // Return empty array instead of throwing error
        }
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  private async processIndividualReview(config: ReviewReplyConfig, review: any): Promise<void> {
    const reviewKey = `${config.locationId}_${review.id}`;
    
    // Check if we've already processed this review
    if (this.processedReviews.has(reviewKey)) {
      return;
    }

    try {
      // Check if review meets criteria for auto-reply
      if (!this.shouldReplyToReview(config, review)) {
        console.log(`⏭️ Skipping review ${review.id} - doesn't meet criteria`);
        this.markReviewAsProcessed(reviewKey, config.locationId, review.id);
        return;
      }

      // Check if review already has a reply
      if (review.reply && review.reply.comment) {
        console.log(`⏭️ Review ${review.id} already has a reply`);
        this.markReviewAsProcessed(reviewKey, config.locationId, review.id);
        return;
      }

      console.log(`🤖 Generating auto-reply for review ${review.id} (${review.starRating} stars)`);

      // Generate reply using OpenAI
      const replyText = await this.generateReviewReply(config, review);
      
      // Post reply to Google Business Profile
      await this.postReviewReply(config.locationId, review.name, replyText);
      
      // Mark as processed
      this.markReviewAsProcessed(reviewKey, config.locationId, review.id);
      
      console.log(`✅ Successfully replied to review ${review.id}`);
      
      // Add notification for successful AI reply
      if (this.notificationService) {
        this.notificationService.addNotification({
          type: 'reply',
          title: 'AI Reply Sent!',
          message: `Auto-replied to ${review.starRating}⭐ review from ${review.reviewer?.displayName || 'Customer'} for ${config.businessName}`,
          actionUrl: '/reviews'
        });
      }
      
      // Show success toast
      toast({
        title: "Review Reply Posted! 💬",
        description: `Auto-replied to ${review.starRating}⭐ review for ${config.businessName}`,
        duration: 4000,
      });

    } catch (error) {
      console.error(`❌ Failed to process review ${review.id}:`, error);
      
      // Show error toast
      toast({
        title: "Review Reply Failed ❌",
        description: `Failed to reply to review for ${config.businessName}`,
        variant: "destructive",
        duration: 6000,
      });
    }
  }

  private shouldReplyToReview(config: ReviewReplyConfig, review: any): boolean {
    if (!config.autoReplyEnabled) return false;
    
    // Check rating criteria
    if (config.minRating && review.starRating < config.minRating) return false;
    if (config.maxRating && review.starRating > config.maxRating) return false;
    
    // Check if review has text (skip reviews without comments)
    if (!review.comment || review.comment.trim() === '') return false;
    
    return true;
  }

  private async generateReviewReply(config: ReviewReplyConfig, review: any): Promise<string> {
    try {
      // Use custom template if available
      if (config.replyTemplate && config.replyTemplate.trim()) {
        return this.processReplyTemplate(config.replyTemplate, config, review);
      }

      // Generate AI reply using OpenAI
      const prompt = `Generate a professional, friendly, and personalized reply to this customer review for ${config.businessName}:

Review Rating: ${review.starRating}/5 stars
Review Text: "${review.comment}"
Reviewer: ${review.reviewer?.displayName || 'Customer'}

Requirements:
- Keep it under 200 characters
- Be professional and thankful
- Address specific points mentioned in the review if relevant
- ${review.starRating >= 4 ? 'Express gratitude for the positive feedback' : 'Address concerns professionally and offer to resolve issues'}
- Include a subtle invitation to visit again or contact directly if needed
- Don't use excessive emojis (max 1-2)

Generate only the reply text, no quotes or extra formatting.`;

      const response = await openaiService.generateReviewResponse(
        config.businessName,
        review.comment,
        review.starRating
      );
      return response.trim();
      
    } catch (error) {
      console.error('Failed to generate review reply:', error);
      // Fallback to generic replies
      return this.getGenericReply(review.starRating);
    }
  }

  private processReplyTemplate(template: string, config: ReviewReplyConfig, review: any): string {
    return template
      .replace(/\{businessName\}/g, config.businessName)
      .replace(/\{reviewerName\}/g, review.reviewer?.displayName || 'valued customer')
      .replace(/\{rating\}/g, review.starRating.toString())
      .replace(/\{comment\}/g, review.comment || '');
  }

  private getGenericReply(starRating: number): string {
    if (starRating >= 4) {
      return "Thank you for your wonderful review! We're thrilled you had a great experience with us. We look forward to serving you again soon!";
    } else if (starRating === 3) {
      return "Thank you for your feedback. We appreciate you taking the time to share your experience and we're always working to improve. Please feel free to contact us directly to discuss any concerns.";
    } else {
      return "Thank you for your feedback. We sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please contact us directly so we can address your concerns.";
    }
  }

  private async postReviewReply(locationId: string, reviewName: string, replyText: string): Promise<void> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    const accessToken = googleBusinessProfileService.getAccessToken();
    
    // Extract reviewId from reviewName (format: accounts/.../locations/.../reviews/reviewId)
    const reviewId = reviewName.split('/').pop();
    
    const response = await fetch(`${backendUrl}/api/locations/${locationId}/reviews/${reviewId}/reply`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: replyText
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to post review reply: ${response.status} - ${errorData.error}`);
    }
  }

  private markReviewAsProcessed(reviewKey: string, locationId: string, reviewId: string): void {
    this.processedReviews.set(reviewKey, {
      reviewId,
      locationId,
      processed: true,
      processedAt: new Date().toISOString()
    });
    
    // Save to localStorage
    this.saveProcessedReviews();
  }

  private loadProcessedReviews(): void {
    try {
      const stored = localStorage.getItem('processed_reviews');
      if (stored) {
        const data = JSON.parse(stored);
        this.processedReviews = new Map(data);
      }
    } catch (error) {
      console.error('Error loading processed reviews:', error);
    }
  }

  private saveProcessedReviews(): void {
    try {
      const data = Array.from(this.processedReviews.entries());
      localStorage.setItem('processed_reviews', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving processed reviews:', error);
    }
  }

  // Configuration management
  private getEnabledConfigurations(): ReviewReplyConfig[] {
    try {
      const stored = localStorage.getItem('review_reply_configs');
      if (!stored) return [];
      
      const configs: ReviewReplyConfig[] = JSON.parse(stored);
      return configs.filter(config => config.enabled && config.autoReplyEnabled);
    } catch (error) {
      console.error('Error loading review reply configurations:', error);
      return [];
    }
  }

  public getConfiguration(locationId: string): ReviewReplyConfig | null {
    try {
      const stored = localStorage.getItem('review_reply_configs');
      if (!stored) return null;
      
      const configs: ReviewReplyConfig[] = JSON.parse(stored);
      return configs.find(config => config.locationId === locationId) || null;
    } catch (error) {
      console.error('Error getting review reply configuration:', error);
      return null;
    }
  }

  public saveConfiguration(config: ReviewReplyConfig): void {
    try {
      const stored = localStorage.getItem('review_reply_configs');
      let configs: ReviewReplyConfig[] = stored ? JSON.parse(stored) : [];
      
      // Update or add configuration
      const index = configs.findIndex(c => c.locationId === config.locationId);
      if (index >= 0) {
        configs[index] = config;
      } else {
        configs.push(config);
      }
      
      localStorage.setItem('review_reply_configs', JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving review reply configuration:', error);
    }
  }

  // Manual reply execution
  async executeManualReply(locationId: string, reviewName: string, replyText: string): Promise<void> {
    try {
      await this.postReviewReply(locationId, reviewName, replyText);
      
      toast({
        title: "Reply Posted! 💬",
        description: "Your review reply has been posted successfully",
        duration: 4000,
      });
    } catch (error) {
      console.error('Failed to post manual review reply:', error);
      
      toast({
        title: "Reply Failed ❌",
        description: `Failed to post reply: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 6000,
      });
      
      throw error;
    }
  }

  // Check if service is running
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  // Public method to generate AI reply for manual use
  async generateAIReply(params: {
    reviewText: string;
    reviewerName: string;
    rating: number;
    businessName: string;
    locationId: string;
  }): Promise<string> {
    try {
      console.log('Generating AI reply with params:', params);
      
      const response = await openaiService.generateReviewResponse(
        params.businessName,
        params.reviewText,
        params.rating
      );
      console.log('AI generated reply:', response);
      return response.trim();
      
    } catch (error) {
      console.error('Failed to generate AI reply:', error);
      // Fallback to generic replies
      return this.getGenericReply(params.rating);
    }
  }
}

// Export singleton instance
export const reviewAutomationService = new ReviewAutomationService();