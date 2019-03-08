//3대 서버모듈.
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//3000포트가 사용가능하냐를 판단.
var port = process.env.PORT || 4000;

var userNum = 1;
var express = require('express');

var blackarr = []; //흑돌을 넣는 배열
var whitearr = []; //백돌을 넣는 배열
var currentuser;

//get/post. 루트로 접속했을때 request 처리자.
app.get('/', function(req, res){
  //
  res.sendFile(__dirname + '/index.html');
  //location.href= "";
});

app.use('/images', express.static(__dirname+'/img/'));// you can access image using this url: http://localhost:7000/images/abc.jpg

//io전체 대상에 대한 처리.
//eventname, handler. 사용자가 서버에 접속을 요청한 후에.
console.log(io);
io.on('connection', function(socket){//인자 socket은 클라이언트와 소통할 수 있는 창구를 만들어 놓은 객체.
	//이벤트 등록 : 사용자가 호출하는 이벤트.
  socket.on('chat message', function(data){
    io.emit('chat message', data);
    //console.log(userNum);
    console.log(data);
  });

  socket.on('gamestart',function(user){
		blackarr = [];
		whitearr = [];
  });
  //사용자는 .emit('playerset') -> 서버는 .on('playerset') 받는형태.
  socket.on('playerset', function(senduser){//클라이언트로부터 호출됨.
	 //if usercount>2 라면 disconnection 하고 redirect.
   var liList = "";
   for (var i = 1; i <= userNum; i++) {
    liList += "<li>gust-"+ i +"</li>";
   }
   var data = {
     userNum: userNum,
     li : liList
   }
    io.emit('playerset', data);//서버가 클라이언트 호출함.
	userNum = userNum ==1? 2 : 1;
	currentuser = userNum;
	console.log(userNum);
	//임시
	blackarr = [];
		whitearr = [];
  });

  socket.on('click',function(doll){
	  var msg = {
		user : doll.user,
		message : ''
	  }
	 if(blackarr.length==0){ //최초 흑돌이 둘 경우.
		if(doll.user == 2){//백돌이 먼저뒀다면
			msg.message = '자신의 차례가 아닙니다.';
			io.emit('message',msg);//클라이언트에있는 메세지 이벤트호출
			return;//더이상의 진행 막기
		}else{//흑돌이 뒀을때
			currentuser = doll.user;
			blackarr.push(doll.doll); //흑돌의 첫수push(00)
		}
	 }
	 else{ //두번째 뒀을때
		if(currentuser == doll.user){//바로 직전의 유저정보가 지금의 유저정보와 같다면(다시 연속으로 둘 경우 막아야함.)
			msg.message = '이미 두었습니다.';
			io.emit('message',msg);
			return;
		}else{//다른 유저가 뒀을 경우. 백돌.
			if(doll.user == 1){
				blackarr.push(doll.doll);
			}else{
				whitearr.push(doll.doll);
			}
			currentuser = doll.user;
		}
	 }
	 //서버가 .emit(이벤트명) 호출 -> 클라이언트의 .on(이벤트명) 호출.
	io.emit('click',doll); //클릭이벤트 호출해서 돌 생성해
	//iswin check 승리 판단
	if(doll.user == 1){
		isWin(doll.user, blackarr);
	}else{
		isWin(doll.user, whitearr);
	}
	console.log(doll);
  });
});

//수신설정. localhost:3000
http.listen(port, function(){
  console.log('listening on *:' + port);
});


//사용자 정의 함수.
function winPlayer(user){
	var msg = {
		user : user,
		message : '',
		type : 'wincheck'
	  }
	  if(user==1){
		msg.message = 'black 플레이어가 승리했습니다.';
	  }else{
		msg.message = 'white 플레이어가 승리했습니다.';
	  }
	io.emit('message',msg);
}

