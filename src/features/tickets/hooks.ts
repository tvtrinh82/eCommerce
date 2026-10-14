import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketApi, TicketActionPayload } from "./api";

export const useTicketInbox = (params?: { status?: string; page?: number; size?: number }) => {
  return useQuery({
    queryKey: ["tickets", "inbox", params],
    queryFn: async () => {
      const res: any = await ticketApi.getInbox(params);
      return res?.data?.data || res?.data || res;
    },
  });
};

export const useApproveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: TicketActionPayload }) =>
      ticketApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useRejectTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { comment: string } }) =>
      ticketApi.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useReturnTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { comment: string } }) =>
      ticketApi.returnTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
