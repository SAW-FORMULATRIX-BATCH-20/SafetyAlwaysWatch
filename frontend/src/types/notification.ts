export type NotificationRecipientRole =
  | "Human Resources (HR)"
  | "Area Supervisor";

export type NotificationRecipientScope =
  | { type: "global" }
  | { type: "zone"; zoneId: string }
  | { type: "department"; departmentId: string };

export type NotificationRecipient = {
  id: string;
  name: string;
  role: NotificationRecipientRole;
  maskedChatId: string;
  scope: NotificationRecipientScope;
};

export type NotificationRecipientInput = {
  name: string;
  role: NotificationRecipientRole;
  chatId: string;
  scope: NotificationRecipientScope;
};

export type NotificationSimulationLog = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole: NotificationRecipientRole;
  deliveryStatus: "sent" | "failed";
  violationId: string;
  occurredAt: string;
};
