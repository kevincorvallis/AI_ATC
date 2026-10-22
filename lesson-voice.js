/* Browser speech is optional. Call startListening only from an explicit mic action.
 * Recognition may send audio to the browser provider; this adapter stores no audio.
 */
(function (scope) {
    'use strict';

    const MAX_TEXT = 2000;
    const MAX_SPEECH = 800;
    const noop = () => {};

    class LessonVoice {
        constructor({ onState, onTranscript, onError } = {}) {
            this.onState = typeof onState === 'function' ? onState : noop;
            this.onTranscript = typeof onTranscript === 'function' ? onTranscript : noop;
            this.onError = typeof onError === 'function' ? onError : noop;
            this._Recognition = scope.SpeechRecognition || scope.webkitSpeechRecognition;
            this._Utterance = scope.SpeechSynthesisUtterance;
            this._synthesis = scope.speechSynthesis;
            this.supportedRecognition = typeof this._Recognition === 'function';
            this.supportedSpeech = Boolean(typeof this._Utterance === 'function' &&
                this._synthesis && typeof this._synthesis.speak === 'function' &&
                typeof this._synthesis.cancel === 'function');
            this._state = { listening: false, speaking: false, pending: false };
            this._recognition = null;
            this._speech = null;
            this._destroyed = false;
        }

        get state() { return { ...this._state }; }

        _setState(values) {
            const next = { ...this._state, ...values };
            if (Object.keys(next).some(key => next[key] !== this._state[key])) {
                this._state = next;
                if (!this._destroyed) this.onState(this.state);
            }
        }

        _timer(callback, delay) {
            const timer = scope.setTimeout(callback, delay);
            if (timer && typeof timer.unref === 'function') timer.unref();
            return timer;
        }

        _clearTimer(session) {
            if (session && session.timer != null) scope.clearTimeout(session.timer);
            if (session) session.timer = null;
        }

        _activeRecognition(session) {
            return !this._destroyed && this._recognition === session;
        }

        _abort(session) {
            try { session.recognition.abort(); } catch (_) { /* Already ended. */ }
        }

        _finishRecognition(session, abort = false) {
            this._clearTimer(session);
            if (this._recognition !== session) return;
            this._recognition = null;
            if (abort) this._abort(session);
            this._setState({ listening: false, pending: false });
            session.text = '';
        }

        _cancelRecognition() {
            if (this._recognition) this._finishRecognition(this._recognition, true);
        }

        _recognitionError(session, code) {
            if (!this._activeRecognition(session)) return;
            const messages = {
                'not-allowed': 'Microphone permission was denied. Allow microphone access in browser settings, or type your transmission.',
                'service-not-allowed': 'This browser has blocked speech recognition. Check its permissions, or type your transmission.',
                'audio-capture': 'No microphone is available. Check your microphone connection and browser permissions, or type instead.',
                'network': 'Speech recognition could not reach the browser’s service. Check your connection, retry the microphone, or type instead.',
                'no-speech': 'No speech was detected. Try the microphone again and speak clearly, or type your transmission.',
                'language-not-supported': 'English speech recognition is unavailable in this browser. Type your transmission instead.',
                'aborted': 'Speech recognition was interrupted. Tap the microphone to try again, or type instead.',
                'timeout': 'The microphone did not become ready. Check browser permissions and tap the microphone to retry, or type instead.'
            };
            this._finishRecognition(session, true);
            if (!this._destroyed) this.onError(messages[code] || 'Speech recognition is unavailable. Try again or type your transmission.');
        }

        // No constructor, timer, or event callback starts the microphone.
        startListening() {
            if (this._destroyed || this._recognition) return false;
            this.stopSpeaking();
            if (!this.supportedRecognition) {
                this.onError('Speech recognition is not supported in this browser. Type your transmission instead.');
                return false;
            }
            if (scope.isSecureContext === false) {
                this.onError('Microphone practice requires a secure HTTPS page. Open the secure site or type your transmission.');
                return false;
            }
            let recognition;
            try { recognition = new this._Recognition(); }
            catch (_) {
                this.onError('Speech recognition could not start. Try again or type your transmission.');
                return false;
            }
            const session = { recognition, stage: 'starting', text: '', final: false, timer: null };
            this._recognition = session;
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                // Permission can resolve after Stop/Cancel. Abort again to prevent
                // delayed microphone capture without the user's current intent.
                if (!this._activeRecognition(session)) { this._abort(session); return; }
                if (session.stage !== 'starting') return;
                this._clearTimer(session);
                session.stage = 'listening';
                this._setState({ listening: true, pending: false });
                if (this._activeRecognition(session) && session.stage === 'listening') {
                    session.timer = this._timer(() => {
                        if (this._activeRecognition(session)) this.stopListening();
                    }, 30000);
                }
            };
            recognition.onresult = event => {
                if (!this._activeRecognition(session)) return;
                const results = event && event.results;
                if (!results || !results.length) return;
                const parts = [];
                let final = true;
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    if (result && result[0] && typeof result[0].transcript === 'string') parts.push(result[0].transcript);
                    if (!result || !result.isFinal) final = false;
                }
                const text = parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
                if (text && (text !== session.text || final !== session.final)) {
                    session.text = text;
                    session.final = final;
                    this.onTranscript(text, { final });
                }
                if (final && this._activeRecognition(session)) this.stopListening();
            };
            recognition.onerror = event => this._recognitionError(session, event && event.error);
            recognition.onnomatch = () => this._recognitionError(session, 'no-speech');
            recognition.onend = () => {
                if (!this._activeRecognition(session)) { this._clearTimer(session); return; }
                const heardNothing = !session.text;
                this._finishRecognition(session);
                if (heardNothing && !this._destroyed) this.onError('No speech was detected. Try the microphone again, or type your transmission.');
            };
            this._setState({ listening: false, pending: true });
            if (!this._activeRecognition(session)) return false;
            session.timer = this._timer(() => this._recognitionError(session, 'timeout'), 20000);
            try { recognition.start(); }
            catch (error) {
                const denied = error && ['NotAllowedError', 'SecurityError'].includes(error.name);
                this._recognitionError(session, denied ? 'not-allowed' : 'start-failed');
                return false;
            }
            return true;
        }

        // Stop a live recording but allow the service's final result into the draft.
        // Stopping while permission is pending cancels that request entirely.
        stopListening() {
            const session = this._recognition;
            if (!session) return false;
            if (session.stage === 'starting') {
                this._finishRecognition(session, true);
                return true;
            }
            if (session.stage === 'stopping') return true;
            session.stage = 'stopping';
            this._clearTimer(session);
            this._setState({ listening: false, pending: true });
            if (!this._activeRecognition(session)) return true;
            session.timer = this._timer(() => {
                if (!this._activeRecognition(session)) return;
                const heardNothing = !session.text;
                this._finishRecognition(session, true);
                if (heardNothing && !this._destroyed) this.onError('No transcript was received. Retry the microphone or type your transmission.');
            }, 5000);
            try { session.recognition.stop(); }
            catch (_) { this._finishRecognition(session, true); }
            return true;
        }

        speak(text, rate = 0.85) {
            if (this._destroyed) return false;
            this._cancelRecognition();
            this.stopSpeaking();
            if (!this.supportedSpeech) {
                this.onError('Spoken playback is unavailable in this browser. Read the controller message on screen.');
                return false;
            }
            if (typeof text !== 'string' || !text.trim()) return false;
            const bounded = text.replace(/\s+/g, ' ').trim();
            if (bounded.length > MAX_SPEECH) {
                this.onError('This message is too long for spoken playback. Read the full controller message on screen.');
                return false;
            }
            let utterance;
            try { utterance = new this._Utterance(bounded); }
            catch (_) {
                this.onError('Spoken playback could not start. Read the controller message or try Replay.');
                return false;
            }
            utterance.lang = 'en-US';
            utterance.rate = Number.isFinite(Number(rate)) ? Math.min(1.2, Math.max(0.6, Number(rate))) : 0.85;
            utterance.pitch = 1;
            utterance.volume = 1;
            try {
                const voices = this._synthesis.getVoices() || [];
                const english = voices.filter(voice => /^en(?:[-_]|$)/i.test(voice.lang || ''));
                const voice = english.find(item => item.localService && /^en[-_]US$/i.test(item.lang)) ||
                    english.find(item => item.localService) || english.find(item => item.default) || english[0];
                if (voice) utterance.voice = voice;
            } catch (_) { /* Browser default English voice is the fallback. */ }
            const session = { utterance, timer: null };
            this._speech = session;
            const current = () => !this._destroyed && this._speech === session;
            const finish = () => {
                if (!current()) return;
                this._clearTimer(session);
                this._speech = null;
                this._setState({ speaking: false });
            };
            utterance.onstart = () => { if (current()) this._setState({ speaking: true }); };
            utterance.onend = finish;
            utterance.onerror = event => {
                if (!current()) return;
                finish();
                if (!['canceled', 'interrupted'].includes(event && event.error)) {
                    this.onError('Spoken playback was unavailable. Read the controller message or try Replay.');
                }
            };
            this._setState({ speaking: true });
            if (!current()) return false;
            session.timer = this._timer(() => {
                if (!current()) return;
                this.stopSpeaking();
                this.onError('Spoken playback timed out. Read the controller message or try Replay.');
            }, 90000);
            try { this._synthesis.speak(utterance); }
            catch (_) {
                finish();
                this.onError('Spoken playback could not start. Read the controller message or try Replay.');
                return false;
            }
            return true;
        }

        stopSpeaking() {
            if (this._destroyed) return;
            const session = this._speech;
            this._speech = null;
            this._clearTimer(session);
            try { if (this._synthesis) this._synthesis.cancel(); } catch (_) { /* Already stopped. */ }
            this._setState({ speaking: false });
        }

        cancel() {
            if (this._destroyed) return;
            this._cancelRecognition();
            this.stopSpeaking();
        }

        destroy() {
            if (this._destroyed) return;
            this.cancel();
            this._destroyed = true;
            this.onState = this.onTranscript = this.onError = noop;
        }
    }

    // Support both new WilcoVoice(...) and new WilcoVoice.LessonVoice(...).
    LessonVoice.LessonVoice = LessonVoice;
    if (typeof module !== 'undefined' && module.exports) module.exports = { LessonVoice };
    if (typeof window !== 'undefined') window.WilcoVoice = LessonVoice;
}(typeof window !== 'undefined' ? window : globalThis));
