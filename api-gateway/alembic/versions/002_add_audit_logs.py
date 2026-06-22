"""
Add audit_logs table and audit columns to documents
Legal compliance: Decreto 59/2019, Lei 3/2017

Revision ID: 002
Revises: 001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar colunas de auditoria em documents
    op.add_column('documents', sa.Column('emitted_by', sa.String(255), nullable=True))
    op.add_column('documents', sa.Column('emitted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('documents', sa.Column('emitted_from_ip', sa.String(45), nullable=True))
    op.add_column('documents', sa.Column('last_verified_by', sa.String(255), nullable=True))
    op.add_column('documents', sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('documents', sa.Column('last_verified_from_ip', sa.String(45), nullable=True))
    op.add_column('documents', sa.Column('verify_count', sa.Integer(), nullable=False, server_default='0'))
    
    op.create_index('ix_documents_emitted_by', 'documents', ['emitted_by'])
    
    # Criar tabela audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_email', sa.String(255), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=False),
        sa.Column('institution_id', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('request_path', sa.String(500), nullable=True),
        sa.Column('request_method', sa.String(10), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])
    op.create_index('ix_audit_logs_action_timestamp', 'audit_logs', ['action', 'timestamp'])
    op.create_index('ix_audit_logs_user_timestamp', 'audit_logs', ['user_email', 'timestamp'])
    op.create_index('ix_audit_logs_institution_timestamp', 'audit_logs', ['institution_id', 'timestamp'])
    op.create_index('ix_audit_logs_resource_id', 'audit_logs', ['resource_id'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_column('documents', 'verify_count')
    op.drop_column('documents', 'last_verified_from_ip')
    op.drop_column('documents', 'last_verified_at')
    op.drop_column('documents', 'last_verified_by')
    op.drop_column('documents', 'emitted_from_ip')
    op.drop_column('documents', 'emitted_at')
    op.drop_column('documents', 'emitted_by')
