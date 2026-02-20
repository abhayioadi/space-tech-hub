document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'DTL3NEpAfXiHYoB8M6IOUyH1nlKhmd7HvvqOKNzD';
    const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
    const contentContainer = document.getElementById('apod-content');
    const dateInput = document.getElementById('apod-date');
    const searchBtn = document.getElementById('search-btn');

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.max = today;
    dateInput.value = today;

    async function fetchAPOD(date = '') {
        // Show loading state
        contentContainer.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Connecting to NASA...</p>
            </div>
        `;

        try {
            const dateQuery = date ? `&date=${date}` : '';
            const response = await fetch(`${apiUrl}${dateQuery}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            renderAPOD(data);
        } catch (error) {
            console.error('Error fetching APOD:', error);
            contentContainer.innerHTML = `
                <div class="error-message">
                    <h3>Failed to load APOD</h3>
                    <p>There was an issue connecting to NASA's API. Please try again later.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }

    function renderAPOD(data) {
        // Clear loading state
        contentContainer.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'apod-card';

        // Media handling (Image vs Video)
        let mediaContent = '';
        if (data.media_type === 'image') {
            mediaContent = `<img src="${data.hdurl || data.url}" alt="${data.title}" class="apod-image">`;
        } else if (data.media_type === 'video') {
            mediaContent = `
                <iframe class="apod-video" src="${data.url}" 
                    frameborder="0" allowfullscreen></iframe>
            `;
        }

        const dateFormatted = new Date(data.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const copyright = data.copyright ? `<p class="apod-copyright">&copy; ${data.copyright}</p>` : '';

        card.innerHTML = `
            <div class="apod-media-wrapper">
                ${mediaContent}
            </div>
            <div class="apod-info">
                <span class="apod-date">${dateFormatted}</span>
                <h2 class="apod-title">${data.title}</h2>
                <p class="apod-explanation">${data.explanation}</p>
                ${copyright}
            </div>
        `;

        contentContainer.appendChild(card);
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (selectedDate) {
            fetchAPOD(selectedDate);
        }
    });

    // Support search on Enter key
    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Initialize
    fetchAPOD();
});
