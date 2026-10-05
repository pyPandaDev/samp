"""
Sample requests and operational flow routers.
Provides endpoints for sample requests, design requests, and cross-desk downstream tasks
(studio dielines, creative briefs, costing estimations, product characteristics).
Delegates domain persistence to SampleRequestService, DesignRequestService, and Repositories.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sample_request import ProductCharacteristic, ProductDetail
from app.services.sample_request_service import SampleRequestService
from app.services.design_request_service import DesignRequestService
from app.utils.business_year import get_current_business_year

router = APIRouter(tags=["Sample Requests & Operations"])


def get_sample_request_service(db: Session = Depends(get_db)) -> SampleRequestService:
    return SampleRequestService(db)


def get_design_request_service(db: Session = Depends(get_db)) -> DesignRequestService:
    return DesignRequestService(db)


# ---------------------------------------------------------------------------
# Business Years Metadata
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests/business-years", summary="Get available business years and summary")
@router.get("/api/sample-requests/business-years", summary="Get available business years and summary (legacy alias)")
def get_business_years(service: SampleRequestService = Depends(get_sample_request_service)):
    return service.get_business_years_summary()


# ---------------------------------------------------------------------------
# Sample Requests (/api/v1/sample-requests and legacy alias /api/sample-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/sample-requests", response_model=List[Dict[str, Any]], summary="List sample requests with filters")
@router.get("/api/sample-requests", response_model=List[Dict[str, Any]], summary="List sample requests (legacy alias)")
def list_sample_requests(
    year: Optional[str] = None,
    customer: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    effective_status = status or stage
    return service.list_requests(year=year, customer=customer, status=effective_status)


@router.get("/api/v1/sample-requests/search-materials", summary="Search products by material code")
def search_materials_get(
    query: Optional[str] = None,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    return service.search_materials(query or "")


@router.get("/api/v1/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request by ID or SR Number")
@router.get("/api/sample-requests/{id}", response_model=Dict[str, Any], summary="Get sample request (legacy alias)")
def get_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if not req:
            raise HTTPException(status_code=404, detail="Sample request not found")
        num_id = req.id

    result = service.get_by_id(num_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sample request not found")
    return result


@router.post("/api/v1/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request")
@router.post("/api/sample-requests", status_code=status.HTTP_201_CREATED, summary="Create a single sample request (legacy alias)")
async def create_sample_request(
    request: Request,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    created = service.create(payload)

    # Sync to design requests if request involves design
    request_types = payload.get("request_types") or []
    if "design" in request_types:
        design_service.sync_sample_request(created)

    return {"success": True, "message": "Sample request created successfully", "data": created}


@router.post("/api/v1/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests")
@router.post("/api/sample-requests/batch", status_code=status.HTTP_201_CREATED, summary="Batch create multiple sample requests (legacy alias)")
async def create_sample_requests_batch(
    request: Request,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # Accept both the established `requests` shape and the staging workspace's
    # grouped `items` shape. Group-level context is copied onto each product.
    items = body.get("requests") or body.get("items", [])
    if not items or not isinstance(items, list):
        raise HTTPException(status_code=422, detail="Expected 'requests' or 'items' array in payload")

    shared_fields = {
        key: value for key, value in body.items() if key not in {"requests", "items"}
    }
    normalized_items = [
        {**shared_fields, **item} for item in items if isinstance(item, dict)
    ]
    if len(normalized_items) != len(items):
        raise HTTPException(status_code=422, detail="Every batch item must be an object")

    created_results = service.batch_create(normalized_items)

    # Sync any design-scoped items
    for item in created_results:
        req_types = item.get("request_types") or []
        if "design" in req_types:
            design_service.sync_sample_request(item)

    return {
        "success": True,
        "count": len(created_results),
        "results": created_results,
    }


@router.post("/api/v1/sample-requests/search-materials", summary="Search products by material code")
async def search_materials_post(
    request: Request,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    try:
        body = await request.json()
        query = body.get("query", "")
    except Exception:
        query = ""
    return service.search_materials(query)


@router.patch("/api/v1/sample-requests/{id}", summary="Update sample request")
@router.patch("/api/sample-requests/{id}", summary="Update sample request (legacy alias)")
async def update_sample_request(
    id: str,
    request: Request,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if not num_id:
        raise HTTPException(status_code=404, detail="Sample request not found")

    updated = service.update(num_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Sample request not found")

    # Sync status to design requests if present
    if "status" in body:
        design_service.sync_sample_request(updated)

    return updated


@router.post("/api/v1/sample-requests/batch-status", summary="Batch update status")
async def batch_update_status(
    request: Request,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    ids = body.get("sample_request_ids", [])
    new_status = body.get("status")
    if not ids or not new_status:
        raise HTTPException(status_code=422, detail="Missing required parameters")

    numeric_ids = [int(i) for i in ids if str(i).isdigit()]
    updated_count = service.batch_update_status(numeric_ids, new_status)
    return {"success": True, "updated_count": updated_count}


@router.delete("/api/v1/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request")
@router.delete("/api/sample-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete sample request (legacy alias)")
def delete_sample_request(
    id: str,
    service: SampleRequestService = Depends(get_sample_request_service),
    design_service: DesignRequestService = Depends(get_design_request_service),
):
    num_id = int(id) if id.isdigit() else None
    if not num_id:
        req = service.repo.get_by_sr_number(id)
        if req:
            num_id = req.id

    if num_id:
        existing = service.get_by_id(num_id)
        if existing:
            design_service.sync_sample_request(existing, is_delete=True)
        service.delete(num_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Design Requests (/api/v1/design-requests)
# ---------------------------------------------------------------------------

@router.get("/api/v1/design-requests", response_model=List[Dict[str, Any]], summary="List design requests")
def list_design_requests(service: DesignRequestService = Depends(get_design_request_service)):
    return service.list_all()


@router.post("/api/v1/design-requests", status_code=status.HTTP_201_CREATED, summary="Create design request")
async def create_design_request(
    request: Request,
    service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        body = {}

    return service.create(body)


@router.get("/api/v1/design-requests/{id}", response_model=Dict[str, Any], summary="Get design request")
def get_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
):
    record = service.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.patch("/api/v1/design-requests/{id}", summary="Update design request")
async def update_design_request(
    id: int,
    request: Request,
    service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        body = {}

    record = service.update(id, body)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return record


@router.post("/api/v1/design-requests/{id}/submit-output", summary="Submit creative output with folder path and design breakdown")
async def submit_creative_output(
    id: int,
    request: Request,
    service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    folder_path = body.get("folder_path") or ""
    submitted_designs_count = int(body.get("submitted_designs_count", 0))
    submitted_designs = body.get("submitted_designs", [])

    record = service.submit_creative_output(
        item_id=id,
        folder_path=folder_path,
        submitted_designs_count=submitted_designs_count,
        submitted_designs=submitted_designs,
    )
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return {"success": True, "data": record}


@router.post("/api/v1/design-requests/{id}/marketing-decision", summary="Marketing decision on submitted designs (Accept or Request Remaining)")
async def record_marketing_decision(
    id: int,
    request: Request,
    service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    decision = body.get("decision")
    if not decision:
        raise HTTPException(status_code=422, detail="Decision is required ('Accepted' or 'Revisions_Requested')")

    remarks = body.get("remarks")
    record = service.record_marketing_decision(item_id=id, decision=decision, remarks=remarks)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return {"success": True, "data": record}


@router.post("/api/v1/design-requests/{id}/request-mockup", summary="Request CAD Mockup for selected designs")
async def request_mockup(
    id: int,
    request: Request,
    service: DesignRequestService = Depends(get_design_request_service),
):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    selected_designs = body.get("selected_designs", [])
    if not selected_designs or not isinstance(selected_designs, list):
        raise HTTPException(status_code=422, detail="selected_designs must be a non-empty array of design codes (e.g. ['D1', 'D3'])")

    record = service.request_mockup(item_id=id, selected_designs=selected_designs)
    if not record:
        raise HTTPException(status_code=404, detail="Design request not found")
    return {"success": True, "data": record}


@router.delete("/api/v1/design-requests/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete design request")
def delete_design_request(
    id: int,
    service: DesignRequestService = Depends(get_design_request_service),
):
    service.delete(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Downstream Cross-Desk Task Stubs
# ---------------------------------------------------------------------------

@router.get("/api/v1/creative/briefs", response_model=List[Dict[str, Any]], summary="List creative briefs")
def list_creative_briefs():
    return []


@router.patch("/api/v1/creative/briefs/{id}", summary="Update creative brief")
async def update_creative_brief(id: str, request: Request):
    return {"id": id, "success": True}


@router.get("/api/v1/studio/dielines", response_model=List[Dict[str, Any]], summary="List studio dielines")
def list_studio_dielines(db: Session = Depends(get_db)):
    from app.models.sample_request import DesignRequest
    items: List[Dict[str, Any]] = []
    try:
        records = db.query(DesignRequest).filter(DesignRequest.mockup_requested.is_(True)).all()
        for r in records:
            designs = r.selected_mockup_designs or []
            design_str = ", ".join(designs) if isinstance(designs, list) else str(designs)
            items.append({
                "id": f"dl-mockup-{r.id}",
                "dielineCode": f"DL-26-MOCK-{r.id:03d}",
                "srNumber": r.sr_number or f"SR-26-{r.id:04d}",
                "boxFormat": "Folding Carton",
                "title": f"{r.product_description or 'Packaging'} (CAD Mockups: {design_str})",
                "client": r.customer_name or "Customer",
                "dimensions": "210 × 148 × 25 mm",
                "substrate": "350 GSM Cyber Xpack FBB",
                "caliperMicrons": 450,
                "machineCompatibility": "Kongsberg Sample Table",
                "status": "CAD Intake",
                "dueDate": str(r.design_required_date) if r.design_required_date else "2026-11-01",
                "targetPlant": "1505- Khaniwade",
                "grainDirection": "Parallel to Spine",
                "fileFormats": [".DXF", ".PDF"],
                "selectedDesigns": designs if isinstance(designs, list) else [],
                "folderPath": r.folder_path or "",
            })
    except Exception:
        pass
    return items


@router.patch("/api/v1/studio/dielines/{id}", summary="Update studio dieline")
async def update_studio_dieline(id: str, request: Request):
    return {"id": id, "success": True}


@router.get("/api/v1/costing/estimations", response_model=List[Dict[str, Any]], summary="List costing estimations")
def list_costing_estimations():
    return []


@router.patch("/api/v1/costing/estimations/{id}", summary="Update costing estimation")
async def update_costing_estimation(id: str, request: Request):
    return {"id": id, "success": True}


# ---------------------------------------------------------------------------
# Product Characteristics (/api/v1/product-characteristics)
# ---------------------------------------------------------------------------

@router.get("/api/v1/product-characteristics/classes", summary="List product characteristic classes")
def list_characteristic_classes():
    return []


@router.get("/api/v1/product-characteristics/binding-hierarchy", summary="Get binding hierarchy")
def get_binding_hierarchy(db: Session = Depends(get_db)):
    b1_char = db.query(ProductCharacteristic).filter(ProductCharacteristic.characteristic_name == "BINDINGTYPE1").first()
    b2_char = db.query(ProductCharacteristic).filter(ProductCharacteristic.characteristic_name == "BINDINGTYPE2").first()
    b1_opts = b1_char.options if b1_char and b1_char.options else []
    b2_opts = b2_char.options if b2_char and b2_char.options else []
    binding_rows = db.query(
        ProductDetail.sample_request_id,
        ProductDetail.characteristic_name,
        ProductDetail.value,
    ).all()
    products_by_request: Dict[int, Dict[str, str]] = {}
    for request_id, characteristic_name, value in binding_rows:
        normalized = "".join(character for character in str(characteristic_name or "").upper() if character.isalnum())
        if not value:
            continue
        product_bindings = products_by_request.setdefault(request_id, {})
        if normalized in {"BINDINGTYPE1", "BINDING1"}:
            product_bindings["binding1"] = str(value).strip()
        elif normalized in {"BINDINGTYPE2", "BINDING2"}:
            product_bindings["binding2"] = str(value).strip()

    b1_values = [bindings["binding1"] for bindings in products_by_request.values() if bindings.get("binding1")]
    b2_values = [bindings["binding2"] for bindings in products_by_request.values() if bindings.get("binding2")]
    b1_cleaned = sorted({str(value).strip() for value in [*b1_opts, *b1_values] if value and str(value).strip()})
    b2_cleaned = sorted({str(value).strip() for value in [*b2_opts, *b2_values] if value and str(value).strip()})

    hierarchy: Dict[str, List[str]] = {}
    for binding1 in b1_cleaned:
        matching_binding2 = {
            bindings["binding2"]
            for bindings in products_by_request.values()
            if bindings.get("binding1", "").casefold() == binding1.casefold() and bindings.get("binding2")
        }
        hierarchy[binding1] = sorted(matching_binding2) or b2_cleaned

    return {
        "binding1_options": b1_cleaned,
        "binding2_options": b2_cleaned,
        "hierarchy": hierarchy,
    }


@router.get("/api/v1/product-characteristics/filter-by-binding", summary="Search saved products by binding")
def search_products_by_binding(
    b1: str,
    b2: Optional[str] = None,
    limit: int = 50,
    service: SampleRequestService = Depends(get_sample_request_service),
):
    if not b1.strip():
        raise HTTPException(status_code=422, detail="Binding 1 is required")
    return service.search_products_by_binding(b1, b2, limit)
