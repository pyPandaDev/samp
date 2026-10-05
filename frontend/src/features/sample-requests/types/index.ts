export type SampleStatus =
  | "Draft (Pre-SMT)"
  | "Creative"
  | "Studio"
  | "SAMP"
  | "In Plant Work"
  | "Dispatched / Closed"
  | "Actual Deal"
  | "Draft (Pre-PMT)"
  | "Sampling Review (PMT)"
  | "Released"
  | "In Plant Execution"
  | "QC Inspection"
  | "Dispatched"
  | "Customer Review"
  | "Approved / Closed";

export interface SampleRequestItem {
  id: string;
  srNumber: string;
  year: string;
  productDescription: string;
  customer: string;
  targetPlant: string;
  dateRequestCreated: string;
  createdBy: string;
  materialCode: string;
  barcode?: string;
  customerProductCode?: string;
  sourceSampleCode?: string;
  sourceRequestId?: number;
  sourceSampleRequestId?: number;
  sampleRequiredDate?: string;
  productType?: string;
  productTypeNavneet?: string;
  productTypeNewCustomer?: string;
  productImagePath?: string;
  designsCustomerCreative?: string;
  brandName?: string;
  unitPcPack?: string | number;
  qtyDesignCosting?: string | number;
  productArtworkNos?: string | number;
  targetArtworkDateCreative?: string;
  targetArtworkDateStudio?: string;
  qtyForSampling?: string | number;
  mockupRequired?: string;
  status: SampleStatus | string;
  creationMode?: "material_code" | "binding" | string;
  programYear?: string;
  programName?: string;
  programCampaignTitle?: string;
  programMaterials?: ProgramMaterialItem[];
  requestTypes?: RequestType[];
  requestKind?: "sample" | "design" | "feasibility" | "program";
  designRequestId?: number;
  numberOfDesigns?: number;
  trend?: string | null;
  targetAudience?: string | null;
  referenceImage?: string | null;
  folderPath?: string;
  submittedDesignsCount?: number;
  submittedDesigns?: SubmittedDesignItem[];
  marketingDecisionRemarks?: string;
  selectedMockupDesigns?: string[];
  mockupRequested?: boolean;
  createdAt: string;
  updatedAt?: string;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  samplingFeasibilityApprovedBy?: string | null;
  samplingFeasibilityApprovedDate?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
  isRespondedOnTime?: boolean | null;
  marketingDecision?: "Accepted" | "Rejected" | "Revisions_Requested" | null;
  marketingDecisionBy?: string | null;
  marketingDecisionAt?: string | null;
  marketingDecisionRemark?: string | null;
  takenBySamp?: string | null;
  takenAtSamp?: string | null;
  convertedSampleRequestId?: number | string | null;
  convertedSrNumber?: string | null;
  convertedAt?: string | null;
  convertedBy?: string | null;
  activities?: (FeasibilityActivityItem | ProgramActivityItem)[];
  referenceImages?: string[];
  referenceImageNames?: string[];
  referenceLinks?: string[];
  descriptionNotes?: string;
  feasibilityType?: string;
  customFeasibilityType?: string | null;
  feasibilityDescription?: string;
  marketingRemarks?: string | null;
}

