document.addEventListener('DOMContentLoaded', function() {
    // This script assumes firebase.initializeApp(firebaseConfig) has been called in app.js
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not loaded. Make sure app.js is included and initializes Firebase.");
        // Display an error on the login page if it's the current page
        const errorMessage = document.getElementById('error-message');
        if(errorMessage) errorMessage.textContent = "Error: Firebase connection failed.";
        return;
    }

    // --- Firebase Services ---
    const auth = firebase.auth();
    const db = firebase.firestore();

    const path = window.location.pathname;

    // --- Auth State Observer ---
    // This runs on every page that includes this script.
    // It handles redirects and page visibility based on auth state.
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            if (path.includes('login.html')) {
                // If they are on the login page, they should be sent to the admin panel.
                window.location.replace('admin.html');
            } else if (path.includes('admin.html')) {
                // If they are on the admin page, make the content visible.
                document.body.style.visibility = 'visible';
            }
        } else {
            // User is signed out.
            if (path.includes('admin.html')) {
                // If they are on the admin page without being logged in, send them to the login page.
                window.location.replace('login.html');
            }
        }
    });

    // --- Login Page Specific Logic ---
    if (path.includes('login.html')) {
        const authForm = document.getElementById('auth-form');
        const title = document.getElementById('form-title');
        const subtitle = document.getElementById('form-subtitle');
        const submitBtn = document.getElementById('submit-btn');
        const confirmPasswordField = document.getElementById('confirm-password');
        const errorMessage = document.getElementById('error-message');

        // --- UPDATED LOGIC ---
        // We will now always default to Sign In mode and remove the creation logic.

        // Function to set the form to Sign In mode
        const setSignInMode = () => {
            title.textContent = 'Admin Login';
            subtitle.textContent = 'Enter your credentials to access the admin panel.';
            submitBtn.textContent = 'Login';
            if(confirmPasswordField) confirmPasswordField.style.display = 'none';
        };
        
        // Immediately set the form to Sign In Mode
        setSignInMode();

        // Handle form submission for SIGN IN ONLY
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = authForm.email.value;
            const password = authForm.password.value;
            errorMessage.textContent = ''; // Clear previous errors

            // --- SIGN IN LOGIC ---
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging In...';

            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Successful sign in. The onAuthStateChanged observer will handle the redirect.
                })
                .catch((error) => {
                    errorMessage.textContent = "Invalid email or password.";
                })
                 .finally(() => {
                    // Re-enable the button
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                });
        });
    }

    // --- Admin Page Specific Logic (Sign Out Button) ---
    if (path.includes('admin.html')) {
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut().then(() => {
                    // Redirect to login page on successful sign out.
                    window.location.replace('login.html');
                }).catch(error => {
                    console.error('Sign out error', error);
                    alert('Could not sign out. Please try again.');
                });
            });
        }
    }
});