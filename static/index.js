window.onbeforeunload = ()=>{
     window.sessionStorage.clear();
}

document.addEventListener("DOMContentLoaded", () => {
  // Connect to websocket
  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );
	
//check if there's an avatar pic in local storage
	
  if (window.localStorage.getItem('avatar') != null){
  var avatarSrc=window.localStorage.getItem('avatar');
  document.getElementById('inputAvatarLabel').style.backgroundImage="url("+avatarSrc+")"
}else{

    window.localStorage.setItem('avatar', 'https://cdn1.iconfinder.com/data/icons/ordinary-people/512/music-512.png')}

//resize images and convert to base64	
	
  function resize(image, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0, width, height);
    const resFile = ctx.canvas.toDataURL("image/jpeg", quality);

    return resFile;
  }

// fetching gifs from Tenor using public key, append them to container div and assign onclick event-clears div after event is trigerred 
	
  function getGifs(value){
        let urlGIF = `https://api.tenor.com/v1/search?q=${value}&key=V413C22P4CZD&limit=9&anon_id=3a76e56901d740da9e59ffb22b988242`;
         console.log(urlGIF)
  	  fetch(urlGIF)

          .then((res) => res.json())
          .then((data) => {
  		for ( var i=0;i<9; i++){
              imgSRC=data["results"][i]["media"][0]["nanogif"]['url']
  		   console.log(imgSRC)
  		    let img= document.createElement('img')
  			img.src=imgSRC
  			img.setAttribute('class', 'searchGIFS')
  			img.width = "50";
  			img.height="50";
            document.querySelector('#gifs').appendChild(img)
  		    document.querySelector('#divGIF').appendChild(document.querySelector('#gifs'))
  			img.onclick=sendGIFToServer;




             }

          })
         .catch((error) => console.log(error));
      }

      function clearGIFS (){
          document.querySelector('#gifs').innerHTML='';
      }

//emits selected gif's src to a server
	
      function sendGIFToServer (){

      		imgSrc=this.src
      		let username = window.localStorage.getItem('username')
            let room = window.localStorage.getItem('room')
            if (window.localStorage.getItem('avatar') != null){
            var avatarSrc=window.localStorage.getItem('avatar');}
            socket.emit("sendGIF", {imgSrc:imgSrc, username:username, room:room, avatarSrc:avatarSrc})
      		clearGIFS();
      };
// packing data for displaying on chat log

  function package (data ){
  const divChat = document.createElement("li");
  divChat.className='chat';
  document.querySelector("ul").appendChild(divChat);

  const divAvatar = document.createElement("div");
  divAvatar.className = "avatar";
  if (data.avatarSrc !=null){
      divAvatar.style.backgroundImage="url("+data.avatarSrc+")"}
  divChat.appendChild(divAvatar);

  const divUser = document.createElement('p');
  divUser.className ='user';
  divUser.innerHTML=`${data.username}`
  divChat.appendChild(divUser);

  
  if (data.predicts !=null){

     if (data.result === "ham"){

      const divMessage = document.createElement("p");
      divMessage.className = "chat-ham";
      divMessage.innerHTML =` ${data.predicts}`;
      divChat.appendChild(divMessage);
     }

     else {
      const divMessage = document.createElement("p");
      divMessage.className = "chat-spam";
      divMessage.innerHTML =` ${data.predicts}`;
      divChat.appendChild(divMessage);
     }
   }

   
  if (data.post !=null){
    const divMessage = document.createElement("p");
    divMessage.className = "chat-message";
    divMessage.innerHTML =` ${data.post}`;
    divChat.appendChild(divMessage);
    
    }
  
  
  // const divWrap = document.createElement("div");
  // divWrap.className = "chat-message";
  // divChat.appendChild(divWrap);
  
    // if (data.predicts !=null){
  //   const divSpam = document.createElement("p");
  //   divSpam.className = "chat-spam";
  //   divSpam.innerHTML =` ${data.predicts}`;
  //   divWrap.appendChild(divSpam);
  //   }

  // if (data.post !=null){
  //   const divMessage = document.createElement("p");
  //   divMessage.className = "chat-messages";
  //   divMessage.innerHTML =` ${data.post}`;
  //   divWrap.appendChild(divMessage);
  
  // }

 

  if (data.base64!=null){
  const divImage = document.createElement("p");
  divImage.className = "chat-img";
  divImage.innerHTML = `${'<img src="' + data.base64 + '"/>'} `;
  divChat.appendChild(divImage);
  }

  if (data.imgSrc!=null){
   const divImage = document.createElement("p");
   divImage.className = "chat-img";
   divImage.innerHTML = `${'<img src="' + data.imgSrc + '"/>'} `;
   divChat.appendChild(divImage);
   }

   const divTime= document.createElement('p');
   divTime.className ='time';
   divTime.innerHTML=`${data.timestamp}`
   divChat.appendChild(divTime);
   document.querySelector('.chatlogs').scrollTop=document.querySelector('.chatlogs').scrollHeight;
  }

