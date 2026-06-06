"""create institutions table

Revision ID: 001
Revises: 
Create Date: 2026-06-06

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('institutions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(200), nullable=False, unique=True),
        sa.Column('api_key_hash', sa.String(255), nullable=False),
        sa.Column('subscription_active', sa.Boolean(), default=False),
        sa.Column('subscription_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('revoked_at', sa.DateTime(), nullable=True)
    )

def downgrade():
    op.drop_table('institutions')
