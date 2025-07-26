"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import "./Header.css";
import { useTheme } from "../ThemeContext";
import { API_ENDPOINTS } from "@/lib/api";

export default function Header() {
  //onst [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("");

  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // Obtener el usuario del localStorage
        const userData = localStorage.getItem("userFitControl");

        if (userData) {
          const user = JSON.parse(userData); //usuario del localStorage

          // Si ya tenemos el nombre en localStorage, lo usamos
          //   if (user.nombre_usuario) {
          //     setUserName(user.nombre_usuario);
          //     return;
          //   }

          // Si no, hacemos la llamada a la API
          const res = await fetch(API_ENDPOINTS.USUARIO.BASE);
          const data = await res.json();

          // Verificamos si la respuesta es un array de usuarios
          if (Array.isArray(data)) {
            const usuarioEncontrado = data.find(
              (usuario) => usuario.id_usuario === user.id
            );

            if (usuarioEncontrado) {
              setUserName(usuarioEncontrado.nombre_usuario);
              // Actualizar localStorage con los nuevos datos
              localStorage.setItem(
                "userFitControl",
                JSON.stringify({
                  ...user,
                  nombre: usuarioEncontrado.nombre_usuario,
                })
              );
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener el nombre de usuario:", error);
      }
    };

    fetchUserName();
  }, []);

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
