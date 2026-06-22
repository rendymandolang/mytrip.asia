"use client";

import { useEffect, useState } from "react";

const languages = [
  { code: "en", flag: "🇬🇧" },
  { code: "id", flag: "🇮🇩" },
  { code: "ru", flag: "🇷🇺" },
  { code: "zh", flag: "🇨🇳" },
];

export default function LanguageSelector() {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved =
      localStorage.getItem("mytrip-language");

    if (saved) {
      setLanguage(saved);
    }
  }, []);

  function updateLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    localStorage.setItem(
      "mytrip-language",
      nextLanguage,
    );
  }

  return (
    <div className="fixed right-3 top-3 z-[80]">
      <select
        aria-label="Language"
        value={language}
        onChange={(event) =>
          updateLanguage(event.target.value)
        }
        className="h-9 w-14 rounded-full border border-slate-200 bg-white px-2 text-center text-lg shadow-sm outline-none"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.flag}
          </option>
        ))}
      </select>
    </div>
  );
}
