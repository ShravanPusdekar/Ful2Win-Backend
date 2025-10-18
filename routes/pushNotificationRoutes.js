import express from 'express';
import pushNotificationService from '../services/pushNotificationService.js';

const router = express.Router();

/**
 * @route POST /api/push/send
 * @desc Send push notification to a single device
 * @access Private (add your auth middleware)
 */
router.post('/send', async (req, res) => {
  try {
    const { token, notification, data = {}, options = {} } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        message: 'Notification title and body are required'
      });
    }

    const result = await pushNotificationService.sendToDevice(token, notification, data, options);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/send-multiple
 * @desc Send push notification to multiple devices
 * @access Private
 */
router.post('/send-multiple', async (req, res) => {
  try {
    const { tokens, notification, data = {} } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of FCM tokens is required'
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        message: 'Notification title and body are required'
      });
    }

    const result = await pushNotificationService.sendToMultipleDevices(tokens, notification, data);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notifications sent successfully',
        successCount: result.successCount,
        failureCount: result.failureCount,
        responses: result.responses
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send multiple notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/send-topic
 * @desc Send push notification to a topic
 * @access Private
 */
router.post('/send-topic', async (req, res) => {
  try {
    const { topic, notification, data = {} } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required'
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        message: 'Notification title and body are required'
      });
    }

    const result = await pushNotificationService.sendToTopic(topic, notification, data);

    if (result.success) {
      res.json({
        success: true,
        message: 'Topic notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send topic notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send topic notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/reward
 * @desc Send reward notification
 * @access Private
 */
router.post('/reward', async (req, res) => {
  try {
    const { token, amount, type = 'coins' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid reward amount is required'
      });
    }

    const result = await pushNotificationService.sendRewardNotification(token, amount, type);

    if (result.success) {
      res.json({
        success: true,
        message: 'Reward notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send reward notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send reward notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/game-invitation
 * @desc Send game invitation notification
 * @access Private
 */
router.post('/game-invitation', async (req, res) => {
  try {
    const { token, gameType, inviterName } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!gameType || !inviterName) {
      return res.status(400).json({
        success: false,
        message: 'Game type and inviter name are required'
      });
    }

    const result = await pushNotificationService.sendGameInvitation(token, gameType, inviterName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Game invitation sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send game invitation',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send game invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/tournament
 * @desc Send tournament notification
 * @access Private
 */
router.post('/tournament', async (req, res) => {
  try {
    const { token, tournamentName, action = 'started' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!tournamentName) {
      return res.status(400).json({
        success: false,
        message: 'Tournament name is required'
      });
    }

    const validActions = ['started', 'ending', 'ended'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: started, ending, ended'
      });
    }

    const result = await pushNotificationService.sendTournamentNotification(token, tournamentName, action);

    if (result.success) {
      res.json({
        success: true,
        message: 'Tournament notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send tournament notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send tournament notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/friend-request
 * @desc Send friend request notification
 * @access Private
 */
router.post('/friend-request', async (req, res) => {
  try {
    const { token, senderName } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!senderName) {
      return res.status(400).json({
        success: false,
        message: 'Sender name is required'
      });
    }

    const result = await pushNotificationService.sendFriendRequest(token, senderName);

    if (result.success) {
      res.json({
        success: true,
        message: 'Friend request notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send friend request notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send friend request notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/daily-bonus
 * @desc Send daily bonus notification
 * @access Private
 */
router.post('/daily-bonus', async (req, res) => {
  try {
    const { token, bonusAmount } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!bonusAmount || bonusAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid bonus amount is required'
      });
    }

    const result = await pushNotificationService.sendDailyBonusNotification(token, bonusAmount);

    if (result.success) {
      res.json({
        success: true,
        message: 'Daily bonus notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send daily bonus notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send daily bonus notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/level-up
 * @desc Send level up notification
 * @access Private
 */
router.post('/level-up', async (req, res) => {
  try {
    const { token, newLevel, reward } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    if (!newLevel || newLevel <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid new level is required'
      });
    }

    if (!reward || reward <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid reward amount is required'
      });
    }

    const result = await pushNotificationService.sendLevelUpNotification(token, newLevel, reward);

    if (result.success) {
      res.json({
        success: true,
        message: 'Level up notification sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send level up notification',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in send level up notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/subscribe-topic
 * @desc Subscribe devices to a topic
 * @access Private
 */
router.post('/subscribe-topic', async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of FCM tokens is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required'
      });
    }

    const result = await pushNotificationService.subscribeToTopic(tokens, topic);

    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully subscribed to topic',
        response: result.response
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to topic',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in subscribe to topic:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/push/unsubscribe-topic
 * @desc Unsubscribe devices from a topic
 * @access Private
 */
router.post('/unsubscribe-topic', async (req, res) => {
  try {
    const { tokens, topic } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of FCM tokens is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required'
      });
    }

    const result = await pushNotificationService.unsubscribeFromTopic(tokens, topic);

    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully unsubscribed from topic',
        response: result.response
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from topic',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in unsubscribe from topic:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/push/test
 * @desc Test endpoint to verify push notification service is working
 * @access Public (for testing only)
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Push notification service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      send: 'POST /api/push/send',
      sendMultiple: 'POST /api/push/send-multiple',
      sendTopic: 'POST /api/push/send-topic',
      reward: 'POST /api/push/reward',
      gameInvitation: 'POST /api/push/game-invitation',
      tournament: 'POST /api/push/tournament',
      friendRequest: 'POST /api/push/friend-request',
      dailyBonus: 'POST /api/push/daily-bonus',
      levelUp: 'POST /api/push/level-up',
      subscribeTopic: 'POST /api/push/subscribe-topic',
      unsubscribeTopic: 'POST /api/push/unsubscribe-topic'
    }
  });
});

export default router;
