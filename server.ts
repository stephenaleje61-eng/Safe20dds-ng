import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  db,
  User,
  Prediction,
  Post,
  Comment,
  ChatMessage,
  SubscriptionRecord,
} from './server/db';
import {
  hashPassword,
  comparePassword,
  normalizePhone,
  isValidPhone,
  signAuthToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  rateLimit,
  containsProhibitedContent,
  maskPhone,
  AuthenticatedRequest,
} from './server/auth';
import {
  fetchLiveScores,
  fetchMatchDetails,
  fetchStandings,
  SUPPORTED_LEAGUES,
} from './server/sportsApi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// PWA Service Worker & Manifest Endpoints with correct headers
app.get('/sw.js', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public/sw.js'));
});

app.get(['/manifest.json', '/manifest.webmanifest'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.resolve(__dirname, 'public/manifest.json'));
});

// Global Rate Limit
app.use('/api/', rateLimit(180, 60 * 1000));

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// Register with Phone Number & Password (NO email required)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { phone, username, password, securityQuestion, securityAnswer } = req.body;

    if (!phone || !password || !username) {
      return res.status(400).json({ error: 'Phone number, username, and password are required.' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        error: 'Please enter a valid international or local phone number (e.g. +2348012345678 or 08012345678).',
      });
    }

    const cleanPhone = normalizePhone(phone);

    // Prevent duplicate accounts
    const existing = db.findUserByPhone(cleanPhone);
    if (existing) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const passwordHash = await hashPassword(password);
    let secAnswerHash: string | undefined;
    if (securityAnswer) {
      secAnswerHash = await hashPassword(securityAnswer.toLowerCase().trim());
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: cleanPhone,
      username: username.trim(),
      passwordHash,
      role: 'user',
      isVip: false,
      blockedUserIds: [],
      friendIds: [],
      friendRequestsReceived: [],
      friendRequestsSent: [],
      securityQuestion: securityQuestion || 'What is your favorite football club?',
      securityAnswerHash: secAnswerHash,
      createdAt: new Date().toISOString(),
      isBanned: false,
    };

    db.createUser(newUser);

    const token = signAuthToken(newUser);

    // Return safe user object (omit passwordHash)
    const { passwordHash: _, securityAnswerHash: __, ...safeUser } = newUser;
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to complete registration. Please try again.' });
  }
});

// Login with Phone Number & Password
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    const cleanPhone = normalizePhone(phone);
    const user = db.findUserByPhone(cleanPhone);

    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    // Check VIP expiration
    if (user.isVip && user.vipExpiresAt) {
      if (new Date(user.vipExpiresAt).getTime() < Date.now()) {
        user.isVip = false;
        user.vipTier = undefined;
        db.updateUser(user.id, { isVip: false, vipTier: undefined });
      }
    }

    const token = signAuthToken(user);
    const { passwordHash: _, securityAnswerHash: __, ...safeUser } = user;

    return res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login process failed.' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { passwordHash: _, securityAnswerHash: __, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { username, bio, avatarUrl } = req.body;

  const updates: Partial<User> = {};
  if (typeof username === 'string' && username.trim().length >= 2) {
    updates.username = username.trim();
  }
  if (typeof bio === 'string') {
    updates.bio = bio.trim().slice(0, 200);
  }
  if (typeof avatarUrl === 'string') {
    updates.avatarUrl = avatarUrl.trim();
  }

  const updated = db.updateUser(user.id, updates);
  if (!updated) return res.status(404).json({ error: 'User not found' });

  const { passwordHash: _, securityAnswerHash: __, ...safeUser } = updated;
  return res.json({ user: safeUser, message: 'Profile updated successfully' });
});

