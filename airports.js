// Live ATC Airport Database
// Links to LiveATC.net feeds

const AIRPORTS = {
    // North America - Major Airports
    'KJFK': {
        name: 'New York JFK',
        city: 'New York, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://www.liveatc.net/search/?icao=kjfk', frequency: '123.900', external: true },
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kjfk', frequency: 'Multiple', external: true }
        ]
    },
    'KLAX': {
        name: 'Los Angeles Intl',
        city: 'Los Angeles, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=klax', frequency: 'Multiple', external: true }
        ]
    },
    'KORD': {
        name: 'Chicago O\'Hare',
        city: 'Chicago, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kord', frequency: 'Multiple', external: true }
        ]
    },
    'KATL': {
        name: 'Atlanta Hartsfield',
        city: 'Atlanta, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=katl', frequency: 'Multiple', external: true }
        ]
    },
    'KSFO': {
        name: 'San Francisco Intl',
        city: 'San Francisco, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=ksfo', frequency: 'Multiple', external: true }
        ]
    },
    'KBOS': {
        name: 'Boston Logan',
        city: 'Boston, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kbos', frequency: 'Multiple', external: true }
        ]
    },
    'KDFW': {
        name: 'Dallas/Fort Worth',
        city: 'Dallas, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kdfw', frequency: 'Multiple', external: true }
        ]
    },
    'KDEN': {
        name: 'Denver Intl',
        city: 'Denver, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kden', frequency: 'Multiple', external: true }
        ]
    },
    'KMIA': {
        name: 'Miami Intl',
        city: 'Miami, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kmia', frequency: 'Multiple', external: true }
        ]
    },
    'KLAS': {
        name: 'Las Vegas McCarran',
        city: 'Las Vegas, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=klas', frequency: 'Multiple', external: true }
        ]
    },
    'KSEA': {
        name: 'Seattle-Tacoma',
        city: 'Seattle, USA',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=ksea', frequency: 'Multiple', external: true }
        ]
    },
    'CYYZ': {
        name: 'Toronto Pearson',
        city: 'Toronto, Canada',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=cyyz', frequency: 'Multiple', external: true }
        ]
    },
    'CYVR': {
        name: 'Vancouver Intl',
        city: 'Vancouver, Canada',
        region: 'North America',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=cyvr', frequency: 'Multiple', external: true }
        ]
    },

    // Europe
    'EGLL': {
        name: 'London Heathrow',
        city: 'London, UK',
        region: 'Europe',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=egll', frequency: 'Multiple', external: true }
        ]
    },
    'EHAM': {
        name: 'Amsterdam Schiphol',
        city: 'Amsterdam, Netherlands',
        region: 'Europe',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=eham', frequency: 'Multiple', external: true }
        ]
    },

    // Popular Training Airports
    'KVNY': {
        name: 'Van Nuys',
        city: 'Los Angeles, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kvny', frequency: '118.050', external: true }
        ]
    },
    'KPAO': {
        name: 'Palo Alto',
        city: 'San Francisco Bay, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kpao', frequency: '118.600', external: true }
        ]
    },
    'KSNA': {
        name: 'John Wayne Orange County',
        city: 'Orange County, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=ksna', frequency: 'Multiple', external: true }
        ]
    },
    'KSDL': {
        name: 'Scottsdale',
        city: 'Phoenix, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=ksdl', frequency: '118.300', external: true }
        ]
    },
    'KAPA': {
        name: 'Centennial (Denver)',
        city: 'Denver, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'All Feeds', url: 'https://www.liveatc.net/search/?icao=kapa', frequency: 'Multiple', external: true }
        ]
    }
};

// Group airports by region
function getAirportsByRegion() {
    const regions = {};
    
    for (const [icao, airport] of Object.entries(AIRPORTS)) {
        const region = airport.region;
        if (!regions[region]) {
            regions[region] = [];
        }
        regions[region].push({ icao, ...airport });
    }
    
    return regions;
}

// Search airports
function searchAirports(query) {
    query = query.toLowerCase();
    const results = [];
    
    for (const [icao, airport] of Object.entries(AIRPORTS)) {
        if (icao.toLowerCase().includes(query) ||
            airport.name.toLowerCase().includes(query) ||
            airport.city.toLowerCase().includes(query)) {
            results.push({ icao, ...airport });
        }
    }
    
    return results;
}