function isWin(user,arr){
	arr.sort(); //y축기준 정렬 -> x축기준 정렬. 10,77,37,36,42 -> 10,36,37,42,77
	if(arr.length >=5){ //다섯 돌 이상일때만 판단
		var linecount=0; //동일 행판단.
		//0도 판단.
		arr.some(function(item){//배열이 요소를 순회 mdn array, 하나라도 만족한다면 true, every는 모두가 만족할때 true 어쨌든 forEach로 순환해서 break; 해도됨.
			//기준점.
			var srci = item.substring(0,1);//행번호.
			var srcj = item.substring(1,2);//열번호.
			var setWinner = false;
			linecount = 0;
			arr.some(function(item2){
				//기준점과 다음돌 비교.
				var targeti = item2.substring(0,1);
				var targetj = item2.substring(1,2);
				if(srci == targeti && srcj == targetj){
					//첫번째 동일 돌 카운트1.
					linecount = 1;
				}else{
					if(srci == targeti && Math.abs(srcj-targetj)<5){//abs절댓값, 5미만 가까이 있느냐?
						linecount++;
						console.log('0도 linecount:'+linecount);
					}
				}
				if(linecount ==5){ //다섯개의 돌이 한 줄에 있느냐
					winPlayer(user);
					console.log('0도승리');
					setWinner =true;
					return item2;
				}
			});
			if(setWinner)
				return item;
		});

		//90도 판단.
		var linecount=0; //동일 열판단.
		//0도 판단.
		arr.some(function(item){
			//기준점.
			var srci = item.substring(0,1);//행번호.
			var srcj = item.substring(1,2);//열번호.
			var setWinner = false;
			linecount = 0;
			arr.some(function(item2){
				//기준점과 다음돌 비교.
				var targeti = item2.substring(0,1);//비교대상 행번호
				var targetj = item2.substring(1,2);//비교대상 열번호
				if(srci == targeti && srcj == targetj){
					//첫번째 동일 돌 카운트1.
					linecount = 1;
				}else{
					if(Math.abs(srci-targeti)<5 && srcj==targetj ) //열번호는 5미만 가까이 행번호는 5미만 차이
						linecount++;
				}
				if(linecount ==5){
					winPlayer(user);
					console.log('90도승리');
					setWinner =true;
					return item2;
				}
			});
			if(setWinner)//승리했다면 for문빠져나오기
				return item;
		});
		//45도 판단.
		var linecount=0; //45도 판단카운트.
		arr.some(function(item){
			//기준점.
			var srci = item.substring(0,1);//행번호.
			var srcj = item.substring(1,2);//열번호.
			var setWinner = false;
			linecount = 0;
			arr.some(function(item2){
				//기준점과 다음돌 비교.
				var targeti = item2.substring(0,1);
				var targetj = item2.substring(1,2);
				if(srci == targeti && srcj == targetj){
					//첫번째 동일 돌 카운트1.
					linecount = 1;
				}else{
					var stepi=0; //계단차이값 구하기.
					var stepj=0;
					if(srci>targeti && srcj<targetj){ //y는 작아지고 x는커지고 +45도 방향
						stepi = Math.abs(srci - targeti);
						stepj = Math.abs(srcj - targetj);
						if(stepi == stepj && stepi<5)//계단차이값이 똑같고, 그 값이 5 미만일때
							linecount++;
					}
					if(srci<targeti && srcj>targetj){//y는 커지고 x는작아지는 -45도 방향
						stepi = Math.abs(srci - targeti);
						stepj = Math.abs(srcj - targetj);
						if(stepi == stepj && stepi<5)
							linecount++;
					}
				}
				if(linecount ==5){
					winPlayer(user);
					console.log('45도승리');
					setWinner =true;
					return item2;
				}
			});
			if(setWinner)
				return item;
		});

		//135도 판단.
		var linecount=0; //135도 판단카운트.
		arr.some(function(item){
			//기준점.
			var srci = item.substring(0,1);//행번호.
			var srcj = item.substring(1,2);//열번호.
			var setWinner = false;
			linecount = 0;
			arr.some(function(item2){
				//기준점과 다음돌 비교.
				var targeti = item2.substring(0,1);
				var targetj = item2.substring(1,2);
				if(srci == targeti && srcj == targetj){ //-135도 방향
					//첫번째 동일 돌 카운트1.
					linecount = 1;
				}else{
					var stepi=0; //계단차이값 구하기.
					var stepj=0;
					if(srci<targeti && srcj<targetj){// +135도
						stepi = Math.abs(srci - targeti);
						stepj = Math.abs(srcj - targetj);
						if(stepi == stepj && stepi<5) //계
							linecount++;
					}
					if(srci>targeti && srcj>targetj){
						stepi = Math.abs(srci - targeti);
						stepj = Math.abs(srcj - targetj);
						if(stepi == stepj && stepi<5)
							linecount++;
					}
				}
				if(linecount ==5){
					winPlayer(user);
					console.log('135도승리');
					setWinner =true;
					return item2;
				}
			});
			if(setWinner)
				return item;
		});
	}
}