// Account Recovery (Reset Password)
app.post('/api/auth/recover', async (req: Request, res: Response) => {
  try {
    const { phone, newPassword, securityAnswer } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({ error: 'Phone number and new password are required.' });
    }

    const cleanPhone = normalizePhone(phone);
    const user = db.findUserByPhone(cleanPhone);

    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone number.' });
    }

    // Verify security answer if configured
    if (user.securityAnswerHash && securityAnswer) {
      const match = await comparePassword(securityAnswer.toLowerCase().trim(), user.securityAnswerHash);
      if (!match) {
        return res.status(400).json({ error: 'Security answer does not match.' });
      }
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const newHash = await hashPassword(newPassword);
    db.updateUser(user.id, { passwordHash: newHash });

    return res.json({ message: 'Password reset successfully. You may now log in.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ----------------------------------------------------
// PREDICTIONS ENDPOINTS
// ----------------------------------------------------

// List Predictions
app.get('/api/predictions', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const isVipUser = user?.isVip || user?.role === 'admin';
  const predictions = db.getPredictions();

  // If user is not VIP, redact tactical VIP deep analysis
  const sanitized = predictions.map((p) => {
    if (p.isVipOnly && !isVipUser) {
      return {
        ...p,
        adminAnalysis: '🔒 VIP Exclusive Tactical Analysis: Upgrade to VIP to unlock full model metrics, lineup matchups, and expert tactical forecast.',
        isLocked: true,
      };
    }
    return {
      ...p,
      isLocked: false,
    };
  });

  return res.json({
    predictions: sanitized,
    disclaimer: 'Predictions are analytical and for entertainment purposes only. Sure Odd does NOT provide gambling or guaranteed winnings.',
  });
});

// Admin: Post Prediction
app.post('/api/predictions', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sport = 'Football',
      competition,
      homeTeam,
      awayTeam,
      matchTime,
      category,
      confidence = 80,
      oddsIndicator = '1.80',
      adminAnalysis,
      imageUrl,
      isVipOnly = false,
      isPinned = false,
    } = req.body;

    if (!competition || !homeTeam || !awayTeam || !matchTime || !category || !adminAnalysis) {
      return res.status(400).json({ error: 'Please fill in all required match prediction details.' });
    }

    const newPrediction: Prediction = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sport,
      competition,
      homeTeam,
      awayTeam,
      matchTime,
      category,
      confidence: Math.min(99, Math.max(50, parseInt(confidence, 10) || 80)),
      oddsIndicator,
      adminAnalysis,
      imageUrl,
      isVipOnly: Boolean(isVipOnly),
      isPinned: Boolean(isPinned),
      status: 'PENDING',
      createdBy: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createPrediction(newPrediction);
    return res.status(201).json({ prediction: newPrediction, message: 'Prediction published successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create prediction.' });
  }
});

// Admin: Update Prediction (Status, Result, Edit Content)
app.put('/api/predictions/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.findPredictionById(id);
  if (!existing) return res.status(404).json({ error: 'Prediction not found' });

  const {
    competition,
    homeTeam,
    awayTeam,
    matchTime,
    category,
    confidence,
    oddsIndicator,
    adminAnalysis,
    imageUrl,
    isVipOnly,
    isPinned,
    status,
    finalScore,
  } = req.body;

  const updates: Partial<Prediction> = {};
  if (competition !== undefined) updates.competition = competition;
  if (homeTeam !== undefined) updates.homeTeam = homeTeam;
  if (awayTeam !== undefined) updates.awayTeam = awayTeam;
  if (matchTime !== undefined) updates.matchTime = matchTime;
  if (category !== undefined) updates.category = category;
  if (confidence !== undefined) updates.confidence = Number(confidence);
  if (oddsIndicator !== undefined) updates.oddsIndicator = oddsIndicator;
  if (adminAnalysis !== undefined) updates.adminAnalysis = adminAnalysis;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (isVipOnly !== undefined) updates.isVipOnly = Boolean(isVipOnly);
  if (isPinned !== undefined) updates.isPinned = Boolean(isPinned);
  if (status !== undefined) updates.status = status;
  if (finalScore !== undefined) updates.finalScore = finalScore;

  const updated = db.updatePrediction(id, updates);
  return res.json({ prediction: updated, message: 'Prediction updated successfully' });
});

