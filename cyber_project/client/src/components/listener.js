document.getElementById("generate-otp-button").addEventListener("click", async () => {
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;
  
    try {
      // Send a request to generate and send the OTP
      const response = await fetch("/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      
      if (response.ok) {
        // OTP generation successful, display the OTP form
        document.getElementById("otp-form").style.display = "block";
      } else {
        // OTP generation failed
        const errorData = await response.json();
        console.log(errorData); // Handle or display the error message
      }
    } catch (error) {
      console.error(error);
      // Handle the error
    }
  });
  
  

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;
    const otp = document.getElementById("otp-input").value;
  
    try {
      // Send the login request with email, password, and OTP
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, otp }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Login successful
        const token = data.token;
        // Store the token in localStorage or sessionStorage as needed
        // Redirect the user to the authenticated area or perform any other necessary actions
      } else {
        // Login failed
        console.log(data); // Handle or display the error message
      }
    } catch (error) {
      console.error(error);
      // Handle the error
    }
  });
  