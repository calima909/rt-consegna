import { Server } from "socket.io"
import express, { Router } from "express"
import http from "http"
import cors from "cors"
import path from 'path'
import { fileURLToPath } from 'url'
import Game from "./models/game.js"
import Player from './models/player.js'
import { readScores, saveScore } from './leaderboard.js'

const app = express()
app.use(cors())

const __filename = fileURLToPath(import.meta.url)     
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '../client/dist'))) 
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})

const rooms = {}
const endGameMessage = { value: null }
function refreshGameOver(room, playerId, socket) {
  if (rooms[room] === undefined){
    console.log("in refreshgameover rooms[room] === undefined");
    return
  }
  io.to(playerId).emit('returnToLobby');
  const r = rooms[room];
  if (!r) return;
  const player = r.players.find(p => p.id === playerId);
  if (player && r.players.length > 1) {
    player.isAlive = false;
  }
  
  const alivePlayers = r.players.filter(p => p.isAlive);
  if (r.isSinglePlayer === true) {
    endGameMessage.value = 'defeat'
    socket.emit('endGameMessage', endGameMessage.value);      
  }
  else { 
    if (alivePlayers.length === 1 && r.started === true) {
      const winner = alivePlayers[0];
      socket.to(winner.id).emit('endGameMessage', 'victory'); 
      socket.to(winner.id).emit('autoGameOver');
      r.queue = [];
      r.started = false; 
    }
    else if (alivePlayers.length > 1) {
      socket.emit('endGameMessage', 'defeat');          
    }
    for (let i = 0; i < r.players.length; i++) {
        if (!r.players[i].isAlive) {
          socket.to(r.players[i].id).emit('endGameMessage', 'defeat');
          socket.to(r.players[i].id).emit('gameOver', {
          r,
          playerId: r.players[i].id
        })
      }
    }
  }
  io.to(room).emit('lobbyUpdate', r.players);
  if (player) { 
    player.currentIndex = 0;
    player.piecesUsed = [];
  }
}
io.on("connection", (socket) => { 


    socket.on('submitScore', ({ player, score }) => {
    if (!player || typeof score !== 'number') return


    const updated = saveScore({ player, score })
    io.emit('leaderboardUpdate', updated)
  })

  socket.on('getLeaderboard', () => {
    socket.emit('leaderboardUpdate', readScores())
  })  

  socket.on('resetRooms',() => {

  })  

  socket.on("disconnect", () => {
    
    for (const [roomName, game] of Object.entries(rooms)) {
      const removed = game.removePlayerById(socket.id)
      if (!removed) continue
      
      refreshGameOver(roomName, socket.id, socket)
      

      if (!game.started) {
        io.to(roomName).emit("lobbyUpdate", game.players)
      }
      if (game.players.length === 0) {
        delete rooms[roomName]
      }

      break
    }
  })  

  socket.on("joinRoom", ({ room, player }) => {
    if (!rooms[room]) {
      rooms[room] = new Game(room)
    }

    const game = rooms[room]

    if (game.started) {
      socket.emit("roomFull", "La partita è già iniziata, non puoi entrare.")
      return
    }

    socket.join(room)

    const p = game.addPlayer(socket.id, player)
  
    io.to(room).emit("lobbyUpdate", game.players)

    socket.emit("playerInfo", { 
      id: p.id, 
      isHost: p.isHost 
    })
  })
  socket.on("startGame", (room) => {
    const game = rooms[room]
    if (!game) return
    if (game.started) {
      console.log("La partita è ancora in corso!")
      return
    }
    
    const allInLobby = game.players.every(p => p.inLobby === true)
    if (!allInLobby) {
      console.log("Tutti i giocatori non sono in lobby!")
      return
    }
    

    game.started = true
    game.players.forEach(p => {
      p.isAlive = true
      p.inLobby = false
      p.grid = Player.createEmptyGrid()
      p.currentIndex = 0;
      p.piecesUsed = []
    })
    game.queue = Game.generateBag()  

    if(game.players.length === 1) {
      game.isSinglePlayer = true
    }
    else {
      game.isSinglePlayer = false
    }



    io.to(room).emit("gameStarted", { queue: game.queue })

  })
  socket.on("requestNextPiece", (room) => {
    const game = rooms[room]
    if (!game) return
    const next = game.requestNextPieceFor(socket.id)
    if (!next) return

    socket.emit("nextPiece", next.type)    

  })

  socket.on('spectrumUpdate', (data) => {
    const game = rooms[data.room]
    if (!game) {
      return    
    }
    const player = game.findPlayer(socket.id)
    if (!player) { 
      return
    }

    player.gridForSpectrum = data.grid
    player.spectrum = player.calcSpectrum(player.gridForSpectrum)

    io.to(data.room).emit("spectrumUpdate", {
      spectra: game.players.map(p => ({
        id: p.id,
        name: p.name,
        spectrum: p.spectrum || Array(10).fill(0),
        maxy: p.maxy
      }))
    })    
  })


  socket.on('spectrumReset',  (room) => {
    const game = rooms[room]
    if (!game) {
      return    
    }
    const player = game.findPlayer(socket.id)
    player.spectrum = Array(10).fill(0)    
  })

  socket.on('sendPenalty', ({ room, lines }) => {
    const game = rooms[room]
    if (!game || !game.started) return

    const penalty = lines - 1

    if (penalty <= 0) return 
    socket.to(room).emit("receivePenalty", {penalty})
  })

  socket.on('gameOver', ({ room, playerId }) => {
    io.to(playerId).emit('returnToLobby');
  
    const r = rooms[room];
    if (!r) return;
    const player = r.players.find(p => p.id === playerId);
    if (player && r.players.length > 1) {
      player.isAlive = false;
    }
    
    const alivePlayers = r.players.filter(p => p.isAlive);
    if (r.isSinglePlayer === true) {
      endGameMessage.value = 'defeat'
      socket.emit('endGameMessage', endGameMessage.value);      
    }
    else {
      if (alivePlayers.length === 1 && r.started === true) {
        socket.emit('endGameMessage', 'defeat');
        const winner = alivePlayers[0];
        socket.to(winner.id).emit('endGameMessage', 'victory'); 
        socket.to(winner.id).emit('autoGameOver');
        r.queue = [];
        r.started = false; 
      }
      else if (alivePlayers.length > 1) {
        console.log("Giocatore morto 1: " + player.name);
        socket.emit('endGameMessage', 'defeat');          
      }       
    }
    io.to(room).emit('lobbyUpdate', r.players);

    player.currentIndex = 0;
    player.piecesUsed = [];
  })

  socket.on('areAllReady', (room) => {
    const r = rooms[room]
    if (!r) return

    const player = r.players.find(p => p.id === socket.id)
    if (!player) return

    player.inLobby = true

    const everyoneReady = r.players.every(p => p.inLobby === true);
    if (everyoneReady) {
      r.started = false
    }
  })
  
  socket.on('leaveRoom', ({ room }) => { 
    console.log("entro in leaveRoom 1");
    const game = rooms[room];
    if (!game) return;

    const removed = game.removePlayerById(socket.id);
    if (!removed) return;

    socket.leave(room);
    if (game.players.length === 1 && game.started === true) {
      const winner = game.players[0];
      socket.to(winner.id).emit('endGameMessage', 'victory');
      socket.to(winner.id).emit('autoGameOver');
      game.queue = [];
      return; 
    }

    else if (game.players.length === 0) {
      delete rooms[room];
      return;
    }

    io.to(room).emit('lobbyUpdate', game.players);
    console.log("aggiorno lobby EC")
    if (game.players.length === 1 && game.started === true)
    {
        const winner = game.players[0];
        socket.to(winner.id).emit('endGameMessage', 'victory');
        socket.to(winner.id).emit('autoGameOver');
        return ;
    }
    else if (game.players.length === 0) {
      delete rooms[room];
    }
  })
})

server.listen(3000, '0.0.0.0', () => { 
  console.log('Server running on port 3000')
})