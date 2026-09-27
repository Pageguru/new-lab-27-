import React from 'react';
import { LabSoftwareApp } from '../LabSoftwareApp';
import { AppView } from '../../types';

interface TechnicianDepartmentDashboardProps {
  onNavigateView?: (view: AppView) => void;
  onOpenReportPortal?: (reportId: string, mobile: string) => void;
}

export const TechnicianDepartmentDashboard: React.FC<TechnicianDepartmentDashboardProps> = ({
  onNavigateView,
  onOpenReportPortal,
}) => {
  return (
    <LabSoftwareApp
      onBackToWebsite={() => {
        if (onNavigateView) {
          onNavigateView('vendor_dashboard');
        }
      }}
      onViewReport={(reportId, mobile) => {
        if (onOpenReportPortal) {
          onOpenReportPortal(reportId, mobile);
        }
      }}
    />
  );
};
