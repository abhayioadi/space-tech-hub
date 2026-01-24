// Fetch latest space news for the home page preview
document.addEventListener('DOMContentLoaded', function () {
    // Fetch news
    fetchNews();

    // Set up scroll-to-top button
    setupScrollToTop();

    // Add page load animations
    setTimeout(animateOnLoad, 500);

    // Initialize news ticker
    initNewsTicker();
});

// Initialize news ticker
function initNewsTicker() {
    const tickerList = document.getElementById('ticker-list');
    if (!tickerList) return;

    // Duplicate items for continuous scrolling effect
    // Check if we have enough content to warrant duplication
    if (tickerList.childElementCount > 0) {
        const items = tickerList.innerHTML;
        tickerList.innerHTML = items + items;
    }
}

// Fetch latest space news for the home page preview
function fetchNews() {
    const newsPreviewContainer = document.getElementById('news-preview');
    if (!newsPreviewContainer) return;

    // Show loading state
    newsPreviewContainer.innerHTML = '<div class="loading-animation"></div>';

    // Fetch news from SpaceFlightNews API
    fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=3')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading message
            newsPreviewContainer.innerHTML = '';

            if (!data.results || data.results.length === 0) {
                newsPreviewContainer.innerHTML = '<p>No recent updates found.</p>';
                return;
            }

            // Display the first 3 articles
            data.results.slice(0, 3).forEach((article, index) => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';

                // Format the publish date
                const publishDate = new Date(article.published_at);
                const formattedDate = publishDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                newsCard.innerHTML = `
                    <h3>${article.title}</h3>
                    <p>${article.summary ? article.summary.substring(0, 150) + '...' : 'No summary available.'}</p>
                    <p class="publish-date" style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 1rem;">${formattedDate}</p>
                `;

                newsPreviewContainer.appendChild(newsCard);

                // Add animation delay for each card
                setTimeout(() => {
                    newsCard.classList.add('animate'); // Ensure CSS supports this or rely on natural fade-in
                    // Assuming .hero-content style fade-in or adding specific class in CSS if needed.
                    // For now, simpler transition:
                    newsCard.style.opacity = '0';
                    newsCard.style.transform = 'translateY(20px)';
                    newsCard.style.transition = 'all 0.5s ease ' + (index * 0.2) + 's';
                    requestAnimationFrame(() => {
                        newsCard.style.opacity = '1';
                        newsCard.style.transform = 'translateY(0)';
                    });
                }, 100);
            });
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            newsPreviewContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Unable to load latest updates at this time.</p>';
        });
}

// Set up scroll-to-top button
function setupScrollToTop() {
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.innerHTML = '↑';
    scrollToTopButton.className = 'scroll-to-top';
    document.body.appendChild(scrollToTopButton);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    });

    // Scroll to top when clicked
    scrollToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Page load animations
function animateOnLoad() {
    const sections = document.querySelectorAll('section');

    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.8s ease';

        // Add animation class with delay
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 300);
    });
}