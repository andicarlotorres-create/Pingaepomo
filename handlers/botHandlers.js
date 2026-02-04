const { User, Transaction, Referral } = require('../database/models');
const moment = require('moment');
require('dotenv').config();

module.exports = function(bot) {
  
  function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const mainMenu = {
    reply_markup: {
      keyboard: [
        ['🏫 Consultar mi saldo en USDT'],
        ['💸 ¿Cómo ganar USDT?'],
        ['🎁 Reclamar Bono Diario'],
        ['👥 Mis Referidos', '🏆 Canal de noticias'],
        ['📊 Estadísticas', '🔄 Generar enlace de referido']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const referralCode = match[1];
    
    try {
      let user = await User.findOne({ where: { telegramId: userId } });
      
      if (!user) {
        const userCode = generateReferralCode();
        user = await User.create({
          telegramId: userId,
          username: msg.from.username,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          referralCode: userCode,
          balance: 0.10,
          totalEarned: 0.10
        });

        await Transaction.create({
          userId: userId,
          type: 'admin',
          amount: 0.10,
          description: '🎁 Bono de bienvenida'
        });

        if (referralCode) {
          const referrer = await User.findOne({ where: { referralCode } });
          if (referrer && referrer.telegramId !== userId) {
            const referralReward = parseFloat(process.env.REFERRAL_REWARD);
            referrer.balance += referralReward;
            referrer.totalEarned += referralReward;
            referrer.referralCount += 1;
            await referrer.save();

            await Transaction.create({
              userId: referrer.telegramId,
              type: 'referral',
              amount: referralReward,
              description: `👥 Referido: ${username}`
            });

            await Referral.create({
              referrerId: referrer.telegramId,
              referredId: userId,
              rewardPaid: true
            });

            bot.sendMessage(referrer.telegramId, 
              `🎉 ¡Nuevo referido!\n\n` +
              `👤 ${username} se unió usando tu código.\n` +
              `💰 +${referralReward} USDT acreditados a tu saldo.\n` +
              `📈 Total de referidos: ${referrer.referralCount}`
            );
          }
        }

        const welcomeMsg = `✨ *¡Bienvenido a GOLD BOT!* ✨\n\n` +
          `🎯 *Bono de bienvenida:* 0.10 USDT\n` +
          `🔑 *Tu código de referido:* \`${userCode}\`\n\n` +
          `*¿Cómo ganar más?*\n` +
          `• 🎁 Bono diario: ${process.env.DAILY_BONUS} USDT\n` +
          `• 👥 Por referido: ${process.env.REFERRAL_REWARD} USDT\n` +
          `• 💰 Mínimo de retiro: ${process.env.MIN_WITHDRAWAL} USDT\n\n` +
          `*Usa el menú para comenzar a ganar!*`;
        
        await bot.sendMessage(chatId, welcomeMsg, { 
          parse_mode: 'Markdown',
          ...mainMenu 
        });

      } else {
        const welcomeBackMsg = `👋 *¡Bienvenido de nuevo, ${user.firstName}!*\n\n` +
          `💰 *Saldo actual:* ${user.balance.toFixed(2)} USDT\n` +
          `👥 *Referidos:* ${user.referralCount}\n` +
          `🔑 *Tu código:* \`${user.referralCode}\`\n\n` +
          `*¿Qué deseas hacer hoy?*`;
        
        await bot.sendMessage(chatId, welcomeBackMsg, { 
          parse_mode: 'Markdown',
          ...mainMenu 
        });
      }
    } catch (error) {
      console.error('Error en /start:', error);
      bot.sendMessage(chatId, '❌ Hubo un error. Por favor, intenta nuevamente.');
    }
  });

  bot.onText(/🏫 Consultar mi saldo en USDT/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ where: { telegramId: msg.from.id } });
    
    if (user) {
      const transactions = await Transaction.findAll({
        where: { userId: user.telegramId },
        limit: 5,
        order: [['createdAt', 'DESC']]
      });

      let transactionHistory = '';
      transactions.forEach(t => {
        const sign = t.amount >= 0 ? '+' : '';
        const emoji = t.type === 'daily_bonus' ? '🎁' : 
                     t.type === 'referral' ? '👥' : '💰';
        transactionHistory += `${emoji} ${sign}${t.amount} USDT - ${t.description}\n`;
      });

      const balanceMsg = `💰 *DETALLES DE TU SALDO*\n\n` +
        `*Saldo disponible:* ${user.balance.toFixed(2)} USDT\n` +
        `*Total ganado:* ${user.totalEarned.toFixed(2)} USDT\n` +
        `*Referidos activos:* ${user.referralCount}\n` +
        `*Mínimo para retiro:* ${process.env.MIN_WITHDRAWAL} USDT\n\n` +
        `*📋 Últimas transacciones:*\n${transactionHistory}\n` +
        `💡 *Consejo:* Invita amigos para alcanzar el mínimo de retiro más rápido!`;

      bot.sendMessage(chatId, balanceMsg, { parse_mode: 'Markdown' });
    }
  });

  bot.onText(/💸 ¿Cómo ganar USDT\?/, (msg) => {
    const chatId = msg.chat.id;
    
    const howToEarnMsg = `🚀 *¿CÓMO GANAR USDT?*\n\n` +
      `*🎁 BONO DIARIO*\n` +
      `• Reclama ${process.env.DAILY_BONUS} USDT cada 24 horas\n` +
      `• Racha consecutiva: +0.01 USDT extra por día\n\n` +
      `*👥 SISTEMA DE REFERIDOS*\n` +
      `• Gana ${process.env.REFERRAL_REWARD} USDT por cada amigo que se una\n` +
      `• Sin límite de referidos\n` +
      `• Pago instantáneo\n\n` +
      `*💰 RETIROS*\n` +
      `• Mínimo: ${process.env.MIN_WITHDRAWAL} USDT\n` +
      `• Procesamiento: 24-48 horas\n\n` +
      `*📊 ESTRATEGIA RECOMENDADA*\n` +
      `1️⃣ Reclama tu bono diario\n` +
      `2️⃣ Comparte tu enlace de referido\n` +
      `3️⃣ Invita a 5 amigos = ${(5 * parseFloat(process.env.REFERRAL_REWARD)).toFixed(2)} USDT\n` +
      `4️⃣ ¡Retira tus ganancias!`;
    
    bot.sendMessage(chatId, howToEarnMsg, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎁 Reclamar Bono Ahora', callback_data: 'claim_bonus' }],
          [{ text: '📤 Compartir Mi Enlace', callback_data: 'share_link' }]
        ]
      }
    });
  });

  bot.onText(/🎁 Reclamar Bono Diario/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const user = await User.findOne({ where: { telegramId: userId } });
    if (!user) return;

    const now = moment();
    const lastClaim = user.lastDailyBonus ? moment(user.lastDailyBonus) : null;
    
    if (lastClaim && now.diff(lastClaim, 'hours') < 24) {
      const nextClaim = lastClaim.add(24, 'hours');
      const hoursLeft = nextClaim.diff(now, 'hours');
      const minutesLeft = nextClaim.diff(now, 'minutes') % 60;
      
      bot.sendMessage(chatId, 
        `⏰ *Bono no disponible*\n\n` +
        `Ya reclamaste tu bono diario hoy.\n` +
        `⏳ Disponible en: ${hoursLeft}h ${minutesLeft}m\n\n` +
        `📈 *Racha actual:* ${user.dailyStreak} días\n` +
        `💡 *Consejo:* Vuelve mañana para mantener tu racha!`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let bonus = parseFloat(process.env.DAILY_BONUS);
    const streakBonus = user.dailyStreak * 0.01;
    bonus += streakBonus;
    
    user.balance += bonus;
    user.totalEarned += bonus;
    user.dailyStreak = lastClaim && now.diff(lastClaim, 'hours') <= 48 ? user.dailyStreak + 1 : 1;
    user.lastDailyBonus = now.toDate();
    await user.save();

    await Transaction.create({
      userId: userId,
      type: 'daily_bonus',
      amount: bonus,
      description: `🎁 Bono diario (racha: ${user.dailyStreak} días)`
    });

    const bonusMsg = `🎉 *¡BONO RECLAMADO!*\n\n` +
      `💰 *Ganaste:* ${bonus.toFixed(2)} USDT\n` +
      `📈 *Racha consecutiva:* ${user.dailyStreak} días\n` +
      `🎯 *Bono base:* ${process.env.DAILY_BONUS} USDT\n` +
      `⭐ *Extra por racha:* ${streakBonus.toFixed(2)} USDT\n\n` +
      `💵 *Saldo total:* ${user.balance.toFixed(2)} USDT\n` +
      `⏰ *Próximo bono:* En 24 horas\n\n` +
      `*¡Sigue así! Mañana el bono será aún mayor!*`;
    
    bot.sendMessage(chatId, bonusMsg, { parse_mode: 'Markdown' });
  });

  bot.onText(/👥 Mis Referidos/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const user = await User.findOne({ where: { telegramId: userId } });
    if (!user) return;

    const referrals = await Referral.findAll({ 
      where: { referrerId: userId }
    });

    const referralLink = `https://t.me/${process.env.BOT_USERNAME}?start=${user.referralCode}`;
    
    let referralsList = '';
    if (referrals.length > 0) {
      referralsList = `Tienes ${referrals.length} referido(s).`;
    } else {
      referralsList = 'Aún no tienes referidos 😢\n¡Comparte tu enlace para comenzar!';
    }

    const referralMsg = `👥 *PANEL DE REFERIDOS*\n\n` +
      `*📊 Estadísticas:*\n` +
      `• Total de referidos: ${user.referralCount}\n` +
      `• Ganancias por referidos: ${(user.referralCount * parseFloat(process.env.REFERRAL_REWARD)).toFixed(2)} USDT\n\n` +
      `*🔗 Tu enlace exclusivo:*\n\`${referralLink}\`\n\n` +
      `*📋 Lista de referidos:*\n${referralsList}\n\n` +
      `*💎 Mensaje promocional:*\n¡Únete a Gold Bot y gana USDT diarios! Usa mi enlace: ${referralLink}`;
    
    bot.sendMessage(chatId, referralMsg, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Compartir enlace', url: `https://t.me/share/url?url=${encodeURIComponent(`¡Gana USDT conmigo! ${referralLink}`)}` }],
          [{ text: '📋 Copiar enlace', callback_data: 'copy_link' }]
        ]
      }
    });
  });

  bot.onText(/🏆 Canal de noticias/, (msg) => {
    const chatId = msg.chat.id;
    
    const newsMsg = `🏆 *CANAL DE NOTICIAS*\n\n` +
      `📢 *Únete para estar al día:*\n` +
      `👉 https://t.me/GoldBotNoticias\n\n` +
      `*📰 Qué encontrarás:*\n` +
      `• 📈 Novedades y actualizaciones\n` +
      `• 🎁 Sorteos exclusivos\n` +
      `• 💰 Ofertas especiales\n` +
      `• 🚀 Tips para ganar más\n` +
      `• 🏆 Rankings de referidos`;
    
    bot.sendMessage(chatId, newsMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Unirme al Canal', url: 'https://t.me/GoldBotNoticias' }]
        ]
      }
    });
  });

  bot.onText(/📊 Estadísticas/, async (msg) => {
    const chatId = msg.chat.id;
    
    const totalUsers = await User.count();
    const totalReferrals = await Referral.count();
    const totalBonusPaid = await Transaction.sum('amount', { 
      where: { type: 'daily_bonus' } 
    }) || 0;
    const totalReferralPaid = await Transaction.sum('amount', { 
      where: { type: 'referral' } 
    }) || 0;

    const statsMsg = `📊 *ESTADÍSTICAS GLOBALES*\n\n` +
      `*👥 Usuarios totales:* ${totalUsers}\n` +
      `*🔗 Referidos totales:* ${totalReferrals}\n` +
      `*💰 Total en bonos:* ${totalBonusPaid.toFixed(2)} USDT\n` +
      `*👥 Total en referidos:* ${totalReferralPaid.toFixed(2)} USDT\n` +
      `*🎯 Total distribuido:* ${(totalBonusPaid + totalReferralPaid).toFixed(2)} USDT\n\n` +
      `*🏆 Top 3 Referidores:*\n`;
    
    const topReferrers = await User.findAll({
      order: [['referralCount', 'DESC']],
      limit: 3
    });

    topReferrers.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      statsMsg += `${medal} @${user.username || user.firstName}: ${user.referralCount} referidos\n`;
    });

    statsMsg += `\n*📈 Tu progreso hacia el retiro:*\n`;
    
    const user = await User.findOne({ where: { telegramId: msg.from.id } });
    if (user) {
      const progress = (user.balance / parseFloat(process.env.MIN_WITHDRAWAL)) * 100;
      const barLength = 20;
      const filled = Math.round((progress / 100) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
      
      statsMsg += `${bar} ${progress.toFixed(1)}%\n`;
      statsMsg += `Faltan ${(parseFloat(process.env.MIN_WITHDRAWAL) - user.balance).toFixed(2)} USDT`;
    }

    bot.sendMessage(chatId, statsMsg, { parse_mode: 'Markdown' });
  });

  bot.onText(/🔄 Generar enlace de referido/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ where: { telegramId: msg.from.id } });
    
    if (user) {
      const referralLink = `https://t.me/${process.env.BOT_USERNAME}?start=${user.referralCode}`;
      const promoMessage = `🎉 *¡GANA USDT CONMIGO!* 🎉\n\n` +
        `*Gold Bot* - La mejor forma de ganar USDT gratis\n\n` +
        `✨ *Beneficios:*\n` +
        `• 🎁 ${process.env.DAILY_BONUS} USDT diarios\n` +
        `• 👥 ${process.env.REFERRAL_REWARD} USDT por referido\n` +
        `• 💰 Retiros desde ${process.env.MIN_WITHDRAWAL} USDT\n\n` +
        `*¡Únete usando mi enlace y gana 0.10 USDT de bienvenida!*\n` +
        `🔗 ${referralLink}\n\n` +
        `#GoldBot #USDT #Cripto #Referidos`;
      
      bot.sendMessage(chatId, promoMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📤 Compartir en Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(promoMessage)}` }],
            [{ text: '📋 Copiar Mensaje', callback_data: 'copy_message' }]
          ]
        }
      });
    }
  });

  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    if (data === 'claim_bonus') {
      const msg = { chat: { id: chatId }, from: callbackQuery.from };
      bot.emit('text', { ...msg, text: '🎁 Reclamar Bono Diario' });
    }
    
    if (data === 'copy_link') {
      const user = await User.findOne({ where: { telegramId: callbackQuery.from.id } });
      if (user) {
        const referralLink = `https://t.me/${process.env.BOT_USERNAME}?start=${user.referralCode}`;
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: `Enlace copiado: ${referralLink}`,
          show_alert: true 
        });
      }
    }
    
    bot.answerCallbackQuery(callbackQuery.id);
  });
};