// Admin: Delete Prediction
app.delete('/api/predictions/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deletePrediction(id);
  if (!success) return res.status(404).json({ error: 'Prediction not found' });
  return res.json({ message: 'Prediction deleted successfully' });
});

// ----------------------------------------------------
// LIVE SCORES & REAL SPORTS DATA ENDPOINTS
// ----------------------------------------------------
app.get('/api/livescores', async (req: Request, res: Response) => {
  try {
    const league = (req.query.league as string) || 'ALL';
    const data = await fetchLiveScores(league);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Unable to retrieve live match fixtures' });
  }
});

// Supported leagues list
app.get('/api/livescores/leagues', (_req: Request, res: Response) => {
  return res.json({ leagues: SUPPORTED_LEAGUES });
});

// Detailed match data (Stats, Lineups, Events, Odds)
app.get('/api/livescores/match/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const league = req.query.league as string | undefined;
    const details = await fetchMatchDetails(id, league);

    if (!details) {
      return res.status(404).json({ error: 'Match detailed statistics not found or not yet available' });
    }

    return res.json({ match: details });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve match details' });
  }
});

// Real league standings
app.get('/api/livescores/standings/:league', async (req: Request, res: Response) => {
  try {
    const league = req.params.league || 'eng.1';
    const standings = await fetchStandings(league);
    return res.json({ league, standings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve standings table' });
  }
});

// ----------------------------------------------------
// VIP SUBSCRIPTION ENDPOINTS
// ----------------------------------------------------

// Subscribe to VIP (Simulated secure payment verification)
app.post('/api/vip/subscribe', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { tier } = req.body;

    const tiersMap: Record<string, { durationDays: number; amount: number }> = {
      'Weekly VIP': { durationDays: 7, amount: 1000 },
      '₦2,000 Monthly VIP': { durationDays: 30, amount: 2000 },
      '₦5,000 Monthly Premium': { durationDays: 90, amount: 5000 },
    };

    const selected = tiersMap[tier];
    if (!selected) {
      return res.status(400).json({ error: 'Invalid VIP tier selected.' });
    }

    const now = new Date();
    const expiresDate = new Date(now.getTime() + selected.durationDays * 24 * 3600 * 1000);

    const subRecord: SubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      tier,
      amountNgn: selected.amount,
      paymentReference: `SURE_VERIFY_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expiresDate.toISOString(),
    };

    db.createSubscription(subRecord);

    const updatedUser = db.updateUser(user.id, {
      isVip: true,
      vipTier: tier,
      vipExpiresAt: expiresDate.toISOString(),
    });

    const { passwordHash: _, securityAnswerHash: __, ...safeUser } = updatedUser!;
    return res.json({
      message: `Congratulations! Your ${tier} analysis pass is active.`,
      user: safeUser,
      subscription: subRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process VIP subscription' });
  }
});

// User Subscription History
app.get('/api/vip/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const subs = db.getSubscriptionsByUser(req.user!.id);
  return res.json({ subscriptions: subs });
});

// ----------------------------------------------------
// SOCIAL COMMUNITY ENDPOINTS
// ----------------------------------------------------

// List Posts
app.get('/api/community/posts', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id;
  const blockedIds = req.user?.blockedUserIds || [];

  const { posts } = db.getPosts(100, 0);

  // Filter out blocked users
  const filtered = posts.filter((p) => !blockedIds.includes(p.authorId));

  const enriched = filtered.map((post) => {
    const comments = db.getComments(post.id);
    return {
      ...post,
      commentsCount: comments.length,
      hasLiked: currentUserId ? post.likes.includes(currentUserId) : false,
      likesCount: post.likes.length,
    };
  });

  return res.json({ posts: enriched });
});

// Create Post
app.post('/api/community/posts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { content, imageUrl } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  if (containsProhibitedContent(content)) {
    return res.status(400).json({
      error: 'Post contains prohibited content, gambling solicitations, or inappropriate language.',
    });
  }

  const newPost: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorId: user.id,
    authorName: user.username,
    authorPhoneMasked: maskPhone(user.phone),
    authorIsVip: user.isVip,
    content: content.trim(),
    imageUrl,
    likes: [],
    reportsCount: 0,
    reportReasons: [],
    isPinned: false,
    createdAt: new Date().toISOString(),
  };

  db.createPost(newPost);
  return res.status(201).json({
    post: { ...newPost, commentsCount: 0, hasLiked: false, likesCount: 0 },
    message: 'Post shared to community',
  });
});

// Like / Unlike Post
app.post('/api/community/posts/:id/like', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const post = db.findPostById(id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const hasLiked = post.likes.includes(user.id);
  let updatedLikes = [...post.likes];
  if (hasLiked) {
    updatedLikes = updatedLikes.filter((uid) => uid !== user.id);
  } else {
    updatedLikes.push(user.id);
  }

  db.updatePost(id, { likes: updatedLikes });
  return res.json({ hasLiked: !hasLiked, likesCount: updatedLikes.length });
});

// Report Post
app.post('/api/community/posts/:id/report', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { reason = 'Inappropriate content' } = req.body;

  const post = db.findPostById(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const updatedReports = [
    ...post.reportReasons,
    { userId: user.id, reason: reason.slice(0, 100), createdAt: new Date().toISOString() },
  ];

  db.updatePost(id, {
    reportsCount: post.reportsCount + 1,
    reportReasons: updatedReports,
  });

  return res.json({ message: 'Thank you. The post has been flagged for admin moderation review.' });
});

// Delete Post (Author or Admin)
app.delete('/api/community/posts/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const post = db.findPostById(id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (post.authorId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'You are not authorized to delete this post' });
  }

  db.deletePost(id);
  return res.json({ message: 'Post removed' });
});

// Get Comments
app.get('/api/community/posts/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = db.getComments(id);
  return res.json({ comments });
});

// Add Comment
app.post('/api/community/posts/:id/comments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  const post = db.findPostById(id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  if (containsProhibitedContent(content)) {
    return res.status(400).json({ error: 'Comment contains inappropriate or disallowed language' });
  }

  const comment: Comment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    postId: id,
    authorId: user.id,
    authorName: user.username,
    authorIsVip: user.isVip,
    content: content.trim(),
    likes: [],
    createdAt: new Date().toISOString(),
  };

  db.createComment(comment);
  return res.status(201).json({ comment });
});

// ----------------------------------------------------
// USERS & SOCIAL CONNECTIONS
// ----------------------------------------------------

// Search users
app.get('/api/community/users/search', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  const currentUserId = req.user?.id;

  const users = db.getAllUsers()
    .filter((u) => !u.isBanned && u.id !== currentUserId)
    .filter((u) => u.username.toLowerCase().includes(q) || u.phone.includes(q))
    .slice(0, 20)
    .map((u) => ({
      id: u.id,
      username: u.username,
      phoneMasked: maskPhone(u.phone),
      isVip: u.isVip,
      bio: u.bio,
      createdAt: u.createdAt,
      isFriend: currentUserId ? u.friendIds.includes(currentUserId) : false,
      hasPendingRequest: currentUserId ? u.friendRequestsReceived.includes(currentUserId) : false,
    }));

  return res.json({ users });
});

// Get user profile
app.get('/api/community/users/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const target = db.findUserById(req.params.id);
  if (!target || target.isBanned) return res.status(404).json({ error: 'User not found' });

  const currentUserId = req.user?.id;

  return res.json({
    user: {
      id: target.id,
      username: target.username,
      phoneMasked: maskPhone(target.phone),
      bio: target.bio,
      isVip: target.isVip,
      role: target.role,
      friendsCount: target.friendIds.length,
      createdAt: target.createdAt,
      isFriend: currentUserId ? target.friendIds.includes(currentUserId) : false,
      hasPendingSent: currentUserId ? target.friendRequestsReceived.includes(currentUserId) : false,
      hasPendingReceived: currentUserId ? target.friendRequestsSent.includes(currentUserId) : false,
      isBlocked: currentUserId ? req.user?.blockedUserIds.includes(target.id) : false,
    },
  });
});

// Friend Request
app.post('/api/community/users/:id/friend-request', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const me = req.user!;
  const targetId = req.params.id;

  if (me.id === targetId) return res.status(400).json({ error: 'Cannot send request to yourself' });

  const target = db.findUserById(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (me.friendIds.includes(targetId)) {
    return res.status(400).json({ error: 'Already friends' });
  }

  // Update target received
  if (!target.friendRequestsReceived.includes(me.id)) {
    db.updateUser(target.id, {
      friendRequestsReceived: [...target.friendRequestsReceived, me.id],
    });
  }

  // Update me sent
  if (!me.friendRequestsSent.includes(target.id)) {
    db.updateUser(me.id, {
      friendRequestsSent: [...me.friendRequestsSent, target.id],
    });
  }

  return res.json({ message: 'Friend request sent' });
});

// Accept Friend Request
app.post('/api/community/users/:id/accept-friend', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const me = req.user!;
  const targetId = req.params.id;
  const target = db.findUserById(targetId);

  if (!target) return res.status(404).json({ error: 'User not found' });

  // Add to friends
  db.updateUser(me.id, {
    friendIds: Array.from(new Set([...me.friendIds, targetId])),
    friendRequestsReceived: me.friendRequestsReceived.filter((id) => id !== targetId),
  });

  db.updateUser(targetId, {
    friendIds: Array.from(new Set([...target.friendIds, me.id])),
    friendRequestsSent: target.friendRequestsSent.filter((id) => id !== me.id),
  });

  return res.json({ message: 'Friend request accepted' });
});

// Remove Friend
app.post('/api/community/users/:id/remove-friend', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const me = req.user!;
  const targetId = req.params.id;
  const target = db.findUserById(targetId);

  db.updateUser(me.id, {
    friendIds: me.friendIds.filter((id) => id !== targetId),
  });

  if (target) {
    db.updateUser(targetId, {
      friendIds: target.friendIds.filter((id) => id !== me.id),
    });
  }

  return res.json({ message: 'Friend removed' });
});

// Block / Unblock User
app.post('/api/community/users/:id/block', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const me = req.user!;
  const targetId = req.params.id;

  const isBlocked = me.blockedUserIds.includes(targetId);
  const updatedBlocked = isBlocked
    ? me.blockedUserIds.filter((id) => id !== targetId)
    : [...me.blockedUserIds, targetId];

  db.updateUser(me.id, { blockedUserIds: updatedBlocked });
  return res.json({ isBlocked: !isBlocked, message: isBlocked ? 'User unblocked' : 'User blocked' });
});

// ----------------------------------------------------
// REAL-TIME SCALABLE CHAT
// ----------------------------------------------------

// Get Chat Messages
app.get('/api/chat/messages', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const channelId = (req.query.channelId as string) || 'general';
  const before = req.query.before as string | undefined;
  const currentUserId = req.user?.id;
  const blockedIds = req.user?.blockedUserIds || [];

  const rawMessages = db.getChatMessages(channelId, 50, before);

  // Filter blocked users
  const filtered = rawMessages.filter((m) => !blockedIds.includes(m.senderId));

  return res.json({
    channelId,
    messages: filtered,
  });
});

// Send Chat Message
app.post('/api/chat/messages', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { channelId = 'general', text, sharedPredictionId, imageUrl } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (containsProhibitedContent(text)) {
    return res.status(400).json({ error: 'Message blocked by moderation filter.' });
  }

  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    channelId,
    senderId: user.id,
    senderName: user.username,
    senderIsVip: user.isVip,
    senderIsAdmin: user.role === 'admin',
    text: text.trim().slice(0, 500),
    sharedPredictionId,
    imageUrl,
    reportsCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.createChatMessage(newMsg);
  return res.status(201).json({ message: newMsg });
});

// Delete Chat Message (Own or Admin)
app.delete('/api/chat/messages/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const msg = db.getChatMessages('general', 1000).find((m) => m.id === id);

  if (!msg) {
    // Also check other channels
    const all = db.getRawData().chatMessages;
    const found = all.find((m) => m.id === id);
    if (!found) return res.status(404).json({ error: 'Message not found' });
    if (found.senderId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot delete others messages' });
    }
  } else if (msg.senderId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Cannot delete others messages' });
  }

  db.deleteChatMessage(id);
  return res.json({ message: 'Message deleted' });
});

// ----------------------------------------------------
// ADMIN DASHBOARD ENDPOINTS (Strictly Admin Protected)
// ----------------------------------------------------

// Admin platform statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRawData();
  const predictions = raw.predictions;
  const finished = predictions.filter((p) => p.status === 'WON' || p.status === 'LOST');
  const wonCount = predictions.filter((p) => p.status === 'WON').length;
  const winRate = finished.length > 0 ? Math.round((wonCount / finished.length) * 100) : 85;

  const reportedPosts = raw.posts.filter((p) => p.reportsCount > 0);
  const reportedMessages = raw.chatMessages.filter((m) => m.reportsCount > 0);

  return res.json({
    totalUsers: raw.users.length,
    activeVipCount: raw.users.filter((u) => u.isVip).length,
    totalPredictions: predictions.length,
    winRatePercent: winRate,
    totalCommunityPosts: raw.posts.length,
    openReportsCount: reportedPosts.length + reportedMessages.length,
    totalSubscriptions: raw.subscriptions.length,
    totalRevenueNgn: raw.subscriptions.reduce((sum, s) => sum + s.amountNgn, 0),
  });
});

// Admin user management list
app.get('/api/admin/users', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers().map((u) => {
    const { passwordHash: _, securityAnswerHash: __, ...safe } = u;
    return safe;
  });
  return res.json({ users });
});

// Admin toggle ban user
app.post('/api/admin/users/:id/toggle-ban', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const target = db.findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin') return res.status(400).json({ error: 'Cannot ban another administrator' });

  const updated = db.updateUser(target.id, { isBanned: !target.isBanned });
  return res.json({ user: updated, message: updated?.isBanned ? 'User banned' : 'User unbanned' });
});

// Admin toggle VIP status for user
app.post('/api/admin/users/:id/toggle-vip', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const target = db.findUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const newVip = !target.isVip;
  const expires = newVip ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() : undefined;
  const updated = db.updateUser(target.id, {
    isVip: newVip,
    vipTier: newVip ? 'Admin Granted VIP' : undefined,
    vipExpiresAt: expires,
  });

  return res.json({ user: updated, message: newVip ? 'VIP access granted' : 'VIP access revoked' });
});

// Admin view moderation reports
app.get('/api/admin/reports', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const raw = db.getRawData();
  const reportedPosts = raw.posts
    .filter((p) => p.reportsCount > 0)
    .map((p) => ({
      type: 'post',
      id: p.id,
      authorName: p.authorName,
      content: p.content,
      reportsCount: p.reportsCount,
      reasons: p.reportReasons,
    }));

  return res.json({ reports: reportedPosts });
});

// Admin dismiss reports on post
app.post('/api/admin/reports/:id/dismiss', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const post = db.findPostById(id);
  if (post) {
    db.updatePost(id, { reportsCount: 0, reportReasons: [] });
  }
  return res.json({ message: 'Reports cleared' });
});

// ----------------------------------------------------
// VITE INTEGRATION / STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    // Dev mode: dynamically mount Vite middleware
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[Server] Vite middleware mounted for development (HMR: ${!isHmrDisabled}).`);
  } else {
    // Production mode: serve built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving production build from dist/.');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sure Odd] Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
