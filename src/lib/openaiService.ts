interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface PostContent {
  content: string;
  callToAction?: {
    actionType: 'LEARN_MORE' | 'BOOK' | 'ORDER' | 'SHOP' | 'SIGN_UP';
    url?: string;
  };
}

export class OpenAIService {
  private subscriptionKey: string;
  private endpoint: string;
  private deployment: string;
  private apiVersion: string;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests

  constructor() {
    // Load Azure OpenAI configuration from environment variables
    this.subscriptionKey = import.meta.env.VITE_AZURE_OPENAI_KEY || '';
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '';
    this.deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || '';
    this.apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '';
    
    if (!this.subscriptionKey || !this.endpoint || !this.deployment || !this.apiVersion) {
      console.warn('⚠️ Azure OpenAI configuration not found in environment variables - will use fallback content');
      console.warn('💡 To enable AI-generated content, please set Azure OpenAI variables in your .env file:');
      console.warn('   - VITE_AZURE_OPENAI_KEY');
      console.warn('   - VITE_AZURE_OPENAI_ENDPOINT');
      console.warn('   - VITE_AZURE_OPENAI_DEPLOYMENT');
      console.warn('   - VITE_AZURE_OPENAI_API_VERSION');
      console.warn('📖 See ENVIRONMENT_SETUP.md for detailed instructions');
    }
    
    if (this.subscriptionKey && this.endpoint && this.deployment && this.apiVersion) {
      console.log('✅ Azure OpenAI configuration loaded successfully');
      console.log('🔑 Endpoint:', this.endpoint);
      console.log('🚀 Deployment:', this.deployment);
      console.log('📅 API Version:', this.apiVersion);
      console.log('🔑 Subscription key preview:', this.subscriptionKey.substring(0, 8) + '...');
      
      // Test the API configuration validity
      this.testApiKey().catch(error => {
        console.warn('⚠️ Azure OpenAI API test failed:', error.message);
      });
    }
  }

