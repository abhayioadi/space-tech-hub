document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'DTL3NEpAfXiHYoB8M6IOUyH1nlKhmd7HvvqOKNzD';
    const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
    const contentContainer = document.getElementById('apod-content');

    async function fetchAPOD() {
        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
            mediaContent = `<img src="${data.url}" alt="${data.title}" class="apod-image">`;
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

    // Initialize
    fetchAPOD();
});
