// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CumplimientoDietaDia, CumplimientoRutina } from "@/types";
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
      const [progresoData, rutinaActivaData, dietaActivaData, usuarioData] =
        await Promise.all([
          supabase
            .from("progreso_usuario")
            .select("peso_actual, peso_deseado")
            .eq("id_usuario", userData.id)
            .eq("estado", 1)
            .maybeSingle(),
          supabase
            .from("rutina")
            .select(`*, dias:rutina_dia_semana(*)`)
            .eq("id_usuario", userData.id)
            .eq("estado", 1)
            .limit(1)
            .single(),
          supabase
            .from("dieta")
            .select(
              `*, dias:dieta_alimento(*, alimentos:dieta_alimento_detalle(*))`
            )
            .eq("id_usuario", userData.id)
            .limit(1)
            .single(),
          supabase
            .from("usuario")
            .select("unidad_peso")
            .eq("id_usuario", userData.id)
            .single(),
        ]);

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

      // lógica de cálculo de rachas
      let rachaRutina = 0;
      if (rutinaActivaData.data) {
        const diasConRutina = new Set(
          rutinaActivaData.data.dias.map((d: any) => d.dia_semana)
        );
        const idsDiasConRutina = rutinaActivaData.data.dias
          .map((d: any) => d.id_rutina_dia_semana)
          .filter(Boolean);

        if (idsDiasConRutina.length > 0) {
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
                if (cumplimientosMap.get(fechaStr) === true) rachaRutina++;
                else break;
              }
            }
            if (cumplimientosMap.get(fechaHoyStr) === true) rachaRutina++;
          }
        }
      }

      // Lógica de racha de dieta COMPLETA
      let rachaDieta = 0;
      if (dietaActivaData.data && dietaActivaData.data.dias) {
        const diasConDieta = new Set<string>();
        dietaActivaData.data.dias.forEach((comida: any) => {
          if (comida.alimentos.length > 0) diasConDieta.add(comida.dia_semana);
        });

        const { data: cumplimientosDieta } = await supabase
          .from("cumplimiento_dieta_dia")
          .select("*")
          .eq("id_dieta", dietaActivaData.data.id_dieta);
        if (cumplimientosDieta) {
          const cumplimientosMap = new Map(
            cumplimientosDieta.map((c: CumplimientoDietaDia) => [
              c.fecha_a_cumplir,
              c.cumplido,
            ])
          );
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
            if (diasConDieta.has(nombreDia)) {
              if (cumplimientosMap.get(fechaStr) === true) rachaDieta++;
              else break;
            }
          }
          if (cumplimientosMap.get(fechaHoyStr) === true) rachaDieta++;
        }
      }

      setData({
        nombreUsuario: userData.nombre,
        rachaRutina: rachaRutina,
        rachaDieta: rachaDieta,
        pesoActual: progresoData.data?.peso_actual || null,
        metaPeso: progresoData.data?.peso_deseado || null,
        unidadPeso: usuarioData.data?.unidad_peso || "kg", // Guardamos la preferencia
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
        <DashboardCard title="Mi Rutina" icon="🏋️" link="/rutina">
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
