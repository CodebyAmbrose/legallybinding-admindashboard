"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { BookOpen, FileOutput, FileText, MoreVertical, Sparkles } from "lucide-react";
import { fetchAdminJson } from "@/lib/admin-client";
import { readAdminCache, writeAdminCache } from "@/lib/admin-cache";
import { AdminSectionShell, DetailDrawer, DetailField, OwnerCell, SectionMetric, SectionPagination, TableState, formatAdminDate, humanize, type OwnerIdentity } from "@/components/admin/admin-section-shell";

type DocumentSummary = { filename: string; original_filename: string; status: string; classification: string | null };
type Generation = { id: string; owner_clerk_id: string; document_id: string; template_slug: string; template_version: string; output_format: "pdf" | "docx"; jurisdiction: string; created_at: string; document: DocumentSummary | null; owner: OwnerIdentity };
type TemplateResponse = { generations: Generation[]; stats: { total: number; pdf: number; docx: number; recent: number }; total: number; page: number; pageSize: number };
const emptyResponse: TemplateResponse = { generations: [], stats: { total: 0, pdf: 0, docx: 0, recent: 0 }, total: 0, page: 0, pageSize: 25 };
const TEMPLATES_CACHE_KEY = "admin-templates-cache-v1";

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [format, setFormat] = useState("all");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TemplateResponse>(() => readAdminCache(TEMPLATES_CACHE_KEY, emptyResponse));
  const [selected, setSelected] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(() => !readAdminCache<TemplateResponse>(TEMPLATES_CACHE_KEY, emptyResponse).generations.length);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestData = useCallback(() => { const params = new URLSearchParams({ query: deferredQuery, format, page: String(page) }); return fetchAdminJson<TemplateResponse>(`/api/admin/templates?${params}`); }, [deferredQuery, format, page]);
  const applyData = useCallback((response: TemplateResponse) => { setData(response); writeAdminCache(TEMPLATES_CACHE_KEY, response); setError(""); setLoading(false); }, []);
  useEffect(() => { let current = true; requestData().then(response => { if (current) applyData(response); }).catch(reason => { if (current) { setError(reason instanceof Error ? reason.message : "Unable to load template activity"); setLoading(false); } }); return () => { current = false; }; }, [applyData, requestData]);
  const refresh = () => { setRefreshing(true); requestData().then(applyData).catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load template activity")).finally(() => setRefreshing(false)); };
  const templateName = (slug: string) => humanize(slug);
  return <AdminSectionShell title="Templates" description="Monitor documents generated through the guided template library and review template activity." query={query} setQuery={value => { setPage(0); setQuery(value); }} searchPlaceholder="Search templates, owners, jurisdictions..." refreshing={refreshing} refresh={refresh}>
    <section className="section-metrics"><SectionMetric icon={Sparkles} label="Total Generated" value={data.stats.total} tone="purple" note="All template outputs"/><SectionMetric icon={FileOutput} label="Last 30 Days" value={data.stats.recent} tone="blue" note="Recent generation activity"/><SectionMetric icon={FileText} label="PDF Outputs" value={data.stats.pdf} tone="red" note="Generated documents"/><SectionMetric icon={BookOpen} label="DOCX Outputs" value={data.stats.docx} tone="green" note="Editable documents"/></section>
    <section className="panel section-data-panel"><div className="section-toolbar"><div><strong>Template generation history</strong><span>{data.total} matching records</span></div><label className="section-filter-label">Format<select value={format} onChange={event => { setPage(0); setLoading(true); setFormat(event.target.value); }}><option value="all">All formats</option><option value="pdf">PDF</option><option value="docx">DOCX</option></select></label></div><div className="section-table-wrap"><table className="section-table templates-table"><thead><tr><th>Template</th><th>Generated document</th><th>Owner</th><th>Format</th><th>Jurisdiction</th><th>Version</th><th>Generated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{data.generations.map(generation => { const name = templateName(generation.template_slug); const documentName = generation.document?.original_filename || generation.document?.filename || generation.document_id; return <tr key={generation.id} onClick={() => setSelected(generation)}><td><div className="section-primary-cell"><span className="section-file-icon template"><BookOpen size={16}/></span><div><strong>{name}</strong><span>{generation.template_slug}</span></div></div></td><td><div className="compact-document"><FileText size={15}/><span title={documentName}>{documentName}</span></div></td><td><OwnerCell owner={generation.owner}/></td><td><span className={`format-badge ${generation.output_format}`}>{generation.output_format.toUpperCase()}</span></td><td>{generation.jurisdiction}</td><td>{generation.template_version}</td><td>{formatAdminDate(generation.created_at)}</td><td><button className="more-button" onClick={event => { event.stopPropagation(); setSelected(generation); }} aria-label={`View ${name}`}><MoreVertical size={16}/></button></td></tr>; })}</tbody></table><TableState loading={loading} error={error} empty={!data.generations.length} retry={refresh}/></div><SectionPagination page={page} pageSize={data.pageSize} total={data.total} setPage={next => { setLoading(true); setPage(next); }}/></section>
    {selected && <DetailDrawer title={templateName(selected.template_slug)} subtitle={`${selected.output_format.toUpperCase()} · ${selected.template_version}`} close={() => setSelected(null)}><dl className="section-detail-list"><DetailField label="Generated document">{selected.document?.original_filename || selected.document?.filename || selected.document_id}</DetailField><DetailField label="Owner"><OwnerCell owner={selected.owner}/></DetailField><DetailField label="Jurisdiction">{selected.jurisdiction}</DetailField><DetailField label="Output format">{selected.output_format.toUpperCase()}</DetailField><DetailField label="Generated">{formatAdminDate(selected.created_at)}</DetailField></dl></DetailDrawer>}
  </AdminSectionShell>;
}
