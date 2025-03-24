// Function to set theme
function setTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (document.getElementById('theme-toggle')) {
        const icon = document.getElementById('theme-toggle').querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      }
    } else {
      document.body.classList.remove('dark-theme');
      if (document.getElementById('theme-toggle')) {
        const icon = document.getElementById('theme-toggle').querySelector('i');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  }
  
  // Check for saved theme preference or use device preference
  document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    // Add event listener to theme toggle button if it exists
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        if (document.body.classList.contains('dark-theme')) {
          localStorage.setItem('theme', 'light');
          setTheme('light');
        } else {
          localStorage.setItem('theme', 'dark');
          setTheme('dark');
        }
      });
    }
    
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (loggedInUser && authButtons) {
      // Replace login/register buttons with user info
      authButtons.innerHTML = `
        <div class="user-info">
          <span>Logged in as <strong>${loggedInUser}</strong></span>
          <button class="btn btn-logout" onclick="logout()">Log Out</button>
        </div>
      `;
    }
  });
  
  // Logout function
  function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.reload();
  }
  