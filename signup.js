document.addEventListener("DOMContentLoaded", function () {
  const formFields = document.querySelectorAll(".c-form__input");
  const passwordField = document.getElementById("fpass");
  const confirmPasswordField = document.getElementById("confirmPassword");

  let registrationStep = 0; // Track the current registration step

  formFields.forEach((field, index) => {
    const nextButtons = document.querySelectorAll(".c-form__next");
    const border = document.querySelectorAll(".c-form__border");

    confirmPasswordField.addEventListener("input", function () {
      if (passwordField.value !== confirmPasswordField.value) {
        nextButtons[3].classList.add("disabled");
        nextButtons[3].style.color = "#ff0033";
        border[3].style.color = "#ff0033";
        confirmPasswordField.setCustomValidity("Passwords do not match");
      } else {
        nextButtons[3].classList.remove("disabled");
        nextButtons[3].style.color = "#00ed64";
        border[3].style.color = "#00ed64";
        confirmPasswordField.setCustomValidity("");
      }
    });

    nextButtons[3].addEventListener("click", function () {
      if (passwordField.value !== confirmPasswordField.value) {
        // Handle passwords not matching
        const groupLabel = confirmPasswordField
          .closest(".c-form__group")
          .querySelector(".c-form__groupLabel");
        groupLabel.innerHTML = "Password not the same";
        groupLabel.classList.add("c-form__group-label--error");

        // Show error message and change background color to red
        showResult("Registration Failed: Passwords do not match", "error");

        // Redirect to signup.html after 3 seconds
        setTimeout(() => {
          window.location.href = "signup.html";
        }, 3000);
      } else {
        const groupLabel = confirmPasswordField
          .closest(".c-form__group")
          .querySelector(".c-form__groupLabel");
        groupLabel.innerHTML = "Confirm your password.";
        groupLabel.classList.remove("c-form__group-label--error");

        // Increment the registration step
        registrationStep++;

        if (registrationStep === 4) {
          // Register the user only if they have completed the entire form
          registerUser({
            username: document.getElementById("username").value,
            email: document.getElementById("femail").value,
            password: document.getElementById("fpass").value,
          });
        }
      }
    });

    // ... (rest of your existing code remains unchanged)

    field.addEventListener("keyup", function (event) {
      const nextButton = field
        .closest(".c-form__group")
        .querySelector(".c-form__nextIcon");
      if (event.key === "Enter") {
        event.preventDefault();
        if (nextButton) {
          if (
            nextButton.classList.contains("disabled") ||
            (field.id === "femail" && !isValidEmail(field.value))
          ) {
            // Handle validation errors or display messages here
            console.log("Email is not valid.");
          } else if (
            nextButton.classList.contains("disabled") ||
            (field.id === "confirmPassword" && !arePasswordsEqual())
          ) {
            // Handle validation errors or display messages here
            console.log("Passwords are not equal.");
          } else {
            nextButton.click();
          }
        }
      }
    });
  });

  function isValidEmail(email) {
    // Use a regular expression to validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function arePasswordsEqual() {
    const passwordField = document.getElementById("fpass");
    const confirmPasswordField = document.getElementById("confirmPassword");
    return passwordField.value === confirmPasswordField.value;
  }

  function registerUser(data) {
    fetch("http://localhost:5501/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          // Check for specific error status codes
          if (response.status === 400) {
            return response.json().then((data) => {
              // Handle username/email already exists error
              console.error("Registration error:", data.error);

              // Show error message and change background color to red
              showResult("Registration Failed: User already exists", "error");

              // Redirect to signup.html after 3 seconds
              setTimeout(() => {
                window.location.href = "signup.html";
              }, 3000);
            });
          } else {
            // Handle other error cases
            console.error("Registration error:", response.statusText);

            // Show error message and change background color to red
            showResult("Registration Failed: Something went wrong", "error");
          }
          throw new Error("Registration failed");
        }
        return response.json();
      })
      .then((data) => {
        // Handle successful registration
        console.log(data.message);

        // Show success message and change background color to green
        showResult(
          "Welcome aboard! You have been successfully registered",
          "success"
        );

        // Redirect to index.html after 3 seconds
        setTimeout(() => {
          window.location.href = "index.html";
        }, 3000);
      })
      .catch((error) => {
        // Handle network or other unexpected errors
        console.error("Error:", error);

        // Redirect to signup.html after 3 seconds
        setTimeout(() => {
          window.location.href = "signup.html";
        }, 3000);
      });
  }

  function showResult(message, type) {
    // Create a result box dynamically
    const resultBox = document.createElement("div");
    resultBox.classList.add("result-box", type);
    resultBox.textContent = message;

    // Append resultBox to the body
    document.body.appendChild(resultBox);

    // Change background color to red for error, and green for success
    const progress = document.querySelector(".c-form__progress");
    progress.style.backgroundColor = type === "error" ? "#ff0033" : "#00684a";

    // Hide the result box and reset background color after 3 seconds
    setTimeout(() => {
      resultBox.style.display = "none";
      document.body.style.backgroundColor = "";
    }, 3000);
  }
});
