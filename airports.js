// Live ATC Airport Database
// Data source: LiveATC.net

const AIRPORTS = {
    // North America
    'KJFK': {
        name: 'New York JFK',
        city: 'New York, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/kjfk_twr?nocache=2024', frequency: '123.900' },
            { name: 'Ground', url: 'https://s1-bos.liveatc.net/kjfk_gnd?nocache=2024', frequency: '121.650' },
            { name: 'Approach', url: 'https://s1-bos.liveatc.net/kjfk_app?nocache=2024', frequency: '125.700' }
        ]
    },
    'KLAX': {
        name: 'Los Angeles Intl',
        city: 'Los Angeles, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-sac.liveatc.net/klax_twr?nocache=2024', frequency: '133.900' },
            { name: 'Ground', url: 'https://s1-sac.liveatc.net/klax_gnd?nocache=2024', frequency: '121.750' },
            { name: 'Approach', url: 'https://s1-sac.liveatc.net/klax_app?nocache=2024', frequency: '124.500' }
        ]
    },
    'KORD': {
        name: 'Chicago O\'Hare',
        city: 'Chicago, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-chi.liveatc.net/kord_twr?nocache=2024', frequency: '126.900' },
            { name: 'Ground', url: 'https://s1-chi.liveatc.net/kord_gnd?nocache=2024', frequency: '121.900' },
            { name: 'Approach', url: 'https://s1-chi.liveatc.net/kord_app?nocache=2024', frequency: '125.000' }
        ]
    },
    'KATL': {
        name: 'Atlanta Hartsfield',
        city: 'Atlanta, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-atl.liveatc.net/katl_twr?nocache=2024', frequency: '119.100' },
            { name: 'Ground', url: 'https://s1-atl.liveatc.net/katl_gnd?nocache=2024', frequency: '121.750' },
            { name: 'Approach', url: 'https://s1-atl.liveatc.net/katl_app?nocache=2024', frequency: '124.850' }
        ]
    },
    'KSFO': {
        name: 'San Francisco Intl',
        city: 'San Francisco, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-sac.liveatc.net/ksfo_twr?nocache=2024', frequency: '120.500' },
            { name: 'Ground', url: 'https://s1-sac.liveatc.net/ksfo_gnd?nocache=2024', frequency: '121.800' }
        ]
    },
    'KMIA': {
        name: 'Miami Intl',
        city: 'Miami, USA',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-mia.liveatc.net/kmia_twr?nocache=2024', frequency: '118.300' },
            { name: 'Ground', url: 'https://s1-mia.liveatc.net/kmia_gnd?nocache=2024', frequency: '121.800' }
        ]
    },
    'CYYZ': {
        name: 'Toronto Pearson',
        city: 'Toronto, Canada',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-tor.liveatc.net/cyyz_twr?nocache=2024', frequency: '118.700' },
            { name: 'Ground', url: 'https://s1-tor.liveatc.net/cyyz_gnd?nocache=2024', frequency: '121.900' }
        ]
    },
    'CYVR': {
        name: 'Vancouver Intl',
        city: 'Vancouver, Canada',
        region: 'North America',
        feeds: [
            { name: 'Tower', url: 'https://s1-van.liveatc.net/cyvr_twr?nocache=2024', frequency: '119.700' },
            { name: 'Ground', url: 'https://s1-van.liveatc.net/cyvr_gnd?nocache=2024', frequency: '121.700' }
        ]
    },

    // Europe
    'EGLL': {
        name: 'London Heathrow',
        city: 'London, UK',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/egll_twr?nocache=2024', frequency: '118.700' },
            { name: 'Approach', url: 'https://s1-bos.liveatc.net/egll_app?nocache=2024', frequency: '119.200' }
        ]
    },
    'EIDW': {
        name: 'Dublin',
        city: 'Dublin, Ireland',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/eidw_twr?nocache=2024', frequency: '118.600' },
            { name: 'Approach', url: 'https://s1-bos.liveatc.net/eidw_app?nocache=2024', frequency: '121.100' }
        ]
    },
    'EHAM': {
        name: 'Amsterdam Schiphol',
        city: 'Amsterdam, Netherlands',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/eham_twr?nocache=2024', frequency: '118.400' },
            { name: 'Approach', url: 'https://s1-bos.liveatc.net/eham_app?nocache=2024', frequency: '121.200' }
        ]
    },
    'EDDF': {
        name: 'Frankfurt',
        city: 'Frankfurt, Germany',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/eddf_twr?nocache=2024', frequency: '119.900' },
            { name: 'Approach', url: 'https://s1-bos.liveatc.net/eddf_app?nocache=2024', frequency: '120.800' }
        ]
    },
    'LEMD': {
        name: 'Madrid Barajas',
        city: 'Madrid, Spain',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/lemd_twr?nocache=2024', frequency: '118.300' }
        ]
    },
    'LFPG': {
        name: 'Paris Charles de Gaulle',
        city: 'Paris, France',
        region: 'Europe',
        feeds: [
            { name: 'Tower', url: 'https://s1-bos.liveatc.net/lfpg_twr?nocache=2024', frequency: '118.150' }
        ]
    },

    // Asia Pacific
    'RJTT': {
        name: 'Tokyo Haneda',
        city: 'Tokyo, Japan',
        region: 'Asia Pacific',
        feeds: [
            { name: 'Tower', url: 'https://s1-nrt.liveatc.net/rjtt_twr?nocache=2024', frequency: '118.100' },
            { name: 'Approach', url: 'https://s1-nrt.liveatc.net/rjtt_app?nocache=2024', frequency: '119.100' }
        ]
    },
    'YSSY': {
        name: 'Sydney Kingsford Smith',
        city: 'Sydney, Australia',
        region: 'Asia Pacific',
        feeds: [
            { name: 'Tower', url: 'https://s1-syd.liveatc.net/yssy_twr?nocache=2024', frequency: '120.500' },
            { name: 'Approach', url: 'https://s1-syd.liveatc.net/yssy_app?nocache=2024', frequency: '124.400' }
        ]
    },
    'YMML': {
        name: 'Melbourne',
        city: 'Melbourne, Australia',
        region: 'Asia Pacific',
        feeds: [
            { name: 'Tower', url: 'https://s1-mel.liveatc.net/ymml_twr?nocache=2024', frequency: '120.500' },
            { name: 'Approach', url: 'https://s1-mel.liveatc.net/ymml_app?nocache=2024', frequency: '125.600' }
        ]
    },
    'VHHH': {
        name: 'Hong Kong Intl',
        city: 'Hong Kong',
        region: 'Asia Pacific',
        feeds: [
            { name: 'Tower', url: 'https://s1-hkg.liveatc.net/vhhh_twr?nocache=2024', frequency: '118.200' }
        ]
    },
    'WSSS': {
        name: 'Singapore Changi',
        city: 'Singapore',
        region: 'Asia Pacific',
        feeds: [
            { name: 'Tower', url: 'https://s1-sin.liveatc.net/wsss_twr?nocache=2024', frequency: '118.700' }
        ]
    },

    // Middle East
    'OMDB': {
        name: 'Dubai Intl',
        city: 'Dubai, UAE',
        region: 'Middle East',
        feeds: [
            { name: 'Tower', url: 'https://s1-dxb.liveatc.net/omdb_twr?nocache=2024', frequency: '118.750' }
        ]
    },

    // Popular US Training Airports
    'KVNY': {
        name: 'Van Nuys',
        city: 'Los Angeles, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'Tower', url: 'https://s1-sac.liveatc.net/kvny_twr?nocache=2024', frequency: '118.050' }
        ]
    },
    'KPAO': {
        name: 'Palo Alto',
        city: 'San Francisco Bay Area, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'Tower', url: 'https://s1-sac.liveatc.net/kpao_twr?nocache=2024', frequency: '118.600' }
        ]
    },
    'KSNA': {
        name: 'John Wayne Orange County',
        city: 'Orange County, USA',
        region: 'North America (Training)',
        feeds: [
            { name: 'Tower', url: 'https://s1-sac.liveatc.net/ksna_twr?nocache=2024', frequency: '119.800' },
            { name: 'Ground', url: 'https://s1-sac.liveatc.net/ksna_gnd?nocache=2024', frequency: '121.800' }
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
