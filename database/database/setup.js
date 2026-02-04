const { sequelize, User, Transaction, Referral } = require('./models');
require('dotenv').config();

async function setupDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos creada exitosamente');
    
    const adminExists = await User.findOne({ where: { telegramId: process.env.ADMIN_ID } });
    
    if (!adminExists) {
      await User.create({
        telegramId: process.env.ADMIN_ID,
        firstName: 'Administrador',
        username: 'admin',
        referralCode: 'ADMIN001',
        balance: 1000.00,
        totalEarned: 1000.00
      });
      console.log('👑 Usuario administrador creado');
    }
    
    console.log('🎉 Configuración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  }
}

setupDatabase();
