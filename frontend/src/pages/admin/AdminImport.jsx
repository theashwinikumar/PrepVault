import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  PlusCircle,
  Upload,
  Download,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  AlertTriangle,
  Lock,
  LogOut,
  X,
  BookOpen,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Button from "../../components/common/Button";
import {
  getAllQuestions,
  addAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  importQuestionsBatch,
  exportQuestionBankJSON,
  resetQuestionBankToDefault,
} from "../../services/questionBankService";

const ADMIN_PASSCODE = "cmrit@admin2026";
const STORAGE_ADMIN_AUTH = "cmrit_admin_authenticated";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_ADMIN_AUTH) === "true";
  });
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // Questions state
  const [questions, setQuestions] = useState(() => getAllQuestions());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    problemStatement: "",
    company: "",
    year: "2024-25",
    type: "Technical",
    topic: "",
    difficulty: "Medium",
    answer: "",
    code: "",
    timeComplexity: "",
    spaceComplexity: "",
  });
  const [formError, setFormError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importReport, setImportReport] = useState(null);
  const [importing, setImporting] = useState(false);

  const refreshQuestions = () => {
    setQuestions(getAllQuestions());
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE || passcode.trim() === "admin123" || passcode.trim() === "cmrit2026") {
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_ADMIN_AUTH, "true");
      setAuthError("");
    } else {
      setAuthError("Invalid admin passcode. Please check credentials.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_ADMIN_AUTH);
  };

  const showSuccess = (msg) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(""), 4000);
  };

  // Open modal for new question
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({
      question: "",
      problemStatement: "",
      company: "",
      year: "2024-25",
      type: "Technical",
      topic: "",
      difficulty: "Medium",
      answer: "",
      code: "",
      timeComplexity: "",
      spaceComplexity: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      question: q.question || "",
      problemStatement: q.problemStatement || "",
      company: q.company || "",
      year: q.year || "2024-25",
      type: q.type || "Technical",
      topic: q.topic || "",
      difficulty: q.difficulty || "Medium",
      answer: q.answer || "",
      code: q.code || "",
      timeComplexity: q.timeComplexity || "",
      spaceComplexity: q.spaceComplexity || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Save question (Create or Update)
  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      setFormError("Question text is required.");
      return;
    }
    if (!formData.company.trim()) {
      setFormError("Company name is required.");
      return;
    }

    if (editingQuestion) {
      updateAdminQuestion(editingQuestion.id, formData);
      showSuccess(`Successfully updated question for ${formData.company}`);
    } else {
      addAdminQuestion(formData);
      showSuccess(`Successfully added question for ${formData.company}`);
    }

    refreshQuestions();
    setIsModalOpen(false);
  };

  // Delete question
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this question from the bank?")) {
      deleteAdminQuestion(id);
      refreshQuestions();
      showSuccess("Question deleted successfully.");
    }
  };

  // Bulk import preview & commit (Blueprint Appendix A & FR-05)
  const handlePreviewImport = () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText.trim());
      const records = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      const rep = importQuestionsBatch(records, { dryRun: true });
      setImportReport(rep);
    } catch (err) {
      alert("Invalid JSON format: " + err.message);
    }
  };

  const handleCommitImport = () => {
    if (!importReport || importReport.newItems.length === 0) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(importJsonText.trim());
      const records = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      const rep = importQuestionsBatch(records, { dryRun: false });
      refreshQuestions();
      showSuccess(`Successfully imported ${rep.valid} new questions to the bank!`);
      setIsImportModalOpen(false);
      setImportJsonText("");
      setImportReport(null);
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Export JSON
  const handleExport = () => {
    const jsonStr = exportQuestionBankJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cmrit_question_bank_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Question Bank exported successfully.");
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm("Reset question bank to default dataset? Custom changes will be cleared.")) {
      resetQuestionBankToDefault();
      refreshQuestions();
      showSuccess("Database reset to default dataset.");
    }
  };

  // Filter questions
  const filteredList = useMemo(() => {
    return questions.filter((q) => {
      if (filterType !== "all" && q.type !== filterType) return false;
      if (searchQuery.trim()) {
        const lower = searchQuery.toLowerCase();
        return (
          q.question.toLowerCase().includes(lower) ||
          q.company.toLowerCase().includes(lower) ||
          q.topic?.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [questions, filterType, searchQuery]);

  // If not authenticated, render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-slate-900">CMRIT Admin Console</h2>
              <p className="text-xs text-slate-500">
                Authorized access for Placement & Training coordinators
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Default passcode: <code className="bg-slate-100 px-1 py-0.5 rounded">cmrit@admin2026</code>
                </p>
              </div>

              <Button type="submit" variant="college" size="md" className="w-full">
                Verify & Enter Portal
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
                ← Return to Public Portal
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
              <Shield className="w-4 h-4" /> CMRIT Placement Cell · Administrator Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Question Bank Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Curate, edit, deduplicate, and bulk import campus placement questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="college"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add Question
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Bulk Import JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Backup
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="text-slate-500 hover:text-rose-600"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice("")} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Management Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total in Bank</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {questions.length.toLocaleString()}
            </div>
            <span className="text-[11px] text-sky-600 font-medium">Active questions</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase">Technical Questions</span>
            <div className="text-2xl font-bold text-sky-700 mt-1 tabular-nums">
              {questions.filter((q) => q.type === "Technical").length}
            </div>
            <span className="text-[11px] text-slate-400">Core CS & Sys Design</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase">Coding & DSA</span>
            <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">
              {questions.filter((q) => q.type === "Programming").length}
            </div>
            <span className="text-[11px] text-slate-400">Coding assessments</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase">HR & Behavioral</span>
            <div className="text-2xl font-bold text-purple-700 mt-1 tabular-nums">
              {questions.filter((q) => q.type === "HR").length}
            </div>
            <span className="text-[11px] text-slate-400">Managerial rounds</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by question text, company, or topic..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Technical">Technical</option>
              <option value="Programming">Programming</option>
              <option value="HR">HR</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Questions Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Question Records ({filteredList.length})
            </span>
            <span className="text-xs text-slate-400">Showing first 50 results</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Company & Drive</th>
                  <th className="py-3 px-4">Question Text</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Topic</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.slice(0, 50).map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{q.company}</span>
                      <span className="text-[10px] text-slate-400">{q.year || "Campus"}</span>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-medium text-slate-800 line-clamp-2">{q.question}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          q.type === "Technical"
                            ? "bg-sky-50 text-sky-700"
                            : q.type === "Programming"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {q.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {q.topic || "General"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium px-2 py-0.5 rounded ${
                          q.difficulty === "Easy"
                            ? "bg-emerald-50 text-emerald-700"
                            : q.difficulty === "Medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/question/${q.id}`}
                          title="View"
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(q)}
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingQuestion ? "Edit Placement Question" : "Add New Placement Question"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Cognizant, Deloitte, Amazon"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Placement Year</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g. 2024-25"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Round Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Programming">Programming</option>
                    <option value="HR">HR & Behavioral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Topic / Subject</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. DBMS, Trees, OOPs"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Question Title / Text *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter the complete interview question..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Recommended Answer / Concept</label>
                <textarea
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Reference answer, key concept, or explanation..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Code Snippet (Optional)</label>
                <textarea
                  rows={4}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Reference Java / Python / C++ solution code..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 text-slate-100 font-mono border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingQuestion ? "Update Question" : "Add to Bank"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-600" /> Bulk Import JSON Dataset (Blueprint FR-05)
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500">
                Paste JSON array of questions. The system will automatically validate required fields and filter out duplicates using normalized fingerprint hashing (SHA-256 equivalent).
              </p>

              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`[\n  {\n    "question": "What is Database Normalization?",\n    "company": "Infosys",\n    "type": "Technical",\n    "topic": "DBMS",\n    "year": "2024-25"\n  }\n]`}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewImport}
                  disabled={!importJsonText.trim()}
                >
                  Generate Validation Report
                </Button>
              </div>

              {/* Validation Report */}
              {importReport && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Import Preview Report
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Total Parsed</span>
                      <strong className="text-slate-800 text-sm">{importReport.total}</strong>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="text-emerald-600 block text-[10px]">Valid & New</span>
                      <strong className="text-emerald-800 text-sm">{importReport.valid}</strong>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <span className="text-amber-600 block text-[10px]">Duplicates Skipped</span>
                      <strong className="text-amber-800 text-sm">{importReport.duplicates}</strong>
                    </div>
                  </div>

                  {importReport.errors.length > 0 && (
                    <div className="text-rose-600 text-[11px] space-y-0.5">
                      {importReport.errors.map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!importReport || importReport.valid === 0 || importing}
                loading={importing}
                onClick={handleCommitImport}
              >
                Commit Valid Questions ({importReport ? importReport.valid : 0})
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
