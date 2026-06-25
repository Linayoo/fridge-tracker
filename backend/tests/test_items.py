def test_create_item(client, sample_shelf):
    response = client.post(
        f"/shelves/{sample_shelf.id}/items",
        json={"name": "Yogurt", "quantity": 4.0, "unit": "pieces", "category": "dairy"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Yogurt"
    assert body["shelf_id"] == sample_shelf.id
    assert body["position"] == 0
    assert body["expires_at"] is None


def test_create_item_auto_position(client, sample_shelf, sample_item):
    response = client.post(
        f"/shelves/{sample_shelf.id}/items",
        json={"name": "Butter", "quantity": 1.0, "unit": "pieces", "category": "dairy"},
    )
    assert response.status_code == 201
    assert response.json()["position"] == 1


def test_create_item_with_expiration(client, sample_shelf):
    response = client.post(
        f"/shelves/{sample_shelf.id}/items",
        json={
            "name": "Milk",
            "quantity": 1.0,
            "unit": "L",
            "category": "dairy",
            "expires_at": "2026-07-01T00:00:00Z",
        },
    )
    assert response.status_code == 201
    assert response.json()["expires_at"] is not None


def test_create_item_shelf_not_found(client):
    response = client.post(
        "/shelves/9999/items",
        json={"name": "Ghost", "quantity": 1.0, "unit": "pieces", "category": "other"},
    )
    assert response.status_code == 404


def test_get_item(client, sample_item):
    response = client.get(f"/items/{sample_item.id}")
    assert response.status_code == 200
    assert response.json()["name"] == sample_item.name


def test_get_item_not_found(client):
    response = client.get("/items/9999")
    assert response.status_code == 404


def test_update_item_quantity(client, sample_item):
    response = client.patch(f"/items/{sample_item.id}", json={"quantity": 3.0})
    assert response.status_code == 200
    assert response.json()["quantity"] == 3.0


def test_update_item_clears_expiration(client, sample_shelf):
    # Create item with expiration, then explicitly clear it
    r = client.post(
        f"/shelves/{sample_shelf.id}/items",
        json={
            "name": "Cheese",
            "quantity": 1.0,
            "unit": "g",
            "category": "dairy",
            "expires_at": "2026-07-01T00:00:00Z",
        },
    )
    item_id = r.json()["id"]
    response = client.patch(f"/items/{item_id}", json={"expires_at": None})
    assert response.status_code == 200
    assert response.json()["expires_at"] is None


def test_update_item_not_found(client):
    response = client.patch("/items/9999", json={"quantity": 1.0})
    assert response.status_code == 404


def test_move_item_to_shelf(client, sample_shelf, sample_item, db_session):
    from app.models import Shelf

    shelf2 = Shelf(name="Bottom Shelf", position=1)
    db_session.add(shelf2)
    db_session.commit()
    db_session.refresh(shelf2)

    response = client.patch(f"/items/{sample_item.id}", json={"shelf_id": shelf2.id})
    assert response.status_code == 200
    assert response.json()["shelf_id"] == shelf2.id


def test_move_item_to_nonexistent_shelf(client, sample_item):
    response = client.patch(f"/items/{sample_item.id}", json={"shelf_id": 9999})
    assert response.status_code == 404


def test_delete_item(client, sample_item):
    response = client.delete(f"/items/{sample_item.id}")
    assert response.status_code == 204
    assert client.get(f"/items/{sample_item.id}").status_code == 404


def test_delete_item_not_found(client):
    response = client.delete("/items/9999")
    assert response.status_code == 404


def test_reorder_items(client, sample_shelf, db_session):
    from app.models import Item

    i1 = Item(
        shelf_id=sample_shelf.id, name="A", quantity=1, unit="pieces", category="other", position=0
    )
    i2 = Item(
        shelf_id=sample_shelf.id, name="B", quantity=1, unit="pieces", category="other", position=1
    )
    db_session.add_all([i1, i2])
    db_session.commit()
    db_session.refresh(i1)
    db_session.refresh(i2)

    response = client.post(
        f"/shelves/{sample_shelf.id}/items/reorder",
        json={"order": [{"id": i2.id, "position": 0}, {"id": i1.id, "position": 1}]},
    )
    assert response.status_code == 200
    assert [item["name"] for item in response.json()] == ["B", "A"]


def test_reorder_items_shelf_not_found(client):
    response = client.post(
        "/shelves/9999/items/reorder",
        json={"order": [{"id": 1, "position": 0}]},
    )
    assert response.status_code == 404


def test_delete_shelf_cascades_items(client, sample_shelf, sample_item):
    item_id = sample_item.id
    client.delete(f"/shelves/{sample_shelf.id}")
    assert client.get(f"/items/{item_id}").status_code == 404
