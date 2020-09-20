import express from 'express';
import dotenv from 'dotenv';
import socket from 'socket.io';
import http from 'http';
import os from 'os';

// ES5 require (node-pty does not have default export)
const pty = require('node-pty');

// Create shell instance based on platform
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Terminal options
const ptyProcess = pty.spawn(shell,[],{
    name:'xterm-color',
    cols:80,
    rows:30
});

const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

// Middleware
express.json();
dotenv.config();


// Socket connection
io.on('connect',(socket)=>{
    console.log("Client connected",socket.id);

    ptyProcess.on('data',(data)=>{
        io.to(socket.id).emit('output');
    });

    socket.on('input',(input)=>{
        ptyProcess.write(input);
    });

    socket.on('backspace',()=>{
        ptyProcess.write('\b');
    });

    socket.on('sigint',()=>{
        ptyProcess.write('\x03\n');
    });

    socket.on('execute',()=>{
        ptyProcess.write('\r');
    });

});

// Start server
server.listen(process.env.PORT,()=>{
    console.log(`Server started at port ${process.env.PORT}`);
});