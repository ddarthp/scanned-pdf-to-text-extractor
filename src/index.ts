import express from 'express';
import fileRoutes from './routes/fileRoutes';

const app = express();
const port = process.env.PORT || 3080;

// Rutas
app.use('/api', fileRoutes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
}); 