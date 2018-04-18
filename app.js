var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const uuidv4 = require('uuid/v4');

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendfile('index.html');
});

var connectedSockets={};
var allUsers=[{nickname:"群聊", avatar: '/assets/avatar/cute.jpg', uid : uuidv4(), tag: 'group', hasMessages : 0}];//初始值即包含"群聊",用""表示nickname

const static_img_resource = [
'/assets/avatar/beautify.jpg',
'/assets/avatar/cute.jpg',
'/assets/avatar/dog.jpg',
'/assets/avatar/fish.jpg',
'/assets/avatar/girl.jpg',
'/assets/avatar/laptop.jpg',
'/assets/avatar/mountains.jpg',
'/assets/avatar/woman.jpg'
]

const static_nickname_resource = [
'金色天际线','星辰大海','半夏轻浅','时光恋人','朱颜古巷','月下扬眉'
]

const randomUserInfo = () => {
    var avatar_img = static_img_resource[Math.floor(Math.random() * static_img_resource.length)];
    var username = static_nickname_resource[Math.floor(Math.random() * static_nickname_resource.length)];
    return {
        avatar : avatar_img,
        nickname : username
    }
}

io.on('connection',function(socket){

    socket.on('addMessage',function(data){ //有用户发送新消息
        data.position = 'left';
        if(data.to.tag === "user"){//发给特定用户
            connectedSockets[data.to.uid].emit('messageAdded',data);
        }else{//群发
            socket.broadcast.emit('messageAdded',data);//广播消息,除原发送者外都可看到
        }
    });

    socket.on('disconnect', function () {  //有用户退出聊天室
            socket.broadcast.emit('userRemoved', {  //广播有用户退出
                nickname: socket.nickname,
                uid : socket.uid
            });
            for(var i=0;i<allUsers.length;i++){
                if(allUsers[i].uid==socket.uid){
                    allUsers.splice(i,1);
                }
            }
            delete connectedSockets[socket.uid]; //删除对应的socket实例
        }
    );

    socket.uid = uuidv4();
    var userinfo = randomUserInfo();
    socket.nickname = userinfo.nickname;
    socket.avatar = userinfo.avatar;

    connectedSockets[socket.uid] = socket;
    userinfo.uid = socket.uid;
    userinfo.tag = 'user';
    userinfo.hasMessages = 0;
    allUsers.push(userinfo);

    socket.emit('accept', userinfo);
    socket.broadcast.emit('userAdded', userinfo);
    socket.emit("allUser", allUsers);
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});