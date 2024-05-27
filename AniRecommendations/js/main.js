window.onload = (e) => {
    document.querySelector("#search").onclick = searchButtonClicked;

    // Saves the previous search term to redisplay when the user comes back to the page on the same browser
    const searchField = document.querySelector("#searchterm");
    const searchKey = "oeg5370-search";
    // grab the stored data, will return `null` if the user has never been to this page
    const storedSearch = localStorage.getItem(searchKey);
    // if we find a previously set search, display it
    if (storedSearch) {
        searchField.value = storedSearch;
    } else {
        searchField.value = ""; // null by default if there isn't a previous search
    }
    searchField.onchange = e => { localStorage.setItem(searchKey, e.target.value); };

    // changes the order that the data is displayed when the dropdown is changed
    const sortDropdown = document.querySelector("#sorting");
    sortDropdown.onchange = (e) => { checkDisplayType(sortDropdown.value); };
};

let displayTerm = "";
const JIKAN_URL = "https://api.jikan.moe/v4/";

// Create array to store all data pulled from the API
let recommendationDataFullList = [];

// Create the arrays for each sorting method
let highToLow = [];
let lowToHigh = [];
let abcRecs = [];
let zyxRecs = [];

// Start building an HTML string we will display to the user
let bigString = "";

// Searches for the anime that the user entered and retrieves its data to be used later
function searchButtonClicked() {
    //console.log("searchButtonClicked() called");

    // build up our URL string
    let url = JIKAN_URL;

    // parse the user entered term we wish to search
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // get rid of any leading and trailing spaces
    term = term.trim();

    // encode spaces and special characters
    term = encodeURIComponent(term);

    // if there's no term to search then bail out the function (return does this)
    if (term.length < 1) return;

    // append the search term to the URL and set the limit to 1 for the first search
    url += "anime?q=" + term + "&limit=" + 1;

    // update the UI
    document.querySelector("#status").innerHTML = "<b>Searching for '" + displayTerm + "'</b>";

    // see what the URL looks like
    //console.log(url);

    // resets everything in the global scope so duplicate data isn't presented
    abcRecs = [];
    zyxRecs = [];
    highToLow = [];
    lowToHigh = [];

    // display a loading message while the user waits for the data to display
    document.querySelector("#content").innerHTML = "<p>Loading Data...</p>";

    // Request the first set of data
    getData(url, dataLoaded);
}

// Gets the data from the API
function getData(url, loadFunction) {
    // create a new XHR object
    let xhr = new XMLHttpRequest();

    // set the onload handler
    xhr.onload = loadFunction;

    // set the onerror handler
    xhr.onerror = dataError;

    // open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// Makes the data able to be looped through to present to the user
function getParsableData(e) {
    // event.target is the xhr object
    let xhr = e.target;

    // xhr.responseText is the JSON file we just downloaded
    console.log(xhr.responseText);

    // turn the text into a parsable JavaScript object
    return JSON.parse(xhr.responseText);
}

// Retrieves the data for the anime that the user searched for
function dataLoaded(e) {

    let obj = getParsableData(e);

    console.log(obj.data);

    // if there are no results, print a message and return
    if (!obj.data) {
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'<b>";
        return; // Bail out
    }

    // Start building an HTML string we will display to the user
    let results = obj.data;
    //console.log("results.length = " + results.length);

    //set id equal to the result's id on MyAnimeList
    let id = results[0].mal_id;

    // set the url back to the starter Jikan API url
    let url = JIKAN_URL;

    // append "anime", its id, and "recommendations" to the url to search for recommendations based on the anime the user entered
    url += "anime/" + id + "/recommendations";

    // Request the next set of data, the list of recommendations
    getData(url, recommendationsLoaded);
}

// Message to console if there is an error retrieving data
function dataError(e) {
    console.log("An error occured");
}

// Retrieves the recommendation data based on the searched anime
function recommendationsLoaded(e) {
    let obj = getParsableData(e);
    recommendationDataFullList = obj.data;
    console.log(recommendationDataFullList);

    // if there are no results, print a message and return
    if (!recommendationDataFullList || recommendationDataFullList.length == 0) {
        document.querySelector("#status").innerHTML = "<b>No recommendations found for '" + displayTerm + "'<b>";
        return; // Bail out
    }

    let loopLimit = 0;
    let limit = document.querySelector("#limit").value;
    // check to ensure that the 'for loop' does not iterate more times than necessary, when there are less recommendations
    // than the specified limit
    if (limit > recommendationDataFullList.length) {
        loopLimit = recommendationDataFullList.length;
    }
    else {
        loopLimit = limit;
    }
    //console.log("recommendations.length = " + recommendations.length);

    // loop through the array of results to add them to each array before sorting them
    for (let i = 0; i < loopLimit; i++) {
        let recommendation = recommendationDataFullList[i];

        highToLow.push(recommendation);
        lowToHigh.push(recommendation);
        abcRecs.push(recommendation);
        zyxRecs.push(recommendation);
    }

    // Properly sort the data in each array
    sortData();

    // update the status
    document.querySelector("#status").innerHTML = "<b>Success!</b>"; //<p><i>Here are " + loopLimit + " results for '" + displayTerm + "'</i><p>

    // display all of the data based on the parameters the user selected
    document.querySelector("#recHeading").innerHTML = "Here are " + loopLimit + " Recommendations based on the title you entered:";
    let sortType = document.querySelector("#sorting").value;
    checkDisplayType(sortType);
}

// Sorts data accordingly so that the proper array can be called when that data is needed
function sortData() {
    // sorting by most recommendations to least, not technically needed as by default they are in this order
    highToLow.sort(function (a, b) { return b.votes - a.votes; });

    // sorting by least recommendations to most,
    lowToHigh.sort(function (a, b) { return a.votes - b.votes; });

    // sorting by title alphabetically
    abcRecs.sort(function (a, b) {
        return a.entry.title.localeCompare(b.entry.title);
    });

    // sorting by title reverse alphabetically
    zyxRecs.sort(function (a, b) {
        return b.entry.title.localeCompare(a.entry.title);
    });
}

// Checks what type of sorting the user selected to decide what to display
function checkDisplayType(sortType) {
    if (sortType == "recCountHighToLow") {
        displayItems(highToLow);
    }
    else if (sortType == "recCountLowToHigh") {
        displayItems(lowToHigh);
    }
    else if (sortType == "ABC") {
        displayItems(abcRecs);
    }
    else if (sortType == "reverseABC") {
        displayItems(zyxRecs);
    }
}

// Displays items based on the type of sorting the user selects
function displayItems(sortedArray) {
    bigString = "";
    for (let i = 0; i < sortedArray.length; i++) {
        let recommendation = sortedArray[i];

        let line = `<div class = 'result'><h2><a target='_blank' href='${recommendation.entry.url}'>`;
        line += `${recommendation.entry.title}</a></h2><p>Recommendation Count: ${recommendation.votes}</p>`;
        line += `<a target='_blank' href='${recommendation.url}'>See Why People Recommend This!</a>`;
        line += `<img src='${recommendation.entry.images.jpg.image_url}' title='${recommendation.entry.title}'/></div>`;

        bigString += line;
    }
    document.querySelector("#content").innerHTML = bigString;
}