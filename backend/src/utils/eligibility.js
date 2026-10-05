// Utility to check if a student is eligible for a specific job
// Returns an object with eligible flag, per-check details, and reasons for failure
const Application = require('../models/Application');

// checkEligibility runs all placement eligibility checks for a student-job pair
const checkEligibility = async (student, job, alreadyApplied) => {
  const checks = [];

  // 1. Profile completeness check: must have branch, cgpa, and batch set
  const profileComplete = !!(student.branch && student.cgpa != null && student.batch);
  checks.push({
    name: 'Profile',
    passed: profileComplete,
    message: profileComplete ? 'Profile is complete' : 'Profile is incomplete (branch, cgpa, or batch missing)',
  });

  // 2. Consent check: student must have given placement consent
  const consentPassed = !!student.consent;
  checks.push({
    name: 'Consent',
    passed: consentPassed,
    message: consentPassed ? 'Placement consent given' : 'You have not given placement consent',
  });

  // 3. CGPA check: student CGPA must meet the job minimum
  if (job.minCgpa != null) {
    const passed = (student.cgpa || 0) >= job.minCgpa;
    checks.push({
      name: 'CGPA',
      passed,
      message: passed
        ? `Your CGPA ${student.cgpa} meets the requirement of ${job.minCgpa}`
        : `Your CGPA ${student.cgpa} is below the required ${job.minCgpa}`,
    });
  }

  // 4. Branch check: student branch must be in allowed branches (case-insensitive)
  if (job.allowedBranches && job.allowedBranches.length > 0) {
    const studentBranch = (student.branch || '').toLowerCase();
    const passed = job.allowedBranches.some(b => b.toLowerCase() === studentBranch);
    checks.push({
      name: 'Branch',
      passed,
      message: passed
        ? `Your branch ${student.branch} is allowed`
        : `Your branch ${student.branch} is not in allowed branches: ${job.allowedBranches.join(', ')}`,
    });
  }

  // 5. Backlogs check: student backlogs must not exceed the job maximum
  if (job.maxBacklogs != null) {
    const passed = (student.backlogs || 0) <= job.maxBacklogs;
    checks.push({
      name: 'Backlogs',
      passed,
      message: passed
        ? `Your backlogs (${student.backlogs || 0}) are within the limit of ${job.maxBacklogs}`
        : `Your backlogs (${student.backlogs || 0}) exceed the limit of ${job.maxBacklogs}`,
    });
  }

  // 6. Batch check: student batch must match the job's target batch
  if (job.batch != null) {
    const passed = Number(student.batch) === Number(job.batch);
    checks.push({
      name: 'Batch',
      passed,
      message: passed
        ? `Batch ${student.batch} matches the job requirement`
        : `Job is for batch ${job.batch}, your batch is ${student.batch}`,
    });
  }

  // 7. Last date check: application deadline must not have passed
  if (job.lastDate) {
    const now = new Date();
    const passed = now <= new Date(job.lastDate);
    checks.push({
      name: 'Last Date',
      passed,
      message: passed
        ? 'Application window is still open'
        : `Application deadline was ${new Date(job.lastDate).toDateString()}`,
    });
  }

  // 8. Duplicate application check: must not have already applied
  let duplicatePassed;
  if (alreadyApplied !== undefined) {
    // Caller passed a boolean so no extra DB query needed
    duplicatePassed = !alreadyApplied;
  } else {
    // Fall back to a DB lookup if not provided
    const existing = await Application.findOne({ student: student.user || student._id, job: job._id });
    duplicatePassed = !existing;
  }
  checks.push({
    name: 'Duplicate',
    passed: duplicatePassed,
    message: duplicatePassed ? 'No prior application found' : 'You have already applied for this job',
  });

  // Collect all failed check messages as reasons
  const eligible = checks.every(c => c.passed);
  const reasons = checks.filter(c => !c.passed).map(c => c.message);

  return { eligible, checks, reasons };
};

module.exports = { checkEligibility };
