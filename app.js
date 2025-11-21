// firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { firebaseConfig } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
console.log("Firebase Connected!");

// dom elemnents
document.addEventListener('DOMContentLoaded', () => {  
    
    const navAuthButton = document.getElementById('nav-auth-button');
    const profileMenu = document.getElementById('nav-profile-menu');
    const profileIcon = document.getElementById('nav-profile-icon');
    const profileIconSmall = document.querySelector('.profile-icon-small');
    const dropdown = document.getElementById('nav-profile-dropdown');
    const dropdownEmail = document.getElementById('nav-profile-email');
    const logoutButton = document.getElementById('nav-logout-button');

    // Only run this if the navbar elements actually exist on this page
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

    // listeners for dropdown
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
