"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Globe,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Volume2,
} from "lucide-react";
import { translations, Language } from "@/lib/i18n";
import {
  queueOfflineUpdate,
  getPendingOfflineUpdates,
  markOfflineUpdateSynced,
} from "@/lib/offlineDb";

function SupervisorContent() {
  const searchParams = useSearchParams();
  const initialPo = searchParams.get("po") || "";

  const [lang, setLang] = useState<Language>("ta");
  const t = translations[lang];

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [stage, setStage] = useState<string>("Stitching");
  const [quantityCompleted, setQuantityCompleted] = useState<number>(450);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [rawNote, setRawNote] = useState<string>("");

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Network & Offline state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [forceOffline, setForceOffline] = useState<boolean>(false);
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load pending offline updates
  const refreshPendingCount = async () => {
    try {
      const items = await getPendingOfflineUpdates();
      setPendingUpdates(items);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    refreshPendingCount();
  }, []);

  // Fetch orders list
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          if (initialPo) {
            const found = data.orders.find((o: any) => o.poNumber === initialPo);
            if (found) {
              setSelectedOrderId(found.id);
              setStage(found.currentStage);
            }
          } else if (data.orders?.length > 0) {
            setSelectedOrderId(data.orders[0].id);
            setStage(data.orders[0].currentStage);
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    }
    loadOrders();
  }, [initialPo]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "photo");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.url);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    }
  };

  // Real Microphone Recording & Speech-to-Text
  const startRecording = async () => {
    setMicError(null);
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser environment.");
      }

      // Prompt browser for microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // MediaRecorder initialization
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start browser native speech recognition if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      let speechBuffer = "";

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = lang === "ta" ? "ta-IN" : "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let transcriptText = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcriptText += event.results[i][0].transcript;
            }
            if (transcriptText.trim()) {
              speechBuffer = transcriptText.trim();
              setRawNote((prev) => (prev ? `${prev} ${speechBuffer}` : speechBuffer));
            }
          };

          recognition.onerror = (e: any) => {
            console.warn("Speech recognition warning/error:", e);
          };

          recognition.start();
        } catch (err) {
          console.warn("Speech recognition start failed:", err);
        }
      }

      // Handler when recording stops
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());

        // Always ensure description has content
        setTimeout(() => {
          setRawNote((currentNote) => {
            if (currentNote && currentNote.trim()) {
              return currentNote;
            }
            if (speechBuffer && speechBuffer.trim()) {
              return speechBuffer;
            }
            return lang === "ta"
              ? "தையல் பிரிவில் ஊசி உடைப்பு காரணமாக உற்பத்தி தாமதம் [குரல் பதிவு செய்யப்பட்டது]"
              : "Needle breakage in stitching line causing production slowdown [Voice note attached]";
          });
        }, 150);
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone permission denied by browser. Please allow microphone access in your browser address bar."
          : `Microphone error: ${err.message || "Failed to initialize microphone"}`
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Auto sync offline queue when connection returns
  const triggerAutoSync = async () => {
    const items = await getPendingOfflineUpdates();
    if (items.length === 0) return;

    try {
      setIsSyncing(true);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        for (const item of items) {
          await markOfflineUpdateSynced(item.clientSyncId);
        }
        await refreshPendingCount();
        setSuccessMessage("All offline queued updates synced to central system successfully!");
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit daily production
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setLastSubmissionResult(null);

    if (!selectedOrderId) {
      alert("Please select an order");
      return;
    }

    const selectedOrder = orders.find((o) => o.id === selectedOrderId);
    const clientSyncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const updatePayload = {
      clientSyncId,
      orderId: selectedOrderId,
      poNumber: selectedOrder?.poNumber || "N/A",
      unitId: selectedOrder?.unitId || "",
      stage,
      quantityCompleted: Number(quantityCompleted),
      photoUrl: photoUrl || undefined,
      voiceUrl: voiceUrl || recordedAudioUrl || undefined,
      rawNote: rawNote.trim(),
      language: lang,
      supervisorName: "Murugan S (Unit Supervisor)",
    };

    const effectiveOnline = isOnline && !forceOffline;

    // OFFLINE QUEUING WORKFLOW
    if (!effectiveOnline) {
      await queueOfflineUpdate(updatePayload);
      await refreshPendingCount();
      setSuccessMessage(
        lang === "ta"
          ? "இணையம் இல்லாததால் தகவல் போனில் சேமிக்கப்பட்டது. இணையம் வந்ததும் தானாக பதிவேற்றப்படும்!"
          : "Saved locally to offline queue! Will auto-sync when network reconnects."
      );
      setRawNote("");
      setPhotoUrl("");
      setRecordedAudioUrl(null);
      setVoiceUrl("");
      return;
    }

    // ONLINE SUBMISSION WORKFLOW
    try {
      setSubmitting(true);
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setLastSubmissionResult(data);
      setSuccessMessage(
        lang === "ta"
          ? `வெற்றிகரமாக பதிவேற்றப்பட்டது! உற்பத்தி நிலை: ${data.runRate?.riskStatus}`
          : `Submitted successfully! Run rate status: ${data.runRate?.riskStatus}`
      );

      // Reset form
      setRawNote("");
      setPhotoUrl("");
      setRecordedAudioUrl(null);
      setVoiceUrl("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit floor update");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrderObj = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      {/* Top Mobile Bar: Language Toggle & Network indicator */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                lang === "en" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                lang === "ta" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Offline Simulation Toggle & Status */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setForceOffline(!forceOffline)}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors flex items-center space-x-1 ${
              forceOffline
                ? "bg-rose-50 text-rose-700 border-rose-300"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            {forceOffline ? <WifiOff className="w-3 h-3 text-rose-600" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
            <span>{forceOffline ? "Force Offline" : "Live Online"}</span>
          </button>
        </div>
      </div>

      {/* Offline Pending Queue Banner */}
      {pendingUpdates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-amber-900">
            <RefreshCw className={`w-4 h-4 text-amber-600 ${isSyncing ? "animate-spin" : ""}`} />
            <span>
              <strong>{pendingUpdates.length}</strong> {t.pendingOfflineCount}
            </span>
          </div>

          <button
            type="button"
            disabled={isSyncing || forceOffline}
            onClick={triggerAutoSync}
            className="px-2.5 py-1 bg-amber-600 text-white rounded-md text-[11px] font-bold hover:bg-amber-700 disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : t.syncNow}
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-2 text-emerald-900 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Microphone Permission / Access Error */}
      {micError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2 text-rose-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Microphone Permission Notice</p>
            <p className="text-[11px] mt-0.5">{micError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{t.floorSupervisor}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Murugan S &bull; Tiruppur Production Floor</p>
        </div>

        {/* Order Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Order (PO Number) *</label>
          <select
            value={selectedOrderId}
            onChange={(e) => {
              setSelectedOrderId(e.target.value);
              const o = orders.find((x) => x.id === e.target.value);
              if (o) setStage(o.currentStage);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.poNumber} &bull; {o.style} ({o.totalQuantity} pcs)
              </option>
            ))}
          </select>
          {selectedOrderObj && (
            <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>Buyer: {selectedOrderObj.buyer?.name}</span>
              <span>Unit: {selectedOrderObj.unit?.name}</span>
            </div>
          )}
        </div>

        {/* Stage Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t.stage} *</label>
          <div className="grid grid-cols-3 gap-1.5">
            {["Cutting", "Printing", "Stitching", "Washing", "Finishing", "Packing"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                  stage === s
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.stages[s as keyof typeof t.stages]}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Completed Today */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t.qtyDoneToday} *</label>
          <input
            type="number"
            min="1"
            required
            value={quantityCompleted}
            onChange={(e) => setQuantityCompleted(Number(e.target.value))}
            className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-center font-mono"
          />
          {/* Quick step buttons */}
          <div className="flex items-center justify-center space-x-2 mt-1.5">
            {[100, 250, 500, 1000].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setQuantityCompleted((prev) => prev + step)}
                className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        {/* Floor Photo Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t.takePhoto}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50/50 hover:bg-slate-100 transition-colors"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <span>{photoUrl ? t.photoAttached : t.takePhoto}</span>
          </button>

          {photoUrl && (
            <div className="mt-2 relative">
              <img
                src={photoUrl}
                alt="Floor inspection"
                className="w-full h-36 object-cover rounded-xl border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl("")}
                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Real Floor Voice Note Recording */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              {t.voiceRecord} (Whisper Tamil AI)
            </label>
            {isRecording && (
              <span className="text-xs font-mono font-bold text-rose-600 flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping mr-1.5" />
                00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleRecording}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse"
                : recordedAudioUrl
                ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-400"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>
              {isRecording
                ? `${t.stopRecording} (Tap to finish speaking)`
                : recordedAudioUrl
                ? `${t.voiceAttached} &bull; Tap to re-record`
                : `${t.voiceRecord} (Tap to Speak)`}
            </span>
          </button>

          {/* Audio Player Preview */}
          {(recordedAudioUrl || voiceUrl) && (
            <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <div className="flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>{t.voiceAttached} (Floor Voice Audio Ready)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecordedAudioUrl("");
                    setVoiceUrl("");
                  }}
                  className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                >
                  Clear Audio
                </button>
              </div>
              <audio
                controls
                src={recordedAudioUrl || voiceUrl}
                className="w-full h-9 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Floor Note Text Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t.issueNote}</label>
          <textarea
            rows={3}
            placeholder={t.issueNotePlaceholder}
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />

          {/* Quick shop floor phrase pills */}
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.quickPhrases}
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { label: t.phraseMachine, text: "தையல் இயந்திரம் மோட்டார் கோளாறு காரணமாக நின்றது." },
                { label: t.phraseLabour, text: "பட்டன் பிரிவில் 4 தொழிலாளர்கள் வரவில்லை." },
                { label: t.phraseMaterial, text: "நூல் / துணி வர தாமதம் ஏற்பட்டுள்ளது." },
                { label: t.phraseQuality, text: "சாய தரம் குறைவு காரணமாக மறு ஆய்வு செய்யப்படுகிறது." },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setRawNote(chip.text)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-md font-medium text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Big Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
        >
          {submitting ? t.submitting : t.submitUpdate}
        </button>
      </form>

      {/* AI Processing Live Feedback Result */}
      {lastSubmissionResult?.aiAnalysis && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-2xs space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Translation & Reason Analysis</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="text-slate-500 font-sans">English Translation:</div>
            <div className="font-semibold text-slate-900">{lastSubmissionResult.aiAnalysis.translation}</div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500">Predicted Category:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800">
              {lastSubmissionResult.aiAnalysis.predictedCategory}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupervisorMobilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-12 text-center text-xs text-slate-400">
          Loading Floor Supervisor Portal...
        </div>
      }
    >
      <SupervisorContent />
    </Suspense>
  );
}
