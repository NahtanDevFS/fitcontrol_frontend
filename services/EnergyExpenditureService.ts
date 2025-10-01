import { api } from "@/lib/api";
import { GastoEnergeticoData } from "@/types";

//tipo para los datos que enviamos a la API
type UpsertPayload = Omit<
  GastoEnergeticoData,
  | "tmb"
  | "calorias_mantener"
  | "calorias_deficit"
  | "calorias_superavit"
  | "peso_ideal_kg"
>;

export const energyExpenditureService = {
  //Obtiene los datos de gasto energético de un usuario.
  getGastoEnergetico: (userId: string) => {
    return api.get<GastoEnergeticoData>(`/gasto-energetico/${userId}`);
  },

  //Calcula y guarda los datos de gasto energético de un usuario.
  upsertGastoEnergetico: (payload: UpsertPayload) => {
    return api.post<GastoEnergeticoData>("/gasto-energetico", payload);
  },
};
