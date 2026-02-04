require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { sequelize, User, Transaction } = require('./database/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar el bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Conectar a la base de datos
sequelize.sync()
  .then(() => console.log('✅ Base de datos conectada y sincronizada'))
  .catch(err => console.error('❌ Error de base de datos:', err));

// Configurar manejadores
require('./handlers/botHandlers')(bot);

// Servidor web para Render
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: '🟢 Gold Bot Activo',
    version: '1.0.0',
    features: ['Referidos', 'Bono Diario', 'Sistema de USDT'],
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({
      status: 'healthy',
      users: userCount,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`🤖 Bot: @${process.env.BOT_USERNAME}`);
  console.log(`💰 Bono diario: ${process.env.DAILY_BONUS} USDT`);
  console.log(`👥 Referido: ${process.env.REFERRAL_REWARD} USDT`);
});
