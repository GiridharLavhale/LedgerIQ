import os
import sys

# Ensure backend root is always in python path regardless of execution cwd
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pytest
import pytest_asyncio
from app.core.database import init_db
from app.main import seed_initial_data


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    """Initializes SQLite database and default seeds for tests."""
    await init_db()
    await seed_initial_data()
    yield
