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
import { routineService } from "@/services/RoutineService";
import Swal from "sweetalert2";

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
          dia_semana: dia.dia_semana,
          ejercicios: dia.ejercicios.map((ej: RutinaDiaEjercicio) => {
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
      const payload = {
        nombre_rutina: data.nombre_rutina,
        id_usuario: userId,
        dias: data.dias.map((dia) => ({
          dia_semana: dia.dia_semana,
          ejercicios: dia.ejercicios
            .filter((ej) => ej.id_ejercicio) // Ensure exercise is selected
            .map((ej) => ({
              id_ejercicio: ej.id_ejercicio,
              series: ej.series,
              repeticiones: ej.repeticiones,
              peso_ejercicio: ej.peso_ejercicio || null,
            })),
        })),
      };

      let response;
      if (rutinaExistente) {
        response = await routineService.updateRutinaCompleta(
          rutinaExistente.id_rutina,
          payload
        );
      } else {
        response = await routineService.createRutina(payload);
      }

      if (response.success) {
        Swal.fire(
          "¡Éxito!",
          `Rutina ${rutinaExistente ? "actualizada" : "creada"} exitosamente!`,
          "success"
        );
        onSuccess();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error("Error al guardar la rutina:", error);
      Swal.fire(
        "Error",
        `No se pudo guardar la rutina: ${error.message}`,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={onClose}>
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
                  setValue={setValue}
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
              disabled={isSubmitting || isLoadingLookups}
            >
              {isSubmitting ? "Guardando..." : "Guardar Rutina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
          setValue={setValue}
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
    <div className="exercise-row">
      <div className="form-group">
        <label>Grupo Muscular</label>
        <Controller
          control={control}
          name={`dias.${diaIndex}.ejercicios.${ejIndex}.grupoId`}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <select
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onChange(val);
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
              {gruposMusculares.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre_grupo}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="form-group">
        <label>Músculo</label>
        <Controller
          control={control}
          name={`dias.${diaIndex}.ejercicios.${ejIndex}.musculoId`}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <select
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onChange(val);
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
              {musculos.map((m) => (
                <option key={m.id_musculo} value={m.id_musculo}>
                  {m.nombre_musculo}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="form-group">
        <label>Ejercicio</label>
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
              {ejercicios.map((e) => (
                <option key={e.id_ejercicio} value={e.id_ejercicio}>
                  {e.nombre_ejercicio}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="form-group">
        <label>Series</label>
        <input
          type="number"
          {...register(`dias.${diaIndex}.ejercicios.${ejIndex}.series`, {
            required: true,
            valueAsNumber: true,
          })}
        />
      </div>
      <div className="form-group">
        <label>Reps</label>
        <input
          type="number"
          {...register(`dias.${diaIndex}.ejercicios.${ejIndex}.repeticiones`, {
            required: true,
            valueAsNumber: true,
          })}
        />
      </div>
      <div className="form-group">
        <label>Peso</label>
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
