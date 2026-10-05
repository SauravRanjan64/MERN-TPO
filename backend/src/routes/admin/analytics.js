// Admin analytics route
const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const User = require('../../models/User');

const router = express.Router();

router.get('/analytics', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Status counts
    const statusAgg = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusCounts = { APPLIED: 0, SHORTLISTED: 0, SELECTED: 0, REJECTED: 0 };
    statusAgg.forEach(s => { statusCounts[s._id] = s.count; });

    // Branch selected counts (only SELECTED applications)
    const branchAgg = await Application.aggregate([
      { $match: { status: 'SELECTED' } },
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $unwind: '$studentInfo' },
      { $group: { _id: '$studentInfo.branch', count: { $sum: 1 } } }
    ]);
    const branchSelected = branchAgg.map(b => ({ branch: b._id, selected: b.count }));

    // Top 5 jobs by application count
    const topJobsAgg = await Application.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'jobInfo' } },
      { $unwind: '$jobInfo' },
      { $lookup: { from: 'companies', localField: 'jobInfo.company', foreignField: '_id', as: 'companyInfo' } },
      { $unwind: '$companyInfo' },
      { $lookup: { from: 'users', localField: 'companyInfo.user', foreignField: '_id', as: 'companyUser' } },
      { $unwind: '$companyUser' },
      {
        $project: {
          _id: 0,
          title: '$jobInfo.title',
          company: '$companyUser.name',
          applications: '$count'
        }
      }
    ]);

    res.json({ statusCounts, branchSelected, topJobs: topJobsAgg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
