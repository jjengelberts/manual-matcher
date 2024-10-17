// Things to do first
let rawData;

// Check if first run of manual matcher
let dbName = "manual_matcher";
let isExisting = (await window.indexedDB.databases()).map(db => db.name).includes(dbName);
if (!isExisting) {
  initManualMatcher();
} else {
  startQuestion();
}

document.getElementById('buttonNext').onclick = function() {
  // The Next button call the changeQuestion() function with a delta of 1
  changeQuestion(1);
}

document.getElementById('buttonPrevious').onclick = function() {
  // The Previous button call the changeQuestion() function with a delta of -1
  changeQuestion(-1);
}

document.getElementById('import').onclick = function() {
  // Button to load JSON file - stores data in variable rawData and calls insertData()
  let input = document.createElement("input");
  input.type = "file";
  input.setAttribute("multiple", true);
  input.setAttribute("accept", "*.json");
  input.onchange = function (event) {
    // Read JSON into localStorage
    this.files[0].text().then(function(text) { 
      try {
        rawData = JSON.parse(text);
        insertData(rawData);
      } catch (e) {
        alert("Invalid file, please upload a valid JSON file")
      }
    })
  };
  input.click();
};

document.getElementById('export').onclick = function() {
  // Obtain date and time
  let downloadTimeStamp = updateTimeStamp("lastDownload");
  let lastChangeTimeStamp = document.getElementById("browserTimestamp").innerHTML;
  
  const projectName = document.getElementById("current-project").innerHTML;

  // Create and download JSON file
  const date = new Date();
  const datestring = getDateString(date);
  let data = {};
  
  // Combine static and dynamic data for download
  let request = indexedDB.open(`manual_matcher_${projectName}`);

  request.onsuccess = function() {
    let db = request.result;

    let tx1 = db.transaction("meta");
    let obj1 = tx1.objectStore("meta");

    let prom1 = obj1.getAll();

    prom1.onsuccess = function() {
      data['meta'] = prom1.result;
      let tx2 = db.transaction("data");
      let obj2 = tx2.objectStore("data");

      let prom2 = obj2.getAll();
      prom2.onsuccess = function() {
        data['data'] = prom2.result;

        const mergedData = JSON.stringify(data);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(mergedData);
        const dlAnchorElem = document.getElementById('downloadAnchorElem');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `${projectName}_${datestring}.json`);
        dlAnchorElem.click();
      }
    }
  }

};

function getDateString(d) {
  // Create Date Time String YYYY-MM-DD-HHMMSS
  const separator = "_";
  let timeString = d.getFullYear().toString() + separator;
  timeString += (d.getMonth() + 1).toString().padStart(2, "0") + separator; 
  timeString += d.getDate().toString().padStart(2, "0") + separator;
  timeString += d.getHours().toString().padStart(2, "0") 
  timeString += d.getMinutes().toString().padStart(2, "0");
  timeString += d.getSeconds().toString().padStart(2, "0");
  return timeString;
};

async function insertData(rawData) {
  // Insert data into project database and update application metadata
  let dbProject;
  let dbMM;
  let projectName;

  for (let line of rawData['meta']) {
    if (line['label'] == 'project') {
      projectName = line['value'];
    }
  }

  const dbName = `manual_matcher_${projectName}`;
  const isExisting = (await window.indexedDB.databases()).map(db => db.name).includes(dbName);
  if (isExisting) {
    if (!confirm(`${projectName} already exists. Overwrite?`)) {
      return; 
    }
  }
    
  // Update HTML with project name
  document.getElementById("current-project").innerHTML = projectName;
  
  let requestProject = indexedDB.open(dbName, 1);
  
  requestProject.onupgradeneeded = function(event) {
    dbProject = event.target.result;
    const dataStore = dbProject.createObjectStore("data", { keyPath: "id" });
    const metaStore = dbProject.createObjectStore("meta", { keyPath: "label" });
  };
  
  requestProject.onsuccess = function(event) {
    dbProject = event.target.result;
    // Database opened successfully

    // Add data and meta data
    let transaction = dbProject.transaction(["data", "meta"], "readwrite");
    let objectData = transaction.objectStore("data");
  
    document.getElementById("total-questions").innerHTML = rawData['data'].length;

    for (let record of rawData['data']) {
      let addRequest = objectData.put(record);
      
      addRequest.onerror = function(event) {
        console.log(`Cant add data: ${event}`);
      }
    }
          
    let objectMeta = transaction.objectStore("meta");
  
    for (let record of rawData['meta']) {
      let addRequest = objectMeta.put(record);
     
      addRequest.onerror = function(event) {
        console.log(`Error added metadata ${event}`);
      }
    }

    transaction.oncomplete = function() {
      // After completing insertion, startQuestion();
      startQuestion();
    }
  }

  requestProject.onerror = function(event) {
    // Error occurred while opening the database
  };

  // Update application metadata
  let requestMM = indexedDB.open("manual_matcher", 1);
  
  requestMM.onsuccess = function(event) {
    dbMM = event.target.result;
    // Database opened successfully

    // Add data
    let transaction = dbMM.transaction("meta", "readwrite");
    let objectStore = transaction.objectStore("meta");
  
    let initData = [{'label': 'lastProject', 'value': projectName}];

    for (let record of initData) {
      let updateRequest = objectStore.put(record);
      
      updateRequest.onerror = function(event) {
        // Error
        console.log(`Update error in insertData: ${event}`);
      }
    }
  };
  
  requestMM.onerror = function(event) {
    // Error occurred while opening the database
  };
}

