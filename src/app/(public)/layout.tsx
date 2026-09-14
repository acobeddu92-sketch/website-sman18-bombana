import React from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let schoolProfile = null;
  try {
    schoolProfile = await prisma.schoolProfile.findFirst({
      select: { logo: true, school_name: true },
    });
  } catch (err) {
    console.error('Error fetching school profile for public layout:', err);
  }

  const logo = schoolProfile?.logo || '/images/logo.svg';
  const schoolName = schoolProfile?.school_name || 'SMA NEGERI 18 BOMBANA';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar logo={logo} schoolName={schoolName} />
      <main className="flex-1 flex flex-col relative">{children}</main>
      <Footer logo={logo} schoolName={schoolName} />
    </div>
  );
}
