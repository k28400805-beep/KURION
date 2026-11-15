
const assistants = {
    jarvis: {
        name: "JARVIS",
        color: "#43baff",
        description: "Size nasıl yardımcı olabilirim efendim?",
        welcome: "Tekrar hoş geldiniz efendim. Sistemler hazır."
    },

    ultron: {
        name: "ULTRON",
        color: "#ff4545",
        description: "İnsanlık yine kendi geleceğini sorgulamıyor.",
        welcome: "Sistem aktif. Umarım bu kez konuşacak ilginç bir şey vardır."
    },

    friday: {
        name: "FRIDAY",
        color: "#ffb52e",
        description: "Hazırım efendim. Nasıl yardımcı olabilirim?",
        welcome: "Merhaba efendim. Bütün sistemler normal."
    }
};

let currentAssistant = "jarvis";

function changeAssistant(type) {
    const assistant = assistants[type];

    if (!assistant) return;

    currentAssistant = type;

    document.getElementById("assistant-name").textContent =
        assistant.name;

    document.getElementById("assistant-name").style.color =
        assistant.color;

    document.getElementById("assistant-description").textContent =
        assistant.welcome;

    document.getElementById("assistant-message").textContent =
        assistant.description;

    document.querySelectorAll(".assistant").forEach(button => {
        button.classList.remove("active");
    });

    document.querySelector("." + type).classList.add("active");

    document.querySelector(".brand span").style.color =
        assistant.color;
    
    document.querySelector(".boot-logo").style.borderColor =
        assistant.color;
}

function updateClock() {
    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit"
        });
}

updateClock();
setInterval(updateClock, 1000);

window.addEventListener("load", () => {
    setTimeout(() => {
        const boot = document.getElementById("boot-screen");

        boot.style.opacity = "0";

        setTimeout(() => {
            boot.style.display = "none";
        }, 1000);

    }, 2200);
});
