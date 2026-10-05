"""
Creative Design Request Service.
Encapsulates business operations for Creative Design Requests, artwork variant counts,
and workflow status transitions.
"""
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.design_request_repo import DesignRequestRepository


class DesignRequestService:
    """Application service for Creative Design Requests."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = DesignRequestRepository(db)

    def list_all(self) -> List[Dict[str, Any]]:
        """List all design requests."""
        return self.repo.list_all_records()

    def get_by_id(self, item_id: int) -> Optional[Dict[str, Any]]:
        """Fetch design request by ID."""
        return self.repo.get_record_by_id(item_id)

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new creative design request."""
        return self.repo.create_record(data)

    def update(self, item_id: int, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update creative design request fields."""
        return self.repo.update_record(item_id, updates)

    def delete(self, item_id: int) -> bool:
        """Delete creative design request."""
        return self.repo.delete_record(item_id)

    def sync_sample_request(self, sample_req: Dict[str, Any], is_delete: bool = False):
        """Sync design request from sample request creation/deletion."""
        self.repo.sync_sample_request_design(sample_req, is_delete=is_delete)

    def submit_creative_output(
        self,
        item_id: int,
        folder_path: str,
        submitted_designs_count: int,
        submitted_designs: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Submit output from Creative Desk with folder path and D1..Dn design details."""
        updates = {
            "folder_path": folder_path,
            "submitted_designs_count": submitted_designs_count,
            "submitted_designs": submitted_designs,
            "status": "Creative Output Submitted",
            "marketing_decision": None,
        }
        updated = self.repo.update_record(item_id, updates)

        # Also sync back to parent sample request if sr_number exists
        if updated and updated.get("sr_number"):
            from app.models.sample_request import CreateSampleRequest
            try:
                self.db.query(CreateSampleRequest).filter(
                    CreateSampleRequest.sr_number == updated["sr_number"]
                ).update({
                    "folder_path": folder_path,
                    "submitted_designs_count": submitted_designs_count,
                    "submitted_designs": submitted_designs,
                    "status": "Creative Output Submitted",
                }, synchronize_session=False)
                self.db.commit()
            except Exception:
                self.db.rollback()

        return updated

    def record_marketing_decision(
        self,
        item_id: int,
        decision: str,
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Record Marketing's decision: either Accept & Close or Request Remaining Designs."""
        new_status = "Design Approved" if decision.lower() in ("accepted", "accept", "approved") else "Revisions Requested"
        updates = {
            "marketing_decision": decision,
            "marketing_decision_remarks": remarks or "",
            "status": new_status,
        }
        updated = self.repo.update_record(item_id, updates)

        if updated and updated.get("sr_number"):
            from app.models.sample_request import CreateSampleRequest
            try:
                self.db.query(CreateSampleRequest).filter(
                    CreateSampleRequest.sr_number == updated["sr_number"]
                ).update({
                    "marketing_decision": decision,
                    "marketing_decision_remarks": remarks or "",
                    "status": new_status,
                }, synchronize_session=False)
                self.db.commit()
            except Exception:
                self.db.rollback()

        return updated

    def request_mockup(
        self,
        item_id: int,
        selected_designs: List[str],
    ) -> Optional[Dict[str, Any]]:
        """Record marketing's selection of designs to proceed to CAD/Mockup."""
        updates = {
            "selected_mockup_designs": selected_designs,
            "mockup_requested": True,
            "status": "Mockup In Progress (Studio)",
        }
        updated = self.repo.update_record(item_id, updates)

        if updated and updated.get("sr_number"):
            from app.models.sample_request import CreateSampleRequest
            try:
                self.db.query(CreateSampleRequest).filter(
                    CreateSampleRequest.sr_number == updated["sr_number"]
                ).update({
                    "selected_mockup_designs": selected_designs,
                    "mockup_requested": True,
                    "status": "Mockup In Progress (Studio)",
                }, synchronize_session=False)
                self.db.commit()
            except Exception:
                self.db.rollback()

        return updated
