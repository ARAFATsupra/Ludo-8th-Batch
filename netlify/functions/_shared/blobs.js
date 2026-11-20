import { getStore } from '@netlify/blobs';

export function getRoomStore() {
  return getStore({
    name: 'ludo-rooms',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_TOKEN
  });
}

export async function getRoom(roomCode) {
  if (!roomCode) return null;
  try {
    return await getRoomStore().get(`room:${roomCode}`, { type: 'json' });
  } catch (err) {
    console.error('getRoom error:', err);
    return null;
  }
}

export async function setRoom(roomCode, room) {
  await getRoomStore().setJSON(`room:${roomCode}`, room);
  return room;
}

export async function deleteRoom(roomCode) {
  await getRoomStore().delete(`room:${roomCode}`);
}