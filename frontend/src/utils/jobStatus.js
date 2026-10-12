// Helpers to compute deadline urgency and student eligibility for a job

// Computes the deadline status label, badge color class, and whether it has expired
export function getDeadlineInfo(lastDate) {
  if (!lastDate) {
    return { label: 'No deadline', color: 'gray', isExpired: false };
  }

  const deadline = new Date(lastDate);
  const now = new Date();

  // If the actual deadline moment has already passed, show Expired
  if (deadline.getTime() <= now.getTime()) {
    return { label: 'Expired', color: 'danger', isExpired: true };
  }

  // Compare calendar days: strip time by setting both dates to midnight local time
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineMidnight = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  // days = whole calendar days between today midnight and deadline midnight
  const days = Math.round((deadlineMidnight - todayMidnight) / 86400000);

  if (days === 0) {
    return { label: 'Closing today', color: 'warning', isExpired: false };
  }

  if (days === 1) {
    return { label: 'Closing in 1 day', color: 'warning', isExpired: false };
  }

  if (days <= 3) {
    return { label: `Closing in ${days} days`, color: 'warning', isExpired: false };
  }

  return { label: `${days} days left`, color: 'info', isExpired: false };
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
