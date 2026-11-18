import { logout } from '~/lib/session.server';
export const action = ({ request }: any) => logout(request);
export const loader = ({ request }: any) => logout(request);
