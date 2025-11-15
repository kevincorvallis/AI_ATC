// Interactive Airport Map using Leaflet.js

class AirportMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.selectedAirport = null;
    }

    initMap() {
        // Create map centered on North America
        this.map = L.map('airportMap').setView([40, -95], 4);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 2
        }).addTo(this.map);

        // Add airports to map
        this.addAirportMarkers();

        // Add legend
        this.addLegend();
    }

    addAirportMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Add marker for each airport
        for (const [icao, airport] of Object.entries(AIRPORTS)) {
            if (!airport.lat || !airport.lon) continue;

            // Color based on region
            const color = this.getRegionColor(airport.region);

            // Create custom icon
            const icon = L.divIcon({
                className: 'airport-marker',
                html: `<div class="marker-pin" style="background-color: ${color};">
                         <span class="marker-icon">✈️</span>
                       </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });

            // Create marker
            const marker = L.marker([airport.lat, airport.lon], { icon })
                .addTo(this.map);

            // Create popup content
            const popupContent = `
                <div class="map-popup">
                    <h3>${airport.name}</h3>
                    <p class="popup-city">${airport.city}</p>
                    <p class="popup-icao"><strong>ICAO:</strong> ${icao}</p>
                    <p class="popup-region"><strong>Region:</strong> ${airport.region}</p>
                    <div class="popup-buttons">
                        <button class="btn-listen" onclick="listenFromMap('${icao}')">
                            📻 Listen to ATC
                        </button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);

            // Store marker
            this.markers.push(marker);

            // Store ICAO with marker for filtering
            marker.icao = icao;
            marker.airportData = airport;
        }
    }

    getRegionColor(region) {
        const colors = {
            'North America': '#3b82f6',
            'North America (Training)': '#10b981',
            'Europe': '#f59e0b',
            'Asia Pacific': '#ef4444',
            'Middle East': '#8b5cf6'
        };
        return colors[region] || '#64748b';
    }

    addLegend() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <h4>Airport Regions</h4>
                <div class="legend-item">
                    <span class="legend-color" style="background: #3b82f6;"></span>
                    North America
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #10b981;"></span>
                    Training Airports
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #f59e0b;"></span>
                    Europe
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #ef4444;"></span>
                    Asia Pacific
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #8b5cf6;"></span>
                    Middle East
                </div>
            `;
            return div;
        };

        legend.addTo(this.map);
    }

    filterByRegion(region) {
        this.markers.forEach(marker => {
            if (region === 'all' || marker.airportData.region === region) {
                marker.addTo(this.map);
            } else {
                marker.remove();
            }
        });
    }

    focusOnAirport(icao) {
        const marker = this.markers.find(m => m.icao === icao);
        if (marker) {
            this.map.setView([marker.airportData.lat, marker.airportData.lon], 10);
            marker.openPopup();
        }
    }

    zoomToFitAll() {
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
    }

    randomAirport() {
        const icaoCodes = Object.keys(AIRPORTS);
        const randomIcao = icaoCodes[Math.floor(Math.random() * icaoCodes.length)];
        this.focusOnAirport(randomIcao);
        return randomIcao;
    }
}

// Global airport map instance
let airportMap = null;

// Initialize map when tab is shown
function showAirportMap() {
    if (!airportMap) {
        // Wait for DOM to be ready
        setTimeout(() => {
            airportMap = new AirportMap();
            airportMap.initMap();
        }, 100);
    } else {
        // Refresh map size
        setTimeout(() => {
            airportMap.map.invalidateSize();
        }, 100);
    }
}

// Listen to ATC from map popup
function listenFromMap(icao) {
    const airport = AIRPORTS[icao];
    if (airport && airport.feeds && airport.feeds.length > 0) {
        const feed = airport.feeds[0];
        if (feed.external) {
            window.open(feed.url, 'liveatc_' + icao, 'width=1000,height=700,menubar=no,toolbar=no,location=no');
        }
    }
}

// Random airport button
function randomAirportFromMap() {
    if (airportMap) {
        airportMap.randomAirport();
    }
}
