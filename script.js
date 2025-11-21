// firebase imports
import { 
    collection, getDocs, onSnapshot, addDoc, query, orderBy, 
    serverTimestamp, where, doc, getDoc, updateDoc, 
    arrayUnion, arrayRemove, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, auth } from './app.js';
import { knownApps } from './appData.js'; // <--- IMPORT THE DATASET

console.log("script.js connected");

const reportsCollection = collection(db, "reports");

// important variables
let currentFilters = {
    categories: [],
    status: []
};
let activeReportListener = null;
let sortByTrending = false; 

let currentSearchTerm = ""; 
let allReportsFromFirebase = []; 
let listElement = null; 
const counts = {
  'Bug': 0,
  'Performance': 0,
  'Feature Request': 0,
  'UI/UX': 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${index * 100}ms`;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1 
});

// explore-section logic
document.addEventListener("DOMContentLoaded", () => {
    
    listElement = document.querySelector(".issue-cards-list");
    
    const filterButton = document.querySelector('.filter-button');
    const filterDropdown = document.getElementById('filterDropdown');
    const arrow = document.querySelector('.dropdown-arrow');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const trendingButton = document.querySelector('.trending');
    
    if (trendingButton) {
        trendingButton.addEventListener('click', () => {
            sortByTrending = !sortByTrending; 
            trendingButton.classList.toggle('active', sortByTrending);
            fetchAndRenderReports();
        });
    }

    if (filterButton) {
        filterButton.addEventListener('click', () => {
            const isOpening = !filterDropdown.classList.contains('show');
            filterDropdown.classList.toggle('show');
            arrow.classList.toggle('rotated');
            if (isOpening) {
                updateCheckboxesFromState();
            }
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            updateStateFromCheckboxes();
            fetchAndRenderReports(); 
            filterDropdown.classList.remove('show');
            arrow.classList.remove('rotated');
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters.categories = [];
            currentFilters.status = [];
            updateCheckboxesFromState();
            fetchAndRenderReports(); 
            filterDropdown.classList.remove('show');
            arrow.classList.remove('rotated');
        });
    }
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            renderFilteredList(); 
        });
    }

    if (listElement) {
        listElement.addEventListener('click', (e) => {
            const card = e.target.closest('.issue-card');
            if (!card) return; 

            const reportId = card.dataset.id;
            
            if (e.target.closest('.likes')) {
                e.preventDefault(); 
                handleUpvote(reportId);
                return;
            }

            if (!e.target.closest('.tags')) {
                 window.location.href = `report.html?id=${reportId}`;
            }
        });
    }

    window.onclick = function(event) {
        if (!event.target.matches('.filter-button') && !event.target.closest('.filter-button') && !event.target.closest('.dropdown-content')) {
            if (filterDropdown && filterDropdown.classList.contains('show')) {
                filterDropdown.classList.remove('show');
                if (arrow) arrow.classList.remove('rotated');
            }
        }
    }

    initializeAppLogic();
});

// important functions: handling likes, initializeapp

async function handleUpvote(reportId) {
    const user = auth.currentUser;
    if (!user) {
        console.log("User must be logged in to upvote.");
        window.location.href = 'login.html';
        return;
    }
    const userId = user.uid;
    const reportRef = doc(db, "reports", reportId);

    try {
        const reportSnap = await getDoc(reportRef);
        if (!reportSnap.exists()) return;

        const reportData = reportSnap.data();
        const upvotedByArray = reportData.upvotedBy || []; 

        if (upvotedByArray.includes(userId)) {
            await updateDoc(reportRef, {
                upvotedBy: arrayRemove(userId), 
                upvotes: increment(-1)          
            });
        } else {
            await updateDoc(reportRef, {
                upvotedBy: arrayUnion(userId), 
                upvotes: increment(1)          
            });
        }

    } catch (error) {
        console.error("Error updating upvote: ", error);
    }
}


async function initializeAppLogic() {
    if (!listElement) return;
    listElement.innerHTML = "<p>Loading Reports....</p>";
    
    try {
        const initialSnapshot = await getDocs(reportsCollection);
        fetchAndRenderReports();
    } catch (error) {
        console.error("Error during initialization: ", error);
        listElement.innerHTML = "<p style='color: red;'>Error initializing app. Check console.</p>";
    }
}

function updateCheckboxesFromState() {
    const allCheckboxes = document.querySelectorAll('#filterDropdown input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        if (checkbox.name === 'category') {
            checkbox.checked = currentFilters.categories.includes(checkbox.value);
        } else if (checkbox.name === 'status') {
            checkbox.checked = currentFilters.status.includes(checkbox.value);
        }
    });
}

function updateStateFromCheckboxes() {
    currentFilters.categories = [];
    currentFilters.status = [];
    const checkedCategories = document.querySelectorAll('#filterDropdown input[name="category"]:checked');
    const checkedStatuses = document.querySelectorAll('#filterDropdown input[name="status"]:checked');
    checkedCategories.forEach(checkbox => currentFilters.categories.push(checkbox.value));
    checkedStatuses.forEach(checkbox => currentFilters.status.push(checkbox.value));
}

function fetchAndRenderReports() {
    if (!listElement) return;

    if (activeReportListener) {
        activeReportListener(); 
    }

    let reportsQuery = query(reportsCollection);
    if (currentFilters.categories.length > 0) {
        reportsQuery = query(reportsQuery, where("appCategory", "in", currentFilters.categories));
    }
    if (currentFilters.status.length > 0) {
        reportsQuery = query(reportsQuery, where("status", "in", currentFilters.status));
    }
    
    const hasFilters = currentFilters.categories.length > 0 || currentFilters.status.length > 0;

    if (sortByTrending) {
        reportsQuery = query(reportsQuery, orderBy("upvotes", "desc"));
    
    } else if (!hasFilters) {
        reportsQuery = query(reportsQuery, orderBy("createdAt", "desc"));
    }
    
    activeReportListener = onSnapshot(reportsQuery, (snapshot) => {
        
        allReportsFromFirebase = []; 

        snapshot.forEach((doc) => {
          allReportsFromFirebase.push({ id: doc.id, data: doc.data() });
        });
        
        if (hasFilters && !sortByTrending) {
            allReportsFromFirebase.sort((a, b) => {
                const dateA = a.data.createdAt?.toDate ? a.data.createdAt.toDate() : new Date(0);
                const dateB = b.data.createdAt?.toDate ? b.data.createdAt.toDate() : new Date(0);
                return dateB - dateA; 
            });
        }

        renderFilteredList();

    }, (error) => {
        console.error("Error loading reports: ", error);
        if (error.code === 'failed-precondition') {
            listElement.innerHTML = `<p style='color: red; padding: 20px;'><b>Query Error:</b> Index required. Check console.</p>`;
        } else {
            listElement.innerHTML = "<p style='color: red;'>Error loading reports.</p>";
        }
    });
}

function renderFilteredList() {
    if (!listElement) return;

    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

    let reportsToRender = allReportsFromFirebase;
    if (currentSearchTerm) {
        reportsToRender = allReportsFromFirebase.filter(report => {
            const data = report.data;
            const term = currentSearchTerm;
            return (data.title?.toLowerCase() || '').includes(term) ||
                   (data.appName?.toLowerCase() || '').includes(term) ||
                   (data.appCategory?.toLowerCase() || '').includes(term) ||
                   (data.description?.toLowerCase() || '').includes(term);
        });
    }

    // Calculate counts
    Object.keys(counts).forEach(k => counts[k] = 0);
    reportsToRender.forEach(report => {
        const reportType = report.data.reportType;
        if (counts[reportType] !== undefined) {
            counts[reportType]++;
        }
    });

    // Update counts in DOM
    if(document.getElementById('count-bugs')) {
        document.getElementById('count-bugs').innerText = counts['Bug'];
        document.getElementById('count-performance').innerText = counts['Performance'];
        document.getElementById('count-featurer').innerText = counts['Feature Request'];
        document.getElementById('count-ui').innerText = counts['UI/UX'];
    }

    if (reportsToRender.length === 0) {
        listElement.innerHTML = `<div class="no-reports-message"><p>No reports found.</p></div>`;
        return; 
    }

    listElement.innerHTML = ""; 
    
    reportsToRender.forEach((report) => {
        const { data, id } = report; 
        const cardElement = document.createElement('div');
        cardElement.classList.add('issue-card');
        cardElement.dataset.id = id; 
        
        cardElement.innerHTML = createCardHTML(data, id, currentUserId);
        
        listElement.appendChild(cardElement);
        observer.observe(cardElement); 
    });
}

function createCardHTML(data, id, currentUserId) {
    const appCategoryClass = `type-${data.appCategory?.toLowerCase().split(' ')[0] || 'other'}`;
    const reportTypeClass = `category-${data.reportType?.toLowerCase().replace(' ', '') || 'other'}`;
    const statusClass = `status-${data.status?.toLowerCase().replace(' ', '') || 'other'}`;
    
    // color logic from datase
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
        // Default gray style for unknown apps
        appTagHTML = `<span class="tag-app-name" style="background-color: #f2f3f5; color: #6b7280;">${rawAppName}</span>`;
    }
    // --- END NEW COLOR LOGIC ---

    const upvotedByArray = data.upvotedBy || [];
    const isLiked = currentUserId && upvotedByArray.includes(currentUserId);
    const likedClass = isLiked ? 'user-liked' : ''; 

    const detailUrl = `report.html?id=${id}`;

    return `
    <div class="first-line">
        <h3><a href="${detailUrl}" class="card-title-link">${data.title || 'No Title'}</a></h3>
        <div class="tags">
            ${appTagHTML}
            <span class="tag-app-type ${appCategoryClass}">${data.appCategory || 'Category'}</span>
            <span class="tag-category ${reportTypeClass}">${data.reportType || 'Type'}</span>
            <span class="tag-status ${statusClass}">${data.status || 'Status'}</span>
        </div>
    </div>
    <a href="${detailUrl}" class="card-description-link">
        <p>${data.description || 'No description provided.'}</p>
    </a>
    <div class="stats">
        <div class="likes ${likedClass}" style="cursor: pointer;" title="Upvote">
            <span><i class="fa-solid fa-thumbs-up"></i> ${data.upvotes || 0}</span>
        </div>
        <a href="${detailUrl}" class="comments">
            <span><i class="fa-solid fa-comment"></i> ${data.commentCount || 0}</span>
        </a>
        <div class="time"><span>${formatTimeAgo(data.createdAt)}</span></div>
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