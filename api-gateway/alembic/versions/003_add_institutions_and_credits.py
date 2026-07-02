"""003_add_institutions_and_credits

Revision ID: 003
Revises: 002_add_audit_logs
Create Date: 2026-07-02 11:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002_add_audit_logs'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'institutions' not in tables:
        op.create_table(
            'institutions',
            sa.Column('id', sa.String(100), primary_key=True, index=True),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('contact_email', sa.String(255), nullable=True),
            sa.Column('password_hash', sa.String(255), nullable=True),
            sa.Column('role', sa.String(20), nullable=False, server_default='institution'),
            sa.Column('subscription_plan', sa.String(50), server_default='free'),
            sa.Column('docs_emitted_month', sa.Integer(), server_default='0'),
            sa.Column('credits', sa.Integer(), server_default='0', nullable=False),
            sa.Column('status', sa.String(20), server_default='pending', nullable=False, index=True),
            sa.Column('api_key', sa.String(255), nullable=True, unique=True, index=True),
            sa.Column('approved', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        )
    else:
        columns = [c['name'] for c in inspector.get_columns('institutions')]
        
        if 'password_hash' not in columns:
            op.add_column('institutions', sa.Column('password_hash', sa.String(255), nullable=True))
        if 'role' not in columns:
            op.add_column('institutions', sa.Column('role', sa.String(20), server_default='institution', nullable=False))
        if 'api_key' not in columns:
            op.add_column('institutions', sa.Column('api_key', sa.String(255), nullable=True, unique=True))
            op.create_index('ix_institutions_api_key', 'institutions', ['api_key'])
        if 'approved' not in columns:
            op.add_column('institutions', sa.Column('approved', sa.Boolean(), server_default='false', nullable=False))
        if 'status' not in columns:
            op.add_column('institutions', sa.Column('status', sa.String(20), server_default='pending', nullable=False))
            op.create_index('ix_institutions_status', 'institutions', ['status'])
    
    if 'credit_transactions' not in tables:
        op.create_table(
            'credit_transactions',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('institution_id', sa.String(100), sa.ForeignKey('institutions.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(20), nullable=False),
            sa.Column('description', sa.String(500), nullable=True),
            sa.Column('payment_method', sa.String(50), nullable=True),
            sa.Column('payment_reference', sa.String(100), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_by', sa.String(100), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        )
        op.create_index('ix_credit_transactions_institution_type', 'credit_transactions', ['institution_id', 'type'])


def downgrade():
    op.drop_index('ix_credit_transactions_institution_type', table_name='credit_transactions')
    op.drop_table('credit_transactions')
