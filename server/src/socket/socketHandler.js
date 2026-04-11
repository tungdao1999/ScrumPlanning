const UserStory = require('../models/UserStory');
const Session = require('../models/Session');

// Helper: can manage session (start/stop voting, stories, points)
const canManage = (p) => p?.isAdmin || p?.role === 'sm';
// Helper: can cast a vote card
const canVote = (p) => p?.role !== 'sm';

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    /* ─── Join session room ─── */
    socket.on('join-session', async ({ sessionCode, userId, userName }) => {
      try {
        socket.join(sessionCode);
        socket.data.sessionCode = sessionCode;
        socket.data.userId = userId;
        socket.data.userName = userName;

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': userId },
          { $set: { 'participants.$.isOnline': true } }
        );

        const session = await Session.findOne({ code: sessionCode });
        if (!session) return;
        const stories = await UserStory.find({ sessionId: session._id }).sort('order');

        io.to(sessionCode).emit('session-updated', { session, stories });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Add user story ─── */
    socket.on('add-story', async ({ sessionCode, title, description, sessionId }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        const allowed = canManage(actor) || actor?.permissions?.includes('create_story');
        if (!allowed) {
          return socket.emit('permission-denied', { action: 'add-story' });
        }
        const count = await UserStory.countDocuments({ sessionId });
        const story = new UserStory({ sessionId, title, description, order: count });
        await story.save();
        const stories = await UserStory.find({ sessionId }).sort('order');
        io.to(sessionCode).emit('stories-updated', { stories });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Delete user story ─── */
    socket.on('delete-story', async ({ sessionCode, storyId, sessionId }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        const allowed = canManage(actor) || actor?.permissions?.includes('delete_story');
        if (!allowed) {
          return socket.emit('permission-denied', { action: 'delete-story' });
        }
        await UserStory.findByIdAndDelete(storyId);
        const stories = await UserStory.find({ sessionId }).sort('order');
        io.to(sessionCode).emit('stories-updated', { stories });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Grant permission (admin only) ─── */
    socket.on('grant-permission', async ({ sessionCode, targetUserId, permission }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!actor?.isAdmin) return socket.emit('permission-denied', { action: 'grant-permission' });

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': targetUserId },
          { $addToSet: { 'participants.$.permissions': permission } }
        );
        const updated = await Session.findOne({ code: sessionCode });
        io.to(sessionCode).emit('permissions-updated', { participants: updated.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Revoke permission (admin only) ─── */
    socket.on('revoke-permission', async ({ sessionCode, targetUserId, permission }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!actor?.isAdmin) return socket.emit('permission-denied', { action: 'revoke-permission' });

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': targetUserId },
          { $pull: { 'participants.$.permissions': permission } }
        );
        const updated = await Session.findOne({ code: sessionCode });
        io.to(sessionCode).emit('permissions-updated', { participants: updated.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Grant admin (admin only) ─── */
    socket.on('grant-admin', async ({ sessionCode, targetUserId }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!actor?.isAdmin) return socket.emit('permission-denied', { action: 'grant-admin' });

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': targetUserId },
          { $set: { 'participants.$.isAdmin': true } }
        );
        const updated = await Session.findOne({ code: sessionCode });
        io.to(sessionCode).emit('permissions-updated', { participants: updated.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Revoke admin (admin only, cannot revoke self if last admin) ─── */
    socket.on('revoke-admin', async ({ sessionCode, targetUserId }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!actor?.isAdmin) return socket.emit('permission-denied', { action: 'revoke-admin' });

        // Prevent removing the last admin
        const adminCount = session.participants.filter((p) => p.isAdmin).length;
        const target = session.participants.find((p) => p.userId === targetUserId);
        if (target?.isAdmin && adminCount <= 1) {
          return socket.emit('permission-denied', { action: 'revoke-admin', reason: 'last-admin' });
        }

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': targetUserId },
          { $set: { 'participants.$.isAdmin': false } }
        );
        const updated = await Session.findOne({ code: sessionCode });
        io.to(sessionCode).emit('permissions-updated', { participants: updated.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Set role (admin only) ─── */
    socket.on('set-role', async ({ sessionCode, targetUserId, role }) => {
      try {
        if (!['sm', 'dev'].includes(role)) return;
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!actor?.isAdmin) return socket.emit('permission-denied', { action: 'set-role' });

        await Session.updateOne(
          { code: sessionCode, 'participants.userId': targetUserId },
          { $set: { 'participants.$.role': role } }
        );
        const updated = await Session.findOne({ code: sessionCode });
        io.to(sessionCode).emit('permissions-updated', { participants: updated.participants });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Select a story to view (no reset) ─── */
    socket.on('select-story', async ({ sessionCode, storyId }) => {
      try {
        const sessionCheck = await Session.findOne({ code: sessionCode });
        const actor = sessionCheck?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'select-story' });
        const story = await UserStory.findById(storyId);
        const updatedSession = await Session.findOneAndUpdate(
          { code: sessionCode },
          { currentStoryId: storyId },
          { new: true }
        );
        io.to(sessionCode).emit('story-selected', { story, session: updatedSession });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Start voting on a story ─── */
    socket.on('start-voting', async ({ sessionCode, storyId }) => {
      try {
        const sessionCheck = await Session.findOne({ code: sessionCode });
        const actor = sessionCheck?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'start-voting' });
        const story = await UserStory.findByIdAndUpdate(
          storyId,
          { status: 'voting', votes: [], finalPoint: null, owner: { userId: null, userName: null } },
          { new: true }
        );
        const updatedSession = await Session.findOneAndUpdate(
          { code: sessionCode },
          { currentStoryId: storyId, status: 'active' },
          { new: true }
        );
        io.to(sessionCode).emit('voting-started', { story, session: updatedSession });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Submit a vote ─── */
    socket.on('submit-vote', async ({ sessionCode, storyId, userId, userName, point }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!canVote(actor)) {
          return socket.emit('permission-denied', { action: 'submit-vote', reason: 'sm-no-vote' });
        }
        const story = await UserStory.findById(storyId);
        if (!story || story.status !== 'voting') return;

        const existing = story.votes.find((v) => v.userId === userId);
        if (existing) {
          existing.point = point;
        } else {
          story.votes.push({ userId, userName, point });
        }
        await story.save();

        io.to(sessionCode).emit('vote-submitted', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Reveal all votes ─── */
    socket.on('reveal-votes', async ({ sessionCode, storyId }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'reveal-votes' });
        const story = await UserStory.findByIdAndUpdate(
          storyId,
          { status: 'revealed' },
          { new: true }
        );
        io.to(sessionCode).emit('votes-revealed', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Set final story point ─── */
    socket.on('set-final-point', async ({ sessionCode, storyId, finalPoint }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'set-final-point' });

        // Fetch first so we can check owner
        const existing = await UserStory.findById(storyId);
        const hasOwner = !!existing?.owner?.userId;
        const story = await UserStory.findByIdAndUpdate(
          storyId,
          { finalPoint, ...(hasOwner ? { status: 'done' } : {}) },
          { new: true }
        );
        io.to(sessionCode).emit('final-point-set', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Lucky Round: randomly select story owner ─── */
    socket.on('lucky-round', async ({ sessionCode, storyId, participants }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'lucky-round' });
        const eligible = (participants || []).filter((p) => p.isOnline && p.role !== 'sm');
        if (eligible.length === 0) return;

        const winner = eligible[Math.floor(Math.random() * eligible.length)];

        const existing = await UserStory.findById(storyId);
        const hasPoint = !!existing?.finalPoint;
        const story = await UserStory.findByIdAndUpdate(
          storyId,
          { owner: { userId: winner.userId, userName: winner.name }, ...(hasPoint ? { status: 'done' } : {}) },
          { new: true }
        );
        io.to(sessionCode).emit('owner-selected', { story, winner });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Set owner directly (admin/SM, no spin) ─── */
    socket.on('set-owner', async ({ sessionCode, storyId, ownerId, ownerName }) => {
      try {
        const session = await Session.findOne({ code: sessionCode });
        const actor = session?.participants.find((p) => p.userId === socket.data.userId);
        if (!canManage(actor)) return socket.emit('permission-denied', { action: 'set-owner' });

        const existing = await UserStory.findById(storyId);
        const hasPoint = !!existing?.finalPoint;
        const story = await UserStory.findByIdAndUpdate(
          storyId,
          { owner: { userId: ownerId, userName: ownerName }, ...(hasPoint ? { status: 'done' } : {}) },
          { new: true }
        );
        // Use owner-set (not owner-selected) so clients don't trigger lucky-round overlay
        io.to(sessionCode).emit('owner-set', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Add note to a story ─── */
    socket.on('add-note', async ({ sessionCode, storyId, userId, userName, content }) => {
      try {
        const story = await UserStory.findById(storyId);
        if (!story) return;
        story.notes.push({ userId, userName, content });
        await story.save();
        io.to(sessionCode).emit('note-added', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Delete note ─── */
    socket.on('delete-note', async ({ sessionCode, storyId, noteId }) => {
      try {
        const story = await UserStory.findById(storyId);
        if (!story) return;
        story.notes = story.notes.filter((n) => n._id.toString() !== noteId);
        await story.save();
        io.to(sessionCode).emit('note-deleted', { story });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    /* ─── Disconnect ─── */
    socket.on('disconnect', async () => {
      const { sessionCode, userId } = socket.data;
      if (sessionCode && userId) {
        try {
          await Session.updateOne(
            { code: sessionCode, 'participants.userId': userId },
            { $set: { 'participants.$.isOnline': false } }
          );
          const session = await Session.findOne({ code: sessionCode });
          if (session) {
            const stories = await UserStory.find({ sessionId: session._id }).sort('order');
            io.to(sessionCode).emit('session-updated', { session, stories });
          }
        } catch (err) {
          console.error('Disconnect handler error:', err.message);
        }
      }
    });
  });
};

module.exports = socketHandler;
