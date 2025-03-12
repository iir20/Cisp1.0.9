const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const url = require('url');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve mining.html for /mining route
app.get('/mining', (req, res) => {
    res.sendFile(path.join(__dirname, 'mining.html'));
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer((req, res) => {
    // Set CORS headers to allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Special endpoint for health checks
    if (req.url.startsWith('/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
        return;
    }

    // Parse URL
    const parsedUrl = url.parse(req.url);
    
    // Get the file path
    let filePath = '.' + parsedUrl.pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Get the file extension
    const extname = path.extname(filePath);

    // Set content type based on file extension
    const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    }[extname] || 'application/octet-stream';

    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                // File not found - try to serve index.html for client-side routing
                fs.readFile('./index.html', (err, indexContent) => {
                    if (err) {
                        // Cannot serve index.html either
                        res.writeHead(404);
                        res.end('File not found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexContent, 'utf-8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
                console.error(`Server error: ${error.code} for ${filePath}`);
            }
        } else {
            // Success - serve the file
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
    console.log(`Health endpoint available at http://localhost:${PORT}/health`);
}); 