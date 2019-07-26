let currentData = new Date();
let oldestTs = Math.floor(currentData.getTime() / 1000);

let xhr = new XMLHttpRequest();
const RESPONSE_NUM = 10;
let hasMore = true;
let isFirstLoad = true;

const CHANNEL = "CB74M5Y6B";
const TOKEN = "DAMMY";

let commentBox;

let userNameMap = new Map();

let weeklyMap = ["日", "月", "火", "水", "木", "金", "土"];

const LoadUserNames = () => {
	xhr.open("GET",
		`https://slack.com/api/users.list?token=${TOKEN}&pretty=1`,
		false);
	xhr.send(null);

	let responseTextOnJS = JSON.parse(xhr.responseText);

	responseTextOnJS.members.forEach((value) => {
		userNameMap.set(value.id, { name: value.real_name, icon: value.profile.image_192 });
	});
};

const IsNotBot = (message) => {
	return "user" in message;
};

const HideElement = (element) => {
	element.style.zIndex = "-1";
};

const InsertUserNameAndGetIsMe = (message, userDiv) => {
	userDiv.textContent = (IsNotBot(message)) ? userNameMap.get(message.user).name : message.username;

	let isMe = userDiv.textContent == "Harutaka-Tsujino";

	userDiv.classList.add(isMe ? "myUser" : "user");

	if (isMe) HideElement(userDiv);

	commentBox.insertBefore(userDiv, commentBox.childNodes[0]);

	return isMe;
};

const InsertExpression = (expressionDiv, userDiv, isMe) => {
	expressionDiv.classList.add(isMe ? "myExpression" : "expression");

	commentBox.insertBefore(expressionDiv, userDiv.nextSibling);
};

const InsertIcon = (message, iconDiv, userDiv, isMe) => {
	let iconURL = IsNotBot(message) ? userNameMap.get(message.user).icon : "textures/icon_bot.jpg";

	iconDiv.classList.add("icon");
	iconDiv.style.backgroundImage = `url(${iconURL})`;
	iconDiv.style.left = (isMe) ? "75.8vw" : "0.3vw";

	if (isMe) HideElement(iconDiv);

	commentBox.insertBefore(iconDiv, userDiv.nextSibling);
};

const InitializeTextBoxDiv = (message, textBoxDiv, isMe) => {
	textBoxDiv.classList.add(isMe ? "myTextBox" : "textBox");
	textBoxDiv.innerText = message.text;

	if (textBoxDiv.innerText == "") textBoxDiv.innerHTML = "画像";
};

const InitializeTimeStamp = (isLastMessage, message, timestampDiv) => {
	timestampDiv.classList.add("timestamp");

	let unixTs = message.ts;

	if (isLastMessage) oldestTs = unixTs;

	let d = new Date(unixTs * 1000);
	let month = d.getMonth() + 1;
	let day = d.getDate();

	const HALF_HOUR = 12;
	let hour = d.getHours() <= HALF_HOUR ?
		'午前 ' + d.getHours() :
		'午後 ' + (d.getHours() - HALF_HOUR);
	let week = weeklyMap[d.getDay()];
	let min = ('0' + d.getMinutes()).slice(-2);

	timestampDiv.innerHTML = `${month},${day}(${week})<br>${hour}:${min}`;
};

const InsertTimestampAndTextBoxDivs = (timestampDiv, textBoxDiv, expressionDiv, isMe) => {
	let timestampAndTextBoxDivs = [ timestampDiv, textBoxDiv ];

	if (!isMe) timestampAndTextBoxDivs.reverse();

	timestampAndTextBoxDivs.forEach((value) => {
		expressionDiv.appendChild(value);
	});
};

const AddMessage = (e) => {
	let responseTextOnJS = JSON.parse(xhr.responseText);

	responseTextOnJS.messages.forEach((message, index, messages) => {
		let userDiv = document.createElement("div");
		let isMe = InsertUserNameAndGetIsMe(message, userDiv);

		let expressionDiv = document.createElement("div");
		InsertExpression(expressionDiv, userDiv, isMe);

		let iconDiv = document.createElement("div");
		InsertIcon(message, iconDiv, userDiv, isMe);

		let textBoxDiv = document.createElement("div");
		InitializeTextBoxDiv(message, textBoxDiv, isMe);
	
		let messagesLength = messages.length;
		let isLastMessage = index == messagesLength - 1

		let timestampDiv = document.createElement("div");
		InitializeTimeStamp(isLastMessage, message, timestampDiv);

		InsertTimestampAndTextBoxDivs(timestampDiv, textBoxDiv, expressionDiv, isMe);

		if (!isLastMessage) return;
		
		let currentElement = commentBox.childNodes[messagesLength];

		currentElement.scrollIntoView();
		
		if (!isFirstLoad) return;
		isFirstLoad = false;
		
		commentBox.scroll(0, commentBox.scrollHeight);
	});

	hasMore = responseTextOnJS.has_more;
};

const LoadMessages = () => {
	if (!hasMore) return;

	xhr.open("GET",
		`https://slack.com/api/channels.history?token=${TOKEN}&channel=${CHANNEL}&count=${RESPONSE_NUM}&latest=${oldestTs}&pretty=1`,
		true);
	xhr.send(null);

	xhr.onload = AddMessage;
};

const OnkeyDownInTextArea = (e) => {
	if (e.code != "Enter") return true;

	if (e.isComposing) return true;

	if (e.ctrlKey) {
		var allText = inputArea.value;
		var cursorPos = inputArea.selectionStart;
		var cursorFrontText = allText.substr(0, cursorPos);
		var cursorBehindText = allText.substr(cursorPos, allText.length);
		inputArea.value = cursorFrontText + "\n" + cursorBehindText;

		inputArea.selectionStart = cursorPos + 1;
		inputArea.selectionEnd = cursorPos + 1;

		return true;
	}

	xhr = new XMLHttpRequest();

	xhr.open("GET",
		`https://slack.com/api/chat.postMessage?token=${TOKEN}&channel=${CHANNEL}&text=${inputArea.value}&username=HarBot&pretty=1`,
		false);
	xhr.send(null);

	inputArea.selectionStart = 0;
	inputArea.selectionEnd = 0;
	inputArea.value = "";

	return false;
};

window.onload = () => {
	LoadUserNames();
	LoadMessages();

	commentBox = document.getElementById("commentBox");

	commentBox.onscroll = () => {
		if (commentBox.scrollTop !== 0) return;
		LoadMessages();
	};

	let inputArea = document.getElementById("inputArea");

	inputArea.onkeydown = OnkeyDownInTextArea;
};
