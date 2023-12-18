const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 5501;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root", // Replace with your MySQL password
});

// Create the "plant_care" database if it doesn't exist
connection.query("CREATE DATABASE IF NOT EXISTS plant_care", (err) => {
  if (err) {
    console.error("Error creating database:", err);
    connection.end();
    return;
  }

  console.log("Database 'plant_care' is ready");

  // Connect to the "plant_care" database
  connection.changeUser({ database: "plant_care" }, (err) => {
    if (err) {
      console.error("Error connecting to database:", err);
      connection.end();
      return;
    }

    // Create the "users" table if it doesn't exist
    connection.query(
      "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), email VARCHAR(255), password VARCHAR(255))",
      (err) => {
        if (err) {
          console.error("Error creating users table:", err);
          connection.end();
          return;
        }

        console.log("Table 'users' is ready");

        // Create "before insert" triggers
        createUsernameTrigger();
        createEmailTrigger();
        createInsertUserProcedure();

        // Continue with the rest of your code here

        // API endpoint for user registration
        app.post("/register", async (req, res) => {
          const { username, email, password } = req.body;

          const hashedPassword = await bcrypt.hash(password, 10);
          const tableExists = "SHOW table STATUS LIKE 'nursery';";
          const [tableRows] = await connection.promise().query(tableExists);
          // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

          if (tableRows.length === 0) {
            // Create the stored procedure
            await createNurseryTable();
          }

          // const procedureExists = "SHOW procedure STATUS LIKE 'InsertUser';";
          // const [procedureRows] = await connection
          //   .promise()
          //   .query(procedureExists);
          // // const procedureExists = await checkIfProcedureExists("GetPlantDetailsById");

          // if (procedureRows.length === 0) {
          //   // Create the stored procedure
          //   await createInsertUserProcedure();
          // }

          // Insert user into the database
          // const procedureSql = "CALL InsertUser(?, ?, ?)";
          // const sql =
          //   "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
          // connection.query(
          //   sql,
          //   [username, email, hashedPassword],
          //   (err, results) => {
          //     if (err) {
          //       console.error("Error inserting user:", err);
          //       return res.status(500).json({ error: "Internal Server Error" });
          //     }

          //     console.log("User registered successfully");
          //     return res
          //       .status(200)
          //       .json({ message: "User registered successfully" });
          //   }
          // );
          connection.query(
            "CALL InsertUser(?, ?, ?)",
            [username, email, hashedPassword],
            (err, results) => {
              if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              console.log("User registered successfully");
              return res
                .status(200)
                .json({ message: "User registered successfully" });
            }
          );
        });

        // Start the server
        app.listen(port, () => {
          console.log(`Server is running on http://localhost:${port}`);
        });
      }
    );
  });
});

// Helper function to create a "before insert" trigger for username
// Helper function to create a "before insert" trigger for username
function createUsernameTrigger() {
  const triggerName = "before_insert_username";
  const checkTriggerSql = `
    SELECT COUNT(*) AS trigger_count
    FROM information_schema.triggers
    WHERE trigger_name = ? AND event_object_table = 'users';
  `;

  connection.query(checkTriggerSql, [triggerName], (err, results) => {
    if (err) {
      console.error("Error checking username trigger existence:", err);
    } else {
      const triggerCount = results[0].trigger_count;
      if (triggerCount === 0) {
        // Trigger does not exist, create it
        createTrigger("before_insert_username", usernameTriggerSql);
      } else {
        console.log("Username trigger already exists");
      }
    }
  });
}

// Helper function to create a "before insert" trigger for email
function createEmailTrigger() {
  const triggerName = "before_insert_email";
  const checkTriggerSql = `
    SELECT COUNT(*) AS trigger_count
    FROM information_schema.triggers
    WHERE trigger_name = ? AND event_object_table = 'users';
  `;

  connection.query(checkTriggerSql, [triggerName], (err, results) => {
    if (err) {
      console.error("Error checking email trigger existence:", err);
    } else {
      const triggerCount = results[0].trigger_count;
      if (triggerCount === 0) {
        // Trigger does not exist, create it
        createTrigger("before_insert_email", emailTriggerSql);
      } else {
        console.log("Email trigger already exists");
      }
    }
  });
}

// Helper function to create a trigger
function createTrigger(triggerName, triggerSql) {
  connection.query(triggerSql, (err) => {
    if (err) {
      console.error(`Error creating ${triggerName} trigger:`, err);
    } else {
      console.log(`${triggerName} trigger created successfully`);
    }
  });
}

// Define trigger SQL statements
const usernameTriggerSql = `
  CREATE TRIGGER before_insert_username
  BEFORE INSERT ON users
  FOR EACH ROW
  BEGIN
    DECLARE username_count INT;
    SELECT COUNT(*) INTO username_count FROM users WHERE username = NEW.username;
    IF username_count > 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Username already exists';
    END IF;
  END;
`;

const emailTriggerSql = `
  CREATE TRIGGER before_insert_email
  BEFORE INSERT ON users
  FOR EACH ROW
  BEGIN
    DECLARE email_count INT;
    SELECT COUNT(*) INTO email_count FROM users WHERE email = NEW.email;
    IF email_count > 0 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Email already exists';
    END IF;
  END;
`;

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

function createInsertUserProcedure() {
  const procedureName = "InsertUser";
  const checkProcedureSql = `
    SELECT COUNT(*) AS procedure_count
    FROM information_schema.routines
    WHERE routine_name = ?;
  `;

  connection.query(checkProcedureSql, [procedureName], (err, results) => {
    if (err) {
      console.error("Error checking InsertUser procedure existence:", err);
    } else {
      const procedureCount = results[0].procedure_count;
      if (procedureCount === 0) {
        // Procedure does not exist, create it
        createProcedure("InsertUser", insertUserProcedureSql);
      } else {
        console.log("InsertUser procedure already exists");
      }
    }
  });
}

// Helper function to create a stored procedure
function createProcedure(procedureName, procedureSql) {
  connection.query(procedureSql, (err) => {
    if (err) {
      console.error(`Error creating ${procedureName} procedure:`, err);
    } else {
      console.log(`${procedureName} procedure created successfully`);
    }
  });
}

// Define stored procedure SQL statement
const insertUserProcedureSql = `
  CREATE PROCEDURE InsertUser(
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255)
  )
  BEGIN
    -- Insert user into the database
    INSERT INTO users (username, email, password)
    VALUES (p_username, p_email, p_password);
  END;
`;