//emits selected channel info	
	
function settingRoom(){
    const changeRoom =this.name;
    const oldRoom=window.localStorage.getItem('room');
    console.log(this.innerText);
    var username=localStorage.getItem('username')
    console.log(username)
    document.querySelector('#h3').innerHTML='#'+changeRoom;

    window.localStorage.setItem('room',changeRoom)
    socket.emit('selectRoom', {username:username, room:changeRoom, oldRoom:oldRoom})
}

//listening for a click event on change user button-changes username and emits data to a server	
	
  document.querySelector('#inputUserButton').addEventListener('click', ()=>{
      let oldUser=window.localStorage.getItem('username');
      let newUser = document.querySelector('#post-username').value ;
      let room= window.localStorage.getItem('room');
      socket.emit("addUser", {username:newUser, room:room, oldUser:oldUser})
      document.querySelector('#post-username').value='';
      window.localStorage.setItem('username', newUser);

  })
	
//stores an array with users:rooms pairs to a local storage
	
socket.on("checkUser", (data)=>{
    window.localStorage.setItem('userPerRoom', JSON.stringify(data.users_per_rooms));
})

// on room change or connect assigns a badge with number that represents connected users per channel
	
socket.on("roomChange", (data)=>{
    window.localStorage.setItem('userPerRoom', JSON.stringify(data.users_per_rooms));
    document.querySelectorAll('.ch-button').forEach (function(button){

        var buttonValue = button.innerText
        console.log(button.innerText)
        var users =Object.values(data.users_per_rooms);
        if(button.contains(button.querySelector('span'))){
        button.removeChild(button.querySelector('span'))}

        console.log(users);

        if(users.indexOf(buttonValue)!=-1){
        var numberOfUsers =
        users.filter(function(value){
        return value === buttonValue;}).length;
        let badge=document.createElement('span')
        badge.className='badge badge-light';
        badge.innerHTML=numberOfUsers;
        button.appendChild(badge);
                    }


});
});

//adding newroom that is not on default rooms list and emits data

  socket.on("connect", () => {
const inputChannel =document.querySelector('#post-channel');
document.getElementById("inputChannelButton").addEventListener("click", e => {
     e.stopPropagation();
        const newRoom = inputChannel.value;
        console.log(newRoom)


          const username = window.localStorage.getItem("username");
          if (inputChannel.value !=''){

         socket.emit("addRoom", {username: username, room :newRoom });
         inputChannel.value =''
    }

});
});

//on coonect checks if there's dat in local sorage and if it's not assigns guest name with random number -emits data to a server

  socket.on("connect", () => {
    if (window.localStorage.getItem("username") !== null) {
      var username = window.localStorage.getItem("username");
      const wMessage = document.createElement("li");
      wMessage.className='server-message';

      var room = window.localStorage.getItem("room");
      wMessage.innerHTML = "Welcome back " + username + "!";
      document.querySelector("#chat-wrp").appendChild(wMessage);
      document.querySelector("#h3").innerHTML = "#" + room;
  }

      else {
      var guest = "Guest" + Math.floor(Math.random() * 10000 + 5000);
      window.localStorage.setItem("username", guest);
      var username = window.localStorage.getItem("username");
      const info = document.createElement("li");
      var room = "general";
      window.localStorage.setItem("room", room);

      info.innerHTML =
        "You are now connected as:  " +
        username +
        ", on channel --"+ room+ "! You can set new username or channel";
      document.querySelector("#chat-wrp").appendChild(info);
      document.querySelector("#h3").innerHTML = "#" + room;
  };
    socket.emit("welcome", { username: username, room: room });
  });

//listens to a click event of an emoji buttons container -the choice is displayed on input message field

  socket.on("connect", () => {
       const input = document.getElementById("input-message");
       document.querySelectorAll('.emoji').forEach(function(button) {
              button.onclick = function(e) {
              e.stopPropagation();
              console.log(input.value);
              input.value +=  String.fromCodePoint(button.dataset.value);
              }
       });
    document.getElementById("input-send").addEventListener("click", e => {
      e.preventDefault();


      if (window.localStorage.getItem('avatar') != null){
      var avatarSrc=window.localStorage.getItem('avatar');}

          const post = input.value;
          var predicts
          var result
          console.log(post);
          let room = window.localStorage.getItem("room");
          const username = window.localStorage.getItem("username");
          if (input.value !=''){
              console.log(avatarSrc);
          socket.emit("msg", { post: post, predicts: predicts, result: result, username: username, room: room, avatarSrc:avatarSrc });
      }
          document.getElementById("input-message").value = "";
      });
  });

