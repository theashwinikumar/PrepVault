import technicalData from "../data/questions.json";
import hrData from "../data/hr_questions.json";
import mustReadData from "../data/must_read_questions.json";

const STORAGE_KEY_CUSTOM_QUESTIONS = "cmrit_custom_questions_v2";
const STORAGE_KEY_DELETED_IDS = "cmrit_deleted_question_ids_v2";

/**
 * Infer subject / topic from question text and type
 */
function inferTopic(text = "", type = "Technical") {
  const lower = text.toLowerCase();
  if (type === "HR") return "HR & Behavioral";
  if (lower.includes("dbms") || lower.includes("sql") || lower.includes("table") || lower.includes("foreign key") || lower.includes("normalization") || lower.includes("acid") || lower.includes("query")) return "DBMS & SQL";
  if (lower.includes("oops") || lower.includes("oop") || lower.includes("class") || lower.includes("polymorphism") || lower.includes("inheritance") || lower.includes("abstraction") || lower.includes("encapsulation")) return "OOPs Concepts";
  if (lower.includes("operating system") || lower.includes("os") || lower.includes("process") || lower.includes("thread") || lower.includes("deadlock") || lower.includes("paging") || lower.includes("semaphore")) return "Operating Systems";
  if (lower.includes("network") || lower.includes("tcp") || lower.includes("udp") || lower.includes("osi") || lower.includes("ip") || lower.includes("http") || lower.includes("dns")) return "Computer Networks";
  if (lower.includes("linked list") || lower.includes("link list") || lower.includes("node")) return "Linked Lists";
  if (lower.includes("tree") || lower.includes("bst") || lower.includes("binary search tree") || lower.includes("traversal")) return "Trees & BST";
  if (lower.includes("graph") || lower.includes("bfs") || lower.includes("dfs") || lower.includes("dijkstra")) return "Graphs";
  if (lower.includes("dp") || lower.includes("dynamic programming") || lower.includes("memoization") || lower.includes("knapsack")) return "Dynamic Programming";
  if (lower.includes("array") || lower.includes("matrix") || lower.includes("sorting") || lower.includes("binary search") || lower.includes("two sum")) return "Arrays & Searching";
  if (lower.includes("string") || lower.includes("anagram") || lower.includes("palindrome")) return "Strings & Parsing";
  if (lower.includes("react") || lower.includes("javascript") || lower.includes("html") || lower.includes("css") || lower.includes("frontend") || lower.includes("dom")) return "Web Development";
  if (lower.includes("java") || lower.includes("c++") || lower.includes("python") || lower.includes("c language")) return "Core Languages";
  if (lower.includes("cloud") || lower.includes("aws") || lower.includes("azure") || lower.includes("docker")) return "Cloud & DevOps";
  if (type === "Programming") return "Data Structures & Algorithms";
  return "General CS & Core Engineering";
}

/**
 * Infer difficulty from length, keywords, or structure
 */
function inferDifficulty(text = "", type = "Technical") {
  const lower = text.toLowerCase();
  if (lower.includes("hard") || lower.includes("dynamic programming") || lower.includes("graph") || lower.includes("trie") || lower.includes("system design") || lower.includes("concurrency")) {
    return "Hard";
  }
  if (lower.includes("explain") || lower.includes("difference") || lower.includes("implement") || lower.includes("linked list") || lower.includes("tree") || lower.includes("query") || lower.includes("deadlock")) {
    return "Medium";
  }
  if (lower.includes("what is") || lower.includes("define") || lower.includes("tell me") || lower.includes("basic") || lower.includes("syntax") || type === "HR") {
    return "Easy";
  }
  return "Medium";
}

/**
 * Generate a deterministic hash/fingerprint for duplicate prevention (Blueprint FR-06)
 */
export function generateFingerprint(text, company, type) {
  const norm = (text + "|" + company + "|" + type).toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = ((hash << 5) - hash) + norm.charCodeAt(i);
    hash |= 0;
  }
  return "fp_" + Math.abs(hash).toString(36);
}

/**
 * Build base catalogue from bundled JSONs
 */
