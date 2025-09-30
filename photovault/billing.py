"""
PhotoVault Billing Blueprint
Handles subscription management, Stripe checkout, and billing for Malaysian market
"""
from datetime import datetime, timedelta
from decimal import Decimal
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from photovault.extensions import db
from photovault.models import SubscriptionPlan, UserSubscription, Invoice, PaymentHistory
import stripe
import os

billing_bp = Blueprint('billing', __name__, url_prefix='/billing')

# Initialize Stripe with API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


@billing_bp.route('/plans')
def plans():
    """Display available subscription plans"""
    plans = SubscriptionPlan.query.filter_by(is_active=True).order_by(SubscriptionPlan.sort_order).all()
    
    # Get user's current subscription if logged in
    current_subscription = None
    if current_user.is_authenticated:
        current_subscription = UserSubscription.query.filter_by(
            user_id=current_user.id,
            status='active'
        ).first()
    
    return render_template('billing/plans.html', 
                         plans=plans, 
                         current_subscription=current_subscription)


@billing_bp.route('/subscribe/<int:plan_id>', methods=['POST'])
@login_required
def subscribe(plan_id):
    """Create Stripe checkout session for subscription"""
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    
    # Check if user already has an active subscription
    existing_sub = UserSubscription.query.filter_by(
        user_id=current_user.id,
        status='active'
    ).first()
    
    if existing_sub:
        flash('You already have an active subscription. Please cancel it first before subscribing to a new plan.', 'warning')
        return redirect(url_for('billing.dashboard'))
    
    try:
        # Create or get Stripe customer
        if not hasattr(current_user, 'stripe_customer_id') or not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.username,
                metadata={'user_id': current_user.id}
            )
            customer_id = customer.id
        else:
            customer_id = current_user.stripe_customer_id
        
        # Calculate price in cents (Stripe uses smallest currency unit)
        # For MYR: 1 MYR = 100 sen
        total_price = plan.total_price_myr
        price_in_sen = int(total_price * 100)
        
        # Create Stripe checkout session
        success_url = url_for('billing.success', _external=True) + '?session_id={CHECKOUT_SESSION_ID}'
        cancel_url = url_for('billing.plans', _external=True)
        
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card', 'fpx'],  # Card and Malaysian FPX
            line_items=[{
                'price_data': {
                    'currency': 'myr',
                    'product_data': {
                        'name': plan.display_name,
                        'description': plan.description,
                    },
                    'unit_amount': price_in_sen,
                    'recurring': {'interval': 'month'}
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'user_id': current_user.id,
                'plan_id': plan.id,
                'plan_name': plan.name
            }
        )
        
        return redirect(checkout_session.url, code=303)
        
    except Exception as e:
        current_app.logger.error(f"Stripe checkout error: {str(e)}")
        flash(f'Error creating checkout session: {str(e)}', 'danger')
        return redirect(url_for('billing.plans'))


@billing_bp.route('/success')
@login_required
def success():
    """Handle successful subscription payment"""
    session_id = request.args.get('session_id')
    
    if not session_id:
        flash('Invalid session', 'danger')
        return redirect(url_for('billing.dashboard'))
    
    try:
        # Retrieve the checkout session
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            # Get subscription details
            subscription = stripe.Subscription.retrieve(session.subscription)
            
            # Get plan from metadata
            plan_id = int(session.metadata.get('plan_id'))
            plan = SubscriptionPlan.query.get(plan_id)
            
            # Create user subscription record
            user_sub = UserSubscription(
                user_id=current_user.id,
                plan_id=plan_id,
                status='active',
                stripe_subscription_id=subscription.id,
                stripe_customer_id=session.customer,
                start_date=datetime.utcnow(),
                current_period_start=datetime.fromtimestamp(subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end),
                next_billing_date=datetime.fromtimestamp(subscription.current_period_end)
            )
            db.session.add(user_sub)
            
            # Create invoice
            invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m')}-{current_user.id:04d}"
            invoice = Invoice(
                invoice_number=invoice_number,
                user_id=current_user.id,
                subscription_id=user_sub.id,
                billing_name=current_user.username,
                billing_email=current_user.email,
                subtotal=plan.price_myr,
                sst_rate=plan.sst_rate,
                sst_amount=Decimal(str(plan.sst_amount)),
                total=Decimal(str(plan.total_price_myr)),
                currency='MYR',
                description=f"{plan.display_name} Subscription",
                status='paid',
                issue_date=datetime.utcnow(),
                paid_date=datetime.utcnow(),
                stripe_invoice_id=session.invoice if hasattr(session, 'invoice') else None,
                stripe_payment_intent_id=session.payment_intent
            )
            db.session.add(invoice)
            
            # Create payment history record
            payment = PaymentHistory(
                user_id=current_user.id,
                invoice_id=invoice.id,
                amount=Decimal(str(plan.total_price_myr)),
                currency='MYR',
                stripe_payment_intent_id=session.payment_intent,
                payment_method='card',
                status='succeeded',
                description=f"Subscription to {plan.display_name}",
                payment_date=datetime.utcnow()
            )
            db.session.add(payment)
            
            db.session.commit()
            
            flash(f'Successfully subscribed to {plan.display_name}!', 'success')
        else:
            flash('Payment not completed. Please try again.', 'warning')
            
    except Exception as e:
        current_app.logger.error(f"Error processing subscription success: {str(e)}")
        flash('Error processing subscription. Please contact support.', 'danger')
    
    return redirect(url_for('billing.dashboard'))


@billing_bp.route('/dashboard')
@login_required
def dashboard():
    """User billing dashboard"""
    # Get active subscription
    subscription = UserSubscription.query.filter_by(
        user_id=current_user.id,
        status='active'
    ).first()
    
    # Get invoices
    invoices = Invoice.query.filter_by(user_id=current_user.id).order_by(Invoice.created_at.desc()).limit(10).all()
    
    # Get payment history
    payments = PaymentHistory.query.filter_by(user_id=current_user.id).order_by(PaymentHistory.created_at.desc()).limit(10).all()
    
    return render_template('billing/dashboard.html',
                         subscription=subscription,
                         invoices=invoices,
                         payments=payments)


@billing_bp.route('/cancel', methods=['POST'])
@login_required
def cancel_subscription():
    """Cancel user subscription"""
    subscription = UserSubscription.query.filter_by(
        user_id=current_user.id,
        status='active'
    ).first()
    
    if not subscription:
        flash('No active subscription found.', 'warning')
        return redirect(url_for('billing.dashboard'))
    
    try:
        # Cancel Stripe subscription at period end
        stripe_sub = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        # Update local subscription
        subscription.cancel_at_period_end = True
        subscription.cancel_reason = request.form.get('reason', 'User requested cancellation')
        db.session.commit()
        
        flash('Your subscription will be canceled at the end of the current billing period.', 'info')
        
    except Exception as e:
        current_app.logger.error(f"Error canceling subscription: {str(e)}")
        flash(f'Error canceling subscription: {str(e)}', 'danger')
    
    return redirect(url_for('billing.dashboard'))


@billing_bp.route('/reactivate', methods=['POST'])
@login_required
def reactivate_subscription():
    """Reactivate a canceled subscription"""
    subscription = UserSubscription.query.filter_by(
        user_id=current_user.id,
        status='active'
    ).first()
    
    if not subscription or not subscription.cancel_at_period_end:
        flash('No canceled subscription found.', 'warning')
        return redirect(url_for('billing.dashboard'))
    
    try:
        # Reactivate Stripe subscription
        stripe_sub = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=False
        )
        
        # Update local subscription
        subscription.cancel_at_period_end = False
        subscription.cancel_reason = None
        db.session.commit()
        
        flash('Your subscription has been reactivated!', 'success')
        
    except Exception as e:
        current_app.logger.error(f"Error reactivating subscription: {str(e)}")
        flash(f'Error reactivating subscription: {str(e)}', 'danger')
    
    return redirect(url_for('billing.dashboard'))


