import { useEffect } from "react";

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (slug: string, options: Record<string, string>) => void;
    };
  }
}

const KofiWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      window.kofiWidgetOverlay?.draw("harmonilab", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support us",
        "floating-chat.donateButton.background-color": "#3d9b85",
        "floating-chat.donateButton.text-color": "#fff",
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default KofiWidget;
