import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import peersReducer from "./slices/peersSlice";
import chatReducer from "./slices/chatSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    peers: peersReducer,
    chat: chatReducer,
  },
});
