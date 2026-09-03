"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import {
  BrainCircuit,
  FileSearch,
  ListChecks,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  AdminSectionShell,
  DetailDrawer,
  DetailField,
  OwnerCell,
  SectionMetric,
  SectionPagination,
  TableState,
  formatAdminDate,
  humanize,
  type OwnerIdentity,
} from "@/components/admin/admin-section-shell";
import { fetchAdminJson } from "@/lib/admin-client";
import { readAdminCache, writeAdminCache } from "@/lib/admin-cache";

type DocumentSummary = {
  id?: string;
  filename: string;
  original_filename: string;
  status: string;
  classification: string | null;
};

type Analysis = {
  id: string;
  document_id: string;
  owner_clerk_id: string;
  provider: string;
  model: string;
  document_type: string;
  overall_risk_level: "low" | "medium" | "high";
  summary: string;
  recommended_next_steps: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  document: DocumentSummary | null;
  owner: OwnerIdentity;
  riskCount: number;
  obligationCount: number;
};

type AnalysisResponse = {
  analyses: Analysis[];
  stats: { total: number; high: number; medium: number; low: number };
  total: number;
  page: number;
  pageSize: number;
};

const emptyResponse: AnalysisResponse = {
  analyses: [],
  stats: { total: 0, high: 0, medium: 0, low: 0 },
  total: 0,
  page: 0,
  pageSize: 25,
};
const ANALYSIS_CACHE_KEY = "admin-ai-analysis-cache-v1";

export default function AIAnalysisPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [risk, setRisk] = useState("all");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AnalysisResponse>(() => readAdminCache(ANALYSIS_CACHE_KEY, emptyResponse));
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(() => !readAdminCache<AnalysisResponse>(ANALYSIS_CACHE_KEY, emptyResponse).analyses.length);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestData = useCallback(() => {
    const params = new URLSearchParams({ query: deferredQuery, risk, page: String(page) });
    return fetchAdminJson<AnalysisResponse>(`/api/admin/ai-analysis?${params}`);
  }, [deferredQuery, page, risk]);

  const applyData = useCallback((response: AnalysisResponse) => {
    setData(response);
    writeAdminCache(ANALYSIS_CACHE_KEY, response);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    let current = true;
    requestData()
      .then(response => { if (current) applyData(response); })
      .catch(reason => { if (current) { setError(reason instanceof Error ? reason.message : "Unable to load AI analyses"); setLoading(false); } });
    return () => { current = false; };
  }, [applyData, requestData]);

  const refresh = () => {
    setRefreshing(true);
    requestData()
      .then(applyData)
      .catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load AI analyses"))
      .finally(() => setRefreshing(false));
  };

  const changeQuery = (value: string) => { setPage(0); setQuery(value); };
  const changeRisk = (value: string) => { setPage(0); setLoading(true); setRisk(value); };

  return (
    <AdminSectionShell
      title="AI Analysis"
      description="Review every completed document analysis, model result, and extracted finding across the platform."
      query={query}
      setQuery={changeQuery}
      searchPlaceholder="Search analyses, owners, document types..."
      refreshing={refreshing}
      refresh={refresh}
    >
      <section className="section-metrics">
        <SectionMetric icon={BrainCircuit} label="Total Analyses" value={data.stats.total} tone="purple" note="Live from Supabase"/>
        <SectionMetric icon={ShieldAlert} label="High Risk" value={data.stats.high} tone="red" note="Requires attention"/>
        <SectionMetric icon={FileSearch} label="Medium Risk" value={data.stats.medium} tone="amber" note="Review recommended"/>
        <SectionMetric icon={ShieldCheck} label="Low Risk" value={data.stats.low} tone="green" note="Lower priority"/>
      </section>

      <section className="panel section-data-panel">
        <div className="section-toolbar analysis-toolbar">
          <label className="analysis-search"><FileSearch size={16}/><input value={query} onChange={event => changeQuery(event.target.value)} placeholder="Search by document, owner or type..."/></label>
          <div className="analysis-toolbar-spacer" />
          <label className="section-filter-label">Risk level
            <select value={risk} onChange={event => changeRisk(event.target.value)}>
              <option value="all">All risk levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <button className="analysis-filter-placeholder" type="button" disabled>Document type <span>All types⌄</span></button>
          <button className="analysis-filter-placeholder" type="button" disabled>Owner <span>All owners⌄</span></button>
          <button className="analysis-filter-placeholder" type="button" disabled>Model <span>All models⌄</span></button>
        </div>

        <div className="section-table-wrap">
          <table className="section-table analysis-table">
            <thead><tr><th>Document</th><th>Owner</th><th>Type</th><th>Risk</th><th>Findings</th><th>Model</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{data.analyses.map(analysis => {
              const filename = analysis.document?.original_filename || analysis.document?.filename || analysis.document_id;
              return (
                <tr key={analysis.id} onClick={() => setSelected(analysis)}>
                  <td><div className="section-primary-cell"><span className="section-file-icon"><BrainCircuit size={16}/></span><div><strong title={filename}>{filename}</strong><span>{analysis.document?.classification || "Unclassified"}</span></div></div></td>
                  <td><OwnerCell owner={analysis.owner}/></td>
                  <td>{humanize(analysis.document_type)}</td>
                  <td><span className={`risk-badge ${analysis.overall_risk_level}`}>{humanize(analysis.overall_risk_level)}</span></td>
                  <td><span className="finding-count"><b>{analysis.riskCount}</b> risks · <b>{analysis.obligationCount}</b> obligations</span></td>
                  <td><div className="model-cell"><strong>{analysis.model}</strong><span>{analysis.provider}</span></div></td>
                  <td>{formatAdminDate(analysis.updated_at)}</td>
                  <td><button className="more-button" onClick={event => { event.stopPropagation(); setSelected(analysis); }} aria-label={`View ${filename}`}><MoreVertical size={16}/></button></td>
                </tr>
              );
            })}</tbody>
          </table>
          <TableState loading={loading} error={error} empty={!data.analyses.length} retry={refresh}/>
        </div>
        <SectionPagination page={page} pageSize={data.pageSize} total={data.total} setPage={next => { setLoading(true); setPage(next); }}/>
      </section>

      {selected && (
        <DetailDrawer
          title={selected.document?.original_filename || selected.document?.filename || selected.document_id}
          subtitle={`${humanize(selected.document_type)} · ${humanize(selected.overall_risk_level)} risk`}
          close={() => setSelected(null)}
        >
          <dl className="section-detail-list">
            <DetailField label="Owner"><OwnerCell owner={selected.owner}/></DetailField>
            <DetailField label="AI provider / model">{selected.provider} · {selected.model}</DetailField>
            <DetailField label="Analysis summary"><p className="detail-copy">{selected.summary}</p></DetailField>
            <DetailField label="Extracted findings">{selected.riskCount} risks · {selected.obligationCount} obligations</DetailField>
            <DetailField label="Last updated">{formatAdminDate(selected.updated_at)}</DetailField>
          </dl>
          <div className="detail-list-block">
            <h3><ListChecks size={16}/>Recommended next steps</h3>
            {selected.recommended_next_steps.length
              ? <ol>{selected.recommended_next_steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol>
              : <p>No recommended next steps were recorded.</p>}
          </div>
        </DetailDrawer>
      )}
    </AdminSectionShell>
  );
}
