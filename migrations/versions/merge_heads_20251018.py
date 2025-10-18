"""Merge multiple migration heads

Revision ID: merge_heads_20251018
Revises: add_photo_comment, 20251013_profile_pic, f1a2b3c4d5e6
Create Date: 2025-10-18 19:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'merge_heads_20251018'
down_revision = ('add_photo_comment', '20251013_profile_pic', 'f1a2b3c4d5e6')
branch_labels = None
depends_on = None


def upgrade():
    # This is a merge migration - no schema changes needed
    pass


def downgrade():
    # This is a merge migration - no schema changes needed
    pass
