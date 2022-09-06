from doctest import OutputChecker
import os
import requests
import time
from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import pandas as pd 
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.naive_bayes import MultinomialNB
import joblib
import string
import nltk
from nltk.corpus import stopwords
import pickle
import json
# setting channel list, history, users and users per rooms dictionaries




class MyCustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module ==  "__main__":
            module = "application"
        return super().find_class(module, name)

def text_process(mess):
    """
    Takes in a string of text, then performs the following:
    1. Remove all punctuation
    2. Remove all stopwords
    3. Returns a list of the cleaned text
    """
    # Check characters to see if they are in punctuation
    nopunc = [char for char in mess if char not in string.punctuation]

    # Join the characters again to form the string.
    nopunc = ''.join(nopunc)
    
    # Now just remove any stopwords
    
    return [word for word in nopunc.split() if word.lower() not in stopwords.words('english')]

def predict(info):
    
    # info = ['loged']
	
    with open('model_v01.pkl', 'rb') as f:
        unpickler = MyCustomUnpickler(f)
        spam_model = unpickler.load()
	
    # if request.method == 'POST':
        
        # model = open('spam_model.pkl','rb')
        # spam_model= joblib.load(model)
        	
    message = info
    data = [message]
    # vect = cv.transform(data).toarray()
    my_prediction = spam_model.predict(data)

    return my_prediction

channels=['music', 'fashion', 'books', 'movies','general']
history ={'general':[],'music':[],'fashion':[],'books':[],'movies':[]}
users={}
users_per_rooms={}
predictions= []
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)



# after recieving package on client connect updates data


@socketio.on("welcome")
def welcome(data):
    username=data['username']
    room=data['room']

    upr={username:room}
    print(upr)
    users_per_rooms.update(upr)
    print(users_per_rooms)
    join_room(room)
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')
    sid=request.sid
   # checks if there is a pair username:sid,delete the old pair and append new one
    if username in users:
        del users[username]
    new_pair={username:sid}
    users.update(new_pair)
    print(users)
    print(users_per_rooms)

    print(history)
    #emits wlc event and restr(restore) event to cover history changes per channel
    
    emit('wlc', {"username":username, 'timestamp':timestamp,'users_per_rooms':users_per_rooms, 'channels':channels,'room':room },broadcast=True)

    emit('restr', {"history":history[room],"username":username,'room':room})


@socketio.on('addRoom')
def createRoom(data):
    room=data['room']
    username=data['username']
#after receiving data from client updates channel list and user per room dictionary as well as history
    if room not in channels:
        channels.append(room)
        print(channels)
        new_chanel={room:[]}
        history.update(new_chanel)
        del users_per_rooms[username]
        new_chanel_pair={username:room}
        users_per_rooms.update(new_chanel_pair)
        emit('createRoom', {'room':room, 'username':username, 'users_per_rooms':users_per_rooms}, broadcast=True)

@socketio.on('addUser')
def checkUser(data):
    username=data['username']
    room=data['room']
    oldUser=data['oldUser']
    #adding new username and delete old user
    del users_per_rooms[oldUser]
    newValue={username:room}
    print(newValue)
    users_per_rooms.update(newValue)
    print(users_per_rooms)
    emit('checkUser', {'users_per_rooms':users_per_rooms})



@socketio.on("disconnect")
def quit():
    #identifies user by sid and emits server message on disconnect
    userId =request.sid
    username=[u for (u, sid) in users.items() if userId==sid][0]
    room=users_per_rooms[username]
    print(username)
    leave_room(room)
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')

    del users_per_rooms[username]
    print(users_per_rooms)
    emit('quit_msg', {"username":username, 'timestamp':timestamp, 'room':room,'users_per_rooms':users_per_rooms },room=room)

@socketio.on("msg")
def send_message(data):
    
    post = data['post']
    room=data['room']
    
    output = predict(post)

    result = output[0]
    
    print(result)
    avatarSrc=data['avatarSrc']
    username=data['username']
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')

    if result == 'ham':
        predicts = 'This message is not a spam'

        history[room].append(avatarSrc+"$??$"+username+"$??$" +post+"$??$"+timestamp+"$??$"+result+"$??$"+predicts)
        # print(history)
        #emits data package to be displayed on client side
        emit("send_message", {'post': post, 'predicts': predicts, 'result':result, 'username':username, 'timestamp':timestamp, 'channels':channels, 'avatarSrc':avatarSrc}, room=room)
    else :
        predicts = 'This message was detected as SPAM be careful'

        history[room].append(avatarSrc+"$??$"+username+"$??$" +post+"$??$"+timestamp+"$??$"+result+"$??$"+predicts)
        # print(history)
        #emits data package to be displayed on client side
        emit("send_message", {'post': post, 'predicts': predicts, 'result':result, 'username':username, 'timestamp':timestamp, 'channels':channels, 'avatarSrc':avatarSrc}, room=room)

@socketio.on("user_image")
def send_image(data):
    base64=data['base64']
    userId =request.sid
    room=data['room']
    avatarSrc=data['avatarSrc']
    username=[u for (u, sid) in users.items() if userId==sid][0]
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')
    history[room].append(avatarSrc+"$??$"+username+"$??$" +base64+"$??$"+timestamp)
    #emits converted image to be displayed on client side in a package with other data
    emit("send_image", {'base64':base64, 'username':username, 'timestamp':timestamp,'avatarSrc':avatarSrc},room=room)

@socketio.on("selectRoom")
def roomChange(data):
    #joins user to a new room and leaves the old one
    username=data['username']
    oldRoom=data['oldRoom']
    leave_room(oldRoom)
    room=data['room']
    join_room(room)

    print(room,oldRoom)
    del users_per_rooms[username]
    newValueRoom={username:room}
    print(newValueRoom)
    users_per_rooms.update(newValueRoom)
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')

    print(room)
    print(users_per_rooms)


    emit("wlc", {'username':username,'timestamp':timestamp,'room':room, 'channels':channels,'users_per_rooms':users_per_rooms} , broadcast=True)
    emit("restr", {'history':history[room],'username':username,'room':room,})

@socketio.on("sendGIF")
def gifDisplay(data):
    room=data['room']
    avatarSrc=data['avatarSrc']
    username=data['username']
    imgSrc=data['imgSrc']
    timestamp = time.strftime('%I:%M%p on %b %d, %Y')
    history[room].append(avatarSrc+"$??$"+username+"$??$" +imgSrc+"$??$"+timestamp)
    #emits gif source along with other data in the package
    print(imgSrc)
    emit("gifDisplay", {'username':username,'timestamp':timestamp,'room':room, 'channels':channels,'users_per_rooms':users_per_rooms, 'imgSrc':imgSrc,'avatarSrc':avatarSrc}, room=room)





@app.route("/")
def index():
    
    return render_template("index.html")





if __name__ == '__main__':
    port = int(os.environ.get('PORT', 33507))

    socketio.run(app, debug=True, host='0.0.0.0', port=port)
