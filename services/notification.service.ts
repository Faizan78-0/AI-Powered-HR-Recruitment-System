// lib/notification.service.ts
// Call these helpers from any API route after an action completes.
// They create Notification docs which the UI polls/reads.

import mongoose from "mongoose";
import Notification, { NotificationType } from "@/modal/notification.modal";

interface CreateNotifInput {
  recipientId:   string | mongoose.Types.ObjectId;
  senderId?:     string | mongoose.Types.ObjectId;
  type:          NotificationType;
  title:         string;
  message:       string;
  link?:         string;
  meta?: {
    applicationId?: string;
    interviewId?:   string;
    jobId?:         string;
    chatId?:        string;
  };
}

export async function createNotification(input: CreateNotifInput) {
  try {
    return await Notification.create({
      recipientId: new mongoose.Types.ObjectId(input.recipientId.toString()),
      senderId:    input.senderId
        ? new mongoose.Types.ObjectId(input.senderId.toString())
        : null,
      type:    input.type,
      title:   input.title,
      message: input.message,
      link:    input.link    ?? null,
      meta:    input.meta    ?? {},
      isRead:  false,
    });
  } catch (err) {
    // Never throw — notifications are non-critical side effects
    console.error("[createNotification]", err);
    return null;
  }
}

// ── Convenience helpers ────────────────────────────────────────────────────────

/** Seeker applied → notify recruiter */
export async function notifyApplicationReceived(opts: {
  recruiterId:   string;
  seekerId:      string;
  seekerName:    string;
  jobTitle:      string;
  applicationId: string;
  jobId:         string;
}) {
  return createNotification({
    recipientId: opts.recruiterId,
    senderId:    opts.seekerId,
    type:        "APPLICATION_RECEIVED",
    title:       "New Application Received",
    message:     `${opts.seekerName} applied for ${opts.jobTitle}`,
    link:        `/recruiter/candidates`,
    meta:        { applicationId: opts.applicationId, jobId: opts.jobId },
  });
}

/** Recruiter marks reviewing → notify seeker */
export async function notifyApplicationReviewing(opts: {
  seekerId:      string;
  recruiterId:   string;
  jobTitle:      string;
  company:       string;
  applicationId: string;
}) {
  return createNotification({
    recipientId: opts.seekerId,
    senderId:    opts.recruiterId,
    type:        "APPLICATION_REVIEWED",
    title:       "Application Under Review",
    message:     `Your application for ${opts.jobTitle} at ${opts.company} is being reviewed`,
    link:        `/jobseeker/applications`,
    meta:        { applicationId: opts.applicationId },
  });
}

/** Recruiter accepts → notify seeker */
export async function notifyApplicationAccepted(opts: {
  seekerId:      string;
  recruiterId:   string;
  jobTitle:      string;
  company:       string;
  applicationId: string;
}) {
  return createNotification({
    recipientId: opts.seekerId,
    senderId:    opts.recruiterId,
    type:        "APPLICATION_ACCEPTED",
    title:       "🎉 Application Accepted!",
    message:     `Congratulations! Your application for ${opts.jobTitle} at ${opts.company} has been accepted`,
    link:        `/jobseeker/applications`,
    meta:        { applicationId: opts.applicationId },
  });
}

/** Recruiter rejects → notify seeker */
export async function notifyApplicationRejected(opts: {
  seekerId:      string;
  recruiterId:   string;
  jobTitle:      string;
  company:       string;
  applicationId: string;
}) {
  return createNotification({
    recipientId: opts.seekerId,
    senderId:    opts.recruiterId,
    type:        "APPLICATION_REJECTED",
    title:       "Application Update",
    message:     `Your application for ${opts.jobTitle} at ${opts.company} was not selected`,
    link:        `/jobseeker/applications`,
    meta:        { applicationId: opts.applicationId },
  });
}

/** Interview scheduled → notify seeker */
export async function notifyInterviewScheduled(opts: {
  seekerId:      string;
  recruiterId:   string;
  jobTitle:      string;
  company:       string;
  scheduledAt:   Date;
  interviewType: string;
  interviewId:   string;
  applicationId: string;
  meetingLink?:  string;
}) {
  const dateStr = opts.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const timeStr = opts.scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
  return createNotification({
    recipientId: opts.seekerId,
    senderId:    opts.recruiterId,
    type:        "INTERVIEW_SCHEDULED",
    title:       "📅 Interview Scheduled",
    message:     `Your interview for ${opts.jobTitle} at ${opts.company} is scheduled on ${dateStr} at ${timeStr} (${opts.interviewType})`,
    link:        `/jobseeker/interviews`,
    meta:        { interviewId: opts.interviewId, applicationId: opts.applicationId },
  });
}

/** Interview rescheduled/cancelled → notify seeker */
export async function notifyInterviewUpdated(opts: {
  seekerId:    string;
  recruiterId: string;
  jobTitle:    string;
  status:      string;
  interviewId: string;
}) {
  const action = opts.status === "CANCELLED" ? "cancelled" : "rescheduled";
  return createNotification({
    recipientId: opts.seekerId,
    senderId:    opts.recruiterId,
    type:        "INTERVIEW_UPDATED",
    title:       `Interview ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message:     `Your interview for ${opts.jobTitle} has been ${action}`,
    link:        `/jobseeker/interviews`,
    meta:        { interviewId: opts.interviewId },
  });
}

/** New chat message → notify recipient */
export async function notifyMessageReceived(opts: {
  recipientId: string;
  senderId:    string;
  senderName:  string;
  preview:     string;
  chatId:      string;
  role:        "recruiter" | "jobseeker";
}) {
  return createNotification({
    recipientId: opts.recipientId,
    senderId:    opts.senderId,
    type:        "MESSAGE_RECEIVED",
    title:       `New message from ${opts.senderName}`,
    message:     opts.preview.length > 80 ? opts.preview.slice(0, 80) + "…" : opts.preview,
    link:        `/${opts.role}/chats?chatId=${opts.chatId}`,
    meta:        { chatId: opts.chatId },
  });
}

/** Seeker withdrew → notify recruiter */
export async function notifyApplicationWithdrawn(opts: {
  recruiterId:   string;
  seekerId:      string;
  seekerName:    string;
  jobTitle:      string;
  applicationId: string;
}) {
  return createNotification({
    recipientId: opts.recruiterId,
    senderId:    opts.seekerId,
    type:        "APPLICATION_WITHDRAWN",
    title:       "Application Withdrawn",
    message:     `${opts.seekerName} withdrew their application for ${opts.jobTitle}`,
    link:        `/recruiter/candidates`,
    meta:        { applicationId: opts.applicationId },
  });
}