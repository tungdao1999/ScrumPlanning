import { useSocket } from '../../context/SocketContext'
import './TeamPanel.css'

const PERMISSIONS = [
  { key: 'create_story', label: 'Create Stories', icon: '➕' },
  { key: 'delete_story', label: 'Delete Stories', icon: '🗑' }
]

const TeamPanel = ({ participants, currentUser, sessionCode }) => {
  const socket = useSocket()
  const amAdmin = currentUser?.isAdmin

  const togglePermission = (targetUserId, permission, hasIt) => {
    const event = hasIt ? 'revoke-permission' : 'grant-permission'
    socket.emit(event, { sessionCode, targetUserId, permission })
  }

  const grantAdmin = (targetUserId) => {
    socket.emit('grant-admin', { sessionCode, targetUserId })
  }

  const revokeAdmin = (targetUserId) => {
    socket.emit('revoke-admin', { sessionCode, targetUserId })
  }

  const setRole = (targetUserId, role) => {
    socket.emit('set-role', { sessionCode, targetUserId, role })
  }

  const adminCount = participants.filter((p) => p.isAdmin).length

  return (
    <div className="team-panel">
      <div className="team-panel-header">
        <h3>👥 Team &amp; Roles</h3>
        <p className="team-panel-hint">
          {amAdmin
            ? 'Grant admin rights or change member roles'
            : 'View team members and their roles'}
        </p>
      </div>

      <div className="team-members">
        {participants.map((p) => {
          const isSelf = p.userId === currentUser?.userId
          const isAdminRow = p.isAdmin
          const isSMRow = p.role === 'sm'

          return (
            <div key={p.userId} className={`team-member-row ${p.isOnline ? 'online' : 'offline'}`}>
              {/* Avatar + name */}
              <div className="member-identity">
                <div className="member-avatar">
                  {p.name[0].toUpperCase()}
                  <span className={`presence-dot ${p.isOnline ? 'green' : 'grey'}`} />
                </div>
                <div className="member-info">
                  <span className="member-name">
                    {p.name}
                    {isSelf && <span className="self-tag">you</span>}
                  </span>
                  <div className="member-badges">
                    {isAdminRow && <span className="badge badge-admin">★ Admin</span>}
                    <span className={`badge badge-role badge-${p.role || 'dev'}`}>
                      {isSMRow ? '📋 SM' : '🔨 Dev'}
                    </span>
                    {!p.isOnline && <span className="badge badge-away">away</span>}
                  </div>
                </div>
              </div>

              {/* Controls column */}
              <div className="member-controls">
                {/* Admin grant/revoke (admin only, not self) */}
                {amAdmin && !isSelf && (
                  isAdminRow ? (
                    <button
                      className="ctrl-btn ctrl-revoke-admin"
                      onClick={() => revokeAdmin(p.userId)}
                      disabled={adminCount <= 1}
                      title={adminCount <= 1 ? 'Cannot remove the last admin' : `Revoke admin from ${p.name}`}
                    >
                      ★ Revoke Admin
                    </button>
                  ) : (
                    <button
                      className="ctrl-btn ctrl-grant-admin"
                      onClick={() => grantAdmin(p.userId)}
                      title={`Grant admin to ${p.name}`}
                    >
                      ★ Grant Admin
                    </button>
                  )
                )}

                {/* Role toggle (admin only) */}
                {amAdmin && (
                  <button
                    className={`ctrl-btn ctrl-role ${isSMRow ? 'is-sm' : 'is-dev'}`}
                    onClick={() => setRole(p.userId, isSMRow ? 'dev' : 'sm')}
                    title={`Switch ${p.name} to ${isSMRow ? 'Developer' : 'Scrum Master'}`}
                  >
                    {isSMRow ? '🔨 Set Dev' : '📋 Set SM'}
                  </button>
                )}

                {/* Granular permissions — only for Dev role, non-admin */}
                {!isAdminRow && !isSMRow && (
                  <div className="member-permissions">
                    {PERMISSIONS.map((perm) => {
                      const hasIt = p.permissions?.includes(perm.key)
                      return (
                        <button
                          key={perm.key}
                          className={`perm-toggle ${hasIt ? 'granted' : ''}`}
                          onClick={() => togglePermission(p.userId, perm.key, hasIt)}
                          title={`${hasIt ? 'Revoke' : 'Grant'} "${perm.label}" for ${p.name}`}
                          disabled={!amAdmin}
                        >
                          <span className="perm-icon">{perm.icon}</span>
                          <span className="perm-label">{perm.label}</span>
                          <span className="perm-status">{hasIt ? '✓' : '✕'}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* SM/Admin: show their capabilities note */}
                {(isAdminRow || isSMRow) && (
                  <span className="all-access-tag">
                    {isAdminRow ? 'Full access + admin' : 'Manages stories & voting'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeamPanel
