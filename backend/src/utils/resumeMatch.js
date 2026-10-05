// Resume matching utility: compares student's resume text against job required skills
// Uses whole-word regex matching to avoid false positives like "java" matching "javascript"

// Escape special regex characters in a string (handles c++, c#, node.js etc.)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// computeMatch checks how many required skills appear as whole words in the resume text
const computeMatch = (resumeText, requiredSkills) => {
  // Normalise: lowercase and collapse whitespace
  const normalised = (resumeText || '').toLowerCase().replace(/\s+/g, ' ');

  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of (requiredSkills || [])) {
    // Build a whole-word regex; escape special chars first
    const escaped = escapeRegex(skill.toLowerCase());
    // Use word boundaries - note \b does not work well before/after non-word chars like +
    // so we use a look-behind/ahead that checks for a non-alphanumeric boundary
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (pattern.test(normalised)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Score is percentage of required skills matched (0 if no required skills)
  const total = (requiredSkills || []).length;
  const matchScore = total > 0 ? Math.round((matchedSkills.length / total) * 100) : 0;

  return { matchScore, matchedSkills, missingSkills };
};

module.exports = { computeMatch };
