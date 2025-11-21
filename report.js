// firebase imports
import { 
    doc, getDoc, collection, addDoc, deleteDoc, // <--- Added deleteDoc
    serverTimestamp, onSnapshot, query, orderBy, increment, updateDoc,
    arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { db, auth } from './app.js'; 
import { knownApps } from './appData.js'; 

// global variables
let currentReportId = null;
let commentsListener = null; 
let currentUserId = null; 

// dom elements
const reportDetailContainer = document.getElementById('report-detail-container');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');
const commentText = document.getElementById('comment-text');
const loginPrompt = document.getElementById('login-prompt-comment');
const commentUserIcon = document.getElementById('comment-user-icon');
const commentSubmitIconBtn = document.getElementById('comment-submit-icon-btn');


// page initialization
document.addEventListener("DOMContentLoaded", () => {
    
    const params = new URLSearchParams(window.location.search);
    currentReportId = params.get('id');

    if (!currentReportId) {
        reportDetailContainer.innerHTML = "<p style='color: red; text-align: center; padding: 40px;'>Error: No report ID provided.</p>";
        return;
    }

    loadReportDetails();
    // We call listenForComments initially, but it will be called again when auth state resolves
    // to ensure we know who the 'currentUser' is before rendering buttons.

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid; 
            
            // Check email verification 
            if (user.emailVerified) {
                commentForm.style.display = 'block';
                loginPrompt.style.display = 'none';
                const firstLetter = (user.email || 'A').charAt(0).toUpperCase();
                commentUserIcon.textContent = firstLetter;
            }
        } else {
            currentUserId = null; 
            commentForm.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
        
        listenForComments();
    });

    commentForm.addEventListener('submit', handleCommentSubmit);

    commentText.addEventListener('input', () => {
        if (commentText.value.trim().length > 0) {
            commentSubmitIconBtn.disabled = false;
            commentText.style.height = 'auto';
            commentText.style.height = (commentText.scrollHeight) + 'px';
        } else {
            commentSubmitIconBtn.disabled = true;
            commentText.style.height = 'auto'; 
        }
    });

    commentsList.addEventListener('click', (e) => {
        // handle Like
        const likeButton = e.target.closest('.comment-like-btn');
        if (likeButton) {
            e.preventDefault();
            const commentId = likeButton.dataset.commentId;
            if (commentId) handleCommentUpvote(commentId);
        }

        // handle Delete
        const deleteButton = e.target.closest('.comment-delete-btn');
        if (deleteButton) {
            e.preventDefault();
            const commentId = deleteButton.dataset.commentId;
            if (commentId) handleDeleteComment(commentId);
        }
    });
});

// important functions

async function loadReportDetails() {
    const reportRef = doc(db, "reports", currentReportId);
    try {
        const docSnap = await getDoc(reportRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            reportDetailContainer.innerHTML = createReportDetailHTML(data);
        } else {
            reportDetailContainer.innerHTML = "<p style='color: red; text-align: center; padding: 40px;'>Error: Report not found.</p>";
        }
    } catch (error) {
        console.error("Error loading report: ", error);
        reportDetailContainer.innerHTML = "<p style='color: red; text-align: center; padding: 40px;'>Error loading report details.</p>";
    }
}

