"use client";

import { useState, useEffect } from "react";
import { routineService } from "@/services/RoutineService";
import {
  Rutina,
  RutinaDia,
  RutinaDiaEjercicio,
  CumplimientoRutina,
} from "@/types";
import RoutineCard from "@/components/RoutineCard";
import RoutineForm from "@/components/RoutineForm";
import { supabase } from "@/lib/supabase";
import "./rutina.css";

// --- TIPOS ---
interface UserInfo {
  id: string;
  nombre: string;
  email: string;
}

interface DailyExercise extends RutinaDiaEjercicio {
  completado: boolean;
}

// --- COMPONENTE PRINCIPAL ---
export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rutinaParaEditar, setRutinaParaEditar] = useState<Rutina | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rutinaActiva, setRutinaActiva] = useState<Rutina | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
    } else {
      console.error("No se encontró información del usuario.");
    }
  }, []);

  const fetchRutinas = async (id: string) => {
    setLoading(true);
    const response = await routineService.getRutinasByUserId(id);
    if (response.success && response.data) {
      const data = response.data;
      const rutinasComoArray = Array.isArray(data) ? data : [data];
      setRutinas(rutinasComoArray);
      if (rutinasComoArray.length > 0) {
        setRutinaActiva(rutinasComoArray[0]);
      }
    } else {
      console.error("Error al cargar las rutinas:", response.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchRutinas(userId);
    }
  }, [userId]);

  const handleOpenModalParaCrear = () => {
    setRutinaParaEditar(null);
    setIsModalOpen(true);
  };

  const handleOpenModalParaEditar = (rutina: Rutina) => {
    setRutinaParaEditar(rutina);
    setIsModalOpen(true);
  };

  const handleDelete = async (rutinaId: number) => {
    if (
      confirm("¿Estás seguro de que quieres eliminar esta rutina?") &&
      userId
    ) {
      const response = await routineService.deleteRutina(rutinaId);
      if (response.success) {
        fetchRutinas(userId);
      } else {
        alert(`Error al eliminar la rutina: ${response.error}`);
      }
    }
  };

  if (!userId) {
    return <p>Cargando información de usuario...</p>;
  }

  return (
    <div className="rutinas-container">
      <header className="page-header">
        <h1>Mis Rutinas</h1>
        <button className="btn btn-primary" onClick={handleOpenModalParaCrear}>
          Crear Rutina
        </button>
      </header>

      {rutinaActiva && (
        <>
          <DailyRoutineTracker
            key={`daily-${rutinaActiva.id_rutina}`}
            rutinaActiva={rutinaActiva}
          />
          <StreakTracker
            key={`streak-${rutinaActiva.id_rutina}`}
            rutinaActiva={rutinaActiva}
          />
        </>
      )}

      <h2 className="section-title">Biblioteca de Rutinas</h2>
      {loading ? (
        <p>Cargando rutinas...</p>
      ) : (
        <div className="rutinas-grid">
          {rutinas.map((rutina) => (
            <RoutineCard
              key={rutina.id_rutina}
              rutina={rutina}
              onDelete={handleDelete}
              onEdit={handleOpenModalParaEditar}
            />
          ))}
        </div>
      )}

      {rutinas.length === 0 && !loading && (
        <div className="empty-state">
          <h2>No tienes rutinas</h2>
          <p>¡Crea tu primera rutina para empezar a entrenar!</p>
        </div>
      )}

      {isModalOpen && (
        <RoutineForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (userId) fetchRutinas(userId);
          }}
          userId={userId}
          rutinaExistente={rutinaParaEditar}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTE PARA EL SEGUIMIENTO DIARIO (SIN CAMBIOS) ---
function DailyRoutineTracker({ rutinaActiva }: { rutinaActiva: Rutina }) {
  const [diaDeHoy, setDiaDeHoy] = useState<RutinaDia | null>(null);
  const [ejercicios, setEjercicios] = useState<DailyExercise[]>([]);
  const [diaCumplido, setDiaCumplido] = useState(false);
  const [loadingTracker, setLoadingTracker] = useState(true);
  const [isRecordChecked, setIsRecordChecked] = useState(false);
  const diasSemanaMapa: { [key: number]: string } = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
  };

  useEffect(() => {
    if (!rutinaActiva || isRecordChecked) return;

    const getRutinaDeHoy = async () => {
      setLoadingTracker(true);
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
      const fechaLocalISO = `${year}-${month}-${day}`;
      const nombreDiaHoy = diasSemanaMapa[hoy.getDay()];

      const rutinaDia = rutinaActiva.dias.find(
        (d) => d.dia_semana === nombreDiaHoy
      );

      if (rutinaDia && rutinaDia.id_rutina_dia_semana) {
        setDiaDeHoy(rutinaDia);
        setEjercicios(
          rutinaDia.ejercicios.map((ej) => ({ ...ej, completado: false }))
        );

        const { data, error } = await supabase
          .from("cumplimiento_rutina")
          .select("cumplido")
          .eq("id_rutina_dia_semana", rutinaDia.id_rutina_dia_semana)
          .eq("fecha_a_cumplir", fechaLocalISO)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error al buscar cumplimiento:", error);
        } else if (data) {
          setDiaCumplido(data.cumplido);
        } else {
          await supabase.from("cumplimiento_rutina").insert({
            id_rutina_dia_semana: rutinaDia.id_rutina_dia_semana,
            fecha_a_cumplir: fechaLocalISO,
            cumplido: false,
          });
          setDiaCumplido(false);
        }
      } else {
        setDiaDeHoy(null);
        setEjercicios([]);
      }
      setIsRecordChecked(true);
      setLoadingTracker(false);
    };
    getRutinaDeHoy();
  }, [rutinaActiva, isRecordChecked]);

  const handleCheckEjercicio = (index: number) => {
    const nuevosEjercicios = [...ejercicios];
    nuevosEjercicios[index].completado = !nuevosEjercicios[index].completado;
    setEjercicios(nuevosEjercicios);
  };

  const handleMarcarDiaCumplido = async () => {
    if (!diaDeHoy?.id_rutina_dia_semana) return;
    const hoy = new Date();
    const fechaLocalISO = `${hoy.getFullYear()}-${String(
      hoy.getMonth() + 1
    ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const { error } = await supabase
      .from("cumplimiento_rutina")
      .update({ cumplido: true })
      .eq("id_rutina_dia_semana", diaDeHoy.id_rutina_dia_semana)
      .eq("fecha_a_cumplir", fechaLocalISO);
    if (error) {
      alert("Error al marcar el día como cumplido.");
    } else {
      setDiaCumplido(true);
      alert("¡Felicidades! Has cumplido tu rutina de hoy.");
    }
  };

  if (loadingTracker)
    return (
      <div className="tracker-container">
        <p>Cargando rutina de hoy...</p>
      </div>
    );
  if (!diaDeHoy)
    return (
      <div className="tracker-container">
        <h3>Hoy es tu día de descanso</h3>
        <p>Aprovecha para recuperar energías.</p>
      </div>
    );
  const todosCompletados = ejercicios.every((ej) => ej.completado);

  return (
    <div className="tracker-container">
      <h3>Tu Entrenamiento de Hoy: {diaDeHoy.dia_semana}</h3>
      {diaCumplido ? (
        <div className="tracker-cumplido">
          <p>🎉 ¡Ya completaste tu rutina de hoy! ¡Excelente trabajo! 🎉</p>
        </div>
      ) : (
        <>
          <ul className="exercise-list">
            {ejercicios.map((ej, index) => (
              <li
                key={ej.ejercicio?.id_ejercicio || index}
                className={ej.completado ? "completado" : ""}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={ej.completado}
                    onChange={() => handleCheckEjercicio(index)}
                  />
                  <span className="exercise-name">
                    {ej.ejercicio?.nombre_ejercicio}
                  </span>
                  <span className="exercise-details">
                    {ej.series} series x {ej.repeticiones} reps
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary"
            onClick={handleMarcarDiaCumplido}
            disabled={!todosCompletados}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Marcar Día como Cumplido
          </button>
        </>
      )}
    </div>
  );
}

// --- NUEVO COMPONENTE PARA EL CALENDARIO Y RACHA (CON ALINEACIÓN CORREGIDA) ---
function StreakTracker({ rutinaActiva }: { rutinaActiva: Rutina }) {
  const [streak, setStreak] = useState(0);
  const [diasCalendario, setDiasCalendario] = useState<
    {
      fecha: Date;
      status: "completed" | "missed" | "rest" | "pending" | "future";
    }[]
  >([]);
  const [loadingStreak, setLoadingStreak] = useState(true);

  const diasSemanaMapa: { [key: number]: string } = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
  };

  useEffect(() => {
    const calcularRachaYCalendario = async () => {
      setLoadingStreak(true);

      const diasConRutina = new Set(rutinaActiva.dias.map((d) => d.dia_semana));
      const idsDiasConRutina = rutinaActiva.dias
        .map((d) => d.id_rutina_dia_semana)
        .filter(Boolean);

      const { data: cumplimientos, error } = await supabase
        .from("cumplimiento_rutina")
        .select("*")
        .in("id_rutina_dia_semana", idsDiasConRutina);

      if (error) {
        console.error("Error al obtener datos de cumplimiento", error);
        setLoadingStreak(false);
        return;
      }

      const cumplimientosMap = new Map(
        cumplimientos.map((c: CumplimientoRutina) => [
          c.fecha_a_cumplir,
          c.cumplido,
        ])
      );

      let rachaActual = 0;
      const hoy = new Date();
      const fechaHoyStr = `${hoy.getFullYear()}-${String(
        hoy.getMonth() + 1
      ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

      for (let i = 1; i < 90; i++) {
        const diaAnterior = new Date(hoy);
        diaAnterior.setDate(hoy.getDate() - i);
        const nombreDia = diasSemanaMapa[diaAnterior.getDay()];
        const fechaStr = `${diaAnterior.getFullYear()}-${String(
          diaAnterior.getMonth() + 1
        ).padStart(2, "0")}-${String(diaAnterior.getDate()).padStart(2, "0")}`;

        if (diasConRutina.has(nombreDia)) {
          if (cumplimientosMap.get(fechaStr) === true) {
            rachaActual++;
          } else {
            break;
          }
        }
      }

      if (cumplimientosMap.get(fechaHoyStr) === true) {
        rachaActual++;
      }
      setStreak(rachaActual);

      const diasParaMostrar = [];
      for (let i = 34; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(hoy.getDate() - i);
        const fechaStr = `${dia.getFullYear()}-${String(
          dia.getMonth() + 1
        ).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
        const nombreDia = diasSemanaMapa[dia.getDay()];

        let status: "completed" | "missed" | "rest" | "pending" | "future" =
          "pending";

        if (dia.setHours(0, 0, 0, 0) > hoy.setHours(0, 0, 0, 0)) {
          status = "future";
        } else if (diasConRutina.has(nombreDia)) {
          const cumplido = cumplimientosMap.get(fechaStr);
          if (cumplido === true) status = "completed";
          else if (
            cumplido === false &&
            dia.setHours(0, 0, 0, 0) < hoy.setHours(0, 0, 0, 0)
          )
            status = "missed";
          else status = "pending";
        } else {
          status = "rest";
        }
        diasParaMostrar.push({ fecha: dia, status });
      }
      setDiasCalendario(diasParaMostrar);
      setLoadingStreak(false);
    };

    calcularRachaYCalendario();
  }, [rutinaActiva]);

  // --- CORRECCIÓN DE ALINEACIÓN ---
  // Calculamos los días vacíos necesarios para alinear la primera semana.
  const fillerDays = [];
  if (diasCalendario.length > 0) {
    const firstDayOfWeek = diasCalendario[0].fecha.getDay(); // 0 = Domingo, 1 = Lunes...
    for (let i = 0; i < firstDayOfWeek; i++) {
      fillerDays.push(
        <div key={`filler-${i}`} className="calendar-day-empty"></div>
      );
    }
  }

  return (
    <div className="streak-container">
      <div className="streak-counter">
        <h3>Racha Actual</h3>
        {loadingStreak ? (
          <p>...</p>
        ) : (
          <p className="streak-days">🔥 {streak} Días</p>
        )}
      </div>
      <div className="streak-calendar">
        <div className="calendar-header">
          <span>D</span>
          <span>L</span>
          <span>M</span>
          <span>M</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
        </div>
        <div className="calendar-grid">
          {/* Primero renderizamos los días vacíos */}
          {fillerDays}
          {/* Luego los días reales del calendario */}
          {diasCalendario.map(({ fecha, status }, index) => (
            <div key={index} className={`calendar-day ${status}`}>
              {fecha.getDate()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
