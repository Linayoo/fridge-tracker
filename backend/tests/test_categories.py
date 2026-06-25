def test_list_categories(client):
    response = client.get("/categories")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 11


def test_categories_have_required_fields(client):
    response = client.get("/categories")
    for cat in response.json():
        assert "slug" in cat
        assert "label" in cat
        assert "emoji" in cat
        assert "suggested_units" in cat
        assert isinstance(cat["suggested_units"], list)


def test_categories_contain_expected_slugs(client):
    response = client.get("/categories")
    slugs = {c["slug"] for c in response.json()}
    assert {"dairy", "vegetables", "meat", "fish", "other"}.issubset(slugs)
