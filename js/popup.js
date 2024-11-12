if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener("DOMContentLoaded", async () => {
    const { theme } = await browser.storage.local.get("theme");
    if (theme === 'dark' || theme === undefined) {
        document.body.classList.add("dark-theme");
    }

    const sourceLangDisplay = document.getElementById("source-lang-display");
    const targetLangDisplay = document.getElementById("target-lang-display");
    const bindingHayaku = document.getElementById("summon-bind-hayaku");

    // Load saved values from browser.storage.local
    const savedOptions = await browser.storage.local.get(['sourceLang', 'targetLang', "keyBinding"]);
    
    // Display the saved languages in the popup
    sourceLangDisplay.textContent = savedOptions.sourceLang || "English"; // Default to English
    targetLangDisplay.textContent = savedOptions.targetLang || "Spanish"; // Default to Spanish
    bindingHayaku.textContent = savedOptions.keybinding || "F8" // Default to F8
});
