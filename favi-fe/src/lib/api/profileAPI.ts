import { fetchWrapper } from "../fetchWrapper";

export const profileAPI = {
    checkUsername: async (username: string) => {
        try {
            const res = await fetchWrapper.get<any>(
                `/profiles/check-username?username=${encodeURIComponent(username)}`
            );
            return { valid: true, message: res?.message ?? "Username hợp lệ và chưa được sử dụng." };
        } catch (err: any) {
            const code = err?.response?.data?.code ?? "USERNAME_INVALID_OR_TAKEN";
            const message =
                err?.response?.data?.message ?? "Username không hợp lệ hoặc đã được sử dụng.";
            return { valid: false, code, message };
        }
    },
}