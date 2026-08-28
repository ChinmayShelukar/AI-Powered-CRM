// Mirrors the backend DTOs. Keep in sync with `cortex-backend/src/main/java/com/cortexcrm/dto/`.

export type Role = "ADMIN" | "MANAGER" | "SALES_REP";

export type ContactStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CUSTOMER" | "LOST";

export type DealStage = "PROSPECT" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";

export type ActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";

export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type Intent = "PRICING" | "COMPLAINT" | "RENEWAL" | "CHURN" | "UPSELL" | "OTHER";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  name: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: ContactStatus;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: ContactStatus;
  assignedToUserId?: number;
}

export interface Deal {
  id: number;
  title: string;
  value: number;
  stage: DealStage;
  closeDate: string | null;
  contactId: number | null;
  contactName: string | null;
  assignedToUserId: number | null;
  assignedToUserName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealRequest {
  title: string;
  value?: number;
  stage?: DealStage;
  closeDate?: string;
  contactId?: number;
  assignedToUserId?: number;
}

export interface Activity {
  id: number;
  type: ActivityType;
  notes: string | null;
  activityDate: string;
  sentiment: Sentiment | null;
  intent: Intent | null;
  contactId: number | null;
  contactName: string | null;
  dealId: number | null;
  dealTitle: string | null;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
}

export interface ActivityRequest {
  type: ActivityType;
  notes?: string;
  activityDate?: string;
  contactId?: number;
  dealId?: number;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  userEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: number;
  oldValue: string | null;
  newValue: string | null;
  occurredAt: string;
}

export interface AiQueryResponse {
  question: string;
  sql: string | null;
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  chatResponse: string | null;
}

export interface AiTextResponse {
  text: string;
}

export type NotificationEventType =
  | "deal.stage.changed"
  | "activity.logged"
  | "contact.assigned";

export interface DealStageChangedPayload {
  dealId: number;
  dealTitle: string;
  fromStage: DealStage;
  toStage: DealStage;
  recipientUserId: number;
}

export interface ActivityLoggedPayload {
  activityId: number;
  type: ActivityType;
  contactId: number | null;
  dealId: number | null;
  createdByUserId: number;
  recipientUserId: number;
}

export interface ContactAssignedPayload {
  contactId: number;
  contactName: string;
  recipientUserId: number;
}

export type NotificationPayload =
  | { type: "deal.stage.changed"; data: DealStageChangedPayload }
  | { type: "activity.logged"; data: ActivityLoggedPayload }
  | { type: "contact.assigned"; data: ContactAssignedPayload };

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  path: string;
  timestamp: string;
  fieldErrors: Record<string, string> | null;
}

export type RfmSegment =
  | "Champion"
  | "Loyal"
  | "Potential"
  | "At-Risk"
  | "Needs-Attention";

export interface RfmRow {
  contactId: number;
  name: string;
  company: string | null;
  recencyDays: number;
  frequency: number;
  monetary: number;
  segment: RfmSegment;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskRow {
  contactId: number;
  name: string;
  company: string | null;
  level: RiskLevel;
  reasons: string[];
}

export type DealHealthLevel = "HEALTHY" | "AT_RISK" | "STALLED";

export interface DealHealthRow {
  dealId: number;
  title: string;
  stage: DealStage;
  level: DealHealthLevel;
  reasons: string[];
}

export interface TeamInsightRow {
  userId: number;
  repName: string;
  openDeals: number;
  openPipeline: number;
  wonRevenue: number;
  activities30d: number;
}

export interface TeamInsightResponse {
  reps: TeamInsightRow[];
  narrative: string;
}

export interface AgentStep {
  step: number;
  action: string;
  detail: string;
}

export interface BriefingResponse {
  trace: AgentStep[];
  summary: string;
}
