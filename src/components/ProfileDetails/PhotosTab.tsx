import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image, Camera, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { googleBusinessProfileService } from '@/lib/googleBusinessProfile';

interface PhotosTabProps {
  profileId: string;
}

interface PhotoData {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  mediaFormat: string;
  category: string;
  createTime: string;
  dimensions: {
    width: number;
    height: number;
  };
}

const PhotosTab: React.FC<PhotosTabProps> = ({ profileId }) => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load photos on component mount
  useEffect(() => {
    loadPhotos();
  }, [profileId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📸 Loading photos for location:', profileId);
      const photosData = await googleBusinessProfileService.getLocationPhotos(profileId);
      
      console.log('📸 Received photos data:', photosData);
      setPhotos(photosData);
      
      if (photosData.length === 0) {
        setError('No photos found for this location. Photos can be added via Google Business Profile manager.');
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
      setError('Failed to load photos. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPhotos();
  };

  // Filter photos by category
  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  // Calculate categories with counts
  const categories = [
    { key: 'all', label: 'All Photos', count: photos.length },
    { key: 'cover', label: 'Cover', count: photos.filter(p => p.category === 'COVER').length },
    { key: 'profile', label: 'Profile', count: photos.filter(p => p.category === 'PROFILE').length },
    { key: 'exterior', label: 'Exterior', count: photos.filter(p => p.category === 'EXTERIOR').length },
    { key: 'interior', label: 'Interior', count: photos.filter(p => p.category === 'INTERIOR').length },
    { key: 'product', label: 'Product', count: photos.filter(p => p.category === 'PRODUCT').length },
    { key: 'team', label: 'Team', count: photos.filter(p => p.category === 'TEAM').length },
    { key: 'at_work', label: 'At Work', count: photos.filter(p => p.category === 'AT_WORK').length },
    { key: 'food_and_drink', label: 'Food & Drink', count: photos.filter(p => p.category === 'FOOD_AND_DRINK').length },
    { key: 'menu', label: 'Menu', count: photos.filter(p => p.category === 'MENU').length },
    { key: 'common_area', label: 'Common Area', count: photos.filter(p => p.category === 'COMMON_AREA').length },
    { key: 'rooms', label: 'Rooms', count: photos.filter(p => p.category === 'ROOMS').length },
  ].filter(category => category.count > 0 || category.key === 'all');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Business Photos
              {photos.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({photos.length} real-time)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Photos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Loading photos from Google Business Profile...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Photos not available</p>
                <p className="text-yellow-700 text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Photos Content */}
          {!loading && !error && photos.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setSelectedCategory(category.key)}
                  >
                    {category.label}
                    <span className="bg-muted px-2 py-1 rounded text-xs">
                      {category.count}
                    </span>
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group">
                    <div className="relative aspect-square">
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={`Business photo - ${photo.category}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTUwIDEyMEMyNi4xNSAxMjAgMTA1IDEzOC44NSAxMDUgMTYyQzEwNSAxODUuMTUgMTI2LjE1IDIwNCAxNTAgMjA0QzE3My44NSAyMDQgMTk1IDE4NS4xNSAxOTUgMTYyQzE5NSAxMzguODUgMTczLjg1IDEyMCAxNTAgMTIwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="mr-2"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">
                        {photo.category.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {photo.mediaFormat} • {new Date(photo.createTime).toLocaleDateString()}
                      </p>
                      {photo.dimensions.width > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {photo.dimensions.width} × {photo.dimensions.height}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* No Photos State */}
          {!loading && !error && photos.length === 0 && (
            <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Photos Found</h3>
              <p className="text-muted-foreground mb-4">
                This location doesn't have any photos yet. Add photos via Google Business Profile manager to see them here.
              </p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            </div>
          )}
          
          {/* Upload Section - Always Show */}
          <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Add More Photos</h3>
            <p className="text-muted-foreground mb-4">
              Upload high-quality photos to showcase your business via Google Business Profile manager
            </p>
            <Button disabled className="opacity-50">
              Upload via Google Business Profile
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Photo uploads are managed through Google Business Profile directly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosTab;