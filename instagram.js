const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.instagram.com';
const TAG_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/`;
const USER_URL = (userName) => `https://www.instagram.com/${userName}/`;
 
const NUM_OF_PICT_TO_LIKE = [4, 6, 8, 10, 12, 15];
const MAX_LIKES = 450;
const MAX_COMMENTS = 64;
const MAX_TOTAL_LIKE_PER_TAG = 5; // for Random function
const MAX_ERRORS = 15;

let RUNNING = {
    liked: 0,
    comments: 0,
    errors: 0,
    notLiked: 0,
    alreadyBeenLiked: 0,
    round: 0,
    brakeWindow: 0,
    commentsIS: ['Nice 👍', 'Cool! 🏍', 'I Love it 🔥', 'Its awesome :)', 'Thats cool! 👍', '🔥🔥🔥', '👍👍👍', '😎👍', '🏍'],
    usersForLiking: [],
    tag: "",
    tags: [],
    mostCurrentTags: [],
    totalLikeForThisRound: 0,
    startTime: Date,
    isRunning: true
}

function getDelay(timeFrame) {
    let delay = 3000;
    const delaysShort = [5000, 5500, 6000, 7500, 8000];
    const delaysLong = [20000, 24000, 27000, 29000, 33000];
    const THIRTY_MINUTES = 1800000;
    const HOUR = 3600000;

    switch (timeFrame) {
        case 'halfHour':
            delay = THIRTY_MINUTES;
            break;
        case 'hour':
            delay = HOUR;
            break;
        case 'longVar':
            delay = delaysLong[Math.round(Math.random() * 4)];
            break;
        case 'shortVar':
            delay = delaysShort[Math.round(Math.random() * 4)];
            break;
        default:
            delay = 3000;
            break;
    }
    return delay;
}

const instagram = {

    browser: null,
    page: null,

    initialize: async () => {
        instagram.browser = await puppeteer.launch({
            headless: false
        });

        instagram.page = await instagram.browser.newPage();
    },

    login: async (userName, password) => {

        await instagram.page.goto(BASE_URL, { waitUntil: 'networkidle2' });

        await instagram.page.waitForTimeout(4000);

        // Writing the username and password
        await instagram.page.type('input[name="username"]', userName, { delay: 50 });
        await instagram.page.type('input[name="password"]', password, { delay: 50 });

        await instagram.page.waitForTimeout(getDelay('shortVar'));
        await instagram.page.click('button[type="submit"]');

        await instagram.page.waitForTimeout(getDelay('shortVar'));
        //await instagram.page.waitFor('a > svg[aria-label="Find people"]');
    },

    likeTagsProcess: async (tags = []) => {

        RUNNING.startTime = new Date().toLocaleTimeString();
        RUNNING.tags = tags;

        // Get current tag
        let tagNumber = Math.round(Math.random() * (RUNNING.tags.length - 1));
        RUNNING.tag = tags[tagNumber];
        RUNNING.mostCurrentTags = []; // Empty array will fill up with current tag number;

        while (RUNNING.liked < MAX_LIKES && RUNNING.errors < MAX_ERRORS) {
            RUNNING.round++;

            //Need to do array of tags that contains last three tags so new one not one of them
            //New Tag

            let newTagNumber = Math.round(Math.random() * (RUNNING.tags.length - 1));

            while (RUNNING.mostCurrentTags.find(n => n == newTagNumber) !== undefined) {
                newTagNumber = Math.round(Math.random() * (RUNNING.tags.length - 1));
            }
            RUNNING.mostCurrentTags.push(newTagNumber);
            RUNNING.mostCurrentTags.length > (Math.round(RUNNING.tags.length / 2)) ? RUNNING.mostCurrentTags.shift() : ''; // Remove first gar in Array if array half of Tags array

            // SET NEW TAG FOR NEXT ROUND
            RUNNING.tag = RUNNING.tags[newTagNumber];


            // go to tag page
            await instagram.page.goto(TAG_URL(RUNNING.tag), { waitUntil: 'networkidle2' });
            console.log('');
            console.log('======= Current TAG: ' + RUNNING.tag + ' ========= ERRORS: ' + RUNNING.errors + ' =========');
            console.log('');
            await instagram.page.waitForTimeout(getDelay('shortVar'));

            // Click on first post
            try {
                //await instagram.page.click('article a');
                await openFirstPicture();
                RUNNING.isRunning = true;
            }
            catch (err) {
                console.log('ERROR! ' + err);
                console.log(' ');
                console.log('TRYING TO SWITCH TO NEXT TAG.  ==== PLEASE WAIT... ====')
                console.log(' ');
                RUNNING.isRunning = false;
                RUNNING.errors++;
                //i = NUM_OF_PICT_TO_LIKE; // Switch to next teg NEEDS to be fix
                //break; // break the loop and try it again
            }

            if (RUNNING.isRunning) {  // IF false switch to next TAG

                //Skip 9 top pictures
                await skipPictures(9);

                // Short delay
                await instagram.page.waitForTimeout(getDelay('shortVar'));

                // Like Pictures
                await likeNumberOfPictures(MAX_TOTAL_LIKE_PER_TAG);

            }

            // waiting for the next tag 
            await instagram.page.waitForTimeout(getDelay('longVar'));
        }
    }
}

