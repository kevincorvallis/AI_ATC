// Navigation System for ATC Training App
class NavigationManager {
    constructor() {
        this.history = ['Home'];
        this.backButton = document.getElementById('backButton');
        this.homeButton = document.getElementById('homeButton');
        this.breadcrumbs = document.getElementById('breadcrumbs');

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.goBack());
        }

        if (this.homeButton) {
            this.homeButton.addEventListener('click', () => this.goHome());
        }
    }

    pushState(pageName) {
        this.history.push(pageName);
        this.updateUI();
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            const previousPage = this.history[this.history.length - 1];
            this.navigateTo(previousPage);
            this.updateUI();
        }
    }

    goHome() {
        this.history = ['Home'];
        this.navigateTo('Home');
        this.updateUI();
    }

    navigateTo(pageName) {
        // Hide all interfaces
        const interfaces = [
            '.main-menu',
            '.scenario-selection',
            '#individualScenarioSelection',
            '#liveAtcInterface',
            '#commInterface',
            '#customModeInterface'
        ];

        interfaces.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show the appropriate interface with animation
        switch(pageName) {
            case 'Home':
                this.showWithAnimation('.main-menu');
                break;
            case 'AI Training':
                this.showWithAnimation('.scenario-selection');
                break;
            case 'Custom Mode':
                if (window.customMode) {
                    window.customMode.showCustomModeInterface();
                }
                break;
            case 'Live ATC':
                this.showWithAnimation('#liveAtcInterface');
                break;
            case 'Tutorial':
                // Tutorial mode
                if (window.tutorial) {
                    window.tutorial.start();
                }
                break;
            default:
                this.showWithAnimation('.main-menu');
        }
    }

    showWithAnimation(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'block';
            element.classList.add('animate__animated', 'animate__fadeIn', 'animate__faster');

            // Remove animation classes after animation completes
            setTimeout(() => {
                element.classList.remove('animate__animated', 'animate__fadeIn', 'animate__faster');
            }, 600);
        }
    }

    updateUI() {
        // Update breadcrumbs
        if (this.breadcrumbs) {
            this.breadcrumbs.innerHTML = this.history.map((page, index) => {
                const isActive = index === this.history.length - 1;
                return `<span class="breadcrumb-item ${isActive ? 'active' : ''}">${page}</span>`;
            }).join('');
        }

        // Show/hide back button
        if (this.backButton) {
            this.backButton.style.display = this.history.length > 1 ? 'flex' : 'none';
        }
    }

    getCurrentPage() {
        return this.history[this.history.length - 1];
    }

    clearHistory() {
        this.history = ['Home'];
        this.updateUI();
    }
}

// Initialize navigation when DOM is ready
let navigationManager;

document.addEventListener('DOMContentLoaded', () => {
    navigationManager = new NavigationManager();

    // Hook into existing buttons
    hookNavigationButtons();
});

function hookNavigationButtons() {
    // Training Mode Button
    const trainingBtn = document.getElementById('trainingModeBtn');
    if (trainingBtn) {
        const originalClick = trainingBtn.onclick;
        trainingBtn.onclick = function(e) {
            navigationManager.pushState('AI Training');
            if (originalClick) originalClick.call(this, e);
        };
    }

    // Custom Mode Button
    const customBtn = document.getElementById('customModeBtn');
    if (customBtn) {
        const originalClick = customBtn.onclick;
        customBtn.onclick = function(e) {
            navigationManager.pushState('Custom Mode');
            if (originalClick) originalClick.call(this, e);
        };
    }

    // Live ATC Button
    const liveAtcBtn = document.getElementById('liveAtcModeBtn');
    if (liveAtcBtn) {
        const originalClick = liveAtcBtn.onclick;
        liveAtcBtn.onclick = function(e) {
            navigationManager.pushState('Live ATC');
            if (originalClick) originalClick.call(this, e);
        };
    }

    // Tutorial Button
    const tutorialBtn = document.getElementById('tutorialModeBtn');
    if (tutorialBtn) {
        const originalClick = tutorialBtn.onclick;
        tutorialBtn.onclick = function(e) {
            navigationManager.pushState('Tutorial');
            if (originalClick) originalClick.call(this, e);
        };
    }

    // Individual scenario selection
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const categoryName = this.querySelector('h3')?.textContent || 'Scenario';
            navigationManager.pushState(categoryName);
        });
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}
