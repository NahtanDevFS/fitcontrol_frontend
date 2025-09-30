export interface Ejercicio {
  id_ejercicio: number;
  nombre_ejercicio: string;
  descripcion_ejercicio: string;
}

export interface RutinaDiaEjercicio {
  id_rutina_dia_semana_ejercicio?: number;
  id_rutina_dia_semana?: number;
  id_ejercicio: number | null;
  ejercicio?: Ejercicio;
  repeticiones: number;
  series: number;
  peso_ejercicio?: number | null;
  grupoId?: number | null;
  musculoId?: number | null;
}

export interface RutinaDia {
  id_rutina_dia_semana?: number;
  id_rutina?: number;
  dia_semana: string;
  ejercicios: RutinaDiaEjercicio[];
}

export interface Rutina {
  id_rutina: number;
  id_usuario: string;
  nombre_rutina: string;
  fecha_creacion_rutina: string;
  dias: RutinaDia[];
}

export interface GrupoMuscular {
  id_grupo: number;
  nombre_grupo: string;
}

export interface Musculo {
  id_musculo: number;
  id_grupo: number;
  nombre_musculo: string;
}

export interface CumplimientoRutina {
  id_cumplimiento_rutina: number;
  id_rutina_dia_semana: number;
  fecha_a_cumplir: string;
  cumplido: boolean;
}

export interface AlimentoDetalle {
  id_dieta_alimento_detalle?: number;
  id_dieta_alimento?: number;
  nombre_alimento: string;
  calorias_alimento: number;
  proteina_alimento: number;
  grasas_alimento: number;
  carbohidratos_alimento: number;
  gramos_alimento: number;
}

export interface TiempoComida {
  id_dieta_alimento?: number;
  id_dieta: number;
  tiempo_comida: string;
  dia_semana: string;
  alimentos: AlimentoDetalle[];
}

export interface Dieta {
  id_dieta: number;
  id_usuario: string;
  nombre_dieta: string;
  // Usamos un objeto anidado para un acceso más fácil: dias['Lunes']['Desayuno']
  dias: { [key: string]: { [key: string]: TiempoComida } };
}

export interface CumplimientoDietaDia {
  id: number;
  id_usuario: string;
  id_dieta: number;
  fecha_a_cumplir: string; //formato YYYY-MM-DD
  dia_semana: string;
  cumplido: boolean;
}

export interface Progreso {
  id_progreso: number;
  id_usuario: string;
  fecha_inicio_proceso: string;
  fecha_final_proceso: string | null;
  peso_actual: number;
  peso_deseado: number;
  objetivo: "bajar" | "subir";
  estado: number;
  peso_inicial: number;
}

export interface GastoEnergeticoData {
  id_usuario: string;
  sexo: "hombre" | "mujer";
  edad: number;
  altura_cm: number;
  peso_kg: number;
  nivel_actividad: number;
  tmb: number;
  calorias_mantener: number;
  calorias_deficit: number;
  calorias_superavit: number;
  peso_ideal_kg: number;
}

export interface ProfileData {
  nombre_usuario: string;
  correo_usuario: string;
  peso_actual: number | null;
  racha_rutina: number;
  racha_dieta: number;
  unidad_peso: "kg" | "lbs";
}

export interface Usuario {
  id_usuario: string;
  nombre_usuario: string;
  correo_usuario: string;
  fecha_creacion: string;
  estado: number;
  unidad_peso: "kg" | "lbs";
}

export interface DashboardData {
  nombreUsuario: string;
  rachaRutina: number;
  rachaDieta: number;
  pesoActual: number | null;
  metaPeso: number | null;
  unidadPeso: "kg" | "lbs";
}
