document.addEventListener("DOMContentLoaded", function () {
  const formFields = document.querySelectorAll(".user-box input");
  const usernameField = formFields[0];
  const passwordField = formFields[1];
  const overlay = document.querySelector(".overlay");
  //   const passwordField = document.getElementById("password");
  const showPasswordButton = document.getElementById("showPassword");
  const signInButton = document.querySelector(".login-box a");
  const resultBox = document.createElement("div");
  resultBox.classList.add("result-box");

  // Append resultBox to the login box
  document.querySelector(".login-box").appendChild(resultBox);

  signInButton.addEventListener("click", function (event) {
    event.preventDefault();

    const username = usernameField.value;
    const password = passwordField.value;

    signInUser({
      email: username,
      password: password,
    });
  });

  showPasswordButton.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }
  });

  passwordField.addEventListener("keyup", function (event) {
    // Check if the "Enter" key is pressed
    if (event.key === "Enter") {
      const username = usernameField.value;
      const password = passwordField.value;

      signInUser({
        email: username,
        password: password,
      });
    }
  });

  function signInUser(data) {
    fetch("http://localhost:5502/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Handle specific error status codes
          if (response.status === 401) {
            const errorData = await response.json();
            console.error("Login error:", errorData.error);
            showResult("Login error: " + errorData.error, "error");
          } else {
            console.error("Login error:", response.statusText);
            showResult("Login error: Something went wrong", "error");
          }
          throw new Error("Login failed");
        }
        return response.json();
      })
      .then((data) => {
        // Handle successful login
        console.log(data);
        console.log(data.message);
        localStorage.setItem("usersd", JSON.stringify(data.username));
        localStorage.setItem("emaild", JSON.stringify(usernameField.value));
        localStorage.setItem("id", JSON.stringify(data.userId));
        showResult("Login Successful", "success", true, data.username); // Redirect to index.html
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function showResult(message, type, success) {
    resultBox.textContent = message;
    resultBox.className = `result-box ${type}`;
    resultBox.style.display = "block";

    overlay.style.display = "block"; // Show the overlay
    document.body.style.overflow = "hidden"; // Disable scrolling

    // Hide the result box and overlay after a few seconds (adjust the timeout as needed)
    setTimeout(() => {
      resultBox.style.display = "none";
      overlay.style.display = "none";
      document.body.style.overflow = "auto"; // Enable scrolling

      if (success) {
        window.location.href = "home.html";
      } else {
        window.location.href = "signin.html";
      }
    }, 3000);
  }
});
