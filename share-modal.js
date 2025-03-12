// Share Modal Initialization
function initializeShareModal() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupShareModal);
    } else {
        // Use MutationObserver to ensure elements are loaded
        const observer = new MutationObserver((mutations, obs) => {
            const shareButton = document.querySelector('.share-button');
            const shareModal = document.querySelector('.share-modal');
            
            if (shareButton && shareModal) {
                obs.disconnect();
                setupShareModal();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Try immediate setup in case elements are already present
        setupShareModal();
    }
}

function setupShareModal() {
    try {
        const shareButton = document.querySelector('.share-button');
        const shareModal = document.querySelector('.share-modal');
        
        if (!shareButton || !shareModal) {
            // This is normal if we're not on a page with sharing functionality
            return;
        }
        
        // Remove existing listeners to prevent duplicates
        const newShareButton = shareButton.cloneNode(true);
        shareButton.parentNode.replaceChild(newShareButton, shareButton);
        
        const newShareModal = shareModal.cloneNode(true);
        shareModal.parentNode.replaceChild(newShareModal, shareModal);
        
        // Add click listener to share button
        newShareButton.addEventListener('click', () => {
            newShareModal.classList.add('show');
        });
        
        // Add click listener to close button
        const closeButton = newShareModal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                newShareModal.classList.remove('show');
            });
        }
        
        // Close modal when clicking outside
        newShareModal.addEventListener('click', (e) => {
            if (e.target === newShareModal) {
                newShareModal.classList.remove('show');
            }
        });
        
        console.log('Share modal initialized successfully');
    } catch (error) {
        console.log('Share modal setup skipped - elements not ready');
    }
}

// Initialize the share modal
initializeShareModal();

localStorage.clear()

window.cispWallet.createWallet("MyWallet") 