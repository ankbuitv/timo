import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./api";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Không thử lại lỗi xác thực hoặc quyền – chúng sẽ không tự hết.
        retry: (count, error) => {
          if (
            error instanceof ApiRequestError &&
            [400, 401, 403, 404, 409, 422].includes(error.status)
          )
            return false;
          return count < 2;
        },
      },
    },
  });
}
