import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import type { RootState } from '../store/store';
import { baseApi } from '../store/api/baseApi';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(window.location.origin, { auth: { token }, path: '/socket.io' });

    socket.on('health:updated', ({ accountId }: { accountId: string }) => {
      dispatch(baseApi.util.invalidateTags([{ type: 'Health', id: accountId }, 'Dashboard']));
    });

    socket.on('alert:new', () => {
      dispatch(baseApi.util.invalidateTags(['Alert']));
    });

    socket.on('activity:created', () => {
      dispatch(baseApi.util.invalidateTags(['Activity', 'Dashboard']));
    });

    socket.on('meeting-note:processed', ({ accountId }: { accountId: string }) => {
      dispatch(baseApi.util.invalidateTags(['MeetingNote', 'Insight', { type: 'Health', id: accountId }]));
    });

    socket.on('meeting-note:created', () => {
      dispatch(baseApi.util.invalidateTags(['MeetingNote']));
    });

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [token, dispatch]);
}
