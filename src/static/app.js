document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to escape text inserted into HTML
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic card layout with a participants container we populate below
        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants" data-activity="${escapeHtml(name)}">
            <div class="participants-header">Participants (${details.participants.length})</div>
            <ul class="participants-list"></ul>
          </div>
        `;

        // Append card first, then populate participants list with delete buttons
        activitiesList.appendChild(activityCard);

        const participantsContainer = activityCard.querySelector('.participants');
        const participantsList = participantsContainer.querySelector('.participants-list');

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-participant';
            btn.setAttribute('aria-label', `Unregister ${p} from ${name}`);
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.textContent = '✖';

            li.appendChild(span);
            li.appendChild(btn);
            participantsList.appendChild(li);
          });
        } else {
          // show empty state
          participantsList.innerHTML = '<li class="no-participants">No participants yet.</li>';
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Delegate click for delete buttons
      activitiesList.addEventListener('click', async (ev) => {
        const btn = ev.target.closest && ev.target.closest('.delete-participant');
        if (!btn) return;

        const activity = btn.dataset.activity;
        const email = btn.dataset.email;

        if (!activity || !email) return;

        if (!confirm(`Unregister ${email} from ${activity}?`)) return;

        try {
          const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, {
            method: 'DELETE'
          });

          const result = await resp.json();

          if (resp.ok) {
            // Refresh list
            fetchActivities();
          } else {
            console.error('Failed to unregister:', result);
            alert(result.detail || 'Failed to unregister participant');
          }
        } catch (err) {
          console.error('Error unregistering participant:', err);
          alert('Error unregistering participant');
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-registered participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