//displays welcome message to a channel and reviews channel list with number of users per channel
	
  socket.on("wlc", data => {
      document.querySelector('#newItem').innerHTML="";
      window.localStorage.setItem('userPerRoom', JSON.stringify(data.users_per_rooms));
      var users_per_rooms =JSON.parse(window.localStorage.getItem('userPerRoom'))
      const divChat = document.createElement("li");
      divChat.className = "chat";
      document.querySelector("ul").appendChild(divChat);
      const span = document.createElement("p");
      span.className = "server-message";
      span.innerHTML = `${data.timestamp}: ${
      data.username
      } connected on channel ${data.room}`;
      divChat.appendChild(span);
      console.log(data.channels)



     for (i =0; i<data.channels.length;i++){
         var channelButton = document.createElement('button');
         console.log(i)
         channelButton.className='ch-button form-control';
         channelButton.innerHTML=data.channels[i];
         channelButton.name =data.channels[i];
         console.log(data.channels[i])
         document.getElementById('newItem').appendChild(channelButton);
         var users =Object.values(users_per_rooms);


         if(users.indexOf(data.channels[i])!=-1){
         var numberOfUsers =
         users.filter(function(value){
         return value === data.channels[i];}).length;
         let badge= document.createElement('span');
         badge.innerHTML=numberOfUsers;

         badge.className='badge';
         channelButton.appendChild(badge);
     }


         channelButton.onclick = settingRoom;


     }

    window.localStorage.setItem('userPerRoom', JSON.stringify(data.users_per_rooms));
  });

//displays data from server - create new room appendnew button to a channel list
	
socket.on("createRoom", data=>{
    var channelButton =document.createElement('button');
    channelButton.className='ch-button form-control';
    channelButton.innerHTML=data.room;
    console.log(data.room);
    channelButton.onclick = settingRoom;
    document.querySelector('#newItem').appendChild(channelButton);
})

//displays gifs upon input 

document.querySelector('#searchGIFButton').addEventListener('click', (e)=>{
         e.stopPropagation();
         var value=document.querySelector('#searchGIF').value
		 if (value!=""){
		 clearGIFS()
		 getGifs(value)
		 
		 }
});

//displays default gif search - trending
	
document.querySelector('#GIF').addEventListener('click', (e)=>{

				if (document.querySelector('#searchGIF').value==''){
				var value="trending"
		 } else{var value = document.querySelector('#searchGIF').value}
					clearGIFS();
					getGifs(value);



});


//calls package function to diplay gif recieved ftom server

socket.on("gifDisplay", data => {

      package(data);

});

//calls package function to display message recieved from server	
	
  socket.on("send_message", data => {
    if (data.post !=''){
        package(data);
    }
  });

//listens to click event on get image button, calls resize function and sends data to a server	
	
  socket.on("connect", () => {
    document.getElementById("imagefile").addEventListener("change", e => {

      let room = window.localStorage.getItem("room");
      var file = e.target.files[0];
      var reader = new FileReader();

      reader.readAsDataURL(e.target.files[0]);
      reader.onload = function(evt) {
        const img = new Image();
        img.src = evt.target.result;
        var mock = img.src;

        img.onload = () => {
          image = new Image();
          image.src = mock;
          var base64 = resize(image, 150, 100, 0.6);
          if (window.localStorage.getItem('avatar') != null){
          var avatarSrc=window.localStorage.getItem('avatar');}
          socket.emit("user_image", { base64: base64, room: room,avatarSrc:avatarSrc });
        };
      };
    });
  });

// calling package function to display image recieved from server	
	
  socket.on("send_image", data => {

      package(data);

  });

//listens to a click event on change color sheme buttons and calls change color sheme function

  document.querySelectorAll('.navLabel').forEach(function(button){
  	
  	button.onclick= changeColorSheme;

  });
// stores color codes in arrays for different shemes and assigns color properties to elements
	
  function changeColorSheme(button){
  	const Red= new Array('#FFDEDB','#FE8176','#FE2712','#A70F01','#340D09')
  	const Blue= new Array('#DBE5FF','#678FFE','#0247FE','#012998','#091534')
  	const Grey= new Array('#F5F7F8','#8BA6B1','#55737F','#2D3D43','#172429')
  	const colorShemas= {'red':Red, 'blue':Blue, 'grey':Grey}
  	console.log(this.name)

  	colorSelector=colorShemas[this.name]
  	document.body.style.backgroundColor=colorSelector[0];
  	document.querySelector('.chatbox').style.backgroundColor=colorSelector[3];
    document.querySelector('.chatlogs').style.backgroundColor=colorSelector[1]
    document.querySelector('#input-send').style.backgroundColor=colorSelector[2]
  	document.querySelector('.buttons').style.backgroundColor=colorSelector[3]
  	 var y =document.getElementsByClassName('btn')
        for( var i=0; i<y.length;i++){
        y[i].style.backgroundColor=colorSelector[3];
        y[i].style.color=colorSelector[0]}

        var x =document.getElementsByClassName('dropdown')
           for( var i=0; i<x.length;i++){
           x[i].style.backgroundColor=colorSelector[3];
           x[i].style.color=colorSelector[0]}

        var z =document.getElementsByClassName('emoji')
           for( var i=0; i<z.length;i++){
           z[i].style.backgroundColor=colorSelector[1];
           z[i].style.color=colorSelector[0]}


        var t =document.getElementsByClassName('form-control')
              for( var i=0; i<t.length;i++){
              t[i].style.backgroundColor=colorSelector[3];
              t[i].style.color=colorSelector[0]}
  		}






