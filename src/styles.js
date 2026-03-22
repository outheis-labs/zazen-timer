// Base sizes - will be scaled by accessibility multiplier
const BASE = {
  // Text sizes (increased from original)
  textXs: 13,    // was 11
  textSm: 15,    // was 13  
  textBase: 18,  // was 15
  textLg: 20,    // was 17
  textXl: 24,    // was 20
  text2xl: 30,   // was 26
  textTimer: 100, // was 88
  textTimerSep: 76, // was 64
  
  // Spacing
  padSm: 12,
  padBase: 24,
  padLg: 32,
  
  // Touch targets - minimum 44px for accessibility
  touchTarget: 48,
  buttonPad: 20,
};

export const createStyles = (scale = 1) => {
  const sz = (val) => `${Math.round(val * scale)}px`;
  
  return {
    // Outer wrapper for sidebars on desktop
    appWrapper: {
      minHeight: '100dvh',
      backgroundColor: '#141414',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'auto',
    },
    app: { 
      width: '100%', 
      maxWidth: '430px', 
      minHeight: '100dvh',
      height: 'auto',
      backgroundColor: '#fff', 
      color: '#000', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif', 
      display: 'flex', 
      flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
      fontSize: sz(BASE.textBase),
    },
    appDark: { backgroundColor: '#000', color: '#fff' },
    
    // Header (Home)
    header: { padding: `60px ${sz(BASE.padBase)} ${sz(BASE.padLg)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: sz(16) },
    title: { fontSize: sz(24), fontWeight: '300', letterSpacing: '0.08em', margin: 0 },
    headerBack: { padding: `60px ${sz(BASE.padBase)} ${sz(BASE.padSm)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative' },
    backBtn: { background: 'none', border: 'none', fontSize: sz(BASE.textBase), color: 'inherit', cursor: 'pointer', padding: `${sz(8)} 0`, minWidth: '90px', textAlign: 'left' },
    headerTitle: { fontSize: sz(BASE.textBase), fontWeight: '500', position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
    saveBtn: { background: 'none', border: 'none', fontSize: sz(BASE.textBase), color: 'inherit', cursor: 'pointer', fontWeight: '500', padding: `${sz(8)} 0`, minWidth: '90px', textAlign: 'right' },
    infoBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: sz(12), opacity: 0.5, color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: sz(56), minHeight: sz(56) },
    
    // Content
    content: { 
      flex: 1, 
      padding: `${sz(8)} ${sz(BASE.padBase)} ${sz(BASE.padBase)}`, 
      paddingBottom: `calc(${sz(BASE.padBase)} + env(safe-area-inset-bottom, 0px))`,
      overflowY: 'auto', 
      WebkitOverflowScrolling: 'touch' 
    },
    section: { fontSize: sz(BASE.textXs), letterSpacing: '0.08em', color: 'rgba(128,128,128,0.9)', marginBottom: sz(14), marginTop: sz(20) },
    
    // Install warning
    installWarning: { 
      fontSize: sz(BASE.textSm), 
      color: '#856404', 
      backgroundColor: '#fff3cd', 
      padding: `${sz(12)} ${sz(14)}`, 
      borderRadius: '4px', 
      marginBottom: sz(8),
      lineHeight: 1.4
    },
    
    // Config list
    configItem: { width: '100%', padding: `${sz(20)} 0`, background: 'none', border: 'none', borderBottom: '1px solid rgba(128,128,128,0.15)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: sz(6), color: 'inherit' },
    configName: { fontSize: sz(BASE.textLg), fontWeight: '400' },
    configMeta: { fontSize: sz(BASE.textSm), opacity: 0.5 },
    addBtn: { width: '100%', padding: `${sz(20)} 0`, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: sz(14), fontSize: sz(BASE.textBase), opacity: 0.5, color: 'inherit' },
    empty: { textAlign: 'center', padding: `${sz(60)} ${sz(BASE.padBase)}`, opacity: 0.4, fontSize: sz(BASE.textBase) },
    
    // Detail
    detailContent: { flex: 1, padding: sz(BASE.padBase), position: 'relative' },
    ensoBg: { position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' },
    configTitle: { fontSize: sz(BASE.text2xl), fontWeight: '300', marginBottom: sz(BASE.padLg), marginTop: sz(BASE.padBase) },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${sz(14)} 0`, borderBottom: '1px solid rgba(128,128,128,0.1)' },
    detailLabel: { fontSize: sz(BASE.textBase), opacity: 0.5 },
    detailValue: { fontSize: sz(BASE.textBase) },
    ablaufLink: { marginTop: sz(BASE.padBase), background: 'none', border: 'none', fontSize: sz(BASE.textBase), opacity: 0.6, cursor: 'pointer', padding: `${sz(8)} 0`, textAlign: 'left', color: 'inherit' },
    totalTime: { marginTop: sz(18), fontSize: sz(BASE.textSm), opacity: 0.4 },
    
    // Buttons
    actionArea: { 
      padding: sz(BASE.padBase), 
      paddingBottom: `calc(${sz(BASE.padBase + 24)} + env(safe-area-inset-bottom, 0px))`,
      display: 'flex', 
      flexDirection: 'column', 
      gap: sz(14), 
      flexShrink: 0 
    },
    primaryBtn: { width: '100%', padding: sz(BASE.buttonPad), backgroundColor: '#000', color: '#fff', border: 'none', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px' },
    secondaryBtn: { width: '100%', padding: sz(16), backgroundColor: 'transparent', color: 'inherit', border: '1px solid rgba(128,128,128,0.25)', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px' },
    dangerBtn: { width: '100%', padding: sz(16), backgroundColor: 'transparent', color: '#c00', border: '1px solid rgba(200,0,0,0.25)', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px', marginTop: sz(BASE.padBase) },
    
    // Timer
    timerPhase: { padding: `60px ${sz(BASE.padBase)} ${sz(BASE.padBase)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    phaseLabel: { fontSize: sz(BASE.textXs), letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase' },
    roundInd: { fontSize: sz(BASE.textSm), opacity: 0.4 },
    timerCenter: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    timerDisplay: { display: 'flex', alignItems: 'baseline', zIndex: 1 },
    timerDigits: { fontSize: sz(BASE.textTimer), fontWeight: '200', fontVariantNumeric: 'tabular-nums' },
    timerSep: { fontSize: sz(BASE.textTimerSep), fontWeight: '200', opacity: 0.4, margin: '0 2px' },
    timerControls: { 
      padding: sz(BASE.padBase), 
      paddingBottom: `calc(${sz(BASE.padBase + 24)} + env(safe-area-inset-bottom, 0px))`,
      display: 'flex', 
      gap: sz(14) 
    },
    ctrlBtn: { flex: 1, padding: sz(18), backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px' },
    ctrlStop: { flex: 1, padding: sz(18), backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px' },
    
    // Form inputs
    inputGroup: { marginBottom: sz(BASE.padBase) },
    inputLabel: { display: 'block', fontSize: sz(BASE.textXs), letterSpacing: '0.08em', opacity: 0.5, marginBottom: sz(14) },
    textInput: { width: '100%', padding: `${sz(14)} 0`, fontSize: sz(BASE.textLg), border: 'none', borderBottom: '1px solid rgba(128,128,128,0.25)', outline: 'none', backgroundColor: 'transparent', boxSizing: 'border-box', color: 'inherit' },
    inputRow: { display: 'flex', gap: sz(24), marginBottom: sz(18) },
    inputRowVertical: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sz(16), paddingBottom: sz(16), borderBottom: '1px solid rgba(128,128,128,0.1)' },
    inputHalf: { flex: 1 },
    inputLabelSm: { display: 'block', fontSize: sz(BASE.textXs), opacity: 0.5, marginBottom: sz(10) },
    stepper: { display: 'flex', alignItems: 'center', gap: sz(12) },
    stepBtn: { width: sz(BASE.touchTarget), height: sz(BASE.touchTarget), border: '1px solid rgba(128,128,128,0.25)', backgroundColor: 'transparent', fontSize: sz(22), cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' },
    stepVal: { fontSize: sz(BASE.textLg), fontWeight: '400', minWidth: sz(36), textAlign: 'center' },
    
    // Sound picker
    soundPicker: { width: '100%', padding: `${sz(16)} ${sz(18)}`, backgroundColor: 'rgba(128,128,128,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sz(14), fontSize: sz(BASE.textBase), borderRadius: '2px', textAlign: 'left', color: 'inherit', marginTop: sz(10) },
    soundIcon: { fontSize: sz(BASE.textXs), opacity: 0.4 },
    soundArrow: { marginLeft: 'auto', opacity: 0.3, fontSize: sz(BASE.textBase), flexShrink: 0 },
    
    // Info sections
    infoSection: { marginBottom: sz(36) },
    infoTitle: { fontSize: sz(BASE.textXs), letterSpacing: '0.08em', opacity: 0.5, marginBottom: sz(14) },
    infoText: { fontSize: sz(BASE.textBase), lineHeight: 1.6, opacity: 0.7, margin: 0 },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: `${sz(14)} 0`, borderBottom: '1px solid rgba(128,128,128,0.1)' },
    infoLabel: { fontSize: sz(BASE.textBase), opacity: 0.5 },
    infoValue: { fontSize: sz(BASE.textBase) },
    infoLink: { fontSize: sz(BASE.textBase), color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px' },
    navItem: { width: '100%', padding: `${sz(18)} 0`, background: 'none', border: 'none', borderBottom: '1px solid rgba(128,128,128,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: sz(BASE.textBase), color: 'inherit', textAlign: 'left' },
    
    // Language & accessibility selector
    langSelector: { display: 'flex', gap: sz(14) },
    langBtn: { padding: `${sz(12)} ${sz(20)}`, border: '1px solid rgba(128,128,128,0.25)', backgroundColor: 'transparent', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px', color: 'inherit' },
    langBtnActive: { backgroundColor: '#000', color: '#fff', borderColor: '#000' },
    
    accessSelector: { display: 'flex', gap: sz(10), marginTop: sz(14) },
    accessBtn: { padding: `${sz(14)} ${sz(16)}`, border: '1px solid rgba(128,128,128,0.25)', backgroundColor: 'transparent', fontSize: sz(BASE.textBase), cursor: 'pointer', borderRadius: '2px', color: 'inherit', flex: 1, textAlign: 'center' },
    accessBtnActive: { backgroundColor: '#000', color: '#fff', borderColor: '#000' },
    
    // Ritual steps
    ritualStep: { display: 'flex', alignItems: 'flex-start', gap: sz(14), padding: `${sz(10)} 0` },
    ritualIcon: { fontSize: sz(BASE.textSm), width: sz(24), textAlign: 'center', opacity: 0.6, marginTop: sz(2) },
    ritualBlock: { display: 'flex', flexDirection: 'column' },
    ritualLabel: { fontSize: sz(BASE.textBase), fontWeight: '500' },
    ritualDesc: { fontSize: sz(BASE.textSm), opacity: 0.5 },
    ritualPause: { fontSize: sz(BASE.textXs), opacity: 0.35, paddingLeft: sz(38), fontStyle: 'italic' },
    
    // Ablauf
    ablaufRound: { marginBottom: sz(BASE.padBase) },
    ablaufHeader: { fontSize: sz(BASE.textXs), letterSpacing: '0.08em', opacity: 0.4, marginBottom: sz(14) },
    ablaufStep: { display: 'flex', alignItems: 'flex-start', gap: sz(14), padding: `${sz(8)} 0` },
    ablaufIcon: { fontSize: sz(BASE.textXs), width: sz(24), textAlign: 'center', opacity: 0.5, marginTop: sz(2) },
    ablaufContent: { display: 'flex', flexDirection: 'column' },
    ablaufLabel: { fontSize: sz(BASE.textBase) },
    ablaufTime: { fontSize: sz(BASE.textSm), opacity: 0.45 },
    ablaufDur: { fontSize: sz(BASE.textXs), opacity: 0.3, padding: `${sz(10)} 0 ${sz(10)} ${sz(38)}`, borderLeft: '1px solid rgba(128,128,128,0.15)', marginLeft: sz(11) },
    
    // Complete
    complete: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: sz(BASE.padBase) },
    completeText: { fontSize: sz(BASE.textSm), letterSpacing: '0.15em', opacity: 0.6, marginTop: sz(BASE.padBase) },
    
    // Sound items
    fileInput: { display: 'none' },
    soundItem: { width: '100%', padding: `${sz(16)} 0`, background: 'none', border: 'none', borderBottom: '1px solid rgba(128,128,128,0.1)', display: 'flex', alignItems: 'center', gap: sz(14), fontSize: sz(BASE.textBase), textAlign: 'left', color: 'inherit' },
    soundItemName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
    soundPlayBtn: { background: 'transparent', border: '1px solid rgba(128,128,128,0.25)', borderRadius: '2px', width: sz(BASE.touchTarget), height: sz(BASE.touchTarget), display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'inherit', opacity: 0.6, flexShrink: 0 },
    soundDeleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#c00', fontSize: sz(BASE.textSm), padding: sz(10), opacity: 0.7, flexShrink: 0 },
    soundOpt: { width: '100%', padding: `${sz(16)} 0`, background: 'none', border: 'none', borderBottom: '1px solid rgba(128,128,128,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sz(14), fontSize: sz(BASE.textBase), textAlign: 'left', color: 'inherit' },
    soundOptName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
    soundOptCheck: { fontSize: sz(BASE.textBase), opacity: 0.8, flexShrink: 0 },
    addSoundBtn: { width: '100%', padding: `${sz(16)} 0`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sz(12), fontSize: sz(BASE.textBase), opacity: 0.5, color: 'inherit' },
    soundNote: { fontSize: sz(BASE.textXs), opacity: 0.35, marginTop: sz(10) },
  };
};

// Default export for backwards compatibility
export const styles = createStyles(1);
