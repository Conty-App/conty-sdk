export interface ContyErrorInit {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
  accepted?: number;
  requestId?: string | null;
}
