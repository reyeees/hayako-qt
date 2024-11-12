if (typeof browser === "undefined") {
    var browser = chrome;
}

async function translateText(text, sourceLang, targetLang) {
    // const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&dj=1&q=${encodeURIComponent(text)}`;

    const url = `https://translate.google.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&hl=${targetLang}&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7`; // i think the last one is extra here, lol (&TypeError=)

    let requestOptions = [
      url, {
        method: "POST",
        body: new URLSearchParams({ q: text }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        }
      }
    ]
    const response = await fetch(...requestOptions).catch(e => ({ status: 0, statusText: '' }));

    const resultData = {
      resultText: "",
      // from: {
      //     language: {
      //         didYouMean: false,
      //         iso: ""
      //     },
      //     text: {
      //         autoCorrected: false,
      //         value: "",
      //         didYouMean: false
      //     }
      // },
      isError: false,
      errorMessage: ""
    };

    if (response.status !== 200) {
      resultData.isError = true;
  
      // ibrowser.i18n.getMessage("networkError");
      if (response.status === 0) resultData.errorMessage = "Network Error";
      else if (response.status === 429 || response.status === 503) resultData.errorMessage = "Unavailable Error";
      else resultData.errorMessage = `Unknown Error [${response.status} ${response.statusText}]`;
  
      console.error(response);
      return resultData;
    }

    const result = await response.json();

    // Parse body and add it to the result object.
    result[0].forEach((obj) => {
        if (obj[0]) {
            resultData.resultText += obj[0];
        }
    });

    // if (result[2] === result[8][0][0]) {
    //     resultData.from.language.iso = result[2];
    // }
    // else {
    //     resultData.from.language.didYouMean = true;
    //     resultData.from.language.iso = result[8][0][0];
    // }

    // if (result[7] && result[7][0]) {
    //     let str = result[7][0];

    //     str = str.replace(/<b><i>/g, "[");
    //     str = str.replace(/<\/i><\/b>/g, "]");

    //     resultData.from.text.value = str;

    //     if (result[7][5] === true) {
    //         resultData.from.text.autoCorrected = true;
    //     }
    //     else {
    //         resultData.from.text.didYouMean = true;
    //     }
    // }

    return resultData;
}

async function testText(text, sourceLang, targetLang) {
  return {
    resultText: text,
    isError: false,
    errorMessage: "test error"
  };;
}
  
// Listen for translation requests from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "translate") {
    translateText(message.text, message.sourceLang, message.targetLang).then(translatedText => {
      sendResponse( translatedText );
    });
    // testText(message.text, message.sourceLang, message.targetLang).then(translatedText => {
    //   sendResponse( translatedText );
    // });
    return true; // Indicates async response
  }
});
