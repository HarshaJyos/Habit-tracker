

// External configuration for sound paths
// You can replace these URLs with your local paths or other hosted files.

export const SOUND_PATHS = {
    TIMER_START: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hight_pitched_beep.ogg',
    TIMER_END: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
    ROUTINE_COMPLETE: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
    OVERTIME_TICK: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
    REMINDER: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' 
};

// Fallback using Web Audio API to create a system-like beep
const playFallbackBeep = (type: keyof typeof SOUND_PATHS) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Customize sound based on type
        if (type === 'TIMER_START') {
            osc.frequency.value = 800;
            osc.type = 'sine';
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'TIMER_END' || type === 'REMINDER') {
            // Continuous-ish beep pattern (simulated with one long tone for simplicity or multiple)
            osc.frequency.value = 600;
            osc.type = 'square';
            osc.start();
            // Pulse effect
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0, ctx.currentTime + 0.6);
            osc.stop(ctx.currentTime + 1);
        } else if (type === 'ROUTINE_COMPLETE') {
            // Double beep
             osc.frequency.value = 500;
             osc.type = 'triangle';
             osc.start();
             gain.gain.setValueAtTime(0.1, ctx.currentTime);
             gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
             
             // We'd need a second oscillator for a true double beep cleanly, 
             // but let's just do a simple slide for "success"
             osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.2);
             osc.stop(ctx.currentTime + 0.3);
        } else {
            // Default Short Beep
            osc.frequency.value = 440;
            osc.type = 'sine';
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
            osc.stop(ctx.currentTime + 0.1);
        }

    } catch (e) {
        console.error("Fallback audio failed", e);
    }
};

export const playSound = (type: keyof typeof SOUND_PATHS) => {
    try {
        const path = SOUND_PATHS[type];
        if (!path) {
            playFallbackBeep(type);
            return;
        }

        const audio = new Audio(path);
        audio.volume = 0.5;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented or file not found, use fallback
                console.warn("Audio file play failed, using fallback.", error);
                playFallbackBeep(type);
            });
        }
    } catch (error) {
        console.error("Error initializing audio", error);
        playFallbackBeep(type);
    }
};
