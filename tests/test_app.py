from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities_contains_known_activity():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_adds_participant_and_cleanup():
    activity = "Chess Club"
    email = "test_add_user@example.com"

    # Ensure the participant is not already present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    if email in participants:
        # If already present for some reason, remove it first
        client.delete(f"/activities/{activity}/participants?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in resp.json().get("message", "")

    # Verify it appears in the activity
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    assert email in participants

    # Cleanup: remove the participant
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200


def test_unregister_removes_participant():
    activity = "Chess Club"
    email = "test_remove_user@example.com"

    # Ensure user is signed up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200

    # Now unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify removal
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    assert email not in participants
