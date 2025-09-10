//RoutineForm.tsx
"use client";

import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  UseFormSetValue,
} from "react-hook-form";
import {
  Rutina,
  RutinaDia,
  GrupoMuscular,
  Musculo,
  Ejercicio,
  RutinaDiaEjercicio,
} from "@/types";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase"; // Corregido: el cliente debe estar en un archivo separado, ej: lib/supabaseClient.ts
import { routineService } from "@/services/RoutineService";

// --- TIPOS ---
type FormValues = {
  nombre_rutina: string;
  dias: RutinaDia[];
};

interface RoutineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  rutinaExistente: Rutina | null;
}

// Props para los sub-componentes para un tipado más estricto
interface EjerciciosFieldArrayProps {
  diaIndex: number;
  control: any;
  register: any;
  gruposMusculares: GrupoMuscular[];
  setValue: UseFormSetValue<FormValues>;
}

interface EjercicioRowProps {
  diaIndex: number;
  ejIndex: number;
  control: any;
  register: any;
  gruposMusculares: GrupoMuscular[];
  onRemove: () => void;
  setValue: UseFormSetValue<FormValues>;
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

// --- COMPONENTE PRINCIPAL ---
export default function RoutineForm({
  isOpen,
  onClose,
  onSuccess,
  userId,
  rutinaExistente,
}: RoutineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gruposMusculares, setGruposMusculares] = useState<GrupoMuscular[]>([]);
  const [lookups, setLookups] = useState<{
    musculos: Musculo[];
    ejercicioMusculo: any[];
  }>({ musculos: [], ejercicioMusculo: [] });
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);

  // --- CORRECCIÓN 1 ---
  // Extraemos 'setValue' del hook useForm.
  const { register, control, handleSubmit, reset, setValue } =
    useForm<FormValues>({
      defaultValues: { nombre_rutina: "", dias: [] },
    });

  const {
    fields: diasFields,
    append: appendDia,
    remove: removeDia,
  } = useFieldArray({ control, name: "dias" });

  useEffect(() => {
    if (isOpen) {
      setIsLoadingLookups(true);
      Promise.all([
        api.get<GrupoMuscular[]>("/grupo-muscular"),
        api.get<Musculo[]>("/musculo"),
        api.get<any[]>("/ejercicio-musculo"),
      ]).then(([gruposRes, musculosRes, ejMusculoRes]) => {
        if (gruposRes.success && gruposRes.data)
          setGruposMusculares(gruposRes.data);
        setLookups({
          musculos: (musculosRes.data as Musculo[]) || [],
          ejercicioMusculo: (ejMusculoRes.data as any[]) || [],
        });
        setIsLoadingLookups(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (rutinaExistente && !isLoadingLookups) {
      const formValues = {
        nombre_rutina: rutinaExistente.nombre_rutina,
        dias: rutinaExistente.dias.map((dia: RutinaDia) => ({
          // <-- CORRECCIÓN DE TIPO
          dia_semana: dia.dia_semana,
          ejercicios: dia.ejercicios.map((ej: RutinaDiaEjercicio) => {
            // <-- CORRECCIÓN DE TIPO
            const relacion = lookups.ejercicioMusculo.find(
              (em: any) => em.id_ejercicio === ej.ejercicio?.id_ejercicio
            );
            const musculo = lookups.musculos.find(
              (m: Musculo) => m.id_musculo === relacion?.id_musculo
            );
            return {
              series: ej.series,
              repeticiones: ej.repeticiones,
              peso_ejercicio: ej.peso_ejercicio,
              id_ejercicio: ej.ejercicio?.id_ejercicio,
              grupoId: musculo?.id_grupo,
              musculoId: musculo?.id_musculo,
            };
          }),
        })),
      };
      reset(formValues);
    } else if (!rutinaExistente) {
      reset({ nombre_rutina: "", dias: [] });
    }
  }, [rutinaExistente, isLoadingLookups, reset, lookups]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (rutinaExistente) {
        const { id_rutina } = rutinaExistente;
        const { error: updateError } = await supabase
          .from("rutina")
          .update({ nombre_rutina: data.nombre_rutina })
          .eq("id_rutina", id_rutina);
        if (updateError) throw updateError;
        const { error: deleteError } = await supabase
          .from("rutina_dia_semana")
          .delete()
          .eq("id_rutina", id_rutina);
        if (deleteError) throw deleteError;
        for (const dia of data.dias) {
          const { data: nuevoDia, error: diaError } = await supabase
            .from("rutina_dia_semana")
            .insert({ id_rutina: id_rutina, dia_semana: dia.dia_semana })
            .select("id_rutina_dia_semana")
            .single();
          if (diaError) throw diaError;
          if (dia.ejercicios && dia.ejercicios.length > 0) {
            const ejerciciosParaInsertar = dia.ejercicios
              .filter((ej: RutinaDiaEjercicio) => ej.id_ejercicio) // <-- CORRECCIÓN DE TIPO
              .map((ej: RutinaDiaEjercicio) => ({
                // <-- CORRECCIÓN DE TIPO
                id_rutina_dia_semana: nuevoDia!.id_rutina_dia_semana,
                id_ejercicio: ej.id_ejercicio,
                series: ej.series,
                repeticiones: ej.repeticiones,
                peso_ejercicio: ej.peso_ejercicio || null,
              }));
            if (ejerciciosParaInsertar.length > 0) {
              const { error: ejError } = await supabase
                .from("rutina_dia_semana_ejercicio")
                .insert(ejerciciosParaInsertar);
              if (ejError) throw ejError;
            }
          }
        }
      } else {
        const { data: nuevaRutina, error: rutinaError } = await supabase
          .from("rutina")
          .insert({ nombre_rutina: data.nombre_rutina, id_usuario: userId })
          .select("id_rutina")
          .single();
        if (rutinaError) throw rutinaError;
        const id_rutina = nuevaRutina!.id_rutina;
        for (const dia of data.dias) {
          const { data: nuevoDia, error: diaError } = await supabase
            .from("rutina_dia_semana")
            .insert({ id_rutina: id_rutina, dia_semana: dia.dia_semana })
            .select("id_rutina_dia_semana")
            .single();
          if (diaError) throw diaError;
          if (dia.ejercicios && dia.ejercicios.length > 0) {
            const ejerciciosParaInsertar = dia.ejercicios
              .filter((ej: RutinaDiaEjercicio) => ej.id_ejercicio) // <-- CORRECCIÓN DE TIPO
              .map((ej: RutinaDiaEjercicio) => ({
                // <-- CORRECCIÓN DE TIPO
                id_rutina_dia_semana: nuevoDia!.id_rutina_dia_semana,
                id_ejercicio: ej.id_ejercicio,
                series: ej.series,
                repeticiones: ej.repeticiones,
                peso_ejercicio: ej.peso_ejercicio || null,
              }));
            if (ejerciciosParaInsertar.length > 0) {
              const { error: ejError } = await supabase
                .from("rutina_dia_semana_ejercicio")
                .insert(ejerciciosParaInsertar);
              if (ejError) throw ejError;
            }
          }
        }
      }
      alert(
        `Rutina ${rutinaExistente ? "actualizada" : "creada"} exitosamente!`
      );
      onSuccess();
    } catch (error: any) {
      console.error("Error de Supabase:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? "open" : ""}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{rutinaExistente ? "Editar Rutina" : "Crear Nueva Rutina"}</h2>
          <p>Añade los días y ejercicios para tu rutina.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="nombre_rutina">Nombre de la Rutina</label>
            <input
              id="nombre_rutina"
              {...register("nombre_rutina", { required: true })}
            />
          </div>
          <div>
            {diasFields.map((dia, diaIndex) => (
              <div key={dia.id} className="day-block">
                <div className="day-header">
                  <h3>Día {diaIndex + 1}</h3>
                  <button
                    type="button"
                    className="btn btn-destructive"
                    onClick={() => removeDia(diaIndex)}
                  >
                    Eliminar Día
                  </button>
                </div>
                <div className="form-group">
                  <label>Día de la semana</label>
                  <select
                    {...register(`dias.${diaIndex}.dia_semana`, {
                      required: true,
                    })}
                  >
                    <option value="">Selecciona un día</option>
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <EjerciciosFieldArray
                  diaIndex={diaIndex}
                  control={control}
                  register={register}
                  gruposMusculares={gruposMusculares}
                  setValue={setValue} // <-- CORRECCIÓN 2: Pasamos 'setValue' como prop.
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: "10px" }}
              onClick={() =>
                appendDia({ dia_semana: "", ejercicios: [] } as any)
              }
            >
              Añadir Día
            </button>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Rutina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE PARA LA LISTA DE EJERCICIOS ---
function EjerciciosFieldArray({
  diaIndex,
  control,
  register,
  gruposMusculares,
  setValue,
}: EjerciciosFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `dias.${diaIndex}.ejercicios`,
  });

  return (
    <div>
      <h4 style={{ marginTop: "20px", marginBottom: "10px" }}>Ejercicios</h4>
      {fields.map((field, ejIndex) => (
        <EjercicioRow
          key={field.id}
          diaIndex={diaIndex}
          ejIndex={ejIndex}
          control={control}
          register={register}
          gruposMusculares={gruposMusculares}
          onRemove={() => remove(ejIndex)}
          setValue={setValue} // <-- La prop se pasa correctamente.
        />
      ))}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => append({ series: 3, repeticiones: 10 } as any)}
      >
        Añadir Ejercicio
      </button>
    </div>
  );
}

// --- SUB-COMPONENTE PARA UNA FILA DE EJERCICIO ---
function EjercicioRow({
  diaIndex,
  ejIndex,
  control,
  register,
  gruposMusculares,
  onRemove,
  setValue,
}: EjercicioRowProps) {
  const [musculos, setMusculos] = useState<Musculo[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loadingMusculos, setLoadingMusculos] = useState(false);
  const [loadingEjercicios, setLoadingEjercicios] = useState(false);

  const grupoSeleccionadoId = useWatch({
    control,
    name: `dias.${diaIndex}.ejercicios.${ejIndex}.grupoId`,
  });
  const musculoSeleccionadoId = useWatch({
    control,
    name: `dias.${diaIndex}.ejercicios.${ejIndex}.musculoId`,
  });

  // Los useEffect para buscar datos se quedan igual, son correctos.
  useEffect(() => {
    if (!grupoSeleccionadoId) {
      setMusculos([]);
      setEjercicios([]);
      return;
    }
    const fetchMusculos = async () => {
      setLoadingMusculos(true);
      const res = await api.get<Musculo[]>(
        `/musculo/grupo/${grupoSeleccionadoId}`
      );
      if (res.success && res.data) setMusculos(res.data);
      setLoadingMusculos(false);
    };
    fetchMusculos();
  }, [grupoSeleccionadoId]);

  useEffect(() => {
    if (!musculoSeleccionadoId) {
      setEjercicios([]);
      return;
    }
    const fetchEjercicios = async () => {
      setLoadingEjercicios(true);
      const res = await api.get<Ejercicio[]>(
        `/ejercicio/musculo/${musculoSeleccionadoId}`
      );
      if (res.success && res.data) setEjercicios(res.data);
      setLoadingEjercicios(false);
    };
    fetchEjercicios();
  }, [musculoSeleccionadoId]);

  return (
    <div
      className="exercise-row"
      style={{
        gridTemplateColumns: "3fr 3fr 3fr 1fr 1fr 1fr 1fr",
        alignItems: "flex-end",
        marginBottom: "15px",
      }}
    >
      <div className="form-group">
        {ejIndex === 0 && <label>Grupo Muscular</label>}
        <Controller
          control={control}
          name={`dias.${diaIndex}.ejercicios.${ejIndex}.grupoId`}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <select
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onChange(val);
                // --- CAMBIO: Usamos null en lugar de "" ---
                setValue(
                  `dias.${diaIndex}.ejercicios.${ejIndex}.musculoId`,
                  null
                );
                setValue(
                  `dias.${diaIndex}.ejercicios.${ejIndex}.id_ejercicio`,
                  null
                );
              }}
              onBlur={onBlur}
              value={value || ""}
              ref={ref}
            >
              <option value="">Seleccionar...</option>
              {gruposMusculares.map((g: GrupoMuscular) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div className="form-group">
        {ejIndex === 0 && <label>Músculo</label>}
        <Controller
          control={control}
          name={`dias.${diaIndex}.ejercicios.${ejIndex}.musculoId`}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <select
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onChange(val);
                // --- CAMBIO: Usamos null en lugar de "" ---
                setValue(
                  `dias.${diaIndex}.ejercicios.${ejIndex}.id_ejercicio`,
                  null
                );
              }}
              onBlur={onBlur}
              value={value || ""}
              ref={ref}
              disabled={!grupoSeleccionadoId || loadingMusculos}
            >
              <option value="">
                {loadingMusculos ? "Cargando..." : "Seleccionar..."}
              </option>
              {musculos.map((m: Musculo) => (
                <option key={m.id_musculo} value={m.id_musculo}>
                  {m.nombre_musculo}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      <div className="form-group">
        {ejIndex === 0 && <label>Ejercicio</label>}
        <Controller
          control={control}
          name={`dias.${diaIndex}.ejercicios.${ejIndex}.id_ejercicio`}
          rules={{ required: true }}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <select
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              value={value || ""}
              ref={ref}
              disabled={!musculoSeleccionadoId || loadingEjercicios}
            >
              <option value="">
                {loadingEjercicios ? "Cargando..." : "Seleccionar..."}
              </option>
              {ejercicios.map((e: Ejercicio) => (
                <option key={e.id_ejercicio} value={e.id_ejercicio}>
                  {e.nombre_ejercicio}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Los inputs de número se quedan igual */}
      <div className="form-group">
        {ejIndex === 0 && <label>Series</label>}
        <input
          type="number"
          {...register(`dias.${diaIndex}.ejercicios.${ejIndex}.series`, {
            required: true,
            valueAsNumber: true,
          })}
        />
      </div>
      <div className="form-group">
        {ejIndex === 0 && <label>Reps</label>}
        <input
          type="number"
          {...register(`dias.${diaIndex}.ejercicios.${ejIndex}.repeticiones`, {
            required: true,
            valueAsNumber: true,
          })}
        />
      </div>
      <div className="form-group">
        {ejIndex === 0 && <label>Peso</label>}
        <input
          type="number"
          step="0.01"
          {...register(
            `dias.${diaIndex}.ejercicios.${ejIndex}.peso_ejercicio`,
            { valueAsNumber: true }
          )}
        />
      </div>
      <button type="button" className="btn btn-destructive" onClick={onRemove}>
        X
      </button>
    </div>
  );
}
