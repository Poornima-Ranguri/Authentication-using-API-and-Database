const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "userData.db");

let database = null;

const initializeDbAndServer = async () => {
  database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });

  app.listen(3000, () => {
    console.log("Server is Running at localhost//:3000");
  });
};

initializeDbAndServer();

//API 1 CREATE USER

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
        SELECT 
          *
        FROM
            user
        WHERE
            username = '${username}';    
  `;
  const dbUser = await database.get(selectUserQuery);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
                    INSERT INTO 
                            user(username, name, password, gender, location)
                    VALUES 
                        (
                            '${username}',
                            '${name}',
                            '${hashedPassword}',
                            '${gender}',
                            '${location}'
                        );        


            `;

      await database.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
        SELECT 
          *
        FROM
            user
        WHERE
            username = '${username}';    
  `;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    //User doesn't exist
    response.status(400);
    response.send("Invalid user");
  } else {
    //compare password, hashed password
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 Change-Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
        SELECT 
          *
        FROM
            user
        WHERE
            username = '${username}';    
  `;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfPassword = newPassword.length;
      if (lengthOfPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        //Update Passwd
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                UPDATE
                    user
                SET
                    password = '${encryptedPassword}'
                WHERE 
                    username = '${username}';        
        `;
        await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