  // Test Azure OpenAI API configuration validity
  private async testApiKey(): Promise<boolean> {
    if (!this.subscriptionKey || !this.endpoint || !this.deployment || !this.apiVersion) return false;
    
    try {
      console.log('🧪 Testing Azure OpenAI API configuration...');
      
      // Test with a simple completion request
      const testUrl = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'api-key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          temperature: 0
        }),
      });

      if (response.ok || response.status === 400) { // 400 is OK for this test (means API is accessible)
        console.log('✅ Azure OpenAI API configuration is valid and working!');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Azure OpenAI API test failed:', response.status, errorData);
        
        if (response.status === 401) {
          console.error('🔑 CRITICAL: Your Azure OpenAI API key is invalid or expired!');
          console.error('📋 Possible issues:');
          console.error('   • Subscription key is incorrect or has typos');
          console.error('   • Key has been revoked or expired');
          console.error('   • Endpoint URL is incorrect');
          console.error('   • Deployment name is incorrect');
          console.error('   • API version is not supported');
          console.error('🔗 Check your Azure OpenAI resource in the Azure portal');
        }
        
        return false;
      }
    } catch (error) {
      console.error('🚨 Error testing Azure OpenAI API:', error);
      return false;
    }
  }

  private async rateLimitedRequest(url: string, options: any): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        console.log('⚠️ Rate limited by OpenAI, implementing exponential backoff...');
        const retryAfter = response.headers.get('retry-after');
        const backoffTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        console.log(`⏳ Waiting ${backoffTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Retry the request (inherit signal from original options)
        this.lastRequestTime = Date.now();
        return fetch(url, options);
      }
      
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏰ OpenAI API request timed out');
        throw new Error('OpenAI API request timed out - falling back to template content');
      }
      console.error('🚨 OpenAI API request failed:', error);
      throw error;
    }
  }

  // Hardcoded fallback content templates
  private getFallbackContent(businessName: string, category: string, keywords: string | string[]): PostContent {
    const keywordArray = typeof keywords === 'string' 
      ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : keywords;

    const templates = [
      `🌟 Thank you to all our amazing customers for making ${businessName} what it is today! Your support means everything to us. Come experience our exceptional ${keywordArray.join(' and ')} - we're committed to providing quality service that exceeds your expectations. Visit us today!`,
      
      `📍 Looking for ${keywordArray[0] || 'quality service'}? ${businessName} is your trusted ${category} destination! We specialize in ${keywordArray.slice(0, 3).join(', ')} and pride ourselves on customer satisfaction. Experience the difference that personalized service makes!`,
      
      `💼 At ${businessName}, we believe in building lasting relationships with our community. Our team is dedicated to providing exceptional ${keywordArray[0] || 'service'} with attention to detail. Come discover why customers choose us for ${keywordArray.slice(0, 2).join(' and ')}!`,
      
      `🔥 Exciting things are happening at ${businessName}! We're proud to offer top-quality ${keywordArray[0] || 'service'} with ${keywordArray[1] || 'professional excellence'}. Our experienced team is here to help with all your ${category} needs. Visit us today!`,
      
      `👥 Our team at ${businessName} is dedicated to exceeding your expectations. We combine ${keywordArray[0] || 'quality'} with ${keywordArray[1] || 'professionalism'} to deliver outstanding results. Experience why we're the preferred choice for ${keywordArray[2] || 'reliable service'}!`,
      
      `✨ What makes ${businessName} special? Our commitment to ${keywordArray[0] || 'excellence'} and ${keywordArray[1] || 'customer care'}! We're passionate about what we do and it shows in every interaction. Stop by and experience the ${businessName} difference!`,
      
      `💪 Ready for ${keywordArray[0] || 'exceptional service'}? ${businessName} has been proudly serving our community with ${keywordArray.slice(0, 2).join(' and ')}. Our experienced team is here to help you succeed. Contact us today to get started!`,
      
      `🎯 Need ${keywordArray[0] || 'professional service'}? Look no further than ${businessName}! We offer comprehensive ${keywordArray.slice(0, 3).join(', ')} solutions tailored to your needs. Let us show you why quality matters!`,
      
      `🏆 ${businessName} - where ${keywordArray[0] || 'quality'} meets ${keywordArray[1] || 'service'}! Our dedicated team is committed to providing exceptional ${category} solutions. Join our satisfied customers and experience excellence today!`,
      
      `🌈 Discover what makes ${businessName} your best choice for ${keywordArray[0] || 'quality service'}! We combine expertise, reliability, and ${keywordArray[1] || 'customer focus'} to deliver results that matter. Visit us and see the difference!`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      content: randomTemplate,
      callToAction: {
        actionType: 'LEARN_MORE' as const
      }
    };
  }

  async generatePostContent(
    businessName: string,
    category: string,
    keywords: string | string[],
    locationName?: string
  ): Promise<PostContent> {
    // Validate inputs
    if (!businessName || businessName.trim() === '') {
      console.warn('⚠️ Business name is required, using fallback content');
      return this.getFallbackContent('Your Business', category || 'business', keywords || []);
    }

    if (!this.subscriptionKey || !this.endpoint || !this.deployment || !this.apiVersion) {
      console.warn('⚠️ Azure OpenAI not configured, using high-quality template content');
      console.warn('🎨 Template content is professionally crafted and will work perfectly');
      console.warn('💡 To enable AI-generated content, add your Azure OpenAI configuration to the .env file');
      console.warn('🔗 Set up Azure OpenAI in your Azure portal');
      return this.getFallbackContent(businessName, category, keywords);
    }

    // Convert keywords to array format if string is provided
    const keywordArray = typeof keywords === 'string' 
      ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : keywords;

    // Format keywords for better AI understanding
    const keywordText = keywordArray.length > 0 
      ? keywordArray.join(', ')
      : 'quality service, customer satisfaction';

    const prompt = `Create an engaging Google Business Profile post for "${businessName}", a ${category} business${locationName ? ` in ${locationName}` : ''}. 

Key requirements:
- MUST incorporate these specific keywords naturally: ${keywordText}
- Use at least 3-5 of these keywords throughout the post
- Keep it under 120 words maximum
- Make it engaging and professional
- Include a clear call-to-action
- Don't use hashtags
- Write in a conversational tone
- Highlight what makes this business unique
- Make the keywords feel natural, not forced

Generate ONLY the post content, no additional text or formatting.`;

    console.log('🤖 Generating content with Azure OpenAI...');
    console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const azureUrl = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
      
      const response = await this.rateLimitedRequest(azureUrl, {
        method: 'POST',
        headers: {
          'api-key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional social media content creator specializing in Google Business Profile posts. Generate engaging, keyword-focused content under 120 words maximum.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 120,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🚨 OpenAI API Error:', response.status, errorData);
        
        // Handle specific error cases
        if (response.status === 401) {
          console.error('🔑 API Key Issue - Your Azure OpenAI subscription key is invalid or expired');
          console.error('💡 Solutions:');
          console.error('   1. Check your subscription key in the Azure portal');
          console.error('   2. Verify the endpoint URL is correct');
          console.error('   3. Ensure the deployment name matches your Azure OpenAI deployment');
          console.error('   4. Check the API version is supported');
          throw new Error(`Azure OpenAI API key is invalid or expired. Please check your Azure OpenAI configuration.`);
        } else if (response.status === 429) {
          console.error('🚫 Rate limit exceeded - too many requests');
          throw new Error(`Azure OpenAI rate limit exceeded. Please try again later.`);
        } else if (response.status === 403) {
          console.error('🚫 Access denied - insufficient permissions');
          throw new Error(`Azure OpenAI access denied. Check your subscription and permissions.`);
        }
        
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content generated by Azure OpenAI');
      }

      console.log('✅ Content generated successfully with Azure OpenAI');
      console.log('📝 Generated content:', content.substring(0, 100) + '...');

      // Return with a simple call-to-action
      return {
        content,
        callToAction: {
          actionType: 'LEARN_MORE' as const
        }
      };

    } catch (error) {
      console.error('🚨 Failed to generate content with Azure OpenAI, falling back to template content:', error);
      console.warn('🎨 Using high-quality template content instead - your posts will still be great!');
      return this.getFallbackContent(businessName, category, keywords);
    }
  }

  // Public method to test API key validity
  public async validateApiKey(): Promise<boolean> {
    return await this.testApiKey();
  }

  // Get Azure OpenAI configuration status
  public getApiKeyStatus(): { configured: boolean; format: string; preview: string } {
    const isConfigured = !!(this.subscriptionKey && this.endpoint && this.deployment && this.apiVersion);
    return {
      configured: isConfigured,
      format: isConfigured ? 'Azure OpenAI' : 'None',
      preview: isConfigured ? 
        `Endpoint: ${this.endpoint}, Deployment: ${this.deployment}` : 
        'Not configured'
    };
  }

  // Hardcoded fallback review responses
  private getFallbackReviewResponse(businessName: string, reviewRating: number): string {
    if (reviewRating >= 4) {
      const positiveResponses = [
        `Thank you so much for your wonderful review! We're thrilled that you had a great experience with ${businessName}. Your feedback motivates our team to continue providing excellent service. We look forward to serving you again soon! 🌟`,
        `We're delighted to hear about your positive experience! Thank you for taking the time to share your feedback about ${businessName}. It means a lot to our team. We can't wait to welcome you back! ⭐`,
        `Your kind words truly made our day! We're so happy we could provide you with exceptional service at ${businessName}. Thank you for this amazing review. See you again soon! 😊`
      ];
      return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    } else if (reviewRating === 3) {
      const neutralResponses = [
        `Thank you for your feedback about ${businessName}. We appreciate you taking the time to share your experience. We're always looking for ways to improve, and your input is valuable to us. Please don't hesitate to reach out if there's anything specific we can do better. 👍`,
        `We appreciate your honest review of ${businessName}. Your experience matters to us, and we'd love the opportunity to make it even better next time. Please feel free to contact us directly to discuss how we can improve. Thank you for giving us a chance! 🤝`
      ];
      return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
    } else {
      const negativeResponses = [
        `Thank you for bringing this to our attention. We sincerely apologize that your experience at ${businessName} didn't meet your expectations. Your feedback is important to us, and we'd like the opportunity to make this right. Please contact us directly so we can discuss this further and improve. 🙏`,
        `We're truly sorry to hear about your experience with ${businessName}. This is not the level of service we strive to provide. We take your feedback seriously and would appreciate the chance to discuss this with you directly to ensure this doesn't happen again. Please reach out to us. 🤝`
      ];
      return negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
    }
  }

  async generateReviewResponse(
    businessName: string,
    reviewText: string,
    reviewRating: number
  ): Promise<string> {
    if (!this.subscriptionKey || !this.endpoint || !this.deployment || !this.apiVersion) {
      console.warn('⚠️ Azure OpenAI not configured, using fallback review response');
      return this.getFallbackReviewResponse(businessName, reviewRating);
    }

    const tone = reviewRating >= 4 ? 'grateful and professional' : 'understanding and solution-focused';
    const prompt = `Generate a professional response to this Google Business review for "${businessName}":

Review (${reviewRating}/5 stars): "${reviewText}"

Requirements:
- Keep response under 120 words maximum
- Be ${tone}
- ${reviewRating >= 4 ? 'Thank them for their positive feedback' : 'Acknowledge their concerns and offer to resolve issues'}
- Include the business name naturally
- Be authentic and personalized
- ${reviewRating < 4 ? 'Offer to discuss offline if appropriate' : 'Invite them to return'}

Generate ONLY the response text, no additional formatting.`;

    try {
      const azureUrl = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
      
      const response = await this.rateLimitedRequest(azureUrl, {
        method: 'POST',
        headers: {
          'api-key': this.subscriptionKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional customer service representative responding to Google Business reviews. Be authentic, helpful, and appropriately emotional. Keep responses under 120 words.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 120,
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No response generated by Azure OpenAI');
      }

      return content;

    } catch (error) {
      console.error('🚨 Failed to generate review response with Azure OpenAI, falling back to hardcoded response:', error);
      console.warn('📝 Using fallback review response generation...');
      return this.getFallbackReviewResponse(businessName, reviewRating);
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).openaiService = openaiService;
  (window as any).testAzureOpenAI = async () => {
    console.log('🧪 Manual Azure OpenAI API Test');
    const status = openaiService.getApiKeyStatus();
    console.log('📊 API Configuration Status:', status);
    
    if (status.configured) {
      console.log('🔍 Testing API configuration validity...');
      const isValid = await openaiService.validateApiKey();
      console.log(isValid ? '✅ Azure OpenAI is working!' : '❌ Azure OpenAI failed test');
      
      if (isValid) {
        console.log('🎯 Testing content generation...');
        try {
          const content = await openaiService.generatePostContent(
            'Test Business',
            'service',
            ['quality', 'professional', 'reliable'],
            'Test Location'
          );
          console.log('✅ Content generated successfully:', content.content.substring(0, 100) + '...');
        } catch (error) {
          console.error('❌ Content generation failed:', error.message);
        }
      }
    } else {
      console.warn('⚠️ Azure OpenAI not configured');
    }
  };
  
  console.log('🛠️ Azure OpenAI Debug Tools Available:');
  console.log('   window.openaiService - Access the service directly');
  console.log('   window.testAzureOpenAI() - Run comprehensive API test');
}