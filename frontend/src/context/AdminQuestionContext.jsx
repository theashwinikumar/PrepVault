import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const AdminQuestionContext = createContext(null);

const STORAGE_KEY = "prepvault_admin_questions_demo_v2";

// ==========================================
// MOCK SUBJECTS
// ==========================================

export const subjects = [
  { id: 1, name: "Operating Systems" },
  { id: 2, name: "DBMS" },
  { id: 3, name: "Computer Networks" },
  { id: 4, name: "OOP" },
  { id: 5, name: "DSA" },
  { id: 6, name: "Java" },
  { id: 7, name: "Python" },
  { id: 8, name: "Aptitude" },
  { id: 9, name: "Software Engineering" },
];

// ==========================================
// MOCK TOPICS
// ==========================================

export const topics = [
  { id: 101, subject_id: 1, name: "Deadlock" },
  { id: 102, subject_id: 1, name: "Memory Management" },
  { id: 103, subject_id: 1, name: "CPU Scheduling" },
  { id: 104, subject_id: 1, name: "Process Management" },

  { id: 201, subject_id: 2, name: "Normalization" },
  { id: 202, subject_id: 2, name: "SQL" },
  { id: 203, subject_id: 2, name: "Transactions" },
  { id: 204, subject_id: 2, name: "Indexing" },

  { id: 301, subject_id: 3, name: "TCP/IP" },
  { id: 302, subject_id: 3, name: "OSI Model" },
  { id: 303, subject_id: 3, name: "Routing" },

  { id: 401, subject_id: 4, name: "Polymorphism" },
  { id: 402, subject_id: 4, name: "Inheritance" },
  { id: 403, subject_id: 4, name: "Encapsulation" },
  { id: 404, subject_id: 4, name: "Abstraction" },

  { id: 501, subject_id: 5, name: "Arrays" },
  { id: 502, subject_id: 5, name: "Linked Lists" },
  { id: 503, subject_id: 5, name: "Trees" },
  { id: 504, subject_id: 5, name: "Graphs" },
  { id: 505, subject_id: 5, name: "Dynamic Programming" },

  { id: 601, subject_id: 6, name: "Collections" },
  { id: 602, subject_id: 6, name: "Exception Handling" },
  { id: 603, subject_id: 6, name: "Multithreading" },

  { id: 701, subject_id: 7, name: "Functions" },
  { id: 702, subject_id: 7, name: "Data Structures" },
  { id: 703, subject_id: 7, name: "Object-Oriented Python" },

  { id: 801, subject_id: 8, name: "Percentages" },
  { id: 802, subject_id: 8, name: "Probability" },
  { id: 803, subject_id: 8, name: "Logical Reasoning" },

  { id: 901, subject_id: 9, name: "Agile" },
  { id: 902, subject_id: 9, name: "SDLC" },
  { id: 903, subject_id: 9, name: "Software Testing" },
];

// ==========================================
// MOCK COMPANIES
// Read-only reference data for now
// ==========================================

export const companies = [
  { id: 1, name: "Infosys" },
  { id: 2, name: "TCS" },
  { id: 3, name: "Accenture" },
  { id: 4, name: "Wipro" },
  { id: 5, name: "Cognizant" },
  { id: 6, name: "Amazon" },
  { id: 7, name: "Microsoft" },
];

// ==========================================
// QUESTION TYPES — PROVISIONAL
// ==========================================

export const questionTypes = [
  { value: "descriptive", label: "Descriptive" },
  { value: "mcq", label: "Multiple Choice" },
  { value: "coding", label: "Coding" },
  { value: "boolean", label: "True / False" },
];

export const difficulties = [
  "Easy",
  "Medium",
  "Hard",
];

export const statuses = [
  "Draft",
  "Published",
  "Disabled",
];

// ==========================================
// MOCK QUESTIONS
// ==========================================

