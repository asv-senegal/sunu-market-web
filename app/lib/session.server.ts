import { createCookieSessionStorage, redirect } from 'react-router';
import { SESSION_SECRET } from './env.server';

// Le jeton de l'API reste côté serveur, dans un cookie httpOnly signé
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__sunu', httpOnly: true, sameSite: 'lax', path: '/', secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30,
  },
});

export async function getToken(request: Request): Promise<string | null> {
  const s = await sessionStorage.getSession(request.headers.get('Cookie'));
  return s.get('token') || null;
}

export async function login(token: string, to = '/') {
  const s = await sessionStorage.getSession();
  s.set('token', token);
  return redirect(to, { headers: { 'Set-Cookie': await sessionStorage.commitSession(s) } });
}

export async function logout(request: Request) {
  const s = await sessionStorage.getSession(request.headers.get('Cookie'));
  return redirect('/', { headers: { 'Set-Cookie': await sessionStorage.destroySession(s) } });
}

export async function flash(request: Request, message: string) {
  const s = await sessionStorage.getSession(request.headers.get('Cookie'));
  s.flash('flash', message);
  return { 'Set-Cookie': await sessionStorage.commitSession(s) };
}
