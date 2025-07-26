export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BACKEND;

interface ApiResponse {
  success: boolean;
  requiresVerification?: boolean;
  data?: any;
  error?: string;
  message?: string;
}

if (!API_BASE_URL) {
  throw new Error(
    "La variable NEXT_PUBLIC_API_URL_BACKEND no está definida en el entorno."
  );
}

export const api = {
  async post(endpoint: string, body: any): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error en la solicitud");
        } else {
          const errorText = await response.text();
          throw new Error(
            `Error del servidor (${response.status}): ${errorText}`
          );
        }
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },
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
        credentials: "include", // Importante para manejar cookies de sesión
      });

      if (!response.ok) {
        // Si hay un error en la respuesta
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

      // Guardar token en cookies y localStorage
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
        credentials: "include", // Importante para limpiar cookies
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }

      // Limpiar el token del cliente
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
};
