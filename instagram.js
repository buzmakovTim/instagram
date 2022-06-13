const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.instagram.com';
const TAG_URL = (tag) => `https://www.instagram.com/explore/tags/${tag}/` 

const NUM_OF_PICT_TO_LIKE = [4, 6, 8, 10, 12, 15];
const MAX_LIKES = 200;
const MAX_COMMENTS = 40;

function getDelay(timeFrame) {
    let delay = 3000;
    const delaysShort = [5000, 5500, 6000, 7500, 8000];
    const delaysLong = [20000, 24000, 27000, 29000, 33000];
    const THIRTY_MINUTES = 1800000;
    const HOUR = 3600000;

    switch(timeFrame) {
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
        
        await instagram.page.goto(BASE_URL, {waitUntil: 'networkidle2'});

        await instagram.page.waitForTimeout(4000);

        // Writing the username and password
        await instagram.page.type('input[name="username"]', userName, {delay: 50});
        await instagram.page.type('input[name="password"]', password, {delay: 50});

        await instagram.page.waitForTimeout(getDelay('shortVar'));
        await instagram.page.click('button[type="submit"]');

        await instagram.page.waitForTimeout(getDelay('shortVar'));
        //await instagram.page.waitFor('a > svg[aria-label="Find people"]');
    },

    likeTagsProcess: async (tags = []) => {
        
        const commentsIS = ['Nice', 'Cool! 🏍', 'I Love it ;)', 'Its awesome :)', 'Thats cool! 👍', '🔥🔥🔥', '👍👍👍', '😎👍', '🏍'];
        let startTime = new Date().toLocaleTimeString();
        let liked = 0;
        let comments = 0;
        let errors = 0;
        let notLiked = 0;
        let alreadyBeenLiked = 0;
        let round = 0;
        let brakeWindow = 0; // After brake finished 5 more like cycles will be done without hitting brake point again
 
        // Get current tag
        let tagNumber = Math.round(Math.random() * (tags.length-1)); 
        let tag = tags[tagNumber];
        let mostCurrentTags = []; // Empty array will fill up with current tag number;

        while(liked < MAX_LIKES){
            round++;
            
            //Need to do array of tags that contains last three tags so new one not one of them
            //New Tag

            let newTagNumber = Math.round(Math.random() * (tags.length-1));
            
            while(mostCurrentTags.find(n => n == newTagNumber) !== undefined){
                newTagNumber = Math.round(Math.random() * (tags.length-1));
            }
            mostCurrentTags.push(newTagNumber);
            mostCurrentTags.length > (Math.round(tags.length / 2)) ? mostCurrentTags.shift() : ''; // Remove first gar in Array if array half of Tags array

            // SET NEW TAG FOR NEXT ROUND
            tag = tags[newTagNumber];


            // go to tag page
            await instagram.page.goto(TAG_URL(tag), {waitUntil: 'networkidle2'});
            console.log('');
            console.log('============== Current TAG: ' + tag + ' ================');
            console.log('');
            await instagram.page.waitForTimeout(getDelay('shortVar'));

            // Click on first post
            try{
                await instagram.page.click('article a');
            }
            catch(err){
                console.log('ERROR! ' + err);
                i = NUM_OF_PICT_TO_LIKE; // Switch to next teg
                break; // break the loop and try it again
            }  
            

            //Skip 9 top pictures
            await skipPictures(0);


            await instagram.page.waitForTimeout(getDelay('shortVar'));

                // like Number of post using arrow right
                let isLikable = null;
                let notLikable = null;
                let willStopIfManyPostAlreadyLiked = 0;

                let i = 0;
                // Set how many like for this TAG 
                let numOfPicLike = NUM_OF_PICT_TO_LIKE[Math.round(Math.random() * 5)];
                while(i < numOfPicLike){
                    //await instagram.page.waitForTimeout(500);
                    //console.log("Looking at the new picture. isLikable - " + isLikable);
                    await instagram.page.waitForTimeout(getDelay('shortVar'));

                    isLikable = await instagram.page.$('svg[aria-label="Like"]');
                    notLikable = await instagram.page.$('svg[aria-label="Unlike"]');

                    await instagram.page.waitForTimeout(getDelay('shortVar'));

                    if(isLikable != null && notLikable == null){
                        await instagram.page.waitForTimeout(getDelay('shortVar'));
                        await instagram.page.waitForTimeout(6000);
 
                            //
                            //
                            //  LIKE
                            //
                            // Randomly like or not current picture
                            //
                            let likeOrNot = Math.round(Math.random() * 3); 
                            if(likeOrNot === 0 || likeOrNot === 1 || likeOrNot === 2) {
                                await instagram.page.click('span._aamw');

                                //Comment function (returns updated count for comments)
                                comments = await comment(commentsIS, comments, false); // false - will comment randomly, true - all liked will be commented
                                
                                liked++;
                                brakeWindow++;
                                willStopIfManyPostAlreadyLiked = 0;
                                isLikable = null;
                                
                                // Print Report
                                await printReport(tag, errors, comments, liked, notLiked, alreadyBeenLiked, round, startTime, mostCurrentTags);

                                i++;
                            } else { // Skipping this Picture
                                notLiked++;
                                await printReport(tag, errors, comments, liked, notLiked, alreadyBeenLiked, round, startTime, mostCurrentTags);
                            }
                        
                    } else {
                        // This picture already liked
                        // Just do some delay
                        alreadyBeenLiked++;
                        willStopIfManyPostAlreadyLiked++
                        
                        // Print Report
                        await printReport(tag, errors, comments, liked, notLiked, alreadyBeenLiked, round, startTime, mostCurrentTags)

                        isLikable = null;
                        if(willStopIfManyPostAlreadyLiked > 3) {
                            console.log("To many liked pictures, switching to next tag");
                            await instagram.page.waitForTimeout(4000);
                            i = NUM_OF_PICT_TO_LIKE;
                        }
                        i++;
                        await instagram.page.waitForTimeout(500);
                    }


                    // BREAK TIME
                    //DO 30 or 60 min BRAKE every 50 ad 100 likes 
                    if(liked != 0 && liked % 50 == 0 && brakeWindow > 0){
                        if(liked % 100 == 0){ // 60 min break
                            console.log('============== 60 min BREAK START ================');
                            console.log('Start time:' + new Date().toLocaleTimeString());
                            await instagram.page.waitForTimeout(getDelay('hour'));
                            console.log('Break is Done at:' + new Date().toLocaleTimeString());
                            console.log('============== 60 min BREAK FINISHED =============')
                            brakeWindow = 0; // reset brake point so it's not gonna hit brake again if no pictures liked
                            break; // Finish liking round and change the Tag    
                        } else { // 30 min break
                            console.log('============== 30 min BREAK START ================');
                            console.log('Start time:' + new Date().toLocaleTimeString());
                            await instagram.page.waitForTimeout(getDelay('halfHour'));
                            console.log('Break is Done at:' + new Date().toLocaleTimeString());
                            console.log('============== 30 min BREAK FINISHED =============')
                            brakeWindow = 0;
                            break; // Finish liking round and change the Tag
                        }   
                    }

                    // Click to Next
                    //console.log('Prepare to click next'); 
                    await instagram.page.waitForTimeout(2000);
                    let next = await instagram.page.$('svg[aria-label="Next"]');
                    if(next){
                        await instagram.page.click('svg[aria-label="Next"]');
                        isLikable = null;
                        //console.log('NEXT clicked isLikable - ' + isLikable);
                        await instagram.page.waitForTimeout(2000);
                    } else {
                        isLikable = null;
                    }
                }

            
            //Close modal
            //let closeButton = await instagram.page.click('svg[aria-label="Close"]');
            //if(closeButton){
            //    try{
            //        await instagram.page.click('svg[aria-label="Close"]');
            //    }
            //    catch(err){
            //        console.log('CATCH BLOCK CALLED');
            //        console.error('ERROR!!! ' + err);
            //    }
            //} 
            
            // waiting for the next tag
            await instagram.page.waitForTimeout(getDelay('longVar'));
        }
    }


}

