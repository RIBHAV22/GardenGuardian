# Garden Guardians

Garden Guardians is a web application for plant enthusiasts to manage their plant collections. The project includes a Node.js backend with a MySQL database for storing plant and user data, and a simple front-end interface.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MySQL](https://www.mysql.com/)

## Getting Started

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/garden-guardians.git

2. **Navigate to the Project Directory:**
   ```bash
   cd garden-guardians

3. **Install Dependencies:**
   ```bash
   npm install express
   npm install mysql2
   npm install cors
   npm install bcrypt
   npm install body-parser
   npm install express-session
   npm install crypto

Or, if you are lazy like me, just double click installDependencies.bat!
   
4. **Configure Database Details:**
   Update the database configuration (your username and password) in plant.js, loginUser.js, registerUser.js and fetchPlant.js. The database and the corresponding tables will be created automatically!

5. **Start the Server:**
   Its as simple as double clicking the start.bat! After that, double click the getPlants.bat and wait for around 2-3 mins for the plants table to be created.
   Yes! Its that easy!

6. **Getting Started:**
   Simply open up index.html on your browser and Get Started!

## Additional Notes
- Uses HTML, CSS, Javascript for Front-End (Website)
- Node.js as the Backend (APIs)
- The project uses MySQL for data storage. Make sure your MySQL server is running and correctly configured.
- If you encounter any issues, check the console logs for error messages.
- If, and if by any chance the getPlants.bat doesnt work and cant properly create table, please go into fetchPlant.js, and change the API key to one of these:

  sk-6nu5655a484ce86f83018

  sk-ipfM655a487c289123019

**Happy gardening!**
