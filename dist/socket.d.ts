import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export declare const initializeSocket: (server: HTTPServer) => SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketIOServer;
//# sourceMappingURL=socket.d.ts.map