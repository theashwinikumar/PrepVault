import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { bulkImportQuestions } from "../../services/adminApi";
import { useAdminQuestions } from "../../context/AdminQuestionContext";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function BulkImport() {
  const inputRef = useRef(null);
  const { refreshMetadata } = useAdminQuestions();

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function selectFile(selectedFile) {
    if (!selectedFile || importing) return;

    setError("");
    setResult(null);
    setFile(null);

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx"].includes(extension)) {
      setError("Please select a CSV or XLSX file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 10 MB.");
      return;
    }

    setFile(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);

    if (importing) return;
    selectFile(e.dataTransfer.files[0]);
  }

  function removeFile() {
    setFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function downloadTemplate() {
    const csv = [
      "subject_slug,topic_slug,question_text,difficulty,question_type,answer,explanation,status",
      'operating-systems,deadlocks,"What is deadlock in an operating system?",medium,theory,"Processes waiting indefinitely for resources held by each other.","Occurs when mutual exclusion, hold and wait, no preemption, and circular wait hold simultaneously.",draft',
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "prepvault_import_template.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (importing) return;

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const response = await bulkImportQuestions(file);
      setResult(response);
      refreshMetadata();
      toast.success("Bulk import completed!");
    } catch (err) {
      const message = err.message || "Unable to complete bulk import.";
      setError(message);
      toast.error(message);
    } finally {
      setImporting(false);
    }
  }

  const batch = result?.batch || null;
  const rowErrors = result?.errors || [];
  const totalRecords = batch?.total_records || 0;
  const insertedRecords = batch?.inserted_records || 0;
  const duplicateRecords = batch?.duplicate_records || 0;
  const invalidRecords = batch?.invalid_records || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        {" / Bulk Import"}
      </div>

      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bulk Import Questions
          </h1>
          <p className="text-slate-500 mt-2">
            Upload a CSV or XLSX file to import questions directly into the database.
          </p>
        </div>

        <Link
          to="/admin/import/history"
          className="border border-slate-300 bg-white rounded-lg px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          View Import History
        </Link>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-7 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-5">
          Upload Question File
        </h2>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!importing) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <div className="text-5xl text-blue-600 mb-5">↑</div>

          <h3 className="text-xl font-semibold text-slate-900">
            Drag and drop your file here
          </h3>

          <p className="text-slate-500 mt-2">
            or select a file from your computer
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            disabled={importing}
            onChange={(e) => {
              selectFile(e.target.files[0]);
              e.target.value = "";
            }}
            className="hidden"
          />

          <button
            type="button"
            disabled={importing}
            onClick={() => inputRef.current.click()}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            Browse Files
          </button>

          <p className="text-xs text-slate-500 mt-4">
            CSV or XLSX · Maximum 10 MB
          </p>
        </div>

        {/* Selected File */}
        {file && (
          <div className="mt-5 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-700 rounded-lg p-3 font-bold">
                {file.name.split(".").pop().toUpperCase()}
              </div>

              <div>
                <p className="font-semibold text-slate-900 break-all">
                  {file.name}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFile}
              disabled={importing}
              className="text-red-600 hover:underline text-sm disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div
            role="alert"
            className="mt-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <div
            role="status"
            className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-blue-700">
                Uploading and importing questions...
              </p>
            </div>
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex flex-wrap justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={downloadTemplate}
            className="border border-slate-300 text-slate-700 rounded-lg px-5 py-3 font-medium hover:bg-slate-100"
          >
            Download CSV Template
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!file || importing || Boolean(batch)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing
              ? "Importing..."
              : batch
                ? "Import Completed"
                : "Import Questions"}
          </button>
        </div>
      </div>

      {/* File Format Guidelines */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          File Format Guidelines
        </h2>

        <p className="text-sm text-slate-500 mb-4">
          Columns must match the FastAPI import schema below.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Column</th>
                <th className="p-3">Requirement</th>
                <th className="p-3">Allowed Values / Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["subject_slug", "Required", "dsa, dbms, operating-systems, computer-networks, oops"],
                ["topic_slug", "Required", "deadlocks, sql, arrays, tcp/ip"],
                ["question_text", "Required", "What is deadlock?"],
                ["difficulty", "Required", "easy, medium, hard"],
                ["question_type", "Required", "theory, mcq, coding, output_based, multiple_select"],
                ["answer", "Optional", "Correct answer text"],
                ["explanation", "Optional", "Detailed explanation"],
                ["status", "Optional", "draft, published (default), disabled"],
              ].map(([column, req, example]) => (
                <tr key={column}>
                  <td className="p-3 font-medium text-slate-900 font-mono text-xs">
                    {column}
                  </td>
                  <td className="p-3 text-slate-600">{req}</td>
                  <td className="p-3 text-slate-500">{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Results */}
      {batch && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Import Results</h2>
              <p className="text-sm text-slate-500 mt-2 break-all">
                Batch ID: {batch.id}
              </p>
              <p className="text-sm text-slate-500">
                File: {batch.filename || file?.name}
              </p>
              <p className="text-sm text-slate-500">
                Started: {new Date(batch.started_at).toLocaleString()}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                invalidRecords > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {invalidRecords > 0 ? "Completed with Errors" : "Completed"}
            </span>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Rows", value: totalRecords, color: "text-slate-900" },
              { label: "Imported", value: insertedRecords, color: "text-green-600" },
              {
                label: "Skipped (Duplicates)",
                value: duplicateRecords,
                color: "text-amber-600",
              },
              { label: "Errors", value: invalidRecords, color: "text-red-600" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <h3 className={`text-3xl font-bold mt-3 ${item.color}`}>
                  {item.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Distribution Bar */}
          {totalRecords > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">
                Import Distribution
              </h3>

              <div className="flex h-5 w-full rounded-full overflow-hidden bg-slate-100">
                <div
                  className="bg-green-500"
                  style={{ width: `${(insertedRecords / totalRecords) * 100}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(duplicateRecords / totalRecords) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(invalidRecords / totalRecords) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-6 mt-4 text-sm">
                <span className="text-green-600">● Imported: {insertedRecords}</span>
                <span className="text-amber-600">
                  ● Skipped / Duplicate: {duplicateRecords}
                </span>
                <span className="text-red-600">● Errors: {invalidRecords}</span>
              </div>
            </div>
          )}

          {/* Row-Level Errors */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-bold text-slate-900">Row-Level Errors</h3>
              <p className="text-sm text-slate-500 mt-1">
                {rowErrors.length > 0
                  ? `${rowErrors.length} row(s) failed validation during import.`
                  : "All rows passed validation without errors."}
              </p>
            </div>

            {rowErrors.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4">Row Number</th>
                      <th className="p-4">Error Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rowErrors.map((errItem, idx) => (
                      <tr key={`${errItem.row}-${idx}`}>
                        <td className="p-4 text-slate-600 font-medium">
                          Row {errItem.row}
                        </td>
                        <td className="p-4 text-red-700">{errItem.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Result Actions */}
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              to="/admin/import/history"
              className="border border-slate-300 rounded-lg px-5 py-3 text-slate-700 font-medium hover:bg-slate-100"
            >
              View Import History
            </Link>

            <button
              type="button"
              onClick={removeFile}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-3 font-medium"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
