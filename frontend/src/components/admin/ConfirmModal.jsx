import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  description,
  question,
  confirmText = "Confirm",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  const cancelRef = useRef(null);

  const isDanger = variant === "danger";

  const Icon = isDanger
    ? AlertTriangle
    : CheckCircle;

  // Handle Escape key and restore focus

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      previousFocus?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >

        {/* Modal Body */}

        <div className="p-6">

          <div className="flex justify-between items-start">

            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isDanger
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <Icon size={28} />
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close confirmation"
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X size={22} />
            </button>

          </div>

          {/* Title */}

          <h2
            id="confirm-modal-title"
            className="text-xl font-bold text-slate-900 mt-5"
          >
            {title}
          </h2>

          {/* Description */}

          <p
            id="confirm-modal-description"
            className="text-sm text-slate-500 mt-3 leading-relaxed"
          >
            {description}
          </p>

          {/* Selected Question */}

          {question && (
            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">

              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Selected Question
              </p>

              <p className="text-sm text-slate-900 font-medium mt-2 break-words">
                {question}
              </p>

            </div>
          )}

        </div>

        {/* Footer Buttons */}

        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-wrap justify-end gap-3">

          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>

        </div>

      </div>

    </div>
  );
}