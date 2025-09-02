// app/dieta/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dieta,
  TiempoComida,
  AlimentoDetalle,
  CumplimientoDietaDia,
} from "@/types";
import Swal from "sweetalert2";
import { useTheme } from "@/components/ThemeContext";
import "./dieta.css";

// --- TIPOS ---
interface UserInfo {
  id: string;
}

interface ModalData {
  dia: string;
  tiempo: string;
  foodToEdit?: AlimentoDetalle; //Prop opcional para editar
}

interface MealStatus extends TiempoComida {
  cumplido: boolean;
}

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const TIEMPOS_COMIDA = ["Desayuno", "Almuerzo", "Cena", "Snacks"];

// --- COMPONENTE PRINCIPAL ---
export default function DietaPage() {
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const { darkMode } = useTheme();

  const fetchDieta = useCallback(async (currentUserId: string) => {
    setLoading(true);
    let { data: dietaExistente } = await supabase
      .from("dieta")
      .select("*, dieta_alimento(*, dieta_alimento_detalle(*))")
      .eq("id_usuario", currentUserId)
      .maybeSingle();

    if (!dietaExistente) {
      const { data: nuevaDieta } = await supabase
        .from("dieta")
        .insert({
          id_usuario: currentUserId,
          nombre_dieta: "Mi Dieta Principal",
        })
        .select()
        .single();
      dietaExistente = { ...nuevaDieta, dieta_alimento: [] };
    }

    if (dietaExistente) {
      const diasMap: Dieta["dias"] = {};
      DIAS_SEMANA.forEach((dia) => {
        diasMap[dia] = {};
        TIEMPOS_COMIDA.forEach((tiempo) => {
          diasMap[dia][tiempo] = {
            id_dieta: dietaExistente.id_dieta,
            tiempo_comida: tiempo,
            dia_semana: dia,
            alimentos: [],
          };
        });
      });

      dietaExistente.dieta_alimento.forEach((alimento: any) => {
        const dia = alimento.dia_semana;
        const tiempo = alimento.tiempo_comida;
        if (diasMap[dia] && diasMap[dia][tiempo]) {
          diasMap[dia][tiempo] = {
            ...alimento,
            alimentos: alimento.dieta_alimento_detalle.map((d: any) => ({
              ...d,
            })),
          };
        }
      });
      setDieta({ ...dietaExistente, dias: diasMap });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
      fetchDieta(userData.id);
    } else {
      window.location.href = "/login";
    }
  }, [fetchDieta]);

  const openAddFoodModal = (dia: string, tiempo: string) => {
    setModalData({ dia, tiempo, foodToEdit: undefined });
    setIsModalOpen(true);
  };

  const openEditFoodModal = (
    dia: string,
    tiempo: string,
    alimento: AlimentoDetalle
  ) => {
    setModalData({ dia, tiempo, foodToEdit: alimento });
    setIsModalOpen(true);
  };

  const handleDeleteFood = async (alimentoId: number) => {
    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };
    const result = await Swal.fire({
      ...swalTheme,
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ffe70e",
      cancelButtonColor: "#65676b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      const { error } = await supabase
        .from("dieta_alimento_detalle")
        .delete()
        .eq("id_dieta_alimento_detalle", alimentoId);

      if (error) {
        Swal.fire({
          ...swalTheme,
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el alimento: " + error.message,
        });
      } else {
        Swal.fire({
          ...swalTheme,
          icon: "success",
          title: "Eliminado",
          text: "El alimento ha sido eliminado.",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchDieta(userId!);
      }
    }
  };

  if (loading || !dieta) {
    return (
      <div className="dieta-container">
        <p>Cargando tu plan de dieta...</p>
      </div>
    );
  }

  return (
    <div className="dieta-container">
      <header className="page-header">
        <h1>Mi Dieta y Cumplimiento</h1>
      </header>

      {/* --- NUEVOS COMPONENTES DE CUMPLIMIENTO --- */}
      <DailyDietTracker
        key={`daily-${dieta.id_dieta}`}
        dieta={dieta}
        userId={userId!}
        darkMode={darkMode}
      />
      <DietStreakTracker
        key={`streak-${dieta.id_dieta}`}
        dieta={dieta}
        userId={userId!}
      />

      <h2 className="section-title">Editor de Plan Semanal</h2>
      <div className="dieta-grid">
        {DIAS_SEMANA.map((dia) => {
          const totalCaloriasDia = Object.values(dieta.dias[dia] || {})
            .flatMap((meal) => meal.alimentos)
            .reduce((total, alimento) => total + alimento.calorias_alimento, 0);
          return (
            <div key={dia} className="day-column">
              <h3>{dia}</h3>
              <div className="day-total-calories">
                🔥 {totalCaloriasDia.toFixed(0)} kcal totales
              </div>
              {TIEMPOS_COMIDA.map((tiempo) => (
                <div key={tiempo} className="meal-slot">
                  <h4>{tiempo}</h4>
                  <ul>
                    {dieta.dias[dia]?.[tiempo]?.alimentos.map((alimento) => (
                      <li key={alimento.id_dieta_alimento_detalle}>
                        <span className="food-item-name">
                          {alimento.nombre_alimento}
                        </span>
                        <div className="food-item-actions">
                          <span>
                            {alimento.calorias_alimento.toFixed(0)} kcal
                          </span>
                          <button
                            onClick={() =>
                              openEditFoodModal(dia, tiempo, alimento)
                            }
                            className="btn-icon"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteFood(
                                alimento.id_dieta_alimento_detalle!
                              )
                            }
                            className="btn-icon btn-delete"
                          >
                            ❌
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn-add-food"
                    onClick={() => openAddFoodModal(dia, tiempo)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isModalOpen && modalData && (
        <AddFoodModal
          dietaId={dieta.id_dieta}
          dayName={modalData.dia}
          mealName={modalData.tiempo}
          foodToEdit={modalData.foodToEdit}
          onClose={() => setIsModalOpen(false)}
          onFoodAdded={() => {
            setIsModalOpen(false);
            fetchDieta(userId!);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

function DailyDietTracker({
  dieta,
  userId,
  darkMode,
}: {
  dieta: Dieta;
  userId: string;
  darkMode: boolean;
}) {
  const [comidasDeHoy, setComidasDeHoy] = useState<MealStatus[]>([]);
  const [diaCumplido, setDiaCumplido] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const hoy = new Date();
  const fechaLocalISO = `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const nombreDiaHoy = diasSemanaMapa[hoy.getDay()];

  const fetchCompliance = useCallback(async () => {
    if (isRecordChecked) return;
    setLoading(true);

    const comidasProgramadas = Object.values(
      dieta.dias[nombreDiaHoy] || {}
    ).filter((meal) => meal.alimentos.length > 0 && meal.id_dieta_alimento);

    if (comidasProgramadas.length === 0) {
      setLoading(false);
      setIsRecordChecked(true);
      return;
    }

    // 1. Verificar o crear el registro del DÍA
    const { data: diaData } = await supabase
      .from("cumplimiento_dieta_dia")
      .select("cumplido")
      .eq("id_usuario", userId)
      .eq("fecha_a_cumplir", fechaLocalISO)
      .maybeSingle();

    if (diaData) {
      setDiaCumplido(diaData.cumplido);
    } else {
      await supabase.from("cumplimiento_dieta_dia").insert({
        id_usuario: userId,
        id_dieta: dieta.id_dieta,
        fecha_a_cumplir: fechaLocalISO,
        dia_semana: nombreDiaHoy,
      });
      setDiaCumplido(false);
    }

    // 2. Verificar o crear registros de CADA COMIDA
    const idsComidas = comidasProgramadas.map((c) => c.id_dieta_alimento!);
    const { data: comidasData } = await supabase
      .from("cumplimiento_dieta")
      .select("*")
      .eq("id_usuario", userId)
      .eq("fecha_a_cumplir_dieta", fechaLocalISO)
      .in("id_dieta_alimento", idsComidas);

    const comidasStatusInicial: MealStatus[] = [];
    const comidasACrear = [];

    for (const comida of comidasProgramadas) {
      const registroExistente = comidasData?.find(
        (c) => c.id_dieta_alimento === comida.id_dieta_alimento
      );
      comidasStatusInicial.push({
        ...comida,
        cumplido: registroExistente?.cumplido || false,
      });

      if (!registroExistente) {
        comidasACrear.push({
          id_usuario: userId,
          id_dieta_alimento: comida.id_dieta_alimento!,
          fecha_a_cumplir_dieta: fechaLocalISO,
        });
      }
    }

    if (comidasACrear.length > 0) {
      await supabase.from("cumplimiento_dieta").insert(comidasACrear);
    }

    setComidasDeHoy(comidasStatusInicial);
    setLoading(false);
    setIsRecordChecked(true);
  }, [dieta, userId, fechaLocalISO, nombreDiaHoy, isRecordChecked]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  const handleCheckMeal = async (mealId: number, newStatus: boolean) => {
    setComidasDeHoy((prev) =>
      prev.map((c) =>
        c.id_dieta_alimento === mealId ? { ...c, cumplido: newStatus } : c
      )
    );
    await supabase
      .from("cumplimiento_dieta")
      .update({ cumplido: newStatus })
      .eq("id_usuario", userId)
      .eq("id_dieta_alimento", mealId)
      .eq("fecha_a_cumplir_dieta", fechaLocalISO);
  };

  const handleMarkDayComplete = async () => {
    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };
    await supabase
      .from("cumplimiento_dieta_dia")
      .update({ cumplido: true })
      .eq("id_usuario", userId)
      .eq("fecha_a_cumplir", fechaLocalISO);
    setDiaCumplido(true);
    Swal.fire({
      ...swalTheme,
      icon: "success",
      title: "¡Felicidades!",
      text: "Has completado tu dieta de hoy.",
      showConfirmButton: false,
      timer: 2000,
    });
  };

  if (loading)
    return (
      <div className="tracker-container">
        <p>Cargando cumplimiento de dieta...</p>
      </div>
    );
  if (comidasDeHoy.length === 0)
    return (
      <div className="tracker-container">
        <h3>Hoy es un Cheat Day</h3>
        <p>No tienes comidas registradas para hoy.</p>
      </div>
    );

  const allMealsChecked = comidasDeHoy.every((c) => c.cumplido);

  return (
    <div className="tracker-container">
      <h3>Cumplimiento de Hoy: {nombreDiaHoy}</h3>
      {diaCumplido ? (
        <div className="tracker-cumplido">
          <p>✅ ¡Dieta del día completada! ¡Sigue así! ✅</p>
        </div>
      ) : (
        <>
          <ul className="meal-checklist">
            {comidasDeHoy.map((comida) => (
              <li
                key={comida.id_dieta_alimento}
                className={comida.cumplido ? "completado" : ""}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={comida.cumplido}
                    onChange={(e) =>
                      handleCheckMeal(
                        comida.id_dieta_alimento!,
                        e.target.checked
                      )
                    }
                  />
                  <span className="meal-name">{comida.tiempo_comida}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-primary"
            onClick={handleMarkDayComplete}
            disabled={!allMealsChecked}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Marcar Día como Cumplido
          </button>
        </>
      )}
    </div>
  );
}

function DietStreakTracker({
  dieta,
  userId,
}: {
  dieta: Dieta;
  userId: string;
}) {
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

      // Obtenemos los días que tienen al menos una comida planificada
      const diasConDieta = new Set<string>();
      Object.values(dieta.dias).forEach((tiempos) => {
        Object.values(tiempos).forEach((comida) => {
          if (comida.alimentos.length > 0) {
            diasConDieta.add(comida.dia_semana);
          }
        });
      });

      // Obtenemos todos los registros de cumplimiento de días completos
      const { data: cumplimientos, error } = await supabase
        .from("cumplimiento_dieta_dia")
        .select("*")
        .eq("id_usuario", userId)
        .eq("id_dieta", dieta.id_dieta);

      if (error) {
        console.error("Error al obtener datos de cumplimiento de dieta", error);
        setLoadingStreak(false);
        return;
      }

      const cumplimientosMap = new Map(
        cumplimientos.map((c: CumplimientoDietaDia) => [
          c.fecha_a_cumplir,
          c.cumplido,
        ])
      );

      let rachaActual = 0;
      const hoy = new Date();
      const fechaHoyStr = `${hoy.getFullYear()}-${String(
        hoy.getMonth() + 1
      ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

      // Calculamos la racha de días pasados
      for (let i = 1; i < 90; i++) {
        // Revisamos hasta 90 días atrás
        const diaAnterior = new Date();
        diaAnterior.setDate(hoy.getDate() - i);
        const nombreDia = diasSemanaMapa[diaAnterior.getDay()];
        const fechaStr = `${diaAnterior.getFullYear()}-${String(
          diaAnterior.getMonth() + 1
        ).padStart(2, "0")}-${String(diaAnterior.getDate()).padStart(2, "0")}`;

        if (diasConDieta.has(nombreDia)) {
          if (cumplimientosMap.get(fechaStr) === true) {
            rachaActual++;
          } else {
            // Si el día tenía dieta pero no fue cumplido (o no existe el registro), se rompe la racha
            break;
          }
        }
        // Si es un día de descanso (cheat day), no hacemos nada y el bucle continúa
      }

      // Añadimos el día de hoy a la racha si está cumplido
      if (cumplimientosMap.get(fechaHoyStr) === true) {
        rachaActual++;
      }
      setStreak(rachaActual);

      // Generamos los datos para el calendario de los últimos 35 días
      const diasParaMostrar = [];
      const hoySinHora = new Date(new Date().setHours(0, 0, 0, 0));

      for (let i = 34; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(hoy.getDate() - i);
        dia.setHours(0, 0, 0, 0);

        const fechaStr = `${dia.getFullYear()}-${String(
          dia.getMonth() + 1
        ).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
        const nombreDia = diasSemanaMapa[dia.getDay()];

        let status: "completed" | "missed" | "rest" | "pending" | "future" =
          "pending";

        if (dia > hoySinHora) {
          status = "future";
        } else if (diasConDieta.has(nombreDia)) {
          const cumplido = cumplimientosMap.get(fechaStr);
          if (cumplido === true) {
            status = "completed";
          } else if (cumplido === false && dia < hoySinHora) {
            status = "missed";
          } else {
            status = "pending";
          }
        } else {
          status = "rest";
        }
        diasParaMostrar.push({ fecha: dia, status });
      }
      setDiasCalendario(diasParaMostrar);
      setLoadingStreak(false);
    };

    calcularRachaYCalendario();
  }, [dieta, userId]);

  const fillerDays = [];
  if (diasCalendario.length > 0) {
    const firstDayOfWeek = diasCalendario[0].fecha.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      fillerDays.push(
        <div key={`filler-${i}`} className="calendar-day-empty"></div>
      );
    }
  }

  return (
    <div className="streak-container">
      <div className="streak-counter">
        <h3>Racha de Dieta</h3>
        {loadingStreak ? (
          <p>...</p>
        ) : (
          <p className="streak-days">🥗 {streak} Días</p>
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

// --- subcomponente modal para añadir y editar alimentos ---
interface AddFoodModalProps {
  dietaId: number;
  dayName: string;
  mealName: string;
  foodToEdit?: AlimentoDetalle;
  onClose: () => void;
  onFoodAdded: () => void;
  darkMode: boolean;
}

// --- SUB-COMPONENTE MODAL PARA AÑADIR ALIMENTOS (CON BÚSQUEDA PRIORIZADA) ---
function AddFoodModal({
  dietaId,
  dayName,
  mealName,
  foodToEdit,
  onClose,
  onFoodAdded,
  darkMode,
}: AddFoodModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY_USDA;

  useEffect(() => {
    if (foodToEdit) {
      // --- LÓGICA DE EDICIÓN MEJORADA ---
      // Recreamos el objeto 'selectedFood' con la estructura que el resto del componente espera.
      // Extraemos el nombre real del alimento del string guardado.
      const nombreReal = foodToEdit.nombre_alimento.replace(/^\d+g\sde\s/, "");
      setSelectedFood({ description: nombreReal });

      setQuantity(foodToEdit.gramos_alimento);

      // Recreamos el objeto de nutrición a partir de los datos guardados por 100g
      const multiplier = foodToEdit.gramos_alimento / 100;
      if (multiplier > 0) {
        setNutrition({
          calories: foodToEdit.calorias_alimento / multiplier,
          protein: foodToEdit.proteina_alimento / multiplier,
          fat: foodToEdit.grasas_alimento / multiplier,
          carbs: foodToEdit.carbohidratos_alimento / multiplier,
        });
      }
    }
  }, [foodToEdit]);

  const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSelectedFood(null);
    setNutrition(null);
    try {
      let url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&dataType=SR%20Legacy&pageSize=10`;
      let response = await fetch(url);
      let data = await response.json();

      if (!data.foods || data.foods.length === 0) {
        url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
          query
        )}&pageSize=10`;
        response = await fetch(url);
        data = await response.json();
      }
      setResults(data.foods || []);
    } catch (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error de Búsqueda",
        text: "No se pudieron obtener los alimentos.",
      });
    }
    setLoading(false);
  };

  const handleSelectFood = async (foodItem: any) => {
    setLoading(true);
    setSelectedFood(foodItem);
    setResults([]);
    const url = `https://api.nal.usda.gov/fdc/v1/food/${foodItem.fdcId}?api_key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const nutrients = {
        calories:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1008)?.amount ||
          0,
        protein:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1003)?.amount ||
          0,
        fat:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1004)?.amount ||
          0,
        carbs:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1005)?.amount ||
          0,
      };
      setNutrition(nutrients);
    } catch (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error de Nutrición",
        text: "No se pudieron obtener los datos nutricionales.",
      });
    }
    setLoading(false);
  };

  const handleSaveFood = async () => {
    if (!nutrition || !selectedFood?.description) {
      // <-- Verificación de seguridad
      Swal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Faltan Datos",
        text: "No hay información nutricional para guardar.",
      });
      return;
    }
    setLoading(true);
    const multiplier = quantity / 100;

    const foodData = {
      nombre_alimento: `${quantity}g de ${selectedFood.description}`,
      calorias_alimento: nutrition.calories * multiplier,
      proteina_alimento: nutrition.protein * multiplier,
      grasas_alimento: nutrition.fat * multiplier,
      carbohidratos_alimento: nutrition.carbs * multiplier,
      gramos_alimento: quantity,
    };

    try {
      if (foodToEdit) {
        const { error } = await supabase
          .from("dieta_alimento_detalle")
          .update(foodData)
          .eq(
            "id_dieta_alimento_detalle",
            foodToEdit.id_dieta_alimento_detalle
          );
        if (error) throw error;
      } else {
        const { data: meal } = await supabase
          .from("dieta_alimento")
          .select("id_dieta_alimento")
          .eq("id_dieta", dietaId)
          .eq("dia_semana", dayName)
          .eq("tiempo_comida", mealName)
          .maybeSingle();
        let mealId = meal?.id_dieta_alimento;
        if (!meal) {
          const { data: newMeal, error } = await supabase
            .from("dieta_alimento")
            .insert({
              id_dieta: dietaId,
              dia_semana: dayName,
              tiempo_comida: mealName,
            })
            .select("id_dieta_alimento")
            .single();
          if (error) throw error;
          mealId = newMeal.id_dieta_alimento;
        }
        await supabase
          .from("dieta_alimento_detalle")
          .insert({ ...foodData, id_dieta_alimento: mealId });
      }
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Guardado!",
        text: `Alimento ${
          foodToEdit ? "actualizado" : "añadido"
        } exitosamente.`,
        showConfirmButton: false,
        timer: 1500,
      });
      onFoodAdded();
    } catch (error: any) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error al Guardar",
        text: error.message,
      });
    }
    setLoading(false);
  };

  // Determinamos qué vista mostrar: búsqueda o detalles
  const showDetailsView = selectedFood || foodToEdit;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {foodToEdit ? "Editar" : "Añadir"} Alimento a {mealName} de{" "}
            {dayName}
          </h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>

        {!showDetailsView ? (
          <>
            <form onSubmit={handleSearch} className="food-search-form">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca un alimento (ej: Pollo, Manzana)"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </form>
            <ul className="search-results">
              {results.map((food, index) => (
                <li
                  key={food.fdcId || index}
                  onClick={() => handleSelectFood(food)}
                >
                  {food.description}
                  <small className="food-category">{food.dataType}</small>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="nutrition-details">
            {/* --- CORRECCIÓN CLAVE AQUÍ --- */}
            {/* Usamos '?' para acceder de forma segura y un fallback '||' */}
            <h3>{selectedFood?.description || "Detalles del Alimento"}</h3>

            <div className="quantity-selector">
              <label htmlFor="quantity">Cantidad (gramos):</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>
            {nutrition && (
              <div className="nutrition-facts">
                <h4>Valores Nutricionales (Total):</h4>
                <p>
                  <strong>Calorías:</strong>{" "}
                  {(nutrition.calories * (quantity / 100)).toFixed(0)} kcal
                </p>
                <p>
                  <strong>Proteínas:</strong>{" "}
                  {(nutrition.protein * (quantity / 100)).toFixed(1)} g
                </p>
                <p>
                  <strong>Grasas:</strong>{" "}
                  {(nutrition.fat * (quantity / 100)).toFixed(1)} g
                </p>
                <p>
                  <strong>Carbs:</strong>{" "}
                  {(nutrition.carbs * (quantity / 100)).toFixed(1)} g
                </p>
              </div>
            )}
            <div className="modal-footer">
              {!foodToEdit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFood(null)}
                >
                  Volver a buscar
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSaveFood}
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : foodToEdit
                  ? "Actualizar Alimento"
                  : "Añadir a mi Dieta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
