import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translations, getDefaultLanguage, setLanguage as saveLanguage } from './i18n';
import { createSoundSystem, customSoundAPI } from './sounds';
import { loadConfigs, saveConfigs, DEFAULTS, generateConfigName } from './storage';
import { PlayIcon, Enso, InfoIcon } from './components';
import { createStyles } from './styles';

const APP_VERSION = __APP_VERSION__;
const GITHUB_URL = 'https://github.com/schatzl/zazen-timer-pwa';

const App = () => {
  const [lang, setLang] = useState(() => getDefaultLanguage());
  const [textScale, setTextScale] = useState(() => {
    const stored = localStorage.getItem('zazen-text-scale');
    return stored ? parseFloat(stored) : 1;
  });
  const t = translations[lang];
  const s = createStyles(textScale);
  
  const [view, setView] = useState('home');
  const [viewHistory, setViewHistory] = useState(['home']);
  const [configs, setConfigs] = useState(() => loadConfigs());
  const [selectedConfigId, setSelectedConfigId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [customSounds, setCustomSounds] = useState([]);
  const [timerState, setTimerState] = useState({ phase: 'idle', currentRound: 1, secondsRemaining: 0, totalRounds: 1 });
  const [isRunning, setIsRunning] = useState(false);
  
  // PWA installation
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const configRef = useRef(null);
  const wakeLockRef = useRef(null);
  
  // Initialize sound system and load custom sounds
  useEffect(() => {
    soundRef.current = createSoundSystem();
    customSoundAPI.loadAll()
      .then(sounds => setCustomSounds(sounds))
      .catch(err => console.warn('[Zazen] Failed to load custom sounds:', err));
  }, []);
  
  // Check if app is installed
  useEffect(() => {
    const checkInstalled = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true;
    setIsInstalled(checkInstalled);
    
    // Capture install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  useEffect(() => { saveConfigs(configs); }, [configs]);
  
  // Re-acquire wake lock when app becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRunning && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[Zazen] Wake lock re-acquired');
        } catch (err) {
          console.warn('[Zazen] Wake lock re-acquire failed:', err);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning]);
  
  const changeLang = (newLang) => {
    setLang(newLang);
    saveLanguage(newLang);
  };
  
  const changeScale = (newScale) => {
    setTextScale(newScale);
    localStorage.setItem('zazen-text-scale', newScale.toString());
  };
  
  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };
  
  const selectedConfig = configs.find(c => c.id === selectedConfigId);
  
  const navigate = (newView) => { setViewHistory(prev => [...prev, newView]); setView(newView); };
  const goBack = () => { if (viewHistory.length > 1) { const h = viewHistory.slice(0, -1); setViewHistory(h); setView(h[h.length - 1]); } };
  const goHome = () => { setView('home'); setViewHistory(['home']); };
  
  const createNewConfig = () => { setEditingConfig({ id: Date.now(), customName: '', ...DEFAULTS }); navigate('edit'); };
  
  const saveConfigHandler = (config) => {
    const idx = configs.findIndex(c => c.id === config.id);
    if (idx >= 0) { const nc = [...configs]; nc[idx] = config; setConfigs(nc); }
    else { setConfigs([...configs, config]); }
    setSelectedConfigId(config.id);
    if (viewHistory.includes('detail')) goBack();
    else { setView('detail'); setViewHistory(['home', 'detail']); }
  };
  
  const deleteConfig = (id) => { 
    setConfigs(configs.filter(c => c.id !== id)); 
    if (selectedConfigId === id) setSelectedConfigId(null); 
    goHome(); 
  };
  
  const deleteSound = async (id) => {
    try {
      await customSoundAPI.delete(id);
      setCustomSounds(prev => prev.filter(s => s.id !== id));
      setConfigs(prev => prev.map(c => ({
        ...c,
        hanSoundId: c.hanSoundId === id ? null : c.hanSoundId,
        gongSoundId: c.gongSoundId === id ? null : c.gongSoundId,
      })));
    } catch (err) {
      console.error('[Zazen] Failed to delete sound:', err);
    }
  };
  
  const playPreview = useCallback((type, customSoundId = null) => {
    if (!soundRef.current) return;
    soundRef.current.resume();
    
    if (customSoundId) {
      soundRef.current.playCustom(customSoundId);
    } else {
      if (type === 'han') soundRef.current.playHan();
      else soundRef.current.playGong();
    }
  }, []);
  
  const playSound = useCallback((type) => {
    if (!soundRef.current) return;
    const config = configRef.current;
    
    if (config) {
      const soundId = config[`${type}SoundId`];
      if (soundId && soundRef.current.hasCustomSound(soundId)) {
        soundRef.current.playCustom(soundId);
        return;
      }
    }
    
    soundRef.current.resume();
    if (type === 'han') soundRef.current.playHan();
    else soundRef.current.playGong();
  }, []);
  
  const startSession = useCallback(async () => {
    if (!selectedConfig) return;
    
    // Request wake lock to prevent screen from turning off
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[Zazen] Wake lock acquired');
        
        // Re-acquire wake lock if released (e.g., tab switch)
        wakeLockRef.current.addEventListener('release', () => {
          console.log('[Zazen] Wake lock released');
        });
      } catch (err) {
        console.warn('[Zazen] Wake lock failed:', err);
      }
    }
    
    // Unlock audio (fire and forget - will be ready by first sound)
    if (soundRef.current) {
      soundRef.current.resume();
      soundRef.current.startSession(); // Start keep-awake audio
    }
    
    configRef.current = selectedConfig;
    // 5 second delay before first Han - enough time for unlock
    setTimerState({ 
      phase: 'starting', 
      currentRound: 1, 
      secondsRemaining: 5, 
      totalRounds: selectedConfig.rounds 
    });
    setIsRunning(true);
    navigate('timer');
  }, [selectedConfig]);
  
  const stopSession = useCallback(() => {
    setIsRunning(false);
    soundRef.current?.stopSession(); // Stop keep-awake audio
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Release wake lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      console.log('[Zazen] Wake lock released');
    }
    
    setTimerState({ phase: 'idle', currentRound: 1, secondsRemaining: 0, totalRounds: 1 });
    goHome();
  }, []);
  
  const skipPhase = useCallback(() => { 
    setTimerState(prev => ({ ...prev, secondsRemaining: 1 })); 
  }, []);
  
  useEffect(() => {
    if (!isRunning) return;
    
    timerRef.current = setInterval(() => {
      setTimerState(prev => {
        const config = configRef.current;
        if (!config) return prev;
        const newSec = prev.secondsRemaining - 1;
        if (newSec > 0) return { ...prev, secondsRemaining: newSec };
        
        switch (prev.phase) {
          case 'starting':
            playSound('han');
            return { ...prev, phase: 'prepare', secondsRemaining: config.prepareSeconds };
          case 'prepare':
            playSound('gong');
            return { ...prev, phase: 'zazen', secondsRemaining: config.zazenMin * 60 };
          case 'zazen':
            playSound('gong');
            if (config.kinhinMin > 0) {
              setTimeout(() => playSound('han'), 1500);
              return { ...prev, phase: 'kinhin', secondsRemaining: config.kinhinMin * 60 };
            } else if (prev.currentRound < prev.totalRounds) {
              setTimeout(() => playSound('han'), 1500);
              return { ...prev, phase: 'return', secondsRemaining: config.returnSeconds };
            } else {
              setIsRunning(false);
              return { ...prev, phase: 'complete', secondsRemaining: 0 };
            }
          case 'kinhin':
            playSound('han');
            if (prev.currentRound < prev.totalRounds) {
              return { ...prev, phase: 'return', secondsRemaining: config.returnSeconds };
            }
            setIsRunning(false);
            return { ...prev, phase: 'complete', secondsRemaining: 0 };
          case 'return':
            playSound('han');
            return { 
              ...prev, 
              phase: 'prepare', 
              currentRound: prev.currentRound + 1, 
              secondsRemaining: config.prepareSeconds 
            };
          default: 
            return prev;
        }
      });
    }, 1000);
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, playSound]);
  
  const formatTime = (sec) => ({ 
    minutes: String(Math.floor(sec / 60)).padStart(2, '0'), 
    seconds: String(sec % 60).padStart(2, '0') 
  });

  // =========================================================================
  // VIEWS
  // =========================================================================

  // Wrapper for sidebars on desktop
  const AppWrapper = ({ children }) => (
    <div style={s.appWrapper}>
      {children}
    </div>
  );

  const HomeView = () => (
    <AppWrapper>
      <div style={s.app}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <Enso size={56} opacity={0.8} />
            <h1 style={s.title}>{t.appTitle}</h1>
          </div>
          <button style={s.infoBtn} onClick={() => navigate('info')}>
            <InfoIcon size={28} />
          </button>
        </header>
        <div style={s.content}>
          {!isInstalled && (
            <div style={s.installWarning}>
              {t.installWarning}
            </div>
          )}
          <div style={s.section}>{t.configurations}</div>
          {configs.length === 0 ? (
            <div style={s.empty}>
              <p>{t.noConfigs}</p>
              <p>{t.createFirst}</p>
            </div>
          ) : configs.map(c => (
            <button 
              key={c.id} 
              style={s.configItem} 
              onClick={() => { setSelectedConfigId(c.id); navigate('detail'); }}
            >
              <span style={s.configName}>{c.customName || generateConfigName(c)}</span>
              <span style={s.configMeta}>
                {c.rounds}× {c.zazenMin}′{c.kinhinMin > 0 && ` + ${c.kinhinMin}′ Kinhin`}
              </span>
            </button>
          ))}
          <button style={s.addBtn} onClick={createNewConfig}>
            <span style={{ fontSize: '20px', fontWeight: '300' }}>+</span>
            <span>{t.newConfig}</span>
          </button>
        </div>
      </div>
    </AppWrapper>
  );

  const InfoView = () => (
    <AppWrapper>
      <div style={s.app}>
      <header style={s.headerBack}>
        <button style={s.backBtn} onClick={goBack}>{t.back}</button>
        <div style={{ width: 90 }}></div>
      </header>
      <div style={s.content}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <Enso size={Math.round(80 * textScale)} opacity={0.15} />
        </div>
        <h2 style={{ fontSize: `${Math.round(24 * textScale)}px`, fontWeight: '300', textAlign: 'center', marginBottom: '40px' }}>
          Zazen Timer
        </h2>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.aboutApp}</div>
          <p style={s.infoText}>{t.aboutText}</p>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.installation}</div>
          {isInstalled ? (
            <>
              <div style={s.infoText}>✓ {t.appInstalled}</div>
              <div style={{ ...s.infoText, marginTop: '8px' }}>{t.uninstallHint}</div>
            </>
          ) : installPrompt ? (
            <button style={s.navItem} onClick={handleInstall}>
              <span>{t.installApp}</span>
              <span style={{ opacity: 0.3 }}>→</span>
            </button>
          ) : (
            <div style={s.infoText}>
              {lang === 'de' 
                ? 'Bitte Browser-Menü zum Installieren der Progressive Web App (PWA) nutzen' 
                : 'Please use browser menu to install the Progressive Web App (PWA)'}
            </div>
          )}
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.sounds}</div>
          <button style={s.navItem} onClick={() => navigate('sounds')}>
            <span>{t.manageSounds}</span>
            <span style={{ opacity: 0.3 }}>→</span>
          </button>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.ritualSequence}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={s.ritualStep}>
              <span style={s.ritualIcon}>▮</span>
              <div style={s.ritualBlock}>
                <span style={s.ritualLabel}>{t.hanWood}</span>
                <span style={s.ritualDesc}>{t.hanDesc}</span>
              </div>
            </div>
            <div style={s.ritualPause}>{t.prepTime}</div>
            <div style={s.ritualStep}>
              <span style={s.ritualIcon}>○</span>
              <div style={s.ritualBlock}>
                <span style={s.ritualLabel}>{t.gong}</span>
                <span style={s.ritualDesc}>{t.gongBeginDesc}</span>
              </div>
            </div>
            <div style={s.ritualPause}>{t.zazen}</div>
            <div style={s.ritualStep}>
              <span style={s.ritualIcon}>○</span>
              <div style={s.ritualBlock}>
                <span style={s.ritualLabel}>{t.gong}</span>
                <span style={s.ritualDesc}>{t.gongEndDesc}</span>
              </div>
            </div>
            <div style={s.ritualStep}>
              <span style={s.ritualIcon}>▮</span>
              <div style={s.ritualBlock}>
                <span style={s.ritualLabel}>Han</span>
                <span style={s.ritualDesc}>{t.hanBowDesc}</span>
              </div>
            </div>
            <div style={s.ritualPause}>{t.kinhinOptional}</div>
            <div style={s.ritualStep}>
              <span style={s.ritualIcon}>▮</span>
              <div style={s.ritualBlock}>
                <span style={s.ritualLabel}>Han</span>
                <span style={s.ritualDesc}>{t.hanEndKinhinDesc}</span>
              </div>
            </div>
            <div style={s.ritualPause}>{t.returnTime}</div>
            <div style={{ fontSize: '12px', opacity: 0.4, paddingLeft: '32px', paddingTop: '8px' }}>
              {t.nextRound}
            </div>
          </div>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.language}</div>
          <div style={s.langSelector}>
            <button 
              style={{ ...s.langBtn, ...(lang === 'de' ? s.langBtnActive : {}) }}
              onClick={() => changeLang('de')}
            >
              {t.german}
            </button>
            <button 
              style={{ ...s.langBtn, ...(lang === 'en' ? s.langBtnActive : {}) }}
              onClick={() => changeLang('en')}
            >
              {t.english}
            </button>
          </div>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.accessibility}</div>
          <div style={s.accessSelector}>
            <button 
              style={{ ...s.accessBtn, ...(textScale === 1 ? s.accessBtnActive : {}) }}
              onClick={() => changeScale(1)}
            >
              {t.sizeNormal}
            </button>
            <button 
              style={{ ...s.accessBtn, ...(textScale === 1.2 ? s.accessBtnActive : {}) }}
              onClick={() => changeScale(1.2)}
            >
              {t.sizeLarge}
            </button>
            <button 
              style={{ ...s.accessBtn, ...(textScale === 1.4 ? s.accessBtnActive : {}) }}
              onClick={() => changeScale(1.4)}
            >
              {t.sizeXLarge}
            </button>
          </div>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.appInfo}</div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>{t.author}</span>
            <span style={s.infoValue}>Markus Schatzl</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>{t.license}</span>
            <span style={s.infoValue}>BSD 2-Clause</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>{t.contact}</span>
            <span style={s.infoValue}>code@schatzl.studio</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>{t.version}</span>
            <span style={s.infoValue}>{APP_VERSION}</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>{t.download}</span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={s.infoLink}>
              GitHub
            </a>
          </div>
        </div>
        
        <div style={s.infoSection}>
          <div style={s.infoTitle}>{t.support}</div>
          <p style={s.infoText}>{t.supportText}</p>
          <div style={{ ...s.infoRow, marginTop: '12px' }}>
            <span style={s.infoLabel}>PayPal</span>
            <span style={s.infoValue}>e-commerce@mailbox.org</span>
          </div>
        </div>
      </div>
      </div>
    </AppWrapper>
  );

  const SoundsView = () => {
    const fileRef = useRef(null);
    const [addType, setAddType] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    
    const handleFile = async (e) => {
      const f = e.target.files?.[0]; 
      if (!f) return;
      if (!/\.(mp3|m4a|wav|aac)$/i.test(f.name)) { 
        alert(t.invalidFormat); 
        return; 
      }
      if (f.size > customSoundAPI.MAX_FILE_SIZE) {
        alert(t.fileTooLarge);
        return;
      }
      
      setIsAdding(true);
      try {
        const newSound = await customSoundAPI.addSound(f, addType);
        setCustomSounds(p => [...p, newSound]);
      } catch (err) {
        console.error('[Zazen] Failed to add sound:', err);
        alert(t.soundAddError);
      } finally {
        setIsAdding(false);
        setAddType(null);
        e.target.value = '';
      }
    };
    
    const hanSounds = customSounds.filter(x => x.type === 'han');
    const gongSounds = customSounds.filter(x => x.type === 'gong');
    
    return (
      <AppWrapper>
        <div style={s.app}>
          <header style={s.headerBack}>
            <button style={s.backBtn} onClick={goBack}>{t.back}</button>
            <span style={s.headerTitle}>{t.soundsTitle}</span>
            <div style={{ width: 90 }}></div>
          </header>
          <div style={s.content}>
          <div style={s.section}>{t.hanSection}</div>
          <div style={s.soundItem}>
            <span style={s.soundItemName}>{t.standard}</span>
            <button style={s.soundPlayBtn} onClick={() => playPreview('han', null)}>
              <PlayIcon />
            </button>
          </div>
          {hanSounds.map(snd => (
            <div key={snd.id} style={s.soundItem}>
              <span style={s.soundItemName}>{snd.name}</span>
              <button style={s.soundPlayBtn} onClick={() => playPreview('han', snd.id)}>
                <PlayIcon />
              </button>
              <button style={s.soundDeleteBtn} onClick={() => deleteSound(snd.id)}>
                {t.delete}
              </button>
            </div>
          ))}
          <button 
            style={s.addSoundBtn} 
            onClick={() => { setAddType('han'); setTimeout(() => fileRef.current?.click(), 10); }}
            disabled={isAdding}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            <span>{isAdding ? '...' : t.addHanSound}</span>
          </button>
          
          <div style={{ ...s.section, marginTop: '32px' }}>{t.gongSection}</div>
          <div style={s.soundItem}>
            <span style={s.soundItemName}>{t.standard}</span>
            <button style={s.soundPlayBtn} onClick={() => playPreview('gong', null)}>
              <PlayIcon />
            </button>
          </div>
          {gongSounds.map(snd => (
            <div key={snd.id} style={s.soundItem}>
              <span style={s.soundItemName}>{snd.name}</span>
              <button style={s.soundPlayBtn} onClick={() => playPreview('gong', snd.id)}>
                <PlayIcon />
              </button>
              <button style={s.soundDeleteBtn} onClick={() => deleteSound(snd.id)}>
                {t.delete}
              </button>
            </div>
          ))}
          <button 
            style={s.addSoundBtn} 
            onClick={() => { setAddType('gong'); setTimeout(() => fileRef.current?.click(), 10); }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            <span>{t.addGongSound}</span>
          </button>
          
          <input 
            ref={fileRef} 
            type="file" 
            accept=".mp3,.m4a,.wav,.aac,audio/*" 
            style={s.fileInput} 
            onChange={handleFile} 
          />
          <div style={{ ...s.soundNote, marginTop: '32px' }}>{t.supportedFormats}</div>
        </div>
        </div>
      </AppWrapper>
    );
  };

  const DetailView = () => {
    if (!selectedConfig) return null;
    const name = selectedConfig.customName || generateConfigName(selectedConfig);
    const total = selectedConfig.rounds * (selectedConfig.zazenMin + (selectedConfig.kinhinMin || 0)) + 
      Math.ceil((selectedConfig.prepareSeconds + (selectedConfig.rounds > 1 ? (selectedConfig.rounds - 1) * selectedConfig.returnSeconds : 0)) / 60);
    
    return (
      <AppWrapper>
        <div style={s.app}>
        <header style={s.headerBack}>
          <button style={s.backBtn} onClick={goBack}>{t.back}</button>
          <div style={{ width: 90 }}></div>
        </header>
        <div style={s.detailContent}>
          <div style={s.ensoBg}><Enso size={160} opacity={0.1} /></div>
          <h2 style={s.configTitle}>{name}</h2>
          <div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{t.rounds}</span>
              <span style={s.detailValue}>{selectedConfig.rounds}</span>
            </div>
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{t.zazen}</span>
              <span style={s.detailValue}>{selectedConfig.zazenMin} {t.min}</span>
            </div>
            {selectedConfig.kinhinMin > 0 && (
              <div style={s.detailRow}>
                <span style={s.detailLabel}>{t.kinhin}</span>
                <span style={s.detailValue}>{selectedConfig.kinhinMin} {t.min}</span>
              </div>
            )}
            <div style={s.detailRow}>
              <span style={s.detailLabel}>{t.preparation}</span>
              <span style={s.detailValue}>{selectedConfig.prepareSeconds} {t.sec}</span>
            </div>
          </div>
          <button style={s.ablaufLink} onClick={() => navigate('ablauf')}>
            {t.showSequence}
          </button>
          <div style={s.totalTime}>{t.totalApprox} {total} {t.min}</div>
        </div>
        <div style={s.actionArea}>
          <button style={s.primaryBtn} onClick={startSession}>{t.begin}</button>
          <button 
            style={s.secondaryBtn} 
            onClick={() => { setEditingConfig({ ...selectedConfig }); navigate('edit'); }}
          >
            {t.edit}
          </button>
        </div>
        </div>
      </AppWrapper>
    );
  };

  const AblaufView = () => {
    if (!selectedConfig) return null;
    const hasK = selectedConfig.kinhinMin > 0;
    
    return (
      <AppWrapper>
        <div style={s.app}>
        <header style={s.headerBack}>
          <button style={s.backBtn} onClick={goBack}>{t.back}</button>
          <span style={s.headerTitle}>{t.sequence}</span>
          <div style={{ width: 90 }}></div>
        </header>
        <div style={s.content}>
          <div style={{ fontSize: '13px', opacity: 0.4, marginBottom: '24px' }}>
            {selectedConfig.customName || generateConfigName(selectedConfig)}
          </div>
          {Array.from({ length: selectedConfig.rounds }).map((_, i) => (
            <div key={i} style={s.ablaufRound}>
              <div style={s.ablaufHeader}>{t.round} {i + 1}</div>
              <div style={s.ablaufStep}>
                <div style={s.ablaufIcon}>▮</div>
                <div style={s.ablaufContent}>
                  <span style={s.ablaufLabel}>Han</span>
                  <span style={s.ablaufTime}>{t.takePosition}</span>
                </div>
              </div>
              <div style={s.ablaufDur}>{selectedConfig.prepareSeconds} {t.sec}</div>
              <div style={s.ablaufStep}>
                <div style={s.ablaufIcon}>○</div>
                <div style={s.ablaufContent}>
                  <span style={s.ablaufLabel}>{t.gong}</span>
                  <span style={s.ablaufTime}>{t.zazenBegins}</span>
                </div>
              </div>
              <div style={s.ablaufDur}>{selectedConfig.zazenMin} {t.min}</div>
              <div style={s.ablaufStep}>
                <div style={s.ablaufIcon}>○</div>
                <div style={s.ablaufContent}>
                  <span style={s.ablaufLabel}>{t.gong}</span>
                  <span style={s.ablaufTime}>{t.zazenEnds}</span>
                </div>
              </div>
              {hasK && (
                <>
                  <div style={s.ablaufStep}>
                    <div style={s.ablaufIcon}>▮</div>
                    <div style={s.ablaufContent}>
                      <span style={s.ablaufLabel}>Han</span>
                      <span style={s.ablaufTime}>{t.kinhinBegins}</span>
                    </div>
                  </div>
                  <div style={s.ablaufDur}>{selectedConfig.kinhinMin} {t.min}</div>
                  <div style={s.ablaufStep}>
                    <div style={s.ablaufIcon}>▮</div>
                    <div style={s.ablaufContent}>
                      <span style={s.ablaufLabel}>Han</span>
                      <span style={s.ablaufTime}>{t.kinhinEnds}</span>
                    </div>
                  </div>
                </>
              )}
              {i < selectedConfig.rounds - 1 && (
                <div style={s.ablaufDur}>{selectedConfig.returnSeconds} {t.sec} {t.returnTime}</div>
              )}
            </div>
          ))}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 0', 
            borderTop: '1px solid rgba(128,128,128,0.15)', 
            marginTop: '8px' 
          }}>
            <div style={s.ablaufIcon}>◉</div>
            <div style={s.ablaufContent}>
              <span style={s.ablaufLabel}>{t.end}</span>
              <span style={s.ablaufTime}>{t.sessionEnded}</span>
            </div>
          </div>
        </div>
        </div>
      </AppWrapper>
    );
  };

  const EditView = () => {
    const [form, setForm] = useState(editingConfig || { id: Date.now(), customName: '', ...DEFAULTS });
    const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const inc = (k, step = 1, min = 0) => setForm(p => ({ ...p, [k]: Math.max(min, p[k] + step) }));
    const dec = (k, step = 1, min = 0) => setForm(p => ({ ...p, [k]: Math.max(min, p[k] - step) }));
    
    const getHanSoundName = () => {
      if (!form.hanSoundId) return t.standard;
      return customSounds.find(x => x.id === form.hanSoundId)?.name || t.standard;
    };
    const getGongSoundName = () => {
      if (!form.gongSoundId) return t.standard;
      return customSounds.find(x => x.id === form.gongSoundId)?.name || t.standard;
    };
    
    return (
      <AppWrapper>
        <div style={s.app}>
        <header style={s.headerBack}>
          <button style={s.backBtn} onClick={goBack}>{t.cancel}</button>
          <button style={s.saveBtn} onClick={() => saveConfigHandler(form)}>{t.save}</button>
        </header>
        <div style={s.content}>
          <div style={s.inputGroup}>
            <label style={s.inputLabel}>{t.nameOptional}</label>
            <input 
              type="text" 
              style={s.textInput} 
              placeholder={generateConfigName(form)} 
              value={form.customName} 
              onChange={e => upd('customName', e.target.value)} 
            />
          </div>
          
          <div style={s.section}>{t.times}</div>
          <div style={s.inputRowVertical}>
            <label style={s.inputLabelSm}>{t.roundsLabel}</label>
            <div style={s.stepper}>
              <button style={s.stepBtn} onClick={() => dec('rounds', 1, 1)}>−</button>
              <span style={s.stepVal}>{form.rounds}</span>
              <button style={s.stepBtn} onClick={() => inc('rounds')}>+</button>
            </div>
          </div>
          <div style={s.inputRowVertical}>
            <label style={s.inputLabelSm}>{t.zazenMin}</label>
            <div style={s.stepper}>
              <button style={s.stepBtn} onClick={() => dec('zazenMin', 5, 5)}>−</button>
              <span style={s.stepVal}>{form.zazenMin}</span>
              <button style={s.stepBtn} onClick={() => inc('zazenMin', 5)}>+</button>
            </div>
          </div>
          <div style={s.inputRowVertical}>
            <label style={s.inputLabelSm}>{t.kinhinMin}</label>
            <div style={s.stepper}>
              <button style={s.stepBtn} onClick={() => dec('kinhinMin', 1, 0)}>−</button>
              <span style={s.stepVal}>{form.kinhinMin}</span>
              <button style={s.stepBtn} onClick={() => inc('kinhinMin')}>+</button>
            </div>
          </div>
          
          <div style={{ ...s.section, marginTop: '24px' }}>{t.pauses}</div>
          <div style={s.inputRowVertical}>
            <label style={s.inputLabelSm}>{t.prepSec}</label>
            <div style={s.stepper}>
              <button style={s.stepBtn} onClick={() => dec('prepareSeconds', 5, 5)}>−</button>
              <span style={s.stepVal}>{form.prepareSeconds}</span>
              <button style={s.stepBtn} onClick={() => inc('prepareSeconds', 5)}>+</button>
            </div>
          </div>
          {form.rounds > 1 && (
            <div style={s.inputRowVertical}>
              <label style={s.inputLabelSm}>{t.returnSec}</label>
              <div style={s.stepper}>
                <button style={s.stepBtn} onClick={() => dec('returnSeconds', 5, 5)}>−</button>
                <span style={s.stepVal}>{form.returnSeconds}</span>
                <button style={s.stepBtn} onClick={() => inc('returnSeconds', 5)}>+</button>
              </div>
            </div>
          )}
          
          <div style={{ ...s.section, marginTop: '24px' }}>{t.sounds}</div>
          <div style={{ marginBottom: '12px' }}>
            <label style={s.inputLabelSm}>{t.hanWood}</label>
            <button 
              style={s.soundPicker} 
              onClick={() => { setEditingConfig(form); navigate('pick-han'); }}
            >
              <span style={s.soundIcon}>▮</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getHanSoundName()}
              </span>
              <span style={s.soundArrow}>→</span>
            </button>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={s.inputLabelSm}>{t.gong}</label>
            <button 
              style={s.soundPicker} 
              onClick={() => { setEditingConfig(form); navigate('pick-gong'); }}
            >
              <span style={s.soundIcon}>○</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getGongSoundName()}
              </span>
              <span style={s.soundArrow}>→</span>
            </button>
          </div>
          
          {editingConfig && configs.some(c => c.id === editingConfig.id) && (
            <button 
              style={s.dangerBtn} 
              onClick={() => { if (window.confirm(t.confirmDelete)) deleteConfig(editingConfig.id); }}
            >
              {t.deleteConfig}
            </button>
          )}
        </div>
        </div>
      </AppWrapper>
    );
  };

  const SoundPickerView = ({ soundType }) => {
    const typeName = soundType === 'han' ? t.hanWood : t.gong;
    const relevant = customSounds.filter(x => x.type === soundType);
    
    const select = (id) => { 
      setEditingConfig(p => ({ ...p, [`${soundType}SoundId`]: id })); 
      goBack(); 
    };
    
    return (
      <AppWrapper>
        <div style={s.app}>
        <header style={s.headerBack}>
          <button style={s.backBtn} onClick={goBack}>{t.back}</button>
          <span style={s.headerTitle}>{typeName}</span>
          <div style={{ width: 90 }}></div>
        </header>
        <div style={s.content}>
          <div style={s.section}>{t.availableSounds}</div>
          
          <div style={s.soundOpt} onClick={() => select(null)}>
            <span style={s.soundOptName}>{t.standard}</span>
            <button 
              style={s.soundPlayBtn} 
              onClick={e => { e.stopPropagation(); playPreview(soundType, null); }}
            >
              <PlayIcon />
            </button>
            {!editingConfig?.[`${soundType}SoundId`] && <span style={s.soundOptCheck}>✓</span>}
          </div>
          
          {relevant.map(snd => (
            <div key={snd.id} style={s.soundOpt} onClick={() => select(snd.id)}>
              <span style={s.soundOptName}>{snd.name}</span>
              <button 
                style={s.soundPlayBtn} 
                onClick={e => { e.stopPropagation(); playPreview(soundType, snd.id); }}
              >
                <PlayIcon />
              </button>
              {editingConfig?.[`${soundType}SoundId`] === snd.id && (
                <span style={s.soundOptCheck}>✓</span>
              )}
            </div>
          ))}
          
          {relevant.length === 0 && (
            <div style={{ ...s.soundNote, marginTop: '16px' }}>
              {t.noCustomSounds.replace('{type}', typeName)}
            </div>
          )}
        </div>
        </div>
      </AppWrapper>
    );
  };

  const TimerView = () => {
    const time = formatTime(timerState.secondsRemaining);
    
    if (timerState.phase === 'complete') {
      return (
        <AppWrapper>
          <div style={{ ...s.app, ...s.appDark }}>
            <div style={s.complete}>
              <Enso size={120} opacity={0.3} color="#ffffff" />
              <div style={s.completeText}>{t.sessionEnded}</div>
            </div>
            <div style={s.actionArea}>
              <button 
                style={{ ...s.primaryBtn, backgroundColor: '#fff', color: '#000' }} 
                onClick={stopSession}
              >
                {t.backHome}
              </button>
            </div>
          </div>
        </AppWrapper>
      );
    }
    
    return (
      <AppWrapper>
        <div style={{ ...s.app, ...s.appDark }}>
          <div style={s.timerPhase}>
            <span style={s.phaseLabel}>{t.phaseLabels[timerState.phase]}</span>
            <span style={s.roundInd}>{timerState.currentRound} / {timerState.totalRounds}</span>
          </div>
          <div style={s.timerCenter}>
            <div style={{ position: 'absolute', pointerEvents: 'none' }}>
              <Enso size={280} opacity={0.08} color="#ffffff" />
            </div>
            <div style={s.timerDisplay}>
              <span style={s.timerDigits}>{time.minutes}</span>
              <span style={s.timerSep}>:</span>
              <span style={s.timerDigits}>{time.seconds}</span>
            </div>
          </div>
          <div style={s.timerControls}>
            <button style={s.ctrlBtn} onClick={skipPhase}>{t.skip}</button>
            <button style={s.ctrlStop} onClick={stopSession}>{t.stop}</button>
          </div>
        </div>
      </AppWrapper>
    );
  };

  // =========================================================================
  // ROUTER
  // =========================================================================

  switch (view) {
    case 'info': return <InfoView />;
    case 'sounds': return <SoundsView />;
    case 'detail': return <DetailView />;
    case 'ablauf': return <AblaufView />;
    case 'edit': return <EditView />;
    case 'pick-han': return <SoundPickerView soundType="han" />;
    case 'pick-gong': return <SoundPickerView soundType="gong" />;
    case 'timer': return <TimerView />;
    default: return <HomeView />;
  }
};

export default App;
