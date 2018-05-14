const rp = require('request-promise');
const cheerio = require('cheerio');
const Table = require('cli-table'); //Shows a table in the CLI -> To change into HTML files.\
const fs = require('fs');

var seenLinks = {};

var RootNode = {};
var CurrentNode = {};

var linksQueue = [];
var PrintList = [];

var previousDepth = 0;
var currentDepth = 0;
var MaxDepth = 5;


//Start Application
CrawlBFS("https://www.monzo.com", 1);

function CrawlBFS(StartURL, maxDepth = 5)
{
    MaxDepth = maxDepth;
    startLinkObj = new CreateLink(StartURL, 0, null);
    RootNode = CurrentNode = startLinkObj;
    AddToLinkQueue(CurrentNode);
    FindLinks(CurrentNode);
}

//
function crawl(linkObj)
{
    //Add logs here if needed!
    console.log(`Checking URL: ${options.uri}`);
    FindLinks(linkObj);
}

//The goal is to get the HTML and look for the links inside the page.
function FindLinks(linkObj)
{
  var options = {
    uri: linkObj.url, //The link for the API that we are looking for.
    transform: function (body) {  //Cheerio will allow for me to use $ (jquery like queries)
      return cheerio.load(body);
    }
  }
  rp(options).then(($) => {

    Links = $('body').find('a').filter(function (i, el) {
      return $(this).attr('href') != null;
    }).map( function (i, x) {
      return $(this).attr('href');
    });

    if(Links.length > 0) {
    Links.map(function (i, x) {
      var reqLink = checkDomain(x);
      if(reqLink)
      {
        if(reqLink != linkObj.url) {
        newLinkObj = new CreateLink(reqLink, linkObj.depth + 1, linkObj);
        AddToLinkQueue(newLinkObj);
        }
      }
    });
    } else {
        //console.log("No more links found for " + options.uri);
    }
  })
  .catch((err) => {
      console.log("Something Went Wrong...");
      console.log(`Check URI: ${options.uri}`);
  }).then(($) => {
      var nextLinkObj = GetNextInQueue();
      if(nextLinkObj && nextLinkObj.depth <= MaxDepth) {
        crawl(nextLinkObj);
      } else
      {
        SetRootNode(nextLinkObj);
        PrintTree();
      }
  });
}

//Go all the way up and set RootNode to the parent node
function SetRootNode(currentNode)
{
  var currentNode;
  while(currentNode.parent != null)
  {
    currentNode = currentNode.parent;
  }
  RootNode = currentNode;
}

function PrintTree() {
  var current = RootNode;
  //PrintList.push(current.url + "\n");
  AddToPrintDFS(RootNode);
  console.log(PrintList.join("\n|"));
}

function AddToPrintDFS(node)
{
  Spaces = Array(node.depth * 3).join("-");
  PrintList.push(Spaces + node.url);
  if(node.children)
  {
    node.children.map(function(i, x) {
    {
     AddToPrintDFS(i);
    }
  });
  }
}

//Check if the domain belongs to the site being checked
// -> Return a full link for the Request-promse with protocol
function checkDomain(linkURL)
{
  var urlRegex = /^((http[s]?\:\/\/)?(([a-z]{2,10}\.)*([a-z]{2,30}(\.))(([a-z]{2,2}(\.)))?([a-z]{2,6})))+(([\/]+[\w-\?\=\.]{1,}[\/]?)*)$/
  var resourceRegex = /(([\/]+[\w-\?\=\.]{1,}[\/]?)*)$/;

  var mainHostName = ("https://www.monzo.com").match(urlRegex);
  MainHostObj = {};

  if(mainHostName){
    MainHostObj = {
      fullMatch : mainHostName[0],
      fullHostName : mainHostName[1],
      protocol :  mainHostName[2],
      hostname : mainHostName[3],
      resources : mainHostName[10]
    }
  }

  urlMatch = linkURL.match(urlRegex);

  if(urlMatch){
    urlObj = {
      fullMatch : urlMatch[0],
      fullHostName : urlMatch[1],
      protocol :  urlMatch[2],
      hostname : urlMatch[3],
      resources : urlMatch[10],
    }
    //console.log(`Link URL domain: ${urlObj.domain} || mainURLMatch : ${mainURLMatch}`)
    if(urlObj.fullHostName == MainHostObj.fullHostName)
    {
      console.log("returning Full Link: " + linkURL);
      return linkURL;
    }
  } else if(linkURL.match(resourceRegex)) {
    //console.log("returning resource Link: " + linkURL);
    return MainHostObj.protocol + MainHostObj.hostname + linkURL.match(resourceRegex)[0];
  } else {
    return;
  }
}

//Returns a linkObj
function CreateLink(linkURL, depth, parent)
{
    this.url = linkURL;
    this.depth = depth;
    this.parent = parent;
    this.children = [];
}

function AddToLinkQueue(linkobj)
{
  if(!LinkInSeenListExists(linkobj)) {
    if(linkobj.parent != null) {
      linkobj.parent.children.push(linkobj);
    }
    linksQueue.push(linkobj);
    AddToSeen(linkobj);
  }
}

function GetNextInQueue()
{
  let nextLink = linksQueue.shift();
  if(nextLink.depth > previousDepth)
  {
    previousDepth = nextLink.depth;
    console.log(`------- CRAWLING ON DEPTH LEVEL ${previousDepth} --------`);
  }
  return nextLink;
}

function PeekInQueue()
{
  return linksQueue[0];
}

//Adds links we've visited to the seenList
//Stores by URL + depth we have seen to avoid duplicate links per depth.
var AddToSeen = function(linkObj)
{
   seenLinks[GetKey(linkObj)] = {link: linkObj.url, depth: linkObj.depth};
}

//Returns whether the link has been seen.
function LinkInSeenListExists(linkObj)
{
  return (seenLinks[GetKey(linkObj)]) ? true : false;
}

//Returns the key format for linkObjects
function GetKey(linkObj)
{
  return linkObj.url + "" + linkObj.depth;
}

//TODO: Check for Robots file -- apparently there are some restrictions on some websites?
function FetchRobotsFile(hostname)
{
  var robotFileLocation = hostname + "/robots.txt";
}

function TestRegex()
{
  console.log(`Checking Normal Link: ${checkLinkExists("http://www.google.com")}`);
  console.log(`Checking fake (no protocol): ${checkLinkExists("www.fake.com")}`);
}
