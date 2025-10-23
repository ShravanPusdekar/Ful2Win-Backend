import { getMessaging } from '../config/firebase.js';

/**
 * Push Notification Service for Ful2Win
 * Handles all types of push notifications
 */
class PushNotificationService {
  constructor() {
    this.messaging = null;
    this.init();
  }

  async init() {
    try {
      this.messaging = getMessaging();
      console.log('✅ Push Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Push Notification Service:', error);
    }
  }

  /**
   * Send notification to a single device
   * @param {string} token - FCM token of the device
   * @param {Object} notification - Notification payload
   * @param {Object} data - Data payload (optional)
   * @param {Object} options - Additional options (optional)
   */
  async sendToDevice(token, notification, data = {}, options = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF6B35',
            sound: 'default',
            channelId: 'ful2win_notifications',
            priority: 'high',
            ...options.android
          },
          data: data
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              sound: 'default',
              badge: 1,
              ...options.apns
            }
          },
          fcm_options: {
            image: notification.imageUrl
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('✅ Successfully sent message:', response);
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Check if it's an invalid token error
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        console.warn('⚠️ Invalid or expired FCM token detected:', token.substring(0, 20) + '...');
        return { 
          success: false, 
          error: error.message,
          invalidToken: true,
          token: token,
          errorCode: error.code
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple devices
   * @param {Array} tokens - Array of FCM tokens
   * @param {Object} notification - Notification payload
   * @param {Object} data - Data payload (optional)
   */
  async sendToMultipleDevices(tokens, notification, data = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          click_action: data.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF6B35',
            sound: 'default',
            channelId: 'ful2win_notifications',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.messaging.sendEachForMulticast(message);
      console.log('✅ Successfully sent multicast message:', response);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
      
    } catch (error) {
      console.error('❌ Error sending multicast message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to a topic
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification payload
   * @param {Object} data - Data payload (optional)
   */
  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF6B35',
            sound: 'default',
            channelId: 'ful2win_notifications'
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('✅ Successfully sent topic message:', response);
      return { success: true, messageId: response };
      
    } catch (error) {
      console.error('❌ Error sending topic message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send new game notification to all devices
   * @param {Array} tokens - Array of all FCM tokens
   * @param {Object} gameData - Game information
   */
  async sendNewGameNotificationToAll(tokens, gameData) {
    try {
      if (!tokens || tokens.length === 0) {
        console.log('⚠️ No tokens provided for game notification');
        return { success: false, error: 'No tokens provided' };
      }

      // FCM has a limit of 500 tokens per multicast
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < tokens.length; i += batchSize) {
        batches.push(tokens.slice(i, i + batchSize));
      }

      const notification = {
        title: `New Game: ${gameData.displayName || gameData.name} 🎮`,
        body: `Check out our new game and start playing now!`,
        imageUrl: gameData.thumbnail || null
      };

      const data = {
        type: 'new_game',
        gameId: gameData._id?.toString() || gameData.id || '',
        gameName: gameData.name || '',
        displayName: gameData.displayName || '',
        baseUrl: gameData.baseUrl || '',
        iframePath: gameData.iframePath || '',
        screen: 'games',
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      };

      const allResults = {
        success: true,
        totalTokens: tokens.length,
        totalBatches: batches.length,
        successCount: 0,
        failureCount: 0,
        batches: []
      };

      // Send to each batch
      for (let i = 0; i < batches.length; i++) {
        console.log(`📤 Sending game notification batch ${i + 1}/${batches.length} (${batches[i].length} tokens)`);
        
        const batchResult = await this.sendToMultipleDevices(batches[i], notification, data);
        
        allResults.batches.push({
          batchNumber: i + 1,
          tokenCount: batches[i].length,
          ...batchResult
        });

        if (batchResult.success) {
          allResults.successCount += batchResult.successCount || 0;
          allResults.failureCount += batchResult.failureCount || 0;
        } else {
          allResults.failureCount += batches[i].length;
        }
      }

      console.log(`✅ Game notification sent to all devices. Success: ${allResults.successCount}, Failed: ${allResults.failureCount}`);
      return allResults;

    } catch (error) {
      console.error('❌ Error sending game notification to all devices:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe device to topic
   * @param {Array} tokens - Array of FCM tokens
   * @param {string} topic - Topic name
   */
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const response = await this.messaging.subscribeToTopic(tokens, topic);
      console.log('✅ Successfully subscribed to topic:', response);
      return { success: true, response };
      
    } catch (error) {
      console.error('❌ Error subscribing to topic:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsubscribe device from topic
   * @param {Array} tokens - Array of FCM tokens
   * @param {string} topic - Topic name
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log('✅ Successfully unsubscribed from topic:', response);
      return { success: true, response };
      
    } catch (error) {
      console.error('❌ Error unsubscribing from topic:', error);
      return { success: false, error: error.message };
    }
  }

  // Predefined notification types for Ful2Win

  /**
   * Send reward notification
   */
  async sendRewardNotification(token, amount, type = 'coins') {
    return this.sendToDevice(
      token,
      {
        title: 'Ful2Win Reward! 🎉',
        body: `Congratulations! You won ${amount} ${type}!`,
        imageUrl: 'https://your-cdn.com/reward-icon.png'
      },
      {
        type: 'reward',
        amount: amount.toString(),
        reward_type: type,
        screen: 'wallet'
      }
    );
  }

  /**
   * Send game invitation notification
   */
  async sendGameInvitation(token, gameType, inviterName) {
    return this.sendToDevice(
      token,
      {
        title: 'Game Invitation! 🎮',
        body: `${inviterName} invited you to play ${gameType}`,
        imageUrl: 'https://your-cdn.com/game-icon.png'
      },
      {
        type: 'game_invitation',
        game_type: gameType,
        inviter: inviterName,
        screen: 'games'
      }
    );
  }

  /**
   * Send tournament notification
   */
  async sendTournamentNotification(token, tournamentName, action = 'started') {
    const messages = {
      started: `${tournamentName} has started! Join now!`,
      ending: `${tournamentName} is ending soon! Last chance to participate!`,
      ended: `${tournamentName} has ended. Check your results!`
    };

    return this.sendToDevice(
      token,
      {
        title: 'Tournament Update! 🏆',
        body: messages[action],
        imageUrl: 'https://your-cdn.com/tournament-icon.png'
      },
      {
        type: 'tournament',
        tournament_name: tournamentName,
        action: action,
        screen: 'tournaments'
      }
    );
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequest(token, senderName) {
    return this.sendToDevice(
      token,
      {
        title: 'New Friend Request! 👥',
        body: `${senderName} wants to be your friend`,
        imageUrl: 'https://your-cdn.com/friend-icon.png'
      },
      {
        type: 'friend_request',
        sender: senderName,
        screen: 'friends'
      }
    );
  }

  /**
   * Send daily bonus notification
   */
  async sendDailyBonusNotification(token, bonusAmount) {
    return this.sendToDevice(
      token,
      {
        title: 'Daily Bonus Available! 💰',
        body: `Claim your daily bonus of ${bonusAmount} coins!`,
        imageUrl: 'https://your-cdn.com/bonus-icon.png'
      },
      {
        type: 'daily_bonus',
        bonus_amount: bonusAmount.toString(),
        screen: 'home'
      }
    );
  }

  /**
   * Send level up notification
   */
  async sendLevelUpNotification(token, newLevel, reward) {
    return this.sendToDevice(
      token,
      {
        title: 'Level Up! 🌟',
        body: `Congratulations! You reached level ${newLevel} and earned ${reward} coins!`,
        imageUrl: 'https://your-cdn.com/levelup-icon.png'
      },
      {
        type: 'level_up',
        new_level: newLevel.toString(),
        reward: reward.toString(),
        screen: 'profile'
      }
    );
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
