import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ClipboardList, Eye, FileText, AlertCircle } from "lucide-react";

const BRANCHES = [
  "BE-CSE",
  "BE-ECE",
  "BE-ISE",
  "MBA",
  "MCA",
  "AInDS & CS-DS",
  "AIML & CS-ML",
];

const ONLINE_SECTIONS = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Puzzle-Based Questions",
  "Coding MCQs",
  "General Coding",
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const PREVIEW_GROUPS = [
  {
    title: "Student and Placement Drive Details",
    fields: [
      ["email", "College email"],
      ["branch", "Branch"],
      ["studentName", "Full name"],
      ["usn", "USN"],
      ["companyName", "Company / placement drive"],
      ["ctcOffered", "CTC offered"],
    ],
  },
  {
    title: "Placement Experience",
    fields: [
      ["onlineSections", "Online assessment sections"],
      ["aptitudeQuestions", "Aptitude / reasoning / verbal questions"],
      ["jamDetails", "JAM session"],
      ["groupDiscussionDetails", "Group discussion"],
      ["hrInterviewExperience", "Personal / HR interview"],
    ],
  },
  {
    title: "Technical Database",
    fields: [
      ["technicalQuestions", "Technical / domain questions"],
      ["programmingQuestions", "Programming / domain questions"],
      ["preferredLanguage", "Preferred programming language"],
      ["onlineExamPattern", "Online examination pattern"],
    ],
  },
  {
    title: "Preparation Materials",
    fields: [
      ["preparationLinks", "Preparation websites"],
      ["driveMaterialLinks", "Placement drive resources"],
      ["attachmentName", "Selected document (not uploaded)"],
    ],
  },
  {
    title: "Mock Interview Feedback",
    fields: [
      ["mockInterviewAttended", "Attended mock interview"],
      ["mockInterviewHelped", "Did it help?"],
      ["mockInterviewer", "Conducted by"],
      ["mockExperience", "Experience / suggestions"],
    ],
  },
];

function TextField({ name, label, type = "text", required = false, placeholder }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-rose-600"> *</span>}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={name === "email" ? 150 : 200}
        className={inputClass}
      />
    </label>
  );
}

