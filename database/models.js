const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'goldbot.db'),
  logging: false
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  telegramId: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING
  },
  referralCode: {
    type: DataTypes.STRING(10),
    unique: true
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalEarned: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  referralCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  referredBy: {
    type: DataTypes.BIGINT
  },
  lastDailyBonus: {
    type: DataTypes.DATE
  },
  dailyStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('referral', 'daily_bonus', 'withdrawal', 'admin'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  referrerId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  referredId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  rewardPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

User.hasMany(Transaction, { foreignKey: 'userId' });
User.hasMany(Referral, { foreignKey: 'referrerId' });

module.exports = {
  sequelize,
  User,
  Transaction,
  Referral
};