// ================================================================= FUNCTIONS ===================================================

// Login to Console
async function printReport() {
    console.log(' ');
    console.log('===============================================================================');
    console.log(' TAG: ' + RUNNING.tag + ' ======= ERRORS: ' + RUNNING.errors)
    console.log(' COMMENTED: ' + RUNNING.comments + ' | LIKED: ' + RUNNING.liked + ' | NOT LIKED: ' + RUNNING.notLiked + ' | ALREADY BEEN LIKED: ' + RUNNING.alreadyBeenLiked);
    console.log(' ');
    console.log(' Round: ' + RUNNING.round + ' ===== Start Time: ' + RUNNING.startTime + ' ===== Current Time: ' + new Date().toLocaleTimeString());
    console.log(' Most current tags number: ' + RUNNING.mostCurrentTags);
    console.log('===============================================================================');
    console.log(' ');
    console.log(' ');
}

// Skip few pictures
async function skipPictures(numOfPictToSkip) {
    for (let i = 0; i < numOfPictToSkip; i++) {
        let next = await instagram.page.$('svg[aria-label="Next"]'); 
        if (next) {
            await instagram.page.click('svg[aria-label="Next"]');
            await instagram.page.waitForTimeout(getDelay('shortVar'));
        }
    }
}

async function likeNumberOfPictures(maxNumberOfPicturesToLike){
    // like Number of post using arrow right
    let isLikable = null;
    let notLikable = null;
    let willStopIfManyPostAlreadyLiked = 0;

    let i = 0;
    // Set how many like for this TAG 
    RUNNING.totalLikeForThisRound = NUM_OF_PICT_TO_LIKE[Math.round(Math.random() * maxNumberOfPicturesToLike)];
    while (i < RUNNING.totalLikeForThisRound) {
        //await instagram.page.waitForTimeout(500);
        //console.log("Looking at the new picture. isLikable - " + isLikable);
        await instagram.page.waitForTimeout(getDelay('shortVar'));

        isLikable = await instagram.page.$('svg[aria-label="Like"]');
        notLikable = await instagram.page.$('svg[aria-label="Unlike"]');

        await instagram.page.waitForTimeout(getDelay('shortVar'));

        if (isLikable != null && notLikable == null) {
            await instagram.page.waitForTimeout(getDelay('shortVar'));
            await instagram.page.waitForTimeout(6000);

            //
            //
            //  LIKE
            //
            // Randomly like or not current picture
            //
            let likeOrNot = Math.round(Math.random() * 4);
            if (likeOrNot === 0 || likeOrNot === 1 || likeOrNot === 2) {
                await instagram.page.click('span._aamw');

                //Comment function (returns updated count for comments)
                RUNNING = await comment(RUNNING, false); // false - will comment randomly, true - all liked will be commented

                RUNNING.liked++;
                RUNNING.brakeWindow++;
                willStopIfManyPostAlreadyLiked = 0;
                isLikable = null;

                // Print Report
                await printReport(RUNNING);

                i++;
            } else { // Skipping this Picture
                RUNNING.notLiked++;
                console.log('=========== Skipping this pic =============')
                await printReport(RUNNING);
            }

        } else {
            // This picture already liked
            // Just do some delay
            RUNNING.alreadyBeenLiked++;
            willStopIfManyPostAlreadyLiked++

            // Print Report
            await printReport(RUNNING)

            isLikable = null;
            if (willStopIfManyPostAlreadyLiked > 3) {
                console.log("To many liked pictures, switching to next tag");
                await instagram.page.waitForTimeout(4000);
                i = NUM_OF_PICT_TO_LIKE;
            }
            i++;
            await instagram.page.waitForTimeout(500);
        }


        //DO 30 or 60 min BRAKE every 50 ad 100 likes 
        let isBreakDone = await checkIfBreakTime(RUNNING)
        if (isBreakDone) {
            break;
        }

        // Click to Next
        await instagram.page.waitForTimeout(2000);
        await skipPictures(1);
    }
}


