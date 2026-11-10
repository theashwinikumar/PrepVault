import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
  query,
  onChange,
  onSearchSubmit,
  placeholder = "Search questions, companies, topics (e.g. DBMS, Two Sum, Infosys)...",
  className = "",
  autoFocus = false,
}) {
  const inputRef = useRef(null);

  // Global hotkey: press '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "/" && document.activeElement !== inputRef.current && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4 text-slate-400" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearchSubmit) {
            onSearchSubmit(query);
          }
          if (e.key === "Escape") {
            onChange("");
            inputRef.current?.blur();
          }
        }}
        placeholder={placeholder}
        aria-label="Search questions, topics, companies"
        className="w-full pl-10 pr-20 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {query ? (
          <button
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded">
            /
          </kbd>
        )}
      </div>
    </div>
  );
}