export interface FeasibilityActivityItem {
  id: number;
  feasibilityRequestId: number;
  actorId?: number | null;
  actorName: string;
  actorDepartment: string;
  action: "CREATED" | "VIEWED" | "TASK_CLAIMED" | "SAMP_EVALUATED" | "MARKETING_DECIDED" | "CONVERTED_TO_SAMPLING" | string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface FeasibilityRequestPayload {
  customer: string;
  feasibilityType: string;
  customFeasibilityType?: string | null;
  descriptionNotes: string;
  requiredDate: string;
  marketingRemarks?: string | null;
  referenceImages?: string[];
  referenceImageNames?: string[];
  referenceLinks?: string[];
}

export interface FeasibilitySampVerdictPayload {
  response: "Yes" | "No" | "Maybe";
  remark?: string | null;
}

export interface FeasibilityMarketingDecisionPayload {
  decision: "Accepted" | "Rejected";
  decision_remark?: string | null;
}

export interface FeasibilityRequestRecord extends FeasibilityRequestPayload {
  id: number;
  requestCode: string;
  srNumber: string;
  status: string;
  createdBy?: string | null;
  requestCreatedBy?: string | null;
  createdByUserId?: number | null;
  requestRaisedAt: string;
  updatedAt?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  samplingFeasibilityApprovedBy?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: string | null;
  isRespondedOnTime?: boolean | null;
  marketingDecision?: "Accepted" | "Rejected" | null;
  marketingDecisionBy?: string | null;
  marketingDecisionAt?: string | null;
  marketingDecisionRemark?: string | null;
  takenBySamp?: string | null;
  takenAtSamp?: string | null;
  convertedSampleRequestId?: number | string | null;
  convertedSrNumber?: string | null;
  convertedAt?: string | null;
  convertedBy?: string | null;
  activities?: (FeasibilityActivityItem | ProgramActivityItem)[];
  referenceImageNames?: string[];
}


export interface CreateSampleRequestForm {
  year?: string;
  programYear?: string;
  productDescription?: string;
  programName?: string;
  customer: string;
  targetPlant: string;
  materialCode?: string;
  barcode?: string;
  customerProductCode?: string;
  sourceSampleCode?: string;
  sampleRequiredDate?: string;
  productType?: string;
  brandName?: string;
  productTypeNavneet?: string;
  productTypeNewCustomer?: string;
  unitPcPack?: string | number;
  qtyDesignCosting?: string | number;
  productArtworkNos?: string | number;
  targetArtworkDateCreative?: string;
  targetArtworkDateStudio?: string;
  qtyForSampling?: string | number;
  mockupRequired?: string;
  designsCustomerCreative?: string;
  productImagePath?: string;
  dateRequestCreated?: string;
  createdBy?: string;
  status?: string;
  creationMode?: "material_code" | "binding" | string;
  sourceRequestId?: number;
  sourceSampleRequestId?: number;
  customBinding1?: string;
  customBinding2?: string;
  customDetails?: Array<{
    className: string;
    characteristicName: string;
    value: string | null;
    uom?: string | null;
  }>;
  requestTypes?: RequestType[];
  requestTypeSelectedAt?: RequestTypeSelectedAt;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
  referenceImages?: string[];
  referenceLinks?: string[];
}

export type RequestType = "design" | "mockup" | "sample" | "costing";

export type RequestTypeSelectedAt = Partial<Record<RequestType, string | null>>;

export interface BindingHierarchyResponse {
  binding1_options: string[];
  binding2_options?: string[];
  hierarchy: Record<string, string[]>;
}

export interface ProductSearchResult {
  id: number;
  sr_number: string;
  material_code: string;
  product_description: string;
  customer?: string;
  target_plant?: string;
  binding_type_1?: string;
  binding_type_2?: string;
  source_sample_code?: string;
  c1_caliper_weight?: string;
  c2_material_type?: string;
  c2_cover_finish?: string;
  details_count?: number;
}

export interface PlantItem {
  id: number;
  code: string;
  name: string;
  location?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantForm {
  code: string;
  name: string;
  location?: string;
  isActive?: boolean;
}

export interface CustomerItem {
  id: number;
  name: string;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StagedProductItem {
  id: string; // unique client id
  materialCode: string;
  sourceSampleCode?: string;
  productDescription: string;
  barcode?: string;
  customerProductCode?: string;
  productType?: string;
  sourceSampleRequestId?: number;
  sourceRequestId?: number;
  creationMode: "material_code" | "binding";
  bindingType1: string;
  bindingType2: string;
  originalBindingType1?: string;
  originalBindingType2?: string;
  isBindingEdited?: boolean;
  detailsCount?: number;
  customer?: string;
  targetPlant?: string;
  srNumber?: string;
  editedDetails?: Array<{
    id?: number;
    sampleRequestId?: number;
    className: string;
    characteristicName: string;
    value: string | null;
    uom?: string | null;
    options?: string[];
  }>;
  requestTypes?: RequestType[];
  requestTypeSelectedAt?: RequestTypeSelectedAt;
}

export interface BatchSampleRequestItemPayload {
  material_code: string;
  product_description?: string;
  barcode?: string | null;
  customer_product_code?: string | null;
  source_sample_code?: string | null;
  product_type?: string | null;
  source_sample_request_id?: number;
  creation_mode: "material_code" | "binding";
  custom_binding_1?: string | null;
  custom_binding_2?: string | null;
  custom_details?: Array<{
    class_name: string;
    characteristic_name: string;
    value: string | null;
    uom: string | null;
  }>;
  request_types?: RequestType[];
  request_type_selected_at?: RequestTypeSelectedAt;
}

export interface BatchCreateSampleRequestPayload {
  customer: string;
  program_name: string;
  program_year: string;
  target_plant?: string;
  created_by?: string;
  date_request_created?: string;
  sample_required_date?: string;
  items: BatchSampleRequestItemPayload[];
}

export interface BatchCreateSampleRequestResponse {
  success: boolean;
  message: string;
  total_created: number;
  requests: SampleRequestItem[];
}

export interface DesignRequest {
  id: number;
  srNumber?: string;
  requestCode?: string;
  customerName: string;
  programName: string;
  programYear: string;
  targetPlant?: string;
  numberOfDesigns: number;
  trend?: string | null;
  targetAudience?: string | null;
  referenceImage?: string | null;
  productDescription: string;
  designRequiredDate?: string | null;
  status: SampleStatus | string;
  createdBy: string;
  updatedBy: string;
  folderPath?: string;
  submittedDesignsCount?: number;
  submittedDesigns?: SubmittedDesignItem[];
  marketingDecision?: "Accepted" | "Revisions_Requested" | null;
  marketingDecisionRemarks?: string;
  selectedMockupDesigns?: string[];
  mockupRequested?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignRequestForm {
  customerName: string;
  programName: string;
  programYear: string;
  numberOfDesigns: string;
  trend: string;
  targetAudience: string;
  referenceImage: string;
  productDescription: string;
  designRequiredDate: string;
}

export interface DielineItem {
  id: string;
  dielineCode: string;
  srNumber: string;
  boxFormat: "Rigid Box" | "Folding Carton" | "Flute Corrugated" | "Blister / Sleeve";
  title: string;
  client: string;
  dimensions: string; // L x W x H mm
  substrate: string;
  caliperMicrons: number;
  machineCompatibility: string;
  status: "CAD Intake" | "Dieline Construction" | "3D Simulation" | "Plotter Sample Tested" | "Laser Die Cleared";
  dueDate: string;
  targetPlant: string;
  fluteGrade?: string;
  grainDirection: "Parallel to Spine" | "Perpendicular to Crease";
  fileFormats: string[];
  selectedDesigns?: string[];
  folderPath?: string;
}

export interface SubmittedDesignItem {
  code: string; // e.g. "D1", "D2"
  shutterstockNo: string;
  remark: string;
}

export interface CreativeBriefItem {
  id: string;
  artCode: string;
  srNumber: string;
  title: string;
  brand: string;
  category: "Notebook Covers" | "Rigid Packaging" | "Tin / Metal Containers" | "Stationery Packs";
  variantsCount: number;
  designer: string;
  colorSpecs: string;
  proofVersion: string;
  proofStatus: "Brief Intake" | "In Concept" | "Client Review" | "Revisions Requested" | "Prepress Approved" | "Creative Output Submitted" | "Design Approved";
  dueDate: string;
  dimensions: string;
  finishingNotes: string;
  cmykCheckPassed: boolean;
  resolutionDpi: number;
  bleedMm: number;
  clientFeedback?: string;
  accentColor: string;
  folderPath?: string;
  submittedDesignsCount?: number;
  submittedDesigns?: SubmittedDesignItem[];
  marketingDecision?: "Accepted" | "Revisions_Requested" | null;
  marketingDecisionRemarks?: string;
  selectedMockupDesigns?: string[];
  mockupRequested?: boolean;
}

export interface CostingItem {
  id: string;
  costingCode: string;
  srNumber: string;
  customer: string;
  productTitle: string;
  targetVolume: number; // in pcs
  substrateUnitCost: number; // INR
  conversionUnitCost: number; // INR
  netUnitCost: number; // substrate + conversion
  marginPct: number; // e.g. 24.5%
  quotedUnitPrice: number; // calculated from margin
  totalProjectValue: number; // targetVolume * quotedUnitPrice
  status: "Spec Review" | "Substrate Pricing" | "Margin Review" | "Quote Released" | "Won Deal";
  dueDate: string;
  targetPlant: string;
  substrateSpec: string;
}

export interface ProgramMaterialItem {
  id?: number | string;
  materialType?: string;
  supplierName?: string;
  grade?: string;
  colorVariant?: string;
  caliperWt?: string;
  quantity?: string;
  unit?: string;
  remark?: string;
  sampRemark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddProgramMaterialPayload {
  material_type?: string | null;
  supplier_name?: string | null;
  grade?: string | null;
  color_variant?: string | null;
  caliper_wt?: string | null;
  quantity?: string | null;
  unit?: string | null;
  remark?: string | null;
  samp_remark?: string | null;
}

export interface ProgramActivityItem {
  id: number;
  programRequestId: number;
  actorId?: number | null;
  actorName: string;
  actorDepartment: string;
  action: "CREATED" | "NOTE_POSTED" | "STATUS_UPDATED" | "MATERIAL_ADDED" | "MATERIAL_DELETED" | "SAMP_REMARK_UPDATED" | "SAMP_REMARKS_UPDATED" | "UPDATED" | string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface ProgramRequestRecord {
  id: number;
  requestCode: string;
  srNumber: string;
  customerName: string;
  targetPlant: string;
  programCampaignTitle: string;
  programYear: string;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  materials: ProgramMaterialItem[];
  activities?: ProgramActivityItem[];
}


export interface CreateProgramRequestPayload {
  customer_name: string;
  target_plant: string;
  program_campaign_title: string;
  program_year: string;
  created_by?: string | null;
  materials: Array<{
    material_type?: string | null;
    supplier_name?: string | null;
    grade?: string | null;
    color_variant?: string | null;
    caliper_wt?: string | null;
    quantity?: string | null;
    unit?: string | null;
    remark?: string | null;
    samp_remark?: string | null;
  }>;
}

