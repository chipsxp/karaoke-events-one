'use server';

import { connectToDatabase } from '@/lib/database';
import { Notification } from '@/lib/database/models/notification.model';
import { handleError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export interface CreateNotificationParams {
  userId: string;
  type: 'registration' | 'approval' | 'event_update' | 'reminder' | 'rating';
  title: string;
  message: string;
  data?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectToDatabase();

    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data
    });

    return JSON.parse(JSON.stringify(notification));
  } catch (error) {
    handleError(error);
  }
}

export async function getNotifications(userId: string, limit = 50) {
  try {
    await connectToDatabase();

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function getUnreadNotifications(userId: string) {
  try {
    await connectToDatabase();

    const notifications = await Notification.find({ 
      userId, 
      read: false 
    }).sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await connectToDatabase();

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    return JSON.parse(JSON.stringify(notification));
  } catch (error) {
    handleError(error);
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await connectToDatabase();

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    handleError(error);
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await connectToDatabase();

    await Notification.findByIdAndDelete(notificationId);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    handleError(error);
  }
}