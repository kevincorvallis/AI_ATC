// Live ATC Player Management

class LiveATCPlayer {
    constructor() {
        this.currentAirport = null;
        this.currentFeed = null;
        this.audio = document.getElementById('atcAudio');
        
        this.initEventListeners();
        this.renderAirportList();
    }

    initEventListeners() {
        // Search functionality
        document.getElementById('airportSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Region filter
        document.getElementById('regionFilter').addEventListener('change', (e) => {
            this.handleRegionFilter(e.target.value);
        });

        // Player controls
        document.getElementById('changeAirport').addEventListener('click', () => {
            this.showAirportList();
        });

        document.getElementById('stopPlayer').addEventListener('click', () => {
            this.stopPlayback();
        });

        // Audio events
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showError('Unable to connect to live stream. The feed may be temporarily offline.');
        });

        this.audio.addEventListener('playing', () => {
            console.log('Audio playing');
        });
    }

    renderAirportList(filter = null, searchQuery = null) {
        const airportList = document.getElementById('airportList');
        airportList.innerHTML = '';

        let airportsToShow = [];

        if (searchQuery && searchQuery.trim() !== '') {
            airportsToShow = searchAirports(searchQuery);
        } else if (filter && filter !== 'all') {
            const byRegion = getAirportsByRegion();
            airportsToShow = byRegion[filter] || [];
        } else {
            const byRegion = getAirportsByRegion();
            for (const region in byRegion) {
                airportsToShow = airportsToShow.concat(byRegion[region]);
            }
        }

        if (airportsToShow.length === 0) {
            airportList.innerHTML = '<div class="no-results">No airports found matching your search.</div>';
            return;
        }

        // Group by region for display
        const grouped = {};
        airportsToShow.forEach(airport => {
            if (!grouped[airport.region]) {
                grouped[airport.region] = [];
            }
            grouped[airport.region].push(airport);
        });

        // Render each region
        for (const region in grouped) {
            const regionDiv = document.createElement('div');
            regionDiv.className = 'airport-region';
            
            const regionTitle = document.createElement('h3');
            regionTitle.textContent = region;
            regionTitle.className = 'region-title';
            regionDiv.appendChild(regionTitle);

            const airportsContainer = document.createElement('div');
            airportsContainer.className = 'airports-container';

            grouped[region].forEach(airport => {
                const airportCard = this.createAirportCard(airport);
                airportsContainer.appendChild(airportCard);
            });

            regionDiv.appendChild(airportsContainer);
            airportList.appendChild(regionDiv);
        }
    }

    createAirportCard(airport) {
        const card = document.createElement('div');
        card.className = 'airport-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `${airport.name} - ${airport.city}`);

        const header = document.createElement('div');
        header.className = 'airport-card-header';
        header.innerHTML = `
            <h4>${airport.name} <span class="airport-icao">${airport.icao}</span></h4>
            <p><span class="city-icon">📍</span> ${airport.city}</p>
        `;
        card.appendChild(header);

        const feedsContainer = document.createElement('div');
        feedsContainer.className = 'feeds-container';

        airport.feeds.forEach(feed => {
            const feedBtn = document.createElement('button');
            feedBtn.className = 'feed-button';
            feedBtn.setAttribute('aria-label', `Listen to ${feed.name} on ${feed.frequency}`);
            feedBtn.innerHTML = `
                <span class="feed-info">
                    <span class="feed-name">${feed.name}</span>
                    <span class="feed-type">${feed.external ? 'External' : 'Stream'}</span>
                </span>
                <span class="feed-freq">${feed.frequency}</span>
            `;
            feedBtn.addEventListener('click', () => {
                this.playFeed(airport, feed);
            });
            feedsContainer.appendChild(feedBtn);
        });

        card.appendChild(feedsContainer);
        return card;
    }

    playFeed(airport, feed) {
        this.currentAirport = airport;
        this.currentFeed = feed;

        // Check if this is an external link
        if (feed.external) {
            // Open LiveATC.net in a new window
            const width = 1000;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            window.open(
                feed.url,
                'liveatc_' + airport.icao,
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes'
            );

            // Show info message
            const message = document.createElement('div');
            message.className = 'external-link-message';
            message.innerHTML = '<h3>Opening LiveATC.net...</h3><p>A new window has opened with live feeds for <strong>' + airport.name + '</strong>.</p><p>Click on any available feed to start listening!</p><p class="tip">💡 Tip: You can select different frequencies (Tower, Ground, Approach) on the LiveATC.net page.</p>';

            const playerInfo = document.querySelector('.player-info');
            playerInfo.innerHTML = '';
            playerInfo.appendChild(message);

            // Hide audio player, show modified UI
            document.getElementById('atcAudio').style.display = 'none';
            document.getElementById('airportList').style.display = 'none';
            document.getElementById('atcPlayer').style.display = 'block';
            document.querySelector('.atc-controls').style.display = 'none';

            return;
        }

        // Original audio playback code (for direct streams, if available)
        document.getElementById('playerAirportName').textContent = airport.name + ' (' + airport.icao + ')';
        document.getElementById('playerAirportCity').textContent = airport.city;
        document.getElementById('playerFeedName').textContent = feed.name;
        document.getElementById('playerFrequency').textContent = feed.frequency;

        this.audio.src = feed.url;
        this.audio.style.display = 'block';
        this.audio.load();
        this.audio.play().catch(err => {
            console.error('Playback error:', err);
            this.showError('Unable to start playback. Please try again.');
        });

        document.getElementById('airportList').style.display = 'none';
        document.getElementById('atcPlayer').style.display = 'block';
        document.querySelector('.atc-controls').style.display = 'none';
    }

    showAirportList() {
        document.getElementById('airportList').style.display = 'block';
        document.getElementById('atcPlayer').style.display = 'none';
        document.querySelector('.atc-controls').style.display = 'flex';
        this.audio.pause();
    }

    stopPlayback() {
        this.audio.pause();
        this.audio.src = '';
        this.showAirportList();
    }

    handleSearch(query) {
        this.renderAirportList(null, query);
    }

    handleRegionFilter(region) {
        const searchInput = document.getElementById('airportSearch');
        searchInput.value = '';
        this.renderAirportList(region === 'all' ? null : region, null);
    }

    showError(message) {
        const playerInfo = document.querySelector('.player-info');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'player-error';
        errorDiv.textContent = message;
        playerInfo.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize when live ATC interface is shown
let liveATCPlayer = null;

function initLiveATC() {
    if (!liveATCPlayer) {
        liveATCPlayer = new LiveATCPlayer();
    }
}
