import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/contexts/SessionContext";
import { useProfile } from "@/hooks/use-api-query";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { useUserProfile } = useProfile();
  const { data: profile } = useUserProfile(userId as string);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:scale-110 transition-transform">
          <Avatar className="h-8 w-8 ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary neon-text">{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-card-prominent backdrop-blur-glass border-white/20 shadow-glass" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none neon-text">{profile?.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="hover:glass-button hover:translate-y-[-2px] transition-all cursor-pointer focus:bg-primary/20 focus:text-primary">
            <Link to="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="hover:glass-button hover:translate-y-[-2px] transition-all cursor-pointer focus:bg-primary/20 focus:text-primary">
            <Link to={profile?.role === "lecturer" ? "/lecturer" : "/student"} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleSignOut} className="hover:glass-button hover:translate-y-[-2px] transition-all cursor-pointer focus:bg-primary/20 focus:text-primary">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 