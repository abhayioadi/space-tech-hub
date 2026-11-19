document.addEventListener('DOMContentLoaded', () => {
    const API_KEYS = [
        'DTL3NEpAfXiHYoB8M6IOUyH1nlKhmd7HvvqOKNzD',
        'DEMO_KEY'
    ];
    const contentContainer = document.getElementById('apod-content');
    const dateInput = document.getElementById('apod-date');
    const searchBtn = document.getElementById('search-btn');
    const btnToday = document.getElementById('btn-today');
    const btnYesterday = document.getElementById('btn-yesterday');
    const btnRandom = document.getElementById('btn-random');

    // Date utilities
    function getLocalDateString(d = new Date()) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getRelativeDateString(offsetDays, baseDateStr = null) {
        let base;
        if (baseDateStr) {
            const [y, m, d] = baseDateStr.split('-').map(Number);
            base = new Date(y, m - 1, d);
        } else {
            base = new Date();
        }
        base.setDate(base.getDate() + offsetDays);
        return getLocalDateString(base);
    }

    function getRandomApodDate() {
        const start = new Date(1995, 5, 16).getTime(); // June 16, 1995
        const end = new Date().getTime();
        const randomTime = start + Math.random() * (end - start);
        return getLocalDateString(new Date(randomTime));
    }

    // Set max date to today, min date to APOD launch (1995-06-16)
    const today = getLocalDateString();
    dateInput.max = today;
    dateInput.min = '1995-06-16';
    dateInput.value = today;

    // Direct API query helper with multi-key and timeout support
    async function queryNasaApi(dateStr = '', keyIndex = 0) {
        const key = API_KEYS[keyIndex] || 'DEMO_KEY';
        const dateQuery = dateStr ? `&date=${dateStr}` : '';
        const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${key}${dateQuery}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
            const response = await fetch(apiUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                // If rate limited or invalid key, switch to backup key if available
                if ((response.status === 429 || response.status === 403) && keyIndex < API_KEYS.length - 1) {
                    console.warn(`NASA API key index ${keyIndex} returned status ${response.status}. Trying backup key...`);
                    return queryNasaApi(dateStr, keyIndex + 1);
                }

                let errorMsg = `HTTP Error ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData && errData.msg) {
                        errorMsg = errData.msg;
                    }
                } catch (_) {
                    // Raw HTML or non-JSON response from server
                }

                const error = new Error(errorMsg);
                error.status = response.status;
                throw error;
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                const timeoutErr = new Error('Connection timed out while reaching NASA API. Please try again.');
                timeoutErr.status = 504;
                throw timeoutErr;
            }
            throw err;
        }
    }

    async function fetchAPOD(dateStr = '', isRetry = false, isFallback = false) {
        // Show loading state
        contentContainer.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>${isRetry ? 'Retrying connection to NASA...' : 'Connecting to NASA...'}</p>
            </div>
        `;

        // Client-side date boundary validation
        if (dateStr) {
            if (dateStr > today) {
                renderError(new Error(`The selected date (${dateStr}) is in the future. NASA APOD is available up to today (${today}).`), dateStr);
                return;
            }
            if (dateStr < '1995-06-16') {
                renderError(new Error(`The first Astronomy Picture of the Day was published on June 16, 1995. Please pick a date on or after 1995-06-16.`), dateStr);
                return;
            }
        }

        try {
            let data;
            try {
                data = await queryNasaApi(dateStr);
            } catch (apiErr) {
                // 1. Retry once on transient server errors (500, 502, 503, 504) or network failures
                if (!isRetry && (apiErr.status >= 500 || !apiErr.status)) {
                    console.log('Encountered server error, retrying in 1.2s...', apiErr);
                    await new Promise(res => setTimeout(res, 1200));
                    return fetchAPOD(dateStr, true, isFallback);
                }

                // 2. If today's picture is requested (or default load) and server fails (500 or 400 not-yet-published)
                const isTodayRequest = !dateStr || dateStr === today;
                if (isTodayRequest && !isFallback) {
                    console.warn("Today's APOD is not available or returned an error. Falling back to yesterday's APOD.");
                    const yesterday = getRelativeDateString(-1);
                    return fetchAPOD(yesterday, false, true);
                }

                throw apiErr;
            }

            // Render successful APOD
            let notice = null;
            if (isFallback) {
                notice = "Today's Astronomy Picture is not published yet by NASA (or the server is currently updating). Showing yesterday's picture.";
            }
            renderAPOD(data, notice);

            if (data.date) {
                dateInput.value = data.date;
            }
        } catch (error) {
            console.error('Error fetching APOD:', error);
            renderError(error, dateStr);
        }
    }

    function renderAPOD(data, notice = null) {
        contentContainer.innerHTML = '';

        if (notice) {
            const noticeEl = document.createElement('div');
            noticeEl.className = 'apod-notice';
            noticeEl.innerHTML = `<span class="notice-icon">ℹ️</span><span>${notice}</span>`;
            contentContainer.appendChild(noticeEl);
        }

        const card = document.createElement('div');
        card.className = 'apod-card';

        // Media handling (Image vs Video)
        let mediaContent = '';
        if (data.media_type === 'image') {
            const imgSrc = data.hdurl || data.url;
            mediaContent = `
                <img src="${imgSrc}" alt="${data.title || 'Astronomy Picture of the Day'}" class="apod-image" 
                     onerror="this.onerror=null; this.src='${data.url || ''}';">
            `;
        } else if (data.media_type === 'video') {
            mediaContent = `
                <iframe class="apod-video" src="${data.url}" 
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        } else {
            mediaContent = `<div style="padding: 3rem; text-align: center; color: var(--text-secondary);">Media type '${data.media_type}' is not supported for inline display.</div>`;
        }

        // Parse date safely without UTC timezone shift
        let dateFormatted = data.date;
        if (data.date && data.date.includes('-')) {
            const [y, m, d] = data.date.split('-').map(Number);
            dateFormatted = new Date(y, m - 1, d).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        const copyright = data.copyright ? `<p class="apod-copyright">&copy; ${data.copyright.trim().replace(/\n/g, ' ')}</p>` : '';
        const hdButton = (data.media_type === 'image' && data.hdurl) ? `<a href="${data.hdurl}" target="_blank" rel="noopener noreferrer" class="quick-btn" style="display:inline-block; margin-top: 1rem; text-decoration: none;">🔍 View Full HD Image</a>` : '';

        card.innerHTML = `
            <div class="apod-media-wrapper">
                ${mediaContent}
            </div>
            <div class="apod-info">
                <span class="apod-date">${dateFormatted}</span>
                <h2 class="apod-title">${data.title || 'Untitled'}</h2>
                <p class="apod-explanation">${data.explanation || 'No explanation available.'}</p>
                ${copyright}
                ${hdButton}
            </div>
        `;

        contentContainer.appendChild(card);
    }

    function renderError(error, requestedDate) {
        contentContainer.innerHTML = `
            <div class="error-message">
                <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🌌</div>
                <h3>Failed to load APOD</h3>
                <p class="error-details">${escapeHtml(error.message || 'Internal Service Error')}</p>
                <p class="error-hint">
                    NASA's APOD service may be temporarily updating its daily release, experiencing high traffic, or encountering an internal server error.
                </p>
                <div class="error-actions">
                    <button type="button" class="error-btn" id="error-retry-btn">🔄 Try Again</button>
                    <button type="button" class="error-btn" id="error-yesterday-btn">⏮️ View Yesterday</button>
                    <button type="button" class="error-btn" id="error-random-btn">🎲 Random Picture</button>
                </div>
            </div>
        `;

        document.getElementById('error-retry-btn')?.addEventListener('click', () => {
            fetchAPOD(requestedDate);
        });

        document.getElementById('error-yesterday-btn')?.addEventListener('click', () => {
            const yesterday = getRelativeDateString(-1);
            dateInput.value = yesterday;
            fetchAPOD(yesterday);
        });

        document.getElementById('error-random-btn')?.addEventListener('click', () => {
            const randomDate = getRandomApodDate();
            dateInput.value = randomDate;
            fetchAPOD(randomDate);
        });
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const selectedDate = dateInput.value;
        if (selectedDate) {
            fetchAPOD(selectedDate);
        }
    });

    dateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    btnToday?.addEventListener('click', () => {
        dateInput.value = today;
        fetchAPOD(today);
    });

    btnYesterday?.addEventListener('click', () => {
        const yesterday = getRelativeDateString(-1);
        dateInput.value = yesterday;
        fetchAPOD(yesterday);
    });

    btnRandom?.addEventListener('click', () => {
        const randDate = getRandomApodDate();
        dateInput.value = randDate;
        fetchAPOD(randDate);
    });

    // Initialize with current date
    fetchAPOD(today);
});