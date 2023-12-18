document.addEventListener("DOMContentLoaded", function () {
  const uid = JSON.parse(localStorage.getItem("id"));

  // Existing code for fetching and displaying the list of plants in the nursery
  fetchPlantsInNursery(uid)
    .then(async (plants) => {
      // Display the list of plants in the nursery
      await displayPlantsInNursery(plants);
    })
    .catch((error) => {
      console.error("Error fetching plants in nursery:", error);
    });

  // Function to fetch plants in the user's nursery
  async function fetchPlantsInNursery(userId) {
    try {
      const response = await fetch(
        `http://localhost:5503/getPlantsInNursery?userId=${userId}`
      );
      const data = await response.json();
      console.log(data);
      updatePlantDropdown(data.plants);
      return data.plants || [];
    } catch (error) {
      throw error;
    }
  }

  // Function to display the list of plants in the nursery
  async function displayPlantsInNursery(plants) {
    const plantListElement = document.getElementById("plantList");

    plantListElement.innerHTML = "";
    if (plants.length > 0) {
      document.getElementById("addActivityButton").style.display = "block";
      for (const plant of plants) {
        // Create a list item for each plant
        const listItem = document.createElement("li");

        // Create a div to hold plant details
        const plantDetailsDiv = document.createElement("div");
        plantDetailsDiv.classList.add("plant-details");

        // Display plant number
        const plantNumber = document.createElement("span");
        plantNumber.textContent = `${plants.indexOf(plant) + 1}. `;
        plantNumber.classList.add("plant-number");
        plantDetailsDiv.appendChild(plantNumber);

        // Display plant name
        const plantName = document.createElement("h3");
        plantName.textContent = plant.common_name;
        plantDetailsDiv.appendChild(plantName);

        // Create a button for viewing tips
        const tipsButton = document.createElement("button");
        tipsButton.textContent = "Click to View Tips";
        tipsButton.classList.add("tips-button");

        // Add a click event listener to handle button click
        tipsButton.addEventListener("click", function () {
          // Handle the button click, e.g., show tips or navigate to tips page
          console.log(`View tips for plant ${plant.common_name}`);
          openTipsModal(plant.common_name, plant.watering, plant.sunlight);
        });

        // Append the button to the plant details div
        plantDetailsDiv.appendChild(tipsButton);

        // Create a button for viewing activity log
        const viewActivityLogButton = document.createElement("button");
        viewActivityLogButton.textContent = "View Activity Log";
        viewActivityLogButton.classList.add("view-activity-log-button");

        // Add a click event listener to handle button click
        viewActivityLogButton.addEventListener("click", function () {
          // Handle the button click, e.g., navigate to activity log page for the specific plant
          console.log(uid, plant.common_name);
          openActivityLog(uid, plant.common_name);
        });

        // Append the button to the plant details div
        plantDetailsDiv.appendChild(viewActivityLogButton);

        // Add a click event listener to redirect to the plant details page
        // listItem.addEventListener("click", function () {
        //   // Redirect to the plant details page with the plant ID
        //   window.location.href = `/plantDetails.html?id=${plant.p_id}`;
        // });

        // Append the plant details div to the list item
        listItem.appendChild(plantDetailsDiv);

        // Append the list item to the plant list
        plantListElement.appendChild(listItem);

        try {
          const response = await fetch(
            `http://localhost:5503/api/plants/${plant.p_id}/needsNotification`
          );
          const data = await response.json();
          const needsNotification = data.needsNotification;
          console.log("Hi!");
          // Use the needsNotification value as needed (for example, display an icon)
          if (needsNotification) {
            console.log(`Plant ${plant.common_name} needs notification!`);
            document.getElementById("activityPopup").style.display = "block";
            Push.create("Reminder 🌱!", {
              body: `Please water ${plant.common_name}. It needs your attention 🥺🥺`,
              icon: "Images/favicon.ico",
              timeout: 5000,
              onClick: function () {
                window.focus();
                this.close();
              },
            });
            // Add your logic here to handle the notification (e.g., display an icon)
          }
        } catch (error) {
          console.error("Error checking needs notification:", error);
        }
      }
    } else {
      document.getElementById("addActivityButton").style.display = "none";
      // Display a message when there are no plants
      const noPlantsMessage = document.createElement("p");
      noPlantsMessage.textContent = "Sorry, No Plants found.";
      noPlantsMessage.style.fontFamily = "Value Serif Pro Regular"; // Set the font
      noPlantsMessage.style.textAlign = "center"; // Center the text
      plantListElement.appendChild(noPlantsMessage);
    }
  }

  const welcomeMessageElement = document.getElementById("username");
  const userd = JSON.parse(localStorage.getItem("usersd"));
  const emailsd = JSON.parse(localStorage.getItem("emaild"));
  console.log(userd);
  console.log(emailsd);
  welcomeMessageElement.textContent = userd;

  const searchBarContainerEl = document.querySelector(".search-bar-container");
  const searchInputEl = document.querySelector(".input");
  const searchResultsEl = document.getElementById("searchResults");
  const userIcon = document.getElementById("user");
  userIcon.addEventListener("click", function () {
    // Redirect to the profile page (replace "profile.html" with your actual profile page)
    window.location.href = "profile.html";
  });
  searchInputEl.addEventListener("input", async () => {
    const searchTerm = searchInputEl.value.trim();

    // Show search results dynamically
    if (searchTerm.length >= 3) {
      try {
        const response = await fetch(
          `http://localhost:5503/searchPlants?searchTerm=${searchTerm}`
        );
        const data = await response.json();

        if (data.plants.length > 0) {
          const resultItems = data.plants.map(
            (plant) =>
              `<div class="search-result-item" data-plant-id="${plant.p_id}">${plant.common_name}</div>`
          );
          searchResultsEl.innerHTML = resultItems.join("");
          searchResultsEl.style.display = "block";
        } else {
          searchResultsEl.innerHTML = "No results found";
          searchResultsEl.style.display = "block";
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    } else {
      // Hide search results if search term is less than 3 characters
      searchResultsEl.style.display = "none";
    }
  });

  searchResultsEl.addEventListener("click", (event) => {
    const target = event.target;
    if (target.classList.contains("search-result-item")) {
      const plantId = target.dataset.plantId;
      if (plantId) {
        // Redirect to the plant details page with the corresponding plantId
        window.location.href = `plantDetails.html?id=${plantId}`;
      }
    }
  });

  // Hide search results on clicking anywhere outside the search bar
  document.addEventListener("click", (event) => {
    if (!searchBarContainerEl.contains(event.target)) {
      searchResultsEl.style.display = "none";
    }
  });

  const magnifierEl = document.querySelector(".magnifier");

  magnifierEl.addEventListener("click", () => {
    searchBarContainerEl.classList.toggle("active");
  });

  // Add these functions to home.js
  function openTipsModal(plantName, watering, sunlight) {
    const tipsModal = document.getElementById("tipsModal");
    tipsModal.style.display = "block";

    // Use the provided query to fetch tips
    const query = `generate Plant Care Tips for ${plantName}, has watering needs: ${watering} and sunlight needs: ${sunlight}`;
    console.log(query);
    fetchPlantTips(query);
  }

  function closeTipsModal() {
    const tipsModal = document.getElementById("tipsModal");
    // tipsModal.innerHTML="";
    tipsModal.style.display = "none";
  }
  document
    .getElementById("closeModalButton")
    .addEventListener("click", closeTipsModal);
  async function fetchPlantTips(query) {
    const tipsModal = document.getElementById("tipsModal");
    const preloader = document.createElement("div");
    preloader.classList.add("preloader");
    tipsModal.appendChild(preloader);
    const options = {
      method: "POST",
      url: "https://chatgpt-api7.p.rapidapi.com/ask",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "5bad4eab10msh33670bf2437cebbp10e966jsn5bb9a8d32eb1",
        "X-RapidAPI-Host": "chatgpt-api7.p.rapidapi.com",
      },
      data: {
        query: `${query}`,
      },
    };

    try {
      const response = await axios.request(options);
      console.log(response.data);
      const cleanedResponse = response.data.response.replace(/^AI:/, "");
      const tipsContent = document.getElementById("tipsContent");
      tipsContent.innerHTML = formatTips(cleanedResponse);
      preloader.remove();
    } catch (error) {
      console.error(error);
    }
  }
  document
    .getElementById("tipsModal")
    .addEventListener("click", function (event) {
      if (
        event.target.id === "tipsModal" ||
        event.target.classList.contains("close")
      ) {
        closeTipsModal();
      }
    });
  function beautifyTips(tips) {
    // Add styling to the tips content as needed
    return `
    <div class="tips-container">
      <h3>Plant Care Tips</h3>
      <div class="tips-content">${tips}</div>
    </div>
  `;
  }
  function formatTips(tips) {
    const tipsArray = tips.split("\n").filter((line) => line.trim() !== "");

    if (tipsArray.length === 0) {
      return "No tips available.";
    }

    const formattedTips = tipsArray.map((tip, index) => `${tip}`).join("<br>");

    return formattedTips;
  }

  document
    .getElementById("addActivityButton")
    .addEventListener("click", function () {
      // Show the popup
      document.getElementById("activityPopup").style.display = "block";
      // Push.create("Reminder 🌱!", {
      //   body: `Please water. It needs your attention 🥺🥺`,
      //   icon: "Images/favicon.ico",
      //   timeout: 5000,
      //   onClick: function () {
      //     window.focus();
      //     this.close();
      //   },
      // });
      // Fetch the user's nursery data and populate the dropdown
      fetchPlantsInNursery(uid);
    });

  document
    .getElementById("logActivityButton")
    .addEventListener("click", function () {
      const uid = JSON.parse(localStorage.getItem("id"));
      var selectedPlant = document.getElementById("plantDropdown").value;

      // Create data object with the selected plant
      var data = {
        uid: uid,
        plantName: selectedPlant,
      };

      // Use axios for making the POST request
      axios
        .post("http://localhost:5503/logActivity", data, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          // Log success message
          console.log(response.data.message);

          // Hide the popup
          document.getElementById("activityPopup").style.display = "none";
        })
        .catch((error) => {
          console.error("Error:", error);
          // Handle error, show error message, etc.
        });
    });

  function updatePlantDropdown(plants) {
    var dropdown = document.getElementById("plantDropdown");

    // Clear existing options
    dropdown.innerHTML = "";

    // Add new options based on user's nursery data
    plants.forEach((plant) => {
      var option = document.createElement("option");
      option.value = plant.common_name; // Assuming each plant has a unique identifier
      option.text = plant.common_name; // Replace with the property that represents the plant's name
      dropdown.add(option);
    });
  }

  // Update the function to fetch activity logs
  async function fetchActivityLogs(userId, plantName) {
    try {
      const response = await fetch(
        `http://localhost:5503/getActivityLogs?userId=${userId}&plantName=${plantName}`
      );
      const data = await response.json();

      if (data.activityLogs && data.activityLogs.length > 0) {
        console.log(data.activityLogs);
        //displayActivityLogs(data.activityLogs);
        return data.activityLogs;
      } else {
        console.log("No activity logs found.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      throw error;
    }
  }

  function openActivityLog(userId, plantName) {
    // Fetch activity logs for the specific user and plant
    fetchActivityLogs(userId, plantName)
      .then((activityLogs) => {
        displayActivityLogsInPopup(activityLogs);
        // Show the popup
        document.getElementById("activityLogModal").style.display = "block";
      })
      .catch((error) => {
        console.error("Error fetching and displaying activity logs:", error);
      });
  }

  function closeActivityLogModal() {
    const activityLogModal = document.getElementById("activityLogModal");
    activityLogModal.style.display = "none";
  }

  // Add a click event listener to close the activity log modal
  document
    .getElementById("closeLogModalButton")
    .addEventListener("click", closeActivityLogModal);
  document
    .getElementById("activityLogModal")
    .addEventListener("click", function (event) {
      if (
        event.target.id === "activityLogModal" ||
        event.target.classList.contains("close")
      ) {
        closeActivityLogModal();
      }
    });

  function displayActivityLogsInPopup(activityLogs) {
    const activityLogList = document.getElementById("activityLogList");

    // Clear existing content
    activityLogList.innerHTML = "";

    if (activityLogs.length > 0) {
      activityLogs.forEach((log) => {
        const logItem = document.createElement("li");
        const localDate = new Date(log.activity_date);
        const formattedDate = localDate.toLocaleString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        logItem.textContent = `${log.plant_name} - ${formattedDate} - ${log.activity_time}   `;
        activityLogList.appendChild(logItem);
      });
    } else {
      const noLogsMessage = document.createElement("li");
      noLogsMessage.textContent = "No activity logs found.";
      activityLogList.appendChild(noLogsMessage);
    }
  }
});
