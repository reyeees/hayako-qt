document.addEventListener("DOMContentLoaded", async () => {
    const sourceLangSelect = document.getElementById("source-lang");
    const targetLangSelect = document.getElementById("target-lang");
    const themeToggle = document.getElementById("theme-toggle");
    const keyBindingInput = document.getElementById("key-binding");
    const messageDiv = document.getElementById("message");

    // Sample languages list (add more as needed)
    const languages = ["Detect language", "English", "Spanish", "Russian", "Slovak", "German", "Japanese"];

    // Populate language dropdowns
    languages.forEach(lang => {
        const sourceOption = document.createElement("option");
        sourceOption.value = lang;
        sourceOption.textContent = lang;
        sourceLangSelect.appendChild(sourceOption);

        const targetOption = document.createElement("option");
        targetOption.value = lang;
        targetOption.textContent = lang;
        targetLangSelect.appendChild(targetOption);
    });

    // Load saved language preferences from storage
    const { sourceLang, targetLang, theme, keyBinding } = await browser.storage.local.get(['sourceLang', 'targetLang', 'theme', 'keyBinding']);
    sourceLangSelect.value = sourceLang || languages[0];
    targetLangSelect.value = targetLang || languages[1];
    if (theme === undefined) {
        themeToggle.checked = true;
        document.body.classList.toggle("dark-theme", true);
    };
    keyBindingInput.value = keyBinding || "Press a key";
    // document.body.classList.toggle("dark-theme", theme === 'dark');

    // Save settings when form is submitted
    document.getElementById("options-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Save selected languages to storage
        await browser.storage.local.set({
            sourceLang: sourceLangSelect.value,
            targetLang: targetLangSelect.value,
            theme: themeToggle.checked ? 'light' : 'dark',
            keyBinding: keyBindingInput.value
        });

        // Show success message
        messageDiv.textContent = "Settings saved successfully!";
        messageDiv.style.color = "green";

        // Hide message after a few seconds
        setTimeout(() => {
            messageDiv.textContent = "";
        }, 3000);
    });
    
    // Capture key for binding
    keyBindingInput.addEventListener("focus", () => {
        keyBindingInput.value = ""; // Clear placeholder
    });

    keyBindingInput.addEventListener("keydown", (e) => {
        e.preventDefault(); // Prevent default input behavior
        const key = e.key.toUpperCase();
        keyBindingInput.value = key;
    });

    // Handle theme toggle
    themeToggle.addEventListener("change", async () => {
        const isDarkMode = themeToggle.checked;
        document.body.classList.toggle("dark-theme", isDarkMode);
        await browser.storage.local.set({ theme: isDarkMode ? 'dark' : 'light' });
    });
});
