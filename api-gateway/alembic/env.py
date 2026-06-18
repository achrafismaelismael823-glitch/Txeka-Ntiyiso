"""
TXEKA NTIYISO API - ALEMBIC ENV
Configuração que obtém URL diretamente, sem importar src.database.
"""

import os
import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

    def get_database_url() -> str:
        url = os.getenv("DATABASE_URL", "")
            if not url:
                    from src.settings import settings
                            url = settings.database_url_sync
                                if "asyncpg" in url:
                                        url = url.replace("postgresql+asyncpg://", "postgresql://")
                                            return url

                                            from src.database import Base
                                            from src.models import Document, Institution

                                            target_metadata = Base.metadata

                                            def run_migrations_offline() -> None:
                                                url = get_database_url()
                                                    context.configure(
                                                            url=url,
                                                                    target_metadata=target_metadata,
                                                                            literal_binds=True,
                                                                                    dialect_opts={"paramstyle": "named"},
                                                                                            compare_type=True,
                                                                                                    compare_server_default=True,
                                                                                                        )
                                                                                                            with context.begin_transaction():
                                                                                                                    context.run_migrations()

                                                                                                                    def run_migrations_online() -> None:
                                                                                                                        url = get_database_url()
                                                                                                                            connectable = create_engine(url, poolclass=pool.NullPool)
                                                                                                                                with connectable.connect() as connection:
                                                                                                                                        context.configure(
                                                                                                                                                    connection=connection,
                                                                                                                                                                target_metadata=target_metadata,
                                                                                                                                                                            compare_type=True,
                                                                                                                                                                                        compare_server_default=True,
                                                                                                                                                                                                )
                                                                                                                                                                                                        with context.begin_transaction():
                                                                                                                                                                                                                    context.run_migrations()

                                                                                                                                                                                                                    if context.is_offline_mode():
                                                                                                                                                                                                                        run_migrations_offline()
                                                                                                                                                                                                                        else:
                                                                                                                                                                                                                            run_migrations_online()
                                                                                                                                                                                                                            