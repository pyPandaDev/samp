import { apiFetch, API_BASE_URL, createApiHeaders } from "./client";
import {
  SampleRequestItem,
  CreateSampleRequestForm,
  BatchCreateSampleRequestPayload,
  BatchCreateSampleRequestResponse,
  DesignRequest,
  DesignRequestForm,
} from "@/features/sample-requests/types";
import { getBusinessYearForDate } from "@/lib/businessYear";
import { getRequestTrackType } from "@/features/sample-requests/utils/trackTypes";
import { fetchFeasibilityRequestsApi, deleteFeasibilityRequestApi } from "./feasibilityApi";
import { fetchProgramRequestsApi, deleteProgramRequestApi } from "./programsApi";

type ApiSampleRequest = Record<string, unknown>;

function text(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function textOrNumber(value: unknown): string | number {
  return typeof value === "number" ? value : text(value);
}

export function mapDesignRequest(item: Record<string, unknown>): DesignRequest {
  return {
    id: Number(item.id),
    srNumber: typeof item.sr_number === "string" ? item.sr_number : typeof item.srNumber === "string" ? item.srNumber : undefined,
    requestCode: typeof item.request_code === "string" ? item.request_code : typeof item.requestCode === "string" ? item.requestCode : undefined,
    customerName: String(item.customer_name || item.customer || ""),
    programName: String(item.program_name || item.programName || ""),
    programYear: String(item.program_year || item.programYear || "2026-2027"),
    targetPlant: typeof item.target_plant === "string" ? item.target_plant : typeof item.targetPlant === "string" ? item.targetPlant : undefined,
    numberOfDesigns: Number(item.number_of_designs || item.numberOfDesigns || 1),
    trend: typeof item.trend === "string" ? item.trend : null,
    targetAudience: typeof item.target_audience === "string" ? item.target_audience : typeof item.targetAudience === "string" ? item.targetAudience : null,
    referenceImage: typeof item.reference_image === "string" ? item.reference_image : typeof item.referenceImage === "string" ? item.referenceImage : null,
    productDescription: String(item.product_description || item.productDescription || "Creative Design Brief"),
    designRequiredDate: typeof item.design_required_date === "string" ? item.design_required_date : typeof item.designRequiredDate === "string" ? item.designRequiredDate : null,
    status: String(item.status || "Draft (Pre-SMT)"),
    createdBy: String(item.created_by || item.createdBy || "Marketing Specialist"),
    updatedBy: String(item.updated_by || item.updatedBy || ""),
    folderPath: typeof item.folder_path === "string" ? item.folder_path : typeof item.folderPath === "string" ? item.folderPath : undefined,
    submittedDesignsCount: Number(item.submitted_designs_count ?? item.submittedDesignsCount ?? 0),
    submittedDesigns: Array.isArray(item.submitted_designs)
      ? (item.submitted_designs as any[]).map((d) => ({
          code: String(d.code || ""),
          shutterstockNo: String(d.shutterstock_no || d.shutterstockNo || ""),
          remark: String(d.remark || ""),
        }))
      : Array.isArray((item as any).submittedDesigns)
      ? (item as any).submittedDesigns
      : [],
    marketingDecision: (item.marketing_decision || (item as any).marketingDecision || null) as any,
    marketingDecisionRemarks: typeof item.marketing_decision_remarks === "string" ? item.marketing_decision_remarks : typeof (item as any).marketingDecisionRemarks === "string" ? (item as any).marketingDecisionRemarks : undefined,
    selectedMockupDesigns: Array.isArray(item.selected_mockup_designs)
      ? (item.selected_mockup_designs as string[])
      : Array.isArray((item as any).selectedMockupDesigns)
      ? ((item as any).selectedMockupDesigns as string[])
      : [],
    mockupRequested: Boolean(item.mockup_requested || (item as any).mockupRequested),
    createdAt: String(item.created_at || item.createdAt || ""),
    updatedAt: String(item.updated_at || item.updatedAt || ""),
  };
}

export function mapDesignRequestToSampleRequest(item: DesignRequest): SampleRequestItem {
  const createdDate = item.createdAt ? item.createdAt.split("T")[0] : "";
  const currentYearSuffix = new Date().getFullYear() % 100;
  const srNum = item.srNumber || `SR-${currentYearSuffix}-DSG-${String(item.id).padStart(3, "0")}`;
  const matCode = item.requestCode || `DSG-1505-${String(item.id).padStart(4, "0")}`;
  return {
    id: `design-${item.id}`,
    srNumber: srNum,
    year: item.programYear && item.programYear.includes("-") ? item.programYear : getBusinessYearForDate(createdDate),
    productDescription: item.productDescription,
    customer: item.customerName,
    targetPlant: item.targetPlant || "",
    dateRequestCreated: createdDate || new Date().toISOString().split("T")[0],
    createdBy: item.createdBy || "Marketing Specialist",
    materialCode: matCode,
    sampleRequiredDate: item.designRequiredDate || undefined,
    status: item.status || "Draft (Pre-SMT)",
    programYear: item.programYear,
    programName: item.programName,
    requestKind: "design",
    designRequestId: item.id,
    numberOfDesigns: item.numberOfDesigns,
    trend: item.trend,
    targetAudience: item.targetAudience,
    referenceImage: item.referenceImage,
    folderPath: item.folderPath,
    submittedDesignsCount: item.submittedDesignsCount,
    submittedDesigns: item.submittedDesigns,
    marketingDecision: item.marketingDecision,
    marketingDecisionRemarks: item.marketingDecisionRemarks,
    selectedMockupDesigns: item.selectedMockupDesigns,
    mockupRequested: item.mockupRequested,
    createdAt: item.createdAt,
    requestTypes: ["design"],
    creationMode: "marketing_request",
  };
}

export async function fetchDesignRequestsApi(): Promise<DesignRequest[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/api/v1/design-requests");
  return (data || []).map(mapDesignRequest);
}

export async function fetchDesignRequestApi(id: number): Promise<DesignRequest> {
  const data = await apiFetch<Record<string, unknown>>(`/api/v1/design-requests/${id}`);
  return mapDesignRequest(data);
}

export async function createDesignRequestApi(form: DesignRequestForm): Promise<DesignRequest | null> {
  try {
    const data = await apiFetch<Record<string, unknown>>("/api/v1/design-requests", {
      method: "POST",
      jsonBody: {
        customer_name: form.customerName.trim(),
        program_name: form.programName.trim(),
        program_year: form.programYear.trim(),
        number_of_designs: Number(form.numberOfDesigns),
        trend: form.trend.trim() || null,
        target_audience: form.targetAudience.trim() || null,
        reference_image: form.referenceImage.trim() || null,
        product_description: form.productDescription.trim(),
        design_required_date: form.designRequiredDate || null,
      },
    });
    return mapDesignRequest(data);
  } catch (err) {
    console.error("Error creating design request:", err);
    return null;
  }
}

export async function updateDesignRequestApi(id: number, form: Partial<DesignRequestForm>): Promise<DesignRequest | null> {
  try {
    const body: Record<string, unknown> = {};
    if (form.customerName !== undefined) body.customer_name = form.customerName.trim();
    if (form.programName !== undefined) body.program_name = form.programName.trim();
    if (form.programYear !== undefined) body.program_year = form.programYear.trim();
    if (form.numberOfDesigns !== undefined) body.number_of_designs = Number(form.numberOfDesigns);
    if (form.trend !== undefined) body.trend = form.trend?.trim() || null;
    if (form.targetAudience !== undefined) body.target_audience = form.targetAudience?.trim() || null;
    if (form.referenceImage !== undefined) body.reference_image = form.referenceImage?.trim() || null;
    if (form.productDescription !== undefined) body.product_description = form.productDescription.trim();
    if (form.designRequiredDate !== undefined) body.design_required_date = form.designRequiredDate || null;

    const data = await apiFetch<Record<string, unknown>>(`/api/v1/design-requests/${id}`, {
      method: "PATCH",
      jsonBody: body,
    });
    return mapDesignRequest(data);
  } catch (err) {
    console.error(`Error updating design request ${id}:`, err);
    return null;
  }
}

export async function deleteDesignRequestApi(id: number): Promise<boolean> {
  try {
    await apiFetch(`/api/v1/design-requests/${id}`, { method: "DELETE" });
    return true;
  } catch (err) {
    console.error(`Error deleting design request ${id}:`, err);
    return false;
  }
}

export function mapSampleRequest(item: ApiSampleRequest, fallbackDate = ""): SampleRequestItem {
  return {
    id: text(item.id),
    srNumber: text(item.sr_number ?? (item as any).srNumber),
    year: text(item.year, "2026-2027"),
    productDescription: text(item.product_description ?? (item as any).productDescription),
    programName: text(item.program_name ?? (item as any).programName),
    customer: text(item.customer),
    targetPlant: text(item.target_plant ?? (item as any).targetPlant),
    dateRequestCreated: text(item.date_request_created ?? (item as any).dateRequestCreated, fallbackDate),
    createdBy: text(item.created_by ?? (item as any).createdBy, "Admin"),
    materialCode: text(item.material_code ?? (item as any).materialCode),
    barcode: text(item.barcode),
    customerProductCode: text(item.customer_product_code ?? (item as any).customerProductCode),
    sourceSampleCode: text(item.source_sample_code ?? (item as any).sourceSampleCode),
    sourceRequestId: item.source_request_id ? Number(item.source_request_id) : undefined,
    sourceSampleRequestId: item.source_sample_request_id
      ? Number(item.source_sample_request_id)
      : item.source_request_id
      ? Number(item.source_request_id)
      : undefined,
    sampleRequiredDate: text(item.sample_required_date ?? (item as any).sampleRequiredDate),
    productType: text(item.product_type ?? (item as any).productType),
    productTypeNavneet: text(item.product_type_navneet ?? (item as any).productTypeNavneet ?? item.product_type),
    productTypeNewCustomer: text(item.product_type_new_customer ?? (item as any).productTypeNewCustomer),
    productImagePath: text(item.product_image_path ?? (item as any).productImagePath),
    designsCustomerCreative: text(item.designs_customer_creative ?? (item as any).designsCustomerCreative),
    brandName: text(item.brand_name ?? (item as any).brandName),
    unitPcPack: textOrNumber(item.unit_pc_pack ?? (item as any).unitPcPack),
    qtyDesignCosting: textOrNumber(item.qty_design_costing ?? (item as any).qtyDesignCosting),
    productArtworkNos: textOrNumber(item.product_artwork_nos ?? (item as any).productArtworkNos),
    targetArtworkDateCreative: text(item.target_artwork_date_creative ?? (item as any).targetArtworkDateCreative),
    targetArtworkDateStudio: text(item.target_artwork_date_studio ?? (item as any).targetArtworkDateStudio),
    qtyForSampling: textOrNumber(item.qty_for_sampling ?? (item as any).qtyForSampling),
    mockupRequired: text(item.mockup_required ?? (item as any).mockupRequired),
    status: text(item.status, "Draft (Pre-SMT)"),
    creationMode: text(item.creation_mode ?? (item as any).creationMode, "material_code"),
    programYear: text(item.program_year ?? (item as any).programYear),
    requestTypes: Array.isArray(item.request_types || (item as any).requestTypes)
      ? ((item.request_types || (item as any).requestTypes) as any[]).filter((value): value is "design" | "mockup" | "sample" | "costing" =>
          ["design", "mockup", "sample", "costing"].includes(String(value))
        )
      : [],
    createdAt: item.created_at ? text(item.created_at).split("T")[0] : (item as any).createdAt ? text((item as any).createdAt).split("T")[0] : fallbackDate,
    plantFeasibilityResponse: (item.plant_feasibility_response || (item as any).plantFeasibilityResponse || null) as any,
    plantFeasibilityRemark: text(item.plant_feasibility_remark || (item as any).plantFeasibilityRemark) || null,
    samplingFeasibilityResponse: (item.sampling_feasibility_response || (item as any).samplingFeasibilityResponse || null) as any,
    samplingFeasibilityRemark: text(item.sampling_feasibility_remark || (item as any).samplingFeasibilityRemark) || null,
    feasibilityClosedAt: text(item.feasibility_closed_at || (item as any).feasibilityClosedAt) || null,
    feasibilityClosedBy: (item.feasibility_closed_by || (item as any).feasibilityClosedBy || null) as any,
    referenceImages: Array.isArray(item.reference_images)
      ? (item.reference_images as string[])
      : Array.isArray((item as any).referenceImages)
      ? ((item as any).referenceImages as string[])
      : [],
    referenceLinks: (() => {
      const explicitLinks: string[] = Array.isArray(item.reference_links)
        ? (item.reference_links as string[])
        : Array.isArray((item as any).referenceLinks)
        ? ((item as any).referenceLinks as string[])
        : [];
      return explicitLinks;
    })(),
    folderPath: text(item.folder_path ?? (item as any).folderPath),
    submittedDesignsCount: Number(item.submitted_designs_count ?? (item as any).submittedDesignsCount ?? 0),
    submittedDesigns: Array.isArray(item.submitted_designs)
      ? (item.submitted_designs as any[]).map((d) => ({
          code: String(d.code || ""),
          shutterstockNo: String(d.shutterstock_no || d.shutterstockNo || ""),
          remark: String(d.remark || ""),
        }))
      : Array.isArray((item as any).submittedDesigns)
      ? (item as any).submittedDesigns
      : [],
    marketingDecision: (item.marketing_decision || (item as any).marketingDecision || null) as any,
    marketingDecisionRemarks: text(item.marketing_decision_remarks || (item as any).marketingDecisionRemarks) || undefined,
    selectedMockupDesigns: Array.isArray(item.selected_mockup_designs)
      ? (item.selected_mockup_designs as string[])
      : Array.isArray((item as any).selectedMockupDesigns)
      ? ((item as any).selectedMockupDesigns as string[])
      : [],
    mockupRequested: Boolean(item.mockup_requested || (item as any).mockupRequested),
  };
}

export async function fetchSampleRequestsApi(year?: string): Promise<SampleRequestItem[]> {
  try {
    const query = year && year.toUpperCase() !== "ALL" ? `?year=${encodeURIComponent(year)}` : "";
    const data = await apiFetch<ApiSampleRequest[]>(`/api/v1/sample-requests${query}`);
    return (data || []).map((item) => mapSampleRequest(item));
  } catch (err) {
    console.error("Error fetching sample requests:", err);
    return [];
  }
}

export async function fetchAllMarketingRequestsApi(year?: string): Promise<SampleRequestItem[]> {
  try {
    const [sampleRequests, designRequests, feasibilityRequests, programRequests] = await Promise.all([
      fetchSampleRequestsApi(year),
      fetchDesignRequestsApi().catch(() => []),
      fetchFeasibilityRequestsApi().catch(() => []),
      fetchProgramRequestsApi().catch(() => []),
    ]);

    const mappedDesignRequests = designRequests
      .map(mapDesignRequestToSampleRequest)
      .filter(
        (dr) =>
          !sampleRequests.some(
            (sr) =>
              (dr.materialCode && sr.materialCode && dr.materialCode === sr.materialCode) ||
              (dr.customer && sr.customer === dr.customer && dr.productDescription === sr.productDescription)
          )
      );

    let allItems = [
      ...sampleRequests,
      ...mappedDesignRequests,
      ...feasibilityRequests,
      ...programRequests,
    ];

    if (year && year.toUpperCase() !== "ALL") {
      allItems = allItems.filter((r) => {
        const itemYear = r.year && r.year.includes("-") ? r.year : getBusinessYearForDate(r.dateRequestCreated || r.createdAt);
        return itemYear === year;
      });
    }

    return allItems.sort((a, b) => {
      const da = new Date(a.createdAt || a.dateRequestCreated || 0).getTime();
      const db = new Date(b.createdAt || b.dateRequestCreated || 0).getTime();
      return db - da;
    });
  } catch (err) {
    console.error("Error fetching all marketing requests:", err);
    return [];
  }
}

export async function createSampleRequestApi(form: CreateSampleRequestForm): Promise<SampleRequestItem | null> {
  try {
    const rawYear = form.programYear || "2026";
    const selectedYear = String(rawYear).replace(/BTS/gi, "").trim() || "2026";
    const rawDate = form.dateRequestCreated || new Date().toISOString().split("T")[0];
    const calcBy = getBusinessYearForDate(rawDate);
    const itemYear = form.year && form.year.includes("-") ? form.year : calcBy;

    const payload = {
      sr_number: (form as any).srNumber || (form as any).sr_number || undefined,
      year: itemYear,
      program_year: selectedYear,
      program_name: form.programName ? form.programName.trim() : null,
      product_description: form.productDescription || form.programName || "Standard Notebook Specification",
      customer: form.customer || "",
      target_plant: form.targetPlant || null,
      date_request_created: form.dateRequestCreated || new Date().toISOString().split("T")[0],
      created_by: form.createdBy || "Admin",
      material_code: form.materialCode || "",
      barcode: form.barcode || null,
      customer_product_code: form.customerProductCode || null,
      source_sample_code: form.sourceSampleCode || null,
      sample_required_date: form.sampleRequiredDate || null,
      product_type: form.productType || null,
      brand_name: form.brandName || null,
      product_type_navneet: form.productTypeNavneet || null,
      product_type_new_customer: form.productTypeNewCustomer || null,
      unit_pc_pack: form.unitPcPack != null ? String(form.unitPcPack) : null,
      qty_for_sampling: form.qtyForSampling != null ? String(form.qtyForSampling) : null,
      qty_design_costing: form.qtyDesignCosting != null ? String(form.qtyDesignCosting) : null,
      mockup_required: form.mockupRequired || null,
      designs_customer_creative: form.designsCustomerCreative || null,
      product_artwork_nos: form.productArtworkNos != null ? String(form.productArtworkNos) : null,
      product_image_path: form.productImagePath || null,
      target_artwork_date_creative: form.targetArtworkDateCreative || null,
      target_artwork_date_studio: form.targetArtworkDateStudio || null,
      creation_mode: form.creationMode || "marketing_request",
      request_types: form.requestTypes || [],
      request_type_selected_at: form.requestTypeSelectedAt || {},
      custom_binding_1: form.customBinding1 || null,
      custom_binding_2: form.customBinding2 || null,
      custom_details: form.customDetails || null,
      status: form.status || "Draft (Pre-SMT)",
      source_sample_request_id: form.sourceRequestId,
      reference_images: form.referenceImages || [],
      reference_links: form.referenceLinks || [],
      plant_feasibility_response: form.plantFeasibilityResponse || null,
      plant_feasibility_remark: form.plantFeasibilityRemark || null,
      sampling_feasibility_response: form.samplingFeasibilityResponse || null,
      sampling_feasibility_remark: form.samplingFeasibilityRemark || null,
    };

    const resJson = await apiFetch<any>("/api/v1/sample-requests", {
      method: "POST",
      jsonBody: payload,
    });
    const itemData = resJson?.data && typeof resJson.data === "object" ? resJson.data : resJson;
    const mapped = mapSampleRequest(itemData, new Date().toISOString().split("T")[0]);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    }
    return mapped;
  } catch (err) {
    console.error("Error creating sample request:", err);
    return null;
  }
}

