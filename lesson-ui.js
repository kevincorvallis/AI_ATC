// A short, local departure lesson. Speech only starts after a deliberate action.
(function () {
    'use strict';

    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const storage = () => { try { return window.localStorage; } catch { return null; } };
    const phaseNames = { 'initial-call': 'Ground', 'taxi-readback': 'Taxi', 'tower-handoff': 'Handoff', 'tower-call': 'Tower', 'hold-short': 'Hold short', 'takeoff-readback': 'Takeoff' };

    class DepartureLesson {
        constructor() {
            this.mount = document.getElementById('departureLesson');
            this.session = null;
            this.voice = null;
            this.speed = 0.85;
            this.microphoneAcknowledged = false;
            this.onClick = event => this.handleClick(event);
            this.onSubmit = event => { event.preventDefault(); this.transmit(); };
            this.onChange = event => {
                if (event.target.matches('[data-departure-speed]')) {
                    this.speed = Number(event.target.value);
                    this.voice?.stopSpeaking();
                }
            };
            this.onToggle = event => {
                if (!this.passed && event.target.matches('[data-controller-transcript]') && event.target.open) {
                    this.session?.markAssistance('transcript');
                }
            };
            this.onVisibility = () => { if (document.hidden) this.voice?.cancel(); };
            this.onPageHide = () => this.voice?.cancel();
            this.updateRecent();
        }

        start(options = {}) {
            this.stop();
            this.mount = document.getElementById('departureLesson');
            if (!this.mount || !window.WilcoLesson?.LessonSession) return;
            this.session = new window.WilcoLesson.LessonSession(options);
            this.mount.addEventListener('click', this.onClick);
            this.mount.addEventListener('submit', this.onSubmit);
            this.mount.addEventListener('change', this.onChange);
            this.mount.addEventListener('toggle', this.onToggle, true);
            document.addEventListener('visibilitychange', this.onVisibility);
            window.addEventListener('pagehide', this.onPageHide);
            const Voice = window.WilcoVoice?.LessonVoice;
            if (Voice) {
                this.voice = new Voice({
                    onState: state => this.updateVoiceState(state),
                    onTranscript: text => {
                        const draft = this.mount.querySelector('[data-departure-draft]');
                        if (draft && this.session && !this.passed) {
                            draft.value = String(text).slice(0, 1000);
                        }
                    },
                    onError: message => this.voiceMessage(message)
                });
            }
            window.atcApp?.showView('departure');
            this.renderStep();
            this.mount.querySelector('h2')?.focus();
        }

        stop() {
            this.voice?.destroy();
            this.voice = null;
            this.session = null;
            if (this.mount) {
                this.mount.removeEventListener('click', this.onClick);
                this.mount.removeEventListener('submit', this.onSubmit);
                this.mount.removeEventListener('change', this.onChange);
                this.mount.removeEventListener('toggle', this.onToggle, true);
            }
            document.removeEventListener('visibilitychange', this.onVisibility);
            window.removeEventListener('pagehide', this.onPageHide);
        }

        updateRecent(summary) {
            const recent = document.getElementById('departureRecent');
            if (!recent || !window.WilcoLesson) return;
            const last = summary || window.WilcoLesson.loadProgress(storage())?.lastSummary;
            recent.textContent = last
                ? `Last practice: ${last.completed} of ${last.total} exchanges completed. ${last.firstTry} on the first try.`
                : '';
        }

        renderStep() {
            const step = this.session?.currentStep;
            if (!step) { this.renderDebrief(); return; }
            this.passed = false;
            this.audioPlays = 0;
            this.extraHelp = 0;
            this.voice?.cancel();
            const hasController = Boolean(step.controller?.trim());
            const speechSupported = Boolean(this.voice?.supportedSpeech);
            const recognitionSupported = Boolean(this.voice?.supportedRecognition);
            const guidance = step.guidance === 'example' ? 'Follow an example'
                : step.guidance === 'hint' ? 'Use a short hint' : 'Try it independently';
            this.mount.innerHTML = `
                <div class="departure-topbar">
                    <p class="departure-course-name">Departure practice <span>About five minutes</span></p>
                    <button class="departure-text-button" type="button" id="departureExit" data-departure-action="exit">Exit lesson</button>
                </div>
                <ol class="departure-progress" style="--departure-step-count: ${this.session.steps.length}" aria-label="Lesson progress">
                    ${this.session.steps.map((item, index) => `
                        <li class="departure-progress-step ${index < this.session.index ? 'departure-done' : ''}" aria-label="${escape(item.title)}"
                            ${index === this.session.index ? 'aria-current="step"' : ''}>
                            <span class="departure-step-number" aria-hidden="true">${index < this.session.index ? '✓' : index + 1}</span>
                            <span class="departure-step-name">${escape(phaseNames[item.id] || item.title)}</span>
                        </li>`).join('')}
                </ol>
                <div class="departure-heading">
                    <p class="departure-context">Exchange ${this.session.index + 1} of ${this.session.steps.length} · ${escape(step.phase)}</p>
                    <h2 class="departure-title" tabindex="-1">${escape(step.title)}</h2>
                    <p class="departure-briefing">${escape(step.briefing)}</p>
                </div>
                <div class="departure-workspace">
                    <section class="departure-controller" aria-labelledby="departureControllerTitle">
                        <h3 id="departureControllerTitle">${hasController ? 'On the frequency' : 'Your call comes first'}</h3>
                        <p class="departure-listen-note">${hasController ? 'Listen for the details you need to read back.' : 'The fictional frequency is clear. Use the situation above to make your initial call.'}</p>
                        ${hasController ? `<button class="departure-audio-button" type="button" id="departurePlay" data-departure-action="play" ${speechSupported ? '' : 'disabled'}>
                            <span aria-hidden="true" class="departure-play-icon">▶</span>
                            <span data-play-label>Listen to controller</span>
                        </button>
                        <label class="departure-speed-label">Playback speed
                            <select class="departure-speed" data-departure-speed ${speechSupported ? '' : 'disabled'}>
                                <option value="0.7" ${this.speed === 0.7 ? 'selected' : ''}>Slower</option>
                                <option value="0.85" ${this.speed === 0.85 ? 'selected' : ''}>Practice pace</option>
                                <option value="1" ${this.speed === 1 ? 'selected' : ''}>Normal</option>
                            </select>
                        </label>
                        <details class="departure-transcript" data-controller-transcript ${speechSupported ? '' : 'open'}>
                            <summary id="departureTranscriptToggle">Read controller words</summary>
                            <p>${escape(step.controller)}</p>
                        </details>
                        ${speechSupported ? '' : '<p class="departure-audio-fallback">Audio playback is unavailable in this browser. The written transmission has everything you need.</p>'}` : '<p class="departure-initial-call">Name the controller. Identify your aircraft. Then say where you are and what you need.</p>'}
                    </section>
                    <section class="departure-response" aria-labelledby="departureResponseTitle">
                        <div class="departure-response-heading">
                            <h3 id="departureResponseTitle">Your transmission</h3>
                            <span class="departure-guidance-label">${guidance}</span>
                        </div>
                        <div class="departure-guidance" data-departure-guidance>${this.guidanceHTML(step)}</div>
                        <form class="departure-form">
                            <label for="departureInput" class="departure-draft-label">Say it aloud or type your response</label>
                            <button class="departure-mic-button" type="button" id="departureRecord" data-departure-action="microphone"
                                aria-pressed="false" ${recognitionSupported ? '' : 'disabled'}>
                                <svg width="22" height="28" viewBox="0 0 24 30" fill="none" aria-hidden="true"><rect x="8" y="2" width="8" height="17" rx="4" stroke="currentColor" stroke-width="2"/><path d="M4 13v2a8 8 0 0 0 16 0v-2M12 23v5M7 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                                <span data-mic-label>${recognitionSupported ? 'Start microphone' : 'Type your response below'}</span>
                            </button>
                            <p class="departure-input-note">${recognitionSupported
                                ? 'Speech fills an editable draft. Nothing transmits until you choose.'
                                : 'Voice entry is unavailable in this browser. You can complete the lesson by typing.'}</p>
                            <div class="departure-speech-disclosure" data-speech-disclosure hidden>
                                <p>Your browser may send audio to its speech service. Wilco does not save recordings.</p>
                                <button class="departure-small-button" type="button" data-departure-action="enable-microphone">Enable microphone</button>
                                <button class="departure-text-button" type="button" data-departure-action="dismiss-microphone">Keep typing</button>
                            </div>
                            <textarea class="departure-draft" id="departureInput" data-departure-draft rows="4" maxlength="1000"
                                aria-describedby="departureDraftHelp" placeholder="Your callsign, then the details that matter…" spellcheck="false"></textarea>
                            <p id="departureDraftHelp" class="departure-input-note">Review your words before transmitting. You can also ask “Say again.”</p>
                            <p class="departure-voice-message" data-voice-message role="status" aria-live="polite"></p>
                            <button class="departure-transmit" type="submit" id="departureTransmit" data-departure-transmit>Transmit response</button>
                        </form>
                    </section>
                </div>
                <div class="departure-feedback" data-departure-feedback role="status" aria-live="polite" aria-atomic="true" hidden></div>
                <p class="departure-simulation-note">A scripted learning exercise, not a flight clearance. Frequencies and instructions here are illustrative.</p>
            `;
            if (step.guidance !== 'independent') this.session.markAssistance(step.guidance);
            if (hasController && !speechSupported) this.session.markAssistance('transcript');
            this.updateVoiceState(this.voice?.state || { listening: false, speaking: false, pending: false });
        }

        guidanceHTML(step) {
            if (step.guidance === 'example' || this.extraHelp >= 2) {
                return `<p class="departure-example">“${escape(step.example)}”</p>
                    <button class="departure-text-button" type="button" id="departureExample" data-departure-action="example">Use this example</button>`;
            }
            if (step.guidance === 'hint' || this.extraHelp >= 1) {
                return `<p>${escape(step.hint)}</p>
                    <button class="departure-text-button" type="button" id="departureHint" data-departure-action="help">Show an example</button>`;
            }
            return '<p>Build this readback yourself. Keep the critical details and your callsign.</p><button class="departure-text-button" type="button" id="departureHint" data-departure-action="help">Get a hint</button>';
        }

        handleClick(event) {
            const button = event.target.closest('[data-departure-action]');
            if (!button || !this.mount.contains(button) || button.disabled) return;
            const action = button.dataset.departureAction;
            if (action === 'exit') {
                this.stop();
                window.atcApp?.showView('categories');
                return;
            }
            if (action === 'restart') { this.start(); return; }
            if (action === 'retry-skills') {
                const stepIds = this.lastSummary?.retryStepIds;
                this.start({ stepIds });
                return;
            }
            if (!this.session?.currentStep) return;
            if (action === 'play') {
                if (this.voice?.state?.speaking) this.voice.stopSpeaking();
                else {
                    if (!this.passed && this.audioPlays > 0) this.session.markAssistance('repeat');
                    if (!this.passed && this.speed < 0.85) this.session.markAssistance('slow');
                    this.audioPlays += 1;
                    this.voice?.speak(this.session.currentStep.controller, this.speed);
                    this.updateVoiceState(this.voice?.state || {});
                }
            } else if (action === 'microphone') {
                if (this.voice?.state?.listening || this.voice?.state?.pending) this.voice.stopListening();
                else if (this.microphoneAcknowledged) this.startMicrophone();
                else {
                    this.mount.querySelector('[data-speech-disclosure]').hidden = false;
                    this.mount.querySelector('[data-departure-action="enable-microphone"]').focus();
                }
            } else if (action === 'enable-microphone') {
                this.microphoneAcknowledged = true;
                this.mount.querySelector('[data-speech-disclosure]').hidden = true;
                this.startMicrophone();
            } else if (action === 'dismiss-microphone') {
                this.mount.querySelector('[data-speech-disclosure]').hidden = true;
                this.mount.querySelector('[data-departure-draft]').focus();
            } else if (action === 'example') {
                if (this.passed) return;
                this.session.markAssistance('example');
                const draft = this.mount.querySelector('[data-departure-draft]');
                if (!draft.readOnly && !draft.disabled) {
                    draft.value = this.session.currentStep.example;
                    draft.focus();
                }
            } else if (action === 'help') {
                if (this.passed) return;
                this.extraHelp = this.session.currentStep.guidance === 'hint' ? 2 : this.extraHelp + 1;
                this.session.markAssistance(this.extraHelp >= 2 ? 'example' : 'hint');
                const guidance = this.mount.querySelector('[data-departure-guidance]');
                guidance.innerHTML = this.guidanceHTML(this.session.currentStep);
                guidance.querySelector('button')?.focus();
            } else if (action === 'next') {
                if (!this.session.advance()) return;
                if (this.session.complete) this.renderDebrief();
                else {
                    this.renderStep();
                    this.mount.querySelector('[data-departure-draft]')?.focus();
                }
            }
        }

        startMicrophone() {
            if (this.passed || !this.voice?.supportedRecognition) return;
            this.voiceMessage('');
            this.voice.startListening();
            this.mount.querySelector('[data-departure-action="microphone"]')?.focus();
        }

        updateVoiceState(state) {
            if (!this.mount || !this.session) return;
            const active = Boolean(state.listening || state.pending);
            const microphone = this.mount.querySelector('[data-departure-action="microphone"]');
            const label = this.mount.querySelector('[data-mic-label]');
            if (microphone && label) {
                microphone.setAttribute('aria-pressed', String(active));
                microphone.classList.toggle('departure-is-listening', active);
                microphone.disabled = this.passed || !this.voice?.supportedRecognition;
                label.textContent = state.listening ? 'Stop microphone' : state.pending ? 'Cancel microphone'
                    : this.voice?.supportedRecognition ? 'Start microphone' : 'Type your response below';
            }
            const playLabel = this.mount.querySelector('[data-play-label]');
            if (playLabel) playLabel.textContent = state.speaking ? 'Stop playback'
                : this.audioPlays > 0 ? 'Replay controller' : 'Listen to controller';
            const draft = this.mount.querySelector('[data-departure-draft]');
            if (draft) { draft.readOnly = active; draft.disabled = this.passed; }
            const transmit = this.mount.querySelector('[data-departure-transmit]');
            if (transmit) transmit.disabled = active || this.passed;
            this.mount.querySelectorAll('[data-departure-guidance] button').forEach(button => { button.disabled = this.passed; });
        }

        voiceMessage(message) {
            const element = this.mount?.querySelector('[data-voice-message]');
            if (element) element.textContent = message;
        }

        transmit() {
            if (!this.session?.currentStep || this.passed || this.voice?.state?.listening || this.voice?.state?.pending) return;
            const draft = this.mount.querySelector('[data-departure-draft]');
            const text = draft.value.trim();
            if (!text) {
                this.voiceMessage('Add a response before transmitting. You can type it or use the microphone.');
                draft.focus();
                return;
            }
            this.voice?.cancel();
            this.voiceMessage('');
            const result = this.session.submit(text);
            this.passed = result.status === 'pass';
            const feedback = this.mount.querySelector('[data-departure-feedback]');
            feedback.hidden = false;
            feedback.className = 'departure-feedback ' + (this.passed ? 'departure-feedback-pass' : 'departure-feedback-retry');
            feedback.innerHTML = `
                <div><h3>${escape(result.title)}</h3><p>${escape(result.feedback)}</p>
                ${result.missing?.length ? `<ul>${result.missing.map(item => `<li>${escape(item.label)}</li>`).join('')}</ul>` : ''}</div>
                ${this.passed ? `<button class="departure-next" type="button" id="departureContinue" data-departure-action="next">${this.session.index === this.session.steps.length - 1 ? 'See your debrief' : 'Next exchange'}</button>` : ''}
            `;
            if (result.status === 'repeat' && this.session.currentStep.controller) {
                if (this.voice?.supportedSpeech) {
                    this.audioPlays += 1;
                    this.voice.speak(this.session.currentStep.controller, this.speed);
                } else {
                    const transcript = this.mount.querySelector('[data-controller-transcript]');
                    if (transcript) transcript.open = true;
                }
            }
            this.updateVoiceState(this.voice?.state || {});
            if (this.passed) feedback.querySelector('button')?.focus();
            else draft.focus();
        }

        renderDebrief() {
            if (!this.session) return;
            this.voice?.cancel();
            const summary = this.session.summary();
            this.lastSummary = summary;
            window.WilcoLesson.saveProgress(storage(), summary);
            this.updateRecent(summary);
            const skills = summary.missedSkills || [];
            const reflection = skills.length
                ? `You corrected ${skills.length === 1 ? 'one area' : skills.length + ' areas'} after feedback. A short repeat will help those details stick.`
                : 'You included the required details on your first attempt at every exchange.';
            this.mount.innerHTML = `
                <div class="departure-topbar">
                    <p class="departure-course-name">Departure practice</p>
                    <button class="departure-text-button" type="button" id="departureExit" data-departure-action="exit">Back to training</button>
                </div>
                <div class="departure-debrief">
                    <p class="departure-context">Lesson debrief</p>
                    <h2 class="departure-title" tabindex="-1">A clearer call, one exchange at a time.</h2>
                    <p class="departure-briefing">${escape(reflection)}</p>
                    <dl class="departure-results">
                        <div><dt>Exchanges completed</dt><dd>${summary.completed} of ${summary.total}</dd></div>
                        <div><dt>On the first try</dt><dd>${summary.firstTry}</dd></div>
                        <div><dt>With practice support</dt><dd>${summary.assisted}</dd></div>
                    </dl>
                    <section class="departure-next-practice" aria-labelledby="departureNextPractice">
                        <h3 id="departureNextPractice">What to carry into the next call</h3>
                        ${skills.length ? `<ul>${skills.map(skill => `<li><strong>${escape(skill.label)}</strong><span>Review the instruction, then say the detail and your callsign.</span></li>`).join('')}</ul>`
                            : '<p>Keep listening for runway numbers, hold-short instructions, and frequency changes. Include your callsign so the controller knows who read them back.</p>'}
                    </section>
                    <div class="departure-debrief-actions">
                        ${summary.retryStepIds?.length ? `<button class="departure-transmit" type="button" id="departureRetryMissed" data-departure-action="retry-skills">${skills.length ? 'Practice these exchanges again' : 'Try again with less help'}</button>` : ''}
                        <button class="departure-secondary" type="button" id="departureRestart" data-departure-action="restart">Practice the departure again</button>
                    </div>
                    <p class="departure-input-note">Your summary stays in this browser when storage is available. Transcripts and recordings are not saved.</p>
                    <p class="departure-simulation-note">This is practice feedback, not an assessment of flight proficiency. Review operational procedures with a qualified instructor.</p>
                </div>
            `;
            this.mount.querySelector('h2')?.focus();
        }
    }

    const initialize = () => { window.WilcoDeparture = new DepartureLesson(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
