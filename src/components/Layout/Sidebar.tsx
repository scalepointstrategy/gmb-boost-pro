import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Star, 
  Settings, 
  Search,
  MessageSquarePlus,
  Users
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { label: "Profiles", href: "/dashboard", icon: Users },
    { label: "Posts", href: "/dashboard/posts", icon: FileText },
    { label: "Reviews", href: "/dashboard/reviews", icon: Star },
    { label: "Audit Tool", href: "/dashboard/audit", icon: Search },
  ];

  const isActive = (href: string) => {
    // Exact match for dashboard route
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    // For other routes, check if current path starts with the href
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border">
      {/* Header - Match topbar height */}
      <div className="h-16 flex items-center p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
            GMB BOOST PRO
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={() => {
              const currentlyActive = isActive(item.href);
              return cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                currentlyActive
                  ? "shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              );
            }}
            style={() => {
              const currentlyActive = isActive(item.href);
              return currentlyActive
                ? { backgroundColor: '#DBEAFE', color: '#1B29CB' }
                : {};
            }}
          >
            <item.icon 
              className="h-5 w-5 transition-transform group-hover:scale-105"
              style={
                isActive(item.href)
                  ? { color: '#1B29CB' }
                  : {}
              }
            />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}


        {/* Settings */}
        <NavLink
          to="/dashboard/settings"
          className={() => {
            const currentlyActive = isActive("/dashboard/settings");
            return cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
              currentlyActive
                ? "shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            );
          }}
          style={() => {
            const currentlyActive = isActive("/dashboard/settings");
            return currentlyActive
              ? { backgroundColor: '#DBEAFE', color: '#1B29CB' }
              : {};
          }}
        >
          <Settings 
            className="h-5 w-5 transition-transform group-hover:scale-105"
            style={
              isActive("/dashboard/settings")
                ? { color: '#1B29CB' }
                : {}
            }
          />
          <span className="font-medium">Settings</span>
        </NavLink>
      </nav>

      {/* Upgrade Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-primary p-4 rounded-lg text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquarePlus className="h-6 w-6" />
            <h3 className="font-semibold text-base">Ask for Reviews</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Generate QR codes for easy reviews
          </p>
          <a 
            href="https://demo.scalepointstrategy.com/qr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full text-primary hover:bg-white/90"
            >
              Generate QR
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;