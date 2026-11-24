import { useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function BulkImport() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // ==========================================
  // FILE VALIDATION
  // ==========================================

  function selectFile(selectedFile) {
    if (!selectedFile || importing) return;

    setError("");
    setResult(null);
    setFile(null);

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

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

  // ==========================================
  // DRAG AND DROP
  // ==========================================

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);

    if (importing) return;

    selectFile(e.dataTransfer.files[0]);
  }

  // ==========================================
  // REMOVE FILE
  // ==========================================

  function removeFile() {
    setFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  // ==========================================
  // FORMAT FILE SIZE
  // ==========================================

  function formatSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ==========================================
  // DOWNLOAD CSV TEMPLATE
  // ==========================================

  function downloadTemplate() {
    const csv = [
      "question,subject_id,topic_id,difficulty,question_type,answer,explanation,status",
      '"What is deadlock?",1,101,Medium,descriptive,"Processes waiting indefinitely for resources.","Circular resource dependency.",Draft',
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "prepvault_demo_template.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  // ==========================================
  // SIMULATED IMPORT
  // FRONTEND ONLY
  // ==========================================

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
      // Simulate API request.
      // No actual file processing is performed.

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      const batchId = `DEMO-${crypto.randomUUID()}`;

      const batch = {
        id: batchId,
        batchId: batchId,
        fileName: file.name,
        date: new Date().toISOString(),
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
          {
            row: 56,
            status: "Failed",
            reason: "Invalid difficulty",
          },
          {
            row: 72,
            status: "Skipped",
            reason: "Duplicate question",
          },
        ],
      };

      setResult(batch);

      // ==========================================
      // SAVE IMPORT HISTORY TO LOCAL STORAGE
      // ==========================================

      try {
        const savedHistory = JSON.parse(
          localStorage.getItem(
            "prepvault_demo_import_history"
          ) || "[]"
        );

        const previousHistory = Array.isArray(savedHistory)
          ? savedHistory
          : [];

        localStorage.setItem(
          "prepvault_demo_import_history",
          JSON.stringify([
            batch,
            ...previousHistory,
          ])
        );

      } catch (error) {
        console.error(
          "Unable to save import history:",
          error
        );

        setError(
          "Demo import completed, but history could not be saved."
        );
      }

    } catch (err) {
      setError("Unable to complete the demo import.");
    } finally {
      setImporting(false);
    }
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Breadcrumb */}

      <div className="text-sm text-slate-500">

        <Link
          to="/admin/dashboard"
          className="hover:text-blue-600"
        >
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
            Import multiple questions using CSV or Excel files.
          </p>
        </div>

        <Link
          to="/admin/import/history"
          className="border border-slate-300 bg-white rounded-lg px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          View Import History
        </Link>

      </div>

      {/* Demo Notice */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">

        Frontend preview mode. Import results are
        simulated. Files are not uploaded or processed,
        and no questions are added to the database.
        Demo import history is saved locally in your browser.

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

            if (!importing) {
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50"
          }`}
        >

          <div className="text-5xl text-blue-600 mb-5">
            ↑
          </div>

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
            CSV or XLSX · Maximum 10 MB (demo limit)
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
                Simulating question import...
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
            Download Demo Template
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!file || importing || Boolean(result)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing
              ? "Simulating Import..."
              : result
              ? "Demo Import Completed"
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
          The demo template uses the following columns.
          The final format must match the backend import schema.
        </p>

        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">

            <thead className="bg-slate-50 text-slate-600">

              <tr>
                <th className="p-3">Column</th>
                <th className="p-3">Description</th>
                <th className="p-3">Example</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {[
                [
                  "question",
                  "Question text",
                  "What is deadlock?",
                ],
                [
                  "subject_id",
                  "Subject identifier",
                  "1",
                ],
                [
                  "topic_id",
                  "Topic identifier",
                  "101",
                ],
                [
                  "difficulty",
                  "Difficulty level",
                  "Medium",
                ],
                [
                  "question_type",
                  "Question type",
                  "descriptive",
                ],
                [
                  "answer",
                  "Correct answer",
                  "Answer text",
                ],
                [
                  "explanation",
                  "Detailed explanation",
                  "Explanation text",
                ],
                [
                  "status",
                  "Question status",
                  "Draft",
                ],
              ].map(([column, description, example]) => (

                <tr key={column}>

                  <td className="p-3 font-medium text-slate-900">
                    {column}
                  </td>

                  <td className="p-3 text-slate-600">
                    {description}
                  </td>

                  <td className="p-3 text-slate-500">
                    {example}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ==========================================
          IMPORT RESULTS
      ========================================== */}

      {result && (

        <div className="space-y-6">

          {/* Result Heading */}

          <div className="flex flex-wrap justify-between items-center gap-4">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Demo Import Results
              </h2>

              <p className="text-sm text-slate-500 mt-2 break-all">
                Batch: {result.batchId}
              </p>

              <p className="text-sm text-slate-500">
                File: {result.fileName}
              </p>

              <p className="text-sm text-slate-500">
                Date: {new Date(result.date).toLocaleString()}
              </p>

            </div>

            <span className="bg-amber-100 text-amber-700 rounded-full px-4 py-2 text-sm font-medium">
              Completed with Errors (Demo)
            </span>

          </div>

          {/* Statistics Cards */}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

            {[
              {
                label: "Total Rows",
                value: result.totalRows,
                color: "text-slate-900",
              },
              {
                label: "Imported",
                value: result.imported,
                color: "text-green-600",
              },
              {
                label: "Skipped",
                value: result.skipped,
                color: "text-amber-600",
              },
              {
                label: "Errors",
                value: result.errors,
                color: "text-red-600",
              },
            ].map((item) => (

              <div
                key={item.label}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >

                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <h3 className={`text-3xl font-bold mt-3 ${item.color}`}>
                  {item.value}
                </h3>

              </div>

            ))}

          </div>

          {/* Import Distribution */}

          <div className="bg-white border border-slate-200 rounded-xl p-6">

            <h3 className="font-bold text-slate-900 mb-4">
              Demo Import Distribution
            </h3>

            <div className="flex h-5 w-full rounded-full overflow-hidden bg-slate-100">

              <div
                className="bg-green-500"
                style={{
                  width: `${(result.imported / result.totalRows) * 100}%`,
                }}
              />

              <div
                className="bg-amber-500"
                style={{
                  width: `${(result.skipped / result.totalRows) * 100}%`,
                }}
              />

              <div
                className="bg-red-500"
                style={{
                  width: `${(result.errors / result.totalRows) * 100}%`,
                }}
              />

            </div>

            <div className="flex flex-wrap gap-6 mt-4 text-sm">

              <span className="text-green-600">
                ● Imported: {result.imported}
              </span>

              <span className="text-amber-600">
                ● Skipped: {result.skipped}
              </span>

              <span className="text-red-600">
                ● Errors: {result.errors}
              </span>

            </div>

          </div>

          {/* Import Issues */}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

            <div className="p-5 border-b">

              <h3 className="font-bold text-slate-900">
                Sample Row-Level Report
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Showing five illustrative issues, not
                actual results from your selected file.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm text-left">

                <thead className="bg-slate-50 text-slate-600">

                  <tr>
                    <th className="p-4">Row Number</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {result.issues.map((issue) => (

                    <tr key={issue.row}>

                      <td className="p-4 text-slate-600">
                        {issue.row}
                      </td>

                      <td className="p-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            issue.status === "Skipped"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {issue.status}
                        </span>

                      </td>

                      <td className="p-4 text-slate-700">
                        {issue.reason}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

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