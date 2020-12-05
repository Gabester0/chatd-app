require(`dotenv`).config();
const http = require('http');
const express = require(`express`);
const app = express();
const server = http.createServer(app);
const path = require(`path`);
const publicPath = path.join(__dirname, `../public`)
const socketio = require('socket.io');
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require(`./utils/messages`)
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const Filter = require(`bad-words`)

app.use(express.static(publicPath))

io.on('connection', (socket)=>{
    console.log(`New Web Socket connection`)

    socket.on(`join`, (options, callback)=>{
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error) return callback(error)

        socket.join(user.room)
        //io.to.emit (emit message to a specific room)
        //socket.broadcast.to.emit (broadcast a message to a specific room)
        socket.emit(`message`, generateMessage(`Admin`, `Welcome!`))
        socket.broadcast.to(user.room).emit(`message`, generateMessage(`Admin`, `${user.username} has joined ${user.room}`))

        io.to(user.room).emit(`roomData`, {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on(`sendMessage`, (message, callback)=>{
        const filter = new Filter();
        if(filter.isProfane(message)) return callback(`No bad words allowed!`)
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit(`message`, generateMessage(user.username, message))
            callback(`Message delivered!`)
        }
    })

    socket.on(`sendLocation`, ({latitude, longitude}, callback)=>{
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit(`locationMessage`, generateLocationMessage(user.username, latitude, longitude))
            callback()
        }
    })

    socket.on(`disconnect`, ()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit(`message`, generateMessage(`Admin`, `${user.username} has left`));
            io.to(user.room).emit(`roomData`, {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


app.get(`/`, (req, res)=>{
    res.render('../public/index.html')
})

server.listen(process.env.PORT || 3000, ()=>{
    console.log(`Server is listening on port ${process.env.PORT}`)
})