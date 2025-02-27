import { BookOpen, LayoutDashboard, Users } from "lucide-react";
import { NavLink } from "./nav-link";

export const LecturerNav = () => {
  const links = [
    {
      title: "Dashboard",
      href: "/lecturer",
      icon: LayoutDashboard,
    },
    {
      title: "Courses",
      href: "/lecturer/courses",
      icon: BookOpen,
    },
    {
      title: "Students",
      href: "/lecturer/students",
      icon: Users,
    },
  ];

  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          icon={link.icon}
        >
          {link.title}
        </NavLink>
      ))}
    </nav>
  );
}; 