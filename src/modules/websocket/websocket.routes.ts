import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { redisPubSub } from '../../lib/redis';

/**
 * WebSocket Route: /ws/orders/:orderId
 * 
 * Real-time order status updates via WebSocket
 * Subscribes to Redis Pub/Sub channel for the specific order
 */
export async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/ws/orders/:orderId',
    { websocket: true },
    async (connection: SocketStream, request) => {
      const { orderId } = request.params as { orderId: string };
      const channel = `order-updates:${orderId}`;

      console.log(`[WebSocket] Client connected for order ${orderId}`);

      // Create a subscriber for this specific order
      const subscriber = redisPubSub.duplicate();
      await subscriber.connect();

      // Subscribe to the Redis channel
      await subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          connection.socket.send(JSON.stringify(data));
          console.log(`[WebSocket] Sent update for order ${orderId}:`, data.status);
        } catch (error) {
          console.error('[WebSocket] Error sending message:', error);
        }
      });

      // Send initial connection confirmation
      connection.socket.send(
        JSON.stringify({
          type: 'connected',
          orderId,
          message: 'WebSocket connection established',
          timestamp: new Date().toISOString(),
        })
      );

      // Handle client disconnect
      connection.socket.on('close', async () => {
        console.log(`[WebSocket] Client disconnected from order ${orderId}`);
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      });

      // Handle errors
      connection.socket.on('error', async (error) => {
        console.error(`[WebSocket] Error for order ${orderId}:`, error);
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      });

      // Handle incoming messages from client (optional - for ping/pong)
      connection.socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'ping') {
            connection.socket.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WebSocket] Error handling client message:', error);
        }
      });
    }
  );
}
