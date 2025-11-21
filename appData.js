/**
 * CENTRAL APP DATASET
 * * key: The lowercase name of the app (must be lowercase for matching).
 * name: The pretty display name.
 * category: The default category to auto-fill.
 * style: The CSS styles (background color, text color) for the tag.
 */

export const knownApps = {
    // --- SOCIAL MEDIA ---
    "instagram": { 
        category: "Social Media", 
        style: "background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white;" 
    },
    "whatsapp": { 
        category: "Social Media", 
        style: "background-color: #25d366; color: white;" 
    },
    "twitter": { 
        category: "Social Media", 
        style: "background-color: #000000; color: white;" 
    },
    "x": { 
        category: "Social Media", 
        style: "background-color: #000000; color: white;" 
    },
    "facebook": { 
        category: "Social Media", 
        style: "background-color: #1877f2; color: white;" 
    },
    "linkedin": { 
        category: "Productivity", 
        style: "background-color: #0a66c2; color: white;" 
    },
    "snapchat": { 
        category: "Social Media", 
        style: "background-color: #fffc00; color: black;" 
    },
    "reddit": { 
        category: "Social Media", 
        style: "background-color: #ff4500; color: white;" 
    },
    "tiktok": { 
        category: "Entertainment", 
        style: "background-color: #000000; color: white; border: 1px solid #333;" 
    },

    // --- ENTERTAINMENT ---
    "youtube": { 
        category: "Entertainment", 
        style: "background-color: #ff0000; color: white;" 
    },
    "spotify": { 
        category: "Entertainment", 
        style: "background-color: #1ed760; color: black;" 
    },
    "netflix": { 
        category: "Entertainment", 
        style: "background-color: #e50914; color: white;" 
    },
    "twitch": { 
        category: "Entertainment", 
        style: "background-color: #9146ff; color: white;" 
    },

    // --- PRODUCTIVITY ---
    "gmail": { 
        category: "Productivity", 
        style: "background-color: #ea4335; color: white;" 
    },
    "slack": { 
        category: "Productivity", 
        style: "background-color: #4a154b; color: white;" 
    },
    "notion": { 
        category: "Productivity", 
        style: "background-color: #000000; color: white;" 
    },
    "figma": { 
        category: "Productivity", 
        style: "background-color: #f24e1e; color: white;" 
    },
    "zoom": { 
        category: "Productivity", 
        style: "background-color: #2d8cff; color: white;" 
    },
    
    // --- GOOGLE APPS (Special Case in Logic, but listed here for category) ---
    "google chrome": { category: "Productivity", style: "special-google" },
    "google drive": { category: "Productivity", style: "special-google" },
    "google maps": { category: "Productivity", style: "special-google" },
};