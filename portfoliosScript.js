let database = [];                                            // the array, chopped up from the input database.txt of works. workArray should be interogated for work data, as it stores proper 'Work' objects.
let worksArray = [];                                          // the core array of works. This should, after the inital load, always contain all the the works in the full portfolio. [TODO: could this be cached?]
let readyToBuild = false;                                     // changes to true once the workArray is completely built and ready for rendering. checkToBuildPortfolio() runs constantly until true.
let composer = "Benjamin Loomes";                             // the currently loaded composer, if any.
let searchText;                                               // the current text in the search box.
let bigPreview = false;                                       // should the preview window be loaded in the zoomed-in version (W=90vw) or the height-matched (H=100vh) mode?
let singleWork = "";

let lastMiniWorkWasNorm = false;

let theURLStem = window.location.origin + "/";

const databaseColDeliminator = "\t";                                // what character separates the columns of the database.txt
const databaseEntryDeliminator = "\n";                              // what character separates the rows of the database.txt

let databaseRequest = new XMLHttpRequest();                   // GETs the database.txt from the node server.
databaseRequest.open('GET', './database.txt');
databaseRequest.onreadystatechange = function() {
  if (databaseRequest.readyState === 4){
    unpackTXTDatabase(databaseRequest.responseText);          // ...when it returns, start unpacking it.
  }
}
databaseRequest.send();

window.onload = function() {                                  // when the html loads...
  let urlParams = new URLSearchParams(location.search);       //                        ...extract the url parameters "?search=[SEARCHTEXT]&who=[COMPOSER]"

  if (urlParams.get('who') == "Ben") {                        // N.B.: composer != who. The url uses the shortened name for elegance.
    composer = "Benjamin Loomes";
  } else if (urlParams.get('who') == "Elden") {
    composer = "Elden Loomes";
  } else {
    composer = "";                                            // blank "" <=> either or neither composer.
  }
  singleWork = urlParams.get('work');
  searchText = urlParams.get('search');

  if (window.location.href.split("?")[0] == theURLStem + "portfolios") checkToBuildPortfolio(checkToBuildPortfolio);               // start waiting for the async (?) GET for the database to return.
  else if (window.location.href.split("?")[0] == theURLStem) checkToBuildFeaturedWorks(checkToBuildFeaturedWorks);
  else if (window.location.href.split("?")[0] == theURLStem + "work") checkToBuildSingleWork(checkToBuildSingleWork);
}

function reload() {                        // clears and repopulates the portfolio without reloading the page
  clearCurrentWorks();                     // unused. [TODO: Maybe we should use this to do searches with slightly less server demand?]
  buildPortfolio();
}



