import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const AuditTool = () => {
  const handleNotifyMe = () => {
    // You can implement notification logic here
    alert("We'll notify you when the Audit Tool is ready!");
  };

  return (
    <div className="h-full flex items-center justify-center p-6 overflow-hidden">
      {/* Coming Soon Card */}
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">
            Our comprehensive audit tool is under development. Get ready to analyze 
            your Google Business Profile's SEO performance with detailed insights 
            and actionable recommendations.
          </p>
          

          <Button 
            onClick={handleNotifyMe}
            className="w-full max-w-xs mx-auto"
            size="lg"
          >
            Notify Me
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTool;
