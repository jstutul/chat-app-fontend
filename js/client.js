const socket = io("http://localhost:4000/");
const form = document.getElementById("send-container");
const muteButton = document.getElementById("mute");
const messageInput = document.getElementById("messageInp");
const messageContainer = document.querySelector(".container");
const audio = new Audio("./tune.mp3");

const append = (message, position) => {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageElement.classList.add("message");
  messageElement.classList.add(position);
  messageContainer.append(messageElement);
  if (position == "left") {
    audio.play();
  }
};
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  append(`You: ${message}`, "right");
  socket.emit("send", message);
  messageInput.value = "";
});

const name = prompt("Enter your name to join");

var speakingVal = true;

muteButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (speakingVal) {
    speakingVal = false;
  } else {
    speakingVal = true;
  }
});

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: false,
  })
  .then(function (stream) {
    console.log("sp=" + speakingVal);
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    scriptProcessor.onaudioprocess = function () {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const arraySum = array.reduce((a, value) => a + value, 0);
      const average = arraySum / array.length;
      // console.log(Math.round(average));
      socket.emit("speaking", average);
    };
  })
  .catch(function (err) {
    console.log(err);
  });

socket.emit("new-user-join", name);

socket.on("user-join", (name) => {
  append(`${name} join the chat`, "left");
});

socket.on("receive", (data) => {
  append(`${data.name} : ${data.message}`, "left");
});

socket.on("leave", (name) => {
  append(`${name} left the chat`, "left");
});

socket.on("speak", (data) => {
  console.log(`${data.name} is speaking on ${data.spk}`);
});
