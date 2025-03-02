
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  icon?: LucideIcon;
}

export const NavLink = ({ href, children, className, activeClassName, icon: Icon }: NavLinkProps) => {
  const isActive = window.location.pathname === href;
  
  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
        isActive ? "bg-muted" : "hover:bg-muted/50",
        className,
        isActive && activeClassName
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
};
