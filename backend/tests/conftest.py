import os

# Must be set before any app module is imported, because app.config reads DATABASE_URL
# at import time. Tests use the test DB for both the main engine and the test session.
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fridge_test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fridge_test"
)

# Separate engine pointed at the test database.
test_engine = create_engine(TEST_DATABASE_URL)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once per test session, drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session(create_tables):
    """
    Per-test database session using SAVEPOINT-based rollback for isolation.

    Strategy: open one connection with an outer transaction, then tell SQLAlchemy
    to use SAVEPOINTs (join_transaction_mode="create_savepoint") for any session-level
    BEGIN/COMMIT. The app's session.commit() advances the SAVEPOINT but never commits
    the outer transaction, so everything is rolled back after the test without touching
    the schema.

    This is faster than drop/recreate per test and gives full Postgres behavior
    (no SQLite approximations).
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """TestClient with the database dependency overridden to use the test session."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_shelf(db_session):
    """A pre-existing shelf for tests that need one."""
    from app.models import Shelf

    shelf = Shelf(name="Test Shelf", position=0)
    db_session.add(shelf)
    db_session.commit()
    db_session.refresh(shelf)
    return shelf


@pytest.fixture
def sample_item(db_session, sample_shelf):
    """A pre-existing item on sample_shelf for tests that need one."""
    from app.models import Item

    item = Item(
        shelf_id=sample_shelf.id,
        name="Test Item",
        quantity=1.0,
        unit="pieces",
        category="other",
        position=0,
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)
    return item
