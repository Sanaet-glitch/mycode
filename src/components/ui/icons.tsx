import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart,
  GraduationCap,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Menu,
  Users,
  BookOpen,
  ClipboardCheck,
  type LucideIcon
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart,
  GraduationCap,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Menu,
  Users,
  BookOpen,
  ClipboardCheck,
} as const;

export type IconKey = keyof typeof Icons; 