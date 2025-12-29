// Feedback and Scoring Engine - Provides detailed feedback and tracks performance
// Manages difficulty levels and adaptive learning

class FeedbackEngine {
    constructor() {
        this.difficulty = 'beginner'; // beginner, intermediate, advanced
        this.sessionScores = [];
        this.cumulativeScore = 0;
        this.transmissionCount = 0;
        this.feedbackHistory = [];
    }

    /**
     * Set difficulty level
     */
    setDifficulty(level) {
        if (['beginner', 'intermediate', 'advanced'].includes(level)) {
            this.difficulty = level;
            this.updateUIForDifficulty();
        }
    }

    /**
     * Process transmission and generate comprehensive feedback
     */
    processFeedback(pilotMessage, atcMessage, scenarioState) {
        // Get phraseology analysis
        const phraseologyAnalysis = window.phraseologyValidator?.validateTransmission(
            pilotMessage,
            {
                lastATCMessage: atcMessage,
                inConversation: this.transmissionCount > 0,
                scenarioState: scenarioState
            }
        ) || {};

        // Get contextual expectations
        const hint = window.scenarioStateMachine?.getCurrentHint() || {};

        // Generate feedback based on difficulty
        const feedback = this.generateFeedback(phraseologyAnalysis, hint);

        // Update session stats
        this.sessionScores.push(phraseologyAnalysis.score || 0);
        this.cumulativeScore += phraseologyAnalysis.score || 0;
        this.transmissionCount++;
        this.feedbackHistory.push({
            timestamp: new Date(),
            message: pilotMessage,
            score: phraseologyAnalysis.score,
            feedback: feedback
        });

        return {
            analysis: phraseologyAnalysis,
            feedback: feedback,
            sessionAverage: this.getSessionAverage(),
            showFeedback: this.shouldShowFeedback()
        };
    }

    /**
     * Generate feedback message based on difficulty
     */
    generateFeedback(analysis, hint) {
        const messages = [];

        // Difficulty-based feedback verbosity
        if (this.difficulty === 'beginner') {
            // Very detailed feedback for beginners
            if (analysis.criticalIssues?.length > 0) {
                messages.push({
                    type: 'critical',
                    title: 'Critical Issues',
                    items: analysis.criticalIssues.map(issue => ({
                        message: issue.message,
                        suggestion: issue.suggestion
                    }))
                });
            }

            if (analysis.warnings?.length > 0) {
                messages.push({
                    type: 'warning',
                    title: 'Suggestions for Improvement',
                    items: analysis.warnings.map(warning => ({
                        message: warning.message,
                        suggestion: warning.suggestion
                    }))
                });
            }

            if (analysis.feedback?.length > 0) {
                messages.push({
                    type: 'tip',
                    title: 'Radio Tips',
                    items: analysis.feedback.map(fb => ({
                        message: fb.message,
                        suggestion: fb.suggestion
                    }))
                });
            }

            // Provide encouragement and next steps
            if (hint.shouldDo) {
                messages.push({
                    type: 'next',
                    title: 'What\'s Next',
                    items: [{
                        message: hint.shouldDo,
                        suggestion: hint.example
                    }]
                });
            }

        } else if (this.difficulty === 'intermediate') {
            // Moderate feedback - only critical and important warnings
            if (analysis.criticalIssues?.length > 0) {
                messages.push({
                    type: 'critical',
                    title: 'Critical',
                    items: analysis.criticalIssues.map(issue => ({
                        message: issue.message
                    }))
                });
            }

            if (analysis.warnings?.length > 0) {
                // Only show high-severity warnings
                const highSeverity = analysis.warnings.filter(w => w.severity === 'high');
                if (highSeverity.length > 0) {
                    messages.push({
                        type: 'warning',
                        title: 'Note',
                        items: highSeverity.map(w => ({ message: w.message }))
                    });
                }
            }

        } else if (this.difficulty === 'advanced') {
            // Minimal feedback - only critical safety issues
            if (analysis.criticalIssues?.length > 0) {
                const criticalSafety = analysis.criticalIssues.filter(
                    issue => issue.type === 'missing_readback'
                );
                if (criticalSafety.length > 0) {
                    messages.push({
                        type: 'critical',
                        items: criticalSafety.map(issue => ({
                            message: issue.message
                        }))
                    });
                }
            }
        }

        // Performance rating (all difficulties)
        const rating = window.phraseologyValidator?.getPerformanceRating(analysis.score || 0);
        messages.push({
            type: 'score',
            rating: rating,
            score: analysis.score
        });

        return messages;
    }

    /**
     * Determine if feedback should be shown based on difficulty
     */
    shouldShowFeedback() {
        // Beginners get feedback every transmission
        if (this.difficulty === 'beginner') return true;

        // Intermediate gets feedback on errors or every 3rd transmission
        if (this.difficulty === 'intermediate') {
            return this.transmissionCount % 3 === 0;
        }

        // Advanced only gets critical feedback (handled in generateFeedback)
        return false;
    }

