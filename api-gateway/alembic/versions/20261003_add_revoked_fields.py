"""adiciona campos revoked na tabela documents

Revision ID: add_revoked_fields
Revises: 
Data de Criação: 2026-05-30 10:25:00.000

"""
from alembic import op
import sqlalchemy as sa

# identificadores da migration
revision = 'add_revoked_fields'
down_revision = None  
branch_labels = None
depends_on = None

def upgrade():
    # Adiciona as  colunas novas na tabela documents
    op.add_column('documents', sa.Column('revoked', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('documents', sa.Column('revoked_at', sa.DateTime(), nullable=True))
    op.add_column('documents', sa.Column('revoked_reason', sa.String(255), nullable=True))

def downgrade():
    
    op.drop_column('documents', 'revoked_reason')
    op.drop_column('documents', 'revoked_at')
    op.drop_column('documents', 'revoked')
