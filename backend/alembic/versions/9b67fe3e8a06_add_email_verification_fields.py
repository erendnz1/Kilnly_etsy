"""add email verification fields

Revision ID: 9b67fe3e8a06
Revises: 90119f4bf603
Create Date: 2026-08-26 17:30:29.572013

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b67fe3e8a06'
down_revision: Union[str, Sequence[str], None] = '90119f4bf603'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "verification_token_hash",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "verification_token_expires",
            sa.DateTime(),
            nullable=True,
        ),
    )

    # Existing users are treated as verified
    # so current test accounts keep working.
    op.execute(
        "UPDATE users SET is_email_verified = TRUE "
        "WHERE is_email_verified = FALSE"
    )

    # Remove the database-level default after existing rows are populated.
    op.alter_column(
        "users",
        "is_email_verified",
        server_default=None,
    )

def downgrade() -> None:
    op.drop_column("users", "verification_token_expires")
    op.drop_column("users", "verification_token_hash")
    op.drop_column("users", "is_email_verified")