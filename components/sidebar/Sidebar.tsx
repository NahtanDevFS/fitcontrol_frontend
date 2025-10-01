"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import "./Sidebar.css";
import { useTheme } from "@/components/ThemeContext";
import { authService } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Rutina", href: "/rutina" },
  { label: "Meta de peso", href: "/metas" },
  { label: "Mi estado calórico", href: "/gasto-energetico" },
  { label: "Dieta", href: "/dieta" },
  { label: "Perfil", href: "/perfil" },
];

export default function Sidebar() {
  const { darkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      router.push("/login");
    } else {
      console.error(result.error);
    }
  };

  return (
    <>
      <aside className={`sidebar ${darkMode ? "dark" : "light"}`}>
        <div className="sidebar-header">
          <span className="logo">FitControl</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
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

//Componente para teléfonos
export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  const { darkMode } = useTheme();
  const pathname = usePathname();

  const router = useRouter();

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      setOpen(false); //Cierra el sidebar móvil
      router.push("/login");
    }
  };

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setOpen(true)}>
        <Menu className="menu-icon" />
      </button>
      <div className={`mobile-sidebar-container ${open ? "open" : ""}`}>
        <div className="overlay" onClick={() => setOpen(false)} />

        <aside className={`mobile-sidebar ${darkMode ? "dark" : "light"}`}>
          <div className="sidebar-header">
            <span className="logo">FitControl</span>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
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
