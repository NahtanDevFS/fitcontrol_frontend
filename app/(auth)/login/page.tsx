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

  // useEffect(() => {
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     async (event, session) => {
  //       if (event === "SIGNED_IN" && session) {
  //         const { data: userData, error: userError } = await supabase
  //           .from("usuario")
  //           .select("*")
  //           .eq("id_usuario", session.user.id)
  //           .single();

  //         if (userError || !userData) {
  //           console.error("Error al obtener el perfil del usuario:", userError);
  //           setError("No se pudo cargar el perfil del usuario.");
  //           return;
  //         }

  //         const userToStore = {
  //           id: userData.id_usuario,
  //           nombre: userData.nombre_usuario,
  //           email: userData.correo_usuario,
  //         };
  //         //Crear la cookie que el middleware necesita
  //         document.cookie = `authToken=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;

  //         //Guardar el token y los datos del usuario en localStorage
  //         localStorage.setItem("authToken", session.access_token);
  //         localStorage.setItem("userFitControl", JSON.stringify(userToStore));

  //         //Forzar una recarga completa para asegurar que el middleware lea la nueva cookie
  //         window.location.href = "/dashboard";
  //       }
  //     }
  //   );

  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.login(email, password);

    if (result.success) {
      //Esta redirección funciona porque authService.login sí crea la cookie
      router.push("/dashboard");
    } else {
      setError(result.error || "Credenciales incorrectas");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        //apunta al backend
        redirectTo: `${process.env.NEXT_PUBLIC_API_URL_BACKEND}/api/auth/google/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
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