async function initManualMatcher() {
  let db;
  let initData = [{'label': 'lastProject', 'value': ''}];

  let request = indexedDB.open("manual_matcher", 1);
 
  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    const metaStore = db.createObjectStore("meta", { keyPath: "label" });
  };
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    // Database opened successfully

    // Add meta data
    const transaction = db.transaction("meta", "readwrite");
    const objectStore = transaction.objectStore("meta");
  
    for (let record of initData) {
      let addRequest = objectStore.add(record);
      
      addRequest.onsuccess = function(event) {
        // Data added succesfully
      }
    }     
  }
  
  request.onerror = function(event) {
    // Error occurred while opening the database
  };
}

async function startQuestion() {
  let meta = {};
  let projectName = '';

  const request = indexedDB.open("manual_matcher");
  request.onupgradeneeded = function() {
    console.log("Unexpected upgrade needed in startQuestion().");
  }

  request.onsuccess = function() {
    const db = request.result;
    const tx = db.transaction("meta");

    // let result = {};
    const prom = tx.objectStore("meta").getAll();
    prom.onsuccess = function() {
      for (let item of prom.result) {
        meta[item['label']] = item['value'];
      }
      // Loop through data to check how many questions have been answered and what the 
      // one to start would be.
      projectName = meta['lastProject'];
      if (projectName == "") {
        // No project has been used yet
        return;
      }
      document.getElementById("current-project").innerHTML = projectName;
      const requestData = indexedDB.open(`manual_matcher_${projectName}`);

      requestData.onsuccess = function() {
        const dbData = requestData.result;
        const txData = dbData.transaction("data");

        // Dangerous - reading all data in memory
        const promData = txData.objectStore("data").getAll();
        promData.onsuccess = function() {
          const data = promData.result;
          // Set total number of questions in HTML
          document.getElementById("total-questions").innerHTML = data.length;
          let counter = 0;
          let countRecords = 0;
          let firstUnanswered = -1;
          for (let record of data) {
            if (record['matches'].length == 0) {
              if (firstUnanswered < 0) {
                firstUnanswered = counter;
              }
            } else {
              countRecords ++;
            }
            counter ++;
          }
          if (firstUnanswered < 0) {
            firstUnanswered = 0;
          }
          document.getElementById("questions-done").innerHTML = countRecords;

          // Update metadata fields and show the invisible ones
          document.getElementById('pageTitle').innerHTML = meta['lastProject'];
          document.getElementById("move-container").classList.remove("d-none");
          document.getElementById("move-container").classList.add("d-flex");
          document.querySelector("#import-container .alert").classList.remove("d-none");
          document.getElementById("download-container").classList.remove("d-none");
          // Call the "regular" showQuestion() function
          showQuestion(projectName, firstUnanswered);
        }
      }
    }
  }
}

