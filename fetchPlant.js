const axios = require("axios");
const mysql = require("mysql2/promise"); // Import the mysql2 promise-based library

// MySQL database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "root", // Replace with your MySQL password
  database: "plant_care",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let insertedRecords = 0;

const apiUrl =
  "https://perenual.com/api/species-list?key=sk-Ize6655a427ba502e2939";

// Function to fetch data for a given page with rate limiting
async function fetchData(page) {
  const apiUrlWithPage = `${apiUrl}&page=${page}`;
  try {
    const response = await axios.get(apiUrlWithPage);
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      // If rate-limited, wait for a specified duration and retry
      console.log(
        `Rate limited. Retrying after ${error.response.headers["retry-after"]} seconds.`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, error.response.headers["retry-after"] * 1000)
      );
      return fetchData(page);
    } else {
      throw error; // Propagate other errors
    }
  }
}

// Function to check if the 'Plants' table exists
async function checkIfTableExists() {
  try {
    const [rows] = await db.execute("SHOW TABLES LIKE 'Plants'");
    return rows.length > 0;
  } catch (error) {
    console.error("Error checking table existence:", error);
    throw error;
  }
}

// Function to create the 'Plants' table
async function createPlantsTable() {
  try {
    await db.execute(`
      CREATE TABLE Plants (
        p_id INT PRIMARY KEY,
        common_name VARCHAR(255),
        scientific_name JSON,
        cycle VARCHAR(50),
        watering VARCHAR(50),
        sunlight JSON,
        image_url VARCHAR(255)
      )
    `);
    console.log("Plants table created successfully");
  } catch (error) {
    console.error("Error creating 'Plants' table:", error);
    throw error;
  }
}

// Fetch plant data from the Perenual API for all pages
async function fetchAllData() {
  // Check if the 'Plants' table exists
  const tableExists = await checkIfTableExists();

  // If the table doesn't exist, create it
  if (!tableExists) {
    await createPlantsTable();
  }

  const totalPages = 405; // Update this with the total number of pages
  for (let page = 1; page <= totalPages; page++) {
    const data = await fetchData(page);
    // Insert each plant into the database
    for (const plant of data) {
      await insertPlant(plant);
    }
  }
}

// Insert plant data into the MySQL database
async function insertPlant(plant) {
  const {
    id,
    common_name,
    scientific_name,
    cycle,
    watering,
    sunlight,
    default_image,
  } = plant;

  const imageUrl =
    default_image && default_image.medium_url ? default_image.medium_url : null;

  try {
    const [result] = await db.execute(
      "INSERT INTO Plants (p_id, common_name, scientific_name, cycle, watering, sunlight, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        common_name,
        JSON.stringify(scientific_name),
        cycle,
        watering,
        JSON.stringify(sunlight),
        imageUrl,
      ]
    );

    console.log("Plant inserted successfully");
    console.log("Image URL:", imageUrl);

    insertedRecords++;

    // Check if the target record count is reached
    if (insertedRecords >= 2996) {
      console.log("Target record count reached. Stopping the process.");
      process.exit();
    }
  } catch (err) {
    console.error("Error inserting plant:", err);
  }
}

// Fetch data for all pages and insert into the database
fetchAllData();
