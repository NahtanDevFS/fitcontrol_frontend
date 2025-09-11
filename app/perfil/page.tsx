// app/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
//import { supabase } from "@/lib/supabase";
import "./perfil.css"; // Crearemos este archivo de estilos
import { useTheme } from "@/components/ThemeContext";
import Swal from "sweetalert2";
import { ProfileData } from "@/types";
import { profileService } from "@/services/ProfileService";

// --- TIPOS ---
interface UserInfo {
  id: string;
  nombre: string;
  email: string;
}

// --- COMPONENTE PRINCIPAL ---
export default function PerfilPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchInitialData = async () => {
      const storedUser = localStorage.getItem("userFitControl");
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);

      // --- 3. ÚNICA LLAMADA A LA API ---
      const response = await profileService.getProfileData(userData.id);
      if (response.success && response.data) {
        setProfileData(response.data);
        setNuevoNombre(response.data.nombre_usuario);
      } else {
        console.error("Error al cargar los datos del perfil:", response.error);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleUpdateNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !nuevoNombre.trim() || !profileData) return;

    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

    // Llamada a la API a través del servicio
    const response = await profileService.updateUser(userId, {
      nombre_usuario: nuevoNombre.trim(),
    });

    if (response.success && response.data) {
      // Ahora TypeScript sabe que response.data es de tipo Usuario
      const updatedUser = response.data;

      // Actualizar el estado local con la respuesta de la API
      setProfileData((prev) =>
        prev ? { ...prev, nombre_usuario: updatedUser.nombre_usuario } : null
      );

      // Actualizar localStorage para mantener la consistencia en la app
      const storedUser = localStorage.getItem("userFitControl");
      if (storedUser) {
        const userData: UserInfo = JSON.parse(storedUser);
        // Actualizamos el nombre en el objeto antes de guardarlo de nuevo
        userData.nombre = updatedUser.nombre_usuario;
        localStorage.setItem("userFitControl", JSON.stringify(userData));
      }

      setIsEditing(false);
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Actualizado!",
        text: "Tu nombre de usuario ha sido cambiado.",
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el nombre: " + response.error,
      });
    }
  };

  const handleUpdateUnidadPeso = async (nuevaUnidad: "kg" | "lbs") => {
    if (!userId || !profileData) return;

    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

    // Actualización optimista de la UI para una respuesta instantánea
    setProfileData({ ...profileData, unidad_peso: nuevaUnidad });

    const response = await profileService.updateUser(userId, {
      unidad_peso: nuevaUnidad,
    });

    if (!response.success) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar tu preferencia. Inténtalo de nuevo.",
      });
      // Si falla, revertimos el cambio en la UI
      setProfileData({
        ...profileData,
        unidad_peso: nuevaUnidad === "kg" ? "lbs" : "kg",
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  //Lógica para mostrar el peso convertido ---
  const pesoMostrado =
    profileData?.unidad_peso === "lbs" && profileData.peso_actual
      ? (profileData.peso_actual * 2.20462).toFixed(1)
      : profileData?.peso_actual;

  return (
    <div className="profile-container">
      <header className="page-header">
        <h1>Mi Perfil</h1>
      </header>

      <div className="profile-card">
        <div className="profile-info">
          <div className="info-item">
            <span>Nombre de Usuario</span>
            {isEditing ? (
              <form onSubmit={handleUpdateNombre} className="edit-form">
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-save">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-cancel"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="info-value">
                <strong>{profileData?.nombre_usuario}</strong>
                <button onClick={() => setIsEditing(true)} className="btn-edit">
                  Editar
                </button>
              </div>
            )}
          </div>

          <div className="info-item">
            <span>Correo Electrónico</span>
            <div className="info-value">
              <strong>{profileData?.correo_usuario}</strong>
            </div>
          </div>

          <div className="info-item">
            <span>Unidad de Peso</span>
            <div className="unit-toggle">
              <button
                className={profileData?.unidad_peso === "kg" ? "active" : ""}
                onClick={() => handleUpdateUnidadPeso("kg")}
              >
                Kilogramos (kg)
              </button>
              <button
                className={profileData?.unidad_peso === "lbs" ? "active" : ""}
                onClick={() => handleUpdateUnidadPeso("lbs")}
              >
                Libras (lbs)
              </button>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span>Peso Actual</span>
            <strong className="stat-value">
              {pesoMostrado
                ? `${pesoMostrado} ${profileData?.unidad_peso}`
                : "N/A"}
            </strong>
          </div>
          <div className="stat-item">
            <span>Racha de Rutina</span>
            <strong className="stat-value">
              🔥 {profileData?.racha_rutina} Días
            </strong>
          </div>
          <div className="stat-item">
            <span>Racha de Dieta</span>
            <strong className="stat-value">
              🥗 {profileData?.racha_dieta} Días
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