function buildBaseCatalogue() {
  const list = [];
  const seenFingerprints = new Set();

  // 1. Technical & Programming questions from questions.json
  if (Array.isArray(technicalData)) {
    technicalData.forEach((entry) => {
      const company = (entry.company || "General").trim();
      const year = entry.year || "2023-24";

      // Technical questions
      if (Array.isArray(entry.technical_questions)) {
        entry.technical_questions.forEach((q, idx) => {
          if (!q || !q.trim()) return;
          const cleanQ = q.trim();
          const fp = generateFingerprint(cleanQ, company, "Technical");
          if (!seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
            list.push({
              id: `${entry.id || "tech"}_T${idx}`,
              fingerprint: fp,
              question: cleanQ,
              company,
              year,
              type: "Technical",
              topic: inferTopic(cleanQ, "Technical"),
              difficulty: inferDifficulty(cleanQ, "Technical"),
              answer: "",
              code: "",
              source: "CMRIT Campus Recruitment Drive",
              tags: [company, "Technical", year],
              createdAt: "2024-01-01",
            });
          }
        });
      }

      // Programming questions
      if (Array.isArray(entry.programming_questions)) {
        entry.programming_questions.forEach((q, idx) => {
          if (!q || !q.trim()) return;
          const cleanQ = q.trim();
          const fp = generateFingerprint(cleanQ, company, "Programming");
          if (!seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
            list.push({
              id: `${entry.id || "prog"}_P${idx}`,
              fingerprint: fp,
              question: cleanQ,
              company,
              year,
              type: "Programming",
              topic: inferTopic(cleanQ, "Programming"),
              difficulty: inferDifficulty(cleanQ, "Programming"),
              answer: "",
              code: "",
              source: "CMRIT Campus Recruitment Drive",
              tags: [company, "Programming", "Coding", year],
              createdAt: "2024-01-01",
            });
          }
        });
      }
    });
  }

  // 2. HR Questions
  if (Array.isArray(hrData)) {
    hrData.forEach((entry) => {
      const company = (entry.company || "General").trim();
      const yearStr = entry.years && entry.years.length > 0 ? entry.years.join(", ") : "2023-24";

      if (Array.isArray(entry.hr_questions)) {
        entry.hr_questions.forEach((q, idx) => {
          if (!q || !q.trim()) return;
          const cleanQ = q.trim();
          const fp = generateFingerprint(cleanQ, company, "HR");
          if (!seenFingerprints.has(fp)) {
            seenFingerprints.add(fp);
            list.push({
              id: `HR_${entry.id || "c"}_${idx}`,
              fingerprint: fp,
              question: cleanQ,
              company,
              year: yearStr,
              type: "HR",
              topic: "HR & Behavioral",
              difficulty: inferDifficulty(cleanQ, "HR"),
              answer: "",
              code: "",
              source: "CMRIT HR & Managerial Round",
              tags: [company, "HR", "Behavioral", "Interview"],
              createdAt: "2024-01-01",
            });
          }
        });
      }
    });
  }

  // 3. Must Read Curated DSA Questions
  if (mustReadData && Array.isArray(mustReadData.questions)) {
    mustReadData.questions.forEach((q) => {
      const cleanQ = q.title ? `${q.title}: ${q.description || ""}` : q.description;
      const fp = generateFingerprint(cleanQ, "Top Tech Companies", "DSA");
      if (!seenFingerprints.has(fp)) {
        seenFingerprints.add(fp);
        list.push({
          id: `must_read_${q.id}`,
          fingerprint: fp,
          question: q.title || cleanQ,
          problemStatement: q.description || "",
          company: "Top Product Companies (Amazon, Google, Microsoft, Adobe)",
          year: "2024-25",
          type: "Programming",
          topic: q.topic || "Data Structures & Algorithms",
          difficulty: q.difficulty || "Medium",
          answer: q.testCase ? `Input: ${q.testCase.input}\nOutput: ${q.testCase.output}\n\nExplanation: ${q.testCase.explanation || ""}` : "",
          code: q.solutionJava || "",
          testCase: q.testCase,
          repoUrl: q.repoUrl,
          leetcodeUrl: q.leetcodeUrl,
          source: "CMRIT Placement Core DSA Benchmark",
          tags: ["Must Read", "LeetCode", q.topic, q.difficulty],
          isMustRead: true,
          createdAt: "2024-01-01",
        });
      }
    });
  }

  return list;
}

// Singleton cache of static data
let baseCatalogueCache = null;

function getBaseCatalogue() {
  if (!baseCatalogueCache) {
    baseCatalogueCache = buildBaseCatalogue();
  }
  return baseCatalogueCache;
}

/**
 * Get all active questions merged with admin modifications
 */
export function getAllQuestions() {
  const base = getBaseCatalogue();

  // Load deleted IDs (guarded for SSR / Node prerender)
  let deletedIds = new Set();
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const rawDel = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
      if (rawDel) deletedIds = new Set(JSON.parse(rawDel));
    } catch (e) {
      console.error("Failed to load deleted question ids", e);
    }
  }

  // Load custom admin questions (guarded for SSR / Node prerender)
  let custom = [];
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      const rawCust = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS);
      if (rawCust) custom = JSON.parse(rawCust);
    } catch (e) {
      console.error("Failed to load custom questions", e);
    }
  }

  // Filter out deleted base items
  const filteredBase = base.filter((q) => !deletedIds.has(q.id));

  // Merge custom questions (custom can override or add)
  const map = new Map();
  filteredBase.forEach((q) => map.set(q.id, q));
  custom.forEach((q) => {
    if (!deletedIds.has(q.id)) {
      map.set(q.id, q);
    }
  });

  return Array.from(map.values());
}