// ================================================================= FUNCTIONS ===================================================

// Login to Console
async function printReport(tag, errors, comments, liked, notLiked, alreadyBeenLiked, round, startTime, mostCurrentTags){
    console.log(' ');
    console.log('===============================================================================');
    console.log('=== TAG: ' + tag + ' ======= ERRORS: ' + errors + ' =========================='); 
    console.log('=== COMMENTED: ' + comments + ' | LIKED: ' + liked + ' | NOT LIKED: ' + notLiked + ' | ALREADY BEEN LIKED: ' + alreadyBeenLiked);
    console.log('===============================================================================');
    console.log('=== Round: '+ round + ' ===== Start Time: ' + startTime + ' ===== Current Time: ' + new Date().toLocaleTimeString());
    console.log('=== Most current tags number: ' + mostCurrentTags);
    console.log('===============================================================================');
    console.log(' ');
}

// Skip few pictures
async function skipPictures(numOfPictToSkip){
    for(let i = 0; i < numOfPictToSkip; i++){
        let next = await instagram.page.$('svg[aria-label="Next"]');
        if(next){
            await instagram.page.click('svg[aria-label="Next"]');
            await instagram.page.waitForTimeout(getDelay('shortVar'));
        }
    }
}

// Comment Function
async function comment(commentsIS, comments, isTrue){
    
    let commentOrNot = Math.round(Math.random() * 7);
    const thisIsComment = commentsIS[Math.round(Math.random() * (commentsIS.length-1))] // Random comment from the Array
    let isForComments = commentOrNot === 0 || commentOrNot === 1;
    
    if((isForComments && comments <= MAX_COMMENTS) || isTrue){
        await instagram.page.waitForTimeout(2000);
       
        try {
            await instagram.page.type('textarea', thisIsComment, {delay: 50});
            await instagram.page.waitForTimeout(1000);
            await instagram.page.click('button[type="Submit"]');
            comments++;
            return comments;
        }
        catch(err){
           console.error('ERROR!!! ' + err);
           errors++;
        }
        await instagram.page.waitForTimeout(2000);
    } else {
        return comments;
    }
}

module.exports = instagram; 