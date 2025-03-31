"""made changes

Revision ID: 5e8d47f066ee
Revises: a66e4db2cae1
Create Date: 2025-03-24 15:10:31.463083

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e8d47f066ee'
down_revision = 'a66e4db2cae1'
branch_labels = None
depends_on = None


def upgrade():
    # Step 1: Add the column as nullable initially
    with op.batch_alter_table('indexed_file', schema=None) as batch_op:
        batch_op.add_column(sa.Column('storage_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('cloud_file_id', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('mime_type', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('last_modified', sa.DateTime(), nullable=True))
        batch_op.create_unique_constraint('uq_cloud_file_id', ['cloud_file_id'])

    # Step 2: Set a default value for existing rows
    op.execute("UPDATE indexed_file SET storage_type = 'local' WHERE storage_type IS NULL")

    # Step 3: Alter column to NOT NULL
    with op.batch_alter_table('indexed_file', schema=None) as batch_op:
        batch_op.alter_column('storage_type', nullable=False)


def downgrade():
    # Rollback in reverse order
    with op.batch_alter_table('indexed_file', schema=None) as batch_op:
        batch_op.drop_constraint('uq_cloud_file_id', type_='unique')
        batch_op.drop_column('last_modified')
        batch_op.drop_column('mime_type')
        batch_op.drop_column('cloud_file_id')
        batch_op.drop_column('storage_type')
