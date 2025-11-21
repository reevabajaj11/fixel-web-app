# 🛠️ Fixel  - **Your one-stop space to explore gaps in your favorite apps.**

Fixel is a community-driven platform where users can report bugs, suggest feature requests, highlight performance issues, and propose UI/UX improvements for popular applications. It bridges the gap between users and developers by crowdsourcing feedback and validating issues through community engagement.

🔗 **Live Demo:** [https://fixel-web-app.web.app](https://fixel-web-app.web.app)

---

# 🚀 Features

* **Explore Gaps:** Browse a feed of reported issues across various categories (Social Media, Productivity, Entertainment, etc.).
* **Smart Filtering & Sorting:**

  * Filter by Category (e.g., Social Media, Games) and Status (Open, In Progress, Solved).
  * Sort by *Trending* to see the most upvoted issues.
  * Real-time search functionality.
* **Submit Ideas:** Submit detailed reports including App Name, Category, Issue Type (Bug, Feature Request, etc.), and Description.
* **Intelligent Auto-Fill:** Automatically detects popular apps (Instagram, WhatsApp, Google, etc.) and applies their brand colors and categories.
* **Community Engagement:**

  * **Upvoting** to validate issues.
  * **Comments** for discussing potential fixes or workarounds.
* **Authentication:** Secure Email/Password Sign-Up, Google Sign-In, and Email Verification.
* **Responsive Design:** Fully responsive UI built with custom CSS for Mobile, Tablet, and Desktop.

---

# 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
* **Backend (BaaS):** Firebase

  * **Authentication:** Email/Password + Google
  * **Firestore:** NoSQL DB for storing reports & comments
  * **Hosting:** Firebase Hosting
* **Icons:** FontAwesome
* **Fonts:** Inter (Google Fonts)

---

# 📂 Project Structure

```
.
├── index.html          # Home/Landing page
├── login.html          # Authentication page
├── submit.html         # Form for submitting new gaps
├── report.html         # Detailed view for specific reports
├── how-it-works.html   # Explainer page
├── style.css           # Global stylesheet
├── app.js              # Firebase init & auth state mgmt
├── auth.js             # Login/Signup/Verification logic
├── script.js           # Fetching & rendering issue cards
├── submit.js           # Submission handling
├── report.js           # Comments + individual report logic
├── appData.js          # App dataset for autofill features
├── config.js           # Firebase config (ignored in repo)
└── README.md
```

---

# 💻 Local Development Setup

### **1. Fork and Clone the Repository**

Click **Fork** → then clone your fork.

```
git clone https://github.com/YOUR_USERNAME/fixel-web-app.git
cd fixel-web-app
```

### **2. Add Firebase Configuration**

Since `config.js` is ignored for security, create it manually:

1. Go to **Firebase Console** → Create a new project.
2. Enable **Firestore** and **Authentication** (Email/Password + Google Provider).
3. Go to: Project Settings → General → Your apps → Web App.
4. Copy the firebaseConfig object.
5. Create a file named **config.js** inside the project folder.

```
// Replace with your own Firebase credentials
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### **3. Run the Project Locally**

Because the project uses ES6 modules, you must run it using a local server.

**Option A: VS Code Live Server**

* Install the *Live Server* extension.
* Right-click `index.html` → **Open with Live Server**.

**Option B: Python Server**

```
python -m http.server 8000
```

Then open: [http://localhost:8000](http://localhost:8000)

---

# 🛡️ Firestore Security Rules

*(For development only, do NOT use in production!)*

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

# 🤝 Contributing

1. Fork the repo
2. Create a branch:

```
git checkout -b feature/AmazingFeature
```

3. Commit changes:

```
git commit -m "Add AmazingFeature"
```

4. Push branch:

```
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

# 📜 License

Distributed under the **MIT License**.