function showQuestion(projectName, questionId) {
  // Load current next question
  let dbName = `manual_matcher_${projectName}`
  
  // Retrieve project information from HTML
  const totalRecords = Number(document.getElementById('total-questions').innerHTML);
  const totalDone = Number(document.getElementById('questions-done').innerHTML);

  // Open database
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = function() {
    console.log("Unexpected upgrade needed in showQuestion().");
  }

  // Succesful opening of DB
  request.onsuccess = function(event) {
    const db = request.result;

    let meta = {};

    // Retrieve project meta data and set fields accordingly.
    let tx1 = db.transaction("meta");
    const prom1 = tx1.objectStore("meta").getAll();
    prom1.onsuccess = function() {
      for (let item of prom1.result) {
        meta[item['label']] = item['value'];
      }
      document.getElementById('browserTimestamp').innerHTML = `<b>Last change: </b> ${meta['lastChange']}`;
      document.getElementById('downloadTimestamp').innerHTML = `<b>Last download: </b> ${meta['lastDownload']}`;
      
      // Show current progress
      let progress = Math.round((totalDone / totalRecords) * 100);
      let progressBar = document.querySelector('.progress-bar');
      progressBar.setAttribute("aria-valuenow", progress);
      progressBar.style.width = `${progress}%`
    }

    // Retrieve current question data and update HTML accordingly.
    let tx2 = db.transaction("data");
    const prom2 = tx2.objectStore("data").get(questionId);
    prom2.onsuccess = function() {
      let data = prom2.result;
      // Show current Match question
      document.getElementById('question-data').innerHTML = JSON.stringify(data);
      document.getElementById('question').innerHTML = `Please indicate the best match or matches to: <b>${data['keyword']}</b>`;

      // Show current Match answers
      let innerHTML = '';
      let isChecked = '';
      // project['data'][currentMatch] ===> data['suggestions']
      // data['answer'][currentMatch] ===> data['matches']
      // let currentAnswers = data['answer'][currentMatch];
      for (let i = 0; i < data['suggestions'].length; i++) {
          if (data['matches'].includes(i)) {
              isChecked = ' checked';
          } else {
              isChecked = '';
          }
          innerHTML += `<div class="form-check" onclick="checkBoxSelector(${i});">
                              <input class="form-check-input" type="checkbox" name="answers" id="option${i}"${isChecked}>
                              <label class="form-check-label" for="option${i}">
                                  ${data['suggestions'][i]}
                              </label>
                          </div>`;
      }
      if (data['matches'].length == 0 || data['matches'].includes(data['suggestions'].length)) {
          isChecked = ' checked';
      } else {
          isChecked = '';
      }
      innerHTML += `<div class="form-check" onclick="checkBoxSelector(${data['suggestions'].length});">
                          <input class="form-check-input" type="checkbox" name="answers" id="option${data['suggestions'].length}"${isChecked}>
                          <label class="form-check-label" for="option${data['suggestions'].length}">
                              None of the above
                          </label>
                      </div>`;
      document.getElementById('answers').innerHTML = innerHTML;
    }
  }
}

function changeQuestion(delta) {
  // Update answer array with current answer
  const answers = document.getElementsByName('answers');
  const totalQuestions = Number(document.getElementById("total-questions").innerHTML);
  let checkedAnswers = [];
  for (let i in answers) {
      if (answers[i].checked) {
          checkedAnswers.push(Number(i));
      }
  }
  let data = JSON.parse(document.getElementById("question-data").innerHTML);
  let questionId = data['id'];
  data['matches'] = checkedAnswers;
  storeData(data);

  // Continue to follow up question
  questionId += delta;
  if (questionId < 0) {
      questionId = totalQuestions - 1;
  } else if (questionId == totalQuestions) {
      questionId = 0;
  }
  let currentProject = document.getElementById("current-project").innerHTML;
  showQuestion(currentProject, questionId);
}

function storeData(data) {
  updateTimeStamp("lastChange");
  
  const projectName = document.getElementById("current-project").innerHTML;

  // Update application metadata
  let request = indexedDB.open(`manual_matcher_${projectName}`, 1);

  // Check for changes
  let orgData = JSON.parse(document.getElementById("question-data").innerHTML);
  if (orgData['matches'].length == 0 && data['matches'].length > 0) {
    // An answer has been given. Update questions-done
    let questionsDone = Number(document.getElementById("questions-done").innerHTML) + 1;
    document.getElementById("questions-done").innerHTML = questionsDone;
  } else if (orgData['matches'].length > 0 && data['matches'].length == 0) {
    // An answer has been removed. Update questions-done
    let questionsDone = Number(document.getElementById("questions-done").innerHTML) - 1;
    document.getElementById("questions-done").innerHTML = questionsDone;
  }

  request.onsuccess = function(event) {
    let db = event.target.result;
    // Database opened successfully

    // Add data
    let transaction = db.transaction("data", "readwrite");
    let objectStore = transaction.objectStore("data");

    let updateRequest = objectStore.put(data);

    updateRequest.onerror = function(event) {
      // Error
      console.log(`Update error in storeData: ${event}`);
    }
  };

  request.onerror = function(event) {
    // Error occurred while opening the database
  };
}

function updateTimeStamp(stampType) {
  if (stampType == "lastDownload" || stampType == "lastChange") {
    //
    let date = new Date();
    let timeStamp = date.toLocaleString();
    if (stampType == "lastDownload") {
      document.getElementById('downloadTimestamp').innerHTML = `<b>Last download: </b> ${timeStamp}`;
    } else {
      document.getElementById('browserTimestamp').innerHTML = `<b>Last change: </b> ${timeStamp}`;
    }

    let projectName = document.getElementById("current-project").innerHTML;
    const request = indexedDB.open(`manual_matcher_${projectName}`);
    
    request.onsuccess = function() {
      const db = request.result;
      const transaction = db.transaction("meta", "readwrite");
      const objectStore = transaction.objectStore("meta");
   
      const record = {'label': stampType, 'value': timeStamp};
      const addRequest = objectStore.put(record);

      addRequest.onerror = function(event) {
        console.log("Can not set timestamp");
      }
    }
    return timeStamp;
  } else {
    console.log(`Unknown stampType: ${stampType}`);
    return "";
  }
}