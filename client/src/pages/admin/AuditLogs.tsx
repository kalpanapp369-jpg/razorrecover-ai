import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { AuditLog } from '../../types/database.types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (item) => (
        <span className="font-mono text-xs text-slate-500">
          {formatDateTime(item.created_at)}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor / Initiator',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <span className="rounded-[4px] bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-[#0C2651]">
            {item.actor_role || 'SYSTEM'}
          </span>
          <span className="text-xs text-slate-600">{item.actor_email || 'Autonomous Engine'}</span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Event',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-[#0D94FB]">
          {item.action}
        </span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Target Entity',
      render: (item) => (
        <span className="text-xs text-slate-600 font-medium">
          {item.entity_type} {item.entity_id ? `(${item.entity_id.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      key: 'state_diff',
      header: 'State Mutation Details',
      render: (item) => (
        <pre className="max-w-xs truncate rounded-[4px] bg-slate-50 p-1.5 font-mono text-[10px] text-slate-700 border border-slate-200">
          {JSON.stringify(item.new_state || item.previous_state || {})}
        </pre>
      ),
    },
  ];

  if (isLoading && logs.length === 0) {
    return <LoadingState message="Loading immutable audit trail..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadLogs} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Audit Logs"
        subtitle="Cryptographically verified chronology of recovery approvals, policy modifications & state transitions"
        badge="Audit Compliance"
      />

      <DataTable columns={columns} data={logs} />
    </div>
  );
};
