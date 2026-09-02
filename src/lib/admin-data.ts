export interface AdminOverview {
  metrics: { totalUsers:number; activeUsers:number|null; documentsUploaded:number; documentsProcessed:number; analysesCompleted:number; storageBytes:number; totalRisks:number; highRisks:number; mediumRisks:number; lowRisks:number; obligations:number };
  status: Record<"uploaded"|"queued"|"processing"|"completed"|"failed", number>;
  documents: { id:string; name:string; owner:string; status:string; uploaded:string; risk:string }[];
  queue: { inQueue:number; processing:number; failed:number; jobs:{ id:string; name:string; owner:string; stage:string; status:string }[] };
  audit: { id:string; action:string; user:string; target:string; details:string; ip:string; time:string }[];
  growth: { date:string; users:number; total:number }[];
  aiUsage: null;
}
