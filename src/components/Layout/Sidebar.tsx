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
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  const navItems = [
    { label: "Profiles", href: "/dashboard", icon: Building2 },
    { label: "Posts", href: "/dashboard/posts", icon: FileText },
    { label: "Reviews", href: "/dashboard/reviews", icon: Star },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    return href === "/dashboard" ? location.pathname === href : location.pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
              GMP BOOST PRO
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive: linkIsActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                "hover:bg-muted/70",
                isActive(item.href) || linkIsActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform group-hover:scale-105",
              collapsed ? "mx-auto" : ""
            )} />
            {!collapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}

        {/* Audit Tool - Locked */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-lg",
          "text-muted-foreground/50 cursor-not-allowed relative"
        )}>
          <Search className={cn(
            "h-5 w-5",
            collapsed ? "mx-auto" : ""
          )} />
          {!collapsed && (
            <>
              <span className="font-medium">Audit Tool</span>
              <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </>
          )}
        </div>
      </nav>

      {/* Upgrade Section */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-primary p-4 rounded-lg text-primary-foreground">
            <h3 className="font-semibold text-sm mb-2">Get Premium Access</h3>
            <p className="text-xs opacity-90 mb-3">
              Take your business profile management to the next level with powerful tools.
            </p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full text-primary hover:bg-white/90"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;