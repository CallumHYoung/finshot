import express from 'express';
import cors from 'cors';
import { database } from './database/connection.js';
import authRoutes from './routes/auth.js';
import snapshotRoutes from './routes/snapshots.js';
import categoryRoutes from './routes/categories.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/snapshots', snapshotRoutes);
app.use('/api/categories', categoryRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
async function startServer() {
    try {
        await database.connect();
        await database.initializeSchema();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await database.close();
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map