import AuditLog from '../models/auditLogModel.js';

export const logAuditEvent = async ({
  req,
  actor = null,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      actor: actor?._id || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || null,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || null,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
