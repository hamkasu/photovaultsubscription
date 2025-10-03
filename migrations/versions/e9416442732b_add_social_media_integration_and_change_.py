"""add_social_media_integration_and_change_storage_gb_to_numeric

Revision ID: e9416442732b
Revises: ad11b5287a15
Create Date: 2025-10-03 04:11:17.502820

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9416442732b'
down_revision = 'ad11b5287a15'
branch_labels = None
depends_on = None


def upgrade():
    # Add social_media_integration column and change storage_gb to NUMERIC
    with op.batch_alter_table('subscription_plan', schema=None) as batch_op:
        batch_op.add_column(sa.Column('social_media_integration', sa.BOOLEAN(), server_default=sa.text('false'), nullable=True))
        batch_op.alter_column('storage_gb',
               existing_type=sa.Integer(),
               type_=sa.NUMERIC(precision=10, scale=2),
               existing_nullable=False)


def downgrade():
    # Remove social_media_integration column and change storage_gb back to Integer
    with op.batch_alter_table('subscription_plan', schema=None) as batch_op:
        batch_op.alter_column('storage_gb',
               existing_type=sa.NUMERIC(precision=10, scale=2),
               type_=sa.Integer(),
               existing_nullable=False)
        batch_op.drop_column('social_media_integration')
