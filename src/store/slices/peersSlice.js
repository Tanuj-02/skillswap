import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { discoverUsers } from "@/services/discoverService";
import { normalizeUser } from "@/services/userService";

export const fetchPeers = createAsyncThunk(
  "peers/fetchPeers",
  async (_, thunkAPI) => {
    try {
      const users = await discoverUsers();
      const currentUserId = thunkAPI.getState().user.currentUser?.id;
      const peers = Array.isArray(users)
        ? users
            .map((u) => normalizeUser(u))
            .filter((peer) => String(peer.id) !== String(currentUserId))
        : [];
      return peers;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const peersSlice = createSlice({
  name: "peers",
  initialState: {
    peers: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPeers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.peers = action.payload;
      })
      .addCase(fetchPeers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unable to load peers";
      });
  },
});

export default peersSlice.reducer;