    /**
     * Display feedback in UI
     */
    displayFeedback(feedbackData) {
        // Ensure conversation element exists
        const conversation = document.getElementById('conversation');
        if (!conversation) {
            console.warn('Conversation element not found, cannot display feedback');
            return;
        }

        // Create or update feedback panel
        let feedbackPanel = document.getElementById('feedbackPanel');

        if (!feedbackPanel) {
            feedbackPanel = document.createElement('div');
            feedbackPanel.id = 'feedbackPanel';
            feedbackPanel.className = 'feedback-panel';
            conversation.appendChild(feedbackPanel);
        }

        if (!feedbackData.showFeedback && this.difficulty !== 'beginner') {
            feedbackPanel.style.display = 'none';
            return;
        }

        feedbackPanel.style.display = 'block';
        feedbackPanel.innerHTML = '';

        // Build feedback UI
        const feedbackContent = document.createElement('div');
        feedbackContent.className = 'feedback-content';

        // Display each feedback message
        feedbackData.feedback.forEach(msg => {
            const section = document.createElement('div');
            section.className = `feedback-section feedback-${msg.type}`;

            if (msg.title) {
                const title = document.createElement('div');
                title.className = 'feedback-title';
                title.textContent = msg.title;
                section.appendChild(title);
            }

            if (msg.items) {
                const list = document.createElement('ul');
                list.className = 'feedback-list';

                msg.items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span class="feedback-message">${item.message}</span>
                        ${item.suggestion ? `<span class="feedback-suggestion">${item.suggestion}</span>` : ''}
                    `;
                    list.appendChild(li);
                });

                section.appendChild(list);
            }

            if (msg.type === 'score' && msg.rating) {
                const scoreDisplay = document.createElement('div');
                scoreDisplay.className = 'score-display';
                scoreDisplay.innerHTML = `
                    <div class="score-value" style="color: ${msg.rating.color};">
                        ${msg.score}/100
                    </div>
                    <div class="score-rating">${msg.rating.icon} ${msg.rating.rating}</div>
                    <div class="score-average">Session Average: ${feedbackData.sessionAverage}</div>
                `;
                section.appendChild(scoreDisplay);
            }

            feedbackContent.appendChild(section);
        });

        feedbackPanel.appendChild(feedbackContent);

        // Scroll into view
        feedbackPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Get session average score
     */
    getSessionAverage() {
        if (this.sessionScores.length === 0) return 0;
        const sum = this.sessionScores.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.sessionScores.length);
    }

    /**
     * Get performance trend
     */
    getPerformanceTrend() {
        if (this.sessionScores.length < 5) return 'insufficient_data';

        const recent = this.sessionScores.slice(-5);
        const earlier = this.sessionScores.slice(-10, -5);

        if (earlier.length === 0) return 'insufficient_data';

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

        if (recentAvg > earlierAvg + 5) return 'improving';
        if (recentAvg < earlierAvg - 5) return 'declining';
        return 'stable';
    }

    /**
     * Suggest difficulty adjustment based on performance
     */
    suggestDifficultyAdjustment() {
        const avg = this.getSessionAverage();

        if (this.difficulty === 'beginner' && avg >= 90 && this.transmissionCount >= 10) {
            return {
                suggested: 'intermediate',
                reason: 'Excellent performance! Ready for intermediate level?'
            };
        }

        if (this.difficulty === 'intermediate' && avg >= 92 && this.transmissionCount >= 15) {
            return {
                suggested: 'advanced',
                reason: 'Outstanding! Ready for advanced (realistic) mode?'
            };
        }

        if (this.difficulty === 'intermediate' && avg < 60 && this.transmissionCount >= 8) {
            return {
                suggested: 'beginner',
                reason: 'Consider beginner mode for more detailed guidance?'
            };
        }

        if (this.difficulty === 'advanced' && avg < 70 && this.transmissionCount >= 8) {
            return {
                suggested: 'intermediate',
                reason: 'Consider intermediate mode for feedback?'
            };
        }

        return null;
    }

    /**
     * Update UI elements based on difficulty
     */
    updateUIForDifficulty() {
        const difficultyIndicator = document.getElementById('difficultyIndicator');
        if (difficultyIndicator) {
            const labels = {
                beginner: 'Student Pilot',
                intermediate: 'Private Pilot',
                advanced: 'Experienced Pilot'
            };
            difficultyIndicator.textContent = labels[this.difficulty];
        }

        // Show/hide hints based on difficulty
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = this.difficulty === 'advanced' ? 'none' : 'block';
        }
    }

    /**
     * Reset session
     */
    resetSession() {
        this.sessionScores = [];
        this.cumulativeScore = 0;
        this.transmissionCount = 0;
        this.feedbackHistory = [];

        const feedbackPanel = document.getElementById('feedbackPanel');
        if (feedbackPanel) {
            feedbackPanel.innerHTML = '';
            feedbackPanel.style.display = 'none';
        }
    }

    /**
     * Get session summary for end-of-session review
     */
    getSessionSummary() {
        return {
            transmissionCount: this.transmissionCount,
            averageScore: this.getSessionAverage(),
            highScore: Math.max(...this.sessionScores, 0),
            lowScore: Math.min(...this.sessionScores, 100),
            trend: this.getPerformanceTrend(),
            criticalIssuesCount: this.feedbackHistory.filter(
                f => f.feedback.some(msg => msg.type === 'critical')
            ).length,
            suggestedDifficulty: this.suggestDifficultyAdjustment()
        };
    }
}

// Create global instance
window.feedbackEngine = new FeedbackEngine();
