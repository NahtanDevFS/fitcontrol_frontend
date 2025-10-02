"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { FcGoogle } from "react-icons/fc";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Este evento se dispara cuando el usuario inicia sesión exitosamente
        if (event === "SIGNED_IN" && session) {
          // 1. Obtenemos los datos de nuestro perfil desde la tabla 'usuario'
          const { data: userData, error: userError } = await supabase
            .from("usuario")
            .select("*")
            .eq("id_usuario", session.user.id)
            .single();

          if (userError || !userData) {
            console.error(
              "No se encontró el perfil del usuario después del login de Google",
              userError
            );
            setError("Error al obtener el perfil del usuario.");
            return;
          }

          // 2. Creamos el objeto de usuario que guardamos en localStorage
          const userToStore = {
            id: userData.id_usuario,
            nombre: userData.nombre_usuario,
            email: userData.correo_usuario,
          };

          // 3. Guardamos la sesión y los datos del usuario, igual que en el login normal
          localStorage.setItem("authToken", session.access_token);
          localStorage.setItem("userFitControl", JSON.stringify(userToStore));

          // 4. Redirigimos al dashboard
          router.push("/dashboard");
        }
      }
    );

    // Limpiamos el listener cuando el componente se desmonta
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.login(email, password);

    if (result.success && result.data?.session) {
      // Guardar token en localStorage
      localStorage.setItem("authToken", result.data.session.access_token);
      localStorage.setItem("userFitControl", JSON.stringify(result.data.user));
      router.push("/dashboard");
    } else {
      setError(result.error || "Credenciales incorrectas");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    //Si no hay error, Supabase redirigirá al usuario a Google
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <div className="login-header">
          <Image
            src="/favicon.ico"
            alt="FitControl Logo"
            width={50}
            height={50}
            className="login-logo"
          />
          <h1>FitControl</h1>
        </div>
        <p className="login-description">Gestiona tu vida Fitness</p>

        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div style={{ margin: "20px 0", textAlign: "center", color: "#aaa" }}>
          O
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="auth-button-google"
        >
          <FcGoogle size={22} />
          <span>Ingresar con Google</span>
        </button>

        <p className="register-link">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
        <p className="register-link">
          ¿Olvidaste tu contraseña?{" "}
          <a href="/reset-password">Recupérala aquí</a>
        </p>
      </div>
    </div>
  );
}