async function openFirstPicture(){
    try{
        await instagram.page.click('article a');
    } catch (err){
        console.log('First Pic cant be displayed' + err);
    }
    
}

async function addUserToPotencialForLikes(){

}

// Open User Page
async function openUserPage(userName){
    try{
        await instagram.page.goto(USER_URL(userName), { waitUntil: 'networkidle2' });
    }
    catch(err){
        console.log('User Page cant be displayed' + err);
    }
}

// Comment Function
async function comment(RUNNING, isTrue) {

    let commentOrNot = Math.round(Math.random() * 7);
    const thisIsComment = RUNNING.commentsIS[Math.round(Math.random() * (RUNNING.commentsIS.length - 1))] // Random comment from the Array
    let isForComments = commentOrNot === 0 || commentOrNot === 1;

    if ((isForComments && RUNNING.comments <= MAX_COMMENTS) || isTrue) {
        await instagram.page.waitForTimeout(2000);

        try {
            await instagram.page.type('textarea', thisIsComment, { delay: 50 });
            await instagram.page.waitForTimeout(1000);
            await instagram.page.click('button[type="Submit"]');
            RUNNING.comments++;
            await instagram.page.waitForTimeout(2000);
            return RUNNING;
        }
        catch (err) {
            console.error('ERROR!!! ' + err);
            RUNNING.errors++; // Errors not defined
            return RUNNING;
        }
    } else {
        return RUNNING;
    }
}

//Break Time Function
async function checkIfBreakTime(RUNNING) {
    if (RUNNING.liked != 0 && RUNNING.liked % 50 == 0 && RUNNING.brakeWindow > 0) {
        if (RUNNING.liked % 100 == 0) { // 60 min break
            console.log('============== 60 min BREAK START ================');
            console.log('Start time:' + new Date().toLocaleTimeString());
            await instagram.page.waitForTimeout(getDelay('hour'));
            console.log('Break is Done at:' + new Date().toLocaleTimeString());
            console.log('============== 60 min BREAK FINISHED =============')
            RUNNING.brakeWindow = 0; // reset brake point so it's not gonna hit brake again if no pictures liked
            return true; // Finish liking round and change the Tag    
        } else { // 30 min break
            console.log('============== 30 min BREAK START ================');
            console.log('Start time:' + new Date().toLocaleTimeString());
            await instagram.page.waitForTimeout(getDelay('halfHour'));
            console.log('Break is Done at:' + new Date().toLocaleTimeString());
            console.log('============== 30 min BREAK FINISHED =============')
            RUNNING.brakeWindow = 0;
            return true; // Finish liking round and change the Tag
        }
    } else {
        return false;
    }
}

module.exports = instagram; 