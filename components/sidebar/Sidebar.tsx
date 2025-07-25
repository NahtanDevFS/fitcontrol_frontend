"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import "./Sidebar.css";
import { useTheme } from "@/components/ThemeContext";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Rutina", href: "/rutina" },
  { label: "Dieta", href: "/dieta" },
  { label: "Perfil", href: "/perfil" },
];

export default function Sidebar() {
  //const [darkMode, setDarkMode] = useState(false);

  const { darkMode } = useTheme();

  //   useEffect(() => {
  //     // Sincronizar con el estado del tema del Header
  //     const handleStorageChange = () => {
  //       const mode = localStorage.getItem("darkMode") === "true";
  //       //setDarkMode(mode);
  //       document.documentElement.classList.toggle("dark", mode);
  //     };

  //     // Verificar el tema al cargar
  //     handleStorageChange();

  //     // Escuchar cambios en el tema
  //     window.addEventListener("storage", handleStorageChange);
  //     return () => window.removeEventListener("storage", handleStorageChange);
  //   }, []);

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
        </nav>
      </aside>

      {/* Sidebar para móviles */}
      {/*<SidebarMobile darkMode={darkMode} />*/}
    </>
  );
}

// Componente para móviles
export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  const { darkMode } = useTheme();

  //   useEffect(() => {
  //     // Sincronizar con el estado del tema del Header
  //     const handleStorageChange = () => {
  //       const mode = localStorage.getItem("darkMode") === "true";
  //       setDarkMode(mode);
  //       document.documentElement.classList.toggle("dark", mode);
  //     };

  //     // Verificar el tema al cargar
  //     handleStorageChange();

  //     // Escuchar cambios en el tema
  //     window.addEventListener("storage", handleStorageChange);
  //     return () => window.removeEventListener("storage", handleStorageChange);
  //   }, []);

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
          </nav>
        </aside>
      </div>
    </>
  );
}
