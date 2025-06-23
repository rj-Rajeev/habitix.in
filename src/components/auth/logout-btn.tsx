'use client';

import { signOut } from 'next-auth/react';
import LogoutIcon from '@mui/icons-material/Logout';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
    >
      <LogoutIcon className="mr-2" fontSize="small" />
      Log Out
    </button>
  );
}
