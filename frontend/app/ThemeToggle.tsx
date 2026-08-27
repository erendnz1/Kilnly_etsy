"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    // Daha önce seçim yapılmadıysa DARK
    if (!savedTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
      return;
    }

    // Daha önce light seçildiyse light
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
      return;
    }

    // Daha önce dark seçildiyse dark
    document.documentElement.classList.add("dark");
    setDark(true);
  }, []);

  const toggleTheme = () => {
    const isDark = !dark;

    setDark(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        flex h-9 w-9 items-center justify-center
        rounded-full
        border border-[#dfe9e4]
        bg-white
        text-sm text-[#46534f]
        transition
        hover:bg-[#f0f7f4]

        dark:border-[#29483d]
        dark:bg-[#172c24]
        dark:text-[#d3e4dd]
        dark:hover:bg-[#234137]
      "
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}