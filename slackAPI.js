let currentData = new Date();
let unixTs_ms = currentData.getTime();
let unixTs_s = Math.floor(unixTs_ms / 1000);

let currentOldestTs = unixTs_s;
let hasMore = true;
let xhr = null;
let isFirstLoad = true;

let commentBox;

const RESPONSE_NUM = 10;
const TOKEN = "DAMMY";

let userNameMap = new Map();
let weeklyMap = new Map();

weeklyMap.set(0,"日");
weeklyMap.set(1,"月");
weeklyMap.set(2,"火");
weeklyMap.set(3,"水");
weeklyMap.set(4,"木");
weeklyMap.set(5,"金");
weeklyMap.set(6,"土");

function LoadUserNames() {
	let xhr = new XMLHttpRequest();

	xhr.open("GET",
	 `https://slack.com/api/users.list?token=${TOKEN}&pretty=1`,
	  false);
	xhr.send(null);

	let responseTextOnJS = JSON.parse(xhr.responseText);

	responseTextOnJS.members.forEach((value) =>{
		userNameMap.set(value.id, {name : value.real_name, icon : value.profile.image_192});
	});
}

const CHANNEL = "CD5P56K9U";

function LoadMessages() {
	if (!hasMore) return;

	let xhr = new XMLHttpRequest();

	xhr.open("GET",
	 `https://slack.com/api/channels.history?token=${TOKEN}&channel=${CHANNEL}&count=${RESPONSE_NUM}&latest=${currentOldestTs}&pretty=1`,
	  true);
	xhr.send(null);
	
	xhr.onload = (e)=>{
		let responseTextOnJS = JSON.parse(xhr.responseText);

		let messagesLength = responseTextOnJS.messages.length;

		let currentElement = commentBox.childNodes[0];

		for(let i = 0; i < messagesLength; ++i)
		{
			let user = document.createElement("div");

			if ("user" in responseTextOnJS.messages[i])
			{
				user.textContent = userNameMap.get(responseTextOnJS.messages[i].user).name;
			}

			if ("username" in responseTextOnJS.messages[i])
			{
				user.textContent = responseTextOnJS.messages[i].username;
			}

			let isMe = user.textContent == "Harutaka-Tsujino";

			user.classList.add(isMe ? "myUser" : "user");

			if (isMe)
			{
				user.style.zIndex = "-1";
			}

			commentBox.insertBefore(user, commentBox.childNodes[0]);

			let parent = document.createElement("div");
			parent.classList.add(isMe ? "myExpression" : "expression");
			commentBox.insertBefore(parent, user.nextSibling);

			let iconElement = document.createElement("div");

			let iconURL;

			if ("user" in responseTextOnJS.messages[i])
			{
				iconURL = userNameMap.get(responseTextOnJS.messages[i].user).icon;
			}

			if ("username" in responseTextOnJS.messages[i])
			{
				iconURL = "textures/icon_bot.jpg";
			}

			iconElement.style.backgroundImage = `url(${iconURL})`;
			iconElement.style.backgroundSize = "cover";
			iconElement.style.position = "relative";
			iconElement.style.width = iconElement.style.height = "3vw";
			iconElement.style.bottom = "-35vh"
			iconElement.style.borderRadius = "50%";
			iconElement.style.left = (isMe) ? "75.8vw" : "0.3vw";

			if(isMe)
			{
				iconElement.style.zIndex ="-1";
			}

			commentBox.insertBefore(iconElement, user.nextSibling);

			let textBox = document.createElement("div");
			
			textBox.classList.add(isMe ? "myTextBox" : "textBox");

			textBox.innerText = responseTextOnJS.messages[i].text;

			if (textBox.innerText == "")
			{
				textBox.innerHTML = "<br>";
			}

			let timestamp= document.createElement("div");
			timestamp.classList.add("timestamp");

			let unixTs = responseTextOnJS.messages[i].ts;

			if (i == messagesLength - 1)
			{
				currentOldestTs = unixTs;
			}

			let d = new Date(unixTs * 1000);
			let year  = d.getFullYear();
			let month = d.getMonth() + 1;
			let day  = d.getDate();
			let hour = d.getHours() <= 12 ?
			'午前 ' + d.getHours() :
			'午後 ' + (d.getHours() - 12);
			let week = weeklyMap.get(d.getDay());
			let min  = ('0' + d.getMinutes()).slice(-2);
			let sec  = ('0' + d.getSeconds()).slice(-2);

			timestamp.innerHTML = `${month},${day}(${week})<br>${hour}:${min}`;

			if (isMe)
			{
				parent.appendChild(timestamp);
			}

			parent.appendChild(textBox);

			if (!isMe)
			{
				parent.appendChild(timestamp);
			}

			if (i == messagesLength - 1)
			{
				if (isFirstLoad)
				{
					commentBox.scroll(0, commentBox.scrollHeight);

					isFirstLoad = false;

					break;
				}

				currentElement.scrollIntoView();
			}
		}

		hasMore = responseTextOnJS.has_more;
	};
};

window.onload = ()=>{
	LoadUserNames();
	LoadMessages();

	commentBox = document.getElementById("commentBox");

	commentBox.onscroll = ()=>{
		if (commentBox.scrollTop !== 0) return;
		LoadMessages();
	};

	let inputArea = document.getElementById("inputArea");

	inputArea.onkeydown = (e)=>{
		if (e.code != "Enter") return true;
		
		if (e.ctrlKey)
		{
			inputArea.value += "\n";

			return true;
		}

		let xhr = new XMLHttpRequest();

		xhr.open("GET",
		`https://slack.com/api/chat.postMessage?token=${TOKEN}&channel=${CHANNEL}&text=${inputArea.value}&pretty=1`,
		false);
		xhr.send(null);

		inputArea.value = "";

		return false;
	};
};
