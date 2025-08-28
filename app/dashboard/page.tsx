// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import "./dashboard.css";

// --- TIPOS ---
interface UserInfo {
  id: string;
  nombre: string;
}

// --- CAMBIO 1: Añadimos la unidad de peso a los datos del dashboard ---
interface DashboardData {
  nombreUsuario: string;
  rachaRutina: number;
  rachaDieta: number;
  pesoActual: number | null;
  metaPeso: number | null;
  unidadPeso: "kg" | "lbs"; // <-- NUEVO CAMPO
}

const KG_TO_LBS = 2.20462;

// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem("userFitControl");
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }
      const userData: UserInfo = JSON.parse(storedUser);

      // --- CAMBIO 2: Añadimos una consulta para obtener la preferencia del usuario ---
      const [progresoData, rutinaData, dietaData, usuarioData] =
        await Promise.all([
          // 1. Progreso de peso
          supabase
            .from("progreso_usuario")
            .select("peso_actual, peso_deseado")
            .eq("id_usuario", userData.id)
            .eq("estado", 1)
            .maybeSingle(),
          // 2. Rutina activa (simplificado para la racha)
          supabase
            .from("rutina")
            .select(
              "*, dias:rutina_dia_semana(*, cumplimientos:cumplimiento_rutina(*))"
            )
            .eq("id_usuario", userData.id)
            .eq("estado", 1)
            .limit(1)
            .single(),
          // 3. Dieta activa (simplificado para la racha)
          supabase
            .from("dieta")
            .select("*, cumplimientos:cumplimiento_dieta_dia(*)")
            .eq("id_usuario", userData.id)
            .eq("estado", 1)
            .limit(1)
            .single(),
          // 4. Preferencia de unidad del usuario
          supabase
            .from("usuario")
            .select("unidad_peso")
            .eq("id_usuario", userData.id)
            .single(),
        ]);

      // (La lógica de cálculo de rachas se queda igual)
      let rachaRutina = 0;
      if (rutinaData.data) {
        const cumplimientos = rutinaData.data.dias.flatMap(
          (d: any) => d.cumplimientos
        );
        rachaRutina = cumplimientos.filter((c: any) => c.cumplido).length;
      }

      let rachaDieta = 0;
      if (dietaData.data) {
        rachaDieta = dietaData.data.cumplimientos.filter(
          (c: any) => c.cumplido
        ).length;
      }

      setData({
        nombreUsuario: userData.nombre,
        rachaRutina: rachaRutina,
        rachaDieta: rachaDieta,
        pesoActual: progresoData.data?.peso_actual || null,
        metaPeso: progresoData.data?.peso_deseado || null,
        unidadPeso: usuarioData.data?.unidad_peso || "kg", // <-- Guardamos la preferencia
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Cargando tu dashboard...</p>
      </div>
    );
  }

  // --- CAMBIO 3: Lógica para mostrar los pesos convertidos ---
  const pesoActualMostrado =
    data?.unidadPeso === "lbs" && data.pesoActual
      ? (data.pesoActual * KG_TO_LBS).toFixed(1)
      : data?.pesoActual;

  const metaPesoMostrado =
    data?.unidadPeso === "lbs" && data.metaPeso
      ? (data.metaPeso * KG_TO_LBS).toFixed(1)
      : data?.metaPeso;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Bienvenido de vuelta, {data?.nombreUsuario}!</h1>
        <p>Aquí tienes un resumen de tu progreso. ¡Sigue así!</p>
      </header>

      <div className="dashboard-grid">
        <DashboardCard title="Mi Rutina" icon="🏋️" link="/rutinas">
          <p className="card-metric">🔥 {data?.rachaRutina} Días de Racha</p>
          <p className="card-description">
            ¡No la rompas! Revisa tu entrenamiento de hoy y marca tus ejercicios
            como completados.
          </p>
        </DashboardCard>

        <DashboardCard title="Mi Dieta" icon="🥗" link="/dieta">
          <p className="card-metric">🥗 {data?.rachaDieta} Días de Racha</p>
          <p className="card-description">
            La nutrición es clave. Registra tus comidas y mantén tu racha de
            alimentación saludable.
          </p>
        </DashboardCard>

        {/* --- CAMBIO 4: Usamos los valores convertidos en la tarjeta --- */}
        <DashboardCard title="Mi Progreso" icon="📊" link="/metas">
          {data?.pesoActual ? (
            <p className="card-metric">
              {pesoActualMostrado} {data.unidadPeso} <br />
              <span className="metric-subtitle">
                de tu meta de {metaPesoMostrado} {data.unidadPeso}
              </span>
            </p>
          ) : (
            <p className="card-metric">Sin Meta Activa</p>
          )}
          <p className="card-description">
            Define tu meta de peso y actualiza tu progreso para ver tu
            evolución.
          </p>
        </DashboardCard>

        <DashboardCard
          title="Gasto Energético"
          icon="⚡"
          link="/gasto-energetico"
        >
          <p className="card-description" style={{ marginTop: "15px" }}>
            Calcula tus calorías de mantenimiento, déficit o superávit para
            ajustar tu dieta a tus objetivos.
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE REUTILIZABLE PARA LAS TARJETAS (Sin Cambios) ---
interface DashboardCardProps {
  title: string;
  icon: string;
  link: string;
  children: React.ReactNode;
}

function DashboardCard({ title, icon, link, children }: DashboardCardProps) {
  return (
    <Link href={link} className="dashboard-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h2 className="card-title">{title}</h2>
      </div>
      <div className="card-content">{children}</div>
      <div className="card-footer">Ir al Módulo →</div>
    </Link>
  );
}
