import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  fetchImportHistory,
  fetchImportBatchById,
} from "../../services/adminApi";

export default function ImportHistory() {
  const [reloadTick, setReloadTick] = useState(0);
  const [historyState, setHistoryState] = useState({
    tick: -1,
    batches: [],
    error: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    loading: false,
    batch: null,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    fetchImportHistory({ signal: controller.signal })
      .then((rows) => {
        setHistoryState({
          tick: reloadTick,
          batches: Array.isArray(rows) ? rows : [],
          error: "",
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setHistoryState({
          tick: reloadTick,
          batches: [],
          error: err.message || "Failed to load import history.",
        });
      });

    return () => controller.abort();
  }, [reloadTick]);

  const loading = historyState.tick !== reloadTick;
  const batches = historyState.batches;
  const apiError = historyState.tick === reloadTick ? historyState.error : "";

  function getBatchDisplayStatus(batch) {
    if (!batch) return "Unknown";
    if (batch.status === "processing") return "Processing";
    if (batch.inserted_records === 0 && batch.invalid_records > 0) return "Failed";
    if (batch.invalid_records > 0) return "Completed with Errors";
    return "Completed";
  }

  async function openBatchDetails(batch) {
    setModalState({
      open: true,
      loading: true,
      batch,
      error: "",
    });

    try {
      const latest = await fetchImportBatchById(batch.id);
      setModalState({
        open: true,
        loading: false,
        batch: latest,
        error: "",
      });
    } catch (err) {
      setModalState({
        open: true,
        loading: false,
        batch,
        error: err.message || "Could not refresh batch details.",
      });
    }
  }

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return batches.filter((batch) => {
      const fileName = String(batch.filename || "").toLowerCase();
      const idStr = String(batch.id || "").toLowerCase();
      const matchesSearch = !query || fileName.includes(query) || idStr.includes(query);
      const matchesStatus =
        !statusFilter || getBatchDisplayStatus(batch) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [batches, search, statusFilter]);

  const stats = [
    {
      label: "Total Batches",
      value: batches.length,
      color: "text-slate-900",
    },
    {
      label: "Imported",
      value: batches.reduce((sum, b) => sum + (b.inserted_records || 0), 0),
      color: "text-green-600",
    },
    {
      label: "Skipped / Duplicates",
      value: batches.reduce((sum, b) => sum + (b.duplicate_records || 0), 0),
      color: "text-amber-600",
    },
    {
      label: "Errors",
      value: batches.reduce((sum, b) => sum + (b.invalid_records || 0), 0),
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Import History</h1>
          <p className="text-slate-500 mt-2">
            Track and inspect previous question import batches.
          </p>
        </div>

        <Link
          to="/admin/import"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + New Import
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <h2 className={`text-3xl font-bold mt-3 ${stat.color}`}>
              {stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* History Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* Search and Filter */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap gap-3">
          <input
            type="text"
            aria-label="Search import batches"
            placeholder="Search by file name or batch ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-56 border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            aria-label="Import status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option>Completed</option>
            <option>Completed with Errors</option>
            <option>Failed</option>
            <option>Processing</option>
          </select>
        </div>

        {apiError && !loading && (
          <div
            role="alert"
            className="m-5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <span>{apiError}</span>
            <button
              type="button"
              onClick={() => setReloadTick((t) => t + 1)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Import History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "Batch ID",
                  "File Name",
                  "Import Date",
                  "Total Rows",
                  "Imported",
                  "Skipped",
                  "Errors",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="p-4 font-semibold whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-14">
                    Loading import history...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-14">
                    No import batches found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const displayStatus = getBatchDisplayStatus(batch);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-500 font-mono text-xs" title={batch.id}>
                        {String(batch.id).slice(0, 8)}
                      </td>

                      <td className="p-4 font-medium text-slate-900">
                        {batch.filename || "Untitled import"}
                      </td>

                      <td className="p-4 whitespace-nowrap text-slate-600">
                        {new Date(batch.started_at).toLocaleString()}
                      </td>

                      <td className="p-4">{batch.total_records}</td>

                      <td className="p-4 font-medium text-green-600">
                        {batch.inserted_records}
                      </td>

                      <td className="p-4 font-medium text-amber-600">
                        {batch.duplicate_records}
                      </td>

                      <td className="p-4 font-medium text-red-600">
                        {batch.invalid_records}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            batch.invalid_records > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => openBatchDetails(batch)}
                          className="text-blue-600 hover:underline whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t text-sm text-slate-500">
          Showing {filteredBatches.length} of {batches.length} batches
        </div>
      </div>

      {/* Batch Details Modal */}
      {modalState.open && modalState.batch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Import batch details"
            className="bg-white rounded-xl p-7 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Import Batch Details
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() =>
                  setModalState({ open: false, loading: false, batch: null, error: "" })
                }
                className="text-2xl text-slate-500"
              >
                ×
              </button>
            </div>

            {modalState.loading && (
              <p className="text-xs text-blue-600 mb-4">Refreshing batch details...</p>
            )}

            {modalState.error && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                {modalState.error}
              </p>
            )}

            <div className="bg-slate-50 rounded-lg p-5 space-y-2 text-sm">
              <p>
                <strong>Batch ID:</strong> {modalState.batch.id}
              </p>
              <p>
                <strong>File:</strong> {modalState.batch.filename || "Untitled import"}
              </p>
              <p>
                <strong>Started:</strong>{" "}
                {new Date(modalState.batch.started_at).toLocaleString()}
              </p>
              {modalState.batch.completed_at && (
                <p>
                  <strong>Completed:</strong>{" "}
                  {new Date(modalState.batch.completed_at).toLocaleString()}
                </p>
              )}
              <p>
                <strong>Status:</strong>{" "}
                {getBatchDisplayStatus(modalState.batch)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              {[
                ["Total Rows", modalState.batch.total_records, "text-slate-900"],
                ["Valid Rows", modalState.batch.valid_records, "text-blue-600"],
                ["Imported", modalState.batch.inserted_records, "text-green-600"],
                ["Duplicates", modalState.batch.duplicate_records, "text-amber-600"],
              ].map(([label, value, color]) => (
                <div key={label} className="border rounded-lg p-4">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 bg-slate-50 text-sm text-slate-600">
              <p>
                <strong>Invalid / Error Rows:</strong>{" "}
                <span className="text-red-600 font-semibold">
                  {modalState.batch.invalid_records}
                </span>
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() =>
                  setModalState({ open: false, loading: false, batch: null, error: "" })
                }
                className="bg-blue-600 text-white rounded-lg px-6 py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
