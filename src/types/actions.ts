export type ActionSuccess<T = void> = T extends void
    ? { success: true }
    : { success: true; data: T };

export type ActionError = { success: false; error: string };
export type ActionResponse<T = void> = ActionSuccess<T> | ActionError;

// Helper
export const actionError = (msg: string): ActionError => ({
    success: false, error: msg
});
export const actionSuccess = <T>(data?: T): ActionSuccess<T> => ({
    success: true, ...(data !== undefined && { data })
}) as ActionSuccess<T>;
