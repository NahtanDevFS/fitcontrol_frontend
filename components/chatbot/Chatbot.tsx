"use client";

import { useEffect } from "react";

const Chatbot = () => {
  useEffect(() => {
    //Esta configuración carga el script de Chatbase en la página
    const script = document.createElement("script");
    script.src = "https://www.chatbase.co/embed.min.js";
    script.defer = true;
    script.id = process.env.NEXT_PUBLIC_CHATBASE_ID!; //Le damos un ID para evitar duplicados

    //Evitamos añadir el script múltiples veces si el componente se re-renderiza
    if (!document.getElementById(process.env.NEXT_PUBLIC_CHATBASE_ID!)) {
      document.body.appendChild(script);
    }

    //Configuramos el chatbot una vez que el script está listo
    window.chatbaseConfig = {
      chatbotId: process.env.NEXT_PUBLIC_CHATBASE_ID,
    };

    //Limpieza al desmontar el componente
    return () => {
      const existingScript = document.getElementById(
        process.env.NEXT_PUBLIC_CHATBASE_ID!
      );
      if (existingScript) {
        //No lo eliminamos para que el chat persista, pero podrías hacerlo si quisieras
      }
    };
  }, []);

  return null; //El componente en sí no renderiza nada, solo añade el script
};

export default Chatbot;
