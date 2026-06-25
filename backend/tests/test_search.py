def test_search_returns_match(client, sample_shelf, db_session):
    from app.models import Item

    item = Item(
        shelf_id=sample_shelf.id,
        name="Mozzarella",
        quantity=1.0,
        unit="pieces",
        category="dairy",
        position=0,
    )
    db_session.add(item)
    db_session.commit()

    response = client.get("/search/items?q=mozz")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["name"] == "Mozzarella"
    assert body[0]["shelf_name"] == sample_shelf.name
    assert body[0]["shelf_id"] == sample_shelf.id


def test_search_case_insensitive(client, sample_shelf, db_session):
    from app.models import Item

    db_session.add(
        Item(
            shelf_id=sample_shelf.id,
            name="Spinach",
            quantity=1,
            unit="g",
            category="vegetables",
            position=0,
        )
    )
    db_session.commit()

    assert client.get("/search/items?q=SPINACH").status_code == 200
    assert len(client.get("/search/items?q=SPINACH").json()) == 1


def test_search_no_results(client):
    response = client.get("/search/items?q=xyznomatch")
    assert response.status_code == 200
    assert response.json() == []


def test_search_missing_query_param(client):
    response = client.get("/search/items")
    assert response.status_code == 422


def test_search_empty_query_rejected(client):
    response = client.get("/search/items?q=")
    assert response.status_code == 422
