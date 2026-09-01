export type RiskLevel = "High" | "Medium" | "Low";
export type DocumentStatus = "Completed" | "Processing" | "Failed";
export interface AdminDocument { name:string; owner:string; status:DocumentStatus; uploaded:string; risk:RiskLevel }
export interface ProcessingJob { name:string; owner:string; progress:number }
export interface AuditEvent { action:string; user:string; target:string; details:string; ip:string; time:string }

export const recentDocuments: AdminDocument[] = [
  { name:"Master Service Agreement.pdf", owner:"Acme Corporation", status:"Completed", uploaded:"2 hours ago", risk:"High" },
  { name:"Employment Contract.docx", owner:"Stark Industries", status:"Completed", uploaded:"5 hours ago", risk:"Medium" },
  { name:"NDA - Project Phoenix.pdf", owner:"Wayne Enterprises", status:"Processing", uploaded:"1 day ago", risk:"Low" },
  { name:"Vendor Agreement.pdf", owner:"Cyberdyne Systems", status:"Completed", uploaded:"1 day ago", risk:"Medium" },
  { name:"Non-Disclosure Agreement.pdf", owner:"Globex Corporation", status:"Failed", uploaded:"2 days ago", risk:"High" },
];
export const processingJobs: ProcessingJob[] = [
  { name:"Service Agreement.pdf", owner:"Acme Corporation", progress:68 }, { name:"Court Filing.pdf", owner:"Johnson & Associates", progress:42 },
  { name:"Lease Agreement.pdf", owner:"Globex Corporation", progress:27 }, { name:"Terms & Conditions.pdf", owner:"Soylent Corp", progress:15 },
];
export const auditEvents: AuditEvent[] = [
  { action:"User suspended", user:"Admin User", target:"john.doe@acme.com", details:"Account suspended for policy violation", ip:"192.168.1.24", time:"2 hours ago" },
  { action:"Document deleted", user:"Admin User", target:"NDA-Project.pdf", details:"Document deleted from Wayne Enterprises workspace", ip:"192.168.1.24", time:"4 hours ago" },
  { action:"Processing retry", user:"Admin User", target:"Employment Contract.docx", details:"Manual retry triggered", ip:"192.168.1.24", time:"5 hours ago" },
  { action:"Risk status updated", user:"Admin User", target:"Contract Review", details:"Risk status changed from Medium to High", ip:"192.168.1.24", time:"6 hours ago" },
  { action:"User role updated", user:"Admin User", target:"sarah.wilson@stark.com", details:"Role changed from User to Admin", ip:"192.168.1.24", time:"1 day ago" },
];
