// backend/lib/sms.js
export async function sendSms(number, message) {
  console.log('\n📱 ===== SMS =====');
  console.log(`To:      ${number}`);
  console.log(`Message: ${message}`);
  console.log('=================\n');
}