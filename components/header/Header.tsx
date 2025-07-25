"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import "./Header.css";
import { useTheme } from "../ThemeContext";

export default function Header() {
  //onst [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("");

  const { darkMode, toggleDarkMode } = useTheme();

  // Efecto para cargar el modo oscuro y usuario desde localStorage
  //   useEffect(() => {
  //     // Cargar preferencia de modo oscuro
  //     const savedMode = localStorage.getItem("darkMode") === "true";
  //     setDarkMode(savedMode);

  //     // Cargar nombre de usuario (simulado - reemplaza con tu lógica real)
  //     const user = localStorage.getItem("userName") || "Usuario";
  //     setUserName(user);

  //     // Aplicar clase de modo oscuro al body
  //     if (savedMode) {
  //       document.documentElement.classList.add("dark");
  //     } else {
  //       document.documentElement.classList.remove("dark");
  //     }
  //   }, []);

  // Manejar cambio de modo oscuro
  //   const toggleDarkMode = () => {
  //     const newMode = !darkMode;
  //     setDarkMode(newMode);
  //     localStorage.setItem("darkMode", String(newMode));

  //     if (newMode) {
  //       document.documentElement.classList.add("dark");
  //     } else {
  //       document.documentElement.classList.remove("dark");
  //     }
  //   };

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/dashboard" className="logo-link">
          FitControl
        </Link>

        <div className="user-actions">
          <div className="user-info">
            <User className="user-icon" />
            <span className="user-name">{userName}</span>
          </div>

          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label={
              darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
            }
          >
            {darkMode ? (
              <Sun className="theme-icon" />
            ) : (
              <Moon className="theme-icon" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
