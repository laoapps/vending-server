import express, { Request, Response } from 'express';
import { SerialPort } from 'serialport';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const app = express();
const PORT = 3000;

// Interfaces
interface HexRequest {
    hexString: string;
}

interface ApiResponse {
    message?: string;
    hexString?: string;
    error?: string;
}

interface WebSocketMessage {
    type: 'serialData' | 'error';
    data: string;
}

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serial port configuration
const serialPort = new SerialPort({
    path: '/dev/ttyUSB0', // Update this to match your serial port
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    autoOpen: false
} as const);

// Middleware
app.use(express.json());

// Open serial port
serialPort.open((err?: Error | null) => {
    if (err) {
        console.error('Error opening serial port:', err.message);
    } else {
        console.log('Serial port opened successfully');
    }
});

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected');

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error.message);
    });
});

// Serial port data handler - broadcast to all connected WebSocket clients
serialPort.on('data', (data: Buffer) => {
    const message: WebSocketMessage = {
        type: 'serialData',
        data: data.toString('hex')
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
});

// Serial port error handling
serialPort.on('error', (err: Error) => {
    console.error('Serial port error:', err.message);
    const message: WebSocketMessage = {
        type: 'error',
        data: err.message
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
});

// POST endpoint for sending hex string
app.post('/send-hex', (req: Request<{}, {}, HexRequest>, res: Response<ApiResponse>) => {
    const { hexString } = req.body;

    if (!hexString || !/^[0-9A-Fa-f]+$/.test(hexString)) {
        return res.status(400).json({
            error: 'Invalid hex string. Please provide a valid hexadecimal string.'
        });
    }

    try {
        const buffer = Buffer.from(hexString, 'hex');
        
        serialPort.write(buffer, (err?: Error | null) => {
            if (err) {
                console.error('Error writing to serial port:', err.message);
                return res.status(500).json({
                    error: 'Failed to write to serial port'
                });
            }
            console.log(`Successfully wrote to serial port: ${hexString}`);
            res.json({
                message: 'Data sent successfully',
                hexString
            });
        });
    } catch (error) {
        console.error('Error processing hex string:', error instanceof Error ? error.message : String(error));
        res.status(500).json({
            error: 'Error processing hex string'
        });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`WebSocket server running at ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    wss.close(() => {
        serialPort.close(() => {
            console.log('WebSocket server and serial port closed');
            process.exit(0);
        });
    });
});