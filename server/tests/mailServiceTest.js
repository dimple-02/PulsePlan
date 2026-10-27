import { sendWelcomeEmail, sendWorkspaceInviteEmail, sendTaskAssignmentEmail } from '../services/mailService.js';

async function runMailTests() {
  console.log('====================================================');
  console.log('Testing PulsePlan MailService System');
  console.log('====================================================\n');

  try {
    // 1. Welcome Email
    console.log('[Test 1] Dispatching Welcome Email...');
    const welcomeResult = await sendWelcomeEmail({
      to: 'sarah.connor@example.com',
      recipientName: 'Sarah Connor',
      loginUrl: 'http://localhost:5173/login',
    });
    console.log('Result:', welcomeResult.success ? 'PASSED' : 'FAILED', welcomeResult);

    // 2. Workspace Invite Email
    console.log('\n[Test 2] Dispatching Workspace Invitation Email...');
    const inviteResult = await sendWorkspaceInviteEmail({
      to: 'alex.rivera@example.com',
      recipientName: 'Alex Rivera',
      inviterName: 'Sarah Connor',
      workspaceName: 'Acme SaaS Studio',
      role: 'Admin',
      joinUrl: 'http://localhost:5173/login',
    });
    console.log('Result:', inviteResult.success ? 'PASSED' : 'FAILED', inviteResult);

    // 3. Task Assignment Email
    console.log('\n[Test 3] Dispatching Task Assignment Email...');
    const taskResult = await sendTaskAssignmentEmail({
      to: 'alex.rivera@example.com',
      recipientName: 'Alex Rivera',
      taskTitle: 'Implement Stripe Billing Webhook Integration',
      projectName: 'PulsePlan Core Platform',
      priority: 'high',
      dueDate: 'Nov 15, 2026',
      taskUrl: 'http://localhost:5173/kanban',
    });
    console.log('Result:', taskResult.success ? 'PASSED' : 'FAILED', taskResult);

    console.log('\n====================================================');
    console.log('All MailService tests executed successfully!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[Test Failure]:', error);
    process.exit(1);
  }
}

runMailTests();
