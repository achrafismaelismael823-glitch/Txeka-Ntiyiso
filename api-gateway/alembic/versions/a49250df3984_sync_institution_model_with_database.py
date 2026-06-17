"""sync_institution_model_with_database

Revision ID: a49250df3984
Revises: b9b66feb8b95
Create Date: 2026-06-17 18:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a49250df3984'
down_revision = 'b9b66feb8b95'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar colunas do modelo Institution que faltam na BD
    op.add_column('institutions', sa.Column('contact_email', sa.String(length=255), nullable=True))
    op.add_column('institutions', sa.Column('subscription_plan', sa.String(length=50), nullable=True, server_default='free'))
    op.add_column('institutions', sa.Column('docs_emitted_month', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('institutions', sa.Column('credits', sa.Integer(), nullable=False, server_default='80'))
    op.add_column('institutions', sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))


def downgrade() -> None:
    op.drop_column('institutions', 'status')
    op.drop_column('institutions', 'credits')
    op.drop_column('institutions', 'docs_emitted_month')
    op.drop_column('institutions', 'subscription_plan')
    op.drop_column('institutions', 'contact_email')
