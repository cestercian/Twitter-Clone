import {v4 as uuidv4} from 'https://jspm.dev/uuid';
import {initializeApp} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {getDatabase, ref, push, onValue, update} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase Configuration
const appSettings = {
    databaseURL: "https://playground-9dce7-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const tweetsRef = ref(database, "tweets");

// DOM Elements
const tweetInput = document.getElementById('tweet-input');
const feedContainer = document.getElementById('feed');

// Global Variable to Store Tweets
let tweets = [];

// Real-Time Listener for Tweets
onValue(tweetsRef, (snapshot) => {
    if (snapshot.exists()) {
        tweets = Object.entries(snapshot.val())
            .map(([id, data]) => ({id, ...data}))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort tweets by timestamp (newest first)
    } else {
        tweets = [];
    }
    render();
});

// Event Listener for Button Clicks
document.addEventListener('click', (e) => {
    if (e.target.dataset.like) {
        handleLikeClick(e.target.dataset.like);
    } else if (e.target.dataset.retweet) {
        handleRetweetClick(e.target.dataset.retweet);
    } else if (e.target.dataset.reply) {
        toggleReplyBox(e.target.dataset.reply);
    } else if (e.target.id === 'tweet-btn') {
        handleTweetBtnClick();
    } else if (e.target.dataset.replyBtn) {
        handleReplyBtnClick(e.target.dataset.replyBtn);
    }
});

// Handle Like Click
function handleLikeClick(tweetId) {
    const targetTweet = tweets.find(tweet => tweet.id === tweetId);
    if (targetTweet) {
        const updates = {
            isLiked: !targetTweet.isLiked,
            likes: targetTweet.isLiked ? targetTweet.likes - 1 : targetTweet.likes + 1
        };
        update(ref(database, `tweets/${tweetId}`), updates);
    }
}

// Handle Retweet Click
function handleRetweetClick(tweetId) {
    const targetTweet = tweets.find(tweet => tweet.id === tweetId);
    if (targetTweet) {
        const updates = {
            isRetweeted: !targetTweet.isRetweeted,
            retweets: targetTweet.isRetweeted ? targetTweet.retweets - 1 : targetTweet.retweets + 1
        };
        update(ref(database, `tweets/${tweetId}`), updates);
    }
}

// Toggle Reply Box
function toggleReplyBox(tweetId) {
    document.getElementById(`replies-${tweetId}`).classList.toggle('hidden');
}

// Handle New Tweet Submission
function handleTweetBtnClick() {
    if (tweetInput.value) {
        push(tweetsRef, {
            handle: `@Yash`,
            profilePic: `overflow.png`,
            likes: 0,
            retweets: 0,
            tweetText: tweetInput.value,
            replies: [],
            isLiked: false,
            isRetweeted: false,
            timestamp: Date.now(), // Add timestamp to enable sorting
            uuid: uuidv4()
        });
        tweetInput.value = '';
    }
}

// Handle Reply Submission
function handleReplyBtnClick(tweetId) {
    const replyInput = document.querySelector(`[data-tweet-id="${tweetId}"]`);
    if (replyInput && replyInput.value) {
        const targetTweet = tweets.find(tweet => tweet.id === tweetId);
        if (targetTweet) {
            const updatedReplies = targetTweet.replies || [];
            updatedReplies.push({
                handle: `@Yash`,
                profilePic: `overflow.png`,
                tweetText: replyInput.value
            });
            update(ref(database, `tweets/${tweetId}`), {replies: updatedReplies});
            replyInput.value = '';
        }
    }
}

// Generate HTML for Tweets
function getFeedHtml() {
    return tweets.map(tweet => `
        <div class="tweet">
            <div class="tweet-inner">
                <img src="${tweet.profilePic}" class="profile-pic" alt="">
                <div>
                    <p class="handle">${tweet.handle}</p>
                    <p class="tweet-text">${tweet.tweetText}</p>
                    <div class="tweet-details">
                        <span class="tweet-detail">
                            <i class="fa-regular fa-comment-dots" data-reply="${tweet.id}"></i>
                            ${tweet.replies?.length || 0}
                        </span>
                        <span class="tweet-detail">
                            <i class="fa-solid fa-heart ${tweet.isLiked ? 'liked' : ''}" data-like="${tweet.id}"></i>
                            ${tweet.likes || 0}
                        </span>
                        <span class="tweet-detail">
                            <i class="fa-solid fa-retweet ${tweet.isRetweeted ? 'retweeted' : ''}" data-retweet="${tweet.id}"></i>
                            ${tweet.retweets || 0}
                        </span>
                    </div>   
                </div>            
            </div>
            <div class="hidden" id="replies-${tweet.id}">
                ${tweet.replies?.map(reply => `
                    <div class="tweet-reply">
                        <div class="tweet-inner">
                            <img src="${reply.profilePic}" class="profile-pic" alt="">
                            <div>
                                <p class="handle">${reply.handle}</p>
                                <p class="tweet-text">${reply.tweetText}</p>
                            </div>
                        </div>
                    </div>
                `).join('') || ''}
                <textarea placeholder="Wanna Reply" data-tweet-id="${tweet.id}"></textarea>
                <button data-reply-btn="${tweet.id}">Reply</button>
            </div> 
        </div>
    `).join('');
}

// Render Tweets
function render() {
    feedContainer.innerHTML = getFeedHtml();
}