@billing_bp.route('/upgrade/<int:plan_id>', methods=['POST'])
@login_required
def upgrade_plan(plan_id):
    """Upgrade to a different subscription plan"""
    new_plan = SubscriptionPlan.query.get_or_404(plan_id)
    
    # Get current subscription
    subscription = UserSubscription.query.filter_by(
        user_id=current_user.id,
        status='active'
    ).first()
    
    if not subscription:
        flash('No active subscription found. Please subscribe first.', 'warning')
        return redirect(url_for('billing.plans'))
    
    if subscription.plan_id == plan_id:
        flash('You are already on this plan.', 'info')
        return redirect(url_for('billing.dashboard'))
    
    try:
        # Update Stripe subscription
        # This will prorate the charges automatically
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
        
        # Update subscription with new plan
        # Note: You would need to create Stripe Price IDs for each plan first
        flash('Plan upgrade feature coming soon. Please contact support.', 'info')
        
    except Exception as e:
        current_app.logger.error(f"Error upgrading plan: {str(e)}")
        flash(f'Error upgrading plan: {str(e)}', 'danger')
    
    return redirect(url_for('billing.dashboard'))


@billing_bp.route('/invoice/<int:invoice_id>')
@login_required
def view_invoice(invoice_id):
    """View invoice details"""
    invoice = Invoice.query.get_or_404(invoice_id)
    
    # Ensure user owns this invoice
    if invoice.user_id != current_user.id and not current_user.is_admin:
        flash('Access denied.', 'danger')
        return redirect(url_for('billing.dashboard'))
    
    return render_template('billing/invoice.html', invoice=invoice)


@billing_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks for subscription events"""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        handle_payment_succeeded(invoice)
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        handle_payment_failed(invoice)
    
    return jsonify({'status': 'success'}), 200


def handle_subscription_updated(stripe_subscription):
    """Handle subscription update webhook"""
    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=stripe_subscription['id']
    ).first()
    
    if subscription:
        subscription.current_period_start = datetime.fromtimestamp(stripe_subscription['current_period_start'])
        subscription.current_period_end = datetime.fromtimestamp(stripe_subscription['current_period_end'])
        subscription.status = stripe_subscription['status']
        db.session.commit()


def handle_subscription_deleted(stripe_subscription):
    """Handle subscription deletion webhook"""
    subscription = UserSubscription.query.filter_by(
        stripe_subscription_id=stripe_subscription['id']
    ).first()
    
    if subscription:
        subscription.status = 'canceled'
        subscription.ended_at = datetime.utcnow()
        db.session.commit()


def handle_payment_succeeded(stripe_invoice):
    """Handle successful payment webhook"""
    # Update invoice status
    invoice = Invoice.query.filter_by(
        stripe_invoice_id=stripe_invoice['id']
    ).first()
    
    if invoice:
        invoice.status = 'paid'
        invoice.paid_date = datetime.utcnow()
        db.session.commit()


def handle_payment_failed(stripe_invoice):
    """Handle failed payment webhook"""
    # Log payment failure
    current_app.logger.error(f"Payment failed for invoice: {stripe_invoice['id']}")
    # You could send email notification here
