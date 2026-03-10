import { useEffect } from "react";

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void;
      draw: () => void;
    };
  }
}

const KofiWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/widget/Widget_2.js";
    script.async = true;
    script.onload = () => {
      if (window.kofiwidget2) {
        window.kofiwidget2.init("Support us on Ko-fi", "#1e5e11", "J3J01VI9P0");
        window.kofiwidget2.draw();
      }
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default KofiWidget;
