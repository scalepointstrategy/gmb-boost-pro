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
  ChevronRight,
  MessageSquarePlus
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

        {/* Ask for Reviews Section */}
        <div className="mt-6">
          <a 
            href="https://demo.scalepointstrategy.com/qr"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className={cn(
              "group relative overflow-hidden rounded-xl",
              "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
              "hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400",
              "shadow-lg hover:shadow-xl transition-all duration-500",
              "transform hover:scale-105 hover:-translate-y-1",
              "animate-pulse hover:animate-none",
              collapsed ? "p-3" : "p-4"
            )}>
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-3">
                <div className={cn(
                  "flex-shrink-0",
                  collapsed ? "mx-auto" : ""
                )}>
                  <MessageSquarePlus className={cn(
                    "h-6 w-6 text-white",
                    "group-hover:scale-110 group-hover:rotate-12",
                    "transition-all duration-300"
                  )} />
                </div>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-white/95 transition-colors">
                      Ask for Reviews
                    </h3>
                    <p className="text-white/80 text-xs leading-tight group-hover:text-white/90 transition-colors">
                      Generate QR codes for easy reviews
                    </p>
                  </div>
                )}
              </div>
              
              {/* Shine effect on hover */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
            </div>
          </a>
        </div>

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