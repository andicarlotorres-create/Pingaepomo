# 🤖 Gold Bot - Bot de Telegram

Bot de Telegram para ganar USDT mediante referidos y bonos diarios.

## ✨ Características

- 🎁 **Bono diario**: 0.05 USDT cada 24 horas
- 👥 **Sistema de referidos**: 0.17 USDT por cada amigo invitado
- 💰 **Retiros**: Mínimo 5 USDT
- 📊 **Estadísticas completas** de ganancias
- 🏆 **Canal de noticias** con actualizaciones
- 📈 **Sistema de rachas** para bonos extras

## 🚀 Despliegue en Render

### Pasos

1. **Subir a GitHub**
2. **Crear Web Service en Render**
   - Conectar repositorio de GitHub
   - Configurar:
     - **Build Command:** `npm install`
     - **Start Command:** `node index.js`
   - Añadir variables de entorno

## 📋 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| TELEGRAM_BOT_TOKEN | Token del bot de Telegram | 8519041982:AAG9y3iaC9S9nk2bOo5rkI1-OMcXgsavG2o |
| ADMIN_ID | ID del administrador | 6667062973 |
| REFERRAL_REWARD | Recompensa por referido | 0.17 |
| DAILY_BONUS | Bono diario | 0.05 |
| MIN_WITHDRAWAL | Mínimo para retiro | 5 |
| BOT_USERNAME | Nombre de usuario del bot | Gold_Gojld_bot |
| PORT | Puerto del servidor | 3000 |

## 🎯 Comandos Disponibles

- `/start` - Iniciar bot y ver bono de bienvenida
- `🏫 Consultar saldo` - Ver saldo y transacciones
- `💸 ¿Cómo ganar?` - Instrucciones para ganar USDT
- `🎁 Bono diario` - Reclamar bono cada 24h
- `👥 Mis referidos` - Panel de referidos y enlaces
- `🏆 Canal de noticias` - Únete al canal oficial
- `📊 Estadísticas` - Ver stats globales
- `🔄 Generar enlace` - Crear enlace promocional

---
**✨ ¡Comienza a ganar USDT hoy mismo! ✨**
