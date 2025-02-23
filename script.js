const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let sequence = [
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Kick
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], // Hi-hat
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]  // Synth
];

let currentStep = 0;
let isPlaying = false;
let timeoutId;
let BPM = 150;

const presets = {
    techno: {
        pattern: [
            [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
        ],
        bpm: 150
    },
    hiphop: {
        pattern: [
            [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        bpm: 90
    },
    chacha: {
        pattern: [
            [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
        ],
        bpm: 120
    }
};

// Noise buffers
function createNoiseBuffer(duration) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

const noiseBufferShort = createNoiseBuffer(0.03);
const noiseBufferLong = createNoiseBuffer(0.2);

// Improved techno sounds
function playKick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const distortion = audioCtx.createWaveShaper();
    const curve = new Float32Array(44100);
    for (let i = 0; i < 44100; i++) {
        const x = (i - 22050) / 22050;
        curve[i] = Math.tanh(x * 2);
    }
    distortion.curve = curve;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(1.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.connect(distortion).connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
}

function playSnare() {
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBufferLong;
    const noiseGain = audioCtx.createGain();
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, audioCtx.currentTime);
    noiseGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.05);
    oscGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    noise.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);
    osc.connect(oscGain).connect(audioCtx.destination);

    noise.start();
    osc.start();
    noise.stop(audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.1);
}

function playHihat() {
    const source = audioCtx.createBufferSource();
    source.buffer = noiseBufferShort;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(9000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);

    source.connect(filter).connect(gain).connect(audioCtx.destination);
    source.start();
    source.stop(audioCtx.currentTime + 0.03);
}

function playSynth() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const distortion = audioCtx.createWaveShaper();
    const curve = new Float32Array(44100);
    for (let i = 0; i < 44100; i++) {
        const x = (i - 22050) / 22050;
        curve[i] = Math.tanh(x * 3);
    }
    distortion.curve = curve;

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.9, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    osc.connect(distortion).connect(filter).connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// Playback logic with flash effects
function playStep() {
    sequence.forEach((row, rowIndex) => {
        if (row[currentStep]) {
            switch (rowIndex) {
                case 0:
                    playKick();
                    flashBackground('kick-flash', 100);
                    break;
                case 1:
                    playSnare();
                    flashBackground('snare-flash', 100);
                    break;
                case 2:
                    playHihat();
                    flashBackground('hihat-flash', 50);
                    break;
                case 3:
                    playSynth();
                    flashBackground('synth-flash', 150);
                    break;
            }
        }
    });

    document.querySelectorAll('.cell').forEach(cell => {
        if (parseInt(cell.dataset.col) === currentStep) {
            cell.classList.add('playing');
        } else {
            cell.classList.remove('playing');
        }
    });

    currentStep = (currentStep + 1) % 16;
    if (isPlaying) {
        const stepTime = (60 / BPM) / 4 * 1000;
        timeoutId = setTimeout(playStep, stepTime);
    }
}

// Flash background function
function flashBackground(className, duration) {
    document.body.classList.add(className);
    setTimeout(() => {
        document.body.classList.remove(className);
    }, duration);
}

function startPlayback() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            isPlaying = true;
            playStep();
        });
    } else if (!isPlaying) {
        isPlaying = true;
        playStep();
    }
}

function stopPlayback() {
    isPlaying = false;
    clearTimeout(timeoutId);
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('playing'));
}

function updateGrid() {
    document.querySelectorAll('.row').forEach((rowDiv, rowIndex) => {
        const cells = rowDiv.querySelectorAll('.cell');
        cells.forEach((cell, colIndex) => {
            cell.classList.toggle('on', sequence[rowIndex][colIndex] === 1);
        });
    });
}

function loadPreset(presetName) {
    const preset = presets[presetName];
    sequence = preset.pattern.map(row => [...row]);
    BPM = preset.bpm;
    document.getElementById('tempo').value = BPM;
    updateGrid();
}

document.addEventListener('DOMContentLoaded', () => {
    const sequencerDiv = document.querySelector('.sequencer');
    sequence.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        rowDiv.dataset.row = rowIndex;
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;
            if (cell === 1) {
                cellDiv.classList.add('on');
            }
            rowDiv.appendChild(cellDiv);
        });
        sequencerDiv.appendChild(rowDiv);
    });

    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            sequence[row][col] = 1 - sequence[row][col];
            cell.classList.toggle('on');
        });
    });

    document.getElementById('play').addEventListener('click', startPlayback);
    document.getElementById('stop').addEventListener('click', stopPlayback);
    document.getElementById('tempo').addEventListener('input', (e) => {
        BPM = parseInt(e.target.value);
    });

    document.getElementById('technoPreset').addEventListener('click', () => loadPreset('techno'));
    document.getElementById('hiphopPreset').addEventListener('click', () => loadPreset('hiphop'));
    document.getElementById('chachaPreset').addEventListener('click', () => loadPreset('chacha'));
});