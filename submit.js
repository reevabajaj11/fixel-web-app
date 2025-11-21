// firebase imports
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth } from './app.js'; 
import { knownApps } from './appData.js'; // <--- IMPORT THE DATASET

const reportsCollection = collection(db, "reports");

console.log("Submit Script Loaded");


// form logic
document.addEventListener("DOMContentLoaded", () => {
    const submitForm = document.getElementById("submit-idea-form");
    const submitFieldset = document.getElementById("submit-fieldset");
    const loginPrompt = document.getElementById("login-prompt-message");
    const submitButton = document.getElementById("submit-btn");
    
    // Input fields for auto-fill logic
    const appNameInput = document.getElementById("appName");
    const appCategorySelect = document.getElementById("appCategory");

    // enable submit-form only if user is logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in, enabling submit form.");
            submitFieldset.disabled = false;
            loginPrompt.style.display = 'none';
        } else {
            console.log("No user logged in, disabling submit form.");
            submitFieldset.disabled = true;
            loginPrompt.style.display = 'block';
            submitButton.textContent = "Please Sign In to Submit";
        }
    });

    // Auto-fill category logic
    if (appNameInput && appCategorySelect) {
        appNameInput.addEventListener('input', (e) => {
            const userInput = e.target.value.toLowerCase().trim();
            
            // Check if this app exists in the dataset
            if (knownApps[userInput]) {
                const suggestedCategory = knownApps[userInput].category;
                Array.from(appCategorySelect.options).forEach(option => {
                    if (option.value === suggestedCategory) {
                        appCategorySelect.value = suggestedCategory;
                    }
                });
            }
        });
    }

    // submitting the form
    if (submitForm) {
        submitForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            try {
                const newReport = {
                    title: document.getElementById("title").value,
                    description: document.getElementById("description").value,
                    appName: document.getElementById("appName").value, // Save exactly what user typed
                    appCategory: document.getElementById("appCategory").value,
                    reportType: document.getElementById("reportType").value,
                    status: "Open",
                    upvotes: 0,
                    commentCount: 0,
                    createdAt: serverTimestamp(), 
                    upvotedBy: []
                };

                console.log("Adding document...");
                await addDoc(reportsCollection, newReport);
                
                window.location.href = "index.html";

            } catch (error) {
                console.error("Error adding document: ", error);
                submitButton.disabled = false;
                submitButton.textContent = "Submit Idea";
            }
        });
    }
});