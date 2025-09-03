import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image, Camera, Trash2 } from 'lucide-react';

interface PhotosTabProps {
  profileId: string;
}

const PhotosTab: React.FC<PhotosTabProps> = ({ profileId }) => {
  // Mock photo data
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300', title: 'Storefront', category: 'exterior' },
    { id: 2, url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300', title: 'Interior', category: 'interior' },
    { id: 3, url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300', title: 'Products', category: 'products' },
    { id: 4, url: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=300', title: 'Team', category: 'team' },
    { id: 5, url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300', title: 'Service', category: 'services' },
    { id: 6, url: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=300', title: 'Workspace', category: 'interior' },
  ];

  const categories = [
    { key: 'all', label: 'All Photos', count: photos.length },
    { key: 'exterior', label: 'Exterior', count: photos.filter(p => p.category === 'exterior').length },
    { key: 'interior', label: 'Interior', count: photos.filter(p => p.category === 'interior').length },
    { key: 'products', label: 'Products', count: photos.filter(p => p.category === 'products').length },
    { key: 'team', label: 'Team', count: photos.filter(p => p.category === 'team').length },
    { key: 'services', label: 'Services', count: photos.filter(p => p.category === 'services').length },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Business Photos
            </CardTitle>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Photos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.key}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {category.label}
                <span className="bg-muted px-2 py-1 rounded text-xs">
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="mr-2">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{photo.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{photo.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-6 border-2 border-dashed border-muted rounded-lg text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Add More Photos</h3>
            <p className="text-muted-foreground mb-4">
              Upload high-quality photos to showcase your business
            </p>
            <Button>Choose Files</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosTab;