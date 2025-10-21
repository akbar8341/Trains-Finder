// DOM Elements
const searchForm = document.getElementById('searchForm');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultsContainer = document.getElementById('resultsContainer');
const routeInfo = document.getElementById('routeInfo');
const trainsList = document.getElementById('trainsList');

// API Configuration
const API_BASE_URL = 'http://localhost:8080';
const SEARCH_ENDPOINT = '/search/by-code';

// Form submission handler
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sourceCode = document.getElementById('sourceCode').value.trim().toUpperCase();
    const destinationCode = document.getElementById('destinationCode').value.trim().toUpperCase();
    
    if (!sourceCode || !destinationCode) {
        showError('Please enter both source and destination station codes.');
        return;
    }
    
    if (sourceCode === destinationCode) {
        showError('Source and destination stations cannot be the same.');
        return;
    }
    
    await searchTrains(sourceCode, destinationCode);
});

// Main search function
async function searchTrains(sourceCode, destinationCode) {
    showLoading();
    hideError();
    hideResults();
    
    try {
        const url = `${API_BASE_URL}${SEARCH_ENDPOINT}?sourceCode=${encodeURIComponent(sourceCode)}&destinationCode=${encodeURIComponent(destinationCode)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        hideLoading();
        
        if (!data || data.length === 0) {
            showNoResults(sourceCode, destinationCode);
        } else {
            displayResults(data, sourceCode, destinationCode);
        }
        
    } catch (error) {
        hideLoading();
        console.error('Search error:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Unable to connect to the server. Please check if the API is running on http://localhost:8080');
        } else {
            showError(`Search failed: ${error.message}`);
        }
    }
}

// Display search results
function displayResults(trains, sourceCode, destinationCode) {
    // Update route information
    if (trains.length > 0) {
        const firstTrain = trains[0];
        routeInfo.innerHTML = `
            ${firstTrain.source.stationName} (${firstTrain.source.stationCode}) 
            → ${firstTrain.destination.stationName} (${firstTrain.destination.stationCode})
        `;
    }
    
    // Clear previous results
    trainsList.innerHTML = '';
    
    // Create train cards
    trains.forEach((train, index) => {
        const trainCard = createTrainCard(train, index);
        trainsList.appendChild(trainCard);
    });
    
    // Show results with animation delay
    setTimeout(() => {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Create individual train card
function createTrainCard(trainData, index) {
    const card = document.createElement('div');
    card.className = 'train-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const duration = calculateDuration(trainData.departureTime, trainData.arrivalTime);
    
    card.innerHTML = `
        <div class="train-header">
            <div class="train-info">
                <div class="train-name">${trainData.train.trainName}</div>
                <div class="train-number">#${trainData.train.trainNumber}</div>
            </div>
        </div>
        
        <div class="journey-details">
            <div class="station-info">
                <div class="station-time">${formatTime(trainData.departureTime)}</div>
                <div class="station-name">${trainData.source.stationName}</div>
                <div class="station-code">${trainData.source.stationCode}</div>
            </div>
            
            <div class="journey-arrow">
                <div class="duration-badge">${duration}</div>
                <div class="arrow-line"></div>
            </div>
            
            <div class="station-info">
                <div class="station-time">${formatTime(trainData.arrivalTime)}</div>
                <div class="station-name">${trainData.destination.stationName}</div>
                <div class="station-code">${trainData.destination.stationCode}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Calculate journey duration
function calculateDuration(departureTime, arrivalTime) {
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
    
    const depTotalMinutes = depHours * 60 + depMinutes;
    let arrTotalMinutes = arrHours * 60 + arrMinutes;
    
    // Handle next day arrival
    if (arrTotalMinutes < depTotalMinutes) {
        arrTotalMinutes += 24 * 60;
    }
    
    const durationMinutes = arrTotalMinutes - depTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
}

// Show loading state
function showLoading() {
    loadingElement.style.display = 'block';
}

// Hide loading state
function hideLoading() {
    loadingElement.style.display = 'none';
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Hide results
function hideResults() {
    resultsContainer.style.display = 'none';
}

// Show no results message
function showNoResults(sourceCode, destinationCode) {
    trainsList.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">🚫</div>
            <h3>No Trains Found</h3>
            <p>No trains available from <strong>${sourceCode}</strong> to <strong>${destinationCode}</strong></p>
            <p>Please check the station codes and try again.</p>
        </div>
    `;
    
    routeInfo.innerHTML = `${sourceCode} → ${destinationCode}`;
    resultsContainer.style.display = 'block';
}

// Input validation and formatting
document.getElementById('sourceCode').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-z]/g, '').toUpperCase();
});

document.getElementById('destinationCode').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-z]/g, '').toUpperCase();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideError();
    }
});

// Initialize tooltips or additional features
document.addEventListener('DOMContentLoaded', () => {
    console.log('Train Search Interface loaded successfully!');
    
    // Focus on first input
    document.getElementById('sourceCode').focus();
    
    // Add example station codes as placeholder suggestions
    const commonStations = {
        'NDLS': 'New Delhi',
        'CST': 'Mumbai Central',
        'HWH': 'Howrah Junction',
        'CSMT': 'Mumbai CST',
        'KOL': 'Kolkata',
        'BLR': 'Bangalore',
        'HYD': 'Hyderabad'
    };
    
    // You can extend this to show suggestions dropdown
    // For now, it's just for reference
    console.log('Common station codes:', commonStations);
});