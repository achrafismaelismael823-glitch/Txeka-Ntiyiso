"""add_file_name_and_size_to_documents

Revision ID: dbbb845a2387
Revises: 20260603
Create Date: 2026-06-14 21:31:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'dbbb845a2387'
down_revision = '20260603'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('file_name', sa.String(), nullable=True))
    op.add_column('documents', sa.Column('file_size', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'file_size')
    op.drop_column('documents', 'file_name')