const sampleQuestions = [
  {
    id: "Q001",
    question: "What is deadlock in an operating system?",
    subject_id: 1,
    topic_id: 101,
    difficulty: "Medium",
    question_type: "descriptive",
    status: "Published",
    answer: "Deadlock is a state where processes wait indefinitely for resources.",
    explanation: "It occurs when processes hold resources while waiting for resources held by other processes.",
    tags: "OS, deadlock",
  },
  {
    id: "Q002",
    question: "Explain database normalization.",
    subject_id: 2,
    topic_id: 201,
    difficulty: "Easy",
    question_type: "descriptive",
    status: "Draft",
    answer: "Normalization reduces data redundancy.",
    explanation: "Database tables are organized into normal forms to improve data integrity.",
    tags: "DBMS",
  },
  {
    id: "Q003",
    question: "Explain the TCP three-way handshake.",
    subject_id: 3,
    topic_id: 301,
    difficulty: "Medium",
    question_type: "descriptive",
    status: "Published",
    answer: "SYN, SYN-ACK and ACK.",
    explanation: "These three messages establish a TCP connection between two devices.",
    tags: "TCP, networking",
  },
  {
    id: "Q004",
    question: "What is polymorphism?",
    subject_id: 4,
    topic_id: 401,
    difficulty: "Easy",
    question_type: "descriptive",
    status: "Disabled",
    answer: "One interface with multiple implementations.",
    explanation: "Polymorphism allows different objects to respond differently to the same operation.",
    tags: "OOP",
  },
  {
    id: "Q005",
    question: "Implement Dijkstra's shortest path algorithm.",
    subject_id: 5,
    topic_id: 504,
    difficulty: "Hard",
    question_type: "coding",
    status: "Published",
    answer: "Use a priority queue and relax adjacent edges.",
    explanation: "Dijkstra's algorithm finds shortest paths in graphs with non-negative edge weights.",
    tags: "DSA, graphs",
  },
  {
    id: "Q006",
    question: "What is virtual memory?",
    subject_id: 1,
    topic_id: 102,
    difficulty: "Medium",
    question_type: "descriptive",
    status: "Draft",
    answer: "An abstraction of physical memory.",
    explanation: "Virtual memory maps virtual addresses to physical memory and can use secondary storage.",
    tags: "OS, memory",
  },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getSubjectName(id) {
  return subjects.find(
    (subject) => subject.id === Number(id)
  )?.name || "Unknown Subject";
}

export function getTopicName(id) {
  return topics.find(
    (topic) => topic.id === Number(id)
  )?.name || "Unknown Topic";
}

export function getTopicsBySubject(subjectId) {
  return topics.filter(
    (topic) => topic.subject_id === Number(subjectId)
  );
}

export function getCompanyName(id) {
  return companies.find(
    (company) => company.id === Number(id)
  )?.name || "Unknown Company";
}

// ==========================================
// CONTEXT PROVIDER
// ==========================================

export function AdminQuestionProvider({ children }) {
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load demo questions:", error);
    }

    return sampleQuestions;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(questions)
      );
    } catch (error) {
      console.error("Failed to save demo questions:", error);
    }
  }, [questions]);

  // Validate subject and topic relationship

  function validateQuestion(data) {
    const subjectExists = subjects.some(
      (subject) => subject.id === Number(data.subject_id)
    );

    const topicExists = topics.some(
      (topic) =>
        topic.id === Number(data.topic_id) &&
        topic.subject_id === Number(data.subject_id)
    );

    if (!data.question?.trim()) {
      throw new Error("Question text is required.");
    }

    if (!subjectExists) {
      throw new Error("Please select a valid subject.");
    }

    if (!topicExists) {
      throw new Error("Please select a valid topic for the subject.");
    }

    if (!difficulties.includes(data.difficulty)) {
      throw new Error("Invalid difficulty.");
    }

    if (!statuses.includes(data.status)) {
      throw new Error("Invalid status.");
    }

    if (!questionTypes.some(
      (type) => type.value === data.question_type
    )) {
      throw new Error("Invalid question type.");
    }

    if (data.status === "Published" && !data.answer?.trim()) {
      throw new Error("An answer is required before publishing.");
    }
  }

  // CREATE QUESTION

  function createQuestion(data) {
    validateQuestion(data);

    const newQuestion = {
      ...data,
      subject_id: Number(data.subject_id),
      topic_id: Number(data.topic_id),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuestions((previous) => [
      newQuestion,
      ...previous,
    ]);

    return newQuestion;
  }

  // VIEW QUESTION

  function getQuestion(id) {
    return questions.find(
      (question) => question.id === id
    );
  }

  // UPDATE QUESTION

  function updateQuestion(id, data) {
    const existing = getQuestion(id);

    if (!existing) {
      throw new Error("Question not found.");
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      subject_id: Number(
        data.subject_id ?? existing.subject_id
      ),
      topic_id: Number(
        data.topic_id ?? existing.topic_id
      ),
      updatedAt: new Date().toISOString(),
    };

    validateQuestion(updated);

    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id ? updated : question
      )
    );

    return updated;
  }
  function bulkUpdateStatus(ids, newStatus) {
  if (!["Published", "Disabled"].includes(newStatus)) {
    throw new Error("Invalid bulk action.");
  }

  const eligible = questions.filter((q) => {
    if (!ids.includes(q.id)) return false;

    if (newStatus === "Published") {
      return (
        q.status === "Draft" &&
        Boolean(q.answer?.trim())
      );
    }

    return q.status !== "Disabled";
  });

  const eligibleIds = new Set(
    eligible.map((q) => q.id)
  );

  const updatedAt = new Date().toISOString();

  setQuestions((previous) =>
    previous.map((q) =>
      eligibleIds.has(q.id)
        ? {
            ...q,
            status: newStatus,
            updated_at: updatedAt,
          }
        : q
    )
  );

  return {
    updated: eligible.length,
    skipped: ids.length - eligible.length,
  };
}

  // PUBLISH QUESTION

  function publishQuestion(id) {
    return updateQuestion(id, {
      status: "Published",
    });
  }

  // DISABLE QUESTION

  function disableQuestion(id) {
    return updateQuestion(id, {
      status: "Disabled",
    });
  }

  // DUPLICATE DETECTION

  function checkDuplicate(text, excludeId = null) {
    const normalized = text.trim().toLowerCase();

    if (!normalized) return [];

    return questions.filter(
      (question) =>
        question.id !== excludeId &&
        question.question.trim().toLowerCase() === normalized
    );
  }

  // ADMIN OVERVIEW STATISTICS

  const stats = {
    total: questions.length,

    published: questions.filter(
      (q) => q.status === "Published"
    ).length,

    drafts: questions.filter(
      (q) => q.status === "Draft"
    ).length,

    disabled: questions.filter(
      (q) => q.status === "Disabled"
    ).length,

    totalSubjects: subjects.length,

    totalTopics: topics.length,

    totalCompanies: companies.length,
  };

  return (
    <AdminQuestionContext.Provider
      value={{
        questions,
        subjects,
        topics,
        companies,
        questionTypes,
        difficulties,
        statuses,
        stats,
        getSubjectName,
        getTopicName,
        getCompanyName,
        getTopicsBySubject,
        createQuestion,
        getQuestion,
        updateQuestion,
        publishQuestion,
        disableQuestion,
        bulkUpdateStatus,
        checkDuplicate,
      }}
    >
      {children}
    </AdminQuestionContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useAdminQuestions() {
  const context = useContext(AdminQuestionContext);

  if (!context) {
    throw new Error(
      "useAdminQuestions must be used inside AdminQuestionProvider"
    );
  }

  return context;
}