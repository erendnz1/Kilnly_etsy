"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme");

    const shouldBeDark =
      savedTheme !== "light";

    document.documentElement.classList.toggle(
      "dark",
      shouldBeDark
    );

    setDark(shouldBeDark);

    if (!savedTheme) {
      localStorage.setItem(
        "theme",
        shouldBeDark ? "dark" : "light"
      );
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;

    setDark(nextDark);

    document.documentElement.classList.toggle(
      "dark",
      nextDark
    );

    localStorage.setItem(
      "theme",
      nextDark ? "dark" : "light"
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
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