export async function createSampleRequestBatchApi(
  payload: BatchCreateSampleRequestPayload
): Promise<BatchCreateSampleRequestResponse | null> {
  try {
    const data = await apiFetch<any>("/api/v1/sample-requests/batch", {
      method: "POST",
      jsonBody: payload,
    });
    const fallbackDate = new Date().toISOString().split("T")[0];
    const mappedRequests: SampleRequestItem[] = (data.requests || []).map((item: ApiSampleRequest) =>
      mapSampleRequest(item, fallbackDate)
    );
    return {
      success: true,
      message: data.message,
      total_created: data.total_created,
      requests: mappedRequests,
    };
  } catch (err) {
    console.error("Error creating sample requests batch:", err);
    throw err;
  }
}

export interface UpdateSampleRequestPayload extends Partial<CreateSampleRequestForm> {
  status?: string;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
  sampling_feasibility_response?: string | null;
  sampling_feasibility_remark?: string | null;
  plant_feasibility_response?: string | null;
  plant_feasibility_remark?: string | null;
  feasibility_closed_at?: string | null;
  feasibility_closed_by?: string | null;
  product_description?: string;
}

export async function updateSampleRequestApi(
  id: number | string,
  payload: UpdateSampleRequestPayload
): Promise<SampleRequestItem | null> {
  try {
    const rawYear = payload.programYear;
    const selectedYear = rawYear ? String(rawYear).replace(/BTS/gi, "").trim() : undefined;
    const bodyPayload = {
      material_code: payload.materialCode,
      product_description: payload.productDescription,
      customer: payload.customer,
      program_name: payload.programName,
      program_year: selectedYear,
      target_plant: payload.targetPlant,
      barcode: payload.barcode,
      customer_product_code: payload.customerProductCode,
      sample_required_date: payload.sampleRequiredDate || null,
      brand_name: payload.brandName,
      product_type: payload.productType,
      unit_pc_pack: payload.unitPcPack != null ? String(payload.unitPcPack) : undefined,
      qty_for_sampling: payload.qtyForSampling != null ? String(payload.qtyForSampling) : undefined,
      qty_design_costing: payload.qtyDesignCosting != null ? String(payload.qtyDesignCosting) : undefined,
      mockup_required: payload.mockupRequired,
      designs_customer_creative: payload.designsCustomerCreative,
      product_artwork_nos: payload.productArtworkNos != null ? String(payload.productArtworkNos) : undefined,
      product_image_path: payload.productImagePath,
      creation_mode: payload.creationMode,
      request_types: payload.requestTypes,
      source_sample_code: payload.sourceSampleCode,
      status: payload.status,
      plant_feasibility_response: (payload as any).plantFeasibilityResponse ?? (payload as any).plant_feasibility_response,
      plant_feasibility_remark: (payload as any).plantFeasibilityRemark ?? (payload as any).plant_feasibility_remark,
      sampling_feasibility_response: (payload as any).samplingFeasibilityResponse ?? (payload as any).sampling_feasibility_response,
      sampling_feasibility_remark: (payload as any).samplingFeasibilityRemark ?? (payload as any).sampling_feasibility_remark,
      feasibility_closed_at: (payload as any).feasibilityClosedAt ?? (payload as any).feasibility_closed_at,
      feasibility_closed_by: (payload as any).feasibilityClosedBy ?? (payload as any).feasibility_closed_by,
    };

    const data: ApiSampleRequest = await apiFetch(`/api/v1/sample-requests/${id}`, {
      method: "PATCH",
      jsonBody: bodyPayload,
    });
    return mapSampleRequest(data, new Date().toISOString().split("T")[0]);
  } catch (err) {
    console.error(`Error updating sample request ${id}:`, err);
    throw err;
  }
}