//listens on a click event of avatar label opens file select menu and calls resize function on selected avatar image

document.getElementById('inputAvatar').addEventListener('change', e =>{
    var file = e.target.files[0],
      reader = new FileReader();

    reader.readAsDataURL(e.target.files[0]);
    reader.onload = function(evt) {
      const img = new Image();
      img.src = evt.target.result;
      var mock = img.src;

      img.onload = () => {
        image = new Image();
        image.src = mock;
        var avatarSrc = resize(image, 50, 50, 0.5);
        document.getElementById('inputAvatarLabel').style.backgroundImage="url("+avatarSrc+")"
        window.localStorage.setItem('avatar', avatarSrc);
    };
};
});

// restores data from selected room recieved from a server

socket.on("restr", data => {


  document.querySelector('#chat-wrp').innerHTML='';

  var history = data.history;
  var histLength = history.length;
  var username =data.username;
  var room =data.room;

  for (var i = 0; i < histLength; i++) {

        var historySplit=history[i].split("$??$");

    var divChat = document.createElement("li");
    divChat.className = "chat";
    document.querySelector("ul").appendChild(divChat);



    var divAvatar = document.createElement("div");
    divAvatar.className = "avatar";
    if(historySplit[1]!=window.localStorage.getItem('username')){
    divAvatar.style.backgroundImage="url("+historySplit[0]+")"}
    else{divAvatar.style.backgroundImage="url("+(window.localStorage.getItem('avatar'))+")"}
    divChat.appendChild(divAvatar);

    var divUsername = document.createElement("p");
    divUsername.className = "user";
    divUsername.innerHTML = historySplit[1];
    divChat.appendChild(divUsername);

    if ((historySplit[2].includes("data:image/jpeg;base64")||(historySplit[2].includes("https://media.tenor.com")))) {


        var divMessage = document.createElement("p");
        divMessage.className = "chat-img";
        divChat.appendChild(divMessage);
        divMessage.innerHTML = `${'<img src="' + historySplit[2] + '"/>'}`;
    }
    else  {
         
      

        if (historySplit[4] === "ham"){
   
         const divMessage = document.createElement("p");
         divMessage.className = "chat-ham";
         divChat.appendChild(divMessage);
         divMessage.innerHTML = historySplit[5];
         
        }
   
        else {
         const divMessage = document.createElement("p");
         divChat.appendChild(divMessage);
         divMessage.className = "chat-spam";
         divMessage.innerHTML =historySplit[5];
      
        }
      

      var divMessage = document.createElement("p");
      divMessage.className = "chat-message";
      divChat.appendChild(divMessage);
      //divMessage.appendChild(divTimestamp)
      divMessage.innerHTML =historySplit[2];

        // var divMessage = document.createElement("p");
        // divMessage.className = "chat-spam";
        // divChat.appendChild(divMessage);
        // //divMessage.appendChild(divTimestamp)
        // divMessage.innerHTML =historySplit[4];

    }
    const divTimestamp = document.createElement("p");
    divTimestamp.className = "time";
    divChat.appendChild(divTimestamp);
    divTimestamp.innerHTML = historySplit[3];
    document.querySelector('.chatlogs').scrollTop=document.querySelector('.chatlogs').scrollHeight;



}
var li = document.createElement("li");
li.className = "server-message";
li.innerHTML = `Welcome ${data.username} to channel ${data.room}!`;

document.querySelector("ul").appendChild(li);

});

	
// sends message about user leaving room	
socket.on("disconnect", () => {
  let username = window.localStorage.getItem("username");
  let room = window.localStorage.getItem("room");
  socket.emit("disconnect", { username: username, room: room });
});
//displays message about user leaving room
	
socket.on("quit_msg", data => {
  const li = document.createElement("li");
  li.className = "server-message";
  li.innerHTML = `${data.timestamp}: ${data.username} disconnected`;

  document.querySelector("ul").appendChild(li);
});



});
