import Stripe from 'stripe';
import database from './database.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe customer
export async function createCustomer(email, name) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'georgian-chat'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create subscription
export async function createSubscription(customerId, priceId) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Update subscription
export async function updateSubscription(subscriptionId, updates) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, updates);
    return subscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Create payment intent for one-time payments
export async function createPaymentIntent(amount, currency = 'usd', customerId) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Create checkout session
export async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Handle webhook events
export function handleWebhook(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

// Process webhook events
export async function processWebhookEvent(event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChange(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Handle subscription changes
async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  
  // Find user by customer ID
  const users = Array.from(database.users.values());
  const user = users.find(u => u.customerId === customerId);
  
  if (user) {
    database.createSubscription(user.id, {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      customerId: customerId
    });
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
  const customerId = subscription.customer;
  
  // Find user by customer ID
  const users = Array.from(database.users.values());
  const user = users.find(u => u.customerId === customerId);
  
  if (user) {
    database.updateUser(user.id, {
      subscriptionStatus: 'cancelled'
    });
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  
  // Find user by customer ID
  const users = Array.from(database.users.values());
  const user = users.find(u => u.customerId === customerId);
  
  if (user) {
    database.updateUser(user.id, {
      subscriptionStatus: 'active'
    });
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  
  // Find user by customer ID
  const users = Array.from(database.users.values());
  const user = users.find(u => u.customerId === customerId);
  
  if (user) {
    database.updateUser(user.id, {
      subscriptionStatus: 'past_due'
    });
  }
}

// Get pricing information
export function getPricing() {
  return {
    monthly: {
      id: 'price_monthly_georgian_chat',
      amount: 999, // $9.99
      currency: 'usd',
      interval: 'month',
      name: 'Georgian Chat Pro Monthly'
    },
    yearly: {
      id: 'price_yearly_georgian_chat',
      amount: 9999, // $99.99
      currency: 'usd',
      interval: 'year',
      name: 'Georgian Chat Pro Yearly'
    }
  };
}