export async function batchUpdateStatusApi(
  ids: (number | string)[],
  status: string
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    return await apiFetch("/api/v1/sample-requests/batch-status", {
      method: "POST",
      jsonBody: {
        sample_request_ids: numericIds,
        status,
      },
    });
  } catch (err) {
    console.error("Error batch updating status:", err);
    throw err;
  }
}

export async function deleteSampleRequestApi(id: number | string): Promise<boolean> {
  const cleanId = String(id).replace(/^sample-/, "");
  try {
    await apiFetch(`/api/v1/sample-requests/${cleanId}`, { method: "DELETE" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    }
    return true;
  } catch (err) {
    console.error("Error deleting sample request:", err);
    return false;
  }
}

export async function deleteAnyRequestApi(
  request: SampleRequestItem | { id: string | number; requestKind?: string; creationMode?: string; srNumber?: string }
): Promise<boolean> {
  const idStr = String(request.id || "");
  const track = getRequestTrackType(request as any);

  let success = false;
  if (track === "program_planning" || idStr.startsWith("program-")) {
    success = await deleteProgramRequestApi(idStr);
  } else if (track === "feasibility_check" || idStr.startsWith("feasibility-")) {
    success = await deleteFeasibilityRequestApi(idStr);
  } else if (idStr.startsWith("design-") || (request as any).requestKind === "design") {
    const rawId = idStr.replace(/^design-/, "");
    const numId = Number(rawId);
    if (!isNaN(numId)) {
      await deleteDesignRequestApi(numId).catch(() => false);
    }
    success = await deleteSampleRequestApi(request.id);
  } else {
    success = await deleteSampleRequestApi(request.id);
  }

  if (success && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return success;
}

export async function batchDeleteSampleRequestsApi(ids: (number | string)[]): Promise<boolean> {
  try {
    const results = await Promise.all(ids.map((id) => deleteSampleRequestApi(id)));
    return results.every(Boolean);
  } catch (err) {
    console.error("Error batch deleting sample requests:", err);
    return false;
  }
}

export async function batchDeleteAnyRequestsApi(requests: SampleRequestItem[]): Promise<boolean> {
  try {
    const results = await Promise.all(requests.map((req) => deleteAnyRequestApi(req)));
    return results.every(Boolean);
  } catch (err) {
    console.error("Error batch deleting requests:", err);
    return false;
  }
}

export async function submitCreativeOutputApi(
  id: number | string,
  payload: {
    folder_path: string;
    submitted_designs_count: number;
    submitted_designs: Array<{ code: string; shutterstockNo?: string; shutterstock_no?: string; remark: string }>;
  }
): Promise<any> {
  const numericId = typeof id === "string" ? parseInt(id.replace("design-", ""), 10) : id;
  const normalizedDesigns = payload.submitted_designs.map((d) => ({
    code: d.code,
    shutterstock_no: (d as any).shutterstock_no || (d as any).shutterstockNo || "",
    remark: d.remark || "",
  }));
  const res = await apiFetch<any>(`/api/v1/design-requests/${numericId}/submit-output`, {
    method: "POST",
    jsonBody: {
      folder_path: payload.folder_path,
      submitted_designs_count: payload.submitted_designs_count,
      submitted_designs: normalizedDesigns,
    },
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return res;
}

export async function recordDesignMarketingDecisionApi(
  id: number | string,
  payload: {
    decision: "Accepted" | "Revisions_Requested";
    remarks?: string;
  }
): Promise<any> {
  const numericId = typeof id === "string" ? parseInt(id.replace("design-", ""), 10) : id;
  const res = await apiFetch<any>(`/api/v1/design-requests/${numericId}/marketing-decision`, {
    method: "POST",
    jsonBody: payload,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return res;
}

export async function requestDesignMockupApi(
  id: number | string,
  payload: {
    selected_designs: string[];
  }
): Promise<any> {
  const numericId = typeof id === "string" ? parseInt(id.replace("design-", ""), 10) : id;
  const res = await apiFetch<any>(`/api/v1/design-requests/${numericId}/request-mockup`, {
    method: "POST",
    jsonBody: payload,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return res;
}
