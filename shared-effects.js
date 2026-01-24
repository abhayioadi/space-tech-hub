// Shared JavaScript for enhanced space-themed background effects

// Initialize static starfield background
function initEnhancedStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return; // Exit if canvas not found
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawStars();
    }
    
    // Draw static stars
    function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const stars = [];
        const count = 400; // Moderate count for elegance
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 1.5;
            const opacity = Math.random() * 0.5 + 0.1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Page transition effect
function initPageTransitions() {
    // Add overlay for page transitions
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);
    
    // Handle all internal links for smooth transitions
    document.querySelectorAll('a[href^="/"]').forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't interfere with anchor links or external links
            const href = this.getAttribute('href');
            if (href.startsWith('#') || href.startsWith('http')) return;
            
            // Allow browser to handle navigation naturally 
            // Just add a visual transition effect
            e.preventDefault();
            
            // Show transition overlay
            overlay.classList.add('active');
            
            // Navigate after a short delay to allow the transition effect
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        });
    });
    
    // Hide overlay when page loads
    window.addEventListener('load', () => {
        overlay.classList.remove('active');
    });
}

// Initialize all effects when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initEnhancedStarfield();
    initPageTransitions();
});