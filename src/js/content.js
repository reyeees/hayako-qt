if (typeof browser === "undefined") {
    var browser = chrome;
}

var uppposition = true;

let inputFocused = null;
let dynamicDivMarkers = []; // Man, that sucks
let keyBinding = "F8";
let caretPos = 0;
let textArea;

async function updateKeyBinding() {
  const { keyBinding: newKey } = await browser.storage.local.get("keyBinding");
  keyBinding = newKey || "F8";
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.keyBinding) {
      keyBinding = changes.keyBinding.newValue || "F8";
  }
});

async function getCaret(element) {
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    // return document.getSelection().getRangeAt(0).startOffset;
  }
  return element.selectionStart;
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const liveCaret = debounce(async (event) => {
  caretPos = await getCaret(event.target);
  // if (textArea != null) {
  //   textArea.focus();
  // }
}, 75); // 100ms maximum, 50ns minimum

document.addEventListener("focusin", (event) => {
    if ((event.target.tagName === "INPUT" || 
        event.target.tagName === "TEXTAREA" ||
        event.target.id.includes("input") || 
        event.target.id.includes("prompt") ||
        event.target.id.includes("textarea")) // ||
        // event.target.contentEditable === "true") // Was writing methods for contentEditable divs but not detecting them xD
        && !document.getElementById("translator-popup")) {

      event.target.addEventListener("click", liveCaret);
      event.target.addEventListener("keyup", liveCaret);

      inputFocused = event.target;
      showTranslateButton(event.target);
    }
});

document.addEventListener("focusout", (_) => {
  if (inputFocused != null) {
    inputFocused.removeEventListener('click', liveCaret, {once: true});
    inputFocused.removeEventListener('input', liveCaret, {once: true});
  }
  inputFocused = null;
})

function showTranslateButton(editableElement) {
  // Remove any existing button or popup
  removeTranslateButton();
  removePopup();

  // Create the floating button
  const button = document.createElement("button");
  button.id = "translate-button";

  const iconURL = browser.runtime.getURL("icons/icon48.png")
  button.style.backgroundImage = `url("${iconURL}")`;

  const inputTop = editableElement.getBoundingClientRect().top;
  if ((window.innerHeight - inputTop) < (40 + 40)) {
    button.style.top = `${inputTop + window.scrollY - 40}px`;
  } else {
    button.style.top = `${inputTop + window.scrollY + 40}px`;
  }
  
  // button.style.top = `${editableElement.getBoundingClientRect().top + window.scrollY - 40}px`;
  button.style.left = `${editableElement.getBoundingClientRect().left}px`;
  
  // When clicking the button, show the translation popup
  button.onclick = () => {
    showPopup(editableElement);
    removeTranslateButton();
  };
  
  // Append the button to the document
  document.body.appendChild(button);
}

