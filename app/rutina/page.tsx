"use client";

import { useState, useEffect, useCallback } from "react";
import { routineService } from "@/services/RoutineService";
import { Rutina, RutinaDia, RutinaDiaEjercicio } from "@/types";
import RoutineCard from "@/components/RoutineCard";
import RoutineForm from "@/components/RoutineForm";
import Swal from "sweetalert2";
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
  const [racha, setRacha] = useState(0);
  const [calendario, setCalendario] = useState<any[]>([]);

  const fetchRutinasCompletas = useCallback(async (id: string) => {
    setLoading(true);
    const response = await routineService.getRutinasCompletas(id);
    if (response.success && response.data) {
      setRutinas(response.data.rutinas);
      setRutinaActiva(response.data.rutinaActiva);
      setRacha(response.data.racha);
      setCalendario(response.data.calendario);
    } else {
      console.error("Error al cargar las rutinas:", response.error);
      Swal.fire(
        "Error",
        "No se pudieron cargar los datos de la rutina.",
        "error"
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
    } else {
      console.error(
        "No se encontró información del usuario. Redirigiendo a login..."
      );
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRutinasCompletas(userId);
    }
  }, [userId, fetchRutinasCompletas]);

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
        fetchRutinasCompletas(userId);
      } else {
        alert(`Error al eliminar la rutina: ${response.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="rutinas-container">
        <p>Cargando rutinas...</p>
      </div>
    );
  }

  return (
    <div className="rutinas-container">
      <header className="page-header">
        <h1>Mis Rutinas</h1>
        <button className="btn btn-primary" onClick={handleOpenModalParaCrear}>
          Crear Rutina
        </button>
      </header>

      {rutinaActiva && userId && (
        <>
          <DailyRoutineTracker
            key={`daily-${rutinaActiva.id_rutina}`}
            userId={userId}
            onUpdate={() => fetchRutinasCompletas(userId)}
          />
          <StreakTracker
            key={`streak-${rutinaActiva.id_rutina}`}
            racha={racha}
            calendario={calendario}
            loadingStreak={loading}
          />
        </>
      )}

      <h2 className="section-title">Biblioteca de Rutinas</h2>
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

      {rutinas.length === 0 && !loading && (
        <div className="empty-state">
          <h2>No tienes rutinas</h2>
          <p>¡Crea tu primera rutina para empezar a entrenar!</p>
        </div>
      )}

      {isModalOpen && userId && (
        <RoutineForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (userId) fetchRutinasCompletas(userId);
          }}
          userId={userId}
          rutinaExistente={rutinaParaEditar}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTE PARA EL SEGUIMIENTO DIARIO ---
function DailyRoutineTracker({
  userId,
  onUpdate,
}: {
  userId: string;
  onUpdate: () => void;
}) {
  const [diaDeHoy, setDiaDeHoy] = useState<RutinaDia | null>(null);
  const [ejercicios, setEjercicios] = useState<DailyExercise[]>([]);
  const [diaCumplido, setDiaCumplido] = useState(false);
  const [idCumplimiento, setIdCumplimiento] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRutinaDeHoy = async () => {
      setLoading(true);
      const response = await routineService.getTodayRoutineTracker(userId);
      if (response.success && response.data) {
        setDiaDeHoy(response.data.diaDeHoy);
        setDiaCumplido(response.data.diaCumplido);
        setIdCumplimiento(response.data.id_cumplimiento_rutina);
        if (response.data.diaDeHoy) {
          setEjercicios(
            response.data.diaDeHoy.ejercicios.map((ej) => ({
              ...ej,
              completado: false,
            }))
          );
        }
      }
      setLoading(false);
    };
    if (userId) {
      getRutinaDeHoy();
    }
  }, [userId]);

  const handleCheckEjercicio = (index: number) => {
    const nuevosEjercicios = [...ejercicios];
    nuevosEjercicios[index].completado = !nuevosEjercicios[index].completado;
    setEjercicios(nuevosEjercicios);
  };

  const handleMarcarDiaCumplido = async () => {
    if (!idCumplimiento) return;
    const response = await routineService.markDayAsCompleted(idCumplimiento);
    if (response.success) {
      setDiaCumplido(true);
      onUpdate();
      Swal.fire("¡Felicidades!", "Has cumplido tu rutina de hoy.", "success");
    } else {
      Swal.fire("Error", "No se pudo marcar el día como cumplido.", "error");
    }
  };

  if (loading)
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
                key={ej.id_rutina_dia_semana_ejercicio || index}
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

// --- SUB-COMPONENTE PARA LA RACHA Y CALENDARIO ---
function StreakTracker({
  racha,
  calendario,
  loadingStreak,
}: {
  racha: number;
  calendario: any[];
  loadingStreak: boolean;
}) {
  const fillerDays = [];
  if (calendario.length > 0) {
    const firstDayOfWeek = new Date(calendario[0].fecha).getUTCDay();
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
          <p className="streak-days">🔥 {racha} Días</p>
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
          {fillerDays}
          {calendario.map(({ fecha, status }, index) => (
            <div key={index} className={`calendar-day ${status}`}>
              {parseInt(fecha.split("-")[2], 10)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
