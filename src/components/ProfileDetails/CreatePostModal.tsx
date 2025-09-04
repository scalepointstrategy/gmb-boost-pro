import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X, Building2, MousePointer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  accountName: string;
}

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (postData: any) => Promise<void>;
  profileId: string;
  availableProfiles?: Profile[];
}

const CreatePostModal = ({ open, onOpenChange, onSubmit, profileId, availableProfiles = [] }: CreatePostModalProps) => {
  const [content, setContent] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(profileId);
  const [scheduleType, setScheduleType] = useState<"now" | "1hr" | "2hr" | "3hr" | "custom">("now");
  const [customDate, setCustomDate] = useState<Date>();
  const [customTime, setCustomTime] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Button options state
  const [buttonType, setButtonType] = useState<string>("none");
  const [buttonUrl, setButtonUrl] = useState("");

  // Update selectedProfileId when profileId prop changes
  useEffect(() => {
    setSelectedProfileId(profileId);
  }, [profileId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const calculateScheduleTime = () => {
    const now = new Date();
    switch (scheduleType) {
      case "1hr":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "2hr":
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
      case "3hr":
        return new Date(now.getTime() + 3 * 60 * 60 * 1000);
      case "custom":
        if (customDate && customTime) {
          const [hours, minutes] = customTime.split(":").map(Number);
          const scheduledDate = new Date(customDate);
          scheduledDate.setHours(hours, minutes);
          return scheduledDate;
        }
        return null;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedProfileId) return;

    setLoading(true);
    try {
      const scheduleTime = calculateScheduleTime();
      const postData = {
        profileId: selectedProfileId,
        content: content.trim(),
        scheduledAt: scheduleTime?.toISOString(),
        image,
        status: scheduleType === "now" ? "published" : "scheduled",
        button: buttonType !== "none" ? {
          type: buttonType,
          url: buttonUrl
        } : null
      };

      await onSubmit(postData);
      
      // Reset form
      setContent("");
      setSelectedProfileId(profileId);
      setScheduleType("now");
      setCustomDate(undefined);
      setCustomTime("");
      setImage(null);
      setImagePreview("");
      setButtonType("none");
      setButtonUrl("");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Create and schedule a post for your business profile
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Profile Selector */}
          {availableProfiles.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="profile">Business Profile</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger>
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select a business profile" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{profile.name}</span>
                        <span className="text-xs text-muted-foreground">{profile.accountName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Post Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What would you like to share with your customers?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {content.length}/500 characters
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload" 
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload an image
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Button Options */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Add Button (Optional)
            </Label>
            <Select value={buttonType} onValueChange={setButtonType}>
              <SelectTrigger>
                <SelectValue placeholder="Select button type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Button</SelectItem>
                <SelectItem value="book">Book</SelectItem>
                <SelectItem value="order">Order Online</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="learn_more">Learn More</SelectItem>
                <SelectItem value="sign_up">Sign Up</SelectItem>
                <SelectItem value="call">Call Now</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Button URL */}
          {buttonType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="buttonUrl">Button URL</Label>
              <Input
                id="buttonUrl"
                type="url"
                placeholder="https://example.com"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                required={buttonType !== "none"}
              />
              <div className="text-xs text-muted-foreground">
                Where should the button redirect when clicked?
              </div>
            </div>
          )}

          {/* Schedule Options */}
          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="When to publish" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Post Now</SelectItem>
                <SelectItem value="1hr">In 1 Hour</SelectItem>
                <SelectItem value="2hr">In 2 Hours</SelectItem>
                <SelectItem value="3hr">In 3 Hours</SelectItem>
                <SelectItem value="custom">Custom Date & Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date/Time */}
          {scheduleType === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  required={scheduleType === "custom"}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !content.trim() || !selectedProfileId}
              className="bg-primary hover:bg-primary-hover"
            >
              {loading ? "Creating..." : scheduleType === "now" ? "Post Now" : "Schedule Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;