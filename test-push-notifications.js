import dotenv from 'dotenv';
import readline from 'readline';
import { initializeFirebase } from './config/firebase.js';
import pushNotificationService from './services/pushNotificationService.js';

// Load environment variables
dotenv.config();

// Initialize Firebase
initializeFirebase();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test FCM tokens (you'll replace these with real tokens from your Flutter app)
const TEST_TOKENS = [
  // Add your test FCM tokens here
  // Example: 'dGVzdF90b2tlbl8xMjM0NTY3ODkw...'
];

/**
 * Prompt user for input
 */
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Test different types of notifications
 */
class NotificationTester {
  constructor() {
    this.testToken = '';
  }

  async start() {
    console.log('\n🚀 Ful2Win Push Notification Tester');
    console.log('=====================================\n');

    // Get FCM token from user
    this.testToken = await prompt('Enter your FCM token (from Flutter app): ');
    
    if (!this.testToken || this.testToken.trim() === '') {
      console.log('❌ No FCM token provided. Using demo mode...\n');
      this.testToken = 'DEMO_TOKEN';
    }

    await this.showMenu();
  }

  async showMenu() {
    while (true) {
      console.log('\n📱 Select notification type to test:');
      console.log('1. Basic Notification');
      console.log('2. Reward Notification');
      console.log('3. Game Invitation');
      console.log('4. Tournament Notification');
      console.log('5. Friend Request');
      console.log('6. Daily Bonus');
      console.log('7. Level Up');
      console.log('8. Custom Notification');
      console.log('9. Multiple Devices Test');
      console.log('10. Topic Notification');
      console.log('0. Exit');

      const choice = await prompt('\nEnter your choice (0-10): ');

      switch (choice) {
        case '1':
          await this.testBasicNotification();
          break;
        case '2':
          await this.testRewardNotification();
          break;
        case '3':
          await this.testGameInvitation();
          break;
        case '4':
          await this.testTournamentNotification();
          break;
        case '5':
          await this.testFriendRequest();
          break;
        case '6':
          await this.testDailyBonus();
          break;
        case '7':
          await this.testLevelUp();
          break;
        case '8':
          await this.testCustomNotification();
          break;
        case '9':
          await this.testMultipleDevices();
          break;
        case '10':
          await this.testTopicNotification();
          break;
        case '0':
          console.log('\n👋 Goodbye!');
          rl.close();
          process.exit(0);
        default:
          console.log('❌ Invalid choice. Please try again.');
      }
    }
  }

  async testBasicNotification() {
    console.log('\n🔔 Testing Basic Notification...');
    
    const result = await pushNotificationService.sendToDevice(
      this.testToken,
      {
        title: 'Hello from Ful2Win!',
        body: 'This is a test notification from your backend server.'
      },
      {
        type: 'test',
        test_id: Date.now().toString()
      }
    );

    this.logResult(result);
  }

  async testRewardNotification() {
    console.log('\n🎉 Testing Reward Notification...');
    
    const amount = await prompt('Enter reward amount (default: 50): ') || '50';
    const type = await prompt('Enter reward type (coins/gems/points, default: coins): ') || 'coins';
    
    const result = await pushNotificationService.sendRewardNotification(
      this.testToken,
      parseInt(amount),
      type
    );

    this.logResult(result);
  }

  async testGameInvitation() {
    console.log('\n🎮 Testing Game Invitation...');
    
    const gameType = await prompt('Enter game type (default: Car Racing): ') || 'Car Racing';
    const inviterName = await prompt('Enter inviter name (default: TestUser): ') || 'TestUser';
    
    const result = await pushNotificationService.sendGameInvitation(
      this.testToken,
      gameType,
      inviterName
    );

    this.logResult(result);
  }

  async testTournamentNotification() {
    console.log('\n🏆 Testing Tournament Notification...');
    
    const tournamentName = await prompt('Enter tournament name (default: Weekly Championship): ') || 'Weekly Championship';
    const action = await prompt('Enter action (started/ending/ended, default: started): ') || 'started';
    
    const result = await pushNotificationService.sendTournamentNotification(
      this.testToken,
      tournamentName,
      action
    );

    this.logResult(result);
  }

  async testFriendRequest() {
    console.log('\n👥 Testing Friend Request...');
    
    const senderName = await prompt('Enter sender name (default: NewFriend): ') || 'NewFriend';
    
    const result = await pushNotificationService.sendFriendRequest(
      this.testToken,
      senderName
    );

    this.logResult(result);
  }

  async testDailyBonus() {
    console.log('\n💰 Testing Daily Bonus...');
    
    const bonusAmount = await prompt('Enter bonus amount (default: 100): ') || '100';
    
    const result = await pushNotificationService.sendDailyBonusNotification(
      this.testToken,
      parseInt(bonusAmount)
    );

    this.logResult(result);
  }

  async testLevelUp() {
    console.log('\n🌟 Testing Level Up...');
    
    const newLevel = await prompt('Enter new level (default: 5): ') || '5';
    const reward = await prompt('Enter reward amount (default: 200): ') || '200';
    
    const result = await pushNotificationService.sendLevelUpNotification(
      this.testToken,
      parseInt(newLevel),
      parseInt(reward)
    );

    this.logResult(result);
  }

  async testCustomNotification() {
    console.log('\n✨ Testing Custom Notification...');
    
    const title = await prompt('Enter notification title: ');
    const body = await prompt('Enter notification body: ');
    const dataType = await prompt('Enter data type (optional): ') || 'custom';
    
    const result = await pushNotificationService.sendToDevice(
      this.testToken,
      { title, body },
      { type: dataType, custom: true }
    );

    this.logResult(result);
  }

  async testMultipleDevices() {
    console.log('\n📱 Testing Multiple Devices...');
    
    const tokens = [];
    tokens.push(this.testToken);
    
    console.log('Enter additional FCM tokens (press Enter with empty line to finish):');
    while (true) {
      const token = await prompt(`Token ${tokens.length + 1}: `);
      if (!token.trim()) break;
      tokens.push(token.trim());
    }
    
    console.log(`\nSending to ${tokens.length} device(s)...`);
    
    const result = await pushNotificationService.sendToMultipleDevices(
      tokens,
      {
        title: 'Broadcast Message',
        body: 'This message was sent to multiple devices!'
      },
      {
        type: 'broadcast',
        timestamp: new Date().toISOString()
      }
    );

    this.logResult(result);
  }

  async testTopicNotification() {
    console.log('\n📢 Testing Topic Notification...');
    
    const topic = await prompt('Enter topic name (default: all_users): ') || 'all_users';
    
    const result = await pushNotificationService.sendToTopic(
      topic,
      {
        title: 'Topic Notification',
        body: `This is a message sent to the "${topic}" topic!`
      },
      {
        type: 'topic',
        topic_name: topic
      }
    );

    this.logResult(result);
  }

  logResult(result) {
    if (result.success) {
      console.log('✅ Notification sent successfully!');
      if (result.messageId) {
        console.log(`📨 Message ID: ${result.messageId}`);
      }
      if (result.successCount !== undefined) {
        console.log(`✅ Success: ${result.successCount}, Failed: ${result.failureCount}`);
      }
    } else {
      console.log('❌ Failed to send notification');
      console.log(`Error: ${result.error}`);
    }
  }
}

/**
 * Quick test function for automated testing
 */
async function quickTest() {
  console.log('\n🚀 Running Quick Test Suite...\n');
  
  const testToken = 'DEMO_TOKEN_FOR_TESTING';
  
  // Test 1: Basic notification
  console.log('1️⃣ Testing basic notification...');
  const result1 = await pushNotificationService.sendToDevice(
    testToken,
    {
      title: 'Test Notification',
      body: 'This is a test from the quick test suite'
    },
    { type: 'test' }
  );
  console.log(result1.success ? '✅ Basic test passed' : '❌ Basic test failed');

  // Test 2: Reward notification
  console.log('\n2️⃣ Testing reward notification...');
  const result2 = await pushNotificationService.sendRewardNotification(testToken, 100, 'coins');
  console.log(result2.success ? '✅ Reward test passed' : '❌ Reward test failed');

  // Test 3: Game invitation
  console.log('\n3️⃣ Testing game invitation...');
  const result3 = await pushNotificationService.sendGameInvitation(testToken, 'Test Game', 'TestUser');
  console.log(result3.success ? '✅ Game invitation test passed' : '❌ Game invitation test failed');

  console.log('\n🎉 Quick test suite completed!');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    await quickTest();
    process.exit(0);
  }
  
  const tester = new NotificationTester();
  await tester.start();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

// Start the application
main().catch(console.error);
