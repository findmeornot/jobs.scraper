import { create } from "zustand";
import { persist } from "zustand/middleware";
import dayjs from "dayjs";

interface ContentState {
  selectedDate: string;
  showPendingOnly: boolean;
  reviewerName: string;
}

interface ContentActions {
  setSelectedDate: (date: string) => void;
  setShowPendingOnly: (value: boolean) => void;
  setReviewerName: (name: string) => void;
}

export const useContentStore = create<ContentState & ContentActions>()(
  persist(
    (set) => ({
      selectedDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
      showPendingOnly: false,
      reviewerName: "",

      setSelectedDate: (date) => set({ selectedDate: date }),
      setShowPendingOnly: (value) => set({ showPendingOnly: value }),
      setReviewerName: (name) => set({ reviewerName: name }),
    }),
    {
      name: "content-store",
      partialize: (state) => ({ reviewerName: state.reviewerName }),
    },
  ),
);
