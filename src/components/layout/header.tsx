import { UserNav } from "./user-nav";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { BellIcon, GlobeIcon } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { formatDate, formatTime } from "@/lib/utils";
import { useState, useEffect } from "react";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "AttendBeacon" }: HeaderProps) {
  const { session } = useSession();
  const currentUser = session?.user;
  const currentDate = new Date();
  const [greeting, setGreeting] = useState('');
  
  // Format date like "Monday, March 3"
  const formattedDate = formatDate(currentDate);
  
  // Format time like "09:44 AM"
  const formattedTime = formatTime(currentDate);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b border-white/10 shadow-glass">
      <div className="flex h-16 items-center justify-between px-6">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center">
            <div className="relative flex h-8 w-8 overflow-hidden rounded-full bg-primary/20 mr-2 neon-border">
              <div className="absolute w-full h-full rounded-full animate-pulse-ring" />
              <div className="flex h-full w-full items-center justify-center">
                <GlobeIcon className="h-5 w-5 text-primary neon-text" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-shadow-glow">{title}</span>
          </Link>
          
          <motion.div 
            className="hidden md:flex flex-col ml-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="text-sm text-white/60">{greeting},</span>
            <span className="font-semibold text-white neon-text">{currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}</span>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-2 text-white/70 glass-card-subtle px-3 py-1 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span>{formattedDate}</span>
          <span className="mx-1 text-primary">•</span>
          <span className="font-semibold neon-text">{formattedTime}</span>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative glass-button hover:glass-button hover:translate-y-[-2px] transition-all">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-pulse">
              2
            </span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
              <AvatarImage src={currentUser?.image} alt={currentUser?.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary neon-text">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white">
                {currentUser?.name || "Guest"}
              </p>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 neon-border">
                {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1) || "Student"}
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
} 