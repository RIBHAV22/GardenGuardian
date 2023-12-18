document.addEventListener("DOMContentLoaded", async function () {
  const userd = JSON.parse(localStorage.getItem("usersd"));
  const emailsd = JSON.parse(localStorage.getItem("emaild"));
  const uid = JSON.parse(localStorage.getItem("id"));
  //   const uid = JSON.parse(localStorage.getItem("userID"));
  console.log(userd);
  console.log(emailsd);
  console.log(uid);
  // try {
  //   const response = await fetch(
  //     `http://localhost:5503/checkAndCreateNurseryTable?userId=${uid}`
  //   );
  //   const data = await response.json();

  //   if (data.success) {
  //     console.log("Nursery table check completed");
  //   } else {
  //     console.error("Failed to check and create the nursery table");
  //   }
  // } catch (error) {
  //   console.error("Error checking and creating nursery table:", error);
  // }
  const commonNameElement = document.getElementById("commonName");
  const scientificNameElement = document.getElementById("scientificName");
  const cycleElement = document.getElementById("cycle");
  const wateringElement = document.getElementById("watering");
  const sunlightElement = document.getElementById("sunlight");
  const plantImageElement = document.getElementById("plantImage");
  const userIcon = document.getElementById("user");
  userIcon.addEventListener("click", function () {
    // Redirect to the profile page (replace "profile.html" with your actual profile page)
    window.location.href = "profile.html";
  });

  const searchBarContainerEl = document.querySelector(".search-bar-container");
  const searchInputEl = document.querySelector(".input");
  const searchResultsEl = document.getElementById("searchResults");

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
  // Extract plant ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const plantId = urlParams.get("id");

  if (!plantId) {
    console.error("Plant ID not provided");
    return;
  }

  try {
    // Fetch plant details from the server
    const response = await fetch(
      `http://localhost:5503/getPlantDetails?plantId=${plantId}`
    );
    const data = await response.json();

    if (data.plant) {
      const plant = data.plant;

      // Update HTML elements with plant details
      commonNameElement.textContent = `Common Name: ${plant.common_name}`;
      scientificNameElement.textContent = `Scientific Name: ${plant.scientific_name}`;
      cycleElement.textContent = `Cycle: ${plant.cycle}`;
      wateringElement.textContent = `Watering: ${plant.watering}`;
      sunlightElement.textContent = `Sunlight: ${JSON.stringify(
        plant.sunlight
      )}`;

      // Set the image source
      plantImageElement.src = plant.image_url;
    } else {
      console.error("Plant not found");
    }
  } catch (error) {
    console.error("Error fetching plant details:", error);
  }

  const addButton = document.querySelector(".add");

  addButton.addEventListener("click", async function () {
    // Extract plant ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const plantId = urlParams.get("id");

    if (!plantId) {
      console.error("Plant ID not provided");
      return;
    }

    try {
      const response = await fetch("http://localhost:5503/addToNursery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: uid, plantId }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Plant added to the nursery successfully!");
        location.reload();
      } else {
        alert("Failed to add plant to the nursery. Please try again.");
      }
    } catch (error) {
      console.error("Error adding plant to nursery:", error);
      alert("An error occurred. Please try again later.");
    }
  });

  const removeButton = document.querySelector(".remove");

  // Fetch the list of plants in the user's nursery
  const nurseryPlantsResponse = await fetch(
    `http://localhost:5503/getPlantsInNursery?userId=${uid}`
  );
  const nurseryPlantsData = await nurseryPlantsResponse.json();

  console.log("Plant ID:", plantId);
  console.log("Nursery Plants Data:", nurseryPlantsData);

  // Check if the plant is in the nursery
  const isInNursery = nurseryPlantsData.plants.some(
    (nurseryPlant) => nurseryPlant.p_id === parseInt(plantId)
  );

  console.log("Is in nursery:", isInNursery);

  // Show or hide the "Remove Plant" button based on whether the plant is in the nursery
  if (isInNursery) {
    removeButton.style.display = "block";
    addButton.style.display = "none";
  } else {
    removeButton.style.display = "none";
    addButton.style.display = "block";
  }

  // Add an event listener for the "Remove Plant" button
  removeButton.addEventListener("click", async function () {
    try {
      const removeResponse = await fetch(
        "http://localhost:5503/removeFromNursery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: uid, plantId }),
        }
      );

      const removeData = await removeResponse.json();

      if (removeData.success) {
        alert("Plant removed from the nursery successfully!");
        // Redirect to the home page or any other appropriate page
        window.location.href = "home.html";
      } else {
        alert("Failed to remove plant from the nursery. Please try again.");
      }
    } catch (error) {
      console.error("Error removing plant from the nursery:", error);
      alert("An error occurred. Please try again later.");
    }
  });
});