async function showPopup(inputElement) {
  // Remove any existing popup
  removePopup();

  const inputRect = inputElement.getBoundingClientRect();

  // Create the popup container
  const popup = document.createElement("div");
  popup.id = "translator-popup";

  // Language dropdowns
  const languages = ["Detect language", "English", "Spanish", "Russian", "Slovak", "German", "Japanese"];
  const mlangs = ["auto", "en", "es", "ru", "sk", "de", "ja"];

  // Load saved languages from storage
  const storedValues = await browser.storage.local.get(['sourceLang', 'targetLang']);
  const sourceLangSelect = createDropdown(languages, 
    storedValues.sourceLang || "Detect language",
    "Source Language"
  );
  const targetLangSelect = createDropdown(languages, 
    storedValues.targetLang || "English",
    "Target Language"
  );

  // Swap Button
  const swapButton = document.createElement("button");
  swapButton.id = "swap-button";
  swapButton.textContent = "⇄";
  swapButton.title = "Swap languages";

  // Add event listener to swap languages
  swapButton.addEventListener("click", () => {
    // Apply the animation class to simulate the movement
    
    
    // Swap the values after a short delay to match the animation timing
    sourceLangSelect.classList.add('swap-animation');
    targetLangSelect.classList.add('swap-animation-r');
    setTimeout(() => {
        const temp = sourceLangSelect.value;
        sourceLangSelect.value = targetLangSelect.value;
        targetLangSelect.value = temp;
    }, 125); // Changing values in the middle of the animation
    setTimeout(() => {
      sourceLangSelect.classList.remove('swap-animation');
      targetLangSelect.classList.remove('swap-animation-r');
    }, 250); // Remove the animation class after the animation ends
    
    // const temp = sourceLangSelect.value;
    // sourceLangSelect.value = targetLangSelect.value;
    // targetLangSelect.value = temp;
  });

  // Create a text area for user input
  textArea = document.createElement("textarea");
  textArea.placeholder = "Type text to translate...";

  // Save selected languages to storage
  sourceLangSelect.addEventListener("change", () => {
    browser.storage.local.set({ sourceLang: sourceLangSelect.value });
  });

  targetLangSelect.addEventListener("change", () => {
    browser.storage.local.set({ targetLang: targetLangSelect.value });
  });

  // Debounced function to send a translation request to background.js
  const debouncedTranslate = debounce((text) => {
    const sourceLang = mlangs[languages.indexOf(sourceLangSelect.value)];
    const targetLang = mlangs[languages.indexOf(targetLangSelect.value)];

    // Send message to background script to translate the text
    chrome.runtime.sendMessage(
      { action: "translate", text, sourceLang, targetLang },
      async (response) => {
        let translatedText = (response.isError ? response.errorMessage : response.resultText).trim();
        
        if (inputElement.tagName === "INPUT" || inputElement.tagName === "TEXTAREA") {
          const start = inputElement.selectionStart;
          const end = inputElement.selectionEnd;

          const actualCaretPos = caretPos !== undefined ? caretPos : start;
          const beforeCaret = inputElement.value.slice(0, actualCaretPos);
          const afterCaret = inputElement.value.slice(end);

          inputElement.value = beforeCaret + translatedText + afterCaret;

          const newCaretPosition = actualCaretPos + translatedText.length;
          inputElement.selectionStart = inputElement.selectionEnd = newCaretPosition;
        } else if (inputElement.contentEditable === "true") {
          if (caretPos.cloneRange) {
            const range = caretPos.cloneRange();

            // if (dynamicDivMarker) {
            //   dynamicDivMarker.remove();
            // }

            dynamicDivMarker = document.createElement("span");
            dynamicDivMarker.className = `dynamic-text`;
            dynamicDivMarker.textContent = translatedText;

            range.deleteContents();
            range.insertNode(dynamicDivMarker);

            range.setStartAfter(dynamicDivMarker);
            range.setEndAfter(dynamicDivMarker);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            caretPos = range;
          }
          // inputElement.innerText = original.slice(0, caretPos) + translatedText + original.slice(caretPos);
        }

        // setCaret(inputElement, caretPos + translatedText.length);
        textArea.focus();
      }
    );
  }, 450); // 500ms debounce delay

  // Listen for real-time typing with debounce
  textArea.addEventListener("input", async () => {
    textArea.style.height = "auto";  // Reset height
    textArea.style.height = `${textArea.scrollHeight}px`;  // Set height to scroll height
  
    // Update popup position based on textarea height
    const popupRect = popup.getBoundingClientRect();
    if (uppposition) { // window.innerHeight > popupRect.height
      popup.style.top = `${inputRect.top - popupRect.height}px`;
    }

    let value;
    if (inputElement.tagName === "INPUT" || inputElement.tagName === "TEXTAREA") {
      value = inputElement.value;
    } else if (inputElement.contentEditable === "true") {
      value = inputElement.innerText;
    }

    debouncedTranslate(textArea.value);
  });
  
  // Flex container for dropdowns and swap button
  const languageContainer = document.createElement("div");
  languageContainer.id = "language-container";
  languageContainer.appendChild(sourceLangSelect);
  languageContainer.appendChild(swapButton);
  languageContainer.appendChild(targetLangSelect);

  // Append elements to the popup
  popup.appendChild(languageContainer);
  popup.appendChild(textArea);
  // popup.appendChild(button);

  // Append popup to the body
  document.body.appendChild(popup);

  // Changing the position of the popup // removed window.scrollY bc of position: fixed
  const popupHeight = popup.getBoundingClientRect().height;
  if ((window.innerHeight - inputRect.top) < popupHeight) {
    // Position above cursor if not enough space below
    popup.style.top = `${inputRect.top - popupHeight}px`;
    uppposition = true;
  } else {
    // Position below cursor
    popup.style.top = `${inputRect.top + inputRect.height + 10}px`;
    uppposition = false;
  }
  popup.style.left = `${inputRect.left}px`;
  
  textArea.focus();

  // Prevent immediate close by stopping event propagation
  popup.addEventListener("mousedown", (e) => e.stopPropagation());
}

// Helper function to create dropdowns for language selection
function createDropdown(options, default_value, placeholder) {
  const select = document.createElement("select");

  const placeholderOption = document.createElement("option");
  placeholderOption.id = "context-subcontext"
  placeholderOption.textContent = placeholder;
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  select.appendChild(placeholderOption);

  options.forEach(option => {
    const opt = document.createElement("option");

    opt.value = option;
    opt.textContent = option;
    if (option === default_value) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  return select;
}

function removeTranslateButton() {
  const exBut = document.getElementById("translate-button");
  if (exBut) {
    exBut.remove();
  }
}

// Function to remove the popup
function removePopup() {
  const existingPopup = document.getElementById("translator-popup");
  if (existingPopup) {
    existingPopup.remove();
  }
}

document.addEventListener("keydown", (event) => {
  if (inputFocused != null && event.key.toUpperCase() === keyBinding) {
    event.preventDefault();
    
    const existingPopup = document.getElementById("translator-popup");
    if (existingPopup) {
      existingPopup.remove();
    } else {
      showPopup(inputFocused);
    }
  } else {
    removeTranslateButton();
    
    if (event.key === "Escape" || event.key.toUpperCase() === keyBinding) {
      if (inputFocused != null) {
        inputFocused.focus();
      }
      removePopup();
    }
  }
});

// Close the popup when clicking outside
document.addEventListener("mousedown", (event) => {
  const popup = document.getElementById("translator-popup");
  const tbut = document.getElementById("translate-button");
  if (popup && !popup.contains(event.target)) {
    removePopup();
  }
  if (tbut && !tbut.contains(event.target)) {
    removeTranslateButton();
  }
});
  