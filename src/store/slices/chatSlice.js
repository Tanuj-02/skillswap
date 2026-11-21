import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api"; 
import { mergeMessages, shouldApplyMessages } from "@/lib/chatMessages";

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/chats`, { params });
      return response.data.content || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data || "Failed to load chats");
    }
  }
);

export const postMessage = createAsyncThunk(
  "chat/postMessage",
  async ({ conversationId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/chats/${conversationId}/messages`, {
        content: content
      });
      return { conversationId, message: response.data };
    } catch (err) {
      return rejectWithValue(err?.response?.data || "Failed to send message");
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/chats/${conversationId}/messages`);
      return { conversationId, messages: response.data.content || [] };
    } catch (err) {
      return rejectWithValue(err?.response?.data || "Failed to load messages");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    messages: [],
    activeConversationId: null,
    status: "idle",
    error: null,
  },
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        if (!shouldApplyMessages(state.activeConversationId, action.payload.conversationId)) return;
        state.status = "succeeded";
        state.messages = mergeMessages(state.messages, action.payload.messages);
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        if (!shouldApplyMessages(state.activeConversationId, action.meta.arg)) return;
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(postMessage.fulfilled, (state, action) => {
        if (!shouldApplyMessages(state.activeConversationId, action.payload.conversationId)) return;
        state.messages = mergeMessages(state.messages, [action.payload.message]);
      });
  },
});

export const { setActiveConversation } = chatSlice.actions;
export default chatSlice.reducer;