function listenForComments() {
    const commentsRef = collection(db, "reports", currentReportId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc")); 

    if (commentsListener) commentsListener();

    commentsListener = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            commentsList.innerHTML = "<p class='no-comments-message'>Be the first to comment!</p>";
            return;
        }

        commentsList.innerHTML = ""; 
        snapshot.forEach((doc) => {
            const commentData = doc.data();
            const commentId = doc.id; 
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment-item');
            
            const firstLetter = (commentData.authorEmail || 'A').charAt(0).toUpperCase();

            const upvotedByArray = commentData.upvotedBy || [];
            const isLiked = currentUserId && upvotedByArray.includes(currentUserId);
            const likedClass = isLiked ? 'user-liked' : '';
            
            const isMyComment = currentUserId && (currentUserId === commentData.authorId);
            
            //insertig delete button
            const deleteBtnHTML = isMyComment 
                ? `<button class="comment-delete-btn" data-comment-id="${commentId}" title="Delete Comment">
                     <i class="fa-solid fa-trash"></i>
                   </button>` 
                : '';

            commentElement.innerHTML = `
                <div class="comment-form-icon comment-item-icon">${firstLetter}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <p class="comment-body">${commentData.text}</p>
                        ${deleteBtnHTML}
                    </div>
                    <div class="comment-footer">
                        <div class="comment-like-btn ${likedClass}" data-comment-id="${commentId}" title="Upvote">
                            <i class="fa-solid fa-thumbs-up"></i>
                            <span>${commentData.upvotes || 0}</span>
                        </div>
                        <span class="comment-time">${formatTimeAgo(commentData.createdAt)}</span>
                    </div>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
    });
}

async function handleCommentSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user || !currentReportId) return; 

    const commentContent = commentText.value.trim();
    if (commentContent.length === 0) return; 

    commentSubmitIconBtn.disabled = true;

    try {
        const commentsRef = collection(db, "reports", currentReportId, "comments");
        await addDoc(commentsRef, {
            text: commentContent,
            authorEmail: user.email,
            authorId: user.uid,
            createdAt: serverTimestamp(),
            upvotes: 0,
            upvotedBy: []
        });

        const reportRef = doc(db, "reports", currentReportId);
        await updateDoc(reportRef, {
            commentCount: increment(1)
        });

        commentText.value = "";
        commentText.style.height = 'auto';
        commentText.dispatchEvent(new Event('input')); 

    } catch (error) {
        console.error("Error posting comment: ", error);
        commentSubmitIconBtn.disabled = false;
        console.error("Error posting comment. Please try again.");
    }
}

// delete logic
async function handleDeleteComment(commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        // delete the comment document
        const commentRef = doc(db, "reports", currentReportId, "comments", commentId);
        await deleteDoc(commentRef);

        // Decrease number of comments
        const reportRef = doc(db, "reports", currentReportId);
        await updateDoc(reportRef, {
            commentCount: increment(-1)
        });

        console.log("Comment deleted successfully");
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Could not delete comment. Please try again.");
    }
}

async function handleCommentUpvote(commentId) {
    if (!currentUserId) {
        console.log("User must be logged in to upvote comments.");
        window.location.href = 'login.html';
        return;
    }

    const commentRef = doc(db, "reports", currentReportId, "comments", commentId);

    try {
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
            console.error("Comment not found!");
            return;
        }

        const commentData = commentSnap.data();
        const upvotedByArray = commentData.upvotedBy || [];

        if (upvotedByArray.includes(currentUserId)) {
            await updateDoc(commentRef, {
                upvotedBy: arrayRemove(currentUserId),
                upvotes: increment(-1)
            });
        } else {
            await updateDoc(commentRef, {
                upvotedBy: arrayUnion(currentUserId),
                upvotes: increment(1)
            });
        }
    } catch (error) {
        console.error("Error updating comment upvote: ", error);
    }
}


// helper functions

function createReportDetailHTML(data) {
    const statusClass = `status-${data.status?.toLowerCase().replace(' ', '') || 'other'}`;
    const rawAppName = data.appName || 'App';
    const normalizedAppName = rawAppName.toLowerCase().trim();
    let appTagHTML = "";

    if (knownApps[normalizedAppName]) {
        const appInfo = knownApps[normalizedAppName];
        if (appInfo.style === "special-google") {
             appTagHTML = `<span class="tag-app-name app-google"><span class="name-google">${rawAppName}</span></span>`;
        } else {
            appTagHTML = `<span class="tag-app-name" style="${appInfo.style}">${rawAppName}</span>`;
        }
    } else {
        appTagHTML = `<span class="tag-app-name" style="background-color: #f2f3f5; color: #6b7280;">${rawAppName}</span>`;
    }

    return `
        <h1>${data.title || 'No Title'}</h1>
        <div class="report-detail-tags">
            ${appTagHTML}
            <span class="tag-app-type">${data.appCategory || 'Category'}</span>
            <span class="tag-category">${data.reportType || 'Type'}</span>
            <span class="tag-status ${statusClass}">${data.status || 'Status'}</span>
        </div>
        <p class="report-detail-description">${data.description || 'No description provided.'}</p>
        <div class="report-detail-stats">
            <span><i class="fa-solid fa-thumbs-up"></i> ${data.upvotes || 0} Upvotes</span>
            <span><i class="fa-solid fa-comment"></i> ${data.commentCount || 0} Comments</span>
            <span><i class="fa-solid fa-clock"></i> Posted ${formatTimeAgo(data.createdAt)}</span>
        </div>
    `;
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate(); 
    } else if (timestamp) {
        date = new Date(timestamp); 
    } else {
        return 'Just now';
    }
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}