function checkToBuildPortfolio(callbackToBuildPorfolio) {     // wait for the database.txt GET to return and be loaded into the worksArray...
    if(!readyToBuild) {
       window.setTimeout(function () {console.log("waiting..."); callbackToBuildPorfolio(callbackToBuildPorfolio)}, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      buildPortfolio();                                       // ...then buildPortfolio() <=> render to screen.
    }
}

function checkToBuildFeaturedWorks(callbackToBuildFeaturedWorks) {     // wait for the database.txt GET to return and be loaded into the worksArray...
    if(!readyToBuild) {
       window.setTimeout(function () {console.log("waiting..."); callbackToBuildFeaturedWorks(callbackToBuildFeaturedWorks)}, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      buildFeaturedWorks();                                       // ...then buildPortfolio() <=> render to screen.
    }
}

function buildFeaturedWorks() {
  for (works of searchFor("featured")) {
    displayWorkMini("featured_works_box", works);
  }
}

function checkToBuildSingleWork(callbackToBuildSingleWork) {     // wait for the database.txt GET to return and be loaded into the worksArray...
    if(!readyToBuild) {
       window.setTimeout(function () {console.log("waiting..."); callbackToBuildSingleWork(callbackToBuildSingleWork)}, 100); /* this checks the flag every 100 milliseconds*/
    } else {
      buildSingleWork();                                       // ...then buildPortfolio() <=> render to screen.
    }
}

function buildSingleWork() {
  for (work of worksArray) {
    if (work.title == singleWork) displayWork("outer_portfolio_box", work);
    //insertBlankSpace("outer_portfolio_box");
  }
}

function unpackTXTDatabase(rawDatabase) {                           // This recieves and processes the database.txt text to populate worksArray, then sets readyToBuild
  rawDatabase = rawDatabase.replace(/"/g,"");                       // delete single " marks added by the database.
  rawDatabase = rawDatabase.replace(/''/g,"\"");                    // replace '' with ", for used intended double quotes
  dataBaseLines = rawDatabase.split(databaseEntryDeliminator);      // break up and populate workArray...
  for (let i = 0; i < dataBaseLines.length; i++) {
    database.push(dataBaseLines[i].split(databaseColDeliminator));  // ...we now have database[work][component]
  }
  for (let i = 1; i < database.length; i++) {                       // ...skipping the first line of the database, with the column descriptions
        if (database[i] === [""] || database[i][0] === "" || database[i] == null || database[i] == undefined) continue; //skips empty lines

    let nextWork = new Work(database[i]);

    worksArray.push(nextWork);
  }
  readyToBuild = true;
}



function buildPortfolio() { //for a composer
  //if (composer != "" && !(searchText != "" && searchText != null)) buildComposerInfo("outer_portfolio_box",composer); //Not building composer Name
  buildSearchBar();

  if (searchText != "" && searchText != null) buildSearchHeader();

  let atLeastOneWork = false;

  if ((searchText == "" || searchText == null) && (composer != "")) { // no search, yes composer
    for (works of worksArray) {
      if (works.composer != composer) continue;
      insertBlankSpace("outer_portfolio_box");
      displayWork("outer_portfolio_box", works);
      atLeastOneWork = true;
    }
  } else if (composer != "" && searchText != "") {  // yes search, yes composer
    for (works of searchFor(searchText)) {
      if (works.composer != composer) continue;
      insertBlankSpace("outer_portfolio_box");
      displayWork("outer_portfolio_box", works);
      atLeastOneWork = true;
    }
  } else if ((searchText != "" && searchText != null) && composer == "") { // yes search, no composer
    for (works of searchFor(searchText)) {
      insertBlankSpace("outer_portfolio_box");
      displayWork("outer_portfolio_box", works);
      atLeastOneWork = true;
    }
  } else {
    for (works of worksArray) { // no search, no composer => everthing
      insertBlankSpace("outer_portfolio_box");
      displayWork("outer_portfolio_box", works);
      atLeastOneWork = true;
    }
  }

  if (!atLeastOneWork) {
    displayNoWorksFound("outer_portfolio_box");
  } else {
    displayCannotFindWhatLookingForText("outer_portfolio_box");
  }
}

function displayWork(divId, work) {
  if (work.tags.includes("unlisted")) { return }
  console.log(work);

  let thisTitleText = work.title;
  let thisComposerText = work.composer;
  let thisDetailsText = work.details;
  let thisDurationText = work.durationText;
  let thisYearText = work.year;
  let thisEnsembleTextArray = work.ensembleArray;
  let thisInstrumentsTextArray = work.instrumentsArray;
  let thisDifficultyTextArray = work.difficultyArray;
  let thisImagePreviewArray =  work.imagePreviewArray;
  let thisImagePreviewTitleArray =  work.imagePreviewTitleArray;
  let thisDissonanceText =  work.dissonance;
  let thisVideoURL =  work.videoURL;
  let thisVideoDetails =  work.videoDetails;
  let thisTags =  work.tags;

  let newEntry = document.createElement("div");
  newEntry.className  = "work_entry";

  let titleline = document.createElement("div")
  titleline.className  = "title_line";

  let title = document.createElement("h3");
  title.className  = "work_title";
  let titleText = document.createTextNode(thisTitleText);
  title.appendChild(titleText);

  othertitlelinetext = thisEnsembleTextArray[0] + " | " + thisDurationText;
  let titlelineotherpar = document.createElement("p");
  titlelineotherpar.className = "other_title_line_text";
  let titlelineother = document.createTextNode(othertitlelinetext);
  titlelineotherpar.appendChild(titlelineother);

  titleline.appendChild(title);
  titleline.appendChild(titlelineotherpar);

  newEntry.appendChild(titleline);

  let composer = document.createElement("p");
  composer.className  = "work_composer";
  let composerText = document.createTextNode(thisComposerText);
  composer.appendChild(composerText);

  newEntry.appendChild(composer);

  let detailsBox = document.createElement("span");
  detailsBox.className = "details_box";
  detailsBox.innerHTML = "<p class='work_details'>"+thisDetailsText+"</p>";
  /*for (paragraph of thisDetailsText.split("<br>")) {
    let detailsText = document.createTextNode(paragraph);
    details.appendChild(detailsText);
    details.appendChild(document.createElement("br"));
  }*/
  newEntry.appendChild(detailsBox.firstChild); // this allows us to pass a raw html input.

  let videoWrapperWrapper = document.createElement("div");
  videoWrapperWrapper.className = "video_wrapper_wrapper";
  for (eachVideoURL of thisVideoURL) {
    if (typeof eachVideoURL != "undefined" && eachVideoURL != "") {
      let videoWrapper = document.createElement("div");
      videoWrapper.className = "video_wrapper"

      let video = document.createElement("iframe");
      video.className = "work_video";
      video.src = eachVideoURL;

      let noVideoBorder = document.createAttribute("frameborder");
      noVideoBorder.value = "0";
      video.setAttributeNode(noVideoBorder);

      let allowfullscreen = document.createAttribute("allowfullscreen");
      video.setAttributeNode(allowfullscreen);

      videoWrapper.appendChild(video);

      videoWrapperWrapper.appendChild(videoWrapper);
    }
  }
  newEntry.appendChild(videoWrapperWrapper);

  if (thisImagePreviewArray[0] != "\r" && thisImagePreviewArray[0] != "") { //for some reason the empty one contains a return char???
    let imagePreviewBox = document.createElement("div");
    imagePreviewBox.className = "image_preview_box"

    for (let k = 0; k < thisImagePreviewArray.length; k++) {
        let eachImage = document.createElement("img");
        eachImage.src = "./images/Previews" + thisImagePreviewArray[k];
        eachImage.className = "preview_image";
        imagePreviewBox.appendChild(eachImage);
        eachImage.onclick = function(){showPreviewImage(work,k)};
    }
    newEntry.appendChild(imagePreviewBox);
  }

  document.getElementById(divId).appendChild(newEntry);

  insertBlankSpace(divId);
}

function displayWorkMini(divId, work) {
  console.log(work);

  let thisTitleText = work.title;
  let thisComposerText = work.composer;
  let thisEnsembleTextArray = work.ensembleArray;
  let thisInstrumentsTextArray = work.instrumentsArray;
  let thisTags =  work.miniImage;
  let thisMiniImage = work.miniImage;

  let newEntry = document.createElement("div");
  newEntry.className  = "work_entry_mini";

  let miniTextBox = document.createElement("div");
  miniTextBox.className  = "mini_text_box";

  let title = document.createElement("h3");
  title.className  = "work_title_mini blue_text";
  let titleText = document.createTextNode(thisTitleText);
  title.appendChild(titleText);

  miniTextBox.appendChild(title);

  let aMiniWorkSpacer = document.createElement("p");
  aMiniWorkSpacer.className  = "mini_work_spacer";
  let aMiniWorkSpacerText = document.createTextNode("|");
  aMiniWorkSpacer.appendChild(aMiniWorkSpacerText);

  miniTextBox.appendChild(aMiniWorkSpacer);


  let ensemble = document.createElement("p");
  ensemble.className  = "work_ensemble_mini";
  let ensembleText = document.createTextNode(thisEnsembleTextArray[0]);
  ensemble.appendChild(ensembleText);

  miniTextBox.appendChild(ensemble);

  let anotherMiniWorkSpacer = document.createElement("p");
  anotherMiniWorkSpacer.className  = "mini_work_spacer";
  let anotherMiniWorkSpacerText = document.createTextNode("|");
  anotherMiniWorkSpacer.appendChild(anotherMiniWorkSpacerText);

  miniTextBox.appendChild(anotherMiniWorkSpacer);

  let composer = document.createElement("p");
  composer.className  = "work_composer_mini";
  let composerText = document.createTextNode(thisComposerText);
  composer.appendChild(composerText);

  miniTextBox.appendChild(composer);



  newEntry.appendChild(miniTextBox);

  if (thisMiniImage != "" && thisMiniImage != null) {
    let miniImage = document.createElement("img");
    miniImage.src = "./images/Previews" + thisMiniImage;
    miniImage.className = "mini_image";
    if (lastMiniWorkWasNorm) { //flips the flex direction with each item
      miniImage.classList.add("anti_mini_fade");
    } else {
      miniImage.classList.add("norm_mini_fade");
    }
    newEntry.appendChild(miniImage);
  }

  if (lastMiniWorkWasNorm) { //flips the flex direction with each item
    newEntry.classList.add("flex_anti");
    miniTextBox.classList.add("flex_anti");
  } else {
    newEntry.classList.add("flex_norm");
    miniTextBox.classList.add("flex_norm");
  }
  lastMiniWorkWasNorm = !lastMiniWorkWasNorm;

  newEntry.onclick = function() {
    window.location.href = theURLStem + "work?work="+thisTitleText;
  }

  document.getElementById(divId).appendChild(newEntry);

}

function insertBlankSpace(divId) {
  let blankSpace = document.createElement("div");
  blankSpace.className  = "blank_space";
  //blankSpace.style.height = "20px"

  document.getElementById(divId).appendChild(blankSpace);
}

function displayNoWorksFound(divId) {
  let noWorksFoundText = document.createElement("h3");
  noWorksFoundText.id = "no_works_found_text";
  noWorksFoundText.appendChild(document.createTextNode("looks like there's nothing here! D'oh!"));
  document.getElementById(divId).appendChild(noWorksFoundText);
}

function displayCannotFindWhatLookingForText(divId) {
  let cannotFindWhatLookingForText = document.createElement("p");
  cannotFindWhatLookingForText.className = "cannot_find_what_looking_for_text";
  cannotFindWhatLookingForText.appendChild(document.createTextNode("Can't find what you're looking for? "));
  let contactLink = document.createElement("a");
  contactLink.href = "/";//dead for now
  contactLink.appendChild(document.createTextNode("Contact us!"));
  cannotFindWhatLookingForText.appendChild(contactLink);

  document.getElementById(divId).appendChild(cannotFindWhatLookingForText);
}

/*function buildComposerInfo(divId, name) {
  let composerTitle = document.createElement("h1");
  composerTitle.id = "composer_portfolio_title";
  let composerTitleText = document.createTextNode(name);
  composerTitle.appendChild(composerTitleText);
  document.getElementById(divId).appendChild(composerTitle);

  let composerAboutBox = document.createElement("span");
  let composerAboutInnerHTML = "";

  if (composer == "Benjamin Loomes") composerAboutInnerHTML = "Ben Loomes info here";
  else composerAboutInnerHTML = "<img src='./images/pictures/Elden.jpg' class='about_image'>Elden Loomes is a 2nd year physics student, contemporary classical composer and all-round nerd."
  + "<br><br>He writes an eclectic range of music, particularly specialising in works for large orchestra, and&mdash;at the other end of  the scale&mdash;contemplative works for solo cello. "
  + "When not working on these he might help around the house with some music for <a href='https://syrinscape.com/'>Syrinscape</a>, for whom he has written a modest respectable collection."
  + "<br><br>He is currently (well Jan 2021-ly) listening to a lot of Alfred Schnittke and Benjamin Britten, though will always fall back to some good-ol' Shostakovich."
  + "<br><br>You can check out a bunch of his stuff on <a href='https://www.youtube.com/channel/UCvKDxtij3sp_t482HkIZf1Q'>Youtube</a>.<hr>";

  composerAboutBox.innerHTML = "<div id='composer_about_box'><p id='about_text'>"+composerAboutInnerHTML+"</p></div>";
  document.getElementById(divId).appendChild(composerAboutBox.firstChild);
}*/

function buildSearchHeader() {
  let searchHeader = document.createElement("h2");
  searchHeader.id = "search_header";
  let searchHeaderText = "Search results";
  if (composer != "") searchHeaderText += " by " + composer;
  searchHeaderText += ": " + searchText;
  let searchHeaderTextNode = document.createTextNode(searchHeaderText);
  searchHeader.appendChild(searchHeaderTextNode);
  document.getElementById("outer_portfolio_box").appendChild(searchHeader);
}

function buildSearchBar() {
  let searchOuterContainer = document.createElement("div");
  searchOuterContainer.id = "search_outer_container";

  let searchBarBox = document.createElement("div");
  searchBarBox.id = "search_bar_box";

  let searchBar = document.createElement("input");
  searchBar.setAttribute("type", "text");
  searchBar.id = "search_bar";
  searchBar.placeholder = "Search for...";
  searchBar.onchange = function() {
    searchText = searchBar.value;
    loadSearchPage(searchText);
  }

  if (searchText != null) searchBar.value = searchText;

  searchBarBox.appendChild(searchBar);

  let searchButton = document.createElement("button");
  searchButton.id = "search_button";
  searchButton.appendChild(document.createTextNode("Search"));
  searchButton.onclick = function() {
    searchText = searchBar.value;
    loadSearchPage(searchText);
  };

  let searchByComposerBox = document.createElement("div");
  searchByComposerBox.id = "search_by_composer_box";

  let searchOnlyForText = document.createElement("p");
  searchOnlyForText.className = "default_text";
  searchOnlyForText.style = "margin: 0;"
  searchOnlyForText.appendChild(document.createTextNode("Only for works by:"));

  searchByComposerBox.appendChild(searchOnlyForText);

  let searchJustBenBox = document.createElement("div");

  let searchJustBen = document.createElement("input");
  searchJustBen.setAttribute("type", "checkbox");
  searchJustBen.id = "search_just_ben_checkbox";
  let searchJustBenTextNode = document.createElement("label");
  searchJustBenTextNode.appendChild(document.createTextNode("Ben"));
  searchJustBenTextNode.className = "default_text";

  if (composer == "Benjamin Loomes") searchJustBen.checked = true;
  searchJustBen.onchange = function() {updateComposer("Ben");};

  searchJustBenBox.appendChild(searchJustBen);
  searchJustBenBox.appendChild(searchJustBenTextNode);


  let searchJustEldenBox = document.createElement("div");

  let searchJustElden = document.createElement("input");
  searchJustElden.setAttribute("type", "checkbox");
  searchJustElden.id = "search_just_elden_checkbox";
  let searchJustEldenTextNode = document.createElement("label");
  searchJustEldenTextNode.appendChild(document.createTextNode("Elden"));
  searchJustEldenTextNode.className = "default_text";

  if (composer == "Elden Loomes") searchJustElden.checked = true;
  searchJustElden.onchange = function() {updateComposer("Elden");};


  searchJustEldenBox.appendChild(searchJustElden);
  searchJustEldenBox.appendChild(searchJustEldenTextNode);

  searchByComposerBox.appendChild(searchJustBenBox);
  searchByComposerBox.appendChild(searchJustEldenBox);

  searchBarBox.appendChild(searchButton);
  searchOuterContainer.appendChild(searchBarBox);
  searchOuterContainer.appendChild(searchByComposerBox);

  document.getElementById("outer_portfolio_box").appendChild(searchOuterContainer);
}

function updateComposer(clickedOn) {
  say("statechange for " + clickedOn);

  if (clickedOn == "Ben" && document.getElementById("search_just_elden_checkbox").checked) {
    say("switch");
    document.getElementById("search_just_elden_checkbox").checked = false;
  } else if (clickedOn == "Elden" && document.getElementById("search_just_ben_checkbox").checked) {
    say("swatch");
    document.getElementById("search_just_ben_checkbox").checked = false;
  }

  let checkForBen = document.getElementById("search_just_ben_checkbox").checked;
  let checkForElden = document.getElementById("search_just_elden_checkbox").checked;

  if (checkForBen && checkForElden) composer = "";
  else if (checkForBen) composer = "Benjamin Loomes";
  else if (checkForElden) composer = "Elden Loomes";
  else composer = "";
}

function loadSearchPage(thisSearch) {
  let searchURL = "./portfolios";
  if (thisSearch != "" && thisSearch != null && composer != "") {
    searchURL += "?search=" + thisSearch + "&";
    if (composer == "Benjamin Loomes") searchURL += "who=Ben";
    if (composer == "Elden Loomes") searchURL += "who=Elden";
  } else if (thisSearch != ""  && thisSearch != null) {
    searchURL += "?search=" + thisSearch;
  } else if (composer != "") {
    if (composer == "Benjamin Loomes") searchURL += "?who=Ben";
    if (composer == "Elden Loomes") searchURL += "?who=Elden";
  }

  window.location.replace(searchURL);
}

function loadWorksFromArray(thisWorksArray, divId) {
  buildSearchBar();
  for (work of thisWorksArray) {
    displayWork(divId,work);
  }
}
function clearCurrentWorks() {
  const portfolioBoxToClear = document.getElementById("outer_portfolio_box");
  while (portfolioBoxToClear.firstChild) {
    portfolioBoxToClear.removeChild(portfolioBoxToClear.lastChild);
  }
}

function Work(databaseLine) { // each composition should have a  Work object stored in the worksArray
  try {
    this.title = databaseLine[0];
    this.composer = databaseLine[1];
    this.details = databaseLine[2];
    this.durationText = databaseLine[3];
    this.year = databaseLine[4];
    this.ensembleArray = databaseLine[5].split(", ");
    this.instrumentsArray = databaseLine[6].split(", ");
    this.difficultyArray = databaseLine[7].split(", ");
    this.imagePreviewArray = databaseLine[8].split(", ");
    this.imagePreviewTitleArray = databaseLine[9].split(", ");
    this.dissonance = databaseLine[10];
    this.videoURL = databaseLine[11].split(", ");
    this.videoDetails = databaseLine[12];
    this.tags = databaseLine[13].split(",");
    this.miniImage = databaseLine[14];
  } catch {
    console.log("Something went wrong displaying one of the pieces! I will now attempt to name the piece:");
    console.log(databaseLine[0]);
    this.title = "";
    this.composer = "";
    this.details = "Something went wrong with this piece!";
    this.durationText = "";
    this.year = "";
    this.ensembleArray = "";
    this.instrumentsArray = "";
    this.difficultyArray = "";
    this.imagePreviewArray = "";
    this.imagePreviewTitleArray = "";
    this.dissonance = "";
    this.videoURL = "";
    this.videoDetails = "";
    this.tags = "";
    this.miniImage = "";
  }
}

function isPortrait() { // a quick check for screens narrower than they are tall
    return window.innerHeight > window.innerWidth;
}

// EDITING HERE
function showPreviewImage(work,page) {

  if (isPortrait() && bigPreview) { // try to stop the zoom in on mobile windows;
    bigPreview = false;
    return;
  }

  closeExpandedPreview();

  //document.getElementById("the_whole_page").classList.add("frozen");

  console.log("trying to display " + page);

  let imagePreviewExpandedBox = document.createElement("div");
  imagePreviewExpandedBox.id = "preview_image_expanded_box";

  let imagePreviewExpandedBoxSub = document.createElement("div");
  imagePreviewExpandedBoxSub.id = "preview_image_expanded_box_sub";

  let leftPreviewArrow = document.createElement("div");
  let leftPreviewArrowIcon = document.createElement("img");
  leftPreviewArrowIcon.src = "./images/pictures/leftarrowsmall.png";
  //if (bigPreview) leftPreviewArrow.className = "preview_arrow_big";
  //else
  leftPreviewArrow.className = "preview_arrow_small";
  if (page > 0) {  // TEST WHETHER THE PREVIOUS PAGE EXISTS
    if (!bigPreview) leftPreviewArrow.appendChild(leftPreviewArrowIcon);
    leftPreviewArrow.onclick = function() {
      showPreviewImage(work,page-1);
    }
  }


  let largeImage = document.createElement("img");
  largeImage.src = "./images/Previews" + work.imagePreviewArray[page];
  if (bigPreview) largeImage.id = "preview_image_expanded_small_newbig"// OLD "preview_image_expanded_big";
  else largeImage.id = "preview_image_expanded_small";
  largeImage.onclick = function() {
    //openImageInNewTab("/images/Previews" + work.imagePreviewArray[page]);
    bigPreview = !bigPreview;
    showPreviewImage(work,page);
  }



  let rightPreviewArrow = document.createElement("div");
  let rightPreviewArrowIcon = document.createElement("img");
  rightPreviewArrowIcon.src = "./images/pictures/rightarrowsmall.png";
  //if (bigPreview) rightPreviewArrow.className = "preview_arrow_big";
  //else
  rightPreviewArrow.className = "preview_arrow_small";
  if (page < work.imagePreviewArray.length-1) {   // TEST WHETHER THE NEXT PAGE EXISTS
    if (!bigPreview) rightPreviewArrow.appendChild(rightPreviewArrowIcon);
    rightPreviewArrow.onclick = function() {
      showPreviewImage(work,page+1);
    }
  }




  imagePreviewExpandedBoxSub.appendChild(leftPreviewArrow);
  imagePreviewExpandedBoxSub.appendChild(largeImage);
  imagePreviewExpandedBoxSub.appendChild(rightPreviewArrow);
  imagePreviewExpandedBox.appendChild(imagePreviewExpandedBoxSub);



  let closeButton = document.createElement("div");
  closeButton.id = "close_button"
  closeButton.onclick = closeExpandedPreview;

  closeX = document.createElement("img");
  closeX.style = "margin: 0; font-size: 0.9rem; cursor: pointer; text-align: center;";
  closeX.src = "./images/pictures/closebutton.png"
  //let closeX = document.createElement("p");
  //closeX.style = "margin: 0; font-size: 0.9rem; cursor: pointer; text-align: center;";  //closeX.appendChild(document.createTextNode("X"));
  closeButton.appendChild(closeX);

  imagePreviewExpandedBox.appendChild(closeButton);

  let imagePreviewTitleText = document.createElement("p");
  imagePreviewTitleText.id = "image_preview_title_text";
  imagePreviewTitleText.appendChild(document.createTextNode(work.imagePreviewTitleArray[page]));
  imagePreviewExpandedBox.appendChild(imagePreviewTitleText);

  let imagePreviewFooterText = document.createElement("p");
  imagePreviewFooterText.id = "image_preview_footer_text";
  imagePreviewFooterText.appendChild(document.createTextNode((page+1) + " of " + work.imagePreviewTitleArray.length));
  imagePreviewExpandedBox.appendChild(imagePreviewFooterText);

  document.body.appendChild(imagePreviewExpandedBox);

}

function openImageInNewTab(URL) {
  window.open(URL, '_blank');
}

function closeExpandedPreview() {
  try {
    document.getElementById("the_whole_page").classList.remove("frozen");
    let oldExpandedToRemove = document.getElementById("preview_image_expanded_box").remove(); //kills the previous overlay
  } catch (err) {
    console.log("No expanded preview to close");
  }
}

function searchFor(thisTotalString) {
  thisStringArray = thisTotalString.split(" ");
  try { // to catch if, say, it isn't defined properly
    let worksToReturn = [];

    for (thisString of thisStringArray) {
      thisString = thisString.toLowerCase(); //reads case-insensitive

      for (eachWork of worksArray) {
        let doAddWork = false;

        if (eachWork.title.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.composer.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.details.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.durationText.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.year.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.dissonance.toLowerCase().includes(thisString)) doAddWork = true;
        else if (eachWork.videoDetails.toLowerCase().includes(thisString)) doAddWork = true;
        else {
          for (each of eachWork.ensembleArray) if (each.toLowerCase().includes(thisString)) doAddWork = true;
          if (!doAddWork) {
            for (each of eachWork.instrumentsArray) if (each.toLowerCase().includes(thisString)) doAddWork = true; //could we break out of these earlier?
            if (!doAddWork) {
              for (each of eachWork.difficultyArray) if (each.toLowerCase().includes(thisString)) doAddWork = true;
              if (!doAddWork) {
                for (each of eachWork.tags) if (each.toLowerCase().includes(thisString)) doAddWork = true;
              }
            }
          }
        }

        if (doAddWork) for (allCurrentWorks of worksToReturn) if (allCurrentWorks.title == eachWork.title) {
          doAddWork = false;
        }


        if (doAddWork) worksToReturn.push(eachWork);
      }

    }
    return worksToReturn;
  } catch (err) {
    return [];
  }
}

function say(what) {
  console.log(what);
}
