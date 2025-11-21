// firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyAG06yCw10c6zwjKpCaLQduR08LjmGAQQA",
  authDomain: "fixel-web-app.firebaseapp.com",
  projectId: "fixel-web-app",
  storageBucket: "fixel-web-app.firebasestorage.app",
  messagingSenderId: "911197648138",
  appId: "1:911197648138:web:b8ec697473a698955bf6f3"
};

// intilializing and rxporting firebase
// We initialize here and export the services for other script files to use
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
console.log("Firebase Connected!");

// global header 
document.addEventListener('DOMContentLoaded', () => {  
    
    const navAuthButton = document.getElementById('nav-auth-button');
    const profileMenu = document.getElementById('nav-profile-menu');
    const profileIcon = document.getElementById('nav-profile-icon');
    const profileIconSmall = document.querySelector('.profile-icon-small');
    const dropdown = document.getElementById('nav-profile-dropdown');
    const dropdownEmail = document.getElementById('nav-profile-email');
    const logoutButton = document.getElementById('nav-logout-button');

    if (!navAuthButton || !profileMenu || !profileIcon) {  
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (user.emailVerified) {
                // Hide Sign Up, show profile
                navAuthButton.style.display = 'none'; 
                profileMenu.style.display = 'block';   

                // Set profile info
                const userEmail = user.email || 'User';
                const firstLetter = userEmail.charAt(0).toUpperCase();
                profileIcon.textContent = firstLetter;
                if (profileIconSmall) profileIconSmall.textContent = firstLetter;
                if (dropdownEmail) dropdownEmail.textContent = userEmail;
            
            } 
            else {
                // If they are on any page except login.html, log them out.
                if (!window.location.pathname.includes('login.html')) {
                    console.warn('User not verified, logging out and redirecting to login.');
                    signOut(auth); 
                    window.location.href = 'login.html'; 
                }
            }
        } 
        else {
            navAuthButton.style.display = 'block';
            profileMenu.style.display = 'none';
            if (dropdown) dropdown.classList.remove('show');   
        }
    });

    // listners for dropdown
    profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).catch(err => console.error('Sign out error', err));
    });

    window.addEventListener('click', (e) => {
        if (dropdown && dropdown.classList.contains('show') && !profileIcon.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});