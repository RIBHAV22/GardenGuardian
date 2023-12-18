const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 5503;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root", // Replace with your MySQL password
  database: "plant_care",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

// API endpoint for plant search
app.get("/searchPlants", async (req, res) => {
  const searchTerm = req.query.searchTerm;

  // Perform a search in your database based on the searchTerm
  // Return the matching results as JSON
  // Modify this part according to your database schema and search logic

  const sql = "SELECT * FROM Plants WHERE common_name LIKE ?";
  try {
    const searchResult = await connection
      .promise()
      .execute(sql, [`%${searchTerm}%`]);
    res.json({ plants: searchResult[0] });
  } catch (error) {
    console.error("Error searching plants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API endpoint for plant details with setup logic
app.get("/getPlantDetails", async (req, res) => {
  const plantId = req.query.plantId;

  if (!plantId) {
    return res.status(400).json({ error: "Plant ID not provided" });
  }

  try {
    // Check if the stored procedure exists
    const checkProcedureQuery =
      "SHOW PROCEDURE STATUS LIKE 'GetPlantDetailsById';";
    const [procedureRows] = await connection
      .promise()
      .query(checkProcedureQuery);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (procedureRows.length === 0) {
      // Create the stored procedure
      await createGetPlantDetailsProcedure();
    }

    // Call the stored procedure to get plant details
    const plantDetails = await getPlantDetailsById(plantId);

    if (!plantDetails) {
      return res.status(404).json({ error: "Plant not found" });
    }

    // Send the detailed plant information
    res.json({ plant: plantDetails });
  } catch (error) {
    console.error("Error fetching plant details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/checkAndCreateNurseryTable", async (req, res) => {
  const uid = req.query.userId;
  try {
    // Check if the nursery table exists
    const tableExists = "SHOW table STATUS LIKE 'nursery';";
    const [tableRows] = await connection.promise().query(tableExists);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (tableRows.length === 0) {
      // Create the stored procedure
      await createNurseryTable();
    }

    res.json({ success: true, message: "Nursery table check completed" });
  } catch (error) {
    console.error("Error checking and creating nursery table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint for adding plants to the nursery
// ...
// API endpoint for adding plants to the nursery
app.post("/addToNursery", async (req, res) => {
  const { userId, plantId } = req.body;

  if (!userId || !plantId) {
    return res.status(400).json({ error: "UserID and PlantID are required" });
  }

  try {
    const tableExists = "SHOW table STATUS LIKE 'nursery';";
    const [tableRows] = await connection.promise().query(tableExists);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (tableRows.length === 0) {
      // Create the stored procedure
      await createNurseryTable();
    }
    // Check if the nursery table exists
    // const tableExists = await checkIfTableExists("nursery");

    // if (!tableExists) {
    //   // Create the nursery table
    //   await createNurseryTable();
    // }

    // Call the stored procedure to insert into the nursery table
    await insertIntoNursery(userId, plantId);

    res.json({ success: true, message: "Plant added to nursery" });
  } catch (error) {
    console.error("Error adding plant to nursery:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to check if a notification is needed for a specific plant
app.get("/api/plants/:plantId/needsNotification", async (req, res) => {
  const plantId = req.params.plantId;

  try {
    const checkfunctionQuery =
      "SHOW function STATUS LIKE 'NeedsWateringNotification';";
    const [functionRows] = await connection.promise().query(checkfunctionQuery);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (functionRows.length === 0) {
      // Create the stored procedure
      //  await connection.promise().query(insertProcedure);
      await createNeedsWateringNotificationFunction();
    }

    // Fetch the plant's watering frequency
    // const [rows] = await connection
    //   .promise()
    //   .query('SELECT watering FROM plants WHERE p_id = ?', [plantId]);

    // const wateringFrequency = rows[0].watering;

    // Use the stored function to determine if a notification is needed
    const [result] = await connection
      .promise()
      .query("SELECT NeedsWateringNotification(?) AS needs_notification", [
        plantId,
        // wateringFrequency,
      ]);

    const needsNotification = result[0].needs_notification;

    res.json({ needsNotification });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function createNeedsWateringNotificationFunction() {
  try {
    const createFunctionQuery = `
      CREATE FUNCTION NeedsWateringNotification(p_plantId INT) RETURNS BOOLEAN
      DETERMINISTIC
      BEGIN
          DECLARE lastActivityDate DATE;
          DECLARE currentDate DATE;
          DECLARE notificationNeeded BOOLEAN;
          DECLARE plantWatering VARCHAR(50);
          DECLARE plantName VARCHAR(50);

          -- Get the watering frequency for the plant from the 'plants' table
          SELECT watering INTO plantWatering
          FROM plants
          WHERE p_id = p_plantId;

          SELECT common_name INTO plantName
          FROM plants
          WHERE p_id = p_plantId;

          -- If watering frequency is not found, default to 'Minimum'
          IF plantWatering IS NULL THEN
              SET plantWatering = 'Minimum';
          END IF;

          -- Get the last activity date for the plant
          SELECT MAX(activity_date) INTO lastActivityDate
          FROM log_activity
          WHERE uid = 1 AND plant_name = plantName;

          -- Get the current date
          SET currentDate = CURDATE();

          -- Determine if a notification is needed based on the watering frequency
          CASE
              WHEN plantWatering = 'Frequent' THEN
                  SET notificationNeeded = DATEDIFF(currentDate, lastActivityDate) >= 1;
              WHEN plantWatering = 'Average' THEN
                  SET notificationNeeded = DATEDIFF(currentDate, lastActivityDate) >= 3;
              WHEN plantWatering = 'Minimum' THEN
                  SET notificationNeeded = DATEDIFF(currentDate, lastActivityDate) >= 7;
              ELSE
                  SET notificationNeeded = FALSE; -- Default to false if watering frequency is unknown
          END CASE;

          RETURN notificationNeeded;
      END;
    `;

    await connection.promise().query(createFunctionQuery);
    console.log("NeedsWateringNotification function created successfully");
  } catch (error) {
    console.error("Error creating NeedsWateringNotification function:", error);
    throw error;
  }
}

// Call the helper function to create the SQL function

// Function to check if a table exists
async function checkIfTableExists(tableName) {
  try {
    const query = `
      SELECT
        COUNT(*)
      FROM
        information_schema.TABLES
      WHERE
        TABLE_SCHEMA = 'plant_care'
        AND TABLE_NAME = ?;
    `;

    const [rows] = await connection.promise().query(query, [tableName]);

    return rows.length > 0 && rows[0][0] > 0;
  } catch (error) {
    console.error("Error checking if table exists:", error);
    throw error;
  }
}

// Function to create the nursery table
async function createNurseryTable() {
  try {
    const createTableQuery = `
      CREATE TABLE nursery (
        UserID INT,
        p_id INT,
        timeAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (UserID, p_id),
        FOREIGN KEY (UserID) REFERENCES users(ID),
        FOREIGN KEY (p_id) REFERENCES plants(p_id)
      );
    `;

    // Execute the table creation query
    await connection.promise().query(createTableQuery);
  } catch (error) {
    console.error("Error creating nursery table:", error);
    throw error;
  }
}

// Function to insert into the nursery table using a stored procedure
async function insertIntoNursery(userId, plantId) {
  try {
    const insertProcedure = `
      CREATE PROCEDURE InsertIntoNursery(IN p_userId INT, IN p_plantId INT)
      BEGIN
          INSERT INTO nursery (UserID, p_id)
          VALUES (p_userId, p_plantId);
      END;
    `;

    // Check if the procedure exists
    const checkProcedureQuery =
      "SHOW PROCEDURE STATUS LIKE 'InsertIntoNursery';";
    const [procedureRows] = await connection
      .promise()
      .query(checkProcedureQuery);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (procedureRows.length === 0) {
      // Create the stored procedure
      await connection.promise().query(insertProcedure);
    }
    // const procedureExists = await checkIfProcedureExists("InsertIntoNursery");

    // if (!procedureExists) {
    //   // Create the stored procedure
    //   await connection.promise().query(insertProcedure);
    // }

    // Call the stored procedure to insert into the nursery table
    await connection
      .promise()
      .query("CALL InsertIntoNursery(?, ?)", [userId, plantId]);
  } catch (error) {
    console.error("Error inserting into nursery table:", error);
    throw error;
  }
}

// Function to check if a stored procedure exists
// Function to check if a stored procedure exists
async function checkIfProcedureExists(procedureName) {
  try {
    const query = `
      SELECT
        COUNT(*)
      FROM
        information_schema.ROUTINES
      WHERE
        ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_SCHEMA = 'plant_care'
        AND ROUTINE_NAME = ?;
    `;

    const [rows] = await connection.promise().query(query, [procedureName]);

    if (rows.length > 0 && rows[0][0] > 0) {
      return true; // Procedure exists
    } else {
      return false; // Procedure does not exist
    }
  } catch (error) {
    console.error("Error checking if procedure exists:", error);
    throw error;
  }
}

// API endpoint to get plants in the user's nursery
app.get("/getPlantsInNursery", async (req, res) => {
  const userId = req.query.userId; // Assuming you pass the user ID as a query parameter

  if (!userId) {
    return res.status(400).json({ error: "User ID not provided" });
  }

  try {
    const checkProcedureQuery =
      "SHOW PROCEDURE STATUS LIKE 'GetPlantsInNursery';";
    const [procedureRows] = await connection
      .promise()
      .query(checkProcedureQuery);
    // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

    if (procedureRows.length === 0) {
      // Create the stored procedure
      await createGetPlantsInNurseryProcedure();
    }

    // Check if the stored procedure exists
    // const procedureExists = await checkIfProcedureExists("GetPlantsInNursery");

    // if (!procedureExists) {
    //     // Create the stored procedure
    //     await createGetPlantsInNurseryProcedure();
    // }

    // Call the stored procedure to get plants in the nursery
    const plantsInNursery = await gettPlantsInNursery(userId);

    // Send the plant information
    res.json({ plants: plantsInNursery });
  } catch (error) {
    console.error("Error fetching plants in nursery:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to create the stored procedure to get plants in the nursery
async function createGetPlantsInNurseryProcedure() {
  try {
    const getPlantsInNurseryProcedure = `
            CREATE PROCEDURE GetPlantsInNursery(IN p_userId INT)
BEGIN
    SELECT
        plants.p_id,
        plants.common_name,
        plants.watering,
        plants.sunlight
    FROM
        nursery
    JOIN plants ON
        nursery.p_id = plants.p_id
        AND nursery.UserID = p_userId;
END;

        `;

    // Execute the procedure creation query
    await connection.promise().query(getPlantsInNurseryProcedure);
  } catch (error) {
    console.error("Error creating stored procedure:", error);
    throw error;
  }
}

// Function to get plants in the user's nursery using the stored procedure
async function gettPlantsInNursery(userId) {
  const query = "CALL GetPlantsInNursery(?)";
  const params = [userId];

  try {
    const [rows] = await connection.promise().query(query, params);

    if (rows.length > 0) {
      const plantsInNursery = rows[0].map((row) => ({
        p_id: row.p_id,
        common_name: row.common_name,
        watering: row.watering,
        sunlight: row.sunlight,
      }));

      return plantsInNursery;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Function to create the stored procedure to get plant details by ID
// Function to create the stored procedure to get plant details by ID
async function createGetPlantDetailsProcedure() {
  try {
    const getPlantDetailsProcedure = `
      CREATE PROCEDURE GetPlantDetailsById(IN p_plantId INT)
      BEGIN
          SELECT
              p_id,
              common_name,
              scientific_name,
              cycle,
              watering,
              sunlight,
              image_url
          FROM
              plants
          WHERE
              p_id = p_plantId;
      END;
    `;

    // Execute the procedure creation query
    await connection.promise().query(getPlantDetailsProcedure);
  } catch (error) {
    console.error("Error creating stored procedure:", error);
    throw error;
  }
}

// Function to get plant details by ID using the stored procedure
async function getPlantDetailsById(plantId) {
  const query = "CALL GetPlantDetailsById(?)";
  const params = [plantId];

  try {
    const [rows] = await connection.promise().query(query, params);

    if (rows.length > 0) {
      // Modify the result to include the image URL
      const plantDetails = {
        p_id: rows[0][0].p_id,
        common_name: rows[0][0].common_name,
        scientific_name: rows[0][0].scientific_name,
        cycle: rows[0][0].cycle,
        watering: rows[0][0].watering,
        sunlight: rows[0][0].sunlight,
        image_url: rows[0][0].image_url, // Include image URL
      };

      return plantDetails;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// API endpoint for removing plants from the nursery
app.post("/removeFromNursery", async (req, res) => {
  const { userId, plantId } = req.body;

  if (!userId || !plantId) {
    return res.status(400).json({ error: "UserID and PlantID are required" });
  }

  try {
    // Call the stored procedure to remove from the nursery table
    await removeFromNursery(userId, plantId);

    res.json({ success: true, message: "Plant removed from the nursery" });
  } catch (error) {
    console.error("Error removing plant from nursery:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to remove from the nursery table using a stored procedure
async function removeFromNursery(userId, plantId) {
  try {
    const removeProcedure = `
      CREATE PROCEDURE RemoveFromNursery(IN p_userId INT, IN p_plantId INT)
      BEGIN
          DELETE FROM nursery
          WHERE UserID = p_userId AND p_id = p_plantId;
      END;
    `;

    // Check if the procedure exists
    const checkProcedureQuery =
      "SHOW PROCEDURE STATUS LIKE 'RemoveFromNursery';";
    const [procedureRows] = await connection
      .promise()
      .query(checkProcedureQuery);

    if (procedureRows.length === 0) {
      // Create the stored procedure
      await connection.promise().query(removeProcedure);
    }

    // Call the stored procedure to remove from the nursery table
    await connection
      .promise()
      .query("CALL RemoveFromNursery(?, ?)", [userId, plantId]);
  } catch (error) {
    console.error("Error removing from nursery table:", error);
    throw error;
  }
}

//

// Procedure to create the log_activity table
async function createLogActivityTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS log_activity (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uid INT  ,
        plant_name VARCHAR(255) NOT NULL,
        activity_date DATE ,
        activity_time TIME ,
        FOREIGN KEY (uid) REFERENCES users(ID)
      );
    `;

    // Execute the table creation query
    await connection.promise().query(createTableQuery);
    console.log("log_activity table created successfully");
  } catch (error) {
    console.error("Error creating log_activity table:", error);
    throw error;
  }
}

createLogActivityTable();
// Function to log activity
// Function to log activity
async function logActivity(uid, plantName) {
  try {
    const logActivityQuery = `
      INSERT INTO log_activity (uid, plant_name, activity_date, activity_time)
      VALUES (?, ?, curdate(),curtime());
    `;

    // Execute the query to log the activity
    await connection.promise().query(logActivityQuery, [uid, plantName]);
    console.log(`Activity logged for ${plantName} at ${new Date()}`);
  } catch (error) {
    console.error("Error logging activity:", error);

    // Log additional information for troubleshooting
    if (error.code === "ER_TRUNCATED_WRONG_VALUE") {
      console.error(
        "This error may occur if the data you're trying to insert does not match the column types in the log_activity table."
      );
    }

    // Send the error message to the client for better debugging
    throw new Error("Internal server error: Unable to log activity");
  }
}

// API endpoint for logging activity
app.post("/logActivity", async (req, res) => {
  const { uid, plantName } = req.body;

  if (!uid || !plantName) {
    return res
      .status(400)
      .json({ error: "User ID and plant name are required" });
  }

  try {
    // Call the logActivity function to log the activity
    await logActivity(uid, plantName);

    res.json({ success: true, message: "Activity logged successfully" });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ error: error.message }); // Send the detailed error message to the client
  }
});

async function getActivityLogs(userId, plantName) {
  const query =
    "SELECT * FROM log_activity WHERE uid = ? AND plant_name = ? ORDER BY activity_timestamp DESC";
  const params = [userId, plantName];

  try {
    const [rows] = await connection.promise().query(query, params);

    if (rows.length > 0) {
      const activityLogs = rows.map((row) => ({
        id: row.id,
        uid: row.uid,
        plant_name: row.plant_name,
        activity_timestamp: row.activity_timestamp,
      }));

      return activityLogs;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// API endpoint to get activity logs for a specific user and plant name
app.get("/getActivityLogs", async (req, res) => {
  const userId = req.query.userId;
  const plantName = req.query.plantName;

  if (!userId || !plantName) {
    return res
      .status(400)
      .json({ error: "User ID and plant name are required" });
  }

  try {
    // Fetch activity logs for the user and plant name from the log_activity table
    const logsQuery =
      "SELECT * FROM log_activity WHERE uid = ? AND plant_name = ?";
    const [logs] = await connection
      .promise()
      .query(logsQuery, [userId, plantName]);

    // Return the activity logs as JSON
    res.json({ activityLogs: logs });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
