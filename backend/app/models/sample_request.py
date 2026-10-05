"""
SQLAlchemy database models for Marketing Sample Requests, Product Characteristics, and Product Details.
Tables copied from samp_eco_db into navneet_samp with full schema fidelity and data.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CreateSampleRequest(Base):
    """
    Core marketing sample request entity (table: create_sample_requests).
    Contains sample request metadata, scheduling dates, deliverable scopes, and workflow status.
    """

    __tablename__ = "create_sample_requests"

    id = Column(Integer, primary_key=True, index=True)
    sr_number = Column(String(50), nullable=False, unique=True, index=True)
    year = Column(String(50), nullable=False)
    product_description = Column(Text, nullable=False)
    customer = Column(String(150), nullable=False, index=True)
    target_plant = Column(String(100), nullable=True)
    date_request_created = Column(String(50), nullable=False)
    created_by = Column(String(100), nullable=False)
    material_code = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now(), onupdate=lambda: datetime.now(timezone.utc))

    program_year = Column(String(50), nullable=True)
    program_name = Column(String(150), nullable=True)
    source_sample_code = Column(String(100), nullable=True, index=True)
    creation_mode = Column(String(30), nullable=False, default="material_code", server_default="material_code")
    barcode = Column(String(100), nullable=True)
    sample_required_date = Column(Date, nullable=True)
    product_type = Column(String(100), nullable=True)
    customer_product_code = Column(String(100), nullable=True)
    brand_name = Column(String(150), nullable=True)
    product_type_navneet = Column(String(150), nullable=True)
    product_type_new_customer = Column(String(150), nullable=True)
    unit_pc_pack = Column(String(50), nullable=True)
    qty_for_sampling = Column(String(50), nullable=True)
    qty_design_costing = Column(String(50), nullable=True)
    mockup_required = Column(String(50), nullable=True)
    designs_customer_creative = Column(String(100), nullable=True)
    product_artwork_nos = Column(String(100), nullable=True)
    product_image_path = Column(Text, nullable=True)
    target_artwork_date_creative = Column(String(50), nullable=True)
    target_artwork_date_studio = Column(String(50), nullable=True)
    request_types = Column(JSONB, nullable=False, default=list, server_default="[]")
    folder_path = Column(Text, nullable=True)
    submitted_designs_count = Column(Integer, nullable=True, default=0)
    submitted_designs = Column(JSONB, nullable=False, default=list, server_default="[]")
    marketing_decision = Column(String(50), nullable=True)
    marketing_decision_remarks = Column(Text, nullable=True)
    selected_mockup_designs = Column(JSONB, nullable=False, default=list, server_default="[]")
    mockup_requested = Column(Boolean, nullable=False, default=False)

    # Relationship to product characteristics details
    product_details = relationship(
        "ProductDetail",
        back_populates="sample_request",
        cascade="all, delete-orphan",
        order_by="ProductDetail.id",
    )


class ProductCharacteristic(Base):
    """
    Master catalog of product characteristic definitions (classes, names, sequences, UOMs, and options).
    """

    __tablename__ = "product_characteristics"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False, index=True)
    characteristic_name = Column(String(150), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    uom = Column(String(50), nullable=True)
    options = Column(JSONB, nullable=False, default=list, server_default="[]")
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class ProductDetail(Base):
    """
    EAV (Entity-Attribute-Value) detail row specifying a product characteristic value for a sample request.
    """

    __tablename__ = "product_details"

    id = Column(Integer, primary_key=True, index=True)
    sample_request_id = Column(
        Integer,
        ForeignKey("create_sample_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    class_name = Column(String(100), nullable=False, index=True)
    characteristic_name = Column(String(150), nullable=False, index=True)
    value = Column(Text, nullable=True)
    uom = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    sample_request = relationship("CreateSampleRequest", back_populates="product_details")


class DesignRequest(Base):
    """
    Creative Design Request entity (table: design_requests).
    Manages creative brief, trend, audience, artwork variants, reference moodboards, and design schedules.
    """

    __tablename__ = "design_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), nullable=False, unique=True, index=True)
    sr_number = Column(String(50), nullable=True, index=True)
    customer_name = Column(String(150), nullable=False, index=True)
    program_name = Column(String(150), nullable=True)
    program_year = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="Draft (Pre-SMT)")
    number_of_designs = Column(Integer, nullable=False, default=1)
    trend = Column(String(200), nullable=True)
    target_audience = Column(String(200), nullable=True)
    reference_image = Column(Text, nullable=True)
    product_description = Column(Text, nullable=False, default="Creative Design Brief")
    design_required_date = Column(String(50), nullable=True)
    created_by = Column(String(100), nullable=False, default="Marketing Specialist")

    folder_path = Column(Text, nullable=True)
    submitted_designs_count = Column(Integer, nullable=True, default=0)
    submitted_designs = Column(JSONB, nullable=False, default=list, server_default="[]")
    marketing_decision = Column(String(50), nullable=True)
    marketing_decision_remarks = Column(Text, nullable=True)
    selected_mockup_designs = Column(JSONB, nullable=False, default=list, server_default="[]")
    mockup_requested = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default=func.now(), onupdate=lambda: datetime.now(timezone.utc))
