
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export const NavLink = ({ href, children, className, activeClassName }: NavLinkProps) => {
  const isActive = window.location.pathname === href;
  
  return (
    <Link 
      to={href} 
      className={cn(
        className,
        isActive && activeClassName
      )}
    >
      {children}
    </Link>
  );
};
