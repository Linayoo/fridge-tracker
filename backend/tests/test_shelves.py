def test_list_shelves_empty(client):
    response = client.get("/shelves")
    assert response.status_code == 200
    assert response.json() == []


def test_create_shelf(client):
    response = client.post("/shelves", json={"name": "Top Shelf"})
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Top Shelf"
    assert body["position"] == 0
    assert "id" in body


def test_create_shelf_auto_position(client):
    client.post("/shelves", json={"name": "Shelf A"})
    response = client.post("/shelves", json={"name": "Shelf B"})
    assert response.status_code == 201
    assert response.json()["position"] == 1


def test_create_shelf_explicit_position(client):
    response = client.post("/shelves", json={"name": "Pinned", "position": 5})
    assert response.status_code == 201
    assert response.json()["position"] == 5


def test_get_shelf(client, sample_shelf):
    response = client.get(f"/shelves/{sample_shelf.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == sample_shelf.name
    assert "items" in body


def test_get_shelf_not_found(client):
    response = client.get("/shelves/9999")
    assert response.status_code == 404


def test_update_shelf(client, sample_shelf):
    response = client.patch(f"/shelves/{sample_shelf.id}", json={"name": "Renamed"})
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_update_shelf_not_found(client):
    response = client.patch("/shelves/9999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_shelf(client, sample_shelf):
    response = client.delete(f"/shelves/{sample_shelf.id}")
    assert response.status_code == 204
    assert client.get(f"/shelves/{sample_shelf.id}").status_code == 404


def test_delete_shelf_not_found(client):
    response = client.delete("/shelves/9999")
    assert response.status_code == 404


def test_reorder_shelves(client):
    r1 = client.post("/shelves", json={"name": "A"}).json()
    r2 = client.post("/shelves", json={"name": "B"}).json()
    response = client.post(
        "/shelves/reorder",
        json={"order": [{"id": r2["id"], "position": 0}, {"id": r1["id"], "position": 1}]},
    )
    assert response.status_code == 200
    assert [s["name"] for s in response.json()] == ["B", "A"]


def test_reorder_shelves_unknown_id(client):
    response = client.post(
        "/shelves/reorder",
        json={"order": [{"id": 9999, "position": 0}]},
    )
    assert response.status_code == 404


def test_list_shelves_includes_items(client, sample_shelf, sample_item):
    response = client.get("/shelves")
    assert response.status_code == 200
    shelves = response.json()
    assert any(s["id"] == sample_shelf.id for s in shelves)
    shelf = next(s for s in shelves if s["id"] == sample_shelf.id)
    assert len(shelf["items"]) == 1
    assert shelf["items"][0]["name"] == sample_item.name
