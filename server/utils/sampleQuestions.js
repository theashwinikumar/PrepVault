// Trim a question entry down to what the caller is allowed to see.
// All questions are now 100% free and open for CMRIT students (no paywall).
function sampleTechnical(entry) {
  const doc = typeof entry.toObject === 'function' ? entry.toObject() : { ...entry };
  const tech = doc.technical_questions || [];
  const prog = doc.programming_questions || [];
  const total = tech.length + prog.length;
  const counts = { technical: tech.length, programming: prog.length, hr: 0, total };

  return {
    ...doc,
    technical_questions: tech,
    programming_questions: prog,
    locked: false,
    lockedCount: 0,
    totalAvailable: total,
    counts,
  };
}

function sampleHr(entry) {
  const doc = typeof entry.toObject === 'function' ? entry.toObject() : { ...entry };
  const all = doc.hr_questions || [];
  const counts = { technical: 0, programming: 0, hr: all.length, total: all.length };

  return {
    ...doc,
    hr_questions: all,
    locked: false,
    lockedCount: 0,
    totalAvailable: all.length,
    counts,
  };
}

module.exports = { sampleTechnical, sampleHr };

module.exports = { sampleTechnical, sampleHr };
