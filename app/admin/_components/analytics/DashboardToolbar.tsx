"use client";

import { ExportCsvButton } from "./ExportCsvButton";

interface DashboardToolbarProps {
  children: React.ReactNode;
  onExport: () => void;
}

export function DashboardToolbar({ children, onExport }: DashboardToolbarProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {children}
      <ExportCsvButton onClick={onExport} />
    </div>
  );
}
