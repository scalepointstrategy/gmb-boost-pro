import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";

interface InsightsTabProps {
  profileId: string;
}

const InsightsTab = ({ profileId }: InsightsTabProps) => {
  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle>Profile Insights</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Insights Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get detailed analytics about your profile performance, customer engagement, 
            and business insights. This feature is currently in development.
          </p>
          <div className="mt-6">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" />
              Feature in Development
            </Badge>
          </div>
        </div>
        
        {/* Preview of what's coming */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
          <div className="text-center p-4 border rounded-lg">
            <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-lg font-semibold">Profile Views</div>
            <div className="text-2xl font-bold text-primary">--</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-lg font-semibold">Customer Actions</div>
            <div className="text-2xl font-bold text-primary">--</div>
            <div className="text-xs text-muted-foreground">Calls, directions, etc.</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-lg font-semibold">Search Growth</div>
            <div className="text-2xl font-bold text-primary">--</div>
            <div className="text-xs text-muted-foreground">vs. last month</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsTab;