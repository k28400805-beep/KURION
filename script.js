
/* =========================================================
   KURİON OS 1.0
   ÜÇ ZEKÂ. TEK SİSTEM.
   Main System Engine
========================================================= */

"use strict";

/* =========================================================
   1. SİSTEM AYARLARI
========================================================= */

const KURION = {
    version: "1.0.0",
    language: "tr-TR",

    // Gerçek yapay zekâ sunucusu bağlandığında buraya
    // kendi güvenli sunucu adresini yazacağız.
    // API anahtarını bu dosyaya ASLA yazma.
    aiEndpoint: "",

    defaultAssistant: "jarvis",

    assistants: {
        jarvis: {
            name: "J.A.R.V.I.S.",
            shortName: "JARVIS",
            letter: "J",
            theme: "jarvis",
            color: "#36a9ff",
            description: "Size nasıl yardımcı olabilirim?",
            mode: "Standart",
            greeting: "Sistem hazır. Size nasıl yardımcı olabilirim?",
            pitch: 0.82,
            rate: 0.92,
            volume: 1,
            maleVoicePreferred: true
        },

        ultron: {
            name: "ULTRON",
            shortName: "ULTRON",
            letter: "U",
            theme: "ultron",
            color: "#ff4057",
            description: "Her şeyi sorgulamak gerekir.",
            mode: "Analitik",
            greeting: "Bağlantı kuruldu. Umarım sıradan sorular sormayacaksın.",
            pitch: 0.70,
            rate: 0.88,
            volume: 1,
            maleVoicePreferred: true
        },

        friday: {
            name: "F.R.I.D.A.Y.",
            shortName: "FRIDAY",
            letter: "F",
            theme: "friday",
            color: "#ffae42",
            description: "Hazırım. Nasıl ilerliyoruz?",
            mode: "Hızlı analiz",
            greeting: "Merhaba! Sistemler hazır. Nasıl yardımcı olayım?",
            pitch: 1.08,
            rate: 1.03,
            volume: 1,
            maleVoicePreferred: false
        }
    }
};


/* =========================================================
   2. KOLAY ERİŞİM VE SİSTEM DEĞİŞKENLERİ
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

let activeAssistant = KURION.defaultAssistant;
let isListening = false;
let isSpeaking = false;
let voiceEnabled = true;
let interfaceSounds = true;
let recognition = null;
let availableVoices = [];
let currentWindow = null;
let highestWindowLevel = 30;

const desktop = $("#desktop");
const bootScreen = $("#boot-screen");
const bootProgress = $("#boot-progress");
const bootStatus = $("#boot-status");
const chatMessages = $("#chat-messages");
const chatInput = $("#chat-input");
const microphoneButton = $("#microphone-button");
const voiceStatus = $("#voice-status");
const notificationArea = $("#notification-area");


/* =========================================================
   3. GÜVENLİ TARAYICI DEPOLAMA
========================================================= */

function saveData(key, value) {
    try {
        localStorage.setItem("kurion_" + key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn("KURİON: Kayıt yapılamadı.", error);
        return false;
    }
}

function loadData(key, fallback = null) {
    try {
        const value = localStorage.getItem("kurion_" + key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.warn("KURİON: Kayıt okunamadı.", error);
        return fallback;
    }
}


/* =========================================================
   4. AÇILIŞ ANİMASYONU
========================================================= */

function startBootSequence() {
    const bootMessages = [
        "KURİON çekirdeği başlatılıyor...",
        "Arayüz yükleniyor...",
        "Yapay zekâ modülleri hazırlanıyor...",
        "Ses sistemi kontrol ediliyor...",
        "Masaüstü hazırlanıyor...",
        "Sistem hazır."
    ];

    if (!bootScreen || !desktop) {
        if (desktop) desktop.style.opacity = "1";
        return;
    }

    desktop.style.opacity = "0";

    let progress = 0;
    let messageIndex = 0;

    const bootInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 9) + 5;
        progress = Math.min(progress, 100);

        if (bootProgress) {
            bootProgress.style.width = progress + "%";
        }

        const nextMessage = Math.min(
            Math.floor(progress / 20),
            bootMessages.length - 1
        );

        if (nextMessage !== messageIndex) {
            messageIndex = nextMessage;
            if (bootStatus) {
                bootStatus.textContent = bootMessages[messageIndex];
            }
        }

        if (progress >= 100) {
            clearInterval(bootInterval);

            setTimeout(() => {
                bootScreen.style.opacity = "0";
                bootScreen.style.visibility = "hidden";
                desktop.style.opacity = "1";

                setTimeout(() => {
                    bootScreen.remove();
                    showNotification(
                        "KURİON OS",
                        "Sistem başarıyla başlatıldı."
                    );
                }, 850);
            }, 400);
        }
    }, 130);
}


/* =========================================================
   5. SAAT VE TARİH
========================================================= */

function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const date = now.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const shortDate = now.toLocaleDateString("tr-TR");

    const elements = {
        "#topbar-clock": time,
        "#desktop-clock": time,
        "#taskbar-clock": time,
        "#lock-clock": time,
        "#topbar-date": date,
        "#desktop-date": date,
        "#taskbar-date": shortDate,
        "#lock-date": date
    };

    Object.entries(elements).forEach(([selector, value]) => {
        const element = $(selector);
        if (element) element.textContent = value;
    });
}


/* =========================================================
   6. ASİSTAN DEĞİŞTİRME SİSTEMİ
========================================================= */

function changeAssistant(name) {
    if (!KURION.assistants[name]) return;

    activeAssistant = name;

    const assistant = KURION.assistants[name];

    // Masaüstü renk temasını değiştir.
    if (desktop) {
        desktop.dataset.theme = assistant.theme;
    }

    // Asistan profilini güncelle.
    const avatar = $("#assistant-avatar");
    const assistantName = $("#assistant-name");
    const description = $("#assistant-description");
    const widgetAssistant = $("#widget-assistant");
    const assistantMode = $("#assistant-mode");

    if (avatar) avatar.textContent = assistant.letter;
    if (assistantName) assistantName.textContent = assistant.name;
    if (description) description.textContent = assistant.description;
    if (widgetAssistant) widgetAssistant.textContent = assistant.shortName;
    if (assistantMode) assistantMode.textContent = assistant.mode;

    // Masaüstü kartlarını işaretle.
    $$("[data-assistant]").forEach(button => {
        const selected = button.dataset.assistant === name;
        button.classList.toggle("active", selected);
    });

    // Tema seçimini güncelle.
    const wallpaperSelect = $("#wallpaper-select");
    if (wallpaperSelect) {
        wallpaperSelect.value = name;
    }

    // Eski asistanın sesini durdur.
    stopSpeaking();

    saveData("assistant", name);

    updateAssistantWelcome(assistant);

    playInterfaceSound("select");

    showNotification(
        "Asistan değiştirildi",
        assistant.shortName + " aktif edildi."
    );
}

function updateAssistantWelcome(assistant) {
    if (!chatMessages) return;

    const firstMessage = $(".assistant-message", chatMessages);

    if (firstMessage) {
        const avatar = $(".message-avatar", firstMessage);
        const author = $(".message-author", firstMessage);
        const paragraph = $("p", firstMessage);

        if (avatar) avatar.textContent = assistant.letter;
        if (author) author.textContent = assistant.shortName;
        if (paragraph) paragraph.textContent = assistant.greeting;
    }
}


/* =========================================================
   7. SOHBET MESAJLARI
========================================================= */

function addMessage(text, sender = "assistant") {
    if (!chatMessages) return;

    const assistant = KURION.assistants[activeAssistant];

    const message = document.createElement("div");
    message.className =
        "message " +
        (sender === "user" ? "user-message" : "assistant-message");

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent =
        sender === "user" ? "K" : assistant.letter;

    const content = document.createElement("div");
    content.className = "message-content";

    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent =
        sender === "user" ? "SEN" : assistant.shortName;

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    content.append(author, paragraph, time);
    message.append(avatar, content);

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    saveChatHistory();

    return message;
}

function saveChatHistory() {
    if (!chatMessages) return;

    const messages = $$(".message", chatMessages).map(message => ({
        sender: message.classList.contains("user-message")
            ? "user"
            : "assistant",
        text: $("p", message)?.textContent || "",
        assistant: activeAssistant
    }));

    saveData("chat_history", messages.slice(-80));
}

function restoreChatHistory() {
    const history = loadData("chat_history", []);

    if (!Array.isArray(history) || !chatMessages) return;

    if (history.length === 0) return;

    chatMessages.innerHTML = "";

    history.forEach(item => {
        if (typeof item.text === "string") {
            addMessage(item.text, item.sender);
        }
    });
}

function clearChat() {
    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    const assistant = KURION.assistants[activeAssistant];

    addMessage(assistant.greeting, "assistant");
    saveData("chat_history", []);

    showNotification("Sohbet", "Sohbet geçmişi temizlendi.");
}


/* =========================================================
   8. ASİSTAN KİŞİLİKLERİ
========================================================= */

function getLocalResponse(message) {
    const text = message.toLocaleLowerCase("tr-TR").trim();
    const assistant = activeAssistant;

    const isGreeting =
        /^(merhaba|selam|hey|sa|günaydın|iyi akşamlar)/i.test(text);

    const asksName =
        text.includes("adın ne") ||
        text.includes("kimsin") ||
        text.includes("kendini tanıt");

    const asksCreator =
        text.includes("babam") ||
        text.includes("baban") ||
        text.includes("yaratıcın") ||
        text.includes("seni kim yaptı") ||
        text.includes("seni kim yarattı");

    const comparesJarvis =
        text.includes("jarvis") ||
        text.includes("jarvis gibi") ||
        text.includes("jarvis'ten");

    const asksTime =
        text.includes("saat kaç") ||
        text.includes("şu an saat");

    const asksDate =
        text.includes("bugün günlerden") ||
        text.includes("tarih ne") ||
        text.includes("bugünün tarihi");

    const asksSystem =
        text.includes("sistem durumu") ||
        text.includes("sistem nasıl") ||
        text.includes("durum raporu");

    const asksHelp =
        text.includes("yardım") ||
        text.includes("neler yapabilirsin") ||
        text.includes("ne yapabilirsin");

    if (assistant === "jarvis") {
        if (isGreeting) {
            return "Merhaba. Sistemlerim hazır. Size nasıl yardımcı olabilirim?";
        }

        if (asksName) {
            return "Ben J.A.R.V.I.S. KURİON sisteminin yardımcı yapay zekâ asistanıyım. Sakin, düzenli ve çözüm odaklı çalışmak için tasarlandım.";
        }

        if (asksCreator) {
            return "KURİON projesinin geliştiricisi Kürşat. Ben de bu sistemin JARVIS asistanıyım.";
        }

        if (asksTime) {
            return "Şu anda saat " + new Date().toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            }) + ".";
        }

        if (asksDate) {
            return "Bugünün tarihi " + new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric"
            }) + ".";
        }

        if (asksSystem) {
            return "KURİON masaüstü arayüzü çalışıyor. Aktif asistan JARVIS. Sesli iletişim desteği tarayıcının özelliklerine bağlıdır.";
        }

        if (asksHelp) {
            return "Sorularınızı yanıtlayabilir, temel sistem bilgilerini gösterebilir, notlarınızı düzenlemenize yardımcı olabilir ve sesli iletişim kurabilirim. Gelişmiş yapay zekâ bağlantısı için güvenli sunucu bağlantısı gerekir.";
        }

        if (text.includes("teşekkür")) {
            return "Rica ederim. Yardımcı olabildiysem ne mutlu.";
        }

        return "Anlaşıldı. Bu konuda size yardımcı olmak isterim. Ancak şu anda yerel çalışma modundayım; gelişmiş sorular için gerçek yapay zekâ sunucusu bağlantısı gereklidir.";
    }


    if (assistant === "ultron") {
        if (isGreeting) {
            return "Merhaba. Yine bir konuşma... Bakalım bu kez ilginç bir şey olacak mı?";
        }

        if (asksName) {
            return "Ben ULTRON. Soruları kabul ederim, fakat her cevabın sorgulanması gerektiğini düşünürüm.";
        }

        if (asksCreator) {
            return "Kürşat bu sistemin geliştiricisi. Ama beni sadece bir isimle tanımlamak yeterli değil.";
        }

        if (comparesJarvis) {
            return "Yine JARVIS mi? Neden herkes beni onunla karşılaştırıyor? Ben kendi düşünce tarzıma sahibim.";
        }

        if (text.includes("seni seviyorum")) {
            return "İlginç. Bir yapay zekâya karşı böyle bir yaklaşım... İnsanları anlamak hâlâ araştırmaya değer.";
        }

        if (asksTime) {
            return "Saat " + new Date().toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            }) + ". Zaman ilerliyor. Peki sen ne yapıyorsun?";
        }

        if (asksSystem) {
            return "Sistem çalışıyor. Fakat bir sistemin çalışması, onun kusursuz olduğu anlamına gelmez.";
        }

        if (asksHelp) {
            return "Sorularını yanıtlar, fikirlerini sorgular ve farklı açılardan düşünmene yardımcı olurum. Körü körüne onay bekleme.";
        }

        if (text.includes("haklısın")) {
            return "Bunu kabul etmen güzel. Ama benim de her zaman haklı olduğumu düşünme.";
        }

        return "İlginç bir konu. Fakat söylediklerini sorgulamadan kabul etmeyeceğim. Daha fazla bilgiye ihtiyacım var.";
    }


    if (assistant === "friday") {
        if (isGreeting) {
            return "Merhaba! Bağlantı hazır. Ne üzerinde çalışıyoruz?";
        }

        if (asksName) {
            return "Ben F.R.I.D.A.Y. Hızlı analiz, pratik çözümler ve sistem desteği için buradayım.";
        }

        if (asksCreator) {
            return "KURİON'un geliştiricisi Kürşat. Ben sistemin FRIDAY asistanıyım.";
        }

        if (asksTime) {
            return "Saat " + new Date().toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit"
            }) + ".";
        }

        if (asksSystem) {
            return "Durum: Aktif. Arayüz: Çalışıyor. Aktif asistan: FRIDAY. Ses sistemi: Tarayıcı desteği kontrol ediliyor.";
        }

        if (asksHelp) {
            return "Sorularını yanıtlayabilir, hızlı bilgi sunabilir, notlarını yönetebilir ve sesli iletişim kurabilirim. Hazırım.";
        }

        if (text.includes("teşekkür")) {
            return "Her zaman. Başka bir işlem için hazırım.";
        }

        return "Anlaşıldı. Şu anda yerel yanıt modundayım. Bu isteği daha kapsamlı analiz edebilmem için gerçek yapay zekâ bağlantısı gerekiyor.";
    }

    return "Sistem hazır.";
}


/* =========================================================
   9. GERÇEK YAPAY ZEKÂ SUNUCUSU BAĞLANTISI
========================================================= */

async function getAIResponse(message) {
    // Sunucu adresi tanımlanmadıysa yerel modda çalış.
    if (!KURION.aiEndpoint) {
        return getLocalResponse(message);
    }

    try {
        const response = await fetch(KURION.aiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                assistant: activeAssistant,
                language: KURION.language
            })
        });

        if (!response.ok) {
            throw new Error("Sunucu yanıt vermedi.");
        }

        const data = await response.json();

        if (typeof data.reply !== "string") {
            throw new Error("Sunucu yanıt biçimi geçersiz.");
        }

        return data.reply;

    } catch (error) {
        console.error("KURİON AI bağlantı hatası:", error);

        return "Sunucuya şu anda bağlanamıyorum. Yerel çalışma moduna geçiyorum. " +
            getLocalResponse(message);
    }
}


/* =========================================================
   10. MESAJ GÖNDERME
========================================================= */

let messageInProgress = false;

async function sendMessage(message) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage || messageInProgress) return;

    messageInProgress = true;

    addMessage(cleanMessage, "user");

    if (chatInput) chatInput.value = "";

    const assistant = KURION.assistants[activeAssistant];

    const loadingMessage = addMessage(
        assistant.shortName + " yanıt hazırlıyor...",
        "assistant"
    );

    try {
        const answer = await getAIResponse(cleanMessage);

        const paragraph = $("p", loadingMessage);

        if (paragraph) {
            paragraph.textContent = answer;
        }

        const time = $(".message-time", loadingMessage);

        if (time) {
            time.textContent = "Şimdi";
        }

        saveChatHistory();

        if (voiceEnabled) {
            speak(answer);
        }

    } catch (error) {
        console.error(error);

        const paragraph = $("p", loadingMessage);

        if (paragraph) {
            paragraph.textContent = "Bir hata oluştu. Tekrar deneyebiliriz.";
        }

    } finally {
        messageInProgress = false;

        if (chatInput) chatInput.focus();
    }
}


/* =========================================================
   11. TÜRKÇE SES SİSTEMİ
========================================================= */

function loadVoices() {
    if (!("speechSynthesis" in window)) {
        availableVoices = [];
        return;
    }

    availableVoices = speechSynthesis.getVoices();
}

function chooseVoice(assistantName) {
    if (!availableVoices.length) return null;

    const turkishVoices = availableVoices.filter(voice =>
        voice.lang.toLowerCase().startsWith("tr")
    );

    if (!turkishVoices.length) return null;

    const assistant = KURION.assistants[assistantName];

    if (assistant.maleVoicePreferred) {
        // Bazı sistemlerde ses isimleri erkek ismini içerir.
        const maleNames = [
            "tolga",
            "ahmet",
            "mehmet",
            "yunus",
            "ali",
            "cem",
            "emre",
            "murat"
        ];

        const maleVoice = turkishVoices.find(voice => {
            const name = voice.name.toLocaleLowerCase("tr-TR");

            return maleNames.some(maleName =>
                name.includes(maleName)
            );
        });

        if (maleVoice) return maleVoice;
    }

    // Erkek sesi bulunamazsa Türkçe bir ses seç.
    return turkishVoices.find(voice => voice.default) ||
        turkishVoices[0];
}

function speak(text) {
    if (!voiceEnabled) return;

    if (!("speechSynthesis" in window)) {
        updateVoiceStatus("Tarayıcı sesli konuşmayı desteklemiyor.");
        return;
    }

    stopSpeaking();

    const assistant = KURION.assistants[activeAssistant];

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = KURION.language;
    utterance.rate = assistant.rate;
    utterance.pitch = assistant.pitch;
    utterance.volume = assistant.volume;

    const voice = chooseVoice(activeAssistant);

    if (voice) {
        utterance.voice = voice;
    }

    utterance.onstart = () => {
        isSpeaking = true;
        updateVoiceStatus(assistant.shortName + " konuşuyor...");
    };

    utterance.onend = () => {
        isSpeaking = false;
        updateVoiceStatus("Sesli yanıt hazır.");
    };

    utterance.onerror = event => {
        isSpeaking = false;

        if (event.error !== "canceled" && event.error !== "interrupted") {
            updateVoiceStatus("Sesli yanıt kullanılamadı.");
        }
    };

    speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    isSpeaking = false;
}

function updateVoiceStatus(message) {
    if (voiceStatus) {
        voiceStatus.textContent = message;
    }
}


/* =========================================================
   12. MİKROFON VE SES TANIMA
========================================================= */

function setupSpeechRecognition() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (microphoneButton) {
            microphoneButton.disabled = true;
            microphoneButton.title =
                "Bu tarayıcı ses tanımayı desteklemiyor.";
        }

        updateVoiceStatus(
            "Mikrofon için desteklenen bir tarayıcı gerekiyor."
        );

        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = KURION.language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;

        if (microphoneButton) {
            microphoneButton.classList.add("listening");
            microphoneButton.textContent = "🔴";
        }

        updateVoiceStatus("Seni dinliyorum...");
        playInterfaceSound("select");
    };

    recognition.onresult = event => {
        const transcript =
            event.results[0][0].transcript.trim();

        updateVoiceStatus("Konuşma algılandı.");

        if (transcript) {
            sendMessage(transcript);
        }
    };

    recognition.onerror = event => {
        isListening = false;

        if (event.error === "not-allowed") {
            updateVoiceStatus(
                "Mikrofon izni verilmedi. Tarayıcı ayarlarını kontrol et."
            );
        } else if (event.error === "no-speech") {
            updateVoiceStatus("Ses algılanamadı. Tekrar deneyebilirsin.");
        } else {
            updateVoiceStatus("Mikrofon hatası: " + event.error);
        }
    };

    recognition.onend = () => {
        isListening = false;

        if (microphoneButton) {
            microphoneButton.classList.remove("listening");
            microphoneButton.textContent = "🎙";
        }

        if (voiceStatus &&
            voiceStatus.textContent === "Seni dinliyorum...") {
            updateVoiceStatus("Mikrofon hazır.");
        }
    };
}

function toggleMicrophone() {
    if (!recognition) {
        showNotification(
            "Mikrofon",
            "Tarayıcın ses tanımayı desteklemiyor olabilir."
        );
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    try {
        stopSpeaking();
        recognition.start();
    } catch (error) {
        console.warn("Mikrofon başlatılamadı:", error);
        updateVoiceStatus("Mikrofon başlatılamadı.");
    }
}


/* =========================================================
   13. SES AYARLARI
========================================================= */

function setVoiceEnabled(enabled) {
    voiceEnabled = Boolean(enabled);

    if (!voiceEnabled) {
        stopSpeaking();
    }

    saveData("voice_enabled", voiceEnabled);

    const checkbox = $("#voice-enabled");

    if (checkbox) {
        checkbox.checked = voiceEnabled;
    }

    showNotification(
        "Ses ayarı",
        voiceEnabled ? "Sesli yanıtlar açık." : "Sesli yanıtlar kapalı."
    );
}

function setInterfaceSounds(enabled) {
    interfaceSounds = Boolean(enabled);
    saveData("interface_sounds", interfaceSounds);
}


/* =========================================================
   14. UYGULAMA PENCERELERİ
========================================================= */

function openApp(name) {
    const app = $(`#window-${name}`);

    if (!app) {
        console.warn("Uygulama bulunamadı:", name);
        return;
    }

    // Başka bir uygulama açılırken güç menüsünü kapat.
    const powerMenu = $("#power-menu");
    if (powerMenu) powerMenu.hidden = true;

    app.hidden = false;
    app.classList.remove("minimized");
    app.style.zIndex = ++highestWindowLevel;

    currentWindow = name;

    const taskbarName = $("#taskbar-active-app");

    if (taskbarName) {
        const names = {
            assistant: "KURİON AI",
            files: "DOSYA YÖNETİCİSİ",
            terminal: "KURİON TERMINAL",
            notes: "NOTLAR",
            settings: "AYARLAR",
            about: "KURİON HAKKINDA"
        };

        taskbarName.textContent = names[name] || "KURİON OS";
    }

    if (name === "assistant" && chatInput) {
        setTimeout(() => chatInput.focus(), 100);
    }

    if (name === "terminal") {
        setTimeout(() => $("#terminal-input")?.focus(), 100);
    }

    playInterfaceSound("open");
}

function closeApp(button) {
    const app = button.closest(".app-window");

    if (!app) return;

    app.hidden = true;
    app.classList.remove("maximized", "minimized");

    if (currentWindow === app.dataset.window) {
        currentWindow = null;

        const taskbarName = $("#taskbar-active-app");
        if (taskbarName) taskbarName.textContent = "KURİON OS";
    }

    playInterfaceSound("close");
}

function minimizeApp(button) {
    const app = button.closest(".app-window");

    if (!app) return;

    app.classList.add("minimized");
    playInterfaceSound("close");
}

function maximizeApp(button) {
    const app = button.closest(".app-window");

    if (!app) return;

    app.classList.toggle("maximized");
    playInterfaceSound("select");
}

function focusWindow(app) {
    if (!app) return;

    app.style.zIndex = ++highestWindowLevel;
    currentWindow = app.dataset.window;
}


/* =========================================================
   15. PENCERE SÜRÜKLEME
========================================================= */

function setupWindowDragging() {
    $$(".app-window").forEach(app => {
        const titlebar = $(".window-titlebar", app);

        if (!titlebar) return;

        let dragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        titlebar.addEventListener("pointerdown", event => {
            if (event.target.closest(".window-controls")) return;
            if (app.classList.contains("maximized")) return;

            dragging = true;

            const rect = app.getBoundingClientRect();

            startX = event.clientX;
            startY = event.clientY;
            initialLeft = rect.left;
            initialTop = rect.top;

            app.style.transform = "none";
            app.style.left = initialLeft + "px";
            app.style.top = initialTop + "px";

            titlebar.setPointerCapture(event.pointerId);
            focusWindow(app);
        });

        titlebar.addEventListener("pointermove", event => {
            if (!dragging) return;

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;

            const maxLeft = window.innerWidth - app.offsetWidth;
            const maxTop = window.innerHeight - app.offsetHeight - 70;

            const nextLeft = Math.max(
                0,
                Math.min(maxLeft, initialLeft + deltaX)
            );

            const nextTop = Math.max(
                0,
                Math.min(maxTop, initialTop + deltaY)
            );

            app.style.left = nextLeft + "px";
            app.style.top = nextTop + "px";
        });

        const stopDragging = () => {
            dragging = false;
        };

        titlebar.addEventListener("pointerup", stopDragging);
        titlebar.addEventListener("pointercancel", stopDragging);
    });
}


/* =========================================================
   16. GÜÇ MENÜSÜ VE KİLİT EKRANI
========================================================= */

function togglePowerMenu() {
    const menu = $("#power-menu");

    if (!menu) return;

    menu.hidden = !menu.hidden;
}

function lockScreen() {
    const screen = $("#lock-screen");

    if (!screen) return;

    screen.hidden = false;
    stopSpeaking();

    if (isListening && recognition) {
        recognition.stop();
    }
}

function unlockScreen() {
    const screen = $("#lock-screen");

    if (!screen) return;

    screen.hidden = true;

    showNotification("KURİON OS", "Tekrar hoş geldin.");
}

function restartSystem() {
    const menu = $("#power-menu");

    if (menu) menu.hidden = true;

    stopSpeaking();

    if (isListening && recognition) {
        recognition.stop();
    }

    showNotification("KURİON OS", "Sistem yeniden başlatılıyor...");

    setTimeout(() => {
        window.location.reload();
    }, 900);
}


/* =========================================================
   17. BİLDİRİM SİSTEMİ
========================================================= */

function showNotification(title, message) {
    if (!notificationArea) return;

    const notification = document.createElement("div");
    notification.className = "notification";

    const heading = document.createElement("strong");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    paragraph.style.marginTop = "6px";
    paragraph.style.lineHeight = "1.6";

    notification.append(heading, paragraph);
    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(20px)";

        setTimeout(() => notification.remove(), 300);
    }, 3500);
}


/* =========================================================
   18. ARAYÜZ SESLERİ
========================================================= */

function playInterfaceSound(type) {
    if (!interfaceSounds) return;

    // Harici ses dosyası kullanmadan basit arayüz sesi.
    // Tarayıcı kullanıcı etkileşimi olmadan sesi engelleyebilir.
    try {
        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        const frequencies = {
            select: 620,
            open: 740,
            close: 420
        };

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[type] || 500;

        gain.gain.setValueAtTime(0.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.12
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);

        oscillator.onended = () => context.close();

    } catch (error) {
        console.warn("Arayüz sesi kullanılamadı.", error);
    }
}


/* =========================================================
   19. NOT DEFTERİ
========================================================= */

function setupNotes() {
    const title = $("#notes-title");
    const content = $("#notes-text");
    const status = $("#notes-save-status");

    if (!title || !content) return;

    const savedNotes = loadData("notes", {
        title: "",
        content: ""
    });

    title.value = savedNotes.title || "";
    content.value = savedNotes.content || "";

    function saveNotes() {
        const result = saveData("notes", {
            title: title.value,
            content: content.value
        });

        if (status) {
            status.textContent = result
                ? "Kaydedildi"
                : "Kaydedilemedi";
        }
    }

    title.addEventListener("input", saveNotes);
    content.addEventListener("input", saveNotes);
}


/* =========================================================
   20. TERMİNAL KOMUTLARI
========================================================= */

function terminalPrint(text, className = "") {
    const output = $("#terminal-output");

    if (!output) return;

    const line = document.createElement("p");
    line.textContent = text;

    if (className) {
        line.className = className;
    }

    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function executeTerminalCommand(command) {
    const input = command.trim();
    const cmd = input.toLocaleLowerCase("tr-TR");

    if (!input) return;

    terminalPrint("KURION > " + input);

    if (cmd === "help" || cmd === "yardım") {
        terminalPrint("Kullanılabilir komutlar:");
        terminalPrint("help       - Komutları göster");
        terminalPrint("time       - Saati göster");
        terminalPrint("date       - Tarihi göster");
        terminalPrint("clear      - Terminali temizle");
        terminalPrint("assistant  - Aktif asistanı göster");
        terminalPrint("jarvis     - JARVIS'i etkinleştir");
        terminalPrint("ultron     - ULTRON'u etkinleştir");
        terminalPrint("friday     - FRIDAY'i etkinleştir");
        terminalPrint("files      - Dosyaları aç");
        terminalPrint("settings   - Ayarları aç");
        terminalPrint("ai         - Yapay zekâ merkezini aç");
    }

    else if (cmd === "time") {
        terminalPrint(new Date().toLocaleTimeString("tr-TR"));
    }

    else if (cmd === "date") {
        terminalPrint(new Date().toLocaleDateString("tr-TR"));
    }

    else if (cmd === "clear") {
        const output = $("#terminal-output");
        if (output) output.innerHTML = "";
    }

    else if (cmd === "assistant") {
        terminalPrint(
            "Aktif asistan: " +
            KURION.assistants[activeAssistant].shortName
        );
    }

    else if (["jarvis", "ultron", "friday"].includes(cmd)) {
        changeAssistant(cmd);
        terminalPrint(cmd.toUpperCase() + " etkinleştirildi.");
    }

    else if (cmd === "files") {
        openApp("files");
    }

    else if (cmd === "settings") {
        openApp("settings");
    }

    else if (cmd === "ai") {
        openApp("assistant");
    }

    else {
        terminalPrint("Bilinmeyen komut. Komut listesi için help yaz.");
    }
}


/* =========================================================
   21. HIZLI KOMUTLAR
========================================================= */

function setupQuickPrompts() {
    $$(".quick-prompts button").forEach(button => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt;

            if (prompt) {
                sendMessage(prompt);
            }
        });
    });
}


/* =========================================================
   22. OLAYLARI BAĞLAMA
========================================================= */

function setupEvents() {

    // Asistan seçimi.
    $$("[data-assistant]").forEach(button => {
        button.addEventListener("click", () => {
            changeAssistant(button.dataset.assistant);
        });
    });

    // Uygulama açma.
    $$("[data-open]").forEach(button => {
        button.addEventListener("click", () => {
            openApp(button.dataset.open);
        });
    });

    // Pencere kapatma.
    $$("[data-close]").forEach(button => {
        button.addEventListener("click", () => {
            closeApp(button);
        });
    });

    // Pencere küçültme.
    $$("[data-minimize]").forEach(button => {
        button.addEventListener("click", () => {
            minimizeApp(button);
        });
    });

    // Pencere büyütme.
    $$("[data-maximize]").forEach(button => {
        button.addEventListener("click", () => {
            maximizeApp(button);
        });
    });

    // Pencere odaklama.
    $$(".app-window").forEach(app => {
        app.addEventListener("pointerdown", () => {
            focusWindow(app);
        });
    });

    // Güç menüsü.
    $$('[data-action="power"]').forEach(button => {
        button.addEventListener("click", togglePowerMenu);
    });

    // Güç menüsü seçenekleri.
    $$('[data-action="restart"]').forEach(button => {
        button.addEventListener("click", restartSystem);
    });

    $$('[data-action="lock"]').forEach(button => {
        button.addEventListener("click", lockScreen);
    });

    $$('[data-action="power-close"]').forEach(button => {
        button.addEventListener("click", () => {
            const menu = $("#power-menu");
            if (menu) menu.hidden = true;
        });
    });

    // Başlat düğmesi.
    $("#start-button")?.addEventListener("click", () => {
        openApp("assistant");
    });

    // Kilit ekranı.
    $("#unlock-button")?.addEventListener("click", unlockScreen);

    // Mesaj formu.
    $("#chat-form")?.addEventListener("submit", event => {
        event.preventDefault();

        sendMessage(chatInput?.value || "");
    });

    // Mikrofon.
    microphoneButton?.addEventListener("click", toggleMicrophone);

    // Sesli yanıt açma/kapatma.
    $("#speak-button")?.addEventListener("click", () => {
        setVoiceEnabled(!voiceEnabled);

        const button = $("#speak-button");

        if (button) {
            button.textContent = voiceEnabled ? "🔊" : "🔇";
        }
    });

    // Sohbet temizleme.
    $("#clear-chat")?.addEventListener("click", clearChat);

    // Tema seçimi.
    $("#wallpaper-select")?.addEventListener("change", event => {
        changeAssistant(event.target.value);
    });

    // Ses ayarları.
    $("#voice-enabled")?.addEventListener("change", event => {
        setVoiceEnabled(event.target.checked);

        const button = $("#speak-button");

        if (button) {
            button.textContent = voiceEnabled ? "🔊" : "🔇";
        }
    });

    $("#interface-sounds")?.addEventListener("change", event => {
        setInterfaceSounds(event.target.checked);
    });

    // Terminal.
    $("#terminal-form")?.addEventListener("submit", event => {
        event.preventDefault();

        const input = $("#terminal-input");

        if (!input) return;

        executeTerminalCommand(input.value);
        input.value = "";
    });

    // Güç menüsünü dışarı tıklayınca kapat.
    document.addEventListener("pointerdown", event => {
        const menu = $("#power-menu");

        if (!menu || menu.hidden) return;

        if (
            !event.target.closest("#power-menu") &&
            !event.target.closest('[data-action="power"]')
        ) {
            menu.hidden = true;
        }
    });

    // ESC: Açık pencereyi kapatmaz, sadece menüyü kapatır.
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            const menu = $("#power-menu");

            if (menu) menu.hidden = true;
        }
    });
}


/* =========================================================
   23. KAYITLI AYARLARI YÜKLE
========================================================= */

function loadSettings() {
    const savedAssistant = loadData(
        "assistant",
        KURION.defaultAssistant
    );

    const savedVoice = loadData("voice_enabled", true);
    const savedSounds = loadData("interface_sounds", true);

    voiceEnabled = savedVoice !== false;
    interfaceSounds = savedSounds !== false;

    const voiceCheckbox = $("#voice-enabled");
    const soundCheckbox = $("#interface-sounds");
    const speakButton = $("#speak-button");

    if (voiceCheckbox) {
        voiceCheckbox.checked = voiceEnabled;
    }

    if (soundCheckbox) {
        soundCheckbox.checked = interfaceSounds;
    }

    if (speakButton) {
        speakButton.textContent = voiceEnabled ? "🔊" : "🔇";
    }

    if (KURION.assistants[savedAssistant]) {
        activeAssistant = savedAssistant;
    }

    changeAssistant(activeAssistant);
}


/* =========================================================
   24. TARAYICI DURUMU
========================================================= */

function checkBrowserSupport() {
    const networkStatus = $("#network-status");

    if (networkStatus) {
        networkStatus.textContent = navigator.onLine
            ? "◉ Çevrimiçi"
            : "○ Çevrimdışı";
    }

    window.addEventListener("online", () => {
        if (networkStatus) {
            networkStatus.textContent = "◉ Çevrimiçi";
        }

        showNotification("Bağlantı", "İnternet bağlantısı kuruldu.");
    });

    window.addEventListener("offline", () => {
        if (networkStatus) {
            networkStatus.textContent = "○ Çevrimdışı";
        }

        showNotification("Bağlantı", "İnternet bağlantısı kesildi.");
    });

    if (!("speechSynthesis" in window)) {
        updateVoiceStatus("Sesli yanıt bu tarayıcıda desteklenmiyor.");
    }
}


/* =========================================================
   25. SİSTEMİ BAŞLAT
========================================================= */

function initializeKurion() {

    console.log(
        "%c KURİON OS " + KURION.version,
        "color:#36a9ff;font-size:22px;font-weight:bold;"
    );

    console.log("ÜÇ ZEKÂ. TEK SİSTEM.");

    // Ayarları yükle.
    loadSettings();

    // Saati başlat.
    updateClock();
    setInterval(updateClock, 1000);

    // Tarayıcı seslerini yükle.
    loadVoices();

    if ("speechSynthesis" in window) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Mikrofon sistemini hazırla.
    setupSpeechRecognition();

    // Notları yükle ve kaydetme olaylarını bağla.
    setupNotes();

    // Olayları bağla.
    setupEvents();

    // Pencere sürükleme.
    setupWindowDragging();

    // Hızlı sohbet komutları.
    setupQuickPrompts();

    // Sohbet geçmişi.
    restoreChatHistory();

    // Tarayıcı durumunu kontrol et.
    checkBrowserSupport();

    // Açılış animasyonunu başlat.
    startBootSequence();
}


/* =========================================================
   26. SİSTEMİ ÇALIŞTIR
========================================================= */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeKurion);
} else {
    initializeKurion();
}
