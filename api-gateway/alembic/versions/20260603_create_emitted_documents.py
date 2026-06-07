"""cria tabela emitted_documents

Revision ID: 20260603_create_emitted_documents
Revises: 
Data de Criação: 2026-06-03 10:25:00.000
"""
from alembic import op
import sqlalchemy as sa

revision = '20260603'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'emitted_documents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('doc_id', sa.String(64), nullable=False),
        sa.Column('doc_hash', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('institution_id', sa.String(64), nullable=False, index=True),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('status', sa.String(20), nullable=False, server_default='active', index=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revocation_reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'), index=True)
    )
    
    op.create_index('ix_emitted_docs_hash', 'emitted_documents', ['doc_hash'])
    op.create_index('ix_emitted_docs_institution', 'emitted_documents', ['institution_id'])
    op.create_index('ix_emitted_docs_status', 'emitted_documents', ['status'])
    op.create_index('ix_emitted_docs_created', 'emitted_documents', ['created_at'])

def downgrade():
    op.drop_table('emitted_documents')
