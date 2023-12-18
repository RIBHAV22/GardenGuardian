// profile.js
document.addEventListener("DOMContentLoaded", function () {
  const usernameElement = document.getElementById("username");
  const emailElement = document.getElementById("email");
  const plantListElement = document.getElementById("plantList");
  const uid = JSON.parse(localStorage.getItem("id"));

  // Retrieve user data from local storage
  const userd = JSON.parse(localStorage.getItem("usersd"));
  const emailsd = JSON.parse(localStorage.getItem("emaild"));

  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", function () {
    // Perform logout actions, such as clearing local storage or redirecting to the login page
    localStorage.removeItem("id");
    localStorage.removeItem("usersd");
    localStorage.removeItem("emaild");

    // Redirect to the index page
    window.location.href = "index.html";
  });

  // Display username and email ID
  usernameElement.textContent = userd;
  emailElement.textContent = emailsd;

  // Fetch and display the list of plants in the nursery
  fetchPlantsInNursery(uid)
    .then((plants) => {
      // Display the list of plants in the nursery
      displayPlantsInNursery(plants);
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
      return data.plants || [];
    } catch (error) {
      throw error;
    }
  }

  // Function to display the list of plants in the nursery
  function displayPlantsInNursery(plants) {
    const plantList = plants.map((plant) => {
      // Create a list item for each plant
      const listItem = document.createElement("li");
      listItem.textContent = plant.common_name;

      // Add a click event listener to redirect to the plant details page
      listItem.addEventListener("click", function () {
        // Redirect to the plant details page with the plant ID
        window.location.href = `/plantDetails.html?id=${plant.p_id}`;
      });

      return listItem;
    });

    // Clear any existing content and append the new plant list
    plantListElement.innerHTML = "";
    plantList.forEach((item) => {
      plantListElement.appendChild(item);
    });
  }
});
