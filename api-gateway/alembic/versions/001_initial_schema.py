"""
TXEKA NTIYISO API - INITIAL SCHEMA
PK String(100) em institutions.
Revision ID: 001
"""

from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'institutions',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('api_key_hash', sa.String(255), nullable=False),
        sa.Column('subscription_plan', sa.String(50), nullable=False, server_default='free'),
        sa.Column('subscription_active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('credits', sa.Integer(), nullable=False, server_default='80'),
        sa.Column('docs_emitted_month', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revocation_reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_institutions')),
        sa.UniqueConstraint('name', name=op.f('uq_institutions_name')),
        sa.CheckConstraint("status IN ('active', 'inactive', 'suspended', 'revoked')", name='ck_institutions_status'),
        sa.CheckConstraint('credits >= 0', name='ck_institutions_credits_non_negative'),
        sa.CheckConstraint('docs_emitted_month >= 0', name='ck_institutions_docs_non_negative'),
    )

    op.create_index(op.f('ix_institutions_name'), 'institutions', ['name'], unique=False)
    op.create_index(op.f('ix_institutions_status'), 'institutions', ['status'], unique=False)
    op.create_index(op.f('ix_institutions_created_at'), 'institutions', ['created_at'], unique=False)
    op.create_index('ix_institutions_name_status', 'institutions', ['name', 'status'], unique=False)

    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('doc_id', sa.String(100), nullable=False),
        sa.Column('doc_hash', sa.String(64), nullable=False),
        sa.Column('document_type', sa.String(50), nullable=False),
        sa.Column('institution_id', sa.String(100), nullable=False),
        sa.Column('certificate_url', sa.String(255), nullable=True),
        sa.Column('qr_code', sa.Text(), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('issued_by', sa.String(100), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_reason', sa.String(500), nullable=True),
        sa.Column('revoked_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_documents')),
        sa.UniqueConstraint('doc_id', name=op.f('uq_documents_doc_id')),
        sa.UniqueConstraint('doc_hash', name=op.f('uq_documents_doc_hash')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], name=op.f('fk_documents_institution_id_institutions'), ondelete='CASCADE'),
        sa.CheckConstraint('file_size >= 0', name='ck_documents_file_size_positive'),
    )

    op.create_index(op.f('ix_documents_doc_id'), 'documents', ['doc_id'], unique=False)
    op.create_index(op.f('ix_documents_doc_hash'), 'documents', ['doc_hash'], unique=False)
    op.create_index(op.f('ix_documents_institution_id'), 'documents', ['institution_id'], unique=False)
    op.create_index(op.f('ix_documents_revoked'), 'documents', ['revoked'], unique=False)
    op.create_index(op.f('ix_documents_created_at'), 'documents', ['created_at'], unique=False)
    op.create_index('ix_documents_hash_institution', 'documents', ['doc_hash', 'institution_id'], unique=False)
    op.create_index('ix_documents_institution_revoked', 'documents', ['institution_id', 'revoked'], unique=False)


def downgrade() -> None:
    op.drop_table('documents')
    op.drop_table('institutions')
