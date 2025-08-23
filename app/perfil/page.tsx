// app/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Rutina, CumplimientoRutina } from "@/types"; // Asegúrate de tener estos tipos
import "./perfil.css"; // Crearemos este archivo de estilos

// --- TIPOS ---
interface UserInfo {
  id: string;
  nombre: string;
  email: string;
}

interface ProfileData {
  nombre_usuario: string;
  correo_usuario: string;
  peso_actual: number | null;
  racha_rutina: number;
}

// --- COMPONENTE PRINCIPAL ---
export default function PerfilPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      // 1. Obtener ID de usuario desde localStorage
      const storedUser = localStorage.getItem("userFitControl");
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
      setNuevoNombre(userData.nombre);

      // --- Promesas para obtener todos los datos en paralelo ---
      const userProfilePromise = supabase
        .from("usuario")
        .select("nombre_usuario, correo_usuario")
        .eq("id_usuario", userData.id)
        .single();

      const pesoPromise = supabase
        .from("progreso_usuario")
        .select("peso_actual")
        .eq("id_usuario", userData.id)
        .eq("estado", 1)
        .single();

      // Para la racha, necesitamos la rutina activa y sus cumplimientos
      const rutinaActivaPromise = supabase
        .from("rutina")
        .select(`*, dias:rutina_dia_semana(*)`)
        .eq("id_usuario", userData.id)
        .eq("estado", 1)
        .limit(1)
        .single();

      // --- Ejecutar todas las consultas ---
      const [
        { data: userProfile },
        { data: pesoData },
        { data: rutinaActivaData },
      ] = await Promise.all([
        userProfilePromise,
        pesoPromise,
        rutinaActivaPromise,
      ]);

      // --- Calcular la racha ---
      let racha = 0;
      if (rutinaActivaData) {
        const diasConRutina = new Set(
          rutinaActivaData.dias.map((d: any) => d.dia_semana)
        );
        const idsDiasConRutina = rutinaActivaData.dias
          .map((d: any) => d.id_rutina_dia_semana)
          .filter(Boolean);

        const { data: cumplimientos } = await supabase
          .from("cumplimiento_rutina")
          .select("*")
          .in("id_rutina_dia_semana", idsDiasConRutina);

        if (cumplimientos) {
          const cumplimientosMap = new Map(
            cumplimientos.map((c: CumplimientoRutina) => [
              c.fecha_a_cumplir,
              c.cumplido,
            ])
          );
          const diasSemanaMapa: { [key: number]: string } = {
            0: "Domingo",
            1: "Lunes",
            2: "Martes",
            3: "Miércoles",
            4: "Jueves",
            5: "Viernes",
            6: "Sábado",
          };
          const hoy = new Date();
          const fechaHoyStr = `${hoy.getFullYear()}-${String(
            hoy.getMonth() + 1
          ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

          for (let i = 1; i < 90; i++) {
            const diaAnterior = new Date();
            diaAnterior.setDate(hoy.getDate() - i);
            const nombreDia = diasSemanaMapa[diaAnterior.getDay()];
            const fechaStr = `${diaAnterior.getFullYear()}-${String(
              diaAnterior.getMonth() + 1
            ).padStart(2, "0")}-${String(diaAnterior.getDate()).padStart(
              2,
              "0"
            )}`;

            if (diasConRutina.has(nombreDia)) {
              if (cumplimientosMap.get(fechaStr) === true) racha++;
              else break;
            }
          }
          if (cumplimientosMap.get(fechaHoyStr) === true) racha++;
        }
      }

      setProfileData({
        nombre_usuario: userProfile?.nombre_usuario || userData.nombre,
        correo_usuario: userProfile?.correo_usuario || userData.email,
        peso_actual: pesoData?.peso_actual || null,
        racha_rutina: racha,
      });

      setLoading(false);
    };

    fetchProfileData();
  }, []);

  const handleUpdateNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !nuevoNombre.trim()) return;

    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from("usuario")
      .update({ nombre_usuario: nuevoNombre.trim() })
      .eq("id_usuario", userId)
      .select()
      .single();

    if (error) {
      alert("Error al actualizar el nombre: " + error.message);
    } else {
      // Actualizar el estado local
      setProfileData((prev) =>
        prev ? { ...prev, nombre_usuario: data.nombre_usuario } : null
      );

      // Actualizar localStorage para mantener la consistencia en la app
      const storedUser = localStorage.getItem("userFitControl");
      if (storedUser) {
        const userData: UserInfo = JSON.parse(storedUser);
        userData.nombre = data.nombre_usuario;
        localStorage.setItem("userFitControl", JSON.stringify(userData));
      }

      setIsEditing(false);
      alert("Nombre actualizado exitosamente.");
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <p>Cargando perfil...</p>
      </div>
    );
  }

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
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span>Peso Actual</span>
            <strong className="stat-value">
              {profileData?.peso_actual
                ? `${profileData.peso_actual} kg`
                : "N/A"}
            </strong>
          </div>
          <div className="stat-item">
            <span>Racha de Rutina</span>
            <strong className="stat-value">
              🔥 {profileData?.racha_rutina} Días
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
