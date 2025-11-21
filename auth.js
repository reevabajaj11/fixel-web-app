// firebase imports
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, sendEmailVerification} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// importing auth connection from app.js
import { auth } from './app.js';

// getting auth
const googleProvider = new GoogleAuthProvider();  
console.log("auth.js connected and using shared 'auth' instance.");

// variables (dom elements)
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const showSignupLink = document.getElementById('show-signup-link');
const showLoginLink = document.getElementById('show-login-link');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');  
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const googleSigninBtn = document.getElementById('google-signin-btn');
const googleSignupBtn = document.getElementById('google-signup-btn');
const verificationPendingContainer = document.getElementById('verification-pending-container');
const verificationEmail = document.getElementById('verification-email');
const resendVerificationBtn = document.getElementById('resend-verification-btn');
const backToLoginLink = document.getElementById('back-to-login-link');


let resendTimerInterval = null;
const RESEND_COOLDOWN = 60; // 60 seconds

// password toggle
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId); 

    if (input && toggle) {  
        toggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.classList.toggle('fa-eye', isPassword);
            toggle.classList.toggle('fa-eye-slash', !isPassword);
        });
    }
}

// login or signup
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#signup') {
        showSignup();
    }
    else {
        showLogin();
    }
    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('signup-password', 'toggle-signup-password');
    setupPasswordToggle('signup-confirm-password', 'toggle-signup-confirm-password');
});

// form toggling
function showLogin() {
    loginFormContainer.style.display = 'block';
    signupFormContainer.style.display = 'none';
    verificationPendingContainer.style.display = 'none';
    if (resendTimerInterval) clearInterval(resendTimerInterval);
}

function showSignup() {
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
    verificationPendingContainer.style.display = 'none';
    if (resendTimerInterval) clearInterval(resendTimerInterval);
}

function showVerificationPending(email) {
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'none';
    verificationPendingContainer.style.display = 'block';
    verificationEmail.textContent = email;
    startResendTimer();
}

function startResendTimer() {
    if (resendTimerInterval) clearInterval(resendTimerInterval);
    let timer = RESEND_COOLDOWN;
    resendVerificationBtn.disabled = true;
    resendVerificationBtn.textContent = `Resend Email (1:00)`;
    resendTimerInterval = setInterval(() => {
        timer--;
        const seconds = timer < 10 ? `0${timer}` : timer;
        resendVerificationBtn.textContent = `Resend Email (0:${seconds})`;
        if (timer <= 0) {
            clearInterval(resendTimerInterval);
            resendVerificationBtn.disabled = false;
            resendVerificationBtn.textContent = 'Resend Email';
        }
    }, 1000);
}

// setting URL rules
const actionCodeSettings = {
    url: `${window.location.origin}/index.html`,
    handleCodeInApp: true
};

resendVerificationBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        sendEmailVerification(user, actionCodeSettings)
            .then(() => {
                console.log('Verification email resent.');
                startResendTimer();
            })
            .catch((error) => {
                console.error('Error resending email:', error);
                showAuthError(loginError, error);
            });
    } else {
        showLogin();
        showAuthError(loginError, { code: 'auth/resend-error' });
    }
});

showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });
showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// helper functions (catching errors)
function showAuthError(errorElement, error) {
    errorElement.style.display = 'block';
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            errorElement.textContent = 'Invalid email or password.';
            break;
        case 'auth/email-already-in-use':
            errorElement.textContent = 'This email is already registered.';
            break;
        case 'auth/weak-password':
            errorElement.textContent = 'Password should be at least 6 characters.';
            break;
        case 'auth/invalid-email':
            errorElement.textContent = 'Please enter a valid email address.';
            break;
        case 'auth/resend-error':
            errorElement.textContent = 'Please log in to resend the verification email.';
            break;
        default:
            errorElement.textContent = `Error: ${error.message}`;
    }
}

function redirectToHome() {
    window.location.href = 'index.html';
}

// auth logic

// sign-up via email
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showAuthError(signupError, { code: 'auth/password-mismatch', message: 'Passwords do not match.' });
        signupError.textContent = 'Passwords do not match.';
        return;
    }
    signupError.style.display = 'none';

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);
            
            //user-verification
            sendEmailVerification(user, actionCodeSettings)
                .then(() => {
                    console.log('Verification email sent.');
                    showVerificationPending(user.email);
                })
                .catch((error) => {
                    console.error('Error sending verification email:', error);
                    showAuthError(signupError, error);
                });
        })
        .catch((error) => {
            console.error('Sign up error:', error);
            showAuthError(signupError, error);
        });
});

// email login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginError.style.display = 'none';

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (user.emailVerified) {
                console.log('User logged in:', user);
                redirectToHome();
            } else {
                console.log('User login failed: Email not verified.');
                showVerificationPending(user.email);
            }
        })
        .catch((error) => {
            console.error('Login error:', error);
            showAuthError(loginError, error);
        });
});

// handling google sign-up and login
const handleGoogleSignIn = () => {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            console.log('Google sign-in success:', result.user);
            redirectToHome();
        })
        .catch((error) => {
            console.error('Google sign-in error:', error);
            showAuthError(loginError, error);
            showAuthError(signupError, error);
        });
};
googleSigninBtn.addEventListener('click', handleGoogleSignIn);
googleSignupBtn.addEventListener('click', handleGoogleSignIn);

// --- Forgot Password ---
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    if (!email) {
        showAuthError(loginError, { code: 'auth/invalid-email', message: 'Please enter your email first.'});
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            loginError.textContent = 'Password reset email sent! Check your inbox.';
            loginError.style.display = 'block';
            loginError.style.backgroundColor = '#E0FEE2';
            loginError.style.color = '#006421';
            loginError.style.borderColor = '#A5FCA9';
        })
        .catch((error) => {
            console.error('Password reset error:', error);
            showAuthError(loginError, error);
        });
});
