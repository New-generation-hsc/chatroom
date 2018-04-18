var app = angular.module("chatRoom", []);

app.factory('socket', function($rootScope) {
    var socket = io(); //默认连接部署网站的服务器
    console.log('socket connect to the server');
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() { //手动执行脏检查
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.factory('randomColor', function($rootScope) {
    return {
        newColor: function() {
            return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
        }
    };
});

app.factory('userService', function($rootScope) {
    return {
        get: function(users, receiver) {
            if (users instanceof Array) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].uid === receiver.uid) {
                        return users[i];
                    }
                }
            } else {
                return null;
            }
        }
    };
});

const getGroup = users => {
    if (users instanceof Array) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].tag === "group") {
                return users[i];
            }
        }
        return null;
    } else {
        return null;
    }
}

const getUser = (users, uid) => {
    if (users instanceof Array) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].uid === uid) {
                return users[i];
            }
        }
        return null;
    } else {
        return null;
    }
}


app.controller("chatCtrl", ['$scope', 'socket', 'userService', function($scope, socket, randomColor, userService) {

    $scope.curreceiver = "群聊";
    $scope.publicMessages = []; //群聊消息
    $scope.privateMessages = {}; //私信消息
    $scope.messages = $scope.publicMessages; //默认显示群聊
    $scope.users = []; //

    $scope.scrollToBottom = function() {
        messageWrapper.scrollTop(messageWrapper[0].scrollHeight);
    }

    $scope.postMessage = function() {
        var msg = {
            content: $scope.chatContent,
            from: $scope.self,
            to: $scope.receiver,
            type: "normal",
            position: 'right',
            time : new Date()
        };

        if(msg.content.length === 0) return; // 内容为空

        var rec = $scope.receiver;
        if (rec.tag === "user") { //私信
            if (!$scope.privateMessages[rec.uid]) {
                $scope.privateMessages[rec.uid] = [];
            }
            $scope.privateMessages[rec.uid].push(msg);
        } else { //群聊
            $scope.publicMessages.push(msg);
        }

        $scope.chatContent = "";
        if (rec.uid !== $scope.self.uid) { //排除给自己发的情况
            socket.emit("addMessage", msg);
        }
    }

    $scope.setReceiver = function(receiver) {
        $scope.curreceiver = receiver.nickname;
        $scope.receiver = receiver;
        if (receiver.tag === 'user') { //私信用户
            if (!$scope.privateMessages[receiver.uid]) {
                $scope.privateMessages[receiver.uid] = [];
            }
            $scope.messages = $scope.privateMessages[receiver.uid];
        } else { //广播
            $scope.messages = $scope.publicMessages;
        }
        var usr = getUser($scope.users, receiver.uid);
        usr.hasMessages = 0;
    }

    socket.on('accept', userinfo => {
        $scope.self = userinfo;
    })

    //接收到欢迎新用户消息
    socket.on('userAdded', function(userinfo) {
        $scope.publicMessages.push({ nickname : userinfo.nickname, type: "join" });
        $scope.users.push(userinfo);
    });

    //接收到在线用户消息
    socket.on('allUser', function(data) {
        $scope.users = data;
        $scope.receiver = getGroup(data);
    });

    //接收到用户退出消息
    socket.on('userRemoved', function(data) {

        $scope.publicMessages.push({ nickname : data.nickname, type: "exit" });
        for (var i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].uid == data.uid) {
                $scope.users.splice(i, 1);
                return;
            }
        }
    });

    //接收到新消息
    socket.on('messageAdded', function(data) {

        if (data.to.tag === "user") { //私信
            if (!$scope.privateMessages[data.from.uid]) {
                $scope.privateMessages[data.from.uid] = [];
            }
            $scope.privateMessages[data.from.uid].push(data);
        } else { //群发
            $scope.publicMessages.push(data);
        }
        var fromUser = getUser($scope.users, data.from.uid);
        var toUser = getUser($scope.users, data.to.uid);

        if ($scope.receiver.uid !== data.to.uid) { //与来信方不是正在聊天当中才提示新消息
            if (data.to.tag === "user" && $scope.receiver.uid != data.from.uid) {
                fromUser.hasMessages += 1; //私信
            } else {
                toUser.hasMessages += 1; //群发
            }
        }
    });

}]);
