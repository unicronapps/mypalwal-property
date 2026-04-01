const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { query, getClient } = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// Razorpay helper — lazy-init so app boots even without keys
let razorpayInstance = null;
function getRazorpay() {
  if (!razorpayInstance) {
    const Razorpay = require("razorpay");
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// ─── GET /api/plans — all active plans ───
router.get("/plans", async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, price, listing_limit, duration_days, features, display_order
     FROM plans WHERE is_active = true ORDER BY display_order ASC`,
  );
  return res.json({ success: true, data: { plans: rows } });
});

// ─── GET /api/payments/subscription/status — current user's active subscription ───
router.get("/subscription/status", verifyToken, async (req, res) => {
  // Active subscription
  const { rows: subRows } = await query(
    `SELECT s.id, s.plan_id, s.amount, s.status, s.starts_at, s.expires_at,
            p.name as plan_name, p.listing_limit, p.features
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
     ORDER BY s.expires_at DESC LIMIT 1`,
    [req.user.id],
  );

  const subscription = subRows[0] || null;

  // Current listing count (non-deleted)
  const { rows: countRow } = await query(
    `SELECT COUNT(*) FROM properties WHERE owner_id = $1 AND status != 'inactive'`,
    [req.user.id],
  );
  const listingsUsed = parseInt(countRow[0].count, 10);

  // Default to Free plan limits if no subscription
  let listingLimit = 5;
  let planName = "Free";
  if (subscription) {
    listingLimit = subscription.listing_limit;
    planName = subscription.plan_name;
  }

  return res.json({
    success: true,
    data: {
      subscription,
      plan_name: planName,
      listings_used: listingsUsed,
      listing_limit: listingLimit,
      can_post: listingLimit === -1 || listingsUsed < listingLimit,
    },
  });
});

// ─── POST /api/payments/order — create Razorpay order ───
router.post("/order", verifyToken, async (req, res) => {
  const { type, plan_id, property_id, duration_days } = req.body;

  if (!type || !["subscription", "boost"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "type must be subscription or boost",
      code: "VALIDATION_ERROR",
    });
  }

  let amount = 0;
  let metadata = {};

  if (type === "subscription") {
    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: "plan_id required for subscription",
        code: "VALIDATION_ERROR",
      });
    }
    const { rows: planRows } = await query(
      `SELECT id, name, price, listing_limit, duration_days FROM plans WHERE id = $1 AND is_active = true`,
      [plan_id],
    );
    if (!planRows.length) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
        code: "NOT_FOUND",
      });
    }
    const plan = planRows[0];
    if (plan.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Free plan does not require payment",
        code: "FREE_PLAN",
      });
    }
    amount = plan.price;
    metadata = {
      plan_id: plan.id,
      plan_name: plan.name,
      duration_days: plan.duration_days,
    };
  }

  if (type === "boost") {
    if (!property_id) {
      return res.status(400).json({
        success: false,
        message: "property_id required for boost",
        code: "VALIDATION_ERROR",
      });
    }
    // Validate ownership
    const { rows: propRows } = await query(
      `SELECT id, property_id, title, owner_id FROM properties WHERE id = $1`,
      [property_id],
    );
    if (!propRows.length) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
        code: "NOT_FOUND",
      });
    }
    if (propRows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not your property",
        code: "FORBIDDEN",
      });
    }

    // Boost pricing by duration
    const days = duration_days || 7;
    const boostPricing = { 7: 199, 15: 349, 30: 599 };
    amount = boostPricing[days] || boostPricing[7];
    metadata = {
      property_id,
      property_pid: propRows[0].property_id,
      duration_days: days,
    };
  }

  // Create Razorpay order
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `${type}_${req.user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: req.user.id, type, ...metadata },
    });

    // Log payment record
    await query(
      `INSERT INTO payments (user_id, type, razorpay_order_id, amount, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, type, order.id, amount, JSON.stringify(metadata)],
    );

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        amountPaise: order.amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error("Razorpay order error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      code: "PAYMENT_ERROR",
    });
  }
});

// ─── POST /api/payments/verify — verify Razorpay signature ───
router.post("/verify", verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message:
        "razorpay_order_id, razorpay_payment_id, razorpay_signature required",
      code: "VALIDATION_ERROR",
    });
  }

  // Verify signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Payment verification failed",
      code: "SIGNATURE_MISMATCH",
    });
  }

  // Get payment record
  const { rows: paymentRows } = await query(
    `SELECT id, type, metadata FROM payments WHERE razorpay_order_id = $1 AND user_id = $2`,
    [razorpay_order_id, req.user.id],
  );
  if (!paymentRows.length) {
    return res.status(404).json({
      success: false,
      message: "Payment record not found",
      code: "NOT_FOUND",
    });
  }

  const payment = paymentRows[0];
  const meta = payment.metadata;

  const client = await getClient();
  try {
    await client.query("BEGIN");

    // Update payment status
    await client.query(
      `UPDATE payments SET status = 'paid', razorpay_payment_id = $1, updated_at = NOW() WHERE id = $2`,
      [razorpay_payment_id, payment.id],
    );

    if (payment.type === "subscription") {
      const durationDays = meta.duration_days || 30;
      await client.query(
        `INSERT INTO subscriptions (user_id, plan_id, razorpay_order_id, razorpay_payment_id, amount, starts_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '1 day' * $6)`,
        [
          req.user.id,
          meta.plan_id,
          razorpay_order_id,
          razorpay_payment_id,
          payment.metadata.price || 0,
          durationDays,
        ],
      );
      // Expire any older active subscriptions
      await client.query(
        `UPDATE subscriptions SET status = 'expired'
         WHERE user_id = $1 AND status = 'active'
           AND id != (SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY expires_at DESC LIMIT 1)`,
        [req.user.id],
      );
    }

    if (payment.type === "boost") {
      const durationDays = meta.duration_days || 7;
      await client.query(
        `INSERT INTO boosts (property_id, user_id, razorpay_order_id, razorpay_payment_id, amount, duration_days, starts_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '1 day' * $7)`,
        [
          meta.property_id,
          req.user.id,
          razorpay_order_id,
          razorpay_payment_id,
          0,
          durationDays,
          durationDays,
        ],
      );
      await client.query(
        `UPDATE properties SET is_boosted = true, boost_expires_at = NOW() + INTERVAL '1 day' * $1 WHERE id = $2`,
        [durationDays, meta.property_id],
      );
    }

    await client.query("COMMIT");
    return res.json({
      success: true,
      data: { message: "Payment verified and activated", type: payment.type },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Payment verify error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process payment",
      code: "DB_ERROR",
    });
  } finally {
    client.release();
  }
});

// ─── POST /api/payments/webhook — Razorpay webhook events ───
router.post("/webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers["x-razorpay-signature"];
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (signature !== expectedSig) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === "payment.failed") {
    const orderId = payload?.payment?.entity?.order_id;
    if (orderId) {
      await query(
        `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE razorpay_order_id = $1`,
        [orderId],
      );
    }
  }

  if (event === "refund.created") {
    const paymentId = payload?.refund?.entity?.payment_id;
    if (paymentId) {
      await query(
        `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE razorpay_payment_id = $1`,
        [paymentId],
      );
    }
  }

  return res.json({ success: true });
});

// ─── GET /api/payments/history — payment history ───
router.get("/history", verifyToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const countRes = await query(
    `SELECT COUNT(*) FROM payments WHERE user_id = $1`,
    [req.user.id],
  );

  const { rows } = await query(
    `SELECT id, type, razorpay_order_id, razorpay_payment_id, amount, currency, status, metadata, created_at
     FROM payments WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, limitNum, offset],
  );

  return res.json({
    success: true,
    data: {
      payments: rows,
      total: parseInt(countRes.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    },
  });
});

module.exports = router;
