// Helpers to compute deadline urgency and student eligibility for a job

// Computes the deadline status label, badge color class, and whether it has expired
export function getDeadlineInfo(lastDate) {
  if (!lastDate) {
    return { label: 'No deadline', color: 'gray', isExpired: false };
  }

  const deadline = new Date(lastDate);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  // If the deadline has already passed
  if (diffMs <= 0) {
    return { label: 'Expired', color: 'danger', isExpired: true };
  }

  // Calculate remaining days rounded up
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return { label: 'Closing today', color: 'warning', isExpired: false };
  }

  if (diffDays <= 3) {
    return { label: `Closing in ${diffDays} days`, color: 'warning', isExpired: false };
  }

  return { label: `${diffDays} days left`, color: 'info', isExpired: false };
}

// Checks if the student meets the job's minimum CGPA requirement
export function getEligibility(user, job) {
  const studentCgpa = user?.cgpa || 0;
  const minCgpa = job?.minCgpa || 0;

  if (studentCgpa < minCgpa) {
    return {
      eligible: false,
      label: `Not eligible (CGPA ${studentCgpa} < ${minCgpa})`,
      color: 'danger'
    };
  }

  return {
    eligible: true,
    label: 'Eligible',
    color: 'success'
  };
}
