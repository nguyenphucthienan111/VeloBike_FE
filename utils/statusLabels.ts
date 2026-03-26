// Human-readable labels for order statuses, verdicts, and other enums

export const ORDER_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  ESCROW_LOCKED: 'Payment held',
  IN_INSPECTION: 'In inspection',
  INSPECTION_PASSED: 'Inspection passed',
  INSPECTION_FAILED: 'Inspection failed',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const VERDICT_LABELS: Record<string, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  SUGGEST_ADJUSTMENT: 'Suggest adjustment',
};

export const CHECKPOINT_STATUS_LABELS: Record<string, string> = {
  PASS: 'Pass',
  FAIL: 'Fail',
  WARN: 'Warning',
};

export const formatStatus = (status: string) =>
  ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

export const formatVerdict = (verdict: string) =>
  VERDICT_LABELS[verdict] ?? verdict.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

export const formatCheckpointStatus = (status: string) =>
  CHECKPOINT_STATUS_LABELS[status] ?? status;
