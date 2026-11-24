import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  QUESTION_TYPES,
  DIFFICULTIES,
  QUESTION_STATUSES,
  fetchSubjects,
  fetchTopics,
  fetchCompanies,
  fetchStatisticsOverview,
} from "../services/adminApi";

const AdminQuestionContext = createContext(null);

export function AdminQuestionProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [overview, setOverview] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      fetchSubjects({ signal }),
      fetchTopics({ signal }),
      fetchCompanies({ signal }),
      fetchStatisticsOverview({ signal }).catch(() => null),
    ])
      .then(([subjectsData, topicsData, companiesData, overviewData]) => {
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setTopics(Array.isArray(topicsData) ? topicsData : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        if (overviewData) setOverview(overviewData);
        setMetadataError("");
        setMetadataLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setMetadataError(err.message || "Failed to load admin metadata.");
        setMetadataLoading(false);
      });

    return () => controller.abort();
  }, [reloadTick]);

  const refreshMetadata = useCallback(() => {
    setMetadataLoading(true);
    setReloadTick((t) => t + 1);
  }, []);

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((s) => [String(s.id), s])),
    [subjects]
  );

  const topicMap = useMemo(
    () => Object.fromEntries(topics.map((t) => [String(t.id), t])),
    [topics]
  );

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [String(c.id), c])),
    [companies]
  );

  const getSubjectName = useCallback(
    (id) => subjectMap[String(id)]?.name || "Unknown Subject",
    [subjectMap]
  );

  const getTopicName = useCallback(
    (id) => topicMap[String(id)]?.name || "Unknown Topic",
    [topicMap]
  );

  const getCompanyName = useCallback(
    (id) => companyMap[String(id)]?.name || "Unknown Company",
    [companyMap]
  );

  const getTopicsBySubject = useCallback(
    (subjectId) => {
      if (!subjectId) return [];
      return topics.filter((t) => String(t.subject_id) === String(subjectId));
    },
    [topics]
  );

  const value = useMemo(
    () => ({
      subjects,
      topics,
      companies,
      overview,
      metadataLoading,
      metadataError,
      refreshMetadata,
      questionTypes: QUESTION_TYPES,
      difficulties: DIFFICULTIES,
      statuses: QUESTION_STATUSES,
      getSubjectName,
      getTopicName,
      getCompanyName,
      getTopicsBySubject,
    }),
    [
      subjects,
      topics,
      companies,
      overview,
      metadataLoading,
      metadataError,
      refreshMetadata,
      getSubjectName,
      getTopicName,
      getCompanyName,
      getTopicsBySubject,
    ]
  );

  return (
    <AdminQuestionContext.Provider value={value}>
      {children}
    </AdminQuestionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminQuestions() {
  const context = useContext(AdminQuestionContext);

  if (!context) {
    throw new Error(
      "useAdminQuestions must be used inside AdminQuestionProvider"
    );
  }

  return context;
}
