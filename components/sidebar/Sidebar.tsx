"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import "./Sidebar.css";
import { useTheme } from "@/components/ThemeContext";
import { authService } from "@/lib/api";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Rutina", href: "/rutina" },
  { label: "Dieta", href: "/dieta" },
  { label: "Perfil", href: "/perfil" },
];

export default function Sidebar() {
  //const [darkMode, setDarkMode] = useState(false);

  const { darkMode } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      router.push("/login");
    } else {
      console.error(result.error);
      // Puedes mostrar un mensaje de error al usuario si lo deseas
    }
  };

  return (
    <>
      {/* Sidebar para desktop */}
      <aside className={`sidebar ${darkMode ? "dark" : "light"}`}>
        <div className="sidebar-header">
          <span className="logo">FitControl</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
          <div className="separator" />
          <button onClick={handleLogout} className="logout-button">
            <LogOut className="logout-icon" />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

// Componente para móviles
export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  const { darkMode } = useTheme();

  const router = useRouter();

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      setOpen(false); // Cierra el sidebar móvil
      router.push("/login");
    }
  };

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setOpen(true)}>
        <Menu className="menu-icon" />
      </button>

      {/* Overlay y sidebar móvil */}
      <div className={`mobile-sidebar-container ${open ? "open" : ""}`}>
        <div className="overlay" onClick={() => setOpen(false)} />

        <aside className={`mobile-sidebar ${darkMode ? "dark" : "light"}`}>
          <div className="sidebar-header">
            <span className="logo">FitControl</span>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="separator" />
            <button onClick={handleLogout} className="logout-button">
              <LogOut className="logout-icon" />
              <span>Cerrar sesión</span>
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
