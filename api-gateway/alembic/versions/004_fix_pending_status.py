"""fix pending status constraint

Revision ID: 004_fix_pending_status
Revises: 003_add_institutions_and_credits
Create Date: 2026-07-16 01:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '004_fix_pending_status'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Atualizar check constraint para aceitar "pending"
    op.drop_constraint('ck_institutions_status', 'institutions', type_='check')
    op.create_check_constraint(
        'ck_institutions_status',
        'institutions',
        sa.text("status IN ('pending', 'active', 'suspended', 'inactive')")
    )


def downgrade() -> None:
    # Reverter para constraint antiga (sem "pending")
    op.drop_constraint('ck_institutions_status', 'institutions', type_='check')
    op.create_check_constraint(
        'ck_institutions_status',
        'institutions',
        sa.text("status IN ('active', 'suspended', 'inactive')")
    )
