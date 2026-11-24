import { useState } from "react";
import { Link } from "react-router-dom";

const sampleBatches = [
  {
    id: "IMP-003",
    fileName: "os_questions.xlsx",
    date: "2026-11-24T18:30:00",
    totalRows: 100,
    imported: 85,
    skipped: 10,
    errors: 5,
    issues: [
      {
        row: 12,
        status: "Skipped",
        reason: "Duplicate question",
      },
      {
        row: 26,
        status: "Failed",
        reason: "Invalid subject ID",
      },
      {
        row: 42,
        status: "Failed",
        reason: "Missing question text",
      },
    ],
  },
  {
    id: "IMP-002",
    fileName: "dbms_questions.csv",
    date: "2026-11-23T14:20:00",
    totalRows: 50,
    imported: 48,
    skipped: 2,
    errors: 0,
    issues: [
      {
        row: 8,
        status: "Skipped",
        reason: "Duplicate question",
      },
      {
        row: 19,
        status: "Skipped",
        reason: "Duplicate question",
      },
    ],
  },
  {
    id: "IMP-001",
    fileName: "dsa_questions.xlsx",
    date: "2026-11-22T10:15:00",
    totalRows: 128,
    imported: 120,
    skipped: 5,
    errors: 3,
    issues: [
      {
        row: 15,
        status: "Failed",
        reason: "Invalid difficulty",
      },
      {
        row: 24,
        status: "Skipped",
        reason: "Duplicate question",
      },
    ],
  },
];

function loadBatches() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        "prepvault_demo_import_history"
      ) || "[]"
    );

    return [
      ...(Array.isArray(saved) ? saved : []),
      ...sampleBatches,
    ];
  } catch {
    return sampleBatches;
  }
}

export default function ImportHistory() {
  const [batches] = useState(loadBatches);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedBatch, setSelectedBatch] =
    useState(null);

  function getBatchStatus(batch) {
    if (batch.imported === 0 && batch.errors > 0) {
      return "Failed";
    }

    if (batch.errors > 0) {
      return "Completed with Errors";
    }

    return "Completed";
  }

  const filteredBatches = batches.filter((batch) => {
    const query = search.trim().toLowerCase();

    return (
      (
        batch.fileName.toLowerCase().includes(query) ||
        batch.id.toLowerCase().includes(query)
      ) &&
      (!status || getBatchStatus(batch) === status)
    );
  });

  const stats = [
    {
      label: "Total Batches",
      value: batches.length,
      color: "text-slate-900",
    },
    {
      label: "Imported",
      value: batches.reduce(
        (sum, batch) => sum + batch.imported, 0
      ),
      color: "text-green-600",
    },
    {
      label: "Skipped",
      value: batches.reduce(
        (sum, batch) => sum + batch.skipped, 0
      ),
      color: "text-amber-600",
    },
    {
      label: "Errors",
      value: batches.reduce(
        (sum, batch) => sum + batch.errors, 0
      ),
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Page Heading */}

      <div className="flex flex-wrap justify-between items-center gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Import History
          </h1>

          <p className="text-slate-500 mt-2">
            Track and review previous question import batches.
          </p>
        </div>

        <Link
          to="/admin/import"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + New Import
        </Link>

      </div>

      {/* Demo Notice */}

      <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4 text-sm">
        Frontend preview mode. This page displays simulated
        import batches and locally saved demo history.
        Backend import history is not connected.
      </div>

      {/* Statistics */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {stat.label}
            </p>

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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option>Completed</option>
            <option>Completed with Errors</option>
            <option>Failed</option>
          </select>

        </div>

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

              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="hover:bg-slate-50"
                >

                  <td className="p-4 text-slate-500">
                    {batch.id}
                  </td>

                  <td className="p-4 font-medium text-slate-900">
                    {batch.fileName}
                  </td>

                  <td className="p-4 whitespace-nowrap text-slate-600">
                    {new Date(batch.date).toLocaleString()}
                  </td>

                  <td className="p-4">
                    {batch.totalRows}
                  </td>

                  <td className="p-4 font-medium text-green-600">
                    {batch.imported}
                  </td>

                  <td className="p-4 font-medium text-amber-600">
                    {batch.skipped}
                  </td>

                  <td className="p-4 font-medium text-red-600">
                    {batch.errors}
                  </td>

                  <td className="p-4">

                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      batch.errors > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>

                      {getBatchStatus(batch)}

                    </span>

                  </td>

                  <td className="p-4">

                    <button
                      onClick={() => setSelectedBatch(batch)}
                      className="text-blue-600 hover:underline whitespace-nowrap"
                    >
                      View Details
                    </button>

                  </td>

                </tr>
              ))}

              {filteredBatches.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center text-slate-500 py-14"
                  >
                    No import batches found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        <div className="p-5 border-t text-sm text-slate-500">
          Showing {filteredBatches.length} of {batches.length} batches
        </div>

      </div>

      {/* Batch Details Modal */}

      {selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Import batch details"
            className="bg-white rounded-xl p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-bold text-slate-900">
                Import Batch Details
              </h2>

              <button
                aria-label="Close"
                onClick={() => setSelectedBatch(null)}
                className="text-2xl text-slate-500"
              >
                ×
              </button>

            </div>

            <div className="bg-slate-50 rounded-lg p-5 space-y-2 text-sm">

              <p>
                <strong>Batch ID:</strong> {selectedBatch.id}
              </p>

              <p>
                <strong>File:</strong> {selectedBatch.fileName}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedBatch.date).toLocaleString()}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {getBatchStatus(selectedBatch)}
              </p>

            </div>

            {/* Batch Statistics */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">

              {[
                ["Total Rows", selectedBatch.totalRows, "text-slate-900"],
                ["Imported", selectedBatch.imported, "text-green-600"],
                ["Skipped", selectedBatch.skipped, "text-amber-600"],
                ["Errors", selectedBatch.errors, "text-red-600"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="border rounded-lg p-4"
                >
                  <p className="text-sm text-slate-500">
                    {label}
                  </p>

                  <p className={`text-2xl font-bold mt-2 ${color}`}>
                    {value}
                  </p>
                </div>
              ))}

            </div>

            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Row-Level Report
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Illustrative issues from the simulated batch.
            </p>

            <div className="overflow-x-auto border rounded-lg">

              <table className="w-full text-sm text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4">Row</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                  </tr>
                </thead>

                <tbody className="divide-y">

                  {(selectedBatch.issues || []).map((issue) => (
                    <tr key={issue.row}>

                      <td className="p-4">
                        {issue.row}
                      </td>

                      <td className={`p-4 font-medium ${
                        issue.status === "Skipped"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}>
                        {issue.status}
                      </td>

                      <td className="p-4">
                        {issue.reason}
                      </td>

                    </tr>
                  ))}

                  {!selectedBatch.issues?.length && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No row-level issues recorded.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">

              <button
                onClick={() => setSelectedBatch(null)}
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