import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Zap, Calendar, BarChart3, Play, Pause, TestTube, Tags, Plus, X, MapPin, Building, Hash, Tag, Edit, RefreshCw, Trash2, Sparkles, MousePointer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { automationStorage, type AutoPostingConfig, type AutoPostingStats } from '@/lib/automationStorage';
import { automationService } from '@/lib/automationService';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AutoPostingTabProps {
  location: {
    id: string;
    name: string;
    categories?: string[];
    websiteUri?: string;
    address?: {
      addressLines: string[];
      locality: string;
      administrativeArea: string;
      postalCode: string;
      countryCode: string;
    };
  };
}

export function AutoPostingTab({ location }: AutoPostingTabProps) {
  const [config, setConfig] = useState<AutoPostingConfig | null>(null);
  const [globalStats, setGlobalStats] = useState<AutoPostingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [customTimes, setCustomTimes] = useState<string[]>(['09:00']);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  // Smart keyword filtering to avoid generic terms
  const getGenericKeywordBlacklist = () => [
    'quality service', 'customer satisfaction', 'professional', 'reliable', 'trusted',
    'excellent experience', 'local business', 'community', 'best service',
    'development', 'quality', 'customer', 'service', 'professional', 'reliable',
    'trusted', 'excellent', 'experience', 'local', 'business', 'community',
    'best', 'good', 'great', 'amazing', 'awesome', 'top', 'leading', 'premier',
    'expert', 'specialists', 'solutions', 'services', 'company', 'corporation',
    'inc', 'llc', 'ltd', 'limited', 'pvt', 'private', 'consultant', 'consulting'
  ];

  // Generate business name + city keywords only
  const generateDefaultKeywords = () => {
    const keywords: string[] = [];
    const blacklist = getGenericKeywordBlacklist();
    
    // Business name keywords (prioritize these)
    if (location.name) {
      keywords.push(location.name);
      const nameParts = location.name.toLowerCase().split(/[\s\.,\-_]+/);
      nameParts.forEach(part => {
        if (part.length > 2 && !blacklist.includes(part.toLowerCase())) {
          keywords.push(part);
        }
      });
    }
    
    // Add ONLY city name from location
    if (location.address && location.address.locality) {
      keywords.push(location.address.locality);
      
      // Add business name + city combination
      if (location.name) {
        keywords.push(`${location.name} ${location.address.locality}`);
      }
    }
    
    // Filter out any remaining generic keywords and return unique ones
    return [...new Set(keywords.filter(keyword => 
      !blacklist.includes(keyword.toLowerCase().trim())
    ))];
  };
  
  const getCategoryKeywords = (category: string): string[] => {
    const blacklist = getGenericKeywordBlacklist();
    
    // More specific, non-generic category keywords
    const categoryMap: Record<string, string[]> = {
      'restaurant': ['food', 'dining', 'cuisine', 'menu', 'chef', 'kitchen'],
      'hotel': ['accommodation', 'rooms', 'hospitality', 'booking', 'stay'],
      'retail': ['shopping', 'store', 'products', 'merchandise'],
      'health': ['healthcare', 'wellness', 'medical', 'treatment', 'clinic'],
      'beauty': ['salon', 'styling', 'treatments', 'spa'],
      'automotive': ['auto', 'repair', 'maintenance', 'garage'],
      'education': ['school', 'training', 'classes', 'academy'],
      'legal': ['law', 'attorney', 'legal', 'lawyer'],
      'finance': ['financial', 'accounting', 'tax', 'investment'],
      'technology': ['tech', 'IT', 'software', 'digital'],
      'construction': ['building', 'renovation', 'contractor'],
      'fitness': ['gym', 'workout', 'fitness', 'training'],
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, keywords] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key)) {
        // Filter out any generic keywords from the category results
        return keywords.filter(keyword => 
          !blacklist.includes(keyword.toLowerCase().trim())
        );
      }
    }
    return [];
  };

  useEffect(() => {
    loadConfiguration();
    loadGlobalStats();
    
    // Listen for real-time updates
    const unsubscribeConfig = automationStorage.onConfigurationChange((locationId, updatedConfig) => {
      if (locationId === location.id) {
        setConfig(updatedConfig);
      }
    });
    
    const unsubscribeStats = automationStorage.onGlobalStatsUpdated((stats) => {
      setGlobalStats(stats);
    });
    
    const unsubscribePostSuccess = automationService.onAutoPostSuccess((event) => {
      if (event.locationId === location.id) {
        loadConfiguration(); // Refresh config to get updated stats
      }
    });
    
    const unsubscribePostError = automationService.onAutoPostError((event) => {
      if (event.locationId === location.id) {
        loadConfiguration(); // Refresh config to get updated stats
      }
    });

    return () => {
      unsubscribeConfig();
      unsubscribeStats();
      unsubscribePostSuccess();
      unsubscribePostError();
    };
  }, [location.id]);

  const loadConfiguration = () => {
    let existingConfig = automationStorage.getConfiguration(location.id);
    
    if (!existingConfig) {
      existingConfig = automationStorage.createDefaultConfiguration(location.id, location.name);
      existingConfig.categories = location.categories || [];
      existingConfig.locationName = location.name;
      existingConfig.websiteUrl = location.websiteUri;
      // Initialize with default keywords for new configs
      existingConfig.keywords = generateDefaultKeywords();
      automationStorage.saveConfiguration(existingConfig);
    } else {
      // Handle migration from string to array format for backward compatibility
      if (typeof existingConfig.keywords === 'string') {
        existingConfig.keywords = existingConfig.keywords 
          ? existingConfig.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
          : generateDefaultKeywords();
        automationStorage.saveConfiguration(existingConfig);
      }
      // If keywords is empty array, populate with defaults
      if (Array.isArray(existingConfig.keywords) && existingConfig.keywords.length === 0) {
        existingConfig.keywords = generateDefaultKeywords();
        automationStorage.saveConfiguration(existingConfig);
      }
    }
    
    setConfig(existingConfig);
    
    // Initialize keywords state based on loaded config
    if (existingConfig.keywords && Array.isArray(existingConfig.keywords)) {
      setKeywords(existingConfig.keywords);
    }
    
    // Set custom times if frequency is custom
    if (existingConfig.schedule.frequency === 'custom' && existingConfig.schedule.customTimes) {
      setCustomTimes(existingConfig.schedule.customTimes);
    }
    
    setIsLoading(false);
  };

  const loadGlobalStats = () => {
    const stats = automationStorage.getGlobalStats();
    setGlobalStats(stats);
  };


  const saveConfiguration = (updates: Partial<AutoPostingConfig>) => {
    if (!config) return;
    
    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
    automationStorage.saveConfiguration(updatedConfig);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    saveConfiguration({ enabled });
    
    if (enabled) {
      toast({
        title: "Auto-posting enabled! 🚀",
        description: `Posts will be automatically generated for ${location.name}`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Auto-posting disabled",
        description: `Automatic posting stopped for ${location.name}`,
        duration: 3000,
      });
    }
  };

  const handleFrequencyChange = (value: 'daily' | 'alternative' | 'weekly' | 'custom' | 'test30s') => {
    const newConfig = { ...config! };
    newConfig.schedule.frequency = value;
    
    // Calculate next post time based on new frequency
    const nextPost = calculateNextPost(value, newConfig.schedule.time);
    newConfig.nextPost = nextPost;
    
    saveConfiguration(newConfig);
    
    if (value === 'test30s') {
      toast({
        title: "Test mode enabled! 🧪",
        description: "Posts will be generated every 30 seconds for testing",
        duration: 4000,
      });
    }
  };

  const calculateNextPost = (frequency: string, time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextPost = new Date();
    nextPost.setHours(hours, minutes, 0, 0);
    
    switch (frequency) {
      case 'test30s':
        nextPost = new Date(now.getTime() + 30 * 1000);
        break;
      case 'daily':
        if (nextPost <= now) {
          nextPost.setDate(nextPost.getDate() + 1);
        }
        break;
      case 'alternative':
        if (nextPost <= now) {
          nextPost.setDate(nextPost.getDate() + 2);
        } else {
          nextPost.setDate(nextPost.getDate() + 1);
        }
        break;
      case 'weekly':
        if (nextPost <= now) {
          nextPost.setDate(nextPost.getDate() + 7);
        }
        break;
      case 'custom':
        if (customTimes.length > 0) {
          const times = customTimes.map(t => {
            const [h, m] = t.split(':').map(Number);
            const customTime = new Date();
            customTime.setHours(h, m, 0, 0);
            return customTime;
          }).sort((a, b) => a.getTime() - b.getTime());
          
          const nextTimeToday = times.find(t => t > now);
          nextPost = nextTimeToday || times[0];
          if (!nextTimeToday) {
            nextPost.setDate(nextPost.getDate() + 1);
          }
        }
        break;
    }
    
    return nextPost.toISOString();
  };

  const handleTimeChange = (time: string) => {
    const newConfig = { ...config! };
    newConfig.schedule.time = time;
    newConfig.nextPost = calculateNextPost(newConfig.schedule.frequency, time);
    saveConfiguration(newConfig);
  };

  const handleCustomTimesChange = (times: string[]) => {
    setCustomTimes(times);
    const newConfig = { ...config! };
    newConfig.schedule.customTimes = times;
    newConfig.nextPost = calculateNextPost(newConfig.schedule.frequency, newConfig.schedule.time);
    saveConfiguration(newConfig);
  };

  const addCustomTime = () => {
    const newTimes = [...customTimes, '09:00'];
    handleCustomTimesChange(newTimes);
  };

  const removeCustomTime = (index: number) => {
    const newTimes = customTimes.filter((_, i) => i !== index);
    handleCustomTimesChange(newTimes);
  };

  const addKeyword = () => {
    const trimmedKeyword = newKeyword.trim();
    const blacklist = getGenericKeywordBlacklist();
    
    if (!trimmedKeyword) return;
    
    // Check if keyword is generic
    if (blacklist.includes(trimmedKeyword.toLowerCase())) {
      toast({
        title: "Generic Keyword Avoided",
        description: `"${trimmedKeyword}" is too generic. Try using your business name or location instead.`,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    // Check if keyword already exists
    if (keywords.includes(trimmedKeyword)) {
      toast({
        title: "Keyword Already Exists",
        description: `"${trimmedKeyword}" is already in your keywords.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const updatedKeywords = [...keywords, trimmedKeyword];
    setKeywords(updatedKeywords);
    updateKeywordsInConfig(updatedKeywords);
    setNewKeyword('');
    toast({
      title: "Keyword Added! ✅",
      description: `Added "${trimmedKeyword}" to your keywords`,
      duration: 2000,
    });
  };
  
  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(keyword => keyword !== keywordToRemove);
    setKeywords(updatedKeywords);
    updateKeywordsInConfig(updatedKeywords);
    toast({
      title: "Keyword Removed",
      description: `Removed "${keywordToRemove}" from your keywords`,
      duration: 2000,
    });
  };
  
  const updateKeywordsInConfig = (keywords: string[]) => {
    saveConfiguration({ keywords: keywords });
  };
  
  const resetToDefaultKeywords = () => {
    const defaultKeywords = generateDefaultKeywords();
    setKeywords(defaultKeywords);
    updateKeywordsInConfig(defaultKeywords);
    toast({
      title: "Keywords Reset",
      description: "Keywords have been reset to default location and category-based keywords.",
    });
  };

  const generateAndSetKeywords = () => {
    const defaultKeywords = generateDefaultKeywords();
    setKeywords(defaultKeywords);
    updateKeywordsInConfig(defaultKeywords);
    toast({
      title: "Keywords Generated! 🎯",
      description: "Smart keywords generated focusing on your business name and location.",
      duration: 3000,
    });
  };

  const cleanUpGenericKeywords = () => {
    const blacklist = getGenericKeywordBlacklist();
    const cleanedKeywords = keywords.filter(keyword => 
      !blacklist.includes(keyword.toLowerCase().trim())
    );
    
    const removedCount = keywords.length - cleanedKeywords.length;
    
    if (removedCount > 0) {
      setKeywords(cleanedKeywords);
      updateKeywordsInConfig(cleanedKeywords);
      toast({
        title: "Keywords Cleaned! 🧹",
        description: `Removed ${removedCount} generic keyword${removedCount > 1 ? 's' : ''}.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "All Good! ✅",
        description: "No generic keywords found to remove.",
        duration: 2000,
      });
    }
  };

  const handleTestNow = async () => {
    if (!config) return;
    
    setIsTesting(true);
    
    try {
      const result = await automationService.executeManualPost(location.id);
      
      if (result.success) {
        toast({
          title: "Test post successful! ✅",
          description: "Your post has been published to Google Business Profile",
          duration: 5000,
        });
      } else {
        toast({
          title: "Test post failed ❌",
          description: result.error || "Failed to publish post",
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (error) {
      toast({
        title: "Test post failed ❌",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getNextPostTime = () => {
    if (!config?.nextPost) return 'Not scheduled';
    
    if (config.schedule.frequency === 'test30s') {
      if (config.lastPost) {
        const lastPost = new Date(config.lastPost);
        const nextPost = new Date(lastPost.getTime() + 30 * 1000);
        const now = new Date();
        
        if (nextPost <= now) {
          return 'Ready to post';
        }
        
        const secondsRemaining = Math.ceil((nextPost.getTime() - now.getTime()) / 1000);
        return `${secondsRemaining}s remaining`;
      } else {
        return 'Ready to post';
      }
    }
    
    const nextPost = new Date(config.nextPost);
    const now = new Date();
    
    if (nextPost <= now) {
      return 'Ready to post';
    }
    
    return nextPost.toLocaleString();
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'alternative': return 'Alternative Days';
      case 'weekly': return 'Weekly';
      case 'custom': return 'Custom Schedule';
      case 'test30s': return 'Test (30 seconds)';
      default: return frequency;
    }
  };

  // Computed custom keywords for the UI
  const customKeywords = React.useMemo(() => {
    const allDefaultKeywords = generateDefaultKeywords();
    return keywords.filter(keyword => !allDefaultKeywords.includes(keyword));
  }, [keywords, location.name, location.categories]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <LoadingSpinner size="lg" variant="primary" />
        <div className="text-center space-y-2">
          <h3 className="font-medium text-lg">Loading Automation Settings...</h3>
          <p className="text-sm text-muted-foreground">Setting up your auto-posting configuration</p>
        </div>
        
        {/* Loading skeleton for automation cards */}
        <div className="w-full max-w-4xl mt-8 space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                    <div className="h-5 bg-muted rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
                </div>
                <div className="h-3 bg-muted rounded w-64 animate-pulse mt-2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-24 bg-muted rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      {globalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Today's Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{globalStats.successfulPostsToday}</div>
                <div className="text-sm text-muted-foreground">Successful Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{globalStats.failedPostsToday}</div>
                <div className="text-sm text-muted-foreground">Failed Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{globalStats.activeConfigurations}</div>
                <div className="text-sm text-muted-foreground">Active Locations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{globalStats.totalPostsToday}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto Posting Configuration
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={handleToggleEnabled}
              />
              <span className="text-sm font-medium">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Automatically generate and publish posts for {location.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input value={config.businessName} disabled />
            </div>
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {config.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">{category}</Badge>
                ))}
                {config.categories.length === 0 && (
                  <Badge variant="outline">No categories</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Keywords Management */}
          <div>
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Keywords for Content Generation
            </Label>
            <Tabs defaultValue="all" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Keywords</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              {/* All Keywords Tab */}
              <TabsContent value="all" className="space-y-4">
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border min-h-[120px]">
                  {keywords.map((keyword, index) => {
                    const defaultKeywords = generateDefaultKeywords();
                    const isAutoGenerated = defaultKeywords.includes(keyword);
                    
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <Badge 
                          variant={isAutoGenerated ? "default" : "outline"}
                          className="flex items-center gap-1"
                        >
                          {isAutoGenerated && <Hash className="h-3 w-3" />}
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            disabled={!config.enabled}
                            className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </div>
                    );
                  })}
                  {keywords.length === 0 && (
                    <p className="text-muted-foreground text-sm">No keywords added yet. Click "Generate Keywords" to auto-populate based on your business profile.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAndSetKeywords}
                    disabled={!config.enabled}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate Keywords
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={cleanUpGenericKeywords}
                    disabled={!config.enabled}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Clean Generic
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setKeywords([])}
                    disabled={!config.enabled}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Smart keyword generation focuses on your business name ({location.name}), location ({location.address?.locality}, {location.address?.administrativeArea}), and specific categories while filtering out generic terms like "quality service", "professional", etc.
                </p>
              </TabsContent>

              {/* Custom Keywords Tab */}
              <TabsContent value="custom" className="space-y-4">
                <div className="flex flex-wrap gap-2 p-4 bg-green-50 rounded-lg border min-h-[120px]">
                  {customKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          disabled={!config.enabled}
                          className="ml-1 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                  {customKeywords.length === 0 && (
                    <p className="text-muted-foreground text-sm">No custom keywords added yet. Add your own keywords below.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a custom keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    disabled={!config.enabled}
                  />
                  <Button 
                    type="button" 
                    onClick={addKeyword} 
                    size="sm"
                    disabled={!config.enabled || !newKeyword.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add custom keywords that represent your business, values, or specific services not covered by location/category keywords.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Button Configuration */}
          <div>
            <Label className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Post Button Settings
            </Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.button?.enabled ?? true}
                  onCheckedChange={(enabled) => saveConfiguration({
                    button: { ...config.button, enabled, type: config.button?.type || 'auto' }
                  })}
                  disabled={!config.enabled}
                />
                <span className="text-sm font-medium">
                  Add buttons to posts
                </span>
              </div>
              
              {config.button?.enabled && (
                <div className="space-y-3 ml-6">
                  <div>
                    <Label htmlFor="buttonType">Button Type</Label>
                    <Select
                      value={config.button?.type || 'auto'}
                      onValueChange={(value: 'auto' | 'book' | 'order' | 'buy' | 'learn_more' | 'sign_up' | 'call') => 
                        saveConfiguration({
                          button: { ...config.button, enabled: config.button?.enabled ?? true, type: value }
                        })
                      }
                      disabled={!config.enabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🎯 Smart Selection (Recommended)</SelectItem>
                        <SelectItem value="book">📅 Book</SelectItem>
                        <SelectItem value="order">🍽️ Order Online</SelectItem>
                        <SelectItem value="buy">🛒 Buy</SelectItem>
                        <SelectItem value="learn_more">ℹ️ Learn More</SelectItem>
                        <SelectItem value="sign_up">✍️ Sign Up</SelectItem>
                        <SelectItem value="call">📞 Call Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.button?.type !== 'auto' && (
                    <div>
                      <Label htmlFor="buttonUrl">Button URL (Optional)</Label>
                      <Input
                        id="buttonUrl"
                        type="url"
                        placeholder={config.websiteUrl || "https://example.com"}
                        value={config.button?.customUrl || ''}
                        onChange={(e) => saveConfiguration({
                          button: { ...config.button, enabled: config.button?.enabled ?? true, type: config.button?.type || 'learn_more', customUrl: e.target.value }
                        })}
                        disabled={!config.enabled}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Leave empty to use website URL: {config.websiteUrl || 'Not set'}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                    {config.button?.type === 'auto' ? (
                      <div>
                        <strong>🎯 Smart Selection:</strong> Automatically chooses the best button based on your business category:
                        <ul className="mt-1 ml-4 list-disc">
                          <li>Restaurants → Order Online</li>
                          <li>Salons/Health → Book Appointment</li>
                          <li>Retail → Shop Now</li>
                          <li>Education → Sign Up</li>
                          <li>Others → Learn More</li>
                        </ul>
                      </div>
                    ) : (
                      `All posts will include a "${config.button?.type?.replace('_', ' ')}" button that redirects to your specified URL.`
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Schedule Configuration */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Posting Schedule
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={config.schedule.frequency}
                  onValueChange={handleFrequencyChange}
                  disabled={!config.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="alternative">Alternative Days</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                    <SelectItem value="test30s">🧪 Test (30 seconds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.schedule.frequency !== 'custom' && config.schedule.frequency !== 'test30s' && (
                <div>
                  <Label htmlFor="time">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Post Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={config.schedule.time}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={!config.enabled}
                  />
                </div>
              )}
            </div>

            {/* Custom Times */}
            {config.schedule.frequency === 'custom' && (
              <div className="mt-4">
                <Label>Custom Post Times</Label>
                <div className="space-y-2 mt-2">
                  {customTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...customTimes];
                          newTimes[index] = e.target.value;
                          handleCustomTimesChange(newTimes);
                        }}
                        disabled={!config.enabled}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCustomTime(index)}
                        disabled={!config.enabled || customTimes.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomTime}
                    disabled={!config.enabled}
                  >
                    Add Time
                  </Button>
                </div>
              </div>
            )}

            {/* Test Mode Warning */}
            {config.schedule.frequency === 'test30s' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <TestTube className="h-4 w-4" />
                  <strong>Test Mode Active</strong>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Posts will be generated every 30 seconds. Remember to switch back to a normal schedule after testing!
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Status and Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Next Post</Label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {getNextPostTime()}
              </div>
            </div>
            <div>
              <Label>Current Status</Label>
              <div className="mt-1 flex items-center gap-2">
                {config.enabled ? (
                  <>
                    <Play className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Active</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Paused</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleTestNow}
              disabled={!config.enabled || isTesting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Test & Post Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Location Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{config.stats.totalPosts}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{config.stats.successfulPosts}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{config.stats.failedPosts}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {config.stats.totalPosts > 0 ? Math.round((config.stats.successfulPosts / config.stats.totalPosts) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          {config.lastPost && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Last post: {new Date(config.lastPost).toLocaleString()}
                {config.stats.lastPostStatus && (
                  <Badge 
                    variant={config.stats.lastPostStatus === 'success' ? 'default' : 'destructive'} 
                    className="ml-2"
                  >
                    {config.stats.lastPostStatus === 'success' ? '✅ Success' : '❌ Failed'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}