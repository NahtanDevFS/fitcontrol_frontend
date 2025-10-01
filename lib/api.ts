export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND;

interface ApiResponse<T = any> {
  success: boolean;
  requiresVerification?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

import { Session } from "@supabase/supabase-js";

if (!API_BASE_URL) {
  throw new Error(
    "La variable NEXT_PUBLIC_API_URL_BACKEND no está definida en el entorno."
  );
}
//Función genérica para manejar las peticiones fetch
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Error del servidor (${response.status})`,
      }));
      throw new Error(errorData.error || "Error en la solicitud");
    }

    //Si la respuesta no tiene contenido como un delete exitoso
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    //Revisa si la respuesta del backend ya viene envuelta en un objeto
    //Si no, asume que la respuesta completa es la data
    const payload = data.data !== undefined ? data.data : data;

    return { success: true, data: payload };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
export const API_ENDPOINTS = {
  USUARIO: {
    BASE: `${API_BASE_URL}/api/usuario`,
  },
};

// Funciones específicas para autenticación
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", //Importante para manejar cookies de sesión
      });

      if (!response.ok) {
        //Si hay un error en la respuesta
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error en la autenticación");
        } else {
          const errorText = await response.text();
          throw new Error(
            `Error del servidor (${response.status}): ${errorText}`
          );
        }
      }

      const data = await response.json();

      //Guardar token en cookies y localStorage
      document.cookie = `authToken=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem("authToken", data.session.access_token);
      localStorage.setItem("userFitControl", JSON.stringify(data.user));

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },
  register: async (email: string, password: string, nombre_usuario: string) => {
    const response = await api.post("/auth/registro", {
      email,
      password,
      nombre_usuario,
    });

    if (response.success) {
      return {
        success: true,
        requiresVerification: true,
        message: response.message || "Por favor verifica tu correo electrónico",
        error: response.error,
      };
    }

    return response;
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include", //Importante para limpiar cookies
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }

      //Limpiar el token del cliente
      localStorage.removeItem("authToken");
      localStorage.removeItem("userFitControl");
      document.cookie =
        "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      return { success: true, message: "Sesión cerrada exitosamente" };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  sendPasswordResetEmail: async (email: string): Promise<ApiResponse> => {
    return api.post("/auth/reset-password", { email });
  },

  updateUserPassword: async (
    password: string,
    session: Session
  ): Promise<ApiResponse> => {
    //El backend necesita el access_token y refresh_token para establecer la sesión
    return api.post("/auth/update-password", {
      password,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  },
};
