"""Add is_folder to IndexedFile

Revision ID: 4ebac0ddd174
Revises: df4cdfaca5c9
Create Date: 2025-03-11 02:38:43.868985

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4ebac0ddd174'
down_revision = 'df4cdfaca5c9'
branch_labels = None
depends_on = None


import { Schema, Column, DataType } from 'lorm';

export async function upgrade(schema: Schema): Promise<void> {
  await schema.alterTable('indexed_file', table => {
    table.addColumn('is_folder', DataType.BOOLEAN, { nullable: false });
  });
}


import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.addColumn('indexed_file', {
    is_folder: { type: 'boolean', notNull: true, default: false },
  });
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropColumn('indexed_file', 'is_folder');
}
