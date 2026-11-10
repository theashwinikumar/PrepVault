import { forwardRef } from "react";

const VARIANTS = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-sm shadow-sky-600/20 border border-sky-600",
  college:
    "bg-[#0F2B48] text-white hover:bg-[#163a61] active:bg-[#0c223a] shadow-sm shadow-slate-900/10 border border-[#0F2B48]",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80",
  outline:
    "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 hover:border-slate-300 shadow-sm",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  danger:
    "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200",
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200",
};

const SIZES = {
  sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2 rounded-xl gap-2",
  lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    loading = false,
    leftIcon = null,
    rightIcon = null,
    type = "button",
    ...props
  },
  ref
) {
  const variantStyles = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyles = SIZES[size] || SIZES.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});

export default Button;

