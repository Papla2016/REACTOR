"""create tables

Revision ID: 0001
Revises: 
Create Date: 2024-09-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("role", sa.Enum("PATIENT", "DOCTOR", name="userrole"), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("oauth_provider", sa.String(length=50), nullable=True),
        sa.Column("oauth_subject", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "medical_cases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("patient_name", sa.String(length=255), nullable=False),
        sa.Column("doctor_name", sa.String(length=255), nullable=False),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("disease", sa.String(length=255), nullable=False),
        sa.Column("direction", sa.String(length=255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("analysis_result", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "case_texts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("medical_cases.id"), unique=True),
        sa.Column("masked_text", sa.Text(), nullable=False),
    )

    op.create_table(
        "markers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("medical_cases.id")),
        sa.Column("marker", sa.String(length=50), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("original_value", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("markers")
    op.drop_table("case_texts")
    op.drop_table("medical_cases")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE userrole")
