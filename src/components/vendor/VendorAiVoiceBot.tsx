import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  X,
  ShieldCheck,
  Calendar,
  FileText,
  Phone,
  Clock,
  RotateCcw,
  MessageSquare,
  Home,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LabTest, LabPackage, ReceptionPatientEntry, LabReport, Language } from '../../types';
import {
  VendorVoiceContext,
  VoiceBotResponse,
  VoiceBotAction,
  askVendorVoiceBot,
  VoiceSpeaker
} from '../../services/vendorAiVoiceService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actions?: VoiceBotAction[];
  isVoice?: boolean;
}

interface VendorAiVoiceBotProps {
  currentLabItem: any;
  vendorLabSettings: any;
  vendorTests: LabTest[];
  vendorPackages: LabPackage[];
  vendorDoctors: any[];
  allReports?: LabReport[];
  allReceptionEntries?: ReceptionPatientEntry[];
  currentWebsiteLabId: string;
  onOpenReportPortal: (reportId?: string, mobile?: string) => void;
  onOpenBookingModal: (preselectedTestId?: string) => void;
  onOpenDownloadAppModal?: () => void;
  language?: Language;
}

export const VendorAiVoiceBot: React.FC<VendorAiVoiceBotProps> = ({
  currentLabItem,
  vendorLabSettings,
  vendorTests,
  vendorPackages,
  vendorDoctors,
  allReports = [],
  allReceptionEntries = [],
  currentWebsiteLabId,
  onOpenReportPortal,
  onOpenBookingModal,
  onOpenDownloadAppModal,
}) => {
  // Panel open/closed state
  const [isOpen, setIsOpen] = useState(false);

  // Floating button active vs idle transparent state
  const [isButtonActive, setIsButtonActive] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [voiceMode, setVoiceMode] = useState<'hi' | 'hinglish' | 'en'>('hinglish');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition instance
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prepare strictly scoped vendor context
  const vendorContext: VendorVoiceContext = React.useMemo(() => {
    const vName =
      vendorLabSettings?.labName ||
      vendorLabSettings?.name ||
      currentLabItem?.name ||
      'हमारी डायग्नोस्टिक लैब';

    const address =
      vendorLabSettings?.address ||
      vendorLabSettings?.city ||
      currentLabItem?.address ||
      currentLabItem?.city ||
      '';

    const phone =
      vendorLabSettings?.phone ||
      vendorLabSettings?.contactNumber ||
      currentLabItem?.phone ||
      '';

    const whatsapp =
      vendorLabSettings?.whatsappNumber ||
      vendorLabSettings?.whatsapp ||
      phone;

    const email =
      vendorLabSettings?.email ||
      currentLabItem?.email ||
      '';

    const timings =
      vendorLabSettings?.timings ||
      vendorLabSettings?.workingHours ||
      'सुबह 07:00 AM से रात 09:00 PM तक';

    return {
      vendorId: currentWebsiteLabId,
      vendorName: vName,
      tagline: vendorLabSettings?.tagline || currentLabItem?.tagline,
      phone,
      whatsapp,
      email,
      address,
      timings,
      homeCollectionEnabled: vendorLabSettings?.homeCollectionEnabled !== false,
      homeCollectionFee: vendorLabSettings?.homeCollectionFee || 0,
      tests: vendorTests || [],
      packages: vendorPackages || [],
      doctors: (vendorDoctors || []).map(d => ({
        name: d.name || d.doctorName || 'कंसल्टेंट पैथोलॉजिस्ट',
        qualification: d.qualification || d.degree || 'MBBS, MD',
        specialization: d.specialization || d.speciality || 'Pathology',
        designation: d.designation || 'Consultant Pathologist'
      })),
      allReports,
      allReceptionEntries
    };
  }, [
    vendorLabSettings,
    currentLabItem,
    currentWebsiteLabId,
    vendorTests,
    vendorPackages,
    vendorDoctors,
    allReports,
    allReceptionEntries
  ]);

  // Initial welcome greeting from bot
  useEffect(() => {
    const initialGreeting = `नमस्ते! मैं ${vendorContext.vendorName} का AI Voice Assistant हूँ 🎙️।\n\nआप बिना टाइप किए बोलकर सवाल पूछ सकते हैं:\n• किसी भी टेस्ट का रेट व फास्टिंग नियम\n• होम कलेक्शन सुविधा\n• प्रिवेंटिव हेल्थ चेकअप पैकेजेस\n• लैब का पता, समय व संपर्क सूत्र\n• अपनी रिपोर्ट का स्टेटस (टोकन नंबर से)`;

    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { type: 'scroll_tests', label: '🩸 टेस्ट रेट लिस्ट' },
          { type: 'book_home_collection', label: '🏠 होम कलेक्शन' },
          { type: 'check_report', label: '🔍 रिपोर्ट चेक करें' }
        ]
      }
    ]);
  }, [vendorContext.vendorName]);

  // Scroll to bottom of message list on updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isListening, transcript]);

  // Touch & inactivity auto-dim timer:
  // "Touch न करने पर button छोटा और transparent रहेगा।
  //  Touch करने पर button smoothly थोड़ा बड़ा/active हो जाएगा।
  //  कुछ समय बाद फिर छोटा और transparent हो जाएगा।"
  const triggerButtonActive = () => {
    setIsButtonActive(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Return to transparent & small after 6 seconds of no touch
    idleTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setIsButtonActive(false);
      }
    }, 6000);
  };

  useEffect(() => {
    // If modal is opened, button is active
    if (isOpen) {
      setIsButtonActive(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      // Set timer to dim down when closed
      triggerButtonActive();
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const windowWithSpeech = window as any;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);

        // Auto-submit after silence of 1.5 seconds if we have speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (currentText.trim().length > 1) {
          silenceTimeoutRef.current = setTimeout(() => {
            handleStopAndSubmitSpeech(currentText);
          }, 1600);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Error setting up speech recognition:', err);
      setMicSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [speechLanguage]);

  // Handle Speech Toggle
  const startListening = () => {
    triggerButtonActive();
    if (!recognitionRef.current) {
      alert('आपके ब्राउज़र में वॉइस रिकॉग्निशन सपोर्ट नहीं है। आप नीचे टाइप कर सकते हैं।');
      return;
    }

    try {
      VoiceSpeaker.stop();
      setIsSpeaking(false);
      setTranscript('');
      recognitionRef.current.lang = speechLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      // If already started, restart
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleStopAndSubmitSpeech = (textToSend?: string) => {
    stopListening();
    const query = (textToSend || transcript).trim();
    if (query.length > 0) {
      submitUserQuery(query, true);
    }
    setTranscript('');
  };

  // Submit User Query
  const submitUserQuery = async (queryText: string, isFromVoice = false) => {
    if (!queryText.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: isFromVoice
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setIsProcessing(true);

    try {
      const response: VoiceBotResponse = await askVendorVoiceBot(
        queryText,
        vendorContext,
        voiceMode
      );

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions
      };

      setMessages(prev => [...prev, botMsg]);

      // Speak response aloud if speech is enabled
      if (speechEnabled && response.speechText) {
        VoiceSpeaker.speak(response.speechText, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }
    } catch (err) {
      console.error('Error fetching voice response:', err);
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: `माफ़ कीजिए, मुझे आपकी बात समझने में थोड़ी समस्या हुई। कृपया दोबारा बोलें या नीचे दिए गए विकल्पों में से चुनें।`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { type: 'scroll_tests', label: '🩸 टेस्ट रेट लिस्ट' },
          { type: 'book_home_collection', label: '🏠 होम कलेक्शन' }
        ]
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Action from Bot
  const handleExecuteAction = (action: VoiceBotAction) => {
    triggerButtonActive();
    switch (action.type) {
      case 'book_test':
        setIsOpen(false);
        onOpenBookingModal(action.payload?.testId);
        break;
      case 'book_home_collection':
        setIsOpen(false);
        onOpenBookingModal();
        break;
      case 'check_report':
        setIsOpen(false);
        onOpenReportPortal(action.payload?.token);
        break;
      case 'download_app':
        setIsOpen(false);
        if (onOpenDownloadAppModal) onOpenDownloadAppModal();
        break;
      case 'scroll_tests':
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('tests-packages-section') || document.getElementById('tests-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'view_packages':
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('packages-section') || document.getElementById('tests-packages-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'call_lab':
        if (action.payload?.phone) {
          window.location.href = `tel:${action.payload.phone}`;
        }
        break;
      case 'whatsapp_lab':
        if (action.payload?.phone) {
          const cleanPhone = action.payload.phone.replace(/\D/g, '');
          const url = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
            `नमस्ते ${vendorContext.vendorName}, मुझे टेस्ट / होम कलेक्शन बुक करना है।`
          )}`;
          window.open(url, '_blank');
        }
        break;
    }
  };

  // Quick Prompt Chips
  const quickChips = [
    { label: '🩸 CBC Test Rate', prompt: 'CBC test ka price kya hai aur fasting chahiye?' },
    { label: '🧪 Sugar / Diabetes', prompt: 'Blood sugar test ki timing aur fasting rules kya hain?' },
    { label: '🏠 Home Collection', prompt: 'Home sample collection kaise book karein?' },
    { label: '🕒 Lab Timing & Address', prompt: 'Lab kab khulti hai aur address kya hai?' },
    { label: '📦 Full Body Package', prompt: 'Health checkup packages aur unke prices batao' },
    { label: '📄 Report Status', prompt: 'Mera report online kaise check karein?' },
  ];

  return (
    <>
      {/* 
        FLOATING / STICKY AI VOICE BOT BUTTON
        "Website के bottom corner में छोटा sticky/floating AI Voice Bot 🎙️ button रहेगा।
         Touch न करने पर button छोटा और transparent रहेगा।
         Touch करने पर button smoothly थोड़ा बड़ा/active हो जाएगा।
         कुछ समय बाद फिर छोटा और transparent हो जाएगा।
         Button lightweight होगा और website content को unnecessarily cover नहीं करेगा。"
      */}
      <div
        className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40 select-none"
        onMouseEnter={triggerButtonActive}
        onTouchStart={triggerButtonActive}
      >
        <button
          type="button"
          onClick={() => {
            triggerButtonActive();
            setIsOpen(!isOpen);
            if (!isOpen) {
              // Auto start listening on open
              setTimeout(() => {
                startListening();
              }, 400);
            } else {
              stopListening();
              VoiceSpeaker.stop();
            }
          }}
          className={`group relative flex items-center gap-2 rounded-full transition-all duration-300 ease-out cursor-pointer ${
            isButtonActive || isOpen
              ? 'scale-105 opacity-100 shadow-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white px-3.5 py-2.5 sm:px-4 sm:py-3 border border-white/40 ring-4 ring-blue-500/20'
              : 'scale-90 opacity-45 hover:opacity-100 hover:scale-100 p-2.5 sm:p-3 bg-slate-900/50 backdrop-blur-md text-white/90 border border-white/20 shadow-sm'
          }`}
          title="AI Voice Bot - बोलकर पूछें (Hindi/English/Hinglish)"
          aria-label="Open AI Voice Bot"
        >
          {/* Animated Microphone Icon */}
          <div className="relative flex items-center justify-center">
            {isListening && (
              <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping" />
            )}
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-pulse" />
            )}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
                isButtonActive || isOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/90 group-hover:bg-white/20'
              }`}
            >
              {isListening ? (
                <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-300 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-300 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 group-hover:scale-110 transition-transform" />
              )}
            </div>

            {/* Glowing AI Sparkle dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900 shadow-xs" />
          </div>

          {/* Smooth expanding label when active */}
          {(isButtonActive || isOpen) && (
            <div className="flex flex-col text-left pr-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-tight leading-none text-white">
                  AI Voice Bot
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 leading-none">
                  🎙️ Live
                </span>
              </div>
              <span className="text-[10px] text-blue-100 font-medium leading-tight">
                बोलकर पूछें (Hindi/Eng)
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 
        VOICE BOT INTERACTION MODAL / FLOATING PANEL
      */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed bottom-20 left-3 sm:bottom-24 sm:left-6 z-50 w-[calc(100vw-24px)] sm:w-[410px] md:w-[430px] max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-200"
          onClick={triggerButtonActive}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#123B6D] via-blue-800 to-indigo-900 text-white relative">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                <Mic className="w-5 h-5 text-amber-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#123B6D]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight leading-tight line-clamp-1">
                    {vendorContext.vendorName}
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    AI Bot
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-blue-100/90 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>Strictly {vendorContext.vendorName} Data Only</span>
                </div>
              </div>
            </div>

            {/* Controls: Audio Speaker toggle & Close */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (speechEnabled) {
                    VoiceSpeaker.stop();
                    setIsSpeaking(false);
                    setSpeechEnabled(false);
                  } else {
                    setSpeechEnabled(true);
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  speechEnabled
                    ? 'text-emerald-300 hover:bg-white/15'
                    : 'text-white/50 hover:bg-white/10'
                }`}
                title={speechEnabled ? 'वॉयस उत्तर चालू है (Mute करें)' : 'वॉयस उत्तर बंद है (Unmute करें)'}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  stopListening();
                  VoiceSpeaker.stop();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Language and Isolation Status Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Hindi • English • Hinglish
            </span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => {
                  setSpeechLanguage('hi-IN');
                  setVoiceMode('hi');
                }}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                  speechLanguage === 'hi-IN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeechLanguage('en-IN');
                  setVoiceMode('en');
                }}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                  speechLanguage === 'en-IN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[46vh] sm:max-h-[50vh] bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  {/* Sender badge */}
                  <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-black/5 text-[10px] opacity-75">
                    <span className="font-bold flex items-center gap-1">
                      {m.sender === 'user' ? (
                        <>👤 You {m.isVoice && '🎙️ (Voice)'}</>
                      ) : (
                        <>🎙️ {vendorContext.vendorName} AI</>
                      )}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <div className="whitespace-pre-line font-medium">{m.text}</div>

                  {/* Actions buttons if any */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleExecuteAction(act)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all border border-blue-200 cursor-pointer shadow-xs"
                        >
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Replay voice button for bot message */}
                  {m.sender === 'bot' && (
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          VoiceSpeaker.speak(m.text, {
                            onStart: () => setIsSpeaking(true),
                            onEnd: () => setIsSpeaking(false),
                            onError: () => setIsSpeaking(false)
                          });
                        }}
                        className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                        title="Replay in Voice"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>सुने</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Voice Recording Status */}
            {isListening && (
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <Mic className="w-4 h-4 text-red-500 animate-bounce" />
                  <span>सुन रहे हैं... बोलिए (Listening...)</span>
                </div>
                {transcript ? (
                  <p className="mt-1 text-xs font-semibold text-slate-800 text-center italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10px] text-blue-600">
                    अपना सवाल या टेस्ट का नाम बोलें (जैसे: "CBC टेस्ट का क्या रेट है?")
                  </p>
                )}
                {/* Visualizer sound bars */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-1 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="w-1 h-6 bg-red-500 rounded-full animate-bounce [animation-delay:200ms]" />
                  <span className="w-1 h-4 bg-indigo-500 rounded-full animate-bounce [animation-delay:400ms]" />
                </div>
              </div>
            )}

            {/* Processing state */}
            {isProcessing && (
              <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>AI जवाब तैयार कर रहा है...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Voice Prompt Chips */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickChips.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => submitUserQuery(chip.prompt, false)}
                className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Voice Input & Text Input Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
            {/* Primary Large Microphone Button */}
            <button
              type="button"
              onClick={isListening ? () => handleStopAndSubmitSpeech() : startListening}
              className={`relative flex items-center justify-center w-11 h-11 rounded-2xl text-white transition-all cursor-pointer shrink-0 shadow-md ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-105 ring-4 ring-red-400/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95'
              }`}
              title={isListening ? 'बोलना बंद करें और भेजें' : 'बोलकर सवाल पूछें'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Optional Text typing input for quiet environments */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitUserQuery(inputText, false);
                  }
                }}
                placeholder={isListening ? 'सुन रहे हैं...' : 'या यहाँ टाइप करके पूछें...'}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              />
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => submitUserQuery(inputText, false)}
                  className="absolute right-1.5 p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  title="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
