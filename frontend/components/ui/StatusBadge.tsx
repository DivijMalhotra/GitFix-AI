import { clsx } from 'clsx';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'badge-gray'   },
  indexing:  { label: 'Indexing',  className: 'badge-yellow' },
  indexed:   { label: 'Indexed',   className: 'badge-green'  },
  failed:    { label: 'Failed',    className: 'badge-red'    },
  analyzing: { label: 'Analyzing', className: 'badge-yellow' },
  analyzed:  { label: 'Analyzed',  className: 'badge-blue'   },
  pr_created:{ label: 'PR Created',className: 'badge-green'  },
};

export function StatusBadge({ status }: { status: string }) {
  const { label, className } = STATUS_MAP[status] || { label: status, className: 'badge-gray' };
  return <span className={className}>{label}</span>;
}
