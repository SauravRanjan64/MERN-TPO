// Admin Dashboard: split into modular tabs (Overview, Jobs, Applications, Students)
import { useState } from 'react';
import OverviewTab from './admin/OverviewTab';
import JobsTab from './admin/JobsTab';
import ApplicationsTab from './admin/ApplicationsTab';
import StudentsTab from './admin/StudentsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="admin-dashboard">
      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Applications
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab onSwitchTab={setActiveTab} />}
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
        {activeTab === 'students' && <StudentsTab />}
      </div>
    </div>
  );
}
