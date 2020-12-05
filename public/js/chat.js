const socket = io()

// Elements
const $messageForm = document.getElementById(`message-form`)
const $messageFormInput = document.getElementById(`messageInput`)
const $messageFormButton = document.getElementById(`submit`)
const $locationButton = document.getElementById(`location`)
const $messages = document.getElementById(`messages`);

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

// Options
const {username, room}= Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = containerHeight + newMessageHeight
    }

}

socket.on(`message`, (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format(`hh:mm a`)
    })
    $messages.insertAdjacentHTML(`beforeend`, html)
    autoScroll()
})

socket.on(`locationMessage`, (location)=>{
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format(`hh:mm a`)
    })
    $messages.insertAdjacentHTML(`beforeend`, html)
})

socket.on(`roomData`, ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector(`.chat__sidebar`).innerHTML = html
})

document.getElementById('message-form').addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute(`disabled`, `disabled`);
    //disable form
    const clientMessage = e.target.elements.message.value;
    socket.emit('sendMessage', clientMessage, (error)=>{
        //Re-enable form
        $messageFormButton.removeAttribute(`disabled`)
        $messageFormInput.value = ``;
        $messageFormInput.focus();
        if(error) return console.log(error)
        console.log(`The message was delivered`)
    })
})

$locationButton.addEventListener('click', ()=>{
    $locationButton.setAttribute(`disabled`, `disabled`)
    if(!navigator.geolocation) return alert(`Geolocation isn't supported by your browser`)
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit(`sendLocation`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, ()=>{
            $locationButton.removeAttribute(`disabled`)
            console.log(`Your location was shared!`)
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})