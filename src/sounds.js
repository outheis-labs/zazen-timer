// Sound system using Web Audio API
// Default sounds loaded from static files
// Custom sounds stored in IndexedDB as ArrayBuffer

const SOUND_BASE_PATH = import.meta.env.BASE_URL || '/';
const HAN_URL = `${SOUND_BASE_PATH}han.wav`;
const GONG_URL = `${SOUND_BASE_PATH}gong.wav`;

const DB_NAME = 'zazen-sounds';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

let audioContext = null;
let hanBuffer = null;
let gongBuffer = null;
let customBuffers = new Map(); // id -> AudioBuffer
let isReady = false;
let initPromise = null;
let db = null;

// Silent oscillator for keep-awake
let keepAwakeOscillator = null;
let keepAwakeGain = null;

// ============================================================
// IndexedDB
// ============================================================

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const getDB = async () => {
  if (!db) {
    db = await openDB();
  }
  return db;
};

// ============================================================
// AudioContext
// ============================================================

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    console.log('[Zazen] AudioContext created, state:', audioContext.state);
  }
  return audioContext;
};

// ============================================================
// Sound Loading
// ============================================================

const loadSoundFromURL = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const ctx = getAudioContext();
  return await ctx.decodeAudioData(arrayBuffer);
};

const decodeBuffer = async (arrayBuffer) => {
  const ctx = getAudioContext();
  // Clone the buffer because decodeAudioData detaches it
  const clone = arrayBuffer.slice(0);
  return await ctx.decodeAudioData(clone);
};

// Initialize default sounds
const initDefaultSounds = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('[Zazen] Loading default sounds...');
      const [han, gong] = await Promise.all([
        loadSoundFromURL(HAN_URL),
        loadSoundFromURL(GONG_URL)
      ]);
      hanBuffer = han;
      gongBuffer = gong;
      isReady = true;
      console.log('[Zazen] Default sounds loaded');
    } catch (err) {
      console.error('[Zazen] Failed to load default sounds:', err);
      throw err;
    }
  })();
  
  return initPromise;
};

// ============================================================
// Custom Sound Management
// ============================================================

// Save custom sound to IndexedDB
const saveCustomSound = async (id, name, type, arrayBuffer) => {
  const database = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record = { id, name, type, data: arrayBuffer };
    const request = store.put(record);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Load all custom sounds from IndexedDB
const loadAllCustomSounds = async () => {
  const database = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Delete custom sound from IndexedDB
const deleteCustomSound = async (id) => {
  const database = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      customBuffers.delete(id);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

// Decode all custom sounds to AudioBuffers
const decodeCustomSounds = async (sounds) => {
  for (const sound of sounds) {
    try {
      const buffer = await decodeBuffer(sound.data);
      customBuffers.set(sound.id, buffer);
      console.log('[Zazen] Decoded custom sound:', sound.name);
    } catch (err) {
      console.warn('[Zazen] Failed to decode custom sound:', sound.name, err);
    }
  }
};

// ============================================================
// Playback
// ============================================================

const playBuffer = (buffer, name) => {
  if (!buffer) {
    console.warn('[Zazen] Buffer not loaded for', name);
    return;
  }
  
  const ctx = getAudioContext();
  if (ctx.state !== 'running') {
    console.warn('[Zazen] AudioContext not running, state:', ctx.state);
  }
  
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    console.log('[Zazen] Playing', name);
  } catch (err) {
    console.error('[Zazen] Playback error:', err);
  }
};

// Resume AudioContext (must be called from user gesture on iOS)
const resumeAudio = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    console.log('[Zazen] Resuming AudioContext...');
    await ctx.resume();
    console.log('[Zazen] AudioContext resumed, state:', ctx.state);
  }
  
  if (!isReady) {
    await initDefaultSounds();
  }
};

// ============================================================
// Keep-Awake
// ============================================================

const startKeepAwake = () => {
  if (keepAwakeOscillator) return;
  
  try {
    const ctx = getAudioContext();
    
    keepAwakeOscillator = ctx.createOscillator();
    keepAwakeGain = ctx.createGain();
    
    keepAwakeOscillator.frequency.value = 20;
    keepAwakeGain.gain.value = 0.001;
    
    keepAwakeOscillator.connect(keepAwakeGain);
    keepAwakeGain.connect(ctx.destination);
    keepAwakeOscillator.start();
    
    console.log('[Zazen] Keep-awake started');
  } catch (err) {
    console.warn('[Zazen] Keep-awake failed:', err);
  }
};

const stopKeepAwake = () => {
  if (keepAwakeOscillator) {
    try {
      keepAwakeOscillator.stop();
      keepAwakeOscillator.disconnect();
      keepAwakeGain.disconnect();
    } catch (err) {
      // Already stopped
    }
    keepAwakeOscillator = null;
    keepAwakeGain = null;
    console.log('[Zazen] Keep-awake stopped');
  }
};

// ============================================================
// Initialize
// ============================================================

// Pre-load default sounds (non-blocking)
initDefaultSounds().catch(() => {});

// ============================================================
// Public API
// ============================================================

export const createSoundSystem = () => {
  return {
    resume: () => resumeAudio(),
    isReady: () => isReady,
    
    startSession: () => startKeepAwake(),
    stopSession: () => stopKeepAwake(),
    
    playHan: () => playBuffer(hanBuffer, 'han'),
    playGong: () => playBuffer(gongBuffer, 'gong'),
    
    // Play custom sound by id
    playCustom: (id) => {
      const buffer = customBuffers.get(id);
      playBuffer(buffer, `custom-${id}`);
    },
    
    // Check if custom sound is loaded
    hasCustomSound: (id) => customBuffers.has(id),
  };
};

// Custom sound management API
export const customSoundAPI = {
  MAX_FILE_SIZE,
  
  // Add a custom sound from File object
  addSound: async (file, type) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const id = Date.now();
    const name = file.name.replace(/\.[^/.]+$/, '');
    
    // Validate by trying to decode
    const buffer = await decodeBuffer(arrayBuffer);
    
    // Save to IndexedDB
    await saveCustomSound(id, name, type, arrayBuffer);
    
    // Add to memory cache
    customBuffers.set(id, buffer);
    
    return { id, name, type };
  },
  
  // Load all custom sounds (call on app init)
  loadAll: async () => {
    const sounds = await loadAllCustomSounds();
    await decodeCustomSounds(sounds);
    return sounds.map(s => ({ id: s.id, name: s.name, type: s.type }));
  },
  
  // Delete a custom sound
  delete: async (id) => {
    await deleteCustomSound(id);
  },
};
