"""added gmail

Revision ID: d87a4b408b78
Revises: 62da3e7a65d6
Create Date: 2025-04-05 18:21:28.145715

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd87a4b408b78'
down_revision = '62da3e7a65d6'
branch_labels = None
depends_on = None


import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

const tableName = 'indexed_file';
const columnNameCloudFileId = 'cloud_file_id';
const columnNameMimeType = 'mime_type';
const varchar128 = 'varchar(128)';
const string1024 = 'varchar(1024)';

export const up = (pgm: MigrationBuilder) => {
  pgm.alterColumn(tableName, columnNameCloudFileId, { type: string1024 });
  pgm.alterColumn(tableName, columnNameMimeType, { type: string1024 });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.alterColumn(tableName, columnNameCloudFileId, { type: varchar128 });
  pgm.alterColumn(tableName, columnNameMimeType, { type: varchar128 });
};


import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('indexed_file', 'mime_type', { type: 'VARCHAR(1024)' });
  pgm.alterColumn('indexed_file', 'cloud_file_id', { type: 'VARCHAR(1024)' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn('indexed_file', 'mime_type', { type: 'VARCHAR(128)' });
  pgm.alterColumn('indexed_file', 'cloud_file_id', { type: 'VARCHAR(128)' });
}