function TextArea({ name, label, required = false, placeholder = "Write NA if not applicable" }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-rose-600"> *</span>}
      <textarea
        name={name}
        required={required}
        rows={4}
        maxLength={6000}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function SelectField({ name, label, options, required = false }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-rose-600"> *</span>}
      <select name={name} required={required} defaultValue="" className={inputClass}>
        <option value="" disabled>Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Section {number}
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export default function PlacementFeedback() {
  const location = useLocation();
  const from = location.state?.from;
  const returnPath =
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !from.startsWith("/share-experience")
      ? from
      : "/";

  const [preview, setPreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [fileError, setFileError] = useState("");

  function handleDocumentChange(event) {
    const file = event.target.files?.[0] || null;
    const allowedExtension = /\.(pdf|doc|docx)$/i;
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file && (
      !allowedExtension.test(file.name) ||
      (file.type && !allowedMime.includes(file.type)) ||
      file.size > 10 * 1024 * 1024
    )) {
      event.target.value = "";
      setDocumentFile(null);
      setFileError("Choose a PDF, DOC or DOCX document no larger than 10 MB.");
      return;
    }

    setDocumentFile(file);
    setFileError("");
  }

  function handlePreview(event) {
    event.preventDefault();
    if (fileError) return;

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    delete data.driveDocument;
    data.onlineSections = formData.getAll("onlineSections");

    // Frontend prototype only: no API call, upload, or persistent storage.
    setPreview({
      ...data,
      attachmentName: documentFile?.name || "No document selected",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to={returnPath}
          className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-sky-700 hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Website
        </Link>

        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
            <ClipboardList className="h-3.5 w-3.5" />
            CMRIT Placement Hub
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Placement Experience & Technical Question Bank
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Attended a campus placement drive? Share the assessment pattern,
            interview questions, preparation links and mock interview feedback
            to help future students. Write <strong>NA</strong> where a round was
            not applicable.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Frontend preview only.</strong> Nothing is submitted, saved,
            or uploaded. Please use test information instead of real personal details.
          </p>
        </div>

        {preview && (
          <section
            role="status"
            aria-label="Placement experience response preview"
            className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-slate-800 shadow-sm sm:p-7"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Eye className="h-5 w-5 text-sky-600" />
              Response Preview — Not Submitted
            </h2>
            <p className="mt-2 text-amber-900">
              This is a temporary on-screen preview only. Your answers have not been saved.
            </p>
            <div className="mt-5 space-y-5">
              {PREVIEW_GROUPS.map((group) => (
                <div key={group.title} className="rounded-xl border border-sky-100 bg-white p-4">
                  <h3 className="mb-3 font-semibold text-slate-900">{group.title}</h3>
                  <dl className="space-y-3">
                    {group.fields.map(([key, label]) => {
                      const value = preview[key];
                      const displayValue = Array.isArray(value)
                        ? value.join(", ") || "None selected"
                        : value || "Not provided";
                      return (
                        <div key={key} className="grid gap-1 sm:grid-cols-[12rem_minmax(0,1fr)]">
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="whitespace-pre-wrap break-words text-slate-900">
                            {displayValue}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        )}

        <form onSubmit={handlePreview} className="space-y-6">
          <Section number="01" title="Student and Placement Drive Details">
            <TextField name="email" label="College Email" type="email" required placeholder="name@cmrit.ac.in" />
            <SelectField name="branch" label="Branch" options={BRANCHES} required />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="studentName" label="Student Full Name" required />
              <TextField name="usn" label="USN / University Seat Number" required />
            </div>
            <TextField name="companyName" label="Company / Placement Drive Name" required />
            <TextField name="ctcOffered" label="CTC Offered" required placeholder="e.g. 6 LPA or NA" />
          </Section>

          <Section
            number="02"
            title="Placement Experience"
            description="Select relevant online-test sections and describe the rounds you attended."
          >
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Prominent Sections During Online Assessment
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ONLINE_SECTIONS.map((section) => (
                  <label key={section} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="onlineSections"
                      value={section}
                      className="mt-0.5 h-4 w-4 accent-sky-600"
                    />
                    {section}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextArea name="aptitudeQuestions" label="Quantitative Aptitude, Reasoning and Verbal Ability Questions" required />
            <TextArea name="jamDetails" label="JAM Session Details (including topic)" required />
            <TextArea name="groupDiscussionDetails" label="Group Discussion Experience and Topics" required />
            <TextArea name="hrInterviewExperience" label="Personal Interview / HR Round Experience and Questions" required />
          </Section>

          <Section
            number="03"
            title="Technical Database"
            description="Share engineering, MBA or MCA domain questions where relevant."
          >
            <TextArea name="technicalQuestions" label="Technical / Domain-Based Questions Asked" required />
            <TextArea name="programmingQuestions" label="Programming / Domain-Based Questions Asked During Selection" required />
            <TextField name="preferredLanguage" label="Preferred Programming Language (if applicable)" placeholder="e.g. Python, Java, C++ or NA" />
            <TextArea name="onlineExamPattern" label="Online Examination Pattern (if any)" />
          </Section>

          <Section
            number="04"
            title="Placement Preparation Materials"
            description="Provide helpful links or select a test document. Documents are not uploaded in this version."
          >
            <TextArea name="preparationLinks" label="Important Website Links for Placement Preparation" placeholder="Paste links, one per line" />
            <TextArea name="driveMaterialLinks" label="Placement Drive Preparation Links and Resources" placeholder="Paste Google Drive, notes, practice resources, etc." />
            <label className="block text-sm font-medium text-slate-700">
              Preparation Document (PDF, DOC, DOCX — maximum 10 MB)
              <input
                name="driveDocument"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleDocumentChange}
                aria-describedby="upload-notice"
                className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sky-800"
              />
              <span id="upload-notice" className="mt-2 block text-xs text-slate-500">
                File selection is for preview only. No files are uploaded or saved.
              </span>
              {fileError && <span role="alert" className="mt-2 block text-xs text-rose-700">{fileError}</span>}
              {documentFile && <span className="mt-2 block text-xs text-slate-600">Selected: {documentFile.name} (not uploaded)</span>}
            </label>
          </Section>

          <Section number="05" title="Mock Interview Feedback">
            <SelectField name="mockInterviewAttended" label="Did you attend a mock interview?" options={["Yes", "No"]} required />
            <SelectField name="mockInterviewHelped" label="Did the college-level mock interview help you?" options={["Yes", "No", "Maybe"]} required />
            <SelectField
              name="mockInterviewer"
              label="Who conducted your mock interview?"
              options={["Department Faculty", "Professor of Practice", "Training Team", "Other", "NA"]}
              required
            />
            <TextArea
              name="mockExperience"
              label="Describe Your Mock Interview Experience and Suggestions"
              required
              placeholder="Write NA if not applicable. You may mention trainer/faculty details optionally."
            />
          </Section>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-sm text-slate-600">
              Required fields are marked with <span className="font-semibold text-rose-600">*</span>.
              This button only previews the answers on screen; it does not submit them.
            </p>
            <button
              type="submit"
              disabled={Boolean(fileError)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              Preview Response (Nothing Is Saved)
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
