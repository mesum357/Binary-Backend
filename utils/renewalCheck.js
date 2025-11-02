import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';

export const checkRenewals = async () => {
  try {
    const now = new Date();
    // Calculate date 5 days from now (renewal notification date)
    const renewalNotificationDate = new Date(now);
    renewalNotificationDate.setDate(renewalNotificationDate.getDate() + 5);
    
    // Find courses that:
    // 1. Are approved
    // 2. Have an expiration date within 5 days
    // 3. Haven't expired yet
    // 4. Haven't had renewal notification sent
    const expiringEnrollments = await Enrollment.find({
      status: 'approved',
      expired: false,
      renewalNotificationSent: false,
      expirationDate: {
        $gte: now,
        $lte: renewalNotificationDate,
      },
    });
    
    let notificationsCreated = 0;
    
    for (const enrollment of expiringEnrollments) {
      try {
        // Create renewal notification
        await Notification.create({
          user: enrollment.user.userId,
          type: 'course_renewal',
          title: 'Course Expiring Soon',
          message: `Your course "${enrollment.course.title}" is expiring in 5 days. Please renew to continue access.`,
          enrollmentId: enrollment._id,
        });
        
        // Mark renewal notification as sent
        enrollment.renewalNotificationSent = true;
        await enrollment.save();
        
        notificationsCreated++;
      } catch (notifError) {
        console.error(`Error creating renewal notification for enrollment ${enrollment._id}:`, notifError);
      }
    }
    
    // Also check for expired courses and mark them
    const expiredEnrollments = await Enrollment.find({
      status: 'approved',
      expired: false,
      expirationDate: {
        $lt: now,
      },
    });
    
    let expiredCount = 0;
    for (const enrollment of expiredEnrollments) {
      enrollment.expired = true;
      await enrollment.save();
      expiredCount++;
    }
    
    if (notificationsCreated > 0 || expiredCount > 0) {
      console.log(`Renewal check completed: ${notificationsCreated} notifications created, ${expiredCount} courses expired`);
    }
  } catch (error) {
    console.error('Error checking course renewals:', error);
  }
};



