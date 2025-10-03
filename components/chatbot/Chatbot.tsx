"use client";

import { useEffect } from "react";

const Chatbot = () => {
  useEffect(() => {
    const chatbotId = process.env.NEXT_PUBLIC_CHATBASE_ID;

    if (!chatbotId) {
      console.error("Chatbase ID no está configurado.");
      return;
    }

    // Esta configuración carga el script de Chatbase en la página
    const script = document.createElement("script");
    script.src = "https://www.chatbase.co/embed.min.js";
    script.defer = true;
    script.id = chatbotId; // Le damos un ID para evitar duplicados

    // Evita añadir el script múltiples veces si el componente se re-renderiza
    if (!document.getElementById(chatbotId)) {
      document.body.appendChild(script);
    }

    // Configura el chatbot una vez que el script está listo
    window.chatbaseConfig = {
      chatbotId: chatbotId,
    };

    // Limpieza al desmontar el componente
    return () => {
      // Elimina el script del chatbot
      const existingScript = document.getElementById(chatbotId);
      if (existingScript) {
        existingScript.remove();
      }

      // Elimina el widget del chatbot del DOM
      const widget = document.getElementById("chatbase-bubble-window");
      if (widget) {
        widget.remove();
      }
      // Elimina el botón del chatbot del DOM
      const bubbleButton = document.getElementById("chatbase-bubble-button");
      if (bubbleButton) {
        bubbleButton.remove();
      }

      // Limpia la configuración global
      delete window.chatbaseConfig;
    };
  }, []);

  return null; //El componente en sí no renderiza nada, solo añade el script
};

export default Chatbot;