/**
 * Get a single question by ID
 */
export function getQuestionById(id) {
  const all = getAllQuestions();
  return all.find((q) => String(q.id) === String(id)) || null;
}

/**
 * Admin: Add a new question
 */
export function addAdminQuestion(data) {
  const custom = getCustomQuestions();
  const id = "custom_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
  const fp = generateFingerprint(data.question, data.company || "General", data.type || "Technical");

  const newQuestion = {
    id,
    fingerprint: fp,
    question: data.question.trim(),
    problemStatement: data.problemStatement || "",
    company: (data.company || "General").trim(),
    year: data.year || "2024-25",
    type: data.type || "Technical",
    topic: data.topic || inferTopic(data.question, data.type),
    difficulty: data.difficulty || "Medium",
    answer: data.answer || "",
    code: data.code || "",
    timeComplexity: data.timeComplexity || "",
    spaceComplexity: data.spaceComplexity || "",
    source: data.source || "CMRIT Placement Admin Entry",
    tags: [data.company || "General", data.type || "Technical", data.topic || "Core"].filter(Boolean),
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  custom.unshift(newQuestion);
  saveCustomQuestions(custom);
  return newQuestion;
}

/**
 * Admin: Update an existing question
 */
export function updateAdminQuestion(id, updatedFields) {
  const all = getAllQuestions();
  const target = all.find((q) => String(q.id) === String(id));
  if (!target) return null;

  const updated = {
    ...target,
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  const custom = getCustomQuestions();
  const index = custom.findIndex((q) => String(q.id) === String(id));
  if (index >= 0) {
    custom[index] = updated;
  } else {
    custom.unshift(updated);
  }

  saveCustomQuestions(custom);
  return updated;
}

/**
 * Admin: Delete a question
 */
export function deleteAdminQuestion(id) {
  // Add to deleted set
  try {
    const rawDel = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    const set = rawDel ? new Set(JSON.parse(rawDel)) : new Set();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(e);
  }

  // Remove from custom list if present
  const custom = getCustomQuestions().filter((q) => String(q.id) !== String(id));
  saveCustomQuestions(custom);

  return true;
}

/**
 * Admin: Bulk import questions with duplicate detection (Blueprint Appendix A & FR-05/06)
 */
export function importQuestionsBatch(records, options = { dryRun: false }) {
  const current = getAllQuestions();
  const existingFingerprints = new Set(current.map((q) => q.fingerprint));
  const existingQuestionsText = new Set(current.map((q) => q.question.toLowerCase().trim()));

  const report = {
    total: records.length,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    newItems: [],
    errors: [],
  };

  records.forEach((row, index) => {
    const qText = (row.question || row.question_text || row.title || "").trim();
    if (!qText) {
      report.invalid++;
      report.errors.push(`Row ${index + 1}: Missing question text`);
      return;
    }

    const company = (row.company || "General").trim();
    const type = row.type || row.question_type || "Technical";
    const fp = generateFingerprint(qText, company, type);

    if (existingFingerprints.has(fp) || existingQuestionsText.has(qText.toLowerCase())) {
      report.duplicates++;
      return;
    }

    report.valid++;
    const item = {
      id: "import_" + Date.now() + "_" + index,
      fingerprint: fp,
      question: qText,
      problemStatement: row.problemStatement || row.description || "",
      company,
      year: row.year || "2024-25",
      type,
      topic: row.topic || row.subject || inferTopic(qText, type),
      difficulty: row.difficulty || inferDifficulty(qText, type),
      answer: row.answer || row.explanation || "",
      code: row.code || "",
      source: row.source || "Bulk Imported File",
      tags: [company, type, row.topic].filter(Boolean),
      createdAt: new Date().toISOString(),
      isCustom: true,
    };
    report.newItems.push(item);
  });

  if (!options.dryRun && report.newItems.length > 0) {
    const custom = getCustomQuestions();
    const merged = [...report.newItems, ...custom];
    saveCustomQuestions(merged);
  }

  return report;
}

/**
 * Admin: Export entire Question Bank as JSON
 */
export function exportQuestionBankJSON() {
  const all = getAllQuestions();
  return JSON.stringify(all, null, 2);
}

/**
 * Helper to read custom questions
 */
function getCustomQuestions() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomQuestions(list) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(list));
    window.dispatchEvent(new Event("cmrit:questions_updated"));
  } catch (e) {
    console.error("Failed to save custom questions", e);
  }
}

/**
 * Reset any admin overrides/deletions back to fresh default dataset
 */
export function resetQuestionBankToDefault() {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_QUESTIONS);
  localStorage.removeItem(STORAGE_KEY_DELETED_IDS);
  window.dispatchEvent(new Event("cmrit:questions_updated"));
}
