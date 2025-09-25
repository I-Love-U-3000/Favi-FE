"use client";

import { useContext } from "react";
import { PrimeReactContext } from "primereact/api";

export function PrimeSwapper() {
  const { changeTheme } = useContext(PrimeReactContext);

  const switchTo = (newTheme: string) => {
    // changeTheme(currentTheme, newTheme, idOfLinkElement, callbackOptional)
    if (changeTheme) {
      changeTheme(
        "lara-light-blue",       // theme hiện tại (cần biết)
        newTheme,                // theme muốn đổi
        "theme-link",            // id của link element như trên
        () => { console.log("theme changed to", newTheme); }
      );
    }
  };

  return (
    <div>
      <button onClick={() => switchTo("vela-blue/theme.css")}>
        Vela Blue
      </button>
      <button onClick={() => switchTo("saga-blue/theme.css")}>
        Saga Blue
      </button>
    </div>
  );
